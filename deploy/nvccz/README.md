# NVCCZ on 102.217.49.126

Two isolated Docker stacks (separate MySQL, API, UI) on custom ports — no domains, no ports 80/8080.

| Env | UI | API | Database |
|-----|----|-----|----------|
| **dev** | http://102.217.49.126:3100 | http://102.217.49.126:3109/api | `nvccz_dev` |
| **prod** | http://102.217.49.126:3200 | http://102.217.49.126:3209/api | `nvccz_prod` |

## Prod on NTS (HTTPS domains)

**Prod only** on NTS (`31.220.82.129`) — Traefik + Let's Encrypt:

| Portal | Primary URL | Legacy fallback |
|--------|-------------|-----------------|
| **Staff** | https://matanho.nvccz.com | — |
| **LP** | https://lp.nvccz.online | https://matanho-lp.nvccz.com |
| **Investee** | https://investee.nvccz.online | https://matanho-investee.nvccz.com |
| **Apply (public funding)** | https://nvccz.online | https://www.nvccz.online |
| **API** | https://api.nvccz.online/api | — |

IP fallback still open: `:3200` / `:3210` / `:3220` / `3230` / `:3209`.

DNS checklist: [`design-refs/nvccz-matanho-domains.md`](../../design-refs/nvccz-matanho-domains.md).

Staff / LP / investee use separate auth cookies (`nvccz_staff_*`, `nvccz_lp_*`, `nvccz_investee_*`) so they do not share sessions with Arcus on the same IP.

Deploy:

```bash
python scripts/deploy-nvccz-nts-prod.py
```

Credentials: `deploy/nvccz/CREDENTIALS.nts-prod.local.md` (gitignored).

When `102.217.49.126` is back, transfer volumes + `secrets/prod.env` and run `deploy-nvccz-docker-vps.py` on the client server.

Login (both, first boot): `admin@nvccz.co.zw` — password generated on first deploy (see `CREDENTIALS.local.md`, gitignored).

## Server layout

```text
/var/www/projects/nvccz/
  compose/          docker-compose.dev.yml / docker-compose.prod.yml
  secrets/          dev.env / prod.env  (not in git; generated on server)
  src/api/          backend source + Dockerfile
  src/ui/           frontend source + Dockerfile
```

## SSH

```bash
ssh -p 3131 user@102.217.49.126
```

## Deploy from your machine

```bash
# One-time: install Docker + create dirs + UFW rules
python scripts/install-docker-nvccz-vps.py

# Full deploy (API from nvccz repo + UI from this repo)
python scripts/deploy-nvccz-docker-vps.py

# Incremental rebuilds
python scripts/rebuild-nvccz-api.py
python scripts/rebuild-nvccz-ui.py

# Verify login after deploy
python scripts/_nvccz-verify-login.py

# Verify upload/storage service
python scripts/_nvccz-verify-storage.py
```

## Ops on the server

```bash
cd /var/www/projects/nvccz

docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build

docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
docker logs nvccz-dev-api-1 --tail 100
```

## Health checks

- Dev API: `GET http://102.217.49.126:3109/health`
- Prod API: `GET http://102.217.49.126:3209/health`
- Dev UI: `http://102.217.49.126:3100`
- Prod UI: `http://102.217.49.126:3200`

## Firewall (UFW)

Allowed ports only:

| Port | Purpose |
|------|---------|
| 3131 | SSH |
| 3100 | dev UI |
| 3109 | dev API |
| 3200 | prod UI |
| 3209 | prod API |

Ports **80** and **8080** are intentionally not used.

MySQL is bound to localhost only (3317 dev, 3327 prod) for SSH-tunnel DBA access.

## Storage / upload service

Each stack includes an **upload microservice** (same contract as `nvccz/scripts/local-upload-mock-server.ts`):

| Env | Upload (localhost) | API public-media proxy |
|-----|--------------------|-------------------------|
| dev | `127.0.0.1:3150` | `http://102.217.49.126:3109/api/public-media/...` |
| prod | `127.0.0.1:3250` | `http://102.217.49.126:3209/api/public-media/...` |

Inside Docker, the API uses `REMOTE_UPLOAD_SERVICE_URL=http://upload:3050/upload` and shares a volume with the upload container (`/app/storage/local-upload-mock` on API, `/data/uploads` on upload).

Source: [`deploy/nvccz/upload-service/`](upload-service/)

## When domains are ready

1. Point DNS A records at `102.217.49.126`
2. Add nginx/Caddy/Traefik reverse proxy on 443
3. Update `PUBLIC_*` URLs in `secrets/dev.env` and `secrets/prod.env`
4. Rebuild UI images: `python scripts/rebuild-nvccz-ui.py`

## Known server issue

On first access the root filesystem was in **emergency read-only** mode (`emergency_ro`) due to disk I/O errors on `/dev/xvda2`. A reboot cleared it temporarily. If writes fail again, run `fsck -y /dev/xvda2` from recovery/single-user mode and investigate disk health with the hosting provider.
