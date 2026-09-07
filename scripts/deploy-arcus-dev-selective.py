#!/usr/bin/env python3
"""
Selective Arcus DEV deploy (dev.matanho.com only).

Faster than full `deploy-arcus-docker-vps.py` / `rebuild-arcus-ui.py`:
  - Packs UI from the local working tree (same exclude rules as existing deploy)
  - Rebuilds only the portal service(s) you ask for (default: detect or ui-staff)
  - Never touches demo/prod stacks
  - Skips API/MySQL/upload unless --api is passed
  - Snapshots the running image tag before rebuild for quick rollback

Usage (from nvccz-new repo root):
  python scripts/deploy-arcus-dev-selective.py                  # detect + ui-staff
  python scripts/deploy-arcus-dev-selective.py --portals staff
  python scripts/deploy-arcus-dev-selective.py --portals staff,lp
  python scripts/deploy-arcus-dev-selective.py --detect          # print detection only
  python scripts/deploy-arcus-dev-selective.py --api             # also rebuild API
  python scripts/deploy-arcus-dev-selective.py --rollback staff  # restore pre-deploy image

Portal map (compose service → host):
  staff     → ui-staff     → https://dev.matanho.com
  lp        → ui-lp        → https://dev.lp.matanho.com
  investee  → ui-investee  → https://dev.investee.matanho.com
  apply     → ui-apply     → https://dev.apply.matanho.com
  vendor    → ui-vendor    → https://dev.vendor.matanho.com
  events    → ui-events    → https://dev.events.matanho.com

See: design-refs/arcus-dev-selective-deploy.md
"""
from __future__ import annotations

import argparse
import hashlib
import os
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
REMOTE_ROOT = "/var/www/projects/arcus"
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
COMPOSE_REL = "compose/docker-compose.dev.yml"
ENV_FILE = "secrets/dev.env"

PORTAL_TO_SERVICE = {
    "staff": "ui-staff",
    "lp": "ui-lp",
    "investee": "ui-investee",
    "apply": "ui-apply",
    "vendor": "ui-vendor",
    "events": "ui-events",
}

# Path prefixes (repo-relative, forward slashes) → portal(s). Default staff for shared app code.
PATH_HINTS: list[tuple[str, set[str]]] = [
    ("app/lp-portal/", {"lp"}),
    ("app/investee-portal", {"investee"}),
    ("app/investee-portal-v8/", {"investee"}),
    ("components/investee-portal", {"investee"}),
    ("app/funding-application/", {"apply"}),
    ("components/funding-application", {"apply"}),
    ("app/vendor-portal/", {"vendor"}),
    ("components/vendor", {"vendor"}),
    ("app/events", {"events"}),
    ("components/events", {"events"}),
    # Shared staff modules (portfolio / performance / investments / home live in staff build)
    ("app/portfolio", {"staff"}),
    ("app/performance", {"staff"}),
    ("app/investments", {"staff"}),
    ("app/home", {"staff"}),
    ("components/portfolio", {"staff"}),
    ("components/performance", {"staff"}),
    ("components/investments", {"staff"}),
    ("components/home-", {"staff"}),
    ("lib/portfolio", {"staff"}),
    ("lib/performance", {"staff"}),
    ("lib/investments", {"staff"}),
    ("public/portfolio", {"staff"}),
    ("public/performance", {"staff"}),
    ("middleware.ts", {"staff", "lp", "investee", "apply", "vendor", "events"}),
    ("lib/portal/", {"staff", "lp", "investee", "apply", "vendor", "events"}),
    ("lib/config/modules.ts", {"staff"}),
    ("lib/auth/", {"staff", "lp", "investee", "apply", "vendor", "events"}),
    ("components/layout/", {"staff", "lp", "investee", "apply", "vendor", "events"}),
    ("deploy/arcus/", set()),  # compose-only; handled separately
    ("scripts/", set()),
]

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "coverage",
    ".next",
    # Per-portal build output (run-portal-dev.mjs / portal builds). Roughly 1 GB
    # combined; packing these made the upload take longer than the build.
    ".next-staff",
    ".next-lp",
    ".next-investee",
    ".next-apply",
    ".cursor",
    ".claude",
    ".agents",
    ".kilo",
    ".vscode",
    ".yarn",
    "tmp-smoke-io-reports",
    "agent-transcripts",
    "design-refs",
    "docs",
    "dashboard-clone",
    "stock-price-module",
    "qa-explore",
    "backups",
    "tracking",
    "__pycache__",
}
EXCLUDE_PREFIXES = (
    "storage/local-upload-mock/",
    "tmp-",
    "scripts/_tmp-",
    "scripts/__",
)
EXCLUDE_NAMES = {
    ".env",
    ".env.local",
    "tmp-report-placeholder-audit.json",
}
EXCLUDE_SUFFIXES = (".xlsx", ".log", ".pyc")


