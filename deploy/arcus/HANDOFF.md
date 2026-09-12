# HANDOFF — Portal Separation Deployment

## Session Date: 2026-08-31

---

## 1. Current Todo State (6-item checklist)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Verify current file state (config, middleware, docker-compose) | ✅ DONE | All 4 files verified present and containing required changes |
| 2 | Commit and push Arcus (nvccz-new) | ⚠️ PARTIAL | Committed locally as `0178a35`. Push **FAILED** — see details below |
| 3 | Verify SSH access and server state | ✅ DONE | SSH works, server is `vmi2788622`, root access confirmed |
| 4 | Deploy Arcus with new portals to server | ❌ NOT DONE | Server has old compose, build not triggered |
| 5 | Verify deployed portals | ❌ NOT DONE | Waiting on deployment |
| 6 | DNS checklist and final report | ❌ NOT DONE | Waiting on deployment |

---

## 2. docker-compose.dev.yml State

### CRITICAL: File is TRUNCATED in BOTH local and remote

**Original file (before edits):** 194 lines, ended with `volumes:` section.

**Current committed version (local `0178a35` AND remote `65d1451`):** 250-252 lines, **TRUNCATED** — missing the last few lines of `ui-events` service AND the top-level `volumes:` section.

The heredoc/Python write operations that edited this file produced output that was truncated. The events service definition ends abruptly at:
```
      - traefik.http.routers.arcus-dev-ui-events.entrypoints=websec
```
Instead of:
```
      - traefik.http.routers.arcus-dev-ui-events.entrypoints=websecure
      - traefik.http.routers.arcus-dev-ui-events.tls.certresolver=le
      - traefik.http.services.arcus-dev-ui-events.loadbalancer.server.port=3000

volumes:
  arcus_dev_mysql:
  arcus_dev_api_storage:
  arcus_dev_upload:
```

**Server file** (`/var/www/projects/arcus/compose/docker-compose.dev.yml`) also has the same truncation — it was copied from the local broken file.

### What the file IS correct about:
- Staff portal: `Host(dev.matanho.com)` ✅
- API: `Host(dev-api.matanho.com)` ✅
- LP: `Host(dev.lp.matanho.com)` ✅
- Investee: `Host(dev.investee.matanho.com)` ✅
- Apply: `Host(dev.apply.matanho.com)` ✅
- Vendor service defined with `Host(dev.vendor.matanho.com)` ✅
- Events service defined with `Host(dev.events.matanho.com)` ✅ (but truncated)
- Staff build args have `NEXT_PUBLIC_VENDOR_PORTAL_URL` and `NEXT_PUBLIC_EVENTS_PORTAL_URL` ✅

### What's WRONG:
- `ui-events` service missing 3 label lines + closing
- Top-level `volumes:` section completely missing
- This means `docker compose build` will fail with "undefined volume" error

---

## 3. Successful sed Edits (before/after)

| What | Before | After |
|------|--------|-------|
| Staff portal Host | `Host(\`dev.arcus.co.zw\`)` | `Host(\`dev.matanho.com\`)` |
| API Host | `Host(\`dev-api.arcus.co.zw\`)` | `Host(\`dev-api.matanho.com\`)` |

These edits were applied by successful `sed -i` commands and are correct in the file.

---

## 4. Failed Edit

### Command that FAILED (sed with backticks):
```bash
sed -i "s|Host(\`lp.dev.arcus.co.zw\`) || Host(\`dev-lp.arcus.co.zw\`)|Host(\`dev.lp.matanho.com\`)|" deploy/arcus/docker-compose.dev.yml
```

