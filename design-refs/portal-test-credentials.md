# Portal test credentials (Arcus DEV)

Use these on the dedicated portal deployments. Staff admin remains separate.

## URLs

| Portal | Dev URL |
|--------|---------|
| Staff | https://dev.arcus.co.zw |
| LP | http://31.220.82.129:3110 |
| Investee | http://31.220.82.129:3120 |

When DNS is configured: `dev-lp.arcus.co.zw`, `dev-investee.arcus.co.zw`.

## LP portal

**Primary test account (seed script):**

- Email: `lp.test@arcus.co.zw`
- Password: `PortalTest!2026`

**SRD demo accounts (full LP portal fixtures):**

- Email: `lp.signatory@example.com` or `lp.viewer@example.com`
- Password: `Password123!`

The client record `lp-arcus-portal@example.com` is the LP entity email, not a login — use the signatory/viewer users above.

Seed: `npm run db:seed:portal-test-users` or `npm run db:seed:lp-portal-srd` (backend repo, DEV `nts` DB).

## Investee portal (V8 UI)

After login, home is `/investee-portal-v8` (new UI — not legacy `/application-portal`).

- Email: `investee.test@arcus.co.zw`
- Password: `PortalTest!2026`

Seed: `npm run db:seed:portal-test-users` (creates applicant user + linked application).

## Staff (reference)

- Email: `admin@nts.com`
- Password: `admin123`

Staff accounts cannot log into LP/investee portals; LP/applicant accounts cannot log into staff.

## Re-seed on Arcus VPS

```bash
docker exec arcus-dev-api-1 npm run db:seed:portal-test-users
docker exec arcus-dev-api-1 npm run db:seed:lp-portal-srd   # optional richer LP demo
```
