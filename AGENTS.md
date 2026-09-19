# NVCCZ / Arcus

## Deployment policy — no direct file transfer, ever

Deploying by copying files from this machine straight to a server (via scp, sftp, rsync, paramiko, tar-and-upload, `vercel --prod` from local, or any similar direct transfer) is forbidden. This has caused multi-gigabyte accidental uploads before (a single missed build-output folder turned into an 869 MB–1.8 GB tarball upload) and must not happen again in any form, intentional or accidental.

The only allowed deployment flow is:
1. Commit and push the change to GitHub.
2. The server pulls from GitHub itself (`git fetch` + `git reset --hard origin/<branch>`), over SSH — triggered either by a GitHub Action or a script run on the server.
3. The server builds/installs/compiles in place, using its own CPU and disk — never a build produced locally and shipped over.
4. The server restarts the service (pm2 reload / systemctl restart / docker compose up) and the deploy script verifies the app actually answers before declaring success.

Don't let large assets exist to be uploaded in the first place:
- Never commit or ship `node_modules`, `.git`, `dist`, `coverage`, or any build output directory (`.next`, `.next-*`, `out`, etc.) — these are always rebuilt on the server, never transferred.
- `.gitignore` must exclude all of these, matched by pattern (e.g. `.next*`) not by hardcoding each name, so a newly-named build variant can't slip through.
- If a task genuinely requires moving a large binary asset to a server, stop and ask the user explicitly before transferring it — don't fold it into a routine deploy.

# NVCCZ / Arcus — Current Task (prior session log, below)

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