### Error output:
```
sed: -e expression #1, char 33: unknown option to `s'
```

### Why it failed:
The `||` (pipe pipe) in the search pattern conflicted with sed's `s` command delimiter. The backtick characters also caused shell escaping issues. The LP/Investee/Apply domain replacements were later done via Python's `str.replace()` instead, which worked correctly.

---

## 5. What Still Needs to Happen

### Step A: Fix the truncated docker-compose.dev.yml (CRITICAL)
1. Restore the original file: `git checkout -- deploy/arcus/docker-compose.dev.yml`
2. Re-apply ALL edits cleanly (sed for simple replacements, ensure no truncation):
   - `dev.arcus.co.zw` → `dev.matanho.com`
   - `dev-api.arcus.co.zw` → `dev-api.matanho.com`
   - LP/Investee/Apply domain migrations
   - Add `NEXT_PUBLIC_VENDOR_PORTAL_URL` and `NEXT_PUBLIC_EVENTS_PORTAL_URL` to staff build args
   - Append `ui-vendor` and `ui-events` services BEFORE the `volumes:` section
   - Ensure the `volumes:` section is preserved at the end

### Step B: Fix the pushed commit
The local commit `0178a35` was **never pushed** (push was rejected as stale). The remote has `65d1451` which also has the truncated file.
- Option 1: Amend local commit with fixed file, then push (may need `--force-with-lease` since it's a feature branch)
- Option 2: Create a NEW commit with the fix, push normally (no force needed — RECOMMENDED)

### Step C: Fix the server compose file
Copy the corrected file to the server:
```bash
cat deploy/arcus/docker-compose.dev.yml | ssh -o StrictHostKeyChecking=no root@31.220.82.129 "cat > /var/www/projects/arcus/compose/docker-compose.dev.yml"
```

### Step D: Build and deploy
```bash
ssh -o StrictHostKeyChecking=no root@31.220.82.129 "cd /var/www/projects/arcus/compose && docker compose -f docker-compose.dev.yml up -d --build ui-staff ui-lp ui-investee ui-apply ui-vendor ui-events"
```
This will trigger the Next.js build inside Docker. Monitor with:
```bash
ssh -o StrictHostKeyChecking=no root@31.220.82.129 "cd /var/www/projects/arcus/compose && docker compose -f docker-compose.dev.yml logs -f ui-vendor ui-events" 
```

### Step E: Verify containers are healthy
```bash
ssh -o StrictHostKeyChecking=no root@31.220.82.129 "docker ps --format '{{.Names}} {{.Status}}' | grep arcus"
```

### Step F: Update server's .env file (if needed)
The server's `.env` for arcus compose may need these variables:
```
PUBLIC_VENDOR_PORTAL_URL=https://dev.vendor.matanho.com
PUBLIC_EVENTS_PORTAL_URL=https://dev.events.matanho.com
```
Check: `ssh -o StrictHostKeyChecking=no root@31.220.82.129 "cat /var/www/projects/arcus/compose/.env | grep -i vendor\|events"`

### Step G: Commit and push the fix
```bash
cd C:/Users/lysp/Downloads/nvccz-new
git add deploy/arcus/docker-compose.dev.yml
git commit -m "Fix truncated docker-compose.dev.yml — complete events service and volumes section"
git push origin feature/multi-portal-separation
```

---

## 6. Server/Infrastructure Notes

### Server Details
- **IP:** 31.220.82.129
- **Hostname:** vmi2788622
- **User:** root
- **SSH command:** `ssh -o StrictHostKeyChecking=no root@31.220.82.129 "command"`

### Arcus Deployment
- **Compose directory:** `/var/www/projects/arcus/compose/`
- **Compose file:** `/var/www/projects/arcus/compose/docker-compose.dev.yml`
- **Source code:** `/var/www/projects/arcus/src/ui/`
- **Source repo:** `https://github.com/odlemon/nvccz-UI.git`
- **Source branch:** `feature/multi-portal-separation`
- **Source commit on server:** `65d1451` (needs update to include fixed compose)
- **Network:** `lms_lms-network` (external Docker network)
- **SSL:** Let's Encrypt via Traefik (`certresolver=le`)

