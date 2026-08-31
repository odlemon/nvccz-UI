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