def is_build_output_dir(name: str) -> bool:
    """Any Next.js build directory, however it is suffixed.

    EXCLUDE_DIRS names the four known per-portal dirs, which means a new one is
    packed silently. A scratch `.next-staff-review` built locally pushed this
    tarball past 330 MB mid-upload before anyone noticed — the same failure mode
    that made an earlier deploy 186 MB. Matching the prefix closes the class.
    """
    return name == ".next" or name.startswith(".next-")


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    if any(p in EXCLUDE_DIRS or is_build_output_dir(p) for p in parts):
        return True
    norm = rel.replace("\\", "/")
    if any(norm.startswith(p) for p in EXCLUDE_PREFIXES):
        return True
    name = Path(rel).name
    if name in EXCLUDE_NAMES:
        return True
    if name.endswith(EXCLUDE_SUFFIXES):
        return True
    return False


def make_tarball(root: Path, arc_prefix: str, out_path: Path) -> str:
    with tarfile.open(out_path, mode="w:gz") as tar:
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not is_build_output_dir(d)]
            for name in files:
                full = Path(dirpath) / name
                rel = str(full.relative_to(root))
                if skip(rel):
                    continue
                tar.add(full, arcname=f"{arc_prefix}/{rel.replace(chr(92), '/')}")
    h = hashlib.sha256()
    with open(out_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def git_changed_paths(ui_root: Path) -> list[str]:
    """Return changed/untracked paths relative to UI repo (best-effort)."""
    paths: list[str] = []
    try:
        r = subprocess.run(
            ["git", "status", "--porcelain", "-u"],
            cwd=str(ui_root),
            capture_output=True,
            text=True,
            check=False,
        )
        for line in r.stdout.splitlines():
            if len(line) < 4:
                continue
            # status XY then path; handle renames "R  a -> b"
            rest = line[3:].strip()
            if " -> " in rest:
                rest = rest.split(" -> ", 1)[1]
            paths.append(rest.replace("\\", "/"))
    except OSError:
        pass
    return paths


def detect_portals(changed: list[str]) -> set[str]:
    portals: set[str] = set()
    api_touched = False
    for p in changed:
        norm = p.replace("\\", "/")
        if norm.startswith("deploy/arcus/") or norm.startswith("scripts/"):
            continue
        matched = False
        for prefix, targets in PATH_HINTS:
            if norm == prefix or norm.startswith(prefix):
                portals |= targets
                matched = True
                break
        if not matched:
            # Shared Next app code → staff (other portals are separate builds of same tree)
            if not any(
                norm.startswith(x)
                for x in (
                    ".agents/",
                    ".kilo/",
                    "design-refs/",
                    "arcus-",
                    "test-",
                )
            ):
                portals.add("staff")
    return portals


def ssh_connect() -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        port=22,
        username=USER,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )
    return client


def run_remote(client: paramiko.SSHClient, script: str, timeout: int = 3600) -> int:
    sftp = client.open_sftp()
    remote_path = "/tmp/arcus-dev-selective.sh"
    with sftp.file(remote_path, "w") as f:
        f.write(script.replace("\r\n", "\n"))
    sftp.chmod(remote_path, 0o755)
    sftp.close()
    stdin, stdout, stderr = client.exec_command(f"bash {remote_path}", timeout=timeout, get_pty=True)
    for line in stdout:
        print(line, end="", flush=True)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    return stdout.channel.recv_exit_status()


