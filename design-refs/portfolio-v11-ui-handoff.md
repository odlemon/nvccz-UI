# Portfolio Management (V25) — UI handoff

> **Status:** Live-wired — public route **`/portfolio`** (formerly `/portfolio-v11`; 308 redirect kept). Hydrates from `arcus_dev` APIs when authenticated; gaps in [portfolio-v23-backend-asks.md](./portfolio-v23-backend-asks.md).  
> **Source:** `Matanho_Portfolio_Management_v25_Production_Handoff` (Interactive Frontend v25)  
> **Prior sources:** V23 → V11 handoff (same SPA lineage). Internal package folders remain `portfolio-v11-*`.  
> **Mode:** Auth-gated live hydrate via `lib/portfolio-v11/bootstrap.ts` → `MatanhoPortfolioUI.hydrate`; mock fixtures only if unsigned-in is somehow reached.  
> **Top bar:** Arcus `SharedTopbar` (client HTML topbar hidden under `[data-arcus-shell]`).  
> **Deploy:** rides staff portal image unless separately requested

See comparison: [portfolio-v23-comparison.md](./portfolio-v23-comparison.md)

## What shipped

Full client V23 suite (upgraded from V11 in-place):

- Shell (collapsed sidebar, topbar, command palette, drawers, modals, toasts)
- Investments: Dashboard, Deal Flow, Funds, Capital Calls, Portfolio Companies (+ detail pages)
- Fund Operations: Accounts, Cash Overview/Ledger/Reservations, Statement Imports, Reconciliations, Exceptions, Period Close
- Reporting & Records: Reporting Schedules, Fund Performance, LPs, Documents/Reports Vault, E-Signatures, Mailer Lists
- Settings & Integrations
- Detail workspaces: deal/company/fund/LP/capital-call detail, reconciliation workspace, report builder, applicant portal

## Routes

| Client page id | Next path |
|----------------|-----------|
| `dashboard` | `/portfolio` |
| `deals` | `/portfolio/deals` |
| `funds` | `/portfolio/funds` |
| `capital-calls` | `/portfolio/capital-calls` |
| `companies` | `/portfolio/companies` |
| `cash-accounts` | `/portfolio/cash-accounts` |
| `cash-overview` | `/portfolio/cash-overview` |
| `cash-ledger` | `/portfolio/cash-ledger` |
| `cash-reservations` | `/portfolio/cash-reservations` |
| `statement-imports` | `/portfolio/statement-imports` |
| `reconciliations` | `/portfolio/reconciliations` |
| `exceptions` | `/portfolio/exceptions` |
| `period-close` | `/portfolio/period-close` |
| `reporting` | `/portfolio/reporting` |
| `fund-performance` | `/portfolio/fund-performance` |
| `lps` | `/portfolio/lps` |
| `documents-vault` | `/portfolio/documents` |
| `reports-vault` | `/portfolio/reports-vault` |
| `e-signatures` | `/portfolio/e-signatures` |
| `mailer-lists` | `/portfolio/mailer-lists` |
| `settings` | `/portfolio/settings` |
| detail pages | `/portfolio/.../detail` (and recon workspace / report builder) |

## Code map

| Layer | Path |
|-------|------|
| Module | `lib/config/modules.ts` — `portfolio-v11` / **Portfolio (V11)** |
| Host | `components/portfolio-v11-mock/portfolio-v11-app.tsx` |
| Runtime | `components/portfolio-v11-mock/matanho-portfolio-runtime.js` |
| Shell HTML | `components/portfolio-v11-mock/shell.ts` |
| CSS | `portfolio-v11.css` + `portfolio-v11-overrides.css` |
| Nav | `lib/portfolio-v11-mock/nav.ts` |
| Assets | `public/portfolio-v11/assets/` |
| Extract script | `scripts/extract-portfolio-v25.mjs` (re-run to refresh from V25 client package) |
| Assets | `public/portfolio/assets/` |

## Deviations

1. Arcus SharedTopbar above client chrome.
2. In-memory client router synced to Next paths.
3. Client radii/colors kept (not Arcus pills).
4. Tailwind `@tailwind` directives stripped (client ships them uncompiled; design uses custom CSS).
5. Live `/portfolio` unchanged.
6. Public preview: middleware pass-through `/portfolio-v11`.

## Public preview

**http://localhost:3001/portfolio** (staff portal; login `admin@nts.com` / `admin123` for live data)

Old `/portfolio-v11` paths 308-redirect to `/portfolio`.

## Verify

1. Open `/portfolio` — dashboard loads with client sidebar (**blue** accent theme); Arcus SharedTopbar above (client HTML topbar hidden)
2. Deal Flow shows seeded deals (NTS / Arcus Demo), not Nova Analytics fixtures when authenticated
3. Design tokens match V25 standalone (`--brand:#2563eb`, `--topbar:68px`, min 10px type)
2. Walk all sidebar workspaces
3. Open a fund/company/deal detail — URL updates
4. App Switcher shows **Portfolio (V11)** next to live **Portfolio Management**
