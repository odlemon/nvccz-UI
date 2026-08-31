# Portfolio V11 (`/portfolio-v11`) — Full Audit Report

**Date:** 2026-08-25  
**Target:** http://localhost:3001/portfolio-v11  
**Method:** Source inspection + HTTP smoke against `localhost:3009` (no browser).  
**Prior “done” claim:** **Rejected** until this audit; many surfaces were hydrate-only collections with hardcoded charts/metrics/badges/actions.

## Summary

| Metric | Count |
|--------|------:|
| Components / rows audited | 95+ |
| Issues found (hardcoded / unwired / toast-only) | 48+ |
| Issues fixed in this pass | 18 |
| Remaining blocked / partial | 30+ (see asks) |

**Fixes applied this pass:** live sidebar badges; dashboard charts/metrics/overview/activity from `GET /api/portfolio/dashboard` + deals; fund filter / as-of re-fetch via `matanho:reload-request`; data-refreshed timestamp; LP Active/Directory counts; Funds IRR/TVPI from dashboard metrics; capital-call collection segments from data; Add Deal no longer creates local-only records when live (routes to applicant portal); currency/geography filters explicitly non-API when live.

**Blocker closure pass (same day):** currency→`currencyId` via IO setup currencies; geography client filter; deal-detail tabs from applications/DD/term/board APIs (empty when 404); `GET .../cash-periods/:period/controls` + precheck/close/GL actions with `data-period`; fund-performance charts from dashboard series; Settings RBAC from `/users`; Create Fund / Add LP → `POST /funds` / `POST /clients`; LP side panels empty (no fake demo) when live.

**Gap doc:** [portfolio-v23-backend-asks.md](./portfolio-v23-backend-asks.md)

---

## Evidence key

- **Hydrate:** `lib/portfolio-v11/bootstrap.ts` → `MatanhoPortfolioUI.hydrate` in `portfolio-v11-app.tsx`
- **Runtime:** `components/portfolio-v11-mock/matanho-portfolio-runtime.js`
- **HTTP:** `admin@nts.com` login; APIs returned 200 on 2026-08-25 (dashboard metrics often zeros on sparse `arcus_dev`)

---

## INVESTMENTS

