#!/usr/bin/env python3
"""Deploy NVCCZ prod stack on NTS server (31.220.82.129) — staging until client VPS is back."""
from __future__ import annotations

import hashlib
import os
import secrets
import string
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = "Debgjnk4@!z"
REMOTE_ROOT = "/var/www/projects/nvccz"
REMOTE_TMP = "/tmp"
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
COMPOSE_DIR = UI_ROOT / "deploy" / "nvccz"
# Public HTTPS hostnames (Traefik on NTS). Override via env when staff domain is purchased.
PUBLIC_STAFF_HOST = os.environ.get("NVCCZ_PUBLIC_STAFF_HOST", "matanho.nvccz.com")
PUBLIC_STAFF_HOST_ALT = os.environ.get(
    "NVCCZ_PUBLIC_STAFF_HOST_ALT", "nvfnvvcz.my.matanho.com"
)
STAFF_URL = f"https://{PUBLIC_STAFF_HOST}"
APPLY_URL = os.environ.get("NVCCZ_APPLY_URL", "https://nvccz.online")
LP_URL = os.environ.get("NVCCZ_LP_URL", "https://lp.nvccz.online")
INVESTEE_URL = os.environ.get("NVCCZ_INVESTEE_URL", "https://investee.nvccz.online")
API_URL = os.environ.get("NVCCZ_API_URL", "https://api.nvccz.online")
ADMIN_EMAIL = "admin@nvccz.co.zw"

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
    name = Path(rel).name
    if name in EXCLUDE_NAMES or name.startswith("~$"):
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


def strong_password(length: int = 32) -> str:
    # Avoid $ — docker compose env files interpolate $VAR.
    alphabet = string.ascii_letters + string.digits + "!@#%^&*-_=+"
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in pw)
            and any(c.isupper() for c in pw)
            and any(c.isdigit() for c in pw)
            and any(c in "!@#$%^&*-_=+" for c in pw)
        ):
            return pw


def env_blob(mysql_root: str, mysql_pass: str, jwt: str, admin_pw: str) -> str:
    ui = STAFF_URL
    lp_ui = LP_URL
    investee_ui = INVESTEE_URL
    apply_ui = APPLY_URL
    api = API_URL
    # Keep IP + legacy matanho.* origins during DNS cutover.
    ip_origins = (
        "http://31.220.82.129:3200,"
        "http://31.220.82.129:3210,"
        "http://31.220.82.129:3220,"
        "http://31.220.82.129:3230"
    )
    legacy_origins = (
        "https://matanho.nvccz.com,"
        "https://matanho-lp.nvccz.com,"
        "https://matanho-investee.nvccz.com,"
        "https://matanho-api.nvccz.com"
    )
    lines = {
        "MYSQL_ROOT_PASSWORD": mysql_root,
        "MYSQL_PASSWORD": mysql_pass,
        "JWT_SECRET": jwt,
        "BOOTSTRAP_ADMIN_EMAIL": ADMIN_EMAIL,
        "BOOTSTRAP_ADMIN_PASSWORD": admin_pw,
        "PUBLIC_API_BASE_URL": f"{api}/api",
        "PUBLIC_WS_URL": api,
        "PUBLIC_LP_PORTAL_URL": lp_ui,
        "PUBLIC_INVESTEE_PORTAL_URL": investee_ui,
        "PUBLIC_APPLY_PORTAL_URL": apply_ui,
        "PUBLIC_STAFF_HOST": PUBLIC_STAFF_HOST,
        # Mirror host (NVCCZ frontend on Matanho infrastructure). The staff
        # Traefik router matches this in addition to PUBLIC_STAFF_HOST, so a
        # redeploy does not drop the mirror URL that is handed out to users.
        "PUBLIC_STAFF_HOST_ALT": PUBLIC_STAFF_HOST_ALT,
        "NEXT_PUBLIC_ORGANIZATION_NAME": "NVCCZ",
        # Client branding. docker-compose.prod.yml passes this to every ui-* build
        # as a build arg; without it the UI falls back to Matanho branding.
        "NEXT_PUBLIC_ORGANIZATION_LOGO": "/nvccz-logo.png",
        "CORS_ORIGINS": f"{ui},{lp_ui},{investee_ui},{apply_ui},{legacy_origins},{ip_origins},http://localhost:3001",
        "FRONTEND_URL": ui,
        "LP_PORTAL_BASE_URL": lp_ui,
        "INVESTEE_PORTAL_BASE_URL": investee_ui,
        "BROKER_REPLY_BASE_URL": ui,
        "BASE_URL": f"{api}/api",
        "API_URL": f"{api}/api",
        "COMPANY_NAME_FULL": "National Venture Capital Company of Zimbabwe",
        "COMPANY_NAME_SHORT": "NVCCZ",
        "EMAIL_FROM_NAME": "NVCCZ",
        "NODE_ENV": "production",
        "REMOTE_UPLOAD_SERVICE_URL": "http://upload:3050/upload",
        "REMOTE_MEDIA_INTERNAL_BASE": "http://upload:3050/uploads",
    }
    # Docker Compose env files treat $ as variable interpolation — escape literal dollars.
    return "\n".join(f"{k}={v.replace('$', '$$')}" for k, v in lines.items()) + "\n"


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


