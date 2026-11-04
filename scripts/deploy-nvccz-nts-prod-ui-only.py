#!/usr/bin/env python3
"""Deploy ONLY the UI portals to NVCCZ production on the NTS server.

Why this exists alongside deploy-nvccz-nts-prod.py:

The full prod script always ships the API and the UI together and runs
`up -d --build` across every service. On 7 September 2026 that was unsafe —
the backend's committed HEAD carried Prisma models whose tables do not exist
in the production database yet (Timesheet, AccountingCloseTask, and the
JournalEntry columns forecastEntityId / isEliminationEntry all returned 0 rows
in information_schema). Shipping that API without first running the raw-SQL
migrations would have left those endpoints failing against a live client system.

The change that actually needed to reach production was frontend-only
(commit 1023f43, dark-mode text restoration), so this script closes that gap
without touching the API, the database, or the upload service.

It deliberately does NOT rewrite secrets/prod.env — credentials were rotated
on 7 September and must be preserved exactly.

Usage:
    python scripts/deploy-nvccz-nts-prod-ui-only.py
"""
from __future__ import annotations

import hashlib
import os
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

from _ssh_creds import SSH_PASSWORD, SSH_KEY

# Next.js prints "▲" in its build banner and Docker draws box characters. On
# Windows the default console encoding is cp1252, which cannot encode them —
# streaming the remote build output then dies with UnicodeEncodeError partway
# through, taking the SSH channel (and the running build) down with it.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("NVCCZ_UI_DEPLOY_HOST", "31.220.82.129")
PORT = int(os.environ.get("NVCCZ_UI_DEPLOY_PORT", "22"))
USER = os.environ.get("NVCCZ_UI_DEPLOY_USER", "root")
DEPLOY_PASSWORD = os.environ.get("NVCCZ_CLIENT_SSH_PASSWORD") or SSH_PASSWORD
REMOTE_ROOT = "/var/www/projects/nvccz"
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")

UI_SERVICES = os.environ.get("NVCCZ_UI_SERVICES", "ui-staff").split()

# Mirrors deploy-nvccz-nts-prod.py so the two stay comparable.
EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "coverage", ".next",
    ".next-staff", ".next-lp", ".next-investee", ".next-apply",
    ".cursor", ".claude", ".agents", ".kilo", ".vscode", ".yarn",
    "tmp-smoke-io-reports", "agent-transcripts", "design-refs", "docs",
    "dashboard-clone", "stock-price-module", "qa-explore", "backups",
    "tracking", "__pycache__", ".secrets",
}
EXCLUDE_PREFIXES = ("storage/local-upload-mock/", "tmp-")
EXCLUDE_NAMES = {".env", ".env.local", "tmp-report-placeholder-audit.json"}


def is_build_output_dir(name: str) -> bool:
    """Any Next.js build directory, however it is suffixed.

    Enumerating the known .next-* dirs lets a new one through silently; a local
    scratch build pushed the dev tarball past 330 MB mid-upload on 2026-09-07.
    """
    return name == ".next" or name.startswith(".next-")


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    if any(p in EXCLUDE_DIRS or is_build_output_dir(p) for p in parts):
        return True
    norm = rel.replace("\\", "/")
    if any(norm.startswith(p) for p in EXCLUDE_PREFIXES):
        return True
    return Path(rel).name in EXCLUDE_NAMES