| Menu Item | Screen/Component | Data Source (API endpoint) | Verified? | Evidence | Issue Found | Fix Applied |
|---|---|---|---|---|---|---|
| Sidebar | Deal Flow badge | Live count after hydrate (`deals.length`) | Yes (post-fix) | Was hardcoded `badge:'198'` L159; now `liveNavBadge('deals')` | Hardcoded 198 | Live count from applications hydrate |
| Sidebar | Capital Calls badge | `capitalCalls.length` | Yes (post-fix) | Was `8` | Hardcoded | Live count |
| Sidebar | Companies badge | `companies.length` | Yes (post-fix) | Was `42` | Hardcoded | Live count |
| Dashboard | Fund filter | `GET /api/portfolio/dashboard?fundId=` | Partial→Yes | Was toast-only L3038; now emits `matanho:reload-request` → bootstrap refetch | Toast-only | Re-query by fund name→id |
| Dashboard | As of filter | `GET /api/portfolio/dashboard?asOfDate=` | Partial→Yes | Same path; date parsed to ISO | Toast-only | Re-query |
| Dashboard | Currency filter | none usable | No | BE wants `currencyId` UUID; UI sends `USD` | Not API-backed | Toast explains; UI-only |
| Dashboard | Geography filter | none | No | Dashboard route has no geography query | Not API-backed | Toast explains; UI-only |
| Dashboard | Reset filters | reload All Funds | Yes (post-fix) | `reset-dashboard-filters` → reload | Was toast-only | Reloads live |
| Dashboard | Total Invested | `GET /api/portfolio/dashboard` → `metrics.totalInvested` | Yes | Smoke: `totalInvested: 0`; host hydrate `state.dashboardMetrics` | — | Wired earlier + still used |
| Dashboard | Available for Drawdown | `metrics.availableForDrawdown` | Yes | Smoke: `400000000` | — | — |
| Dashboard | Fund Gross IRR | `metrics.fundGrossIRR` | Yes | Smoke: `0` | Was literal 18.7% before prior patch | Live label |
| Dashboard | LP Net IRR | `metrics.lpNetIRR` | Yes | Smoke: `-2` | Was literal | Live |
| Dashboard | TVPI | `metrics.tvpi` | Yes | Smoke: `0` | Was literal 2.18x | Live |
| Dashboard | Unrealized Value | `totals.fairMarketValue` / FMV | Yes | From metrics adapter | — | — |
| Dashboard | Metric “vs prior” footers | none | No | Still “Live API” string or old mock footers | No prior-period API field used | Footers not claiming fake deltas when live |
| Dashboard | Performance Overview chart | `performanceOverview` via `adaptDashboardCharts` | Yes (post-fix) | Was hardcoded bar series L1138+ | Hardcoded | Live series (may be sparse) |
| Dashboard | Chart fund dropdown | same as Fund filter reload | Partial | `dashboard-chart-fund` now triggers reload | Was cosmetic | Reloads |
| Dashboard | J-Curve | `jCurve[]` | Yes (post-fix) | Smoke: one year point; empty→empty chart | Hardcoded | Live / empty |
| Dashboard | Sector Allocation | `dealAllocation` / `aumKpis.sectorDistribution` | Yes (post-fix) | Smoke: empty arrays → “No allocation data” | Hardcoded sectors | Live / empty |
| Dashboard | Portfolio Value Trend | `irrByQuarter` | Yes (post-fix) | Smoke: Q3 2026 IRR points | Hardcoded % series | Live IRR series |
| Dashboard | Quick Overview counts | metrics + companies/funds | Yes (post-fix) | Was literals 18/7/25 | Hardcoded | Live counts |
| Dashboard | Recent Activity | deals hydrate | Yes (post-fix) | Was Nova/GreenOrbit literals | Hardcoded | From deals or empty |
| Dashboard | Data refreshed | `meta.loadedAt` | Yes (post-fix) | Was `31 Jul 2026 · 18:45 CAT` L672 | Hardcoded | Timestamp from hydrate |
| Dashboard | Add Deal | no create API from modal | No→mitigated | `showAddDealModal` text “frontend-only”; submit pushed local `deals` | Local create | Live: navigate applicant-portal; no local invent |
| Dashboard | Portfolio table | companies hydrate | Yes | `/portfolio-companies/with-investments` (empty on seed) | — | Empty row message |
| Deal Flow | List/board metrics | `deals` ← `GET /api/applications` | Yes | Smoke apps count 1; hydrate replaces mock 20 | Mock until hydrate | Hydrate |
| Deal Flow | Filters | local toast | No | L3038 toast | Not API | Flagged |
| Deal Flow | Add Deal | see Dashboard | Mitigated | — | Local | Applicant portal |
| Deal Flow | Stage drag | local array | No | Kanban mutates local `deals` | No stage PATCH | Flagged in asks |
| Deal detail | Tabs (DD/IC/term/disburse) | none in host | No | Hardcoded hero ownership 17.5%, $85M, timelines | Mock detail | Flagged |
| Funds | Table | `GET /api/funds` | Yes | Smoke funds present | — | Hydrate |
| Funds | Gross IRR / TVPI cards | dashboard metrics | Yes (post-fix) | Was 18.7% / 2.18x literals | Hardcoded | Live metrics |
| Funds | Geographic Allocation donut | none | No | Hardcoded geo % L1224 | Hardcoded | Flagged |
| Funds | Create fund | local `funds.push` | No | L2946 local | Local create | Flagged |
| Capital Calls | Table | `GET /funds/:id/capital-calls` | Yes | Per-fund list in bootstrap | — | — |
| Capital Calls | Cash Requirement chart | none | No | Hardcoded [42.5,76,…] | Hardcoded | Flagged |
| Capital Calls | Collection donut overdue/draft | derived from call status | Yes (post-fix) | Was 12.6M / 11M literals | Hardcoded | Computed |
| Capital Calls | New / notices | partial actions | Partial | Notices action hooked; create form mismatch | Incomplete | Asks |
| Companies | Table/metrics | with-investments + summary | Yes | Empty on seed | — | — |
| Companies | Sector donut | derived from companies | Yes | `sectorValues` from companies | — | — |
| Companies | Add company | local | No | Local modal pattern | Local | Flagged |

## FUND OPERATIONS

