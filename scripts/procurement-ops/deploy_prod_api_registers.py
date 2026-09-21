"""Promote the committed API to NVCCZ production, running the one migration prod lacks.

Differs from deploy_prod_api_committed.py, which states "No migrations": the range being
promoted (321fcdc..09a19ad) adds db:migrate:procurement-registers, and nvccz_prod has none of
procurement_documents / procurement_contracts / procurement_plans / procurement_plan_items
(probed 12 Sep 2026). Swapping without it would serve Plan, Contracts and Document Vault
against tables that do not exist.

Order, and the swap is gated on every step before it:
  1. build the new image (the old container keeps serving throughout)
  2. tag the running image for rollback
  3. run db:migrate:procurement-registers from the NEW image against nvccz_prod
     (idempotent, CREATE TABLE IF NOT EXISTS, additive only - no drops, no rewrites)
  4. verify all four tables now exist; refuse to swap if any is missing
  5. only then force-recreate the api, assert the running image is the one just built, health-check
"""
import base64
import importlib.util
import subprocess
import sys
import tempfile
import time
from pathlib import Path

SCRIPTS = Path(r"C:\Users\lysp\Downloads\nvccz-new\scripts")
WORKTREE = Path(r"C:\Users\lysp\AppData\Local\Temp\claude\C--Users-lysp-Downloads-nvccz-new\7c49cfe6-797f-48cf-8ebb-c51932c690a5\scratchpad\wt-api")

sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("prod_api_only", SCRIPTS / "deploy-nvccz-nts-prod-api-only.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

TABLES = "procurement_documents procurement_contracts procurement_plans procurement_plan_items"

REMOTE = r"""
set -uo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"
done_fail() { echo "$1"; echo PROD_REGISTERS_DONE; exit 1; }

echo "=== verify checksum ==="
echo "__SHA__  /tmp/nvccz-api-registers.tgz" | sha256sum -c - || done_fail FAILED_CHECKSUM

RUNNING=$(docker inspect nvccz-prod-api-1 --format '{{.Image}}')
docker tag "$RUNNING" nvccz-prod-api:pre-registers-20260912
echo "  rollback tag nvccz-prod-api:pre-registers-20260912 -> $RUNNING"

DBURL=$(docker inspect nvccz-prod-api-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -m1 '^DATABASE_URL=' | cut -d= -f2-)
NET=$(docker inspect nvccz-prod-mysql-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
[ -n "$DBURL" ] || done_fail FAILED_NO_DATABASE_URL
echo "  network=$NET db=$(echo "$DBURL" | sed -E 's|://([^:]+):[^@]+@|://\1:<pw>@|')"

echo "=== extract committed API source ==="
rm -rf src/api && mkdir -p src && tar -xzf /tmp/nvccz-api-registers.tgz -C src
test -f src/api/package.json || done_fail FAILED_EXTRACT

echo "=== build (old container still serving) ==="
DOCKER_BUILDKIT=1 $COMPOSE build api || done_fail FAILED_BUILD
BUILT=$(docker image inspect nvccz-prod-api:latest --format '{{.Id}}')
echo "  built $BUILT"

probe() {
  for t in __TABLES__; do
    n=$(docker exec -i nvccz-prod-mysql-1 sh -c "MYSQL_PWD=\$MYSQL_ROOT_PASSWORD mysql -uroot -N nvccz_prod -e 'SELECT COUNT(*) FROM $t;'" 2>/dev/null)
    if [ -n "$n" ]; then echo "  present  $t rows=$n"; else echo "  absent   $t"; fi
  done
}

echo "=== register tables before ==="
probe

echo "=== migrate nvccz_prod: procurement registers only (idempotent, additive) ==="
docker run --rm --network "$NET" --env-file "$ROOT/secrets/prod.env" -e DATABASE_URL="$DBURL" "$BUILT" npm run db:migrate:procurement-registers
MIG=$?
echo "MIGRATE_EXIT=$MIG"
[ "$MIG" = "0" ] || done_fail "MIGRATIONS_FAILED - not swapping; production keeps the old API"

echo "=== register tables after ==="
MISSING=0
for t in __TABLES__; do
  n=$(docker exec -i nvccz-prod-mysql-1 sh -c "MYSQL_PWD=\$MYSQL_ROOT_PASSWORD mysql -uroot -N nvccz_prod -e 'SELECT COUNT(*) FROM $t;'" 2>/dev/null)
  if [ -n "$n" ]; then echo "  present  $t rows=$n"; else echo "  STILL ABSENT $t"; MISSING=1; fi
done
[ "$MISSING" = "0" ] || done_fail "TABLES_MISSING - not swapping; production keeps the old API"

echo "=== swap ==="
$COMPOSE up -d --no-deps --force-recreate api
NOW=$(docker inspect nvccz-prod-api-1 --format '{{.Image}}')
if [ "$NOW" = "$BUILT" ]; then echo "  IMAGE_MATCH"; else echo "  IMAGE_MISMATCH running=$NOW"; fi

echo "=== health ==="
ok=0
for i in $(seq 1 18); do
  if curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1; then ok=1; break; fi
  sleep 10
done
if [ "$ok" = "1" ]; then echo "  PROD_API_OK"; else echo "  PROD_API_FAIL"; fi
docker inspect nvccz-prod-api-1 --format '  restarts={{.RestartCount}} status={{.State.Status}}'
docker logs --tail 15 nvccz-prod-api-1 2>&1 | cut -c1-220
echo PROD_REGISTERS_DONE
""".replace("__TABLES__", TABLES)


def main() -> int:
    head = subprocess.run(["git", "-C", str(WORKTREE), "log", "-1", "--format=%h %s"], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", str(WORKTREE), "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
    print(f"Promoting committed API {head} to PRODUCTION", flush=True)
    if dirty:
        print("Worktree is not clean, refusing:\n" + dirty)
        return 2

    with tempfile.TemporaryDirectory() as td:
        tgz = Path(td) / "nvccz-api-registers.tgz"
        sha = mod.make_tarball(WORKTREE, "api", tgz)
        print(f"  {tgz.stat().st_size/1e6:.1f} MB sha256={sha[:16]}...", flush=True)
        cli = mod.connect()
        for attempt in (1, 2, 3):
            try:
                sftp = cli.open_sftp()
                sftp.put(str(tgz), "/tmp/nvccz-api-registers.tgz")
                sftp.close()
                print(f"  upload ok (attempt {attempt})", flush=True)
                break
            except Exception as exc:
                print(f"  upload attempt {attempt} failed: {exc}", flush=True)
                if attempt == 3:
                    return 1
                cli.close()
                cli = mod.connect()

    blob = base64.b64encode(REMOTE.replace("__SHA__", sha).encode()).decode()
    cli.exec_command("rm -f /root/.apiregisters.b64 /root/.apiregisters.log")[1].channel.recv_exit_status()
    for i in range(0, len(blob), 3000):
        cli.exec_command(f"printf %s {blob[i:i+3000]} >> /root/.apiregisters.b64")[1].channel.recv_exit_status()
    cli.exec_command(
        "base64 -d /root/.apiregisters.b64 > /root/.apiregisters.sh && "
        "setsid nohup bash /root/.apiregisters.sh > /root/.apiregisters.log 2>&1 < /dev/null & disown"
    )[1].channel.recv_exit_status()

    print("Running on server (detached; polling) ...", flush=True)
    seen = 0
    deadline = time.time() + 3600
    while time.time() < deadline:
        try:
            _, out, _ = cli.exec_command("cat /root/.apiregisters.log 2>/dev/null")
            log = out.read().decode(errors="replace")
        except Exception as exc:
            print(f"  poll failed ({exc}); reconnecting", flush=True)
            time.sleep(15)
            try:
                cli = mod.connect()
            except Exception:
                pass
            continue
        if len(log) > seen:
            sys.stdout.write(log[seen:])
            sys.stdout.flush()
            seen = len(log)
        if "PROD_REGISTERS_DONE" in log:
            cli.close()
            return 0 if ("IMAGE_MATCH" in log and "PROD_API_OK" in log) else 1
        time.sleep(10)
    cli.close()
    print("timed out polling; the remote script keeps running")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
