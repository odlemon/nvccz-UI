# Multi-portal domain separation

Four surfaces plus staff ERP, deployed as separate Next.js builds against one API.

## Portals

| Portal | Build flag | Dev URL | Users |
|--------|------------|---------|-------|
| Staff | `NEXT_PUBLIC_PORTAL=staff` | https://dev.arcus.co.zw | Employees (accounting, procurement, etc.) |
| LP | `NEXT_PUBLIC_PORTAL=lp` | https://dev-lp.arcus.co.zw or :3110 | Limited partners |
| Investee | `NEXT_PUBLIC_PORTAL=investee` | https://dev-investee.arcus.co.zw or :3120 | Applicants / portfolio companies |
| **Apply** | `NEXT_PUBLIC_PORTAL=apply` | https://dev-apply.arcus.co.zw or :3130 | **Public funding form (no login)** |

Other public/token routes (vendor portal, public tenders, RSVP, broker links) stay on **staff** deployment only. The **funding application** moves to the **Apply** portal — see [`funding-application-standalone-domain.md`](./funding-application-standalone-domain.md).

## Frontend

- Config: [`lib/portal/config.ts`](../lib/portal/config.ts)
- Middleware enforces route allowlists per portal
- Staff redirects `/lp-portal`, `/application-portal`, and (when configured) `/funding-application` to external portal URLs
- Login sends `portal` to API for staff/lp/investee; Apply has no login

## Backend

- `POST /api/auth/login` accepts `portal: staff | lp | investee`
- JWT includes `aud` claim matching portal
- Helper: `src/utils/portalAuth.ts`
- Apply portal uses existing **public** application create/upload endpoints (no portal JWT)

## Deploy (Arcus dev)

```bash
python scripts/deploy-arcus-docker-vps.py
```

Compose services: `ui-staff`, `ui-lp`, `ui-investee`, `ui-apply` in [`deploy/arcus/docker-compose.dev.yml`](../deploy/arcus/docker-compose.dev.yml).
