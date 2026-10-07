# Arcus Dev replica on the Singapore server (207.180.234.151)

The dev stack (`dev.matanho.com` family) that ran on the NTS server (`31.220.82.129`), rebuilt with Docker on the shared
Singapore host. Same services, `arcus_dev` database, Matanho branding, default cookie keys and dev accounts as
`deploy/arcus/docker-compose.dev.yml`. The host nginx (ports 80/443, shared with other projects) replaces Traefik, and every
container binds to `127.0.0.1`. Not to be confused with the client production stack (`nvccz.online`, `nvfnvvcz.my.matanho.com`).

Deploy with `scripts/deploy-arcus-dev-singapore-docker.py <stage>` (`prep, upload, build, up, db, seed, nginx, certs`, then
`verify [https]`); the SSH password comes from `NVCCZ_SSH_PASSWORD`. Server layout: `/opt/arcus-dev`, compose project `arcus-dev`.

| Hostname | Portal | localhost port |
|---|---|---|
| `dev.matanho.com` | Staff | 3310 |
| `dev.lp.matanho.com` | LP | 3311 |
| `dev.investee.matanho.com` | Investee | 3312 |
| `dev.apply.matanho.com` | Apply (public) | 3313 |
| `dev.vendor.matanho.com` | Vendor (public) | 3314 |
| `dev.events.matanho.com` | Events (public) | 3315 |
| `dev-api.matanho.com` | API, socket.io, media | 3319 |

## DNS cutover (GoDaddy, zone `matanho.com`, TTL 600 s)

Change these A records from `31.220.82.129` to **`207.180.234.151`**: `dev`, `dev-api`, `dev.lp`, `dev.investee`, `dev.apply`,
`dev.vendor`, `dev.events`. Then run the `certs` stage: one Let's Encrypt certificate per hostname via `certbot --nginx`
(HTTP-01 on port 80), with the HTTP to HTTPS redirect. Hostnames not yet pointing here are skipped and reported.

## Accounts (dev conventions, see `portal-test-credentials.md`)

Staff `admin@nts.com` / `admin123` and the seeded staff roles (`perf.*`, `acct.*`, `proc.*`, `payroll.*` @nts.local, `admin123`);
LP `lp.test@arcus.co.zw` and investee `investee.test@arcus.co.zw` (`admin123` on this replica: the seed stage passes
`PORTAL_TEST_PASSWORD`; other environments keep `PortalTest!2026`); events uses the staff `admin@nts.com` login; vendor portal at
`https://dev.vendor.matanho.com/vendor-portal`, funding application at `https://dev.apply.matanho.com/funding-application`; LP SRD demo `lp.signatory@example.com`
(`Password123!`). Apply, vendor and events are public.

## Notes

- An 8 GB swap file (`/swapfile-nvccz-swap`, swappiness 10) was added because the host had none; the Next builds are memory heavy.
- The old server's data is not reachable, so the database is rebuilt: `prisma db push` once on the empty database, then every
  `db:migrate:*` script, then the seed scripts the dev handbook lists.
