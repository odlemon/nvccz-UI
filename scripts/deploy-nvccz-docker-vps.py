#!/usr/bin/env python3
"""Deploy NVCCZ API+UI to 102.217.49.126 (dev + prod stacks) via server-side git pull.

Per CLAUDE.md's "Deployment policy — no direct file transfer, ever": this script never
uploads code from this machine. Push your branch to GitHub first (`git push`), then run
this — the VPS clones/pulls src/api and src/ui directly from GitHub over SSH, builds in
place, and restarts via docker compose.

ONE-TIME SETUP REQUIRED before this script can run (not done by this script):
  1. Generate a deploy keypair (or reuse one) and add the PUBLIC key as a read-only
     Deploy Key on both https://github.com/odlemon/nvccz and https://github.com/odlemon/nvccz-UI.
  2. Put the PRIVATE key on the VPS and add a `Host github.com-nvccz` alias in
     /root/.ssh/config (or /home/user/.ssh/config) using that key.
  3. Set NVCCZ_DOCKER_VPS_PASSWORD in .secrets/ssh.env (see _ssh_creds.py) — this
     replaces the plaintext password that used to be hard-coded in this file.

Usage:
  python scripts/deploy-nvccz-docker-vps.py --branch dev --prod-branch master
"""
from __future__ import annotations

import argparse
import sys
import time

import paramiko
import _ssh_creds

HOST = "102.217.49.126"
PORT = 22
USER = "user"
PASSWORD = _ssh_creds.require(_ssh_creds.NVCCZ_DOCKER_VPS_PASSWORD, "NVCCZ_DOCKER_VPS_PASSWORD", "NVCCZ_DOCKER_VPS_PASSWORD")
REMOTE_ROOT = "/var/www/projects/nvccz"

API_REPO_URL = "git@github.com-nvccz:odlemon/nvccz.git"
UI_REPO_URL = "git@github.com-nvccz:odlemon/nvccz-UI.git"

COMPOSE_DEV = "compose/docker-compose.dev.yml"
COMPOSE_PROD = "compose/docker-compose.prod.yml"
ENV_DEV = "secrets/dev.env"
ENV_PROD = "secrets/prod.env"

DEV_SERVICES = "api ui upload"
PROD_SERVICES = "api upload ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events"


def connect_with_retry(max_attempts: int = 10, delay: int = 30) -> paramiko.SSHClient:
    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            print(f"Connecting {USER}@{HOST}:{PORT} (attempt {attempt}/{max_attempts})...", flush=True)
            client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
            return client
        except Exception as exc:
            last_err = exc
            print(f"  connect failed: {exc}", flush=True)
            if attempt < max_attempts:
                time.sleep(delay)
    raise RuntimeError(f"Could not connect to {HOST}:{PORT} after {max_attempts} attempts") from last_err


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


def ensure_repo(client: paramiko.SSHClient, path: str, repo_url: str, branch: str) -> None:
    check = client.exec_command(f"test -d {path}/.git && echo YES || echo NO")[1].read().decode().strip()
    if check == "YES":
        run(client, f"cd {path} && git fetch origin {branch} && git reset --hard origin/{branch} && git clean -fdx")
    else:
        run(client, f"rm -rf {path} && git clone --branch {branch} --single-branch {repo_url} {path}")
    sha = run(client, f"cd {path} && git rev-parse --short HEAD").strip()
    print(f"{path} now at {sha} ({branch})")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    p = argparse.ArgumentParser()
    p.add_argument("--branch", default="dev", help="Branch to deploy for the DEV stack")
    p.add_argument("--prod-branch", default=None, help="If set, also deploy this branch to the PROD stack")
    args = p.parse_args()

    client = connect_with_retry()

    print("Verifying GitHub deploy-key access from the VPS (see module docstring if this fails)...")
    run(client, "ssh -T git@github.com-nvccz -o StrictHostKeyChecking=no 2>&1 | grep -qi 'successfully authenticated' "
                "&& echo GITHUB_AUTH_OK || (echo GITHUB_AUTH_FAILED; exit 1)")

    print(f"\n=== syncing src/api + src/ui to {args.branch} (dev) ===")
    ensure_repo(client, f"{REMOTE_ROOT}/src/api", API_REPO_URL, args.branch)
    ensure_repo(client, f"{REMOTE_ROOT}/src/ui", UI_REPO_URL, args.branch)

    run(
        client,
        f"cd {REMOTE_ROOT} && DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain "
        f"docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} build {DEV_SERVICES}",
        timeout=3600,
    )
    run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} up -d --force-recreate {DEV_SERVICES}")
    run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} ps")

    if args.prod_branch:
        print(f"\n=== syncing prod stack to {args.prod_branch} ===")
        if args.prod_branch != args.branch:
            ensure_repo(client, f"{REMOTE_ROOT}/src/api-prod", API_REPO_URL, args.prod_branch)
            ensure_repo(client, f"{REMOTE_ROOT}/src/ui-prod", UI_REPO_URL, args.prod_branch)
        run(
            client,
            f"cd {REMOTE_ROOT} && DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain "
            f"docker compose --env-file {ENV_PROD} -f {COMPOSE_PROD} build {PROD_SERVICES}",
            timeout=3600,
        )
        run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_PROD} -f {COMPOSE_PROD} up -d --force-recreate {PROD_SERVICES}")
        run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_PROD} -f {COMPOSE_PROD} ps")

    print("\n=== waiting for health ===")
    run(
        client,
        "for i in $(seq 1 60); do "
        "curl -fsS http://127.0.0.1:3109/health >/dev/null 2>&1 && echo DEV_API_OK && break; sleep 5; done",
    )
    if args.prod_branch:
        run(
            client,
            "for i in $(seq 1 60); do "
            "curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1 && echo PROD_API_OK && break; sleep 5; done",
        )

    print("NVCCZ_GIT_DEPLOY_DONE")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
