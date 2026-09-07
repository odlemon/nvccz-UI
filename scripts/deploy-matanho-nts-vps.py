#!/usr/bin/env python3
"""Pack Matanho site, upload to NTS VPS, docker compose up on :3130."""
from __future__ import annotations

import hashlib
import os
import secrets
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
LOCAL_ROOT = Path(r"C:\Users\lysp\Documents\Matanho")
REMOTE_ROOT = "/var/www/projects/matanho"
HOST_PORT = "3130"
SITE_URL = f"http://{HOST}:{HOST_PORT}"

EXCLUDE_DIRS = {"node_modules", ".git", ".next", ".vercel", "out", "src/generated"}
EXCLUDE_NAMES = {".env", ".env.local"}


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    if Path(rel).name in EXCLUDE_NAMES:
        return True
    if Path(rel).name.startswith(".env.") and Path(rel).name.endswith(".local"):
        return True
    return False


def make_tarball(root: Path, out_path: Path) -> str:
    with tarfile.open(out_path, mode="w:gz") as tar:
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            for name in files:
                full = Path(dirpath) / name
                rel = str(full.relative_to(root))
                if skip(rel):
                    continue
                tar.add(full, arcname=rel.replace("\\", "/"))
    h = hashlib.sha256()
    with open(out_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    pg_pw = secrets.token_urlsafe(24)
    session = secrets.token_urlsafe(48)
    bootstrap = secrets.token_urlsafe(32)
    analytics = secrets.token_urlsafe(32)
    cron = secrets.token_urlsafe(32)

    env_body = f"""MATANHO_HOST_PORT={HOST_PORT}
NEXT_PUBLIC_SITE_URL={SITE_URL}
POSTGRES_PASSWORD={pg_pw}
SESSION_SECRET={session}
ADMIN_BOOTSTRAP_SECRET={bootstrap}
ANALYTICS_SALT={analytics}
ANALYTICS_RETENTION_DAYS=180
CRON_SECRET={cron}
BLOB_READ_WRITE_TOKEN=
"""

    remote_sh = f"""
set -euo pipefail
ROOT={REMOTE_ROOT}
mkdir -p "$ROOT"
cd "$ROOT"
echo '=== verify checksum ==='
echo "$APP_SHA  /tmp/matanho-app.tgz" | sha256sum -c -
echo '=== extract ==='
tar -xzf /tmp/matanho-app.tgz -C "$ROOT"
test -f "$ROOT/package.json"
test -f "$ROOT/Dockerfile"
test -f "$ROOT/docker-compose.yml"
# keep existing .env if present; otherwise write fresh
if [ ! -f "$ROOT/.env" ]; then
  cp /tmp/matanho.env "$ROOT/.env"
  echo 'Wrote new .env'
else
  echo 'Keeping existing .env'
fi
# ensure compose can read env
set -a
. "$ROOT/.env"
set +a
echo '=== docker compose build/up ==='
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
echo '=== smoke ==='
sleep 3
curl -fsS -o /dev/null -w 'health:%{{http_code}}\\n' http://127.0.0.1:{HOST_PORT}/api/health || true
curl -fsS -o /dev/null -w 'home:%{{http_code}}\\n' http://127.0.0.1:{HOST_PORT}/ || true
echo MATANHO_DEPLOY_DONE
echo "URL={SITE_URL}"
echo "ADMIN_SETUP={SITE_URL}/admin/setup"
grep -E '^(ADMIN_BOOTSTRAP_SECRET|NEXT_PUBLIC_SITE_URL)=' "$ROOT/.env" || true
"""

    with tempfile.TemporaryDirectory() as tmp:
        tgz = Path(tmp) / "matanho-app.tgz"
        print("Packing Matanho...", flush=True)
        sha = make_tarball(LOCAL_ROOT, tgz)
        print(f"  {tgz.stat().st_size/1024/1024:.1f} MB sha={sha[:12]}", flush=True)

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting {HOST}...", flush=True)
        client.connect(HOST, 22, USER, PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
        sftp = client.open_sftp()
        for remote in ("/tmp/matanho-app.tgz", "/tmp/matanho.env", "/tmp/matanho-up.sh"):
            try:
                sftp.remove(remote)
            except OSError:
                pass
        print("Uploading...", flush=True)
        sftp.put(str(tgz), "/tmp/matanho-app.tgz")
        with sftp.file("/tmp/matanho.env", "w") as f:
            f.write(env_body)
        with sftp.file("/tmp/matanho-up.sh", "w") as f:
            f.write(f"export APP_SHA={sha}\n" + remote_sh)
        sftp.chmod("/tmp/matanho-up.sh", 0o755)
        sftp.close()

        print("Building on VPS (this takes a while)...", flush=True)
        stdin, stdout, stderr = client.exec_command("bash /tmp/matanho-up.sh", timeout=3600, get_pty=True)
        for line in stdout:
            print(line, end="", flush=True)
        err = stderr.read().decode("utf-8", errors="replace")
        if err.strip():
            print(err, file=sys.stderr)
        code = stdout.channel.recv_exit_status()
        client.close()
        return code


if __name__ == "__main__":
    raise SystemExit(main())
