# Arcus on 31.220.82.129

Two isolated Docker stacks (separate MySQL, API, UI) behind Traefik TLS on port 443.

| Env | UI | API | Database |
|-----|----|-----|----------|
| **dev** | https://dev.arcus.co.zw | https://dev-api.arcus.co.zw/api | `arcus_dev` |
| **demo** (formerly prod) | https://demo.arcus.co.zw | https://demo-api.arcus.co.zw/api | `arcus_prod` (legacy volume name) |

Login (both, first boot): `admin@nts.com` / `admin123`

TLS is issued by the shared `lms-traefik` container (Let's Encrypt TLS-ALPN on port 443).

## DNS required

| Host | Type | Value |
|------|------|-------|
| `dev.arcus.co.zw` | A | `31.220.82.129` |
| `dev-api.arcus.co.zw` | A | `31.220.82.129` |
| `demo.arcus.co.zw` | A | `31.220.82.129` |
| `demo-api.arcus.co.zw` | A | `31.220.82.129` |

## Layout on the server

```text
/var/www/projects/arcus/
  compose/          docker-compose.dev.yml / docker-compose.demo.yml
  secrets/          dev.env / demo.env  (not in git; generated on server)
  src/api/          backend source + Dockerfile
  src/ui/           frontend source + Dockerfile
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
