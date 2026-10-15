import os
import paramiko

host = os.environ.get("DEPLOY_HOST", "109.199.123.21")
password = os.environ["DEPLOY_PASSWORD"]
command = r'''set -e
ROOT=/opt/arcus-dev
mkdir -p "$ROOT/src" "$ROOT/compose" "$ROOT/secrets"
if [ -d "$ROOT/src/ui/.git" ]; then git -C "$ROOT/src/ui" fetch origin staging-accounting-payroll-sweep && git -C "$ROOT/src/ui" checkout staging-accounting-payroll-sweep && git -C "$ROOT/src/ui" reset --hard origin/staging-accounting-payroll-sweep; else git clone --branch staging-accounting-payroll-sweep https://github.com/odlemon/nvccz-UI.git "$ROOT/src/ui"; fi
if [ -d "$ROOT/src/api/.git" ]; then git -C "$ROOT/src/api" fetch origin staging && git -C "$ROOT/src/api" checkout staging && git -C "$ROOT/src/api" reset --hard origin/staging; else git clone --branch staging https://github.com/odlemon/nvccz.git "$ROOT/src/api"; fi
cp "$ROOT/src/ui/deploy/arcus/docker-compose.dev.yml" "$ROOT/compose/docker-compose.dev.yml"
mkdir -p "$ROOT/upload-service"
cp "$ROOT/src/ui/deploy/arcus/upload-service/"* "$ROOT/upload-service/"
docker network inspect arcus-dev-edge >/dev/null 2>&1 || docker network create arcus-dev-edge >/dev/null
cd "$ROOT"
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml config --quiet
for service in upload api ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events; do
  echo "Building $service"
  COMPOSE_BAKE=false docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml build "$service"
done
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d
docker compose --project-name arcus-dev --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
curl -fsS -o /dev/null -w 'api:%{http_code}\n' http://127.0.0.1:3109/health
curl -fsS -o /dev/null -w 'staff:%{http_code}\n' http://127.0.0.1:3100/login
'''
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username="root", password=password, timeout=45, look_for_keys=False, allow_agent=False)
_, out, err = client.exec_command(command, get_pty=False)
for line in out:
    print(line, end="")
code = out.channel.recv_exit_status()
errors = err.read().decode(errors="replace")
if errors:
    print(errors, end="")
client.close()
raise SystemExit(code)
