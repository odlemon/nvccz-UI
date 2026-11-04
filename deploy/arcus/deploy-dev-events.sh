#!/usr/bin/env bash
set -Eeuo pipefail

# Run on the Singapore dev host after copying changed sources to /opt/arcus-dev.
root=/opt/arcus-dev
compose="$root/compose/docker-compose.yml"
env_file="$root/secrets/dev.env"
lock_file="$root/.events-deploy.lock"

exec 9>"$lock_file"
if ! flock -n 9; then
  echo "An Events dev deployment is already running" >&2
  exit 1
fi

export API_NODE_HEAP_MB=6144
export NODE_HEAP_MB=3072
export COMPOSE_PARALLEL_LIMIT=1

cd "$root"
docker compose -p arcus-dev --env-file "$env_file" -f "$compose" build api
docker compose -p arcus-dev --env-file "$env_file" -f "$compose" build ui-events
docker compose -p arcus-dev --env-file "$env_file" -f "$compose" build ui-staff
docker compose -p arcus-dev --env-file "$env_file" -f "$compose" up -d --no-deps api ui-events ui-staff

for attempt in {1..36}; do
  if curl --fail --silent --show-error http://127.0.0.1:3319/health >/dev/null 2>&1 \
    && curl --fail --silent --show-error http://127.0.0.1:3315/ >/dev/null 2>&1 \
    && curl --fail --silent --show-error http://127.0.0.1:3310/login >/dev/null 2>&1; then
    echo "Events dev deployment healthy"
    exit 0
  fi
  sleep 5
done

echo "Events dev deployment did not become healthy" >&2
exit 1
