"""Deploy the committed backend to the Arcus dev API (dev-api.matanho.com).

Order matters:
  1. build the new image (old container keeps serving)
  2. add users.must_change_password if missing - the committed schema needs it
     and no tracked migration exists yet; without it ensure-admin crash-loops,
     which is exactly what happened on prod
  3. run db:migrate:all from the NEW image against arcus_dev
  4. only if migrations pass, force-recreate the api and assert it runs the new image
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

REMOTE = r"""
set -uo pipefail
ROOT=/var/www/projects/arcus
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml"
done_fail() { echo "$1"; echo DEV_API_COMMITTED_DONE; exit 1; }
echo "=== verify checksum ==="
echo "__SHA__  /tmp/arcus-api-committed.tgz" | sha256sum -c - || done_fail FAILED_CHECKSUM
RUNNING=$(docker inspect arcus-dev-api-1 --format '{{.Image}}')
docker tag "$RUNNING" arcus-dev-api:pre-committed-20260911
echo "  rollback tag arcus-dev-api:pre-committed-20260911 -> $RUNNING"
DBURL=$(docker inspect arcus-dev-api-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -m1 '^DATABASE_URL=' | cut -d= -f2-)
NET=$(docker inspect arcus-dev-mysql-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
echo "  network=$NET db=$(echo "$DBURL" | sed -E 's|://([^:]+):[^@]+@|://\1:<pw>@|')"
[ -n "$DBURL" ] || done_fail FAILED_NO_DATABASE_URL
echo "=== extract committed API source ==="
rm -rf src/api && mkdir -p src && tar -xzf /tmp/arcus-api-committed.tgz -C src
test -f src/api/package.json || done_fail FAILED_EXTRACT
echo "=== build ==="
DOCKER_BUILDKIT=1 $COMPOSE build api || done_fail FAILED_BUILD
BUILT=$(docker image inspect arcus-dev-api:latest --format '{{.Id}}')
echo "  built $BUILT"
echo "=== users.must_change_password on arcus_dev ==="
docker exec -i arcus-dev-mysql-1 sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot -N arcus_dev' <<'SQL'
SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='arcus_dev' AND table_name='users' AND column_name='must_change_password');
SET @ddl := IF(@has = 0, 'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0', 'SELECT ''already present''');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT CONCAT('must_change_password columns: ', COUNT(*)) FROM information_schema.columns WHERE table_schema='arcus_dev' AND table_name='users' AND column_name='must_change_password';
SQL
echo "=== migrate arcus_dev with the NEW image ==="
docker run --rm --network "$NET" --env-file "$ROOT/secrets/dev.env" -e DATABASE_URL="$DBURL" "$BUILT" npm run db:migrate:all
MIG=$?
echo "MIGRATE_EXIT=$MIG"
[ "$MIG" = "0" ] || done_fail "MIGRATIONS_FAILED - not swapping; dev keeps the old API"
echo "=== swap ==="
$COMPOSE up -d --no-deps --force-recreate api
NOW=$(docker inspect arcus-dev-api-1 --format '{{.Image}}')
if [ "$NOW" = "$BUILT" ]; then echo "  IMAGE_MATCH"; else echo "  IMAGE_MISMATCH running=$NOW"; fi
echo "=== health ==="
ok=0
for i in $(seq 1 18); do
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 --resolve dev-api.matanho.com:443:127.0.0.1 https://dev-api.matanho.com/health)
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 10
done
if [ "$ok" = "1" ]; then echo "  DEV_API_OK"; else echo "  DEV_API_FAIL last=$code"; fi
docker inspect arcus-dev-api-1 --format '  restarts={{.RestartCount}} status={{.State.Status}}'
docker logs --tail 12 arcus-dev-api-1 2>&1 | cut -c1-220
echo DEV_API_COMMITTED_DONE
"""


def main() -> int:
    head = subprocess.run(["git", "-C", str(WORKTREE), "log", "-1", "--format=%h %s"], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", str(WORKTREE), "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
    print(f"Deploying committed API {head} to Arcus dev", flush=True)
    if dirty:
        print("Worktree is not clean, refusing:\n" + dirty)
        return 2

    with tempfile.TemporaryDirectory() as td:
        tgz = Path(td) / "arcus-api-committed.tgz"
        sha = mod.make_tarball(WORKTREE, "api", tgz)
        print(f"  {tgz.stat().st_size/1e6:.1f} MB sha256={sha[:16]}...", flush=True)
        cli = mod.connect()
        for attempt in (1, 2, 3):
            try:
                sftp = cli.open_sftp()
                sftp.put(str(tgz), "/tmp/arcus-api-committed.tgz")
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
    cli.exec_command("rm -f /root/.devapicommitted.b64 /root/.devapicommitted.log")[1].channel.recv_exit_status()
    for i in range(0, len(blob), 3000):
        cli.exec_command(f"printf %s {blob[i:i+3000]} >> /root/.devapicommitted.b64")[1].channel.recv_exit_status()
    cli.exec_command(
        "base64 -d /root/.devapicommitted.b64 > /root/.devapicommitted.sh && "
        "setsid nohup bash /root/.devapicommitted.sh > /root/.devapicommitted.log 2>&1 < /dev/null & disown"
    )[1].channel.recv_exit_status()

    print("Running on server (detached; polling) ...", flush=True)
    seen = 0
    deadline = time.time() + 6000
    while time.time() < deadline:
        try:
            _, out, _ = cli.exec_command("cat /root/.devapicommitted.log 2>/dev/null")
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
        if "DEV_API_COMMITTED_DONE" in log:
            cli.close()
            return 0 if ("IMAGE_MATCH" in log and "DEV_API_OK" in log) else 1
        time.sleep(15)
    cli.close()
    print("timed out polling; the remote script keeps running")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
