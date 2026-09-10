# Agent operations & deployment handbook

**Purpose:** Single source of truth for any human or coding agent picking up this project. Covers how we work (frontend, backend, docs), where everything lives on disk and on servers, how to deploy, and where we left off as of **30 Aug 2026**.

**Audience:** You (project owner), future agents, contractors.

> **Security note:** This file contains server credentials the owner asked to document here for handoff. Current NTS VPS root password: `<see .secrets/ssh.env — rotated 2026-09-07>`. Rotate passwords after onboarding anyone new. Prefer moving secrets to gitignored `CREDENTIALS.*.local.md` files over time.

---

## Table of contents

1. [Two-repo layout](#1-two-repo-layout)
2. [How the agent works](#2-how-the-agent-works)
3. [Frontend architecture](#3-frontend-architecture)
4. [Backend architecture](#4-backend-architecture)
5. [Multi-portal separation](#5-multi-portal-separation)
6. [Portfolio module — where we left off](#6-portfolio-module--where-we-left-off)
7. [Module inventory](#7-module-inventory)
8. [Database & migrations](#8-database--migrations)
9. [Local development — start servers](#9-local-development--start-servers)
10. [Servers & credentials](#10-servers--credentials)
11. [Deployment architecture](#11-deployment-architecture)
12. [Deploy commands (from your machine)](#12-deploy-commands-from-your-machine)
13. [On-server operations](#13-on-server-operations)
14. [Where we left off — deployment (30 Aug 2026)](#14-where-we-left-off--deployment-30-aug-2026)
15. [Pending / blocked items](#15-pending--blocked-items)
16. [Design-refs index (key docs)](#16-design-refs-index-key-docs)
17. [Cursor workspace rules](#17-cursor-workspace-rules)

---

## 1. Two-repo layout

Everything runs as **two sibling repos** on the developer machine:

| Repo | Path | Role | Default port |
|------|------|------|--------------|
| **Frontend (UI)** | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 app — all portals, modules, deploy compose files | `3000` (staff dev), `3110`/`3120`/`3130` for other portals |
| **Backend (API)** | `C:\Users\lysp\Downloads\nvccz` | Node/Express + Prisma + MySQL | `3009` |

Deploy scripts tarball **both** repos, upload to VPS, and `docker compose build` on the server.

### Frontend repo — top-level map

```text
nvccz-new/
├── app/                          # Next.js App Router pages (one folder per route/module)
│   ├── home-v3/                  # Client-faithful Employee Hub V10
│   ├── portfolio-v11/            # Live-wired portfolio module (primary)
│   ├── investments-v2/           # Investments / trading / recon (live + gaps)
│   ├── accounting-v52/           # Client-faithful accounting mock
│   ├── procurement-v23/          # Client-faithful procurement mock
│   ├── performance-v22/          # Client-faithful performance mock
│   ├── payroll-v6/               # Client-faithful payroll mock
│   ├── investee-portal-v8/       # Investee portal (live loaders)
│   ├── funding-application/      # Public apply portal (no login)
│   ├── lp-portal/                # LP portal
│   └── login/                    # Shared auth entry per portal
├── components/
│   ├── ui/                       # Shared shadcn-style primitives (Button, etc.)
│   ├── layout/                   # Shells, topbars, app switcher
│   ├── *-mock/                   # Client-faithful runtime hosts (home-v3, portfolio-v11, etc.)
│   ├── investments-v2/           # Live investments components
│   └── auth/                     # Auth shell
├── lib/
│   ├── api/                      # API clients (api-client.ts + domain modules)
│   ├── portal/config.ts          # Multi-portal routing + env URLs
│   ├── config/modules.ts         # App Switcher module registry
│   ├── config/role-permissions.ts
│   ├── portfolio-v11/            # Live loaders, adapters, actions, types
│   └── *-mock/                   # Fixtures, nav, session for mock modules
├── deploy/
│   ├── arcus/                    # docker-compose.dev.yml, docker-compose.demo.yml
│   └── nvccz/                    # docker-compose.dev.yml, docker-compose.prod.yml
├── scripts/                      # Deploy, verify, seed, UAT walkthrough scripts
├── design-refs/                  # SRDs, stages, backend asks, handoffs (source of truth)
├── public/                       # Static assets, demo CSV/PDF packs
├── middleware.ts                 # Auth, portal allowlists, role gates
└── .cursor/rules/                # Mandatory agent behaviour rules
```

### Backend repo — top-level map

```text
nvccz/
├── src/                          # Express routes, controllers, services
├── prisma/
│   ├── schema.prisma             # MySQL schema (~489 tables)
│   └── seed.ts                   # Bootstrap users, roles
├── scripts/                      # Seeds, UAT, upload mock server
├── storage/local-upload-mock/    # Local file storage (dev)
└── .env                          # gitignored — DATABASE_URL, JWT, etc.
```

---

## 2. How the agent works

### Core contract

We do **not** build whole modules in one shot. We work in **short, testable slices** with the user testing each slice in the browser before moving on.

```
Requirements / design
        ↓
Stage map (user journey + "Done when")
        ↓
Honest FE audit (what exists vs gaps)
        ↓
Implement what FE can do now
        ↓
Backend asks MD (if blocked or contract missing)
        ↓
User tests that stage in the browser
        ↓
Feedback → fix / next stage
        ↓
(repeat)
```

Full playbook: [`design-refs/arcus-feature-delivery-playbook.md`](./arcus-feature-delivery-playbook.md)

### Agent responsibilities (non-negotiable)

| Rule | What it means |
|------|---------------|
| **Agent owns backend** | Agent restarts BE on `:3009`, runs migrations, fixes BE — never tells user to do it |
| **Verify work twice** | Pass 1: re-read changed files. Pass 2: grep/trace live API calls or run lint. Only say "wired/live" after both |
| **Backend asks → markdown** | Every BE gap goes to `design-refs/<feature>-backend-asks.md`, not just chat |
| **Arcus button styles** | Action buttons are pills (`rounded-full`); use shared `Button` from `@/components/ui/button` |
| **No fake live data** | Empty states when API is empty; no demo numbers presented as production truth |
| **Docs are source of truth** | Chat is ephemeral; `design-refs/` holds stages, asks, handoffs |
| **No commit/push unless asked** | User must explicitly request git commits or PRs |
| **"Start servers" = DB + BE + FE** | MySQL (`start-local-mysql.bat`) → backend `:3009` → frontend `:3000`. Use `npm run start:servers` or three terminals — see [§9](#9-local-development--start-servers) |

### Task execution flow (typical feature)

1. **Read** existing `design-refs` for the module (handoff, stages, backend asks).
2. **Search** codebase for existing routes, API client methods, adapters.
3. **Audit** — produce honest status table (Implemented / Partial / Missing / BE-blocked).
4. **Implement** minimal diff for current stage only.
5. **Wire** UI → `lib/api/*` → backend endpoint (trace happy path).
6. **Update docs** — stages MD status row; create/update backend-asks if needed.
7. **Verify twice** — static re-read + grep/trace evidence.
8. **Hand off to user** — numbered test path, what's blocked, links to MDs.

### Two UI integration modes

| Mode | When | Reference |
|------|------|-----------|
| **Live wire** | Module talks to real API (`portfolio-v11`, `investments-v2`, portals) | `lib/api/*`, `lib/portfolio-v11/live-loaders.ts` |
| **Client faithful port** | Client delivered HTML/JS SPA; we host as parallel comparison module | `.cursor/skills/client-ui-faithful-port/SKILL.md`, `/home-v3` reference |

Client-faithful modules use `components/<module>-mock/` runtime hosts. **Do not Arcus-ify** their button radii — that's intentional for side-by-side comparison.

---

## 3. Frontend architecture

### Stack

- **Next.js 14** App Router, React 18, TypeScript
- **Tailwind CSS v4**, Radix primitives, Redux Toolkit (some modules)
- **API client:** `lib/api/api-client.ts` — auth interceptor, 401 handling, base URL from env

### Key env vars (build time)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | API root, e.g. `https://dev-api.arcus.co.zw/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for realtime |
| `NEXT_PUBLIC_PORTAL` | `staff` \| `lp` \| `investee` \| `apply` |
| `NEXT_PUBLIC_LP_PORTAL_URL` | Cross-portal redirect target (staff build) |
| `NEXT_PUBLIC_INVESTEE_PORTAL_URL` | Cross-portal redirect target |
| `NEXT_PUBLIC_APPLY_PORTAL_URL` | Funding form external URL |
| `NEXT_PUBLIC_ORGANIZATION_NAME` | Branding (NVCCZ builds) |
| `NEXT_PUBLIC_AUTH_*_KEY` | Per-portal cookie keys (NVCCZ prod uses `nvccz_staff_*`, etc.) |

Portal config: [`lib/portal/config.ts`](../lib/portal/config.ts)

### Routing & auth

- **`middleware.ts`** — portal allowlists, role/module permissions, redirects LP/investee/apply traffic off staff
- **`lib/config/modules.ts`** — App Switcher tiles and sub-module nav
- **`lib/config/role-permissions.ts`** — role → module access matrix
- **`lib/auth/AuthProvider.tsx`** — session bootstrap

### API client pattern

Domain-specific clients in `lib/api/`:

```text
lib/api/
├── api-client.ts           # Base HTTP client + auth
├── applications-api.ts
├── auth-api.ts
├── fundraising-api.ts
├── investment-ops-api.ts
├── portfolio-companies-api.ts
└── stock-picker-cash-api.ts
```

When wiring a feature:

1. Add/extend method on the domain API client.
2. Call from page/component or adapter (`lib/portfolio-v11/actions.ts`).
3. Grep to confirm call site is not a local mock stub.

### Client-faithful module file pattern

```text
app/<module>/page.tsx                    # Next route
components/layout/<module>-layout.tsx    # Shell
components/<module>-mock/
  <module>-app.tsx                       # React host
  <module>.css                           # Scoped styles
  matanho-<module>-runtime.js            # Extracted client SPA
lib/<module>-mock/nav.ts                 # Sidebar IA
design-refs/<module>-ui-handoff.md     # Handoff doc
```

---

## 4. Backend architecture

### Stack

- **Node.js + Express** on port **3009**
- **Prisma ORM** → MySQL 8
- **JWT auth** with portal `aud` claim (`staff` | `lp` | `investee`)
- **Upload sidecar** — separate microservice for file storage; API proxies via `REMOTE_UPLOAD_SERVICE_URL`

### Key endpoints pattern

```text
POST /api/auth/login          # body: { email, password, portal }
GET  /health                  # Deploy health check
GET  /api/public-media/...    # Served uploads
```

Portal auth helper: `src/utils/portalAuth.ts` (backend repo).

### Agent backend workflow

1. Work in `C:\Users\lysp\Downloads\nvccz`.
2. Edit `prisma/schema.prisma` → apply locally (see [§8 Database & migrations](#8-database--migrations)).
3. Restart API: kill port 3009, `npm run dev` (agent does this — not the user).
4. For deploy: fix in backend repo, then run deploy script (packages both repos). Server DB syncs automatically on API container start.

---

## 5. Multi-portal separation

### Why portals are separate

Arcus/NVCCZ is **one backend API** but **four independent frontend deployments**. Each portal is a separate Docker image (separate Next.js build) with its own domain, cookie namespace, route allowlist, and user audience. This is intentional:

- **Security** — LP and investee users never see staff ERP routes (accounting, procurement, admin).
- **Session isolation** — Staff, LP, and investee use different auth cookies so logging into one portal does not log you into another (critical when Arcus and NVCCZ share the same VPS IP).
- **Public apply** — The funding application form has no login and must not inherit staff chrome or require staff auth.
- **Deploy flexibility** — Each portal can be rebuilt/redeployed independently; Traefik routes by `Host()` header.

Docs: [`multi-portal-domain-separation.md`](./multi-portal-domain-separation.md), [`funding-application-standalone-domain.md`](./funding-application-standalone-domain.md)

### The four portals

| Portal | Build flag | Who uses it | Auth | Home route after login |
|--------|------------|-------------|------|------------------------|
| **Staff** | `NEXT_PUBLIC_PORTAL=staff` | Employees — accounting, portfolio, investments, procurement, etc. | Required (`portal: staff`) | `/home-v3` |
| **LP** | `NEXT_PUBLIC_PORTAL=lp` | Limited partners — fund performance, documents, capital activity | Required (`portal: lp`) | `/lp-portal` |
| **Investee** | `NEXT_PUBLIC_PORTAL=investee` | Applicants / portfolio companies post-acceptance | Required (`portal: investee`) | `/investee-portal-v8` |
| **Apply** | `NEXT_PUBLIC_PORTAL=apply` | Public funding applicants (no account) | **None** | `/funding-application` |

### What lives on which portal

| Surface | Staff | LP | Investee | Apply |
|---------|:-----:|:--:|:--------:|:-----:|
| `/portfolio-v11`, `/investments-v2`, `/fundraising`, `/accounting-v52`, etc. | ✅ | ❌ | ❌ | ❌ |
| `/lp-portal` | ❌ (redirects out) | ✅ | ❌ | ❌ |
| `/investee-portal-v8` | ❌ (redirects out) | ❌ | ✅ | ❌ |
| `/funding-application` | ❌ (redirects out when env set) | ❌ | ❌ | ✅ |
| `/application-portal` (legacy) | ❌ (redirects to investee) | ❌ | — | ❌ |
| Public vendor/tender/RSVP routes | ✅ only | ❌ | ❌ | ❌ |

**Staff-only public pass-through** (no login, but still on staff build): vendor portals, public tenders, RSVP links, broker instructions — see `STAFF_PUBLIC_PASS_THROUGH` in [`lib/portal/config.ts`](../lib/portal/config.ts).

**Portfolio → Apply link:** Staff Portfolio's "Add Deal" / "Launch applicant portal" opens the **Apply portal URL** (`NEXT_PUBLIC_APPLY_PORTAL_URL` or local `:3130`), not a modal that creates fake local deals when live.

### Domains per environment

#### Arcus dev (`31.220.82.129`)

| Portal | Primary URL (new pattern) | Legacy URL (still routed) | Direct port |
|--------|---------------------------|---------------------------|-------------|
| Staff | https://dev.arcus.co.zw | — | — |
| API | https://dev-api.arcus.co.zw | — | — |
| LP | https://lp.dev.arcus.co.zw | https://dev-lp.arcus.co.zw | `:3110` |
| Investee | https://investee.dev.arcus.co.zw | https://dev-investee.arcus.co.zw | `:3120` |
| Apply | https://apply.dev.arcus.co.zw | https://dev-apply.arcus.co.zw | `:3130` |

#### NVCCZ prod on NTS (staging)

| Portal | New target URL | Legacy URL (works today) |
|--------|----------------|--------------------------|
| Staff | TBD (`NVCCZ_PUBLIC_STAFF_HOST`) | https://matanho.nvccz.com |
| API | https://api.nvccz.online | https://matanho-api.nvccz.com |
| LP | https://lp.nvccz.online | https://matanho-lp.nvccz.com |
| Investee | https://investee.nvccz.online | https://matanho-investee.nvccz.com |
| Apply | https://nvccz.online | https://matanho-apply.nvccz.com |

IP fallbacks (no DNS): staff `:3200`, LP `:3210`, investee `:3220`, API `:3209`.

### Auth & session isolation

**Login request** — `POST /api/auth/login` body includes `portal: "staff" | "lp" | "investee"`. Apply portal does not log in.

**JWT** — Backend sets `aud` claim matching the portal. A staff token cannot access LP-only routes and vice versa.

**Cookies (NVCCZ prod)** — Separate keys per portal so sessions do not collide on the same browser:

```text
nvccz_staff_token / nvccz_staff_user / nvccz_staff_profile   (staff)
nvccz_lp_*                                                     (LP)
nvccz_investee_*                                               (investee)
```

Arcus dev uses default Arcus cookie keys on all portal builds (different domains/ports still isolate in practice).

**Account separation** — Staff accounts (`admin@nts.com`) cannot log into LP/investee portals. Portal test users (`lp.test@arcus.co.zw`, `investee.test@arcus.co.zw`) cannot log into staff. See [`portal-test-credentials.md`](./portal-test-credentials.md).

### Frontend routing (`middleware.ts` + `lib/portal/config.ts`)

1. **`PORTAL_ID`** — Baked at build time from `NEXT_PUBLIC_PORTAL`. Each Docker image only serves routes allowed for that portal.
2. **Staff redirects outward:**
   - `/lp-portal` → `NEXT_PUBLIC_LP_PORTAL_URL`
   - `/application-portal` or `/investee-portal-v8` → `NEXT_PUBLIC_INVESTEE_PORTAL_URL`
   - `/funding-application` → `NEXT_PUBLIC_APPLY_PORTAL_URL` (when redirect enabled)
3. **LP build** — Only `/lp-portal/*` + auth routes. Hitting `/portfolio-v11` → redirect to LP home.
4. **Investee build** — Only `/investee-portal-v8/*` + auth routes.
5. **Apply build** — Only `/funding-application/*`. No login page needed for normal flow.
6. **Local dev** — `npm run dev` (staff), `dev:lp` (`:3110`), `dev:investee` (`:3120`), `dev:apply` (`:3130`) via `scripts/run-portal-dev.mjs`.

### Apply portal APIs (no JWT)

Public endpoints used by `/funding-application`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/applications/upload-documents` | Multipart file upload (no `applicationId` → temp URLs) |
| `POST` | `/api/applications` | Final submit with document URLs; triggers received email + AI shortlisting |

See [`funding-application-public.md`](./funding-application-public.md).

### Docker / deploy shape

Each environment stack runs:

```text
api          ← one shared backend
mysql        ← one DB per stack (arcus_dev, nvccz_prod, etc.)
upload       ← media sidecar
ui-staff     ← NEXT_PUBLIC_PORTAL=staff
ui-lp        ← NEXT_PUBLIC_PORTAL=lp
ui-investee  ← NEXT_PUBLIC_PORTAL=investee
ui-apply     ← NEXT_PUBLIC_PORTAL=apply
```

Compose files: [`deploy/arcus/docker-compose.dev.yml`](../deploy/arcus/docker-compose.dev.yml), [`deploy/nvccz/docker-compose.prod.yml`](../deploy/nvccz/docker-compose.prod.yml).

Traefik routes each `ui-*` service by hostname. All four UI images share the same source tarball but build with different `NEXT_PUBLIC_*` args.

**Build-time portal URLs** — `NEXT_PUBLIC_LP_PORTAL_URL`, `NEXT_PUBLIC_INVESTEE_PORTAL_URL`, `NEXT_PUBLIC_APPLY_PORTAL_URL` are baked into the **staff** image so cross-portal redirects work. No hardcoded production defaults in `lib/portal/config.ts` — domains come only from env at build time.

---

## 6. Portfolio module — where we left off

**Route:** `/portfolio-v11` (UI label "Portfolio V11"; product source is **Matanho Portfolio V23** handoff)  
**Status:** Live-wired locally — **not separately deployed**; ships inside the staff portal image when staff UI is deployed.  
**Legacy module left alone:** `/portfolio` (old Portfolio Management — hidden from App Switcher in favour of V11).

### What it is

Client-delivered Portfolio Management SPA (V23 production handoff) integrated as a **runtime host** (Mode A — same pattern as Home V3):

- Client JS/CSS in `components/portfolio-v11-mock/matanho-portfolio-runtime.js`
- React host hydrates from **live APIs** when authenticated (`liveOnly: true` default)
- Arcus SharedTopbar above client chrome; client keeps its own radii/colors (not Arcus pills)
- Full suite: Investments, Fund Operations (cash/recon/period close), Reporting, LPs, Documents, E-Sign, Mailer, Settings

Handoff: [`portfolio-v11-ui-handoff.md`](./portfolio-v11-ui-handoff.md)  
Comparison: [`portfolio-v23-comparison.md`](./portfolio-v23-comparison.md)

### Code map (portfolio-specific)

| Layer | Path |
|-------|------|
| Next routes | `app/portfolio-v11/**/page.tsx` |
| React host | `components/portfolio-v11-mock/portfolio-v11-app.tsx` |
| Client runtime | `components/portfolio-v11-mock/matanho-portfolio-runtime.js` |
| Live hydrate | `lib/portfolio-v11/bootstrap.ts` — `scopesForPage()` + `loadPortfolioV11Scopes()` |
| API adapters | `lib/portfolio-v11/adapters.ts` |
| Write actions | `lib/portfolio-v11/actions.ts` — maps runtime `api-*` events → API clients |
| Detail loaders | `lib/portfolio-v11/live-loaders.ts` |
| Types | `lib/portfolio-v11/types.ts` |
| Nav | `lib/portfolio-v11-mock/nav.ts` |
| App Switcher | `lib/config/modules.ts` — id `portfolio-v11` |
| Progressive load rule | `.cursor/rules/portfolio-progressive-loads.mdc` |

### Live-data architecture

```text
User opens /portfolio-v11/deals
        ↓
portfolio-v11-app.tsx → scopesForPage('deals')
        ↓
bootstrap.ts loads primary scope: applications
        ↓
adapters.ts shapes API → MatanhoPortfolioUI.hydrate payload
        ↓
Runtime paints deal flow (no fixture flash when liveOnly)
        ↓
Secondary scope (funds) loads in background for filters
```

**`liveOnly: true`** (default since 2026-08-27):

- No Matanho demo data (Nova Analytics, fake data-room folders, etc.) when signed in
- Skeleton gate until first primary scope hydrates
- Empty states when API returns nothing — not invented numbers

See [`portfolio-v11-live-backend.md`](./portfolio-v11-live-backend.md).

**Progressive loads (mandatory):** Do not load all portfolio APIs on every page. Each page loads `primary` scopes first (paint), then `secondary` in background. Source of truth: `scopesForPage()` in `bootstrap.ts`. Rule: `.cursor/rules/portfolio-progressive-loads.mdc`.

| Page | Primary (paint first) | Secondary (background) |
|------|----------------------|------------------------|
| Deal Flow | `applications` | `funds` |
| Dashboard | `dashboard` | `companies`, `funds`, `applications` |
| Funds | `funds` | `dashboard` |
| Capital calls | `capitalCalls` | — |
| Companies | `companies` | `funds` |
| Cash / recon / period close | respective cash scopes | `cashAccounts`, `funds` as needed |
| Reporting / documents / mailer | respective scopes | `funds` where needed |

### Work completed (tracker — all workstreams done)

Source: [`portfolio-v23-unfinished-tracker.md`](./portfolio-v23-unfinished-tracker.md) — last updated **2026-08-25**.

| Workstream | Status | Summary |
|------------|--------|---------|
| **A — Creates / uploads** | ✅ Done | Cash accounts, reservations, statements, mailer lists, DD assign, e-sign, vault docs, reports, add company |
| **B — Deal mutations** | ✅ Done | Kanban stage drag, IC vote, term sheet accept/retain, release tranche |
| **C — Recon** | ✅ Done | Confirm/manual/unmatch matches; exception create hidden (no API) |
| **D — Settings / honesty** | ✅ Done | RBAC → deep-link Admin; honest empty states; LP comms wired; demo CTAs blocked with toast |
| **E — Verify** | ✅ Done | Two-pass verification + HTTP smoke documented in backend asks |

**Audit history:** Full source audit on 2026-08-25 found 48+ hardcoded/unwired issues; 18 fixed same pass, remainder closed in follow-up blocker pass. See [`portfolio-v11-audit-report.md`](./portfolio-v11-audit-report.md).

### Wired write actions (runtime event → API)

| UI action | Runtime emit | API client |
|-----------|--------------|------------|
| Cash account create | `api-create-cash-account` | `stockPickerCashApi.createClientCashAccount` |
| Reservation create | `api-create-reservation` | `createCashReservation` |
| Statement upload | `api-upload-statement` | `createExternalStatementImport` |
| Add company | `api-create-company` | `portfolioCompaniesApi.adminCreate` |
| Kanban stage change | `api-change-deal-stage` | `applicationsApi.changeStage` |
| IC vote | `api-cast-ic-vote` | `boardReviewApi.castVote` |
| Term sheet update | `api-update-term-sheet` | `termSheetApi.update` |
| Release tranche | `api-release-tranche` | `createDisbursement` |
| Recon confirm/manual/reverse | `api-confirm-match` etc. | cash match APIs |
| E-sign envelope | `api-create-envelope` | `createAgreement` + signatory + `sendAgreement` |
| LP communication | `api-send-lp-communication` | `fundraisingApi.createCommunication` |

Full table: [`portfolio-v23-backend-asks.md`](./portfolio-v23-backend-asks.md) § "Closed in FE".

### Remaining gaps (product / BE — not blocking basic demo)

These are **honest empty / hidden** in the UI when live — not fake data:

1. **Reconciliation exception create** — No `POST` endpoint; CTA hidden when `liveData` is set.
2. **Mailer member hub / bounce metrics** — Distribution lists work; full mailer product incomplete.
3. **Dedicated e-sign product** — Uses fundraising agreements path; separate PE envelope hub only if product rejects that.
4. **LP communication log list** — Create works; interaction log widgets stay empty (no list APIs).
5. **Strict stage graph** — `change-stage` enforces `validTransitions`; kanban may error with BE message (toast + revert).
6. **Company deep tabs** — Performance / board / VC / financials / activity need portfolio-company series APIs (empty live states today).
7. **Some dashboard filters** — Geography filter is client-only; currency needs `currencyId` UUID from IO setup.

Deploy to NTS/VPS for portfolio specifically was **explicitly out of scope** during wiring — portfolio rides along when staff UI is deployed.

### How portfolio connects to other portals

| Portfolio action | Behaviour when live |
|------------------|---------------------|
| **Add Deal** | Navigates to Apply portal URL — does **not** create a local-only deal record |
| **Launch applicant portal** | Opens `NEXT_PUBLIC_APPLY_PORTAL_URL` / `window.__APPLY_PORTAL_URL__` |
| `/portfolio-v11/applicant-portal` | Redirects to apply URL |
| Applicant after submit | May later log into **Investee portal** (`/investee-portal-v8`) with applicant credentials |
| LP-facing outputs | LP comms via `fundraisingApi`; LP users consume **LP portal**, not staff portfolio |

### Local verify (portfolio)

```bash
# Start full stack first (DB + BE + FE)
cd C:\Users\lysp\Downloads\nvccz-new && npm run start:servers
# Or manually: start-local-mysql.bat → npm run dev (nvccz) → npm run dev (nvccz-new)

# Login admin@nts.com / admin123 → /portfolio-v11
```

**Seed demo deals locally** (when Contabo dump unavailable):

```bash
cd C:\Users\lysp\Downloads\nvccz
npm run db:seed:portfolio-v11-local-demo
```

**Public preview** (no login): `http://localhost:3000/portfolio-v11` — middleware pass-through; shows fixtures only if not authenticated.

**Smoke checklist:**

1. Deal Flow shows seeded deals (NTS / Arcus Demo), not Nova Analytics fixtures.
2. Open deal → Documents tab → API PDFs or empty — not demo "Certificate of Incorporation" folders.
3. Drag kanban stage → API call + toast on invalid transition.
4. Add Deal → opens apply portal, not local invent.
5. Hard refresh on any page — no fixture flash before skeleton resolves.

### Portfolio docs index

| Doc | Purpose |
|-----|---------|
| [`portfolio-v11-ui-handoff.md`](./portfolio-v11-ui-handoff.md) | Routes, code map, deviations |
| [`portfolio-v23-unfinished-tracker.md`](./portfolio-v23-unfinished-tracker.md) | Workstream checklist (all done) |
| [`portfolio-v23-backend-asks.md`](./portfolio-v23-backend-asks.md) | FE↔BE gaps + HTTP verify |
| [`portfolio-v11-live-backend.md`](./portfolio-v11-live-backend.md) | liveOnly / no-fixture policy |
| [`portfolio-v11-audit-report.md`](./portfolio-v11-audit-report.md) | Full audit evidence table |
| [`portfolio-v11-design-parity-fallback-audit.md`](./portfolio-v11-design-parity-fallback-audit.md) | Design parity notes |

---

## 7. Module inventory

### Live-wired (API-backed, actively maintained)

| Module | Route | Status notes |
|--------|-------|--------------|
| **Portfolio V11** | `/portfolio-v11` | **See §6** — live-wired locally; all workstreams A–E done; rides staff deploy |
| **Investments V2** | `/investments-v2` | Trading, recon, valuation, reporting. Gaps: [`investments-v2-backend-asks.md`](./investments-v2-backend-asks.md) |
| **Fundraising** | `/fundraising` | Stage-based delivery; many `fundraising-*-stages.md` files |
| **FP&A Model Planning** | `/fpa` | Reference implementation for delivery playbook |
| **LP Portal** | `/lp-portal` | Live on dedicated portal build |
| **Investee Portal V8** | `/investee-portal-v8` | Live loaders: `lib/investee-portal-v8/live-loaders.ts` |
| **Funding Application** | `/funding-application` | Public apply portal; see `funding-application-public.md` |
| **Legacy portfolio** | `/portfolio` | Older module; hidden from switcher in favour of V11 |

### Client-faithful comparison modules (mock/fixture phase)

| Module | Route | Handoff |
|--------|-------|---------|
| **Home V3** | `/home-v3` | [`home-v3-ui-handoff.md`](./home-v3-ui-handoff.md) |
| **Accounting V52** | `/accounting-v52` | [`accounting-v52-ui-handoff.md`](./accounting-v52-ui-handoff.md) |
| **Procurement V23** | `/procurement-v23` | [`procurement-v23-ui-handoff.md`](./procurement-v23-ui-handoff.md) |
| **Performance V22** | `/performance-v22` | [`performance-v22-ui-handoff.md`](./performance-v22-ui-handoff.md) |
| **Payroll V6** | `/payroll` | [`payroll-v6-ui-handoff.md`](./payroll-v6-ui-handoff.md) |

### Legacy live modules (pre-mock, still in repo)

`/accounting`, `/procurement`, `/payroll`, `/performance`, `/employee-hub` — older implementations; many hidden from App Switcher.

---

## 8. Database & migrations

### Overview

| Environment | Engine | Host (from API) | Database name | Notes |
|-------------|--------|-----------------|---------------|-------|
| **Local dev** | MySQL 8.4 (Windows service) | `127.0.0.1:3306` | `arcus_dev` | Primary dev DB when VPS tunnel is down |
| **Arcus dev (VPS)** | MySQL 8.0 (Docker) | `mysql:3306` inside stack | `arcus_dev` | localhost `:3307` on VPS for SSH tunnel |
| **Arcus demo (VPS)** | MySQL 8.0 (Docker) | `mysql:3306` | `arcus_prod` (legacy volume name) | Separate volume from dev |
| **NVCCZ prod (NTS)** | MySQL 8.0 (Docker) | `mysql:3306` | `nvccz_prod` | localhost `:3327` on VPS |
| **NVCCZ client VPS** | MySQL 8.0 (Docker) | `mysql:3306` | `nvccz_dev` / `nvccz_prod` | `:3317` / `:3327` localhost on VPS |

**ORM:** Prisma — schema at `nvccz/prisma/schema.prisma` (~489 tables).  
**Connection string:** `DATABASE_URL` in `nvccz/.env` (gitignored).

### Local database connection

```text
DATABASE_URL="mysql://arcus_dev:localdev_arcus_2026@127.0.0.1:3306/arcus_dev?ssl-mode=DISABLED"
```

| Item | Value |
|------|-------|
| MySQL binary | `C:\Program Files\MySQL\MySQL Server 8.4\bin` |
| Data directory | `C:\mysql-local-data\data` |
| Config | `C:\mysql-local-data\my.ini` |
| Port | **3306** |
| User / password | `arcus_dev` / `localdev_arcus_2026` |

Full setup doc: [`local-mysql-dev-setup.md`](./local-mysql-dev-setup.md)

**Alternative — VPS tunnel (live `arcus_dev` on NTS):** Run `python scripts/_arcus-mysql-tunnel.py` from `nvccz-new` → forwards `localhost:3307` → VPS `127.0.0.1:3307`. Point `DATABASE_URL` at port `3307` instead of local `3306`. Use when you need real VPS data, not the local recreate.

### Migration strategy (how we actually work)

We use **two layers** of schema change:

| Layer | Tool | When |
|-------|------|------|
| **Schema sync** | `npx prisma db push` | After editing `prisma/schema.prisma` — applies model changes to MySQL |
| **Data / one-off migrations** | `npm run db:migrate:<name>` or raw SQL | Column backfills, seed data transforms, feature-specific DDL in `nvccz/scripts/run-*-migration.ts` |

We do **not** rely on Prisma Migrate deploy folders for day-to-day dev. `prisma db push` is the default for schema drift.

**Tracker (mandatory):** Every local schema/data change must be logged in [`vps-pending-migrations.md`](./vps-pending-migrations.md) with `appliedToLocal` / `appliedToVps` flags. Do not apply VPS changes ad hoc without updating that file.

### Local migrations — step by step

All commands run from **`C:\Users\lysp\Downloads\nvccz`** unless noted.

#### 1. Schema change (new model / column in Prisma)

```bash
# Edit prisma/schema.prisma, then:
npx prisma generate
npx prisma db push
```

Verify: restart `npm run dev`, hit an endpoint that uses the new field.

#### 2. Log the change

Append a row to `design-refs/vps-pending-migrations.md`:

```md
| `2026-08-30-my-change` | What changed | Exact SQL or prisma db push | true | false | Context |
```

#### 3. Feature-specific data migration (if needed)

Many features have dedicated scripts in `nvccz/package.json`:

```bash
npm run db:migrate:lp-portal-fe-gaps          # example: LP portal tables
npm run db:migrate:investments-v2-fe-gap        # example: investments gap
npm run db:migrate:all                          # runs bundled migration runner (use with care)
```

Check `package.json` for `db:migrate:*` — there are 80+ named migrations for historical features.

#### 4. Seed / demo data

| Command | Purpose |
|---------|---------|
| `npm run prisma:seed` | Base admin user, roles (`admin@nts.com` / `admin123`) |
| `npm run db:seed:portfolio-v11-local-demo` | PE fund + NTS/Demo deals for portfolio testing |
| `npm run db:seed:portal-test-users` | LP + investee portal test accounts |
| `npm run db:seed:investments-v2-demo` | Investments lean demo pack |
| `npm run db:seed:fpa-demo` | FP&A client demo |

**Local-only seeds** — do not blindly run on VPS if production data exists. Mark in `vps-pending-migrations.md`.

#### 5. Prisma Studio (inspect data)

```bash
npm run prisma:studio
```

### Server migrations — how they run

#### Automatic (every API deploy / container restart)

The API Docker entrypoint (`nvccz/deploy/docker-entrypoint.sh`) runs on **every** API container start:

```text
1. Wait for MySQL healthy
2. npx prisma db push --skip-generate    ← schema synced from deployed code
3. node deploy/ensure-admin.js           ← if RUN_SEED=1 (default in compose)
4. Start node dist/app.js
```

So deploying new backend code **automatically pushes schema** to the stack's MySQL. No separate migration step needed for Prisma model changes — they ride the API image deploy.

Compose sets `RUN_SEED: "1"` on dev/prod stacks — ensures admin user exists via `deploy/ensure-admin.js` (upsert, does not wipe data).

#### Manual on VPS (when automatic push is not enough)

Use when:

- A row in `vps-pending-migrations.md` has raw SQL (not covered by `schema.prisma`)
- You need a one-off data fix on production
- `prisma db push` failed and you need to inspect

```bash
ssh root@31.220.82.129

# Arcus dev API container
docker exec -it arcus-dev-api-1 npx prisma db push --skip-generate

# Run a seed inside the container
docker exec arcus-dev-api-1 npm run db:seed:portal-test-users

# Direct MySQL (dev DB on VPS localhost:3307)
docker exec -it arcus-dev-mysql-1 mysql -u arcus_dev -p arcus_dev

# NVCCZ prod
docker exec -it nvccz-prod-api-1 npx prisma db push --skip-generate
docker exec -it nvccz-prod-mysql-1 mysql -u nvccz_prod -p nvccz_prod
```

MySQL passwords live in server `secrets/*.env` (`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`) — generated on first deploy, preserved on re-deploy.

#### Apply VPS pending migrations (checklist)

When explicitly asked to sync VPS with local:

1. Open [`vps-pending-migrations.md`](./vps-pending-migrations.md).
2. For each row with `appliedToVps=false` that is **safe for that environment**, run the `how to apply` command (SSH, docker exec, or SQL).
3. Flip `appliedToVps` to `true` and note the date.
4. Re-run health check: `GET .../health` + one feature smoke test.

**Never** run local-only demo seeds on VPS with real client data.

### Server MySQL volumes (persistence)

Docker named volumes survive container rebuilds:

| Stack | Volume | Binds to |
|-------|--------|----------|
| Arcus dev | `arcus_dev_mysql` | `/var/lib/mysql` in mysql service |
| Arcus demo | `arcus_demo_mysql` | demo stack |
| NVCCZ prod | `nvccz_prod_mysql` | prod stack |

`docker compose down` without `-v` keeps data. `docker compose down -v` **wipes** the database — avoid on prod.

### Common DB troubleshooting

| Symptom | Fix |
|---------|-----|
| `Can't reach database server` on local | Start MySQL: `nvccz\scripts\start-local-mysql.bat` or `npm run start:servers` |
| API crash loop on VPS | Check `docker logs arcus-dev-api-1` — often `prisma db push` failing on schema conflict |
| `deal_reference_counters` drop error | Fixed — `DealReferenceCounter` model added to schema (Aug 2026) |
| Empty portfolio after fresh local DB | `npm run db:seed:portfolio-v11-local-demo` |
| Wrong data (local vs VPS) | Confirm `DATABASE_URL` port: `3306` = local, `3307` = tunnel to VPS |

---

## 9. Local development — start servers

### Convention: "start servers" = DB + backend + frontend

When the user says **"start servers"**, the agent must start **all three** in order:

```text
1. MySQL     → 127.0.0.1:3306
2. Backend   → 127.0.0.1:3009  (nvccz repo)
3. Frontend  → localhost:3000  (nvccz-new repo, staff portal)
```

Do **not** start only the frontend or only the backend unless the user explicitly asks for one service.

### One command (recommended)

From `nvccz-new`:

```bash
npm run start:servers
```

This runs `scripts/start-dev-servers.ps1` which:

1. Calls `nvccz\scripts\start-local-mysql.bat` (skips if `:3306` already listening)
2. Opens a new terminal with `npm run dev` in the backend repo
3. Opens a new terminal with `npm run dev` in the frontend repo (staff portal)

### Manual (three terminals)

```bash
# Terminal 1 — database
C:\Users\lysp\Downloads\nvccz\scripts\start-local-mysql.bat

# Terminal 2 — backend API
cd C:\Users\lysp\Downloads\nvccz
npm run dev

# Terminal 3 — frontend (staff portal)
cd C:\Users\lysp\Downloads\nvccz-new
npm run dev
```

Verify stack is up:

```bash
curl http://127.0.0.1:3009/health
# open http://localhost:3000/login
```

### Other portal dev modes (optional extra terminals)

Staff is the default. LP / investee / apply need **separate** frontend processes:

```bash
cd C:\Users\lysp\Downloads\nvccz-new
npm run dev:lp           # LP portal → localhost:3110
npm run dev:investee     # investee → localhost:3120
npm run dev:apply        # apply form → localhost:3130
```

Script: `scripts/run-portal-dev.mjs`. All portals share the **same** backend on `:3009`.

### Default API URL (local)

`http://127.0.0.1:3009/api` — set in `lib/api/api-client.ts` fallback.

### Test credentials

See [`design-refs/portal-test-credentials.md`](./portal-test-credentials.md):

| Portal | Email | Password |
|--------|-------|----------|
| Staff | `admin@nts.com` | `admin123` |
| LP | `lp.test@arcus.co.zw` | `PortalTest!2026` |
| Investee | `investee.test@arcus.co.zw` | `PortalTest!2026` |

### Upload mock (when testing file uploads locally)

Funding form / portfolio uploads need the upload sidecar. If remote upload is down:

```bash
cd C:\Users\lysp\Downloads\nvccz
npx ts-node --transpile-only scripts/local-upload-mock-server.ts
```

Or from `nvccz-new`: `npm run dev:upload`

---

## 10. Servers & credentials

### Server summary

| Environment | IP | SSH | Status (30 Aug 2026) |
|-------------|-----|-----|----------------------|
| **NTS shared VPS** (Arcus dev+demo + NVCCZ prod staging) | `31.220.82.129` | `root` / `<see .secrets/ssh.env — rotated 2026-09-07>` | **Online** — primary deploy target |
| **NVCCZ client VPS** | `102.217.49.126` | `user` / `user@123` on port **3131** | **Offline** — SSH timeout since 28 Aug |

> Rotate `<see .secrets/ssh.env — rotated 2026-09-07>` and `user@123` after handoff. Deploy scripts embed the NTS root password in `scripts/deploy-arcus-docker-vps.py` and `scripts/deploy-nvccz-nts-prod.py`.

### NTS VPS (`31.220.82.129`) — layout

```text
/var/www/projects/arcus/          # Arcus dev + demo stacks
  compose/                        # docker-compose.dev.yml, docker-compose.demo.yml
  secrets/                        # dev.env, demo.env (generated on server, not in git)
  src/api/                        # Backend tarball extract
  src/ui/                         # Frontend tarball extract
  upload-service/                 # Media upload sidecar

/var/www/projects/nvccz/          # NVCCZ prod stack (staging on NTS)
  compose/                        # docker-compose.prod.yml
  secrets/                        # prod.env
  src/api/
  src/ui/
  upload-service/
```

Reverse proxy: **Traefik** (`lms-traefik`, TLS-ALPN on `:443`, Docker network `lms_lms-network`).

### NVCCZ client VPS (`102.217.49.126`) — layout (when online)

```text
/var/www/projects/nvccz/
  compose/                        # dev + prod compose files
  secrets/                        # dev.env, prod.env
  src/api/, src/ui/
```

Custom ports (no Traefik): dev UI `:3100`, dev API `:3109`, prod UI `:3200`, prod API `:3209`.

Known issue: disk was in emergency read-only mode once; may need `fsck` if writes fail again.

---

## 11. Deployment architecture

### How deploy works

1. Python script on dev machine (`scripts/deploy-*.py`) uses **Paramiko SSH**.
2. Tarballs backend (`nvccz`) + frontend (`nvccz-new`) excluding `node_modules`, `.next`, `.git`, etc.
3. Uploads to VPS `/var/www/projects/<stack>/src/`.
4. Writes/merges `secrets/*.env` (preserves existing DB passwords on re-deploy).
5. Runs `docker compose up -d --build` (20–40 min for full UI rebuild — 4 portal images).

### Arcus environments (on `31.220.82.129`)

| Env | Staff UI | API | DB |
|-----|----------|-----|-----|
| **dev** | https://dev.arcus.co.zw | https://dev-api.arcus.co.zw/api | `arcus_dev` |
| **dev LP** | https://lp.dev.arcus.co.zw or `:3110` | same API | — |
| **dev Investee** | https://investee.dev.arcus.co.zw or `:3120` | same API | — |
| **dev Apply** | https://apply.dev.arcus.co.zw or `:3130` | same API | — |
| **demo** | https://demo.arcus.co.zw | https://demo-api.arcus.co.zw/api | `arcus_prod` (legacy volume name) |

Legacy hostnames still routed during cutover: `dev-lp.arcus.co.zw`, `dev-investee.arcus.co.zw`, `dev-apply.arcus.co.zw`.

Login (first boot): `admin@nts.com` / `admin123`

Upload sidecar: dev `:3050`, demo `:3051` (localhost-bound on VPS).

### NVCCZ prod on NTS (staging until client VPS returns)

| Portal | Intended URL | Legacy URL (still works) |
|--------|--------------|--------------------------|
| Staff | TBD — set `NVCCZ_PUBLIC_STAFF_HOST` | https://matanho.nvccz.com |
| Apply | https://nvccz.online | https://matanho-apply.nvccz.com |
| LP | https://lp.nvccz.online | https://matanho-lp.nvccz.com |
| Investee | https://investee.nvccz.online | https://matanho-investee.nvccz.com |
| API | https://api.nvccz.online | https://matanho-api.nvccz.com |

IP fallback (no DNS): staff `:3200`, LP `:3210`, investee `:3220`, API `:3209`.

Login: `admin@nvccz.co.zw` — password in gitignored `deploy/nvccz/CREDENTIALS.nts-prod.local.md`.

Upload sidecar: prod `:3250` (localhost on VPS).

### Media / upload flow

```text
Browser → API endpoint → POST to upload sidecar → volume on disk
Browser ← GET /api/public-media/{type}/{file} ← API proxies from sidecar
```

Setup scripts: `scripts/setup-arcus-storage.py`, `scripts/_nvccz-verify-storage.py`.

---

## 12. Deploy commands (from your machine)

All run from `C:\Users\lysp\Downloads\nvccz-new` unless noted.

### Arcus (dev + demo on NTS)

```bash
# Preferred for day-to-day Arcus Dev (dev.matanho.com): selective portals, no demo
python scripts/deploy-arcus-dev-selective.py --portals staff --yes
python scripts/deploy-arcus-dev-selective.py --detect
python scripts/seed-arcus-dev-portfolio.py --check-only
# Docs: design-refs/arcus-dev-selective-deploy.md

# Full deploy — API + all portal UIs (dev) + demo stack (slow)
python scripts/deploy-arcus-docker-vps.py

# API-only rebuild (faster)
python scripts/rebuild-arcus-api.py

# Storage sidecar setup / verify
python scripts/setup-arcus-storage.py
python scripts/_arcus-verify-storage.py

# Seed portal test users on VPS
python scripts/seed-arcus-portal-test-users.py
# Or on server:
docker exec arcus-dev-api-1 npm run db:seed:portal-test-users
```

### NVCCZ prod on NTS

```bash
python scripts/deploy-nvccz-nts-prod.py

# Verify after deploy
python scripts/_nvccz-nts-verify-prod.py
python scripts/fix-nvccz-nts-admin.py      # reset admin password if needed
python scripts/_nvccz-verify-https-bake.py   # confirm UI baked correct API URL
```

### NVCCZ on client VPS (when `102.217.49.126` is back)

```bash
# One-time Docker install
python scripts/install-docker-nvccz-vps.py

# Full deploy
python scripts/deploy-nvccz-docker-vps.py

# Wait-loop that auto-deploys when VPS comes online
python scripts/run-nvccz-deploy-when-ready.py

# Incremental
python scripts/rebuild-nvccz-api.py
python scripts/rebuild-nvccz-ui.py
python scripts/_nvccz-verify-login.py
```

### Pre-DNS verification (Host header curl)

```bash
curl -skI -H "Host: apply.dev.arcus.co.zw" https://31.220.82.129/login
curl -skI -H "Host: nvccz.online" https://31.220.82.129/funding-application
curl -fsS https://dev-api.arcus.co.zw/health
curl -fsS https://matanho-api.nvccz.com/health
```

---

## 13. On-server operations

SSH to NTS:

```bash
ssh root@31.220.82.129
# password: <see .secrets/ssh.env — rotated 2026-09-07>
```

### Arcus

```bash
cd /var/www/projects/arcus
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml ps
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml up -d --build
docker logs arcus-dev-api-1 --tail 100
docker logs arcus-dev-ui-staff-1 --tail 50
```

### NVCCZ prod

```bash
cd /var/www/projects/nvccz
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build
docker logs nvccz-prod-api-1 --tail 100
```

### Health checks

| Check | URL |
|-------|-----|
| Arcus dev API | `GET https://dev-api.arcus.co.zw/health` |
| Arcus demo API | `GET https://demo-api.arcus.co.zw/health` |
| NVCCZ prod API | `GET https://api.nvccz.online/health` or `:3209/health` |

---

## 14. Where we left off — deployment (30 Aug 2026)

Source: [`design-refs/multi-portal-deployment-20260828.md`](./multi-portal-deployment-20260828.md) (updated 30 Aug).

### Completed recently

| Area | Status |
|------|--------|
| **Prisma schema fix** | Added `DealReferenceCounter` model — stopped `prisma db push` crash loop on Arcus dev API |
| **Arcus dev API** | Healthy; DB connected; migrations in sync |
| **Traefik routing** | Updated for new subdomain pattern (`lp.dev.arcus.co.zw`, etc.) + NVCCZ `nvccz.online` apply UI |
| **Portal URL config** | Removed hardcoded production defaults from `lib/portal/config.ts` — domains from build-time env only |
| **Deploy scripts** | `deploy-arcus-docker-vps.py` and `deploy-nvccz-nts-prod.py` updated with `PUBLIC_APPLY_PORTAL_URL`, CORS, NVCCZ online URLs |
| **Media storage** | Upload sidecars healthy (Arcus `:3050`, NVCCZ `:3250`) |
| **Portfolio V11 live wire** | All workstreams A–E complete locally (§6); ships inside **staff** `ui-staff` image — no separate portfolio deploy |

### In progress at handoff

| Item | Status |
|------|--------|
| **Arcus UI full deploy** | Was **running** — 4 portal images × dev + demo stacks (~20–40 min each) |
| **NVCCZ full prod deploy on NTS** | Was **running** in parallel with Arcus UI |
| **Post-deploy verification** | Re-run Host-header curls and login smoke tests after UI builds finish |

### Not yet done (needs action after deploy completes)

1. **DNS for `nvccz.online`** — currently points to AWS parking IP `15.197.148.33`; must change A record → `31.220.82.129`
2. **DNS for new Arcus subdomains** — `apply.dev.arcus.co.zw`, `lp.dev.arcus.co.zw`, `investee.dev.arcus.co.zw` (A → `31.220.82.129`)
3. **DNS for NVCCZ subdomains** — `lp.nvccz.online`, `investee.nvccz.online`, `api.nvccz.online`
4. **NVCCZ staff domain** — purchase/configure; set `NVCCZ_PUBLIC_STAFF_HOST` in deploy env
5. **`nvccz.com` DNS** — nameservers point to `server-620376`, not GoDaddy; edit zone there or migrate NS — see [`nvccz-matanho-domains.md`](./nvccz-matanho-domains.md)
6. **Client VPS migration** — `102.217.49.126` unreachable; when back, transfer volumes + `secrets/prod.env`, run `deploy-nvccz-docker-vps.py`
7. **VPS pending migrations** — local-only changes not yet applied to VPS DB — see [`vps-pending-migrations.md`](./vps-pending-migrations.md)
8. **Full upload round-trip test** — after UI deploy, verify file upload → public-media fetch end-to-end per portal

---

## 15. Pending / blocked items

### Infrastructure blockers

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| `102.217.49.126` SSH timeout | Cannot deploy to client-owned VPS | NVCCZ prod runs on NTS (`31.220.82.129`) as staging |
| `nvccz.online` wrong A record | Public apply URL won't resolve | Manual DNS change at registrar |
| `nvccz.com` NS not on GoDaddy | `matanho.nvccz.com` subdomains won't propagate from GoDaddy UI | Edit zone on `server-620376` panel |
| Let's Encrypt rate limits | May delay TLS after DNS fix | Wait ~1h after failed ACME attempts |

### Product / engineering backlog (high level)

| Area | Doc |
|------|-----|
| Investments V2 gaps | `investments-v2-backend-asks.md`, `investments-v2-end-to-end-gaps.md` |
| Portfolio live BE gaps | `portfolio-v23-backend-asks.md`, `portfolio-v11-live-backend.md` |
| Fundraising stages | `fundraising-stages-index.md` |
| Accounting / Procurement / Performance mocks → live | respective `*-ui-handoff.md` files |
| Recon / trading walkthroughs | `walkthrough-order-to-recon.md`, `demo-trading-packs-index.md` |

---

## 16. Design-refs index (key docs)

| Category | Files |
|----------|-------|
| **How we work** | `arcus-feature-delivery-playbook.md`, `client-ui-faithful-port-playbook.md` |
| **Deployment** | `multi-portal-deployment-20260828.md`, `multi-portal-domain-separation.md`, `nvccz-matanho-domains.md` |
| **Local dev** | `local-mysql-dev-setup.md`, `portal-test-credentials.md`, `vps-pending-migrations.md` |
| **Database** | `vps-pending-migrations.md`, `local-mysql-dev-setup.md`, `credentials-and-database-access.md` |
| **Portfolio** | `portfolio-v11-ui-handoff.md`, `portfolio-v23-unfinished-tracker.md`, `portfolio-v23-backend-asks.md`, `portfolio-v11-live-backend.md` |
| **Investments** | `walkthrough-investments-v2-end-to-end.md`, `investments-v2-backend-asks.md` |
| **Portals** | `multi-portal-domain-separation.md`, `investee-portal-v8-ui-handoff.md`, `lp-portal-srd-ui-requirements.md`, `funding-application-public.md` |
| **Client mocks** | `home-v3-ui-handoff.md`, `accounting-v52-ui-handoff.md`, `procurement-v23-ui-handoff.md`, `performance-v22-ui-handoff.md`, `payroll-v6-ui-handoff.md` |
| **Deploy READMEs** | `deploy/arcus/README.md`, `deploy/nvccz/README.md` |

---

## 17. Cursor workspace rules

Mandatory rules in `.cursor/rules/`:

| File | Rule |
|------|------|
| `agent-owns-backend.mdc` | Agent runs BE ops; never hand off restart/migrate to user |
| `verify-work-twice.mdc` | Two-pass verification before claiming "live/wired" |
| `backend-asks-md.mdc` | BE gaps → `design-refs/*.md` |
| `arcus-button-styles.mdc` | Pill buttons (`rounded-full`) on Arcus modules |
| `portfolio-progressive-loads.mdc` | Portfolio module loading patterns |

Skill for client UI ports: `.cursor/skills/client-ui-faithful-port/SKILL.md`

---

## Quick reference card

```text
FE repo:     C:\Users\lysp\Downloads\nvccz-new
BE repo:     C:\Users\lysp\Downloads\nvccz
Local DB:    127.0.0.1:3306  arcus_dev / localdev_arcus_2026
Local API:   http://127.0.0.1:3009/api
Local staff: npm run dev  →  http://localhost:3000

Start all:   npm run start:servers   (MySQL + BE + FE)

Schema:      cd nvccz && npx prisma db push
Migrations:  design-refs/vps-pending-migrations.md

NTS VPS:     31.220.82.129  (root / <see .secrets/ssh.env — rotated 2026-09-07>)
Client VPS:  102.217.49.126  (user / user@123 :3131) — OFFLINE

Deploy Arcus:  python scripts/deploy-arcus-docker-vps.py
Deploy NVCCZ:  python scripts/deploy-nvccz-nts-prod.py

Arcus dev:     https://dev.arcus.co.zw
Arcus API:     https://dev-api.arcus.co.zw/health
NVCCZ apply:   https://nvccz.online  (DNS must point to 31.220.82.129)

Staff login:   admin@nts.com / admin123
Docs home:     design-refs/
```

---

*Last updated: 30 Aug 2026. Update [§14 deployment](#14-where-we-left-off--deployment-30-aug-2026), [§6 portfolio](#6-portfolio-module--where-we-left-off), and [§8 migrations](#8-database--migrations) after each work session.*
