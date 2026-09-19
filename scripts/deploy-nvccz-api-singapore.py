#!/usr/bin/env python3
"""Deploy nvccz backend (+ relink UI) to the Singapore VPS via server-side git pull.

Per CLAUDE.md's "Deployment policy — no direct file transfer, ever": this script never
uploads code from this machine. Push your branch to GitHub first (`git push`), then run
this — the VPS clones/pulls the API and UI directly from GitHub over SSH, builds with its
own npm/CPU, and restarts under pm2.

ONE-TIME SETUP REQUIRED before this script can run (not done by this script):
  1. Generate a deploy keypair and add the PUBLIC key as a read-only Deploy Key on both
     https://github.com/odlemon/nvccz and https://github.com/odlemon/nvccz-UI.
  2. Put the PRIVATE key on the VPS and add a `Host github.com-sg` alias in
     /root/.ssh/config using that key.
  3. Set SINGAPORE_VPS_PASSWORD in .secrets/ssh.env (see _ssh_creds.py) — this replaces
     the plaintext SSH password that used to be hard-coded in this file.
  4. This script no longer bakes a JWT secret / DB password into the deploy — on first
     run it generates and writes APP_DIR/.env once and never touches it again on later
     runs (the old version overwrote .env, including a hard-coded-looking JWT_SECRET and
     DB password, on every single deploy). If APP_DIR/.env already exists on the server
     from before this rewrite, leave it — its real values are already in place.

Usage:
  python scripts/deploy-nvccz-api-singapore.py --branch master
"""
from __future__ import annotations

import argparse
import secrets
import sys

import paramiko
import _ssh_creds

HOST = "207.180.234.151"
USER = "root"
PASSWORD = _ssh_creds.require(_ssh_creds.SINGAPORE_VPS_PASSWORD, "SINGAPORE_VPS_PASSWORD", "SINGAPORE_VPS_PASSWORD")
APP_DIR = "/var/www/nvccz-api"
APP_PORT = 3009
UI_DIR = "/var/www/nvccz-ui"
UI_PORT = 3006
NGINX_PORT = 8080

API_REPO_URL = "git@github.com-sg:odlemon/nvccz.git"
UI_REPO_URL = "git@github.com-sg:odlemon/nvccz-UI.git"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 1800) -> str:
    print(f"\n$ {cmd}", flush=True)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out)
    if err.strip():
        print(err, file=sys.stderr)
    if code != 0:
        raise SystemExit(f"remote command failed (exit {code}): {cmd}")
    return out


def ensure_repo(client: paramiko.SSHClient, path: str, repo_url: str, branch: str) -> None:
    check = client.exec_command(f"test -d {path}/.git && echo YES || echo NO")[1].read().decode().strip()
    if check == "YES":
        run(client, f"cd {path} && git fetch origin {branch} && git reset --hard origin/{branch} && git clean -fdx")
    else:
        run(client, f"mkdir -p $(dirname {path}) && rm -rf {path} && git clone --branch {branch} --single-branch {repo_url} {path}")
    sha = run(client, f"cd {path} && git rev-parse --short HEAD").strip()
    print(f"{path} now at {sha} ({branch})")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    p = argparse.ArgumentParser()
    p.add_argument("--branch", default="master")
    args = p.parse_args()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...", flush=True)
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print("Verifying GitHub deploy-key access from the VPS (see module docstring if this fails)...")
    run(client, "ssh -T git@github.com-sg -o StrictHostKeyChecking=no 2>&1 | grep -qi 'successfully authenticated' "
                "&& echo GITHUB_AUTH_OK || (echo GITHUB_AUTH_FAILED; exit 1)")

    ensure_repo(client, APP_DIR, API_REPO_URL, args.branch)
    ensure_repo(client, UI_DIR, UI_REPO_URL, args.branch)

    has_env = client.exec_command(f"test -f {APP_DIR}/.env && echo YES || echo NO")[1].read().decode().strip()
    if has_env != "YES":
        print(f"No {APP_DIR}/.env found — writing one with freshly generated secrets (first deploy only).")
        jwt_secret = secrets.token_hex(32)
        db_password = secrets.token_urlsafe(24)
        env_content = f"""DATABASE_URL="mysql://nts_user:{db_password}@127.0.0.1:3306/nts?ssl-mode=DISABLED"
JWT_SECRET="{jwt_secret}"
PORT={APP_PORT}
NODE_ENV=production
CORS_ORIGINS="http://localhost:3001,http://127.0.0.1:3001,http://{HOST}:{NGINX_PORT},http://{HOST}:{UI_PORT}"
BASE_URL="http://{HOST}:{APP_PORT}/api"
FRONTEND_URL="http://{HOST}:{NGINX_PORT}"
API_URL="http://{HOST}:{APP_PORT}/api"
COMPANY_NAME_FULL="Niakazi"
COMPANY_NAME_SHORT="Niakazi"
BROKER_REPLY_BASE_URL="http://{HOST}:{NGINX_PORT}"
"""
        sftp = client.open_sftp()
        with sftp.file(f"{APP_DIR}/.env", "w") as f:
            f.write(env_content)
        sftp.chmod(f"{APP_DIR}/.env", 0o600)
        sftp.close()
        print(
            f"IMPORTANT: also set the MySQL 'nts_user' password to match the DATABASE_URL "
            f"just written ({db_password}) — this script does not touch MySQL user grants."
        )
    else:
        print(f"{APP_DIR}/.env already exists — leaving it untouched.")

    run(client, f"ufw allow {APP_PORT}/tcp comment 'nvccz-api' || true")

    print("\n=== API: install + build ===")
    run(client, f"cd {APP_DIR} && NODE_OPTIONS='--max-old-space-size=4096' npm ci && npm run build", timeout=1800)
    run(client, f"pm2 delete nvccz-api 2>/dev/null || true; pm2 start dist/app.js --name nvccz-api --cwd {APP_DIR} && pm2 save")
    run(
        client,
        "for i in $(seq 1 12); do curl -sf --connect-timeout 2 "
        f"http://127.0.0.1:{APP_PORT}/health >/dev/null && echo API_HEALTHY && break; sleep 5; done",
    )

    print("\n=== UI: relink to this API + build ===")
    sftp = client.open_sftp()
    with sftp.file(f"{UI_DIR}/.env.local", "w") as f:
        f.write(f"NEXT_PUBLIC_API_BASE_URL=http://{HOST}:{APP_PORT}/api\n")
    sftp.close()
    run(client, f"cd {UI_DIR} && NODE_OPTIONS='--max-old-space-size=4096' npm ci && npm run build", timeout=1800)
    run(
        client,
        f"pm2 delete nvccz-ui 2>/dev/null || true; "
        f"pm2 start npm --name nvccz-ui --cwd {UI_DIR} -- start -- -p {UI_PORT} && pm2 save",
    )

    print("\n=== verifying the app actually answers ===")
    run(client, f"sleep 5; curl -sS -o /dev/null -w 'UI_HTTP:%{{http_code}}\\n' --connect-timeout 8 http://127.0.0.1:{NGINX_PORT}/ || true")
    run(client, f"curl -sS -o /dev/null -w 'API_HTTP:%{{http_code}}\\n' --connect-timeout 5 http://127.0.0.1:{APP_PORT}/health || true")

    print("DEPLOY_SINGAPORE_GIT_DONE")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
