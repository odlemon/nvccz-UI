#!/usr/bin/env python3
"""Replicate Arcus Dev (the dev.matanho.com stack) with Docker on the shared Singapore server.

Dev on the old NTS server was: Traefik + compose project `arcus-dev` (mysql arcus_dev, api, upload, six portal UIs),
Matanho branding, default cookie keys, `admin@nts.com` / dev test accounts. This does the same here, except the host's own
nginx (ports 80/443, shared with other projects) replaces Traefik, and every container binds to 127.0.0.1.

Stages (run in order, each safe to repeat):
  prep     8 GB swap safety net (host had none), directories
  upload   git-archive both repos at their committed SHAs, upload with compose, write secrets (kept across runs)
  build    docker compose build, one image at a time, detached on the server
  up       start the stack
  db       empty-database bootstrap: prisma db push (only when the DB has no tables), then every db:migrate:* script
  seed     reference data + dev accounts, the same seeds the dev handbook lists
  nginx    install the seven virtual hosts (plain HTTP)
  certs    certbot --nginx per hostname (hostnames whose DNS does not point here yet are skipped)
  verify   probe each portal: page, login, CORS preflight, redirect  (add `https` once certificates exist)

The SSH password is read from env NVCCZ_SSH_PASSWORD and never stored.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import secrets
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("ARCUS_SG_HOST", "207.180.234.151")
USER = "root"
ROOT = "/opt/arcus-dev"
API_REPO = Path(os.environ.get("ARCUS_API_REPO", r"C:\Users\lysp\Downloads\nvccz"))
UI_REPO = Path(os.environ.get("ARCUS_UI_REPO", r"C:\Users\lysp\Downloads\nvccz-new"))
COMPOSE_DIR = UI_REPO / "deploy" / "arcus"
CREDS = COMPOSE_DIR / "CREDENTIALS.singapore-dev.local.md"

# portal -> (hostname, local port on the server)
PORTALS = {
    "staff": ("dev.matanho.com", 3310),
    "lp": ("dev.lp.matanho.com", 3311),
    "investee": ("dev.investee.matanho.com", 3312),
    "apply": ("dev.apply.matanho.com", 3313),
    "vendor": ("dev.vendor.matanho.com", 3314),
    "events": ("dev.events.matanho.com", 3315),
}
API_HOST, API_PORT = "dev-api.matanho.com", 3319
ALL_HOSTS = [h for h, _ in PORTALS.values()] + [API_HOST]
URL = {k: f"https://{h}" for k, (h, _) in PORTALS.items()}
URL["api"] = f"https://{API_HOST}"

ARCHIVE_EXCLUDES_API = [":!docs", ":!storage", ":!assets", ":!.github", ":!*.log"]
ARCHIVE_EXCLUDES_UI = [":!design-refs", ":!docs", ":!scripts/_uat", ":!.claude", ":!qa-*", ":!.payroll-dumps*"]

# Dev accounts, as documented in design-refs/portal-test-credentials.md and the dev seed scripts.
ACCOUNTS = [
    ("staff", "admin@nts.com", "admin123"),
    ("staff", "perf.sysadmin@nts.local", "admin123"),
    ("staff", "acct.cfo@nts.local", "admin123"),
    ("staff", "proc.mgr@nts.local", "admin123"),
    ("lp", "lp.test@arcus.co.zw", "PortalTest!2026"),
    ("investee", "investee.test@arcus.co.zw", "PortalTest!2026"),
]


def log(msg: str) -> None:
    print(msg, flush=True)


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


def sh(c: paramiko.SSHClient, script: str, timeout: int = 900) -> int:
    stdin, stdout, stderr = c.exec_command("bash -s", timeout=timeout)
    stdin.write(script.replace("\r\n", "\n"))
    stdin.channel.shutdown_write()
    for line in iter(stdout.readline, ""):
        print(line, end="", flush=True)
    err = stderr.read().decode("utf-8", "replace")
    if err.strip():
        print("[stderr]", err, flush=True)
    return stdout.channel.recv_exit_status()


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
            dst.addfile(m, src.extractfile(m) if m.isfile() else None)
    return sha, hashlib.sha256(out.read_bytes()).hexdigest()


def env_blob(existing: dict[str, str]) -> str:
    def keep(k: str, make) -> str:
        return existing.get(k) or make()
    origins = ",".join(URL[k] for k in ("staff", "lp", "investee", "apply", "vendor", "events", "api"))
    lines = {
        "MYSQL_ROOT_PASSWORD": keep("MYSQL_ROOT_PASSWORD", lambda: secrets.token_hex(16)),
        "MYSQL_PASSWORD": keep("MYSQL_PASSWORD", lambda: secrets.token_hex(16)),
        "JWT_SECRET": keep("JWT_SECRET", lambda: secrets.token_hex(32)),
        # BOOTSTRAP_ADMIN_* intentionally unset: deploy/ensure-admin.js then creates dev's admin@nts.com / admin123.
        "PUBLIC_API_BASE_URL": f"{URL['api']}/api",
        "PUBLIC_WS_URL": URL["api"],
        "PUBLIC_LP_PORTAL_URL": URL["lp"],
        "PUBLIC_INVESTEE_PORTAL_URL": URL["investee"],
        "PUBLIC_APPLY_PORTAL_URL": URL["apply"],
        "PUBLIC_VENDOR_PORTAL_URL": URL["vendor"],
        "PUBLIC_EVENTS_PORTAL_URL": URL["events"],
        "VENDOR_PORTAL_BASE_URL": URL["vendor"],
        "CORS_ORIGINS": origins,
        "FRONTEND_URL": URL["staff"],
        "LP_PORTAL_BASE_URL": URL["lp"],
        "INVESTEE_PORTAL_BASE_URL": URL["investee"],
        "BROKER_REPLY_BASE_URL": URL["staff"],
        "BASE_URL": f"{URL['api']}/api",
        "API_URL": f"{URL['api']}/api",
        "NODE_ENV": "production",
        "NODE_HEAP_MB": "3072",
        "REMOTE_UPLOAD_SERVICE_URL": "http://upload:3050/upload",
        "REMOTE_MEDIA_INTERNAL_BASE": "http://upload:3050/uploads",
    }
    return "\n".join(f"{k}={v.replace('$', '$$')}" for k, v in lines.items()) + "\n"


COMPOSE = f"docker compose -p arcus-dev --env-file {ROOT}/secrets/dev.env -f {ROOT}/compose/docker-compose.yml"

PREP = r"""
set -e
echo "== memory before"; free -m | head -3
if ! swapon --show | grep -q nvccz-swap; then
  echo "== adding 8G swap file (the host has none; protects the other projects during builds)"
  fallocate -l 8G /swapfile-nvccz-swap && chmod 600 /swapfile-nvccz-swap && mkswap /swapfile-nvccz-swap >/dev/null && swapon /swapfile-nvccz-swap
  grep -q nvccz-swap /etc/fstab || echo '/swapfile-nvccz-swap none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-nvccz-swap.conf && sysctl -q vm.swappiness=10
