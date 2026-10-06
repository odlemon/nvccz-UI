#!/usr/bin/env python3
"""Deploy the NVCCZ platform (API + 6 portals + MySQL + upload service) with Docker onto the shared Singapore server.

Stages (run in order, each safe to repeat):
  prep     swap safety net, directories, firewall untouched
  upload   git-archive both repos at their committed SHAs, upload with compose/nginx/upload-service, write secrets
  build    docker compose build, one image at a time (the host is shared, 12 GB, no swap before `prep`)
  up       start the stack
  db       empty-database bootstrap: prisma db push, then every db:migrate:* script
  seed     reference data + portal logins, passwords re-hashed to generated strong ones
  nginx    install the virtual hosts (plain HTTP)
  certs    certbot --nginx per hostname (needs the DNS records to point at this server first)
  verify   probe every portal through nginx

Credentials: SSH password from env NVCCZ_SSH_PASSWORD (never stored). Generated app passwords land only in
deploy/nvccz/CREDENTIALS.singapore.local.md (gitignored) and on the server in /opt/nvccz/secrets (0600).
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import secrets
import string
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

HOST = os.environ.get("NVCCZ_SG_HOST", "207.180.234.151")
USER = "root"
ROOT = "/opt/nvccz"
API_REPO = Path(os.environ.get("NVCCZ_API_REPO", r"C:\Users\lysp\Downloads\nvccz"))
UI_REPO = Path(os.environ.get("NVCCZ_UI_REPO", r"C:\Users\lysp\Downloads\nvccz-new"))
COMPOSE_DIR = UI_REPO / "deploy" / "nvccz"
CREDS = COMPOSE_DIR / "CREDENTIALS.singapore.local.md"

STAFF_HOST = os.environ.get("NVCCZ_PUBLIC_STAFF_HOST", "nvfnvvcz.my.matanho.com")
URLS = {
    "staff": f"https://{STAFF_HOST}",
    "apply": "https://nvccz.online",
    "lp": "https://lp.nvccz.online",
    "investee": "https://investee.nvccz.online",
    "vendor": "https://vendor.nvccz.online",
    "events": "https://events.nvccz.online",
    "api": "https://api.nvccz.online",
}
HOSTS = ["nvccz.online", "lp.nvccz.online", "investee.nvccz.online", "vendor.nvccz.online",
         "events.nvccz.online", "api.nvccz.online", STAFF_HOST]
# host name -> local port, for `verify`
PORTS = {"api": 3209, "staff": 3200, "lp": 3210, "investee": 3220, "apply": 3230, "vendor": 3240, "events": 3260}
ADMIN_EMAIL = "admin@nvccz.co.zw"

ARCHIVE_EXCLUDES_API = [":!docs", ":!storage", ":!assets", ":!.github", ":!*.log"]
ARCHIVE_EXCLUDES_UI = [":!design-refs", ":!docs", ":!scripts/_uat", ":!.claude", ":!qa-*", ":!.payroll-dumps*"]


def log(msg: str) -> None:
    print(msg, flush=True)


def strong(length: int = 24) -> str:
    # No $ (compose interpolation) and no shell-hostile characters.
    alphabet = string.ascii_letters + string.digits + "-_=+%"
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.islower() for c in pw) and any(c.isupper() for c in pw) and any(c.isdigit() for c in pw):
            return pw


def connect() -> paramiko.SSHClient:
    pw = os.environ.get("NVCCZ_SSH_PASSWORD")
    if not pw:
        raise SystemExit("Set NVCCZ_SSH_PASSWORD for the server's root account.")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=pw, timeout=30, banner_timeout=30, auth_timeout=30,
              look_for_keys=False, allow_agent=False)
    c.get_transport().set_keepalive(20)
    return c


def sh(c: paramiko.SSHClient, script: str, timeout: int = 900, echo: bool = True) -> tuple[int, str]:
    """Run a bash script on the server, streaming output."""
    stdin, stdout, stderr = c.exec_command("bash -s", timeout=timeout, get_pty=False)
    stdin.write(script.replace("\r\n", "\n"))
    stdin.channel.shutdown_write()
    out = []
    for line in iter(stdout.readline, ""):
        out.append(line)
        if echo:
            print(line, end="", flush=True)
    err = stderr.read().decode("utf-8", "replace")
    if err.strip() and echo:
        print("[stderr]", err, flush=True)
    return stdout.channel.recv_exit_status(), "".join(out)


def put_text(sftp: paramiko.SFTPClient, path: str, text: str, mode: int | None = None) -> None:
    with sftp.file(path, "w") as f:
        f.write(text)
    if mode is not None:
        sftp.chmod(path, mode)


def read_remote(sftp: paramiko.SFTPClient, path: str) -> str | None:
    try:
        with sftp.file(path, "r") as f:
            return f.read().decode("utf-8", "replace")
    except OSError:
        return None


def parse_env(text: str | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in (text or "").splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def git_archive(repo: Path, excludes: list[str], out: Path) -> tuple[str, str]:
    dirty = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout.strip()
    if dirty:
        raise SystemExit(f"{repo} has uncommitted changes; deploy committed code only (commit or stash first).")
    sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=repo, capture_output=True, text=True).stdout.strip()
    tar_bytes = subprocess.run(["git", "archive", "--format=tar", "HEAD", "--", ".", *excludes], cwd=repo,
                               capture_output=True, check=True).stdout
    with tarfile.open(out, "w:gz") as dst, tarfile.open(fileobj=io.BytesIO(tar_bytes)) as src:
        for m in src:
            f = src.extractfile(m) if m.isfile() else None
            dst.addfile(m, f)
    h = hashlib.sha256(out.read_bytes()).hexdigest()
    return sha, h


def env_blob(existing: dict[str, str]) -> tuple[str, dict[str, str]]:
    def keep(k: str, make) -> str:
        return existing.get(k) or make()
    secrets_ = {
        "MYSQL_ROOT_PASSWORD": keep("MYSQL_ROOT_PASSWORD", lambda: secrets.token_hex(16)),
        "MYSQL_PASSWORD": keep("MYSQL_PASSWORD", lambda: secrets.token_hex(16)),
        "JWT_SECRET": keep("JWT_SECRET", lambda: secrets.token_hex(32)),
        "BOOTSTRAP_ADMIN_PASSWORD": keep("BOOTSTRAP_ADMIN_PASSWORD", strong),
        "NVCCZ_STAFF_PASSWORD": keep("NVCCZ_STAFF_PASSWORD", strong),
        "NVCCZ_PORTAL_PASSWORD": keep("NVCCZ_PORTAL_PASSWORD", strong),
    }
    api = URLS["api"]
    origins = ",".join([URLS["staff"], URLS["apply"], URLS["lp"], URLS["investee"], URLS["vendor"], URLS["events"],
                        "https://www.nvccz.online"])
    lines = {
        **secrets_,
        "BOOTSTRAP_ADMIN_EMAIL": ADMIN_EMAIL,
        "PUBLIC_API_BASE_URL": f"{api}/api",
        "PUBLIC_WS_URL": api,
        "PUBLIC_LP_PORTAL_URL": URLS["lp"],
        "PUBLIC_INVESTEE_PORTAL_URL": URLS["investee"],
        "PUBLIC_APPLY_PORTAL_URL": URLS["apply"],
        "PUBLIC_VENDOR_PORTAL_URL": URLS["vendor"],
        "PUBLIC_EVENTS_PORTAL_URL": URLS["events"],
        "VENDOR_PORTAL_BASE_URL": URLS["vendor"],
        "NEXT_PUBLIC_ORGANIZATION_NAME": "NVCCZ",
        "NEXT_PUBLIC_ORGANIZATION_LOGO": "/nvccz-logo.png",
        "CORS_ORIGINS": origins,
        "FRONTEND_URL": URLS["staff"],
        "LP_PORTAL_BASE_URL": URLS["lp"],
        "INVESTEE_PORTAL_BASE_URL": URLS["investee"],
        "BROKER_REPLY_BASE_URL": URLS["staff"],
        "BASE_URL": f"{api}/api",
        "API_URL": f"{api}/api",
        "COMPANY_NAME_FULL": "National Venture Capital Company of Zimbabwe",
        "COMPANY_NAME_SHORT": "NVCCZ",
        "EMAIL_FROM_NAME": "NVCCZ",
        "NODE_ENV": "production",
        "NODE_HEAP_MB": "3072",
        "REMOTE_UPLOAD_SERVICE_URL": "http://upload:3050/upload",
        "REMOTE_MEDIA_INTERNAL_BASE": "http://upload:3050/uploads",
    }
    # Compose env files treat $ as interpolation.
    return "\n".join(f"{k}={v.replace('$', '$$')}" for k, v in lines.items()) + "\n", secrets_


COMPOSE = f"docker compose -p nvccz-sg --env-file {ROOT}/secrets/prod.env -f {ROOT}/compose/docker-compose.yml"

# ------------------------------------------------------------------------------------------------ stages
PREP = r"""
set -e
echo "== memory before"; free -m | head -3
if ! swapon --show | grep -q nvccz-swap; then
  echo "== adding 8G swap file (host has none; protects the other projects during builds)"
  fallocate -l 8G /swapfile-nvccz-swap && chmod 600 /swapfile-nvccz-swap && mkswap /swapfile-nvccz-swap >/dev/null && swapon /swapfile-nvccz-swap
  grep -q nvccz-swap /etc/fstab || echo '/swapfile-nvccz-swap none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-nvccz-swap.conf && sysctl -q vm.swappiness=10
