#!/usr/bin/env python3
"""Pack Arcus API+UI, upload to 31.220.82.129, write secrets, docker compose up (HTTPS via Traefik)."""
from __future__ import annotations

import hashlib
import os
import re
import secrets
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = "Debgjnk4@!z"
REMOTE_ROOT = "/var/www/projects/arcus"
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
COMPOSE_DIR = UI_ROOT / "deploy" / "arcus"

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


def env_blob(kind: str, mysql_root: str, mysql_pass: str, jwt: str) -> str:
    if kind == "dev":
        ui = "https://dev.arcus.co.zw"
        api = "https://dev-api.arcus.co.zw"
    else:
        ui = "https://demo.arcus.co.zw"
        api = "https://demo-api.arcus.co.zw"
    return f"""MYSQL_ROOT_PASSWORD={mysql_root}
MYSQL_PASSWORD={mysql_pass}
JWT_SECRET={jwt}
PUBLIC_API_BASE_URL={api}/api
PUBLIC_WS_URL={api}
CORS_ORIGINS={ui},http://localhost:3001
FRONTEND_URL={ui}
BROKER_REPLY_BASE_URL={ui}
BASE_URL={api}/api
API_URL={api}/api
BOOTSTRAP_ADMIN_EMAIL=admin@nts.com
BOOTSTRAP_ADMIN_PASSWORD=admin123
NODE_ENV=production
"""


def parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def read_remote_env(sftp: paramiko.SFTPClient, path: str) -> dict[str, str] | None:
    try:
        with sftp.file(path, "r") as f:
            return parse_env(f.read().decode("utf-8", errors="replace"))
    except OSError:
        return None


REMOTE_SH = r"""
set -euo pipefail
ROOT=/var/www/projects/arcus
cd "$ROOT"
echo '=== verify checksums ==='
echo "$API_SHA  /tmp/arcus-api.tgz" | sha256sum -c -
echo "$UI_SHA  /tmp/arcus-ui.tgz" | sha256sum -c -
echo '=== extract ==='
rm -rf src/api src/ui
mkdir -p src compose secrets
tar -xzf /tmp/arcus-api.tgz -C src
tar -xzf /tmp/arcus-ui.tgz -C src
test -f src/api/package.json
test -f src/ui/package.json
test -f src/api/Dockerfile
test -f src/ui/Dockerfile
echo '=== retire legacy prod stack (demo replaces prod) ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml down 2>/dev/null || true
echo '=== compose up DEV ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build
echo '=== compose up DEMO ==='
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml up -d --build
echo '=== status ==='
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml ps
echo '=== HTTPS probe (may fail until DNS/certs propagate) ==='
curl -skI https://dev.arcus.co.zw | head -3 || true
curl -skI https://dev-api.arcus.co.zw/health | head -3 || true
curl -skI https://demo.arcus.co.zw | head -3 || true
curl -skI https://demo-api.arcus.co.zw/health | head -3 || true
echo ARCUS_COMPOSE_UP
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        api_path = tmp_path / "arcus-api.tgz"
        ui_path = tmp_path / "arcus-ui.tgz"

        print("Packing API...", flush=True)
        api_sha = make_tarball(API_ROOT, "api", api_path)
        print(f"  API {api_path.stat().st_size/1024/1024:.1f} MB sha={api_sha[:12]}", flush=True)
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

        for d in (f"{REMOTE_ROOT}/compose", f"{REMOTE_ROOT}/secrets", f"{REMOTE_ROOT}/src"):
            try:
                sftp.mkdir(d)
            except OSError:
                pass

        def put_file(local: Path, remote: str) -> None:
            try:
                sftp.remove(remote)
            except OSError:
                pass
            sftp.put(str(local), remote)
            st = sftp.stat(remote)
            if st.st_size != local.stat().st_size:
                raise OSError(f"upload size mismatch {remote}: remote={st.st_size} local={local.stat().st_size}")

        print("Uploading API tarball...", flush=True)
        put_file(api_path, "/tmp/arcus-api.tgz")
        print("Uploading UI tarball...", flush=True)
        put_file(ui_path, "/tmp/arcus-ui.tgz")

        def put_text(path: str, text: str, mode: int | None = None) -> None:
            with sftp.file(path, "w") as f:
                f.write(text)
            if mode is not None:
                sftp.chmod(path, mode)

        sftp.put(str(COMPOSE_DIR / "docker-compose.dev.yml"), f"{REMOTE_ROOT}/compose/docker-compose.dev.yml")
        sftp.put(str(COMPOSE_DIR / "docker-compose.demo.yml"), f"{REMOTE_ROOT}/compose/docker-compose.demo.yml")
        sftp.put(str(COMPOSE_DIR / "README.md"), f"{REMOTE_ROOT}/README.md")

        existing_dev = read_remote_env(sftp, f"{REMOTE_ROOT}/secrets/dev.env")
        existing_demo = read_remote_env(sftp, f"{REMOTE_ROOT}/secrets/demo.env")
        if not existing_demo:
            existing_demo = read_remote_env(sftp, f"{REMOTE_ROOT}/secrets/prod.env")

        def pick_secret(existing: dict[str, str] | None, key: str, default: str) -> str:
            if existing and existing.get(key):
                return existing[key]
            return default

        dev_root = pick_secret(existing_dev, "MYSQL_ROOT_PASSWORD", secrets.token_hex(16))
        dev_pass = pick_secret(existing_dev, "MYSQL_PASSWORD", secrets.token_hex(16))
        dev_jwt = pick_secret(existing_dev, "JWT_SECRET", secrets.token_hex(32))
        demo_root = pick_secret(existing_demo, "MYSQL_ROOT_PASSWORD", secrets.token_hex(16))
        demo_pass = pick_secret(existing_demo, "MYSQL_PASSWORD", secrets.token_hex(16))
        demo_jwt = pick_secret(existing_demo, "JWT_SECRET", secrets.token_hex(32))

        put_text(
            f"{REMOTE_ROOT}/secrets/dev.env",
            env_blob("dev", dev_root, dev_pass, dev_jwt),
            0o600,
        )
        put_text(
            f"{REMOTE_ROOT}/secrets/demo.env",
            env_blob("demo", demo_root, demo_pass, demo_jwt),
            0o600,
        )

        remote_sh = f"export API_SHA={api_sha}\nexport UI_SHA={ui_sha}\n" + REMOTE_SH
        put_text("/tmp/arcus-up.sh", remote_sh, 0o755)
        sftp.close()

        print("Building and starting stacks (this will take a while)...", flush=True)
        stdin, stdout, stderr = client.exec_command("bash /tmp/arcus-up.sh", timeout=3600, get_pty=True)
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
