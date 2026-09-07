#!/usr/bin/env python3
"""Seed LP + investee portal test users on Arcus DEV API container."""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
API_CONTAINER = "arcus-dev-api-1"
LOCAL_SCRIPT = Path(r"C:\Users\lysp\Downloads\nvccz\scripts\seed-portal-test-users.ts")
REMOTE_TMP = "/tmp/seed-portal-test-users.ts"

REMOTE_SH = f"""
set -euo pipefail
docker cp {REMOTE_TMP} {API_CONTAINER}:/app/scripts/seed-portal-test-users.ts
docker exec -e UAT_ALLOW_NON_DEV_DB=1 {API_CONTAINER} npx ts-node --transpile-only -r dotenv/config scripts/seed-portal-test-users.ts
docker exec -e UAT_ALLOW_NON_DEV_DB=1 {API_CONTAINER} npm run db:seed:lp-portal-srd
echo SEED_PORTAL_USERS_DONE
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    if not LOCAL_SCRIPT.is_file():
        print(f"Missing {LOCAL_SCRIPT}", file=sys.stderr)
        return 1

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
    print("Uploading seed script...", flush=True)
    sftp.put(str(LOCAL_SCRIPT), REMOTE_TMP)
    sftp.close()

    print("Running seeds in API container...", flush=True)
    stdin, stdout, stderr = client.exec_command(REMOTE_SH, timeout=600, get_pty=True)
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
