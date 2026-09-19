#!/usr/bin/env python3
"""Deploy the Matanho marketing site to the NTS VPS (:3130) via server-side git pull.

Per CLAUDE.md's "Deployment policy — no direct file transfer, ever": this script never
uploads code from this machine. Push your branch to GitHub first (`git push` in
~/Documents/Matanho), then run this — the VPS clones/pulls directly from
https://github.com/odlemon/matanho over SSH and builds in place with docker compose.

ONE-TIME SETUP REQUIRED before this script can run (not done by this script):
  1. Generate a deploy keypair and add the PUBLIC key as a read-only Deploy Key on
     https://github.com/odlemon/matanho.
  2. Put the PRIVATE key on the VPS and add a `Host github.com-matanho` alias in
     /root/.ssh/config using that key.
  3. This script only writes REMOTE_ROOT/.env if it doesn't already exist (same as the
     version it replaces) — an existing .env's secrets are never touched or re-generated.

Usage:
  python scripts/deploy-matanho-nts-vps.py --branch main
"""
from __future__ import annotations

import argparse
import secrets
import sys

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
REPO_URL = "git@github.com-matanho:odlemon/matanho.git"
REMOTE_ROOT = "/var/www/projects/matanho"
HOST_PORT = "3130"
SITE_URL = f"http://{HOST}:{HOST_PORT}"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> str:
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


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    p = argparse.ArgumentParser()
    p.add_argument("--branch", default="main")
    args = p.parse_args()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting {HOST}...", flush=True)
    client.connect(HOST, 22, USER, PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    print("Verifying GitHub deploy-key access from the VPS (see module docstring if this fails)...")
    run(client, "ssh -T git@github.com-matanho -o StrictHostKeyChecking=no 2>&1 | grep -qi 'successfully authenticated' "
                "&& echo GITHUB_AUTH_OK || (echo GITHUB_AUTH_FAILED; exit 1)")

    check = client.exec_command(f"test -d {REMOTE_ROOT}/.git && echo YES || echo NO")[1].read().decode().strip()
    if check == "YES":
        run(client, f"cd {REMOTE_ROOT} && git fetch origin {args.branch} && git reset --hard origin/{args.branch} && git clean -fdx -e .env")
    else:
        run(client, f"mkdir -p $(dirname {REMOTE_ROOT}) && rm -rf {REMOTE_ROOT} && git clone --branch {args.branch} --single-branch {REPO_URL} {REMOTE_ROOT}")
    sha = run(client, f"cd {REMOTE_ROOT} && git rev-parse --short HEAD").strip()
    print(f"{REMOTE_ROOT} now at {sha} ({args.branch})")

    has_env = client.exec_command(f"test -f {REMOTE_ROOT}/.env && echo YES || echo NO")[1].read().decode().strip()
    if has_env != "YES":
        print("No .env found — writing one with freshly generated secrets (first deploy only).")
        env_body = f"""MATANHO_HOST_PORT={HOST_PORT}
NEXT_PUBLIC_SITE_URL={SITE_URL}
POSTGRES_PASSWORD={secrets.token_urlsafe(24)}
SESSION_SECRET={secrets.token_urlsafe(48)}
ADMIN_BOOTSTRAP_SECRET={secrets.token_urlsafe(32)}
ANALYTICS_SALT={secrets.token_urlsafe(32)}
ANALYTICS_RETENTION_DAYS=180
CRON_SECRET={secrets.token_urlsafe(32)}
BLOB_READ_WRITE_TOKEN=
"""
        sftp = client.open_sftp()
        with sftp.file(f"{REMOTE_ROOT}/.env", "w") as f:
            f.write(env_body)
        sftp.chmod(f"{REMOTE_ROOT}/.env", 0o600)
        sftp.close()
    else:
        print("Existing .env found — leaving it untouched.")

    run(client, f"cd {REMOTE_ROOT} && DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain docker compose --env-file .env build", timeout=3600)
    run(client, f"cd {REMOTE_ROOT} && docker compose --env-file .env up -d --force-recreate")
    run(client, f"cd {REMOTE_ROOT} && docker compose --env-file .env ps")

    print("\n=== verifying the app actually answers ===")
    run(client, f"sleep 3; curl -fsS -o /dev/null -w 'health:%{{http_code}}\\n' http://127.0.0.1:{HOST_PORT}/api/health || true")
    run(client, f"curl -fsS -o /dev/null -w 'home:%{{http_code}}\\n' http://127.0.0.1:{HOST_PORT}/ || true")

    print("MATANHO_GIT_DEPLOY_DONE")
    print(f"URL={SITE_URL}")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
