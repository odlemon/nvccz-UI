# Standalone funding application portal (own domain)

## Product rule

The public funding application form is **not** part of staff Portfolio chrome and must run on its **own domain / deployment**, same pattern as LP and Investee portals.

| Portal | `NEXT_PUBLIC_PORTAL` | Suggested host | Auth |
|--------|----------------------|----------------|------|
| Staff | `staff` | `dev.arcus.co.zw` | Required |
| LP | `lp` | `dev-lp.arcus.co.zw` | Required |
| Investee | `investee` | `dev-investee.arcus.co.zw` | Required |
| **Apply** | `apply` | **`dev-apply.arcus.co.zw`** (placeholder — confirm with client) | **None** (public form) |

Prod NVCCZ placeholder: `matanho-apply.nvccz.com` (add DNS A → VPS when Contabo is back).

## FE behaviour

- Apply build: only `/funding-application` (+ `/` → redirect there). No login.
- Staff build: when `NEXT_PUBLIC_APPLY_PORTAL_URL` is set, `/funding-application` redirects to that host.
- Local staff without that env still serves `/funding-application` on the same origin (dev convenience).
- Portfolio **Launch applicant portal** / live Add Deal open the apply URL when configured (`window.__APPLY_PORTAL_URL__`).

## Env

```bash
NEXT_PUBLIC_PORTAL=apply
NEXT_PUBLIC_API_BASE_URL=https://…/api

# On staff build:
NEXT_PUBLIC_APPLY_PORTAL_URL=https://dev-apply.arcus.co.zw
# Optional hard switch: NEXT_PUBLIC_APPLY_PORTAL_REDIRECT=1|0
```

Compose: `ui-apply` in `deploy/arcus/docker-compose.dev.yml` (port **3130**, Traefik host `dev-apply.arcus.co.zw`).

## APIs (unchanged)

Same public endpoints as before — see `funding-application-public.md`.

## Client follow-up needed

Confirm the **exact hostname** (and DNS owner) for Arcus / Matanho / NVCCZ. Until then we use `dev-apply.arcus.co.zw` / `matanho-apply.nvccz.com` as placeholders in deploy docs.

## Local verify

```bash
# Apply-only mode
NEXT_PUBLIC_PORTAL=apply npm run dev
# open http://localhost:3001/funding-application  (or / → redirects)
```
