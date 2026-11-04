#!/usr/bin/env python3
"""Refresh production browser/API host settings and restart scoped services."""
from __future__ import annotations

import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("deploy_nvccz", HERE / "deploy-nvccz-docker-vps.py")
assert spec and spec.loader
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


def main() -> int:
    if hasattr(__import__("sys").stdout, "reconfigure"):
        __import__("sys").stdout.reconfigure(encoding="utf-8", errors="replace")
    client = deploy.connect_with_retry(max_attempts=3, delay=10)
    sftp = client.open_sftp()
    try:
        existing = deploy.read_remote_env(sftp, f"{deploy.REMOTE_ROOT}/secrets/prod.env") or {}
        required = ("MYSQL_ROOT_PASSWORD", "MYSQL_PASSWORD", "JWT_SECRET", "BOOTSTRAP_ADMIN_PASSWORD")
        missing = [key for key in required if not existing.get(key)]
        if missing:
            raise RuntimeError(f"production env is missing required preserved keys: {', '.join(missing)}")
        env = deploy.env_blob("prod", existing["MYSQL_ROOT_PASSWORD"], existing["MYSQL_PASSWORD"], existing["JWT_SECRET"], existing["BOOTSTRAP_ADMIN_PASSWORD"])
        with sftp.file(f"{deploy.REMOTE_ROOT}/secrets/prod.env", "w") as f:
            f.write(env)
        sftp.chmod(f"{deploy.REMOTE_ROOT}/secrets/prod.env", 0o600)
    finally:
        sftp.close()
    command = r'''set -euo pipefail
cd /var/www/projects/nvccz
docker network inspect lms_lms-network >/dev/null 2>&1 || docker network create lms_lms-network >/dev/null
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --no-build api upload
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build --no-deps ui-staff >/tmp/nvccz-ui-staff-rebuild.log 2>&1
tail -80 /tmp/nvccz-ui-staff-rebuild.log
sleep 3
curl -fsS http://127.0.0.1:3209/health
curl -fsS http://127.0.0.1:3250/health
curl -fsSI http://127.0.0.1:3200/ | head -3
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps api upload ui-staff
'''
    stdin, stdout, stderr = client.exec_command(command, timeout=300)
    print(stdout.read().decode("utf-8", errors="replace"), end="")
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, end="")
    return stdout.channel.recv_exit_status()


if __name__ == "__main__":
    raise SystemExit(main())
