#!/usr/bin/env python3
"""Deploy NVCCZ production on the client VPS (102.217.49.126, SSH port 3131, user `user`).

Stack: compose project `nvccz-prod` in /var/www/projects/nvccz (compose/docker-compose.client-vps.yml, secrets/prod.env),
behind the host's shared Traefik (`lms-traefik`, network lms-backend_lms-network). Domains: nvfnvvcz.my.matanho.com (staff),
lp / investee / vendor / events .nvccz.online, nvccz.online (apply), api.nvccz.online.

This is a live client system, so the order matters (same reasoning as deploy-nvccz-nts-prod-api-only.py):
  backup   mysqldump nvccz_prod + tar of the upload volume, into /var/www/projects/nvccz/backups
  upload   git-archive both repos at their committed SHAs; the previous src is kept as src.prev
  build    docker compose build, one image at a time, detached (running containers untouched)
  migrate  sync roles + db:migrate:all + the unregistered migrations, from a THROWAWAY container off the NEW api image
  up       only after migrate passes: recreate the containers on the new images
  verify   health, per-portal pages over HTTPS, logins, CORS preflight, upload round trip
  info     read-only state: deployed SHAs, containers, DB / volume size, disk

The SSH password is read from env NVCCZ_CLIENT_SSH_PASSWORD; the staff admin password for `verify` from env
NVCCZ_PROD_ADMIN_PASSWORD. Neither is stored.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST, PORT, USER = "102.217.49.126", 3131, "user"
ROOT = "/var/www/projects/nvccz"
API_REPO = Path(os.environ.get("ARCUS_API_REPO", r"C:\Users\lysp\Downloads\nvccz"))
UI_REPO = Path(os.environ.get("ARCUS_UI_REPO", r"C:\Users\lysp\Downloads\nvccz-new"))
COMPOSE = f"docker compose -p nvccz-prod --env-file {ROOT}/secrets/prod.env -f {ROOT}/compose/docker-compose.client-vps.yml"
SERVICES = ["upload", "api", "ui-staff", "ui-lp", "ui-investee", "ui-apply", "ui-vendor", "ui-events"]

ARCHIVE_EXCLUDES_API = [":!docs", ":!storage", ":!assets", ":!.github", ":!*.log"]
ARCHIVE_EXCLUDES_UI = [":!design-refs", ":!docs", ":!scripts/_uat", ":!.claude", ":!qa-*", ":!.payroll-dumps*"]

URL = {
    "staff": "https://nvfnvvcz.my.matanho.com",
    "lp": "https://lp.nvccz.online",
    "investee": "https://investee.nvccz.online",
    "apply": "https://nvccz.online",
    "vendor": "https://vendor.nvccz.online",
    "events": "https://events.nvccz.online",
    "api": "https://api.nvccz.online",
}
PAGES = {
    "staff": "/login", "lp": "/login", "investee": "/login", "apply": "/funding-application",
    "vendor": "/vendor-portal", "events": "/",
}


def log(msg: str) -> None:
    print(msg, flush=True)


def connect() -> paramiko.SSHClient:
    pw = os.environ.get("NVCCZ_CLIENT_SSH_PASSWORD")
    if not pw:
        raise SystemExit("Set NVCCZ_CLIENT_SSH_PASSWORD for the client VPS `user` account.")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=pw, timeout=30, banner_timeout=30, auth_timeout=30,
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
        print("[stderr]", err[-4000:], flush=True)
    return stdout.channel.recv_exit_status()


def put_text(sftp: paramiko.SFTPClient, path: str, text: str, mode: int | None = None) -> None:
    with sftp.file(path, "w") as f:
        f.write(text)
    if mode is not None:
        sftp.chmod(path, mode)


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


def stage_info(c):
    return sh(c, f"""