fi
mkdir -p /opt/arcus-dev/{compose,secrets,src,upload-service,logs} && chmod 700 /opt/arcus-dev/secrets
docker compose version
free -m | head -3; swapon --show
echo PREP_OK
"""


def stage_prep(c):
    return sh(c, PREP)


def stage_upload(c):
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        log("Packing committed code...")
        api_sha, api_h = git_archive(API_REPO, ARCHIVE_EXCLUDES_API, t / "api.tgz")
        ui_sha, ui_h = git_archive(UI_REPO, ARCHIVE_EXCLUDES_UI, t / "ui.tgz")
        log(f"  API {api_sha} {(t/'api.tgz').stat().st_size/1e6:.1f} MB | UI {ui_sha} {(t/'ui.tgz').stat().st_size/1e6:.1f} MB")
        sftp = c.open_sftp()
        for name in ("api.tgz", "ui.tgz"):
            sftp.put(str(t / name), f"/tmp/arcusdev-{name}")
            if sftp.stat(f"/tmp/arcusdev-{name}").st_size != (t / name).stat().st_size:
                raise SystemExit("upload size mismatch " + name)

        def put_lf(local: Path, remote: str) -> None:  # Windows working copies carry CRLF
            put_text(sftp, remote, local.read_bytes().decode("utf-8").replace(chr(13) + chr(10), chr(10)))
        put_lf(COMPOSE_DIR / "docker-compose.dev-singapore.yml", f"{ROOT}/compose/docker-compose.yml")
        for f in ("Dockerfile", "server.js"):
            put_lf(UI_REPO / "deploy" / "nvccz" / "upload-service" / f, f"{ROOT}/upload-service/{f}")
        existing = parse_env(read_remote(sftp, f"{ROOT}/secrets/dev.env"))
        put_text(sftp, f"{ROOT}/secrets/dev.env", env_blob(existing), 0o600)
        sftp.close()
    return sh(c, f"""