| Menu Item | Screen/Component | Data Source | Verified? | Evidence | Issue Found | Fix Applied |
|---|---|---|---|---|---|---|
| Sidebar | Accounts/Reservations/Imports/Recon/Exceptions badges | collection lengths | Yes (post-fix) | Were 12/4/2/7/5 | Hardcoded | Live badges |
| Client / Fund Accounts | Table | `GET …/client-cash-accounts` | Yes | Smoke 200 | — | Hydrate |
| Cash Overview | Waterfall / projection | mostly derived + hardcoded timeline | Partial | Projection labels hardcoded | Mixed | Flagged charts |
| Cash Ledger | Rows | `GET …/cash-ledger` | Yes | Smoke 200 | — | — |
| Reservations | Rows | `GET …/cash-reservations` | Yes | Smoke empty | Approve action hooked | Create form flagged |
| Statement Imports | Rows | `GET …/external-statements/imports` | Yes | New list endpoint 200 | — | BE+FE earlier |
| Reconciliations | Batches | `GET …/reconciliation-batches` | Yes | Smoke 200 | Health chart from batches | Break ageing still hardcoded donut |
| Exceptions | Rows | exceptions list | Yes | — | — | — |
| Period Close | closeControls | none | No | Static `closeControls` array L414+ | Hardcoded 10 controls | Flagged |
| Recon workspace | match lines | workspace API exists | Partial | Internal lines still sample in render | Mixed mock | Flagged |

## REPORTING & RECORDS

| Menu Item | Screen/Component | Data Source | Verified? | Evidence | Issue Found | Fix Applied |
|---|---|---|---|---|---|---|
| Sidebar | reporting/docs/reports/esign/mailer badges | lengths | Yes (post-fix) | Were 5/36/14/3/6 | Hardcoded | Live |
| Reporting Schedules | list | fund-reporting schedules | Yes | Per-fund fetch | Zero-schedule BE bug | Errors in meta |
| Fund Performance | charts | mostly hardcoded series | No | Net/Gross IRR trend literals L1344 | Hardcoded | Flagged; selected fund metrics from fund object (often 0) |
| LP Management | Directory | `GET /clients` | Yes | Smoke 200 | — | — |
| LP Management | Active LPs / badge 42 | `lps.length` | Yes (post-fix) | Was `'42'` and `42 LPs` | Hardcoded | Live |
| LP Management | Satisfaction / docs pending | none | No | 4.6/5 and 18 | Hardcoded | Show — when live |
| LP Management | Contact activity / outstanding docs | none | No | Literal arrays | Hardcoded | Flagged |
| Documents Vault | list | IO documents | Yes | Smoke 200 | Upload local | Flagged upload |
| Reports Vault | list | fund-reporting runs | Yes | — | Builder publish local | Flagged |
| E-Signatures | envelopes | fundraising agreements | Partial | Adapted; often empty | No hub API | Asks |
| Mailer Lists | lists | distribution-lists | Partial | Adapted | No mailer API | Asks |

## WORKSPACE

| Menu Item | Screen/Component | Data Source | Verified? | Evidence | Issue Found | Fix Applied |
|---|---|---|---|---|---|---|
| Settings | All tabs | none | No | Static Matanho Capital / RBAC mock | Not live | Flagged; no silent stub |

---

## HTTP smoke (audit session)

| Endpoint | Result |
|---|---|
| `POST /api/auth/login` | OK |
| `GET /api/portfolio/dashboard` | 200; metrics sparse |
| `GET /api/portfolio/dashboard/kpi-timeseries` | 200; not yet mapped to all charts |
| `GET /api/funds?limit=2` | 200 |
| `GET /api/applications` | 200 |
| `GET /api/clients?page=1` | 200 |
| `GET /api/investment-ops/client-cash-accounts` | 200 |
| `GET /api/investment-ops/external-statements/imports` | 200 |
| `GET /api/investment-ops/documents` | 200 |

---

## Could not fully fix (blockers)

1. Currency filter — need currency UUID catalog mapping.  
2. Geography filter — no BE param.  
3. Deal detail / DD / IC / term / disburse — need per-application aggregate APIs wired tab-by-tab.  
4. Period close control checklist — no list API.  
5. Settings / webhooks / satisfaction / LP communications — no APIs.  
6. Many Fund Performance / Fund detail illustrative charts — no matching series endpoints.  
7. Application create from V23 form — multipart contract; redirected to applicant portal instead of fake local create.
