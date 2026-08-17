#!/usr/bin/env python3
"""Pack UI, upload to 31.220.82.129, rebuild UI containers only. Does not touch secrets/API/DB."""
from __future__ import annotations

import hashlib
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = "Debgjnk4@!z"
REMOTE_ROOT = "/var/www/projects/arcus"
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "coverage",
    ".next",
    ".cursor",
    ".claude",
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
}
EXCLUDE_PREFIXES = (
    "storage/local-upload-mock/",
    "tmp-",
)
EXCLUDE_NAMES = {".env", ".env.local", "tmp-report-placeholder-audit.json"}


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    norm = rel.replace("\\", "/")
    if any(norm.startswith(p) for p in EXCLUDE_PREFIXES):
        return True
    if Path(rel).name in EXCLUDE_NAMES:
        return True
    return False


def make_tarball(root: Path, arc_prefix: str, out_path: Path) -> str:
    with tarfile.open(out_path, mode="w:gz") as tar:
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
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


REMOTE_SH = r"""
set -euo pipefail
ROOT=/var/www/projects/arcus
cd "$ROOT"
echo '=== verify checksum ==='
echo "$UI_SHA  /tmp/arcus-ui.tgz" | sha256sum -c -
echo '=== extract UI (keep secrets + API) ==='
rm -rf src/ui
mkdir -p src
tar -xzf /tmp/arcus-ui.tgz -C src
test -f src/ui/package.json
test -f src/ui/Dockerfile
echo '=== rebuild DEV ui ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build ui
echo '=== rebuild PROD ui ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build ui
echo '=== status ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps
echo ARCUS_UI_REBUILD_DONE
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    with tempfile.TemporaryDirectory() as tmp:
        ui_path = Path(tmp) / "arcus-ui.tgz"
        print("Packing UI...", flush=True)
        ui_sha = make_tarball(UI_ROOT, "ui", ui_path)
        print(f"  UI {ui_path.stat().st_size/1024/1024:.1f} MB sha={ui_sha[:12]}", flush=True)

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
        try:
            sftp.remove("/tmp/arcus-ui.tgz")
        except OSError:
            pass
        print("Uploading UI tarball...", flush=True)
        sftp.put(str(ui_path), "/tmp/arcus-ui.tgz")
        st = sftp.stat("/tmp/arcus-ui.tgz")
        if st.st_size != ui_path.stat().st_size:
            raise OSError(f"upload size mismatch remote={st.st_size} local={ui_path.stat().st_size}")
        remote_sh = f"export UI_SHA={ui_sha}\n" + REMOTE_SH
        with sftp.file("/tmp/arcus-ui-up.sh", "w") as f:
            f.write(remote_sh)
        sftp.chmod("/tmp/arcus-ui-up.sh", 0o755)
        sftp.close()

        print("Building UI stacks (this will take a while)...", flush=True)
        stdin, stdout, stderr = client.exec_command("bash /tmp/arcus-ui-up.sh", timeout=3600, get_pty=True)
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
