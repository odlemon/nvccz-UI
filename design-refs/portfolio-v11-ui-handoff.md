# Portfolio Management (V23) — UI handoff

> **Status:** Integrated — client Matanho Portfolio Management **V23** hosted at `/portfolio-v11`.  
> **Source:** `Matanho_Portfolio_Management_v23_Production_Handoff` (2026-08-17)  
> **Prior source:** V11 handoff (same SPA lineage; V23 = blue theme + V22 ops polish + API handoff)  
> **Mode:** Interactive mock (Mode A runtime host) — mock data; live API optional via client bootstrap contract.  
> **Live module left alone:** `/portfolio` (legacy Portfolio Management)

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
| `dashboard` | `/portfolio-v11` |
| `deals` | `/portfolio-v11/deals` |
| `funds` | `/portfolio-v11/funds` |
| `capital-calls` | `/portfolio-v11/capital-calls` |
| `companies` | `/portfolio-v11/companies` |
| `cash-accounts` | `/portfolio-v11/cash-accounts` |
| `cash-overview` | `/portfolio-v11/cash-overview` |
| `cash-ledger` | `/portfolio-v11/cash-ledger` |
| `cash-reservations` | `/portfolio-v11/cash-reservations` |
| `statement-imports` | `/portfolio-v11/statement-imports` |
| `reconciliations` | `/portfolio-v11/reconciliations` |
| `exceptions` | `/portfolio-v11/exceptions` |
| `period-close` | `/portfolio-v11/period-close` |
| `reporting` | `/portfolio-v11/reporting` |
| `fund-performance` | `/portfolio-v11/fund-performance` |
| `lps` | `/portfolio-v11/lps` |
| `documents-vault` | `/portfolio-v11/documents` |
| `reports-vault` | `/portfolio-v11/reports-vault` |
| `e-signatures` | `/portfolio-v11/e-signatures` |
| `mailer-lists` | `/portfolio-v11/mailer-lists` |
| `settings` | `/portfolio-v11/settings` |
| detail pages | `/portfolio-v11/.../detail` (and recon workspace / report builder) |

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
| Extract script | `scripts/extract-portfolio-v23.mjs` (re-run to refresh from client package) |

## Deviations

1. Arcus SharedTopbar above client chrome.
2. In-memory client router synced to Next paths.
3. Client radii/colors kept (not Arcus pills).
4. Tailwind `@tailwind` directives stripped (client ships them uncompiled; design uses custom CSS).
5. Live `/portfolio` unchanged.
6. Public preview: middleware pass-through `/portfolio-v11`.

## Public preview

**http://localhost:3002/portfolio-v11**

(No login required.)

## Verify

1. Open `/portfolio-v11` — dashboard loads with client sidebar (**blue** accent theme)
2. Walk all sidebar workspaces
3. Open a fund/company/deal detail — URL updates
4. App Switcher shows **Portfolio (V11)** next to live **Portfolio Management**
