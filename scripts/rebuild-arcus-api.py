#!/usr/bin/env python3
"""Upload fixed API entrypoint bits and rebuild API containers only."""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = "Debgjnk4@!z"
API = Path(r"C:\Users\lysp\Downloads\nvccz")

CMD = r"""
set -euo pipefail
# ensure LF on server copy regardless
sed -i 's/\r$//' /var/www/projects/arcus/src/api/deploy/docker-entrypoint.sh
chmod +x /var/www/projects/arcus/src/api/deploy/docker-entrypoint.sh
cd /var/www/projects/arcus
echo '=== rebuild DEV api ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build api
echo '=== rebuild DEMO api ==='
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml up -d --build api
sleep 15
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo '=== DEV logs ==='
docker logs arcus-dev-api-1 --tail 40 2>&1 || true
echo '=== DEMO logs ==='
docker logs arcus-demo-api-1 --tail 40 2>&1 || true
echo API_REBUILD_DONE
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
    sftp = c.open_sftp()
    # write as binary LF
    entry = (API / "deploy" / "docker-entrypoint.sh").read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    with sftp.file("/var/www/projects/arcus/src/api/deploy/docker-entrypoint.sh", "w") as f:
        f.write(entry)
    with sftp.file("/var/www/projects/arcus/src/api/deploy/ensure-admin.js", "w") as f:
        f.write((API / "deploy" / "ensure-admin.js").read_text(encoding="utf-8").replace("\r\n", "\n"))
    with sftp.file("/var/www/projects/arcus/src/api/Dockerfile", "w") as f:
        f.write((API / "Dockerfile").read_text(encoding="utf-8").replace("\r\n", "\n"))
    sftp.chmod("/var/www/projects/arcus/src/api/deploy/docker-entrypoint.sh", 0o755)
    sftp.close()
    stdin, stdout, stderr = c.exec_command(CMD, timeout=1800, get_pty=True)
    for line in stdout:
        print(line, end="", flush=True)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    c.close()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
