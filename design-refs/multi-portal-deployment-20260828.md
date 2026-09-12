# Multi-portal domain setup — deployment report (28 Aug 2026)

## Server / hosting confirmation

| Environment | Server IP | Reverse proxy | Stack path |
|---|---|---|---|
| **Arcus dev + demo** | `31.220.82.129` | Traefik (`lms-traefik`, TLS-ALPN :443) | `/var/www/projects/arcus` |
| **NVCCZ prod (staging on NTS until client VPS returns)** | `31.220.82.129` | Same Traefik | `/var/www/projects/nvccz` |
| **NVCCZ prod (intended client VPS)** | `102.217.49.126` | UFW + direct ports (no Traefik yet) | **Unreachable** (SSH timeout 28 Aug) |

Both live environments share **one VPS** (`31.220.82.129`) with isolated Docker Compose stacks and separate MySQL volumes.

Architecture: **one API per stack**, **four Next.js UI images per environment** (`NEXT_PUBLIC_PORTAL=staff|lp|investee|apply`), routed by Traefik `Host()` rules.

---

## DNS records to create (manual entry)

| Domain/Subdomain | Record Type | Points To | Environment | Notes |
|---|---|---|---|---|
| `nvccz.online` | A | `31.220.82.129` | NVCCZ Production | Root — public funding / applicant portal (`ui-apply`) |
| `www.nvccz.online` | A or CNAME | `31.220.82.129` (or `nvccz.online`) | NVCCZ Production | Optional; Traefik rule includes `www` |
| `lp.nvccz.online` | A | `31.220.82.129` | NVCCZ Production | LP portal |
| `investee.nvccz.online` | A | `31.220.82.129` | NVCCZ Production | Investee portal |
| `api.nvccz.online` | A | `31.220.82.129` | NVCCZ Production | Shared API (`nvccz-prod-api`) |
| *(staff domain — TBD)* | A | `31.220.82.129` | NVCCZ Production | Set `NVCCZ_PUBLIC_STAFF_HOST` in deploy env when purchased; currently `matanho.nvccz.com` |
| `dev.arcus.co.zw` | A | `31.220.82.129` | Arcus Dev | Staff portal (existing) |
| `dev-api.arcus.co.zw` | A | `31.220.82.129` | Arcus Dev | API (existing) |
| `apply.dev.arcus.co.zw` | A | `31.220.82.129` | Arcus Dev | Apply portal (**new pattern**; legacy `dev-apply.arcus.co.zw` also routed) |
| `lp.dev.arcus.co.zw` | A | `31.220.82.129` | Arcus Dev | LP portal (**new**; legacy `dev-lp.arcus.co.zw` also routed) |
| `investee.dev.arcus.co.zw` | A | `31.220.82.129` | Arcus Dev | Investee portal (**new**; legacy `dev-investee.arcus.co.zw` also routed) |

**Legacy during cutover (optional, already documented):** `matanho*.nvccz.com`, `dev-lp.arcus.co.zw`, `dev-investee.arcus.co.zw`, `dev-apply.arcus.co.zw` — Traefik rules keep serving these until DNS moves.

**Subdomain collision check:** `apply.dev`, `lp.dev`, `investee.dev` under `arcus.co.zw` — no existing public DNS at check time (NXDOMAIN / pending). Safe to use.

---

## Changes made (config / code)

| Area | Change | Why |
|---|---|---|
| `nvccz/prisma/schema.prisma` | Added `DealReferenceCounter` model | Stops `prisma db push` trying to drop `deal_reference_counters` (Arcus dev API crash loop) |
| `deploy/arcus/docker-compose.dev.yml` | Dual `Host()` rules for LP / investee / apply | New `*.dev.arcus.co.zw` pattern + legacy `dev-*` |
| `deploy/nvccz/docker-compose.prod.yml` | `nvccz.online` apply UI, `lp`/`investee`/`api` subdomains, `PUBLIC_STAFF_HOST` | NVCCZ production domain architecture |
| `scripts/deploy-arcus-docker-vps.py` | `PUBLIC_APPLY_PORTAL_URL`, new portal URLs in CORS | Env-driven cross-portal links |
| `scripts/deploy-nvccz-nts-prod.py` | NVCCZ online URLs, apply portal, staff host env | Env-driven prod secrets |
| `lib/portal/config.ts` | Removed hardcoded production portal URL defaults | Domains only from build-time env |

---

## Progress report

| Area | What Was Found/Done | Evidence | Blocker |
|---|---|---|---|
| Server/hosting | Both envs on `31.220.82.129`; Traefik TLS; client VPS down | `_arcus-status.py`, `_nvccz-probe-vps.py` timeout | `102.217.49.126` offline |
| Routing setup | Traefik Host rules updated for new subdomains + NVCCZ apply UI | Compose diffs above | DNS not pointed yet |
| Migrations | **Fixed** — Arcus dev+demo API healthy; `prisma db push` in sync | `DEV_API_HEALTH_OK`, logs show DB connected | — |
| Media storage | NVCCZ upload `:3250` OK; Arcus `:3050` OK | Prior verify + upload sidecars healthy | Full round-trip after UI deploy |
| Deployment | Arcus API **done**; Arcus UI + NVCCZ full deploy **running now** | `_fix-arcus-api-deploy.py` completed 30 Aug | UI builds ~20–40 min each |

## Verify with Host header (before DNS propagates)

```bash
curl -skI -H "Host: apply.dev.arcus.co.zw" https://31.220.82.129/login
curl -skI -H "Host: nvccz.online" https://31.220.82.129/funding-application
curl -fsS https://dev-api.arcus.co.zw/health
```

**Note:** `nvccz.online` currently points to AWS parking IPs (`15.197.148.33`) — must change A record to `31.220.82.129`.

*(Post-deploy: re-run Host-header curls after UI builds finish.)*