fi
mkdir -p /opt/nvccz/{compose,secrets,src,upload-service,logs} && chmod 700 /opt/nvccz/secrets
docker compose version
echo "== memory after"; free -m | head -3; swapon --show
echo PREP_OK
"""


def stage_prep(c):
    code, _ = sh(c, PREP)
    return code


def stage_upload(c):
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        log("Packing committed code...")
        api_sha, api_h = git_archive(API_REPO, ARCHIVE_EXCLUDES_API, t / "api.tgz")
        ui_sha, ui_h = git_archive(UI_REPO, ARCHIVE_EXCLUDES_UI, t / "ui.tgz")
        log(f"  API {api_sha} {(t/'api.tgz').stat().st_size/1e6:.1f} MB | UI {ui_sha} {(t/'ui.tgz').stat().st_size/1e6:.1f} MB")
        sftp = c.open_sftp()
        for name in ("api.tgz", "ui.tgz"):
            sftp.put(str(t / name), f"/tmp/nvccz-{name}")
            if sftp.stat(f"/tmp/nvccz-{name}").st_size != (t / name).stat().st_size:
                raise SystemExit("upload size mismatch " + name)
        # Windows working copies carry CRLF; normalise so nginx, compose and Dockerfiles see plain LF.
        def put_lf(local: Path, remote: str) -> None:
            put_text(sftp, remote, local.read_bytes().decode("utf-8").replace(chr(13) + chr(10), chr(10)))
        put_lf(COMPOSE_DIR / "docker-compose.singapore.yml", f"{ROOT}/compose/docker-compose.yml")
        put_lf(COMPOSE_DIR / "nginx-nvccz.conf", f"{ROOT}/compose/nginx-nvccz.conf")
        for f in ("Dockerfile", "server.js"):
            put_lf(COMPOSE_DIR / "upload-service" / f, f"{ROOT}/upload-service/{f}")
        existing = parse_env(read_remote(sftp, f"{ROOT}/secrets/prod.env"))
        blob, sec = env_blob(existing)
        put_text(sftp, f"{ROOT}/secrets/prod.env", blob, 0o600)
        sftp.close()
    code, _ = sh(c, f"""