### Current Containers (all healthy, running on OLD code)
| Container | Port | Status |
|-----------|------|--------|
| arcus-dev-ui-staff-1 | 3000/tcp (Traefik) | Up 7h, healthy |
| arcus-dev-ui-lp-1 | 3110→3000 | Up 7h, healthy |
| arcus-dev-ui-investee-1 | 3120→3000 | Up 7h, healthy |
| arcus-dev-ui-apply-1 | 3130→3000 | Up 7h, healthy |
| arcus-dev-api-1 | 3009/tcp (Traefik) | Up 22h, healthy |
| arcus-dev-mysql-1 | 3307→3306 | Up 3d, healthy |
| arcus-dev-upload-1 | 3050 | Up 3d, healthy |

### NEW Containers to be created
| Container | Port | Domain |
|-----------|------|--------|
| arcus-dev-ui-vendor-1 | 3140→3000 | dev.vendor.matanho.com |
| arcus-dev-ui-events-1 | 3150→3000 | dev.events.matanho.com |

### NVCCZ Deployment
- **NOT part of this task** — NVCCZ uses separate compose at `/var/www/projects/nvccz/`
- NVCCZ docker-compose.prod.yml changes are local only (not yet deployed)

### Key Environment Variables Needed
Check the server `.env` at `/var/www/projects/arcus/compose/.env` for:
- `PUBLIC_API_BASE_URL` — should point to `https://dev-api.matanho.com` or similar
- `PUBLIC_WS_URL` — WebSocket URL
- `PUBLIC_LP_PORTAL_URL` — LP portal external URL
- `PUBLIC_INVESTEE_PORTAL_URL` — Investee portal external URL
- `PUBLIC_APPLY_PORTAL_URL` — Apply portal external URL
- `PUBLIC_VENDOR_PORTAL_URL` — **NEW** — needs to be added
- `PUBLIC_EVENTS_PORTAL_URL` — **NEW** — needs to be added

### DNS Records Needed
These must be created manually (no DNS provider access):
| Domain | Type | Target |
|--------|------|--------|
| dev.matanho.com | A | 31.220.82.129 |
| dev-api.matanho.com | A | 31.220.82.129 |
| dev.lp.matanho.com | A | 31.220.82.129 |
| dev.investee.matanho.com | A | 31.220.82.129 |
| dev.apply.matanho.com | A | 31.220.82.129 |
| dev.vendor.matanho.com | A | 31.220.82.129 |
| dev.events.matanho.com | A | 31.220.82.129 |

### Portal Discovery Summary
Two new external portals were identified from codebase investigation:
1. **Vendor Portal** (`vendor-portal`, `vendor/*`, `vendor-quotations/*`, `public-tenders`) — vendor registration, KYC, RFQ access, quotation submission, invoice submission
2. **Events Portal** (`events/rsvp/*`, `events/public/*`, `events/feedback/*`) — public events listing, RSVP, feedback

Both are already implemented as frontend routes within the existing codebase. The separation is achieved by setting `NEXT_PUBLIC_PORTAL=vendor` or `NEXT_PUBLIC_PORTAL=events` at build time, which the middleware uses to restrict routes served by each container.

---

## Files Changed in This Task

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `lib/portal/config.ts` | 221 | ✅ Correct | vendor/events PortalId, external URLs, redirect helpers |
| `middleware.ts` | 494 | ✅ Correct | vendor/events imports, routing, staff redirect logic |
| `deploy/nvccz/docker-compose.prod.yml` | 281 | ✅ Correct | ui-vendor, ui-events services, CORS updated |
| `deploy/arcus/docker-compose.dev.yml` | 252 | ❌ TRUNCATED | events service incomplete, volumes section missing |

## Git State

| Repository | Branch | Local HEAD | Remote HEAD | Pushed? |
|------------|--------|-----------|-------------|---------|
| nvccz-new (Arcus) | feature/multi-portal-separation | `0178a35` | `65d1451` | NO — push rejected, needs fix |
| nvccz (Backend) | master | N/A (no backend changes needed) | N/A | N/A |
