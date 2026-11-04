"""Deploy Arcus development by release archives over SFTP (no Git on the VPS).

Production is not touched. The target is an isolated Compose project under
/opt/arcus-dev on the supplied development VPS.
"""
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

HOST = os.environ.get("DEPLOY_HOST", "109.199.123.21")
PORT = int(os.environ.get("DEPLOY_SSH_PORT", "22"))
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD")
REMOTE_ROOT = "/opt/arcus-dev"
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
COMPOSE = UI_ROOT / "deploy" / "arcus" / "docker-compose.dev.yml"

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "coverage", ".next", ".cursor", ".claude", ".vscode", ".yarn", "docs", "design-refs", "dashboard-clone", "stock-price-module", "backups", "tracking", "tmp", "uploads", "storage", "scripts", "tests", "public"}
EXCLUDE_PREFIXES = ("tmp-", ".next-", ".fr-", ".payroll-", ".perf-", ".procurement-")
EXCLUDE_NAMES = {".env", ".env.local", "package-lock.json", ".api-src.tgz", ".codex-api.tgz", ".codex-api.tar", ".codex-ui.bundle"}


def skip(rel: str) -> bool:
    parts = Path(rel).parts
    norm = rel.replace("\\", "/")
    suffix = Path(rel).suffix.lower()
    # Keep application assets under public/, but omit root-level screenshots,
    # exported workbooks, PDFs, and other large QA artifacts.
    large_fixture = suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".docx", ".xlsx"} and not norm.startswith("public/")
    return any(p in EXCLUDE_DIRS for p in parts) or any(norm.startswith(p) for p in EXCLUDE_PREFIXES) or Path(rel).name in EXCLUDE_NAMES or large_fixture


def pack(root: Path, prefix: str, output: Path) -> str:
    with tarfile.open(output, "w:gz") as tar:
        for directory, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for name in files:
                full = Path(directory) / name
                rel = str(full.relative_to(root))
                if not skip(rel):
                    tar.add(full, arcname=f"{prefix}/{rel.replace(chr(92), '/')}")
    digest = hashlib.sha256()
    with output.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def dev_env() -> str:
    root = secrets.token_urlsafe(24)
    db = secrets.token_urlsafe(24)
    jwt = secrets.token_urlsafe(48)
    return f"""MYSQL_ROOT_PASSWORD={root}
MYSQL_PASSWORD={db}
JWT_SECRET={jwt}
PUBLIC_API_BASE_URL=http://{HOST}:3109
PUBLIC_WS_URL=ws://{HOST}:3109
CORS_ORIGINS=http://{HOST}:3100,http://{HOST}:3110,http://{HOST}:3120,http://{HOST}:3130,http://{HOST}:3140,http://{HOST}:3150,https://dev.matanho.com,https://dev-api.matanho.com
FRONTEND_URL=http://{HOST}:3100
BASE_URL=http://{HOST}:3109/api
API_URL=http://{HOST}:3109/api
BOOTSTRAP_ADMIN_EMAIL=admin@nts.com
BOOTSTRAP_ADMIN_PASSWORD=admin123
NODE_ENV=development
"""


def stream_file(client: paramiko.SSHClient, local: Path, remote: str) -> None:
    """Transfer bytes over the SSH channel, avoiding slow SFTP packet uploads."""
    _, size_out, _ = client.exec_command(f"stat -c%s {remote} 2>/dev/null || echo 0", get_pty=False)
    try:
        existing = int(size_out.read().decode().strip() or "0")
    except ValueError:
        existing = 0
    if existing > local.stat().st_size:
        existing = 0
    mode = "a" if existing else "w"
    if existing == local.stat().st_size:
        return
    stdin, stdout, stderr = client.exec_command(f"cat {('>>' if mode == 'a' else '>')} {remote}", get_pty=False)
    with local.open("rb") as source:
        source.seek(existing)
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            stdin.write(chunk)
    stdin.channel.shutdown_write()
    stdin.close()
    code = stdout.channel.recv_exit_status()
    if code:
        raise RuntimeError(stderr.read().decode("utf-8", errors="replace") or f"stream transfer failed: {remote}")