set -e
echo "{api_h}  /tmp/nvccz-api.tgz" | sha256sum -c -
echo "{ui_h}  /tmp/nvccz-ui.tgz" | sha256sum -c -
cd {ROOT}; rm -rf src/api src/ui; mkdir -p src/api src/ui
tar -xzf /tmp/nvccz-api.tgz -C src/api; tar -xzf /tmp/nvccz-ui.tgz -C src/ui
test -f src/api/package.json && test -f src/ui/package.json
echo "{api_sha} {ui_sha}" > {ROOT}/DEPLOYED_SHAS
rm -f /tmp/nvccz-api.tgz /tmp/nvccz-ui.tgz
echo UPLOAD_OK
""")
    CREDS.write_text(creds_md(sec), encoding="utf-8")
    log(f"Credentials written to {CREDS} (gitignored)")
    return code


def stage_build(c):
    script = f"""
set -e
cd {ROOT}
export COMPOSE_PARALLEL_LIMIT=1 DOCKER_BUILDKIT=1
for svc in upload api ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events; do
  echo "=== build $svc $(date +%T) free: $(free -m | awk 'NR==2{{print $7}}')MB avail"
  {COMPOSE} build --progress=plain $svc > logs/build-$svc.log 2>&1 && echo "OK $svc" || {{ echo "FAILED $svc"; tail -30 logs/build-$svc.log; exit 1; }}