def build_remote_deploy_sh(
    *,
    services: list[str],
    ui_sha: str,
    api_sha: str | None,
    stamp: str,
) -> str:
    svc = " ".join(services)
    api_block = ""
    if api_sha:
        api_block = f"""
echo '=== verify API checksum ==='
echo "{api_sha}  /tmp/arcus-api.tgz" | sha256sum -c -
echo '=== extract API ==='
rm -rf src/api
mkdir -p src
tar -xzf /tmp/arcus-api.tgz -C src
test -f src/api/package.json
SERVICES="$SERVICES api"
"""
    return f"""#!/bin/bash
set -euo pipefail
ROOT={REMOTE_ROOT}
cd "$ROOT"
export COMPOSE="docker compose --env-file {ENV_FILE} -f {COMPOSE_REL}"
SERVICES="{svc}"
STAMP="{stamp}"

echo '=== verify UI checksum ==='
echo "{ui_sha}  /tmp/arcus-ui.tgz" | sha256sum -c -
echo '=== snapshot images for rollback ==='
mkdir -p /var/www/projects/arcus/rollback
for s in $SERVICES; do
  cid=$(docker compose --env-file {ENV_FILE} -f {COMPOSE_REL} ps -q "$s" 2>/dev/null || true)
  if [ -n "${{cid:-}}" ]; then
    img=$(docker inspect -f '{{{{.Image}}}}' "$cid")
    echo "$img" > "/var/www/projects/arcus/rollback/${{s}}.${{STAMP}}.image"
    echo "$img" > "/var/www/projects/arcus/rollback/${{s}}.latest.image"
    echo "saved $s -> $img"
  else
    echo "no running container for $s (fresh)"
  fi
done
echo '=== extract UI (keep secrets + API unless replaced) ==='
rm -rf src/ui
mkdir -p src compose
tar -xzf /tmp/arcus-ui.tgz -C src
test -f src/ui/package.json
test -f src/ui/Dockerfile
# keep server compose/secrets; optionally sync compose from package if present
if [ -f src/ui/deploy/arcus/docker-compose.dev.yml ]; then
  cp -f src/ui/deploy/arcus/docker-compose.dev.yml compose/docker-compose.dev.yml
  echo 'synced compose/docker-compose.dev.yml from UI package'
fi
{api_block}
echo "=== rebuild DEV only: $SERVICES ==="
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
# Build first (plain logs), then recreate — avoids flaky SSH PTY drown-outs
$COMPOSE build $SERVICES
$COMPOSE up -d --no-deps --force-recreate $SERVICES
echo '=== status ==='
$COMPOSE ps
echo ARCUS_DEV_SELECTIVE_DONE services=$SERVICES stamp=$STAMP
"""


