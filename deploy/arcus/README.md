# Arcus on 31.220.82.129

Two isolated Docker stacks (separate MySQL, API, UI) behind Traefik TLS on port 443.

| Env | UI | API | Database |
|-----|----|-----|----------|
| **dev** | https://dev.arcus.co.zw (staff) | https://dev-api.arcus.co.zw/api | `arcus_dev` |
| **dev LP** | https://dev-lp.arcus.co.zw or http://31.220.82.129:3110 | same API | — |
| **dev Investee** | https://dev-investee.arcus.co.zw or http://31.220.82.129:3120 | same API | — |
| **dev Apply** | https://dev-apply.arcus.co.zw or http://31.220.82.129:3130 | same API | Public funding form |
| **demo** (formerly prod) | https://demo.arcus.co.zw | https://demo-api.arcus.co.zw/api | `arcus_prod` (legacy volume name) |

Login (both, first boot): `admin@nts.com` / `admin123`

TLS is issued by the shared `lms-traefik` container (Let's Encrypt TLS-ALPN on port 443).

## DNS required

| Host | Type | Value |
|------|------|-------|
| `dev.arcus.co.zw` | A | `31.220.82.129` |
| `dev-api.arcus.co.zw` | A | `31.220.82.129` |
| `dev-lp.arcus.co.zw` | A | `31.220.82.129` |
| `dev-investee.arcus.co.zw` | A | `31.220.82.129` |
| `dev-apply.arcus.co.zw` | A | `31.220.82.129` |
| `demo.arcus.co.zw` | A | `31.220.82.129` |
| `demo-api.arcus.co.zw` | A | `31.220.82.129` |

## Layout on the server

```text
/var/www/projects/arcus/
  compose/          docker-compose.dev.yml / docker-compose.demo.yml
  secrets/          dev.env / demo.env  (not in git; generated on server)
  src/api/          backend source + Dockerfile
  src/ui/           frontend source + Dockerfile
  upload-service/   media upload microservice (port 3050 in-container)
```

## Media storage

Each stack runs an **upload sidecar** (same contract as NVCCZ):

| Env | Upload (localhost) | API env |
|-----|------------------|---------|
| **dev** | `127.0.0.1:3050` | `REMOTE_UPLOAD_SERVICE_URL=http://upload:3050/upload` |
| **demo** | `127.0.0.1:3051` | same pattern |

Flow: API receives file → POST to upload service → files on volume `arcus_dev_upload` / `arcus_demo_upload` → browsers fetch via `https://dev-api.arcus.co.zw/api/public-media/{type}/{file}`.

Setup / verify from your machine:

```bash
python scripts/setup-arcus-storage.py      # deploy upload sidecar + wire API
python scripts/_arcus-verify-storage.py     # smoke test dev + demo
python scripts/_arcus-storage-probe.py      # inspect listener on :3050
```

## Ops

```bash
cd /var/www/projects/arcus

docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build
docker compose --env-file secrets/demo.env -f compose/docker-compose.demo.yml up -d --build

docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
docker logs arcus-demo-api-1 --tail 100
```

From the UI repo on your machine:

```bash
python scripts/deploy-arcus-docker-vps.py
python scripts/rebuild-arcus-api.py
```

## Health checks

- Dev API: `GET https://dev-api.arcus.co.zw/health`
- Demo API: `GET https://demo-api.arcus.co.zw/health`
- Dev UI: `https://dev.arcus.co.zw`
- Demo UI: `https://demo.arcus.co.zw`
