#!/usr/bin/env python3
"""Deploy ONLY the API to NVCCZ production, migrating before the swap.

Ordering is the whole point of this script.

The backend's HEAD carries Prisma models whose tables do not exist in the
production database yet (Timesheet, AccountingCloseTask,
journal_entries.is_elimination_entry). Deploying that API first would leave
those endpoints failing against a live client system until migrations caught
up. Running migrations first is impossible with the *old* image, because it
does not contain the newer migration scripts — prod had 128 of them where dev
had 134.

So the sequence here is:

  1. upload the API source and BUILD the new image (running container untouched)
  2. run db:migrate:all from a THROWAWAY container off that new image, pointed
     at the production database
  3. only if migrations pass, swap the running API to the new image
  4. health-check

If step 2 fails, production is still serving the old API against the old
schema — a consistent, working pair — and nothing has been swapped.

Take a database backup before running this.

Usage:
    python scripts/deploy-nvccz-nts-prod-api-only.py
    python scripts/deploy-nvccz-nts-prod-api-only.py --migrate-only
"""
from __future__ import annotations

import base64
import hashlib
import os
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

from _ssh_creds import SSH_PASSWORD, SSH_KEY

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "31.220.82.129"
USER = "root"
REMOTE_ROOT = "/var/www/projects/nvccz"
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")

EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "coverage", ".next", "logs",
    ".cursor", ".claude", ".agents", ".kilo", ".vscode", ".yarn",
    "backups", "docs", "__pycache__", ".secrets", "agent-transcripts",
}
EXCLUDE_PREFIXES = ("storage/local-upload-mock/", "tmp-")
EXCLUDE_NAMES = {".env", ".env.local"}


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    norm = rel.replace("\\", "/")
    if any(norm.startswith(p) for p in EXCLUDE_PREFIXES):
        return True
    if Path(rel).name in EXCLUDE_NAMES:
        return True
    return Path(rel).suffix in {".log", ".bak"}


