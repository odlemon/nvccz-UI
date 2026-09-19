#!/usr/bin/env python3
"""Deploy Arcus API+UI to 31.220.82.129 (dev + demo stacks) via server-side git pull.

Per CLAUDE.md's "Deployment policy — no direct file transfer, ever": this script never
uploads code from this machine. It pushes nothing itself — push your branch to GitHub
first (`git push`), then run this. The VPS clones/pulls src/api and src/ui directly from
GitHub over SSH, builds in place with its own CPU/disk, and restarts via docker compose.

ONE-TIME SETUP REQUIRED before this script can run (not done by this script):
  1. Generate a deploy keypair for each repo (or one key added to both, if that's the
     policy the user wants) and add the PUBLIC key as a read-only Deploy Key on
     - https://github.com/odlemon/nvccz  (API)
     - https://github.com/odlemon/nvccz-UI  (UI)
  2. Put the PRIVATE key on the VPS at /root/.ssh/arcus_deploy_key (chmod 600) and add a
     matching `Host github.com-arcus` alias in /root/.ssh/config using that key, OR rely
     on a single VPS-wide key already registered on both repos.
  3. On first run only, this script `git clone`s into src/api and src/ui if they are not
     already git checkouts (see `ensure_repo`); after that it's fetch+reset every time.

Usage:
  python scripts/deploy-arcus-docker-vps.py --branch dev          # deploy dev stack only
  python scripts/deploy-arcus-docker-vps.py --branch dev --demo demo-branch  # + demo stack
"""
from __future__ import annotations

import argparse
import sys

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
REMOTE_ROOT = "/var/www/projects/arcus"

API_REPO_URL = "git@github.com-arcus:odlemon/nvccz.git"
UI_REPO_URL = "git@github.com-arcus:odlemon/nvccz-UI.git"

COMPOSE_DEV = "compose/docker-compose.dev.yml"
COMPOSE_DEMO = "compose/docker-compose.demo.yml"
ENV_DEV = "secrets/dev.env"
ENV_DEMO = "secrets/demo.env"


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
    """Clone `path` from `repo_url` if it isn't a git checkout yet, else fetch+reset it."""
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
    p.add_argument("--branch", default="dev", help="Branch to deploy for the DEV stack (default: dev)")
    p.add_argument("--demo", default=None, help="If set, also deploy this branch to the DEMO stack")
    args = p.parse_args()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting {HOST}...", flush=True)
    client.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    print("Verifying GitHub deploy-key access from the VPS (see module docstring if this fails)...")
    run(client, "ssh -T git@github.com-arcus -o StrictHostKeyChecking=no 2>&1 | grep -qi 'successfully authenticated' "
                "&& echo GITHUB_AUTH_OK || (echo GITHUB_AUTH_FAILED; exit 1)")

    print(f"\n=== syncing src/api + src/ui to {args.branch} ===")
    ensure_repo(client, f"{REMOTE_ROOT}/src/api", API_REPO_URL, args.branch)
    ensure_repo(client, f"{REMOTE_ROOT}/src/ui", UI_REPO_URL, args.branch)

    run(
        client,
        f"cd {REMOTE_ROOT} && DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain "
        f"docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} build api ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events",
        timeout=3600,
    )
    run(
        client,
        f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} "
        f"up -d --force-recreate api ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events",
    )
    run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEV} -f {COMPOSE_DEV} ps")

    if args.demo:
        print(f"\n=== syncing demo stack to {args.demo} ===")
        # Demo runs from the same src/api + src/ui checkouts if it shares a branch with dev;
        # if the demo branch differs from --branch, re-sync into a second checkout instead of
        # reusing src/api/src/ui (which dev's containers are already built from).
        if args.demo != args.branch:
            ensure_repo(client, f"{REMOTE_ROOT}/src/api-demo", API_REPO_URL, args.demo)
            ensure_repo(client, f"{REMOTE_ROOT}/src/ui-demo", UI_REPO_URL, args.demo)
        run(
            client,
            f"cd {REMOTE_ROOT} && DOCKER_BUILDKIT=1 BUILDKIT_PROGRESS=plain "
            f"docker compose --env-file {ENV_DEMO} -f {COMPOSE_DEMO} build",
            timeout=3600,
        )
        run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEMO} -f {COMPOSE_DEMO} up -d --force-recreate")
        run(client, f"cd {REMOTE_ROOT} && docker compose --env-file {ENV_DEMO} -f {COMPOSE_DEMO} ps")

    print("\n=== verifying the app actually answers ===")
    run(client, "curl -skI https://dev.matanho.com | head -3 || true")
    run(client, "curl -skI https://dev-api.matanho.com/health | head -3 || true")
    if args.demo:
        run(client, "curl -skI https://demo.arcus.co.zw | head -3 || true")

    print("ARCUS_GIT_DEPLOY_DONE")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