def build_remote_rollback_sh(portals: list[str]) -> str:
    services = [PORTAL_TO_SERVICE[p] for p in portals]
    return f"""#!/bin/bash
set -euo pipefail
cd {REMOTE_ROOT}
COMPOSE="docker compose --env-file {ENV_FILE} -f {COMPOSE_REL}"
OVERRIDE=/tmp/arcus-dev-rollback.override.yml
echo 'services:' > "$OVERRIDE"
for s in {" ".join(services)}; do
  img_file="/var/www/projects/arcus/rollback/${{s}}.latest.image"
  if [ ! -f "$img_file" ]; then
    echo "Missing rollback file: $img_file"
    echo "Re-deploy from a known-good local tree instead."
    exit 1
  fi
  img=$(cat "$img_file")
  tag="arcus-dev-rollback-$s:local"
  echo "=== rollback $s to $img (tag $tag) ==="
  docker tag "$img" "$tag"
  printf '  %s:\\n    image: %s\\n    pull_policy: never\\n    build: !reset null\\n' "$s" "$tag" >> "$OVERRIDE"
done
echo '--- override ---'
cat "$OVERRIDE"
$COMPOSE -f {COMPOSE_REL} -f "$OVERRIDE" up -d --no-build --force-recreate {" ".join(services)}
$COMPOSE ps
echo ARCUS_DEV_ROLLBACK_DONE
"""


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Selective Arcus DEV portal deploy")
    p.add_argument(
        "--portals",
        default="",
        help="Comma list: staff,lp,investee,apply,vendor,events (default: detect or staff)",
    )
    p.add_argument("--detect", action="store_true", help="Print detection and exit")
    p.add_argument("--api", action="store_true", help="Also pack/rebuild API (rare)")
    p.add_argument(
        "--rollback",
        metavar="PORTAL",
        help="Rollback portal(s), comma-separated, using last saved image ids",
    )
    p.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    return p.parse_args()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    args = parse_args()

    if args.rollback:
        portals = [x.strip() for x in args.rollback.split(",") if x.strip()]
        for p in portals:
            if p not in PORTAL_TO_SERVICE:
                print(f"Unknown portal: {p}", file=sys.stderr)
                return 2
        print(f"Rolling back DEV portals: {portals}", flush=True)
        client = ssh_connect()
        try:
            return run_remote(client, build_remote_rollback_sh(portals), timeout=600)
        finally:
            client.close()

    changed = git_changed_paths(UI_ROOT)
    detected = detect_portals(changed)
    print(f"Changed paths (sample): {len(changed)} total", flush=True)
    for c in changed[:40]:
        print(f"  {c}", flush=True)
    if len(changed) > 40:
        print(f"  ... +{len(changed) - 40} more", flush=True)
    print(f"Detected portals: {sorted(detected) or ['(none)']}", flush=True)

    if args.detect:
        return 0

    if args.portals.strip():
        portals = [x.strip() for x in args.portals.split(",") if x.strip()]
    elif detected:
        portals = sorted(detected)
    else:
        portals = ["staff"]

    for p in portals:
        if p not in PORTAL_TO_SERVICE:
            print(f"Unknown portal: {p}", file=sys.stderr)
            return 2

    services = [PORTAL_TO_SERVICE[p] for p in portals]
    if args.api:
        print("API rebuild requested (--api)", flush=True)

    print(
        f"Plan: DEV-only rebuild services={services}; api={args.api}; "
        f"skip demo/prod; skip other portals",
        flush=True,
    )
    if not args.yes:
        print("Proceeding in 2s (Ctrl+C to abort)...", flush=True)
        time.sleep(2)

    stamp = time.strftime("%Y%m%d-%H%M%S")
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        ui_path = tmp_path / "arcus-ui.tgz"
        print("Packing UI working tree...", flush=True)
        ui_sha = make_tarball(UI_ROOT, "ui", ui_path)
        print(f"  UI {ui_path.stat().st_size / 1024 / 1024:.1f} MB sha={ui_sha[:12]}", flush=True)

        api_sha = None
        api_path = None
        if args.api:
            api_path = tmp_path / "arcus-api.tgz"
            print("Packing API...", flush=True)
            api_sha = make_tarball(API_ROOT, "api", api_path)
            print(
                f"  API {api_path.stat().st_size / 1024 / 1024:.1f} MB sha={api_sha[:12]}",
                flush=True,
            )

        client = ssh_connect()
        try:
            sftp = client.open_sftp()
            for remote in ("/tmp/arcus-ui.tgz", "/tmp/arcus-api.tgz"):
                try:
                    sftp.remove(remote)
                except OSError:
                    pass
            print("Uploading UI tarball...", flush=True)
            sftp.put(str(ui_path), "/tmp/arcus-ui.tgz")
            if api_path is not None:
                print("Uploading API tarball...", flush=True)
                sftp.put(str(api_path), "/tmp/arcus-api.tgz")
            sftp.close()

            script = build_remote_deploy_sh(
                services=services,
                ui_sha=ui_sha,
                api_sha=api_sha,
                stamp=stamp,
            )
            print("Building selected DEV services (Next.js build inside Docker)...", flush=True)
            code = run_remote(client, script, timeout=3600)
            return code
        finally:
            client.close()


if __name__ == "__main__":
    raise SystemExit(main())