set -e
echo "{api_h}  /tmp/arcusdev-api.tgz" | sha256sum -c -
echo "{ui_h}  /tmp/arcusdev-ui.tgz" | sha256sum -c -
cd {ROOT}; rm -rf src/api src/ui; mkdir -p src/api src/ui
tar -xzf /tmp/arcusdev-api.tgz -C src/api; tar -xzf /tmp/arcusdev-ui.tgz -C src/ui
test -f src/api/package.json && test -f src/ui/package.json
echo "{api_sha} {ui_sha}" > {ROOT}/DEPLOYED_SHAS
rm -f /tmp/arcusdev-api.tgz /tmp/arcusdev-ui.tgz
echo UPLOAD_OK
""")


def stage_build(c):
    script = f"""
set -e
cd {ROOT}
export COMPOSE_PARALLEL_LIMIT=1 DOCKER_BUILDKIT=1
for svc in upload api ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events; do
  echo "=== build $svc $(date +%T) avail: $(free -m | awk 'NR==2{{print $7}}')MB"
  {COMPOSE} build --progress=plain $svc > logs/build-$svc.log 2>&1 && echo "OK $svc" || {{ echo "FAILED $svc"; tail -30 logs/build-$svc.log; exit 1; }}
done
echo BUILD_OK
"""
    s = c.open_sftp()
    put_text(s, f"{ROOT}/logs/build.sh", script, 0o755)
    s.close()
    sh(c, f"cd {ROOT}; rm -f logs/build.out; nohup bash logs/build.sh > logs/build.out 2>&1 & echo started")
    log("Build running detached on the server (logs in /opt/arcus-dev/logs).")
    return 0


def stage_build_status(c):
    return sh(c, f"cd {ROOT}; tail -12 logs/build.out; echo; free -m | head -3; docker images --format '{{{{.Repository}}}}:{{{{.Tag}}}} {{{{.Size}}}}' | grep arcus-dev")


def stage_up(c):
    return sh(c, f"""