BOOTSTRAP_SH = r"""
set -euo pipefail
mkdir -p /var/www/projects/nvccz/{compose,secrets,src/api,src/ui,upload-service}
chmod 700 /var/www/projects/nvccz/secrets
if command -v ufw >/dev/null 2>&1; then
  ufw allow 3200/tcp comment 'nvccz-prod-staff-ui' || true
  ufw allow 3209/tcp comment 'nvccz-prod-api' || true
  ufw allow 3210/tcp comment 'nvccz-prod-lp-ui' || true
  ufw allow 3220/tcp comment 'nvccz-prod-investee-ui' || true
  ufw allow 3230/tcp comment 'nvccz-prod-apply-ui' || true
fi
echo NVCCZ_NTS_BOOTSTRAP_OK
"""

REMOTE_SH = r"""
set -euo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
echo '=== verify checksums ==='
echo "$API_SHA  /tmp/nvccz-api.tgz" | sha256sum -c -
echo "$UI_SHA  /tmp/nvccz-ui.tgz" | sha256sum -c -
echo '=== extract ==='
rm -rf src/api src/ui
mkdir -p src compose secrets
tar -xzf /tmp/nvccz-api.tgz -C src
tar -xzf /tmp/nvccz-ui.tgz -C src
test -f src/api/package.json
test -f src/ui/package.json
test -f upload-service/Dockerfile
echo '=== retire single-UI container ==='
docker rm -f nvccz-prod-ui-1 2>/dev/null || true
echo '=== compose up PROD (staff + lp + investee) ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build
echo '=== waiting for health ==='
for i in $(seq 1 90); do
  ok=0
  curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1 && ok=1 || true
  if [ "$ok" = "1" ]; then break; fi
  sleep 5
done
echo '=== seed portal test users (non-fatal) ==='
docker exec -e UAT_ALLOW_NON_DEV_DB=1 nvccz-prod-api-1 \
  npx ts-node --transpile-only -r dotenv/config scripts/seed-portal-test-users.ts \
  && echo PORTAL_SEED_OK || echo PORTAL_SEED_SKIP
echo '=== status ==='
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps
echo '=== health probes ==='
curl -fsS http://127.0.0.1:3209/health && echo ' PROD_API_OK' || echo ' PROD_API_FAIL'
curl -fsS http://127.0.0.1:3250/health && echo ' PROD_UPLOAD_OK' || echo ' PROD_UPLOAD_FAIL'
for port in 3200 3210 3220 3230; do
  echo "--- :$port ---"
  curl -fsSI -o /tmp/nvccz-h-$port.txt -w '%{http_code} %{url_effective}\n' --max-redirs 0 http://127.0.0.1:$port/login || true
  curl -fsSI -o /tmp/nvccz-r-$port.txt -w '%{http_code} %{url_effective} redirect:%{redirect_url}\n' http://127.0.0.1:$port/ || true
done
echo NVCCZ_NTS_PROD_UP
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        api_path = tmp_path / "nvccz-api.tgz"
        ui_path = tmp_path / "nvccz-ui.tgz"

        print("Packing API...", flush=True)
        api_sha = make_tarball(API_ROOT, "api", api_path)
        print(f"  API {api_path.stat().st_size/1024/1024:.1f} MB sha={api_sha[:12]}", flush=True)
        print("Packing UI...", flush=True)
        ui_sha = make_tarball(UI_ROOT, "ui", ui_path)
        print(f"  UI {ui_path.stat().st_size/1024/1024:.1f} MB sha={ui_sha[:12]}", flush=True)

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting {USER}@{HOST}...", flush=True)
        client.connect(
            HOST,
            port=22,
            username=USER,
            password=PASSWORD,
            timeout=30,
            look_for_keys=False,
            allow_agent=False,
        )

        print("Bootstrapping directories...", flush=True)
        sftp = client.open_sftp()
        with sftp.file(f"{REMOTE_TMP}/nvccz-bootstrap.sh", "w") as f:
            f.write(BOOTSTRAP_SH)
        sftp.chmod(f"{REMOTE_TMP}/nvccz-bootstrap.sh", 0o755)
        sftp.close()
        _, stdout, _ = client.exec_command(f"bash {REMOTE_TMP}/nvccz-bootstrap.sh", timeout=120)
        print(stdout.read().decode())

        sftp = client.open_sftp()

        def put_file(local: Path, remote: str) -> None:
            try:
                sftp.remove(remote)
            except OSError:
                pass
            sftp.put(str(local), remote)
            st = sftp.stat(remote)
            if st.st_size != local.stat().st_size:
                raise OSError(f"upload size mismatch {remote}")

        print("Uploading tarballs...", flush=True)
        put_file(api_path, f"{REMOTE_TMP}/nvccz-api.tgz")
        put_file(ui_path, f"{REMOTE_TMP}/nvccz-ui.tgz")

        def put_text(path: str, text: str, mode: int | None = None) -> None:
            with sftp.file(path, "w") as f:
                f.write(text)
            if mode is not None:
                sftp.chmod(path, mode)

        sftp.put(str(COMPOSE_DIR / "docker-compose.prod.yml"), f"{REMOTE_ROOT}/compose/docker-compose.prod.yml")
        upload_dir = COMPOSE_DIR / "upload-service"
        sftp.put(str(upload_dir / "Dockerfile"), f"{REMOTE_ROOT}/upload-service/Dockerfile")
        sftp.put(str(upload_dir / "server.js"), f"{REMOTE_ROOT}/upload-service/server.js")

        existing_prod = read_remote_env(sftp, f"{REMOTE_ROOT}/secrets/prod.env")

        def pick_secret(existing: dict[str, str] | None, key: str, default: str) -> str:
            if existing and existing.get(key):
                return existing[key]
            return default

        admin_pw = pick_secret(existing_prod, "BOOTSTRAP_ADMIN_PASSWORD", strong_password())
        prod_root = pick_secret(existing_prod, "MYSQL_ROOT_PASSWORD", secrets.token_hex(16))
        prod_pass = pick_secret(existing_prod, "MYSQL_PASSWORD", secrets.token_hex(16))
        prod_jwt = pick_secret(existing_prod, "JWT_SECRET", secrets.token_hex(32))

        put_text(
            f"{REMOTE_ROOT}/secrets/prod.env",
            env_blob(prod_root, prod_pass, prod_jwt, admin_pw),
            0o600,
        )

        remote_sh = f"export API_SHA={api_sha}\nexport UI_SHA={ui_sha}\n" + REMOTE_SH
        put_text(f"{REMOTE_TMP}/nvccz-up.sh", remote_sh, 0o755)
        sftp.close()

        print("Building and starting NVCCZ prod (this will take a while)...", flush=True)
        stdin, stdout, stderr = client.exec_command(f"bash {REMOTE_TMP}/nvccz-up.sh", timeout=7200, get_pty=True)
        for line in stdout:
            print(line, end="", flush=True)
        err = stderr.read().decode("utf-8", errors="replace")
        if err.strip():
            print(err, file=sys.stderr)
        code = stdout.channel.recv_exit_status()

        creds_path = COMPOSE_DIR / "CREDENTIALS.nts-prod.local.md"
        creds_path.write_text(
            f"""# NVCCZ prod on NTS — local only, do not commit

