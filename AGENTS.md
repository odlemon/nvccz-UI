# NVCCZ / Arcus — Current Task

## Context
Working on SSL/rate limiting across:
- https://investee.nvccz.online/
- http://lp.nvccz.online/
- https://nvccz.online/

## Status (from prior session)
[x] Verify DNS resolution for lp/api/investee.nvccz.online from local
[x] Inspect VPS: nvccz prod + lms-traefik container/cert status
[x] Add lp.nvccz.online A record -> 31.220.82.129 (DNS provider)
[x] Restart lms-traefik to re-issue Let's Encrypt certs (rate limit cleared)
[x] Verify all four nvccz.online portals serve valid SSL (curl -vI)

## Notes (2026-08-30)
- `lms-traefik` restarted; Let's Encrypt rate limits had cleared. After restart, 3 of 4 portals
  (nvccz.online, investee.nvccz.online, lp.nvccz.online) already had valid certs.
- `api.nvccz.online` cert was MISSING because (a) the api router rule included a dead SAN
  `matanho-api.nvccz.com` with no DNS (NXDOMAIN blocked the combined cert), and (b) the
  `nvccz-prod-api-1` container was crash-looping on `Prisma P1000` DB-auth failure, so Traefik
  never kept its router registered -> no cert request -> default cert served.
- Fix applied on server: aligned MySQL `nvccz_prod` user password with the API container's
  `MYSQL_PASSWORD` (from `/var/www/projects/arcus/secrets/prod.env`). API container is now
  `Up (healthy)`. Traefik then issued the `api.nvccz.online` Let's Encrypt cert.
- Source fix: removed dead `matanho-api.nvccz.com` SAN from
  `deploy/nvccz/docker-compose.prod.yml` api router rule (server override already had it).
- `matanho.nvccz.com` (staff portal) and `*.arcus.co.zw` dev/demo routers still fail cert issuance
  due to missing DNS A records (NXDOMAIN) -- out of scope for the four nvccz.online portals.

## Instructions
You have permission to fix the code, push changes, and update whatever is needed to make this work correctly.

## Codex repository guidance

- Read `docs/ai-context/PROJECT_CONTEXT.md` for architecture, source paths, portal boundaries, deployment evidence, and known uncertainty. Update its affected sections after significant architectural changes; do not regenerate it for minor bug fixes.
- Navigate from `app/` routes to `components/`, `lib/` clients/stores, then the sibling backend `C:\Users\lysp\Downloads\nvccz\src/` and `prisma/schema.prisma`. Confirm live versus mock/legacy/versioned implementations before editing.
- Use the package scripts for validation: `npm run build`, `npm run lint`, portal-specific `npm run dev:*`, and targeted Playwright/UAT scripts. Backend tests and Prisma commands belong to the sibling repository. Never run migrations or seeds against production.
- Keep secrets out of source, logs, context documents, commits, screenshots, and responses. Do not expose values from `.env*`, server secret files, JWTs, passwords, API keys, or production data.
- Keep scope focused on the requested module and its documented dependencies. Avoid unrelated refactors or changing deployment topology without explicit authorization.
- Browser verification must target the intended local/UAT portal and use test data. Confirm portal host/build selection when testing cross-portal redirects and auth.
- Deployment verification is read-only unless the user explicitly authorizes an operational change. Prefer health checks, logs, and Host-header requests; do not restart services, alter DNS/TLS, run Compose, migrate databases, or deploy while doing discovery.
- Production is strictly read-only for architecture work. Clearly label confirmed, documented, inferred, and unverified facts.