set -e
cd {ROOT}
{COMPOSE} up -d
for i in $(seq 1 60); do curl -fsS http://127.0.0.1:{API_PORT}/health >/dev/null 2>&1 && break; sleep 5; done
curl -sS http://127.0.0.1:{API_PORT}/health; echo
{COMPOSE} ps
echo UP_OK
""", timeout=900)


DB_INIT = r"""
set -e
cd /opt/arcus-dev
API=arcus-dev-api-1
T=$(docker exec arcus-dev-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "select count(*) from information_schema.tables where table_schema=\"arcus_dev\"" 2>/dev/null')
echo "tables present: $T"
if [ "${T:-0}" -gt 0 ]; then echo "database is not empty: skipping prisma db push (never push over an existing schema)"; else
  echo "== prisma db push (empty database only)"
  docker exec $API npx prisma db push --skip-generate --accept-data-loss
fi
echo "== db:migrate:all"
docker exec $API npm run db:migrate:all 2>&1 | tail -40
echo "tables now: $(docker exec arcus-dev-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "select count(*) from information_schema.tables where table_schema=\"arcus_dev\"" 2>/dev/null')"
echo DB_OK
"""


def stage_db(c):
    return sh(c, DB_INIT, timeout=3600)


# Reference data first, then the accounts the dev handbook lists, then demo data.
SEEDS = [
    "seed-departments-and-roles.ts", "seed-hardcoded-roles.ts", "seed-cfo-module-permissions.ts",
    "seed-period-lock-permissions.ts", "seed-vat-codes.ts", "seed-expense-categories.ts", "seed-agreement-templates.ts",
    "seed-performance-test-users.ts", "seed-procurement-test-users.ts",
    "seed-portal-test-users.ts", "seed-lp-portal-srd-demo.ts",
    "seed-portfolio-v11-local-demo.ts", "seed-investments-v2-demo-lean.ts", "seed-fpa-client-demo.ts",
    "seed-payroll-v6-baseline.ts", "seed-fundraising-client-demo.ts",
]


def stage_seed(c):
    steps = "\n".join(
        f'echo "--- {s}"; docker exec -e UAT_ALLOW_NON_DEV_DB=1 $API npx ts-node --transpile-only -r dotenv/config scripts/{s} 2>&1 | tail -4; '
        f'[ "${{PIPESTATUS[0]}}" = "0" ] && echo "OK {s}" || echo "(non-fatal) FAILED {s}"' for s in SEEDS)
    return sh(c, f"cd {ROOT}; API=arcus-dev-api-1\n{steps}\necho SEED_DONE", timeout=3600)


def nginx_conf() -> str:
    def block(host: str, port: int, ws: bool, extra: str = "") -> str:
        return f"""
server {{
    listen 80;
    listen [::]:80;
    server_name {host};
    client_max_body_size 80m;{extra}
    location / {{
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $arcusdev_connection_upgrade;
        proxy_read_timeout {300 if ws else 120}s;
    }}
}}
"""
    head = """# Arcus Dev replica (generated by scripts/deploy-arcus-dev-singapore-docker.py). Plain HTTP; `certbot --nginx` adds TLS.
# Own variable name so this cannot collide with a map another project on this host already declared.
map $http_upgrade $arcusdev_connection_upgrade {
    default upgrade;
    ''      close;
}
"""
    out = head + block(API_HOST, API_PORT, True)  # API also serves socket.io (polling then WebSocket) and media
    for host, port in PORTALS.values():
        out += block(host, port, host == PORTALS["staff"][0])
    return out


def stage_nginx(c):
    s = c.open_sftp()
    put_text(s, "/etc/nginx/sites-available/arcus-dev", nginx_conf())
    s.close()
    return sh(c, """
set -e
ln -sf /etc/nginx/sites-available/arcus-dev /etc/nginx/sites-enabled/arcus-dev
nginx -t
systemctl reload nginx
echo NGINX_OK
""")


def stage_certs(c):
    return sh(c, f"""
MYIP={HOST}
for h in {' '.join(ALL_HOSTS)}; do
  ip=$(getent ahostsv4 "$h" | awk 'NR==1{{print $1}}')
  if [ "$ip" = "$MYIP" ]; then
    echo "== certificate for $h"
    certbot --nginx --non-interactive --agree-tos --redirect -d "$h" --keep-until-expiring 2>&1 | tail -4
  else
    echo "== SKIPPED $h: DNS points at '${{ip:-nothing}}', not $MYIP"
  fi
done
nginx -t && systemctl reload nginx
certbot certificates 2>/dev/null | grep -E 'Certificate Name|Expiry' | grep -B1 -A0 -E 'matanho' | head -30
echo CERTS_DONE
""", timeout=900)


# ---------------------------------------------------------------------------------------------- verification
def curl(args: list[str]) -> tuple[int, str]:
    r = subprocess.run(["curl", "-s", "-m", "30", *args], capture_output=True, text=True)
    return r.returncode, r.stdout


def stage_verify(c=None, https: bool = False):
    scheme, port = ("https", 443) if https else ("http", 80)
    ok = True

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok
        ok &= cond
        log(f"{'PASS' if cond else 'FAIL'}  {name}" + (f"   - {detail}" if detail and not cond else ""))

    def req(host: str, path: str, extra: list[str] | None = None) -> tuple[str, str]:
        """(status+headers+body, body) through the server for `host`, bypassing DNS (works before the DNS cutover)."""
        _, out = curl(["-i", "--resolve", f"{host}:{port}:{HOST}", f"{scheme}://{host}{path}", *(extra or [])])
        return out, out.split("\r\n\r\n", 1)[-1]

    log(f"== verify via {scheme.upper()} on {HOST} (DNS bypassed with --resolve)")
    for name, (host, _) in PORTALS.items():
        out, _ = req(host, "/login" if name in ("staff", "lp", "investee") else "/")
        code = out.split(" ", 2)[1] if out.startswith("HTTP") else "?"
        check(f"{name:9s} {host} serves a page", code in ("200", "307", "308"), f"HTTP {code}")
    out, body = req(API_HOST, "/health")
    check(f"api       {API_HOST} /health", '"status":"OK"' in body.replace(" ", "") and "database" in body, body[:120])

    log("-- logins (API) and the response each portal's own audience gets")
    tokens: dict[str, str] = {}
    for portal, email, pw in ACCOUNTS:
        origin = URL[portal]
        payload = json.dumps({"email": email, "password": pw, "portal": portal})
        _, out = curl(["--resolve", f"{API_HOST}:{port}:{HOST}", "-X", "POST", f"{scheme}://{API_HOST}/api/auth/login",
                       "-H", "Content-Type: application/json", "-H", f"Origin: {origin}", "-d", payload])
        try:
            j = json.loads(out)
        except json.JSONDecodeError:
            j = {}
        tok = j.get("token") or (j.get("data") or {}).get("token")
        check(f"login {portal:8s} {email}", bool(tok), (j.get("message") or out[:100]))
        if tok:
            tokens[email] = tok
    # Cross-portal separation: portal accounts must not enter staff and vice versa.
    for portal, email, pw in [("staff", "lp.test@arcus.co.zw", "PortalTest!2026"), ("lp", "admin@nts.com", "admin123")]:
        payload = json.dumps({"email": email, "password": pw, "portal": portal})
        _, out = curl(["--resolve", f"{API_HOST}:{port}:{HOST}", "-X", "POST", f"{scheme}://{API_HOST}/api/auth/login",
                       "-H", "Content-Type: application/json", "-d", payload])
        try:
            j = json.loads(out)
        except json.JSONDecodeError:
            j = {}
        check(f"separation: {email} refused on the {portal} portal", not (j.get("token") or (j.get("data") or {}).get("token")))

    log("-- CORS preflight from every portal origin, and a refused foreign origin")
    for name in ("staff", "lp", "investee", "apply", "vendor", "events"):
        origin = URL[name]
        out, _ = req(API_HOST, "/api/auth/login", ["-X", "OPTIONS", "-H", f"Origin: {origin}",
                                                    "-H", "Access-Control-Request-Method: POST",
                                                    "-H", "Access-Control-Request-Headers: content-type,authorization"])
        low = out.lower()
        check(f"CORS {name:9s} allowed", f"access-control-allow-origin: {origin}".lower() in low
              and "access-control-allow-credentials: true" in low, out.split("\r\n\r\n")[0][:200].replace("\r\n", " | "))
    out, _ = req(API_HOST, "/api/auth/login", ["-X", "OPTIONS", "-H", "Origin: https://evil.example",
                                                "-H", "Access-Control-Request-Method: POST"])
    check("CORS foreign origin is not allowed", "access-control-allow-origin: https://evil.example" not in out.lower())

    log("-- WebSocket path (socket.io polling handshake through the proxy)")
    out, body = req(API_HOST, "/socket.io/?EIO=4&transport=polling")
    check("socket.io handshake", out.startswith("HTTP") and (" 200 " in out.split("\r\n")[0] or "sid" in body), out[:120])
    log("ALL PASS" if ok else "SOME CHECKS FAILED")
    return 0 if ok else 1


STAGES = {"prep": stage_prep, "upload": stage_upload, "build": stage_build, "build-status": stage_build_status,
          "up": stage_up, "db": stage_db, "seed": stage_seed, "nginx": stage_nginx, "certs": stage_certs}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    stage = sys.argv[1] if len(sys.argv) > 1 else ""
    if stage == "verify":
        return stage_verify(https="https" in sys.argv[2:])
    if stage not in STAGES:
        print(__doc__)
        return 2
    c = connect()
    try:
        return STAGES[stage](c) or 0
    finally:
        c.close()


if __name__ == "__main__":
    raise SystemExit(main())