def make_tarball(root: Path, prefix: str, out: Path) -> str:
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=root
    ).split(b"\0")
    with tarfile.open(out, mode="w:gz") as tar:
        for encoded_rel in tracked:
            if not encoded_rel:
                continue
            rel = os.fsdecode(encoded_rel)
            full = root / rel
            if skip(rel) or not full.is_file():
                continue
            tar.add(full, arcname=f"{prefix}/{rel.replace(chr(92), '/')}")
    h = hashlib.sha256()
    with open(out, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


REMOTE_SH = r"""
set -euo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
echo '=== verify checksum ==='
echo "__UI_SHA__  /tmp/nvccz-ui-only.tgz" | sha256sum -c -
echo '=== snapshot current UI images for rollback ==='
for s in __SERVICES__; do
  docker image inspect "nvccz-prod-$s" >/dev/null 2>&1 \
    && docker tag "nvccz-prod-$s" "nvccz-prod-$s:pre-uionly-20260907" || true
done
echo '=== extract UI only (API and secrets untouched) ==='
rm -rf src/ui
mkdir -p src
tar -xzf /tmp/nvccz-ui-only.tgz -C src
test -f src/ui/package.json
test -f src/ui/Dockerfile
echo '=== sync prod compose from the UI package if present ==='
if [ -f src/ui/deploy/nvccz/docker-compose.prod.yml ]; then
  cp -f src/ui/deploy/nvccz/docker-compose.prod.yml compose/docker-compose.prod.yml
  echo 'synced compose/docker-compose.prod.yml'
fi
echo '=== rebuild UI services only ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml \
  build __SERVICES__
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml \
  up -d --no-build --no-deps __SERVICES__
echo '=== status ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps
echo NVCCZ_PROD_UI_ONLY_DONE
"""


def main() -> int:
    print(f"Packing UI from {UI_ROOT} ...")
    with tempfile.TemporaryDirectory() as td:
        ui_tgz = Path(td) / "nvccz-ui-only.tgz"
        sha = make_tarball(UI_ROOT, "ui", ui_tgz)
        size_mb = ui_tgz.stat().st_size / 1e6
        print(f"  {size_mb:.1f} MB  sha256={sha[:16]}...")

        def connect() -> paramiko.SSHClient:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                client.connect(HOST, port=PORT, username=USER, key_filename=SSH_KEY,
                               timeout=60, banner_timeout=60)
                return client
            except Exception:
                client.close()
                client = paramiko.SSHClient()
                client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                client.connect(HOST, port=PORT, username=USER, password=DEPLOY_PASSWORD,
                               timeout=60, banner_timeout=60,
                               look_for_keys=False, allow_agent=False)
                return client

        cli = connect()
        print("  connected")

        print("Uploading ...")
        remote_part = f"/tmp/nvccz-ui-only.{sha[:16]}.part"
        for attempt in (1, 2, 3):
            try:
                sftp = cli.open_sftp()
                sftp.put(str(ui_tgz), remote_part)
                sftp.close()
                _, verify_out, _ = cli.exec_command(f"sha256sum {remote_part} | awk '{{print $1}}'")
                remote_sha = verify_out.read().decode().strip()
                if remote_sha != sha:
                    raise RuntimeError(f"remote checksum mismatch: {remote_sha[:16]}...")
                cli.exec_command(
                    f"mv -f {remote_part} /tmp/nvccz-ui-only.tgz"
                )[1].channel.recv_exit_status()
                print(f"  upload ok (attempt {attempt})")
                break
            except Exception as exc:  # the transport drops mid-transfer sometimes
                print(f"  upload attempt {attempt} failed: {exc}")
                if attempt == 3:
                    cli.close()
                    return 1
                cli.close()
                cli = connect()

        script = (REMOTE_SH
                  .replace("__UI_SHA__", sha)
                  .replace("__SERVICES__", " ".join(UI_SERVICES)))

        # Run the build DETACHED and poll its log, rather than streaming it over
        # the live channel. A dropped connection or a crash in this client then
        # cannot kill a build that is already running on the server — which is
        # what happened twice on 7 September 2026 (an SFTP EOFError and a
        # UnicodeEncodeError, each leaving a half-finished deploy behind).
        import base64 as _b64, time as _time
        blob = _b64.b64encode(script.encode()).decode()
        remote_state = "/home/user/.uionly"
        cli.exec_command(f"rm -f {remote_state}.b64 {remote_state}.log {remote_state}.pid")[1].channel.recv_exit_status()
        for i in range(0, len(blob), 3000):
            cli.exec_command(f"printf %s {blob[i:i+3000]} >> {remote_state}.b64")[1].channel.recv_exit_status()
        cli.exec_command(
            f"base64 -d {remote_state}.b64 > {remote_state}.sh && "
            f"setsid nohup bash {remote_state}.sh > {remote_state}.log 2>&1 < /dev/null & "
            f"echo $! > {remote_state}.pid"
        )[1].channel.recv_exit_status()

        print("Rebuilding UI services on the server (detached; polling) ...")
        seen = 0
        deadline = _time.time() + 3600
        while _time.time() < deadline:
            _, out, _ = cli.exec_command(f"cat {remote_state}.log 2>/dev/null")
            log = out.read().decode(errors="replace")
            if len(log) > seen:
                sys.stdout.write(log[seen:])
                sys.stdout.flush()
                seen = len(log)
            if "NVCCZ_PROD_UI_ONLY_DONE" in log:
                cli.close()
                print("exit=0")
                return 0
            _, out, _ = cli.exec_command(
                f"test -s {remote_state}.pid && "
                f"kill -0 $(cat {remote_state}.pid) 2>/dev/null && echo RUNNING || echo GONE"
            )
            if out.read().decode().strip() == "GONE" and "NVCCZ_PROD_UI_ONLY_DONE" not in log:
                cli.close()
                print("exit=1 (remote script ended without the completion marker)")
                return 1
            _time.sleep(10)
        cli.close()
        print("exit=1 (timed out)")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