def make_tarball(root: Path, prefix: str, out: Path) -> str:
    with tarfile.open(out, mode="w:gz") as tar:
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                full = Path(dirpath) / f
                rel = str(full.relative_to(root))
                if skip(rel):
                    continue
                tar.add(full, arcname=f"{prefix}/{rel.replace(chr(92), '/')}")
    h = hashlib.sha256()
    with open(out, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


REMOTE_SH = r"""
set -uo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"

if [ "__MIGRATE_ONLY__" != "1" ]; then
  echo "=== verify checksum ==="
  echo "__API_SHA__  /tmp/nvccz-api-only.tgz" | sha256sum -c - || exit 1
  echo "=== snapshot the running API image for rollback ==="
  docker image inspect nvccz-prod-api >/dev/null 2>&1 \
    && docker tag nvccz-prod-api nvccz-prod-api:pre-apionly-20260907 || true
  echo "=== extract API source (UI, secrets, database untouched) ==="
  rm -rf src/api
  mkdir -p src
  tar -xzf /tmp/nvccz-api-only.tgz -C src
  test -f src/api/package.json || { echo "extract failed"; exit 1; }
  echo "=== BUILD the new image (running container still serving) ==="
  DOCKER_BUILDKIT=1 $COMPOSE build api || { echo "BUILD_FAILED"; exit 1; }
fi

echo "=== MIGRATE production using the NEW image, in a throwaway container ==="
# Take the network from the MySQL container, not the API container. The API is
# attached to both nvccz-prod_default and lms_lms-network, and picking its first
# network landed the migration container on lms_lms-network where the "mysql"
# alias does not resolve — it then sat in the entrypoint's connect loop until
# "database not ready after 120s".
NET=$(docker inspect nvccz-prod-mysql-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
DBURL=$($COMPOSE config 2>/dev/null | grep -m1 -oE 'DATABASE_URL: [^ ]+' | cut -d' ' -f2-)
echo "  network=$NET"
echo "  db=$(echo "$DBURL" | sed -E 's|://([^:]+):[^@]+@|://\1:<pw>@|')"
IMG=$($COMPOSE images -q api 2>/dev/null | head -1)
[ -z "$IMG" ] && IMG=nvccz-prod-api
echo "  image=$IMG"

# secrets/prod.env is passed in full, not just DATABASE_URL. Some migrations
# read other settings — run-migrate-remote-media-urls.ts refuses to run without
# one of REMOTE_MEDIA_BASE_URL / BASE_URL / FRONTEND_URL / API_PUBLIC_BASE_URL,
# because it rewrites stored media URLs and will not guess the target host.
# The real API container gets these via env_file; a bare `docker run` does not.
docker run --rm --network "$NET" \
  --env-file "$ROOT/secrets/prod.env" \
  -e DATABASE_URL="$DBURL" -e UAT_ALLOW_NON_DEV_DB=1 \
  "$IMG" npm run db:migrate:all
MIG=$?
echo "MIGRATE_EXIT=$MIG"
if [ "$MIG" != "0" ]; then
  echo "MIGRATIONS_FAILED - NOT swapping the API. Production still serves the old image."
  echo "NVCCZ_PROD_API_ONLY_DONE"
  exit 1
fi

if [ "__MIGRATE_ONLY__" = "1" ]; then
  echo "migrate-only requested; not swapping"
  echo "NVCCZ_PROD_API_ONLY_DONE"
  exit 0
fi

echo "=== swap the API now that the schema is ready ==="
$COMPOSE up -d api
sleep 30
$COMPOSE ps api
echo "=== health ==="
curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1 && echo ' PROD_API_OK' || echo ' PROD_API_FAIL'
docker logs --tail 8 nvccz-prod-api-1 2>&1 | tail -8
echo "NVCCZ_PROD_API_ONLY_DONE"
"""


def connect() -> paramiko.SSHClient:
    cli = paramiko.SSHClient()
    cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        cli.connect(HOST, username=USER, key_filename=SSH_KEY, timeout=60, banner_timeout=60)
    except Exception:
        cli.connect(HOST, username=USER, password=SSH_PASSWORD, timeout=60,
                    banner_timeout=60, look_for_keys=False, allow_agent=False)
    return cli


def main() -> int:
    migrate_only = "--migrate-only" in sys.argv
    cli = connect()
    sha = ""

    if not migrate_only:
        with tempfile.TemporaryDirectory() as td:
            tgz = Path(td) / "nvccz-api-only.tgz"
            print(f"Packing API from {API_ROOT} ...")
            sha = make_tarball(API_ROOT, "api", tgz)
            print(f"  {tgz.stat().st_size/1e6:.1f} MB  sha256={sha[:16]}...")
            print("Uploading ...")
            for attempt in (1, 2, 3):
                try:
                    sftp = cli.open_sftp()
                    sftp.put(str(tgz), "/tmp/nvccz-api-only.tgz")
                    sftp.close()
                    print(f"  upload ok (attempt {attempt})")
                    break
                except Exception as exc:
                    print(f"  upload attempt {attempt} failed: {exc}")
                    if attempt == 3:
                        cli.close()
                        return 1
                    cli.close()
                    cli = connect()

    script = (REMOTE_SH
              .replace("__API_SHA__", sha)
              .replace("__MIGRATE_ONLY__", "1" if migrate_only else "0"))

    # Detached + polled: a dropped connection must not kill a migration midway.
    blob = base64.b64encode(script.encode()).decode()
    cli.exec_command("rm -f /root/.apionly.b64 /root/.apionly.log")[1].channel.recv_exit_status()
    for i in range(0, len(blob), 3000):
        cli.exec_command(f"printf %s {blob[i:i+3000]} >> /root/.apionly.b64")[1].channel.recv_exit_status()
    cli.exec_command(
        "base64 -d /root/.apionly.b64 > /root/.apionly.sh && "
        "setsid nohup bash /root/.apionly.sh > /root/.apionly.log 2>&1 < /dev/null & disown"
    )[1].channel.recv_exit_status()

    print("Running on server (detached; polling) ...")
    seen = 0
    deadline = time.time() + 5400
    while time.time() < deadline:
        _, out, _ = cli.exec_command("cat /root/.apionly.log 2>/dev/null")
        log = out.read().decode(errors="replace")
        if len(log) > seen:
            sys.stdout.write(log[seen:])
            sys.stdout.flush()
            seen = len(log)
        if "NVCCZ_PROD_API_ONLY_DONE" in log:
            cli.close()
            return 0 if "MIGRATE_EXIT=0" in log and "MIGRATIONS_FAILED" not in log else 1
        _, out, _ = cli.exec_command("pgrep -f '/root/.apionly.sh' >/dev/null && echo RUNNING || echo GONE")
        if out.read().decode().strip() == "GONE":
            cli.close()
            print("remote script ended without the completion marker")
            return 1
        time.sleep(10)
    cli.close()
    print("timed out")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