cd {ROOT}
echo "deployed: $(cat DEPLOYED_SHAS 2>/dev/null || echo 'unknown (before this script)')"
docker ps --filter name=nvccz-prod --format '{{{{.Names}}}}  {{{{.Status}}}}'
docker exec nvccz-prod-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "SELECT CONCAT(ROUND(SUM(data_length+index_length)/1048576),\\" MB, \\",COUNT(*),\\" tables\\") FROM information_schema.tables WHERE table_schema=\\"nvccz_prod\\"; SELECT CONCAT(COUNT(*),\\" users\\") FROM nvccz_prod.users"' 2>/dev/null
docker run --rm -v nvccz-prod_nvccz_prod_upload:/d alpine sh -c 'echo "uploads: $(du -sh /d | cut -f1), $(find /d -type f | wc -l) files"'
ls -1 backups 2>/dev/null | tail -4
df -h / | tail -1; free -m | sed -n 2p
""")


def stage_backup(c):
    return sh(c, f"""
set -e
cd {ROOT}; mkdir -p backups; chmod 700 backups
TS=$(date +%Y%m%d-%H%M%S)
echo "== mysqldump nvccz_prod"
docker exec nvccz-prod-mysql-1 sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --set-gtid-purged=OFF nvccz_prod' 2>/dev/null | gzip > backups/nvccz_prod-$TS.sql.gz
test "$(gzip -dc backups/nvccz_prod-$TS.sql.gz | tail -1 | grep -c 'Dump completed')" = "1" || {{ echo "DUMP INCOMPLETE"; exit 1; }}
echo "== upload volume"
docker run --rm -v nvccz-prod_nvccz_prod_upload:/d:ro -v {ROOT}/backups:/b alpine tar -czf /b/uploads-$TS.tgz -C /d .
ls -lh backups/*$TS*
echo BACKUP_OK
""", timeout=3600)


def stage_upload(c):
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        log("Packing committed code...")
        api_sha, api_h = git_archive(API_REPO, ARCHIVE_EXCLUDES_API, t / "api.tgz")
        ui_sha, ui_h = git_archive(UI_REPO, ARCHIVE_EXCLUDES_UI, t / "ui.tgz")
        log(f"  API {api_sha} {(t/'api.tgz').stat().st_size/1e6:.1f} MB | UI {ui_sha} {(t/'ui.tgz').stat().st_size/1e6:.1f} MB")
        sftp = c.open_sftp()
        for name in ("api.tgz", "ui.tgz"):
            sftp.put(str(t / name), f"/tmp/nvccz-prod-{name}")
            if sftp.stat(f"/tmp/nvccz-prod-{name}").st_size != (t / name).stat().st_size:
                raise SystemExit("upload size mismatch " + name)
        for f in ("Dockerfile", "server.js"):
            body = (UI_REPO / "deploy" / "nvccz" / "upload-service" / f).read_bytes().decode("utf-8").replace("\r\n", "\n")
            put_text(sftp, f"/tmp/nvccz-prod-upload-{f}", body)
        sftp.close()
    return sh(c, f"""
set -e
echo "{api_h}  /tmp/nvccz-prod-api.tgz" | sha256sum -c -
echo "{ui_h}  /tmp/nvccz-prod-ui.tgz" | sha256sum -c -
cd {ROOT}
rm -rf src.new; mkdir -p src.new/api src.new/ui
tar -xzf /tmp/nvccz-prod-api.tgz -C src.new/api; tar -xzf /tmp/nvccz-prod-ui.tgz -C src.new/ui
test -f src.new/api/package.json && test -f src.new/ui/package.json
rm -rf src.prev; mv src src.prev; mv src.new src
for f in Dockerfile server.js; do cp /tmp/nvccz-prod-upload-$f upload-service/$f; done
echo "{api_sha} {ui_sha}" > DEPLOYED_SHAS
rm -f /tmp/nvccz-prod-*.tgz /tmp/nvccz-prod-upload-*
echo "UPLOAD_OK api={api_sha} ui={ui_sha} (previous source kept in src.prev)"
""")


def stage_build(c):
    script = f"""
set -e
cd {ROOT}; mkdir -p logs
export COMPOSE_PARALLEL_LIMIT=1 DOCKER_BUILDKIT=1
for svc in {' '.join(SERVICES)}; do
  echo "=== build $svc $(date +%T)"
  {COMPOSE} build --progress=plain $svc > logs/build-$svc.log 2>&1 && echo "OK $svc" || {{ echo "FAILED $svc"; tail -30 logs/build-$svc.log; exit 1; }}
done
echo BUILD_OK
"""
    s = c.open_sftp()
    sh(c, f"mkdir -p {ROOT}/logs")
    put_text(s, f"{ROOT}/logs/build.sh", script, 0o755)
    s.close()
    sh(c, f"cd {ROOT}; rm -f logs/build.out; nohup bash logs/build.sh > logs/build.out 2>&1 & echo started")
    log(f"Build running detached on the server (follow: {ROOT}/logs/build.out).")
    return 0


def stage_build_status(c):
    return sh(c, f"cd {ROOT}; tail -12 logs/build.out")


# Roles come from src/config/hardcodedRoles.ts; several accounting / user-management migrations are not registered with
# db:migrate:all. run-performance-rbac-v2 runs WITHOUT --force on prod: it applies once and then leaves Access edits alone.
MIGRATE = f"""
cd {ROOT}
NET=$(docker inspect nvccz-prod-mysql-1 --format '{{{{range $k,$v := .NetworkSettings.Networks}}}}{{{{$k}}}} {{{{end}}}}' | awk '{{print $1}}')
DBURL=$({COMPOSE} config 2>/dev/null | grep -m1 -oE 'DATABASE_URL: [^ ]+' | cut -d' ' -f2-)
IMG=nvccz-prod-api:latest  # the freshly built tag; `compose images` would name the running (old) container's image
echo "network=$NET image=$IMG db=$(echo "$DBURL" | sed -E 's|://([^:]+):[^@]+@|://\\1:<pw>@|')"
RUN="docker run --rm -i --network $NET --env-file {ROOT}/secrets/prod.env -e DATABASE_URL=$DBURL -e DB_HOST=mysql -e UAT_ALLOW_NON_DEV_DB=1 -e TS_NODE_TRANSPILE_ONLY=1 -e NODE_OPTIONS=--max-old-space-size=3072 --entrypoint"
TS="npx ts-node --transpile-only -r dotenv/config"
FAIL=0
step() {{ echo "=== $*"; $RUN "" $IMG "$@" </dev/null > logs/migrate-step.out 2>&1; rc=$?; tail -4 logs/migrate-step.out; cat logs/migrate-step.out >> logs/migrate.out; [ $rc = 0 ] && echo "OK $*" || {{ echo "FAILED $*"; FAIL=1; }}; }}
: > logs/migrate.out
step npm run sync:roles
step npm run db:migrate:all
grep -E "^(ok|failed|skipped): " logs/migrate.out | tail -3
for m in run-user-management-permission-migration run-nts-p0-migration run-accounting-sweep-migration run-accounting-fiscal-dedupe-migration run-accounting-rbac-migration run-performance-rbac-v2-migration; do
  step $TS scripts/$m.ts
done
echo "MIGRATE_FAIL=$FAIL"
"""


def stage_migrate(c):
    return sh(c, MIGRATE, timeout=5400)


def stage_up(c):
    return sh(c, f"""
cd {ROOT}
{COMPOSE} up -d
for i in $(seq 1 60); do curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1 && break; sleep 5; done
curl -sS http://127.0.0.1:3209/health; echo
{COMPOSE} ps --format '{{{{.Name}}}}  {{{{.Status}}}}'
echo UP_DONE
""", timeout=900)


def curl(args: list[str]) -> tuple[int, str]:
    r = subprocess.run(["curl", "-s", "-m", "30", *args], capture_output=True, text=True)
    return r.returncode, r.stdout


def stage_verify(c=None):
    ok = True

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok
        ok &= cond
        log(f"{'PASS' if cond else 'FAIL'}  {name}" + (f"   - {detail}" if detail and not cond else ""))

    log("-- pages over HTTPS")
    for portal, page in PAGES.items():
        _, code = curl(["-L", "-o", os.devnull, "-w", "%{http_code} %{ssl_verify_result}", URL[portal] + page])
        check(f"{portal:9s} {URL[portal]}{page}", code.startswith("200 0"), code)
    _, body = curl([URL["api"] + "/health"])
    check("api       /health", '"status":"OK"' in body.replace(" ", ""), body[:120])
    _, code = curl(["-o", os.devnull, "-w", "%{http_code} %{redirect_url}", URL["staff"].replace("https", "http")])
    check("http -> https redirect", code.startswith(("301", "302", "307", "308")) and "https://" in code, code)

    log("-- logins")
    accounts = [("lp", "lp.test@nvccz.co.zw", "admin123"), ("investee", "investee.test@nvccz.co.zw", "admin123")]
    admin_pw = os.environ.get("NVCCZ_PROD_ADMIN_PASSWORD")
    if admin_pw:
        accounts = [("staff", "admin@nvccz.co.zw", admin_pw), ("events", "admin@nvccz.co.zw", admin_pw)] + accounts
    else:
        log("  (NVCCZ_PROD_ADMIN_PASSWORD unset: staff/events logins skipped)")
    token = None
    for portal, email, pw in accounts:
        _, out = curl(["-X", "POST", URL["api"] + "/api/auth/login", "-H", "Content-Type: application/json",
                       "-H", f"Origin: {URL[portal]}", "-d", json.dumps({"email": email, "password": pw, "portal": portal})])
        try:
            j = json.loads(out)
        except json.JSONDecodeError:
            j = {}
        tok = j.get("token") or (j.get("data") or {}).get("token")
        check(f"login {portal:8s} {email}", bool(tok), j.get("message") or out[:100])
        if tok and portal == "staff":
            token = tok

    log("-- CORS preflight")
    for portal in ("staff", "lp", "investee", "apply", "vendor", "events"):
        _, out = curl(["-i", "-X", "OPTIONS", URL["api"] + "/api/auth/login", "-H", f"Origin: {URL[portal]}",
                       "-H", "Access-Control-Request-Method: POST"])
        check(f"CORS {portal:9s}", f"access-control-allow-origin: {URL[portal]}".lower() in out.lower())
    _, out = curl(["-i", "-X", "OPTIONS", URL["api"] + "/api/auth/login", "-H", "Origin: https://evil.example",
                   "-H", "Access-Control-Request-Method: POST"])
    check("CORS foreign origin refused", "access-control-allow-origin: https://evil.example" not in out.lower())
    _, out = curl([URL["api"] + "/socket.io/?EIO=4&transport=polling"])
    check("socket.io handshake", out.startswith("0{") and '"sid"' in out, out[:80])

    if c is not None:
        log("-- media storage (upload service, shared volume)")
        rc = sh(c, """
set -e
docker exec nvccz-prod-upload-1 node -e "require('http').get('http://127.0.0.1:3050/health',r=>{console.log('upload health',r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
docker exec nvccz-prod-api-1 sh -c 'test -d /app/storage/local-upload-mock && touch /app/storage/local-upload-mock/.deploy-probe && ls -la /app/storage/local-upload-mock/.deploy-probe >/dev/null && rm /app/storage/local-upload-mock/.deploy-probe && echo api volume writable'
""")
        check("upload service healthy, API sees the shared volume", rc == 0)
    log("ALL PASS" if ok else "SOME CHECKS FAILED")
    return 0 if ok else 1


STAGES = {
    "info": stage_info, "backup": stage_backup, "upload": stage_upload, "build": stage_build,
    "build-status": stage_build_status, "migrate": stage_migrate, "up": stage_up, "verify": stage_verify,
}


def main() -> int:
    stage = sys.argv[1] if len(sys.argv) > 1 else ""
    if stage not in STAGES:
        raise SystemExit(f"usage: {sys.argv[0]} {{{'|'.join(STAGES)}}}")
    c = connect()
    try:
        return STAGES[stage](c)
    finally:
        c.close()


if __name__ == "__main__":
    sys.exit(main())