done
echo BUILD_OK
"""
    # run detached on the server so a dropped SSH session cannot kill a half-finished build
    put = c.open_sftp()
    put_text(put, f"{ROOT}/logs/build.sh", script, 0o755)
    put.close()
    sh(c, f"cd {ROOT}; nohup bash logs/build.sh > logs/build.out 2>&1 & echo started")
    log("Build running detached. Poll with: python scripts/deploy-nvccz-singapore-docker.py build-status")
    return 0


def stage_build_status(c):
    code, out = sh(c, f"cd {ROOT}; tail -15 logs/build.out; echo; free -m | head -3; docker images --format '{{{{.Repository}}}}:{{{{.Tag}}}} {{{{.Size}}}}' | grep nvccz | head")
    return 0


def stage_up(c):
    code, _ = sh(c, f"""
set -e
cd {ROOT}
{COMPOSE} up -d
echo "waiting for the API..."
for i in $(seq 1 60); do curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1 && break; sleep 5; done
curl -sS http://127.0.0.1:3209/health; echo
{COMPOSE} ps
echo UP_OK
""", timeout=900)
    return code


DB_INIT = r"""
set -e
cd /opt/nvccz
API=nvccz-sg-api-1
T=$(docker exec nvccz-sg-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "select count(*) from information_schema.tables where table_schema=\"nvccz_prod\"" 2>/dev/null')
echo "tables present: $T"
if [ "${T:-0}" -gt 0 ]; then echo "database is not empty: skipping prisma db push (never push over an existing schema)"; else
  echo "== prisma db push (empty database only)"
  docker exec $API npx prisma db push --skip-generate --accept-data-loss
fi
echo "== db:migrate:all"
docker exec $API npm run db:migrate:all 2>&1 | tail -40
echo DB_OK
"""


def stage_db(c):
    code, _ = sh(c, DB_INIT, timeout=3600)
    return code


SEEDS = [
    "seed-departments-and-roles.ts",
    "seed-hardcoded-roles.ts",
    "seed-cfo-module-permissions.ts",
    "seed-period-lock-permissions.ts",
    "seed-vat-codes.ts",
    "seed-expense-categories.ts",
    "seed-agreement-templates.ts",
    "seed-performance-test-users.ts",
    "seed-procurement-test-users.ts",
    "seed-portal-test-users.ts",
]

REHASH_JS = r"""
const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcrypt');
(async () => {
  const p = new PrismaClient();
  const staff = process.env.STAFF_PW, portal = process.env.PORTAL_PW;
  const users = await p.user.findMany({ select: { id: true, email: true } });
  let n = 0;
  for (const u of users) {
    const e = String(u.email || '').toLowerCase();
    let pw = null;
    if (e === 'admin@nvccz.co.zw') continue;                       // bootstrap admin keeps its own password
    if (e.endsWith('@nts.local')) pw = staff;                      // seeded staff roles (perf./acct./proc./payroll.)
    else if (e === 'lp.test@arcus.co.zw' || e === 'investee.test@arcus.co.zw') pw = portal;
    if (!pw) continue;
    await p.user.update({ where: { id: u.id }, data: { password: await bcrypt.hash(pw, 10) } }); n++;
  }
  console.log('passwords reset for', n, 'seeded users');
  await p.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
"""


def stage_seed(c):
    sftp = c.open_sftp()
    env = parse_env(read_remote(sftp, f"{ROOT}/secrets/prod.env"))
    put_text(sftp, "/tmp/nvccz-rehash.js", REHASH_JS)
    sftp.close()
    steps = "\n".join(
        f"""echo "--- {s}"; docker exec -e UAT_ALLOW_NON_DEV_DB=1 $API npx ts-node --transpile-only -r dotenv/config scripts/{s} 2>&1 | tail -6 || echo "(non-fatal) {s} failed" """
        for s in SEEDS)
    code, _ = sh(c, f"""
cd {ROOT}; API=nvccz-sg-api-1
{steps}
echo "--- re-hash seeded passwords"
docker cp /tmp/nvccz-rehash.js $API:/app/_rehash.js
docker exec -e STAFF_PW='{env["NVCCZ_STAFF_PASSWORD"].replace("$$", "$")}' -e PORTAL_PW='{env["NVCCZ_PORTAL_PASSWORD"].replace("$$", "$")}' $API node /app/_rehash.js
docker exec $API rm -f /app/_rehash.js; rm -f /tmp/nvccz-rehash.js
echo SEED_OK
""", timeout=1800)
    return code


def stage_nginx(c):
    code, _ = sh(c, f"""
set -e
cp {ROOT}/compose/nginx-nvccz.conf /etc/nginx/sites-available/nvccz
ln -sf /etc/nginx/sites-available/nvccz /etc/nginx/sites-enabled/nvccz
nginx -t
systemctl reload nginx
echo NGINX_OK
""")
    return code


def stage_certs(c):
    # Only hostnames that already resolve to this server can be validated.
    lines = []
    for h in HOSTS + ["www.nvccz.online"]:
        lines.append(h)
    hostlist = " ".join(lines)
    code, _ = sh(c, f"""
MYIP={HOST}
ok=""; skipped=""
for h in {hostlist}; do
  ip=$(getent ahostsv4 "$h" | awk 'NR==1{{print $1}}')
  if [ "$ip" = "$MYIP" ]; then ok="$ok $h"; else skipped="$skipped $h($ip)"; fi
done
echo "ready for certificates:$ok"; echo "DNS not pointing here yet:$skipped"
for h in $ok; do
  extra=""
  [ "$h" = "nvccz.online" ] && echo "$ok" | grep -q www.nvccz.online && extra="-d www.nvccz.online"
  [ "$h" = "www.nvccz.online" ] && continue
  certbot --nginx --non-interactive --agree-tos --redirect -d "$h" $extra --keep-until-expiring 2>&1 | tail -4
done
nginx -t && systemctl reload nginx
certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry' | grep -iE 'nvccz|matanho.com'
echo CERTS_DONE
""", timeout=900)
    return code


def stage_verify(c):
    probe = " ; ".join(
        f"printf '%-9s :%s  ' {n} {p}; curl -s -o /dev/null -w '%{{http_code}}\\n' -m 20 http://127.0.0.1:{p}{'/health' if n == 'api' else '/login'}"
        for n, p in PORTS.items())
    host_probe = " ; ".join(
        f"printf '%-26s ' {h}; curl -s -o /dev/null -w '%{{http_code}}\\n' -m 20 -H 'Host: {h}' http://127.0.0.1/{'health' if h.startswith('api.') else 'login'}"
        for h in HOSTS)
    code, _ = sh(c, f"echo '--- containers direct'; {probe}; echo '--- through nginx (Host header)'; {host_probe}")
    return code


def creds_md(sec: dict[str, str]) -> str:
    return f"""# NVCCZ on the Singapore server (207.180.234.151) — local only, do not commit

## Logins
| Where | Email | Password |
|---|---|---|
| Staff (admin) | `{ADMIN_EMAIL}` | `{sec['BOOTSTRAP_ADMIN_PASSWORD']}` |
| Staff (seeded roles: perf.*, acct.*, proc.*, payroll.* @nts.local) | e.g. `perf.sysadmin@nts.local` | `{sec['NVCCZ_STAFF_PASSWORD']}` |
| LP portal | `lp.test@arcus.co.zw` | `{sec['NVCCZ_PORTAL_PASSWORD']}` |
| Investee portal | `investee.test@arcus.co.zw` | `{sec['NVCCZ_PORTAL_PASSWORD']}` |

Apply, vendor and events portals are public (no login).

## URLs
{chr(10).join(f"- {k}: {v}" for k, v in URLS.items())}

## Server
`ssh root@{HOST}` — stack in `{ROOT}` (compose project `nvccz-sg`), MySQL on 127.0.0.1:3327, secrets in `{ROOT}/secrets/prod.env`.
"""


STAGES = {"prep": stage_prep, "upload": stage_upload, "build": stage_build, "build-status": stage_build_status,
          "up": stage_up, "db": stage_db, "seed": stage_seed, "nginx": stage_nginx, "certs": stage_certs,
          "verify": stage_verify}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if len(sys.argv) < 2 or sys.argv[1] not in STAGES:
        print(__doc__)
        print("stages:", ", ".join(STAGES))
        return 2
    c = connect()
    try:
        return STAGES[sys.argv[1]](c) or 0
    finally:
        c.close()


if __name__ == "__main__":
    raise SystemExit(main())