Server: 31.220.82.129
HTTPS via Traefik (Let's Encrypt).

## Admin login

- Email: `{ADMIN_EMAIL}`
- Password: `{admin_pw}`

## URLs (HTTPS)

| Portal | URL |
|--------|-----|
| Apply | {APPLY_URL} |
| Staff | {STAFF_URL} (set `NVCCZ_PUBLIC_STAFF_HOST` when purchased domain is ready) |
| LP | {LP_URL} |
| Investee | {INVESTEE_URL} |
| API | {API_URL}/api |

IP fallback (HTTP): `:3200` / `:3210` / `:3220` / `:3209`

Cookies are `nvccz_*` (not `token`) so Arcus sessions on this IP cannot hijack NVCCZ.

Upload (localhost on server): `127.0.0.1:3250`
Public media: `{API_URL}/api/public-media/...`

## SSH

```
ssh root@31.220.82.129
cd /var/www/projects/nvccz
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps
```

## DNS (GoDaddy nvccz.com)

See `design-refs/nvccz-matanho-domains.md`
""",
            encoding="utf-8",
        )
        print(f"\nCredentials saved to {creds_path}", flush=True)
        print(f"Admin: {ADMIN_EMAIL} / {admin_pw}", flush=True)
        print(f"Apply: {APPLY_URL}", flush=True)
        print(f"Staff: {STAFF_URL}", flush=True)
        print(f"LP: {LP_URL}", flush=True)
        print(f"Investee: {INVESTEE_URL}", flush=True)
        print(f"API: {API_URL}/api", flush=True)

        client.close()
        return code


if __name__ == "__main__":
    raise SystemExit(main())
