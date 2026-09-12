#!/usr/bin/env python3
"""Deploy Arcus upload sidecar + wire API env; smoke-test dev + demo storage."""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
REMOTE_ROOT = "/var/www/projects/arcus"
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
COMPOSE_DIR = UI_ROOT / "deploy" / "arcus"
UPLOAD_DIR = COMPOSE_DIR / "upload-service"

REMOTE_SH = r"""
set -euo pipefail
ROOT=/var/www/projects/arcus
cd "$ROOT"
echo '=== compose up DEV upload + api ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build upload api
echo '=== compose up DEMO upload + api ==='
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml up -d --build upload api
echo '=== wait for health ==='
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:3050/health >/dev/null 2>&1 && break
  sleep 2
done
curl -fsS http://127.0.0.1:3050/health
curl -fsS http://127.0.0.1:3051/health
echo '=== storage smoke dev ==='
tmp=/tmp/arcus-storage-test.txt
echo "arcus-storage-test-$(date +%s)" > "$tmp"
code=$(curl -sS -o /tmp/arcus-upload-resp.json -w '%{http_code}' \
  -F "type=temp" -F "images=@${tmp}" http://127.0.0.1:3050/upload)
echo "dev upload HTTP $code"
test "$code" = "200"
rel=$(python3 - <<'PY'
import json
d=json.load(open("/tmp/arcus-upload-resp.json"))
url=d["files"][0]["url"]
print(url.split("/uploads/",1)[-1])
PY
)
echo "relative path: $rel"
curl -fsSI "http://127.0.0.1:3050/uploads/${rel}" | head -3
curl -fsSI "https://dev-api.arcus.co.zw/api/public-media/${rel}" | head -3
echo '=== storage smoke demo ==='
code=$(curl -sS -o /tmp/arcus-demo-upload-resp.json -w '%{http_code}' \
  -F "type=temp" -F "images=@${tmp}" http://127.0.0.1:3051/upload)
echo "demo upload HTTP $code"
test "$code" = "200"
rel=$(python3 - <<'PY'
import json
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env
d=json.load(open("/tmp/arcus-demo-upload-resp.json"))
url=d["files"][0]["url"]
print(url.split("/uploads/",1)[-1])
PY
)
curl -fsSI "http://127.0.0.1:3051/uploads/${rel}" | head -3
curl -fsSI "https://demo-api.arcus.co.zw/api/public-media/${rel}" | head -3
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps upload api
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml ps upload api
echo ARCUS_STORAGE_OK
"""


def put_tree(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    try:
        sftp.mkdir(remote)
    except OSError:
        pass
    for item in local.iterdir():
        rpath = f"{remote}/{item.name}"
        if item.is_dir():
            put_tree(sftp, item, rpath)
        else:
            sftp.put(str(item), rpath)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting {HOST}...", flush=True)
    client.connect(
        HOST,
        port=22,
        username=USER,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )
    sftp = client.open_sftp()
    for d in (f"{REMOTE_ROOT}/compose", f"{REMOTE_ROOT}/upload-service"):
        try:
            sftp.mkdir(d)
        except OSError:
            pass

    print("Uploading compose + upload-service...", flush=True)
    sftp.put(str(COMPOSE_DIR / "docker-compose.dev.yml"), f"{REMOTE_ROOT}/compose/docker-compose.dev.yml")
    sftp.put(str(COMPOSE_DIR / "docker-compose.demo.yml"), f"{REMOTE_ROOT}/compose/docker-compose.demo.yml")
    put_tree(sftp, UPLOAD_DIR, f"{REMOTE_ROOT}/upload-service")

    with sftp.file("/tmp/arcus-storage-up.sh", "w") as f:
        f.write(REMOTE_SH)
    sftp.chmod("/tmp/arcus-storage-up.sh", 0o755)
    sftp.close()

    print("Building upload services and running smoke tests...", flush=True)
    stdin, stdout, stderr = client.exec_command("bash /tmp/arcus-storage-up.sh", timeout=1800, get_pty=True)
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