def main() -> int:
    if not PASSWORD:
        raise SystemExit("Set DEPLOY_PASSWORD in the current PowerShell session")
    with tempfile.TemporaryDirectory() as temp:
        temp_path = Path(temp)
        api = temp_path / "api.tgz"
        ui = temp_path / "ui.tgz"
        print("Packing API and UI release archives...", flush=True)
        api_sha = pack(API_ROOT, "api", api)
        ui_sha = pack(UI_ROOT, "ui", ui)
        print(f"API {api.stat().st_size / 1048576:.1f} MB; UI {ui.stat().st_size / 1048576:.1f} MB", flush=True)

        compose = COMPOSE.read_text(encoding="utf-8")
        compose = compose.replace("name: lms_lms-network", "name: arcus-dev-edge")
        compose = compose.replace("external: true", "external: true", 1)
        compose = compose.replace("    ports:\n      - \"3110:3000\"", "    ports:\n      - \"3110:3000\"", 1)
        # Add direct HTTP bindings for API and staff; other portal bindings are already present.
        compose = compose.replace("  api:\n    build:", "  api:\n    ports:\n      - \"3109:3009\"\n    build:")
        compose = compose.replace("  ui-staff:\n    build:", "  ui-staff:\n    ports:\n      - \"3100:3000\"\n    build:")

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting {USER}@{HOST}:{PORT}...", flush=True)
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=45, look_for_keys=False, allow_agent=False)
        sftp = client.open_sftp()
        for path in (f"{REMOTE_ROOT}/src", f"{REMOTE_ROOT}/compose", f"{REMOTE_ROOT}/secrets", f"{REMOTE_ROOT}/upload-service"):
            client.exec_command(f"mkdir -p {path}")[1].channel.recv_exit_status()
        sftp.close()
        print("Streaming API archive...", flush=True)
        client.exec_command("rm -f /tmp/arcus-dev-api.tgz")[1].channel.recv_exit_status()
        stream_file(client, api, "/tmp/arcus-dev-api.tgz")
        print("Streaming UI archive...", flush=True)
        client.exec_command("rm -f /tmp/arcus-dev-ui.tgz")[1].channel.recv_exit_status()
        stream_file(client, ui, "/tmp/arcus-dev-ui.tgz")
        sftp = client.open_sftp()
        with sftp.file(f"{REMOTE_ROOT}/compose/docker-compose.dev.yml", "w") as stream:
            stream.write(compose)
        upload_root = UI_ROOT / "deploy" / "arcus" / "upload-service"
        for file in upload_root.iterdir():
            sftp.put(str(file), f"{REMOTE_ROOT}/upload-service/{file.name}")
        try:
            sftp.stat(f"{REMOTE_ROOT}/secrets/dev.env")
        except OSError:
            with sftp.file(f"{REMOTE_ROOT}/secrets/dev.env", "w") as stream:
                stream.write(dev_env())
            sftp.chmod(f"{REMOTE_ROOT}/secrets/dev.env", 0o600)
        sftp.close()

        remote = f"""set -e
ROOT={REMOTE_ROOT}
echo '{api_sha}  /tmp/arcus-dev-api.tgz' | sha256sum -c -
echo '{ui_sha}  /tmp/arcus-dev-ui.tgz' | sha256sum -c -
rm -rf $ROOT/src/api $ROOT/src/ui
mkdir -p $ROOT/src
tar -xzf /tmp/arcus-dev-api.tgz -C $ROOT/src
tar -xzf /tmp/arcus-dev-ui.tgz -C $ROOT/src
docker network inspect arcus-dev-edge >/dev/null 2>&1 || docker network create arcus-dev-edge >/dev/null
cd $ROOT
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml config --quiet
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
curl -fsS -o /dev/null -w 'api:%{{http_code}}\\n' http://127.0.0.1:3109/health || true
curl -fsS -o /dev/null -w 'staff:%{{http_code}}\\n' http://127.0.0.1:3100/login || true
"""
        print("Extracting, building, and starting isolated dev stack...", flush=True)
        _, stdout, stderr = client.exec_command("bash -s", get_pty=True)
        stdout.channel.send(remote.encode())
        stdout.channel.shutdown_write()
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
