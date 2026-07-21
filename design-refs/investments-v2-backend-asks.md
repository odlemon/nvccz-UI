# Investments V2 — Backend asks

**Date:** 2026-07-19  
**Audience:** Backend + Frontend  
**Base path FE uses:** `/api/investment-ops` via `NEXT_PUBLIC_API_BASE_URL`

> **2026-07-20 full-module audit:** Reads ≠ full create path. See **[`investments-v2-end-to-end-gaps.md`](./investments-v2-end-to-end-gaps.md)**.  
> **E2E BE answers applied on FE:** **[`investments-v2-e2e-be-answers-fe-closure.md`](./investments-v2-e2e-be-answers-fe-closure.md)**.  
> **Finish the module (single source of truth):** **[`investments-v2-module-completion.md`](./investments-v2-module-completion.md)** — BE A1–A18 + FE F1–F13 + product P1–P5.

| Surface | Spec | FE client |
| --- | --- | --- |
| Core (dashboard, portfolios, orders, valuation, accounting, docs, setup) | `design-refs/investments api.md` | `lib/api/investment-ops-api.ts` |
| Cash reconciliation | `design-refs/recon.md` | `lib/api/stock-picker-cash-api.ts` |

**Do not use for cash:** `/api/investment-ops/reconciliation/*` (holdings/trade §22). Cash uses `/reconciliation-batches`, `/matches`, `/cash-ledger`, etc.

---

## FE gap closure status (2026-07-20)

Backend responses for Part A + Part B were applied on the FE (API clients, adapters, pages). Historical gap text below is retained for ticket context.

| Ask | BE | FE |
| --- | --- | --- |
| **A1** Money strings | Done | Types + `formatMoneyDisplay` |
| **A2** List envelopes | Prefer paged | `unwrapList` in slice + helpers |
| **A3** Setup stubs | BE enrichment | Sparse rows until payload rich |
| **A4** Error codes | Catalog shipped | `formatOpsError` (+ optional `code`) |
| **A5** Portfolios vs setup/funds | Prefer `/portfolios` | Unchanged (pickers use portfolios) |
| **A6** Path namespaces | Keep distinct | Cash vs holdings clients separate |
| **A7** Compliance results | `GET /compliance/results` | Wired on compliance page |
| **A8** Blotters | Real CRUD | `listBlotters` / `createBlotter` on orderbook |
| **A9** Order/trade enrichment | Names, taxes, filled | Adapters prefer BE fields |
| **A10** Model PATCH + `linkedFundId` | Done | Models create/edit wired |
| **A11** Portfolio cash split | `cashBalance` / `cashPct` / `securitiesValue` | `mapOverviewMetrics` |
| **A12** Transactions dual names | Canonical aliases | Adapter already defensive |
| **A13** Instrument `latestPrice` | Done | `mapInstrumentRow` |
| **A14–A16** Valuation actions / inputs / PnL | Done | Valuation page wired |
| **A17–A19** Journals / reversals / docs | Done | Accounting + docs wired (+ Idempotency-Key) |
| **A20** Settings flat map | Done | Slice already handles map |
| **A21** `asOf` date-only | Confirmed | Unchanged |
| **A22** Fund limits | `GET/PUT …/limits` | Portfolio setup wired |
| **A23** Approval routes | `/approval-routes` | Order setup list/create |
| **B1** Workspace nested+flat | Done | `mapFundWorkspace` |
| **B2** Fund cash summary KPIs | Done | `mapFundSummaryKpis` + trend |
| **B3** Status enums | Canonical lists | `RUNNING` post-run; severity/overdue |
| **B4/B10/B11** Cash ledger | `accountPurpose` + `view=LINES` | Ledger page sends both |
| **B5/B14** Broker queue + amounts | Done | `mapBrokerWorkspace` |
| **B6/B13** Exceptions overdue + KPIs | Done | Adapter + summary aliases |
| **B7** Investor statements | `INVESTOR_CAPITAL` | Statements segment/generate |
| **B8** Period close | BE exists | FE later (not MVP) |
| **B9** Daily movement | `GET /cash-overview/daily-movement` | Overview + fund ledger charts |
| **B12** Generate batch `cashAccountIds[]` | Done | Statements generate |
| **B15–B17** Statement list/summary/download | Done | Promote fields; `contentBase64` download |

### Smoke verify (FE against live BE)

1. `GET /dashboard/summary` → string `nav`/`pnl` on dashboard  
2. `GET /portfolios/:id/overview` → cash/% on portfolios overview  
3. `GET /compliance/results` → Pre-trade results table  
4. `GET /setup/brokers` → stakeholder fields  
5. `GET /setup/settings` → object map (not list)  
6. `GET /cash-ledger?accountPurpose=FUND&view=LINES` → running balance column  
7. `GET /cash-overview/daily-movement` → overview chart series  
8. `GET /reconciliation-batches/:id/workspace` → fund-cash panes  
9. `GET /fund-cash-summary` → match rate / total cash  
10. `GET /broker-custodian/workspace` → queue counts + side amounts  

---

## Product clarifications (BE → FE)

| Ask | Decision |
| --- | --- |
| **A5** | Source of truth for fund pickers = `GET /portfolios`. `GET /setup/funds` is setup-enriched same list. |
| **A6** | Holdings recon `/reconciliation/*`; cash flat `/reconciliation-batches`, `/matches`, `/cash-ledger`, etc. Never mix. |
| **A8** | Real blotters API. |
| **A21** | `asOf` date-only or ISO; price/FX sources not required on create. |
| **A23** | CRUD under `/approval-routes` (alias `/setup/approval-routes`). |
| **B3** | Batch `OPEN\|RUNNING\|READY\|CLOSED`; Import `PENDING\|VALIDATED\|…`; Match `PROPOSED\|CONFIRMED\|REJECTED`; Severity includes `CRITICAL`; Exception statuses include `INFO_REQUESTED`. |
| **B7** | Same `/client-statements*`; `statementType=INVESTOR_CAPITAL` (aliases `INVESTOR`, `CAPITAL`). |
| **B8** | Period close BE exists; FE later. |

---

## Product rule / why

FE adapts API DTOs into designed Investments V2 + cash recon UIs. Do not invent NAV/series/money when the API omits them.

---

# Part A — Core (Investment Ops) — historical asks

> Status: **FE closed** against BE responses (2026-07-20). Text left for ticket traceability.

### A1. Money typing inconsistency — FE closed

- BE returns decimal strings on dashboard/overview.  
- FE: types accept `string | number`; display via `formatMoneyDisplay`.

### A2. List envelope inconsistency — FE closed

- Prefer `{ items, page, pageSize, total, totalPages }`.  
- FE: `unwrapList` / `unwrapPaged` in helpers + investmentOpsSlice list thunks.

### A3. Setup stubs too thin — BE dependent

- FE shows sparse/empty via `unwrapList` until payloads include full stakeholder fields.

### A4. Error code catalog — FE closed

- Stable codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_REPLAY`, `INVALID_STATUS`, `ORDER_NOT_EDITABLE`, `INSTRUMENT_NOT_FOUND`, …  
- FE: `formatOpsError` appends `(code)` when present.

### A5–A6 — Clarified / no FE change

### A7. Compliance results — FE closed

- `GET /compliance/results` → compliance Pre-trade panel.

### A8. Blotters — FE closed

- Orderbook Open Blotters from `GET/POST /blotters`.

### A9. Trade / order enrichment — FE closed

- Adapters use `brokerName`, `custodianName`, `fundName`/`fund`, `filledQuantity`, `taxes`.

### A10. Model portfolio PATCH — FE closed

- Create/edit with `linkedFundId`.

### A11. Portfolio cash split — FE closed

- Overview maps `cashBalance` / `cashPct` / `securitiesValue`.

### A12. Transactions shape — FE closed

- Dual field names accepted in adapter.

### A13. Instruments latest price — FE closed

### A14–A16. Valuation — FE closed

- Exception actions, run inputs (prices/FX), PnL columns.

### A17–A19. Accounting / docs — FE closed

- Journal post; reversals + ledger-exports lists; document `fileId` + Idempotency-Key.

### A20. Settings flat map — FE closed

### A21. createValuationRun asOf — confirmed

### A22. Fund limits — FE closed

- Portfolio setup `GET/PUT /setup/funds/:id/limits`.

### A23. Approval routes — FE closed

- Order setup list/create `/approval-routes`.

### A. FE consumers (core)

- `lib/api/investment-ops-api.ts`
- `lib/api/investment-ops-helpers.ts`
- `lib/store/slices/investmentOpsSlice.ts`
- `lib/investments-v2/adapters/*`
- `app/investments-v2/**`

---

# Part B — Cash reconciliation — historical asks

> Status: **FE closed** against BE responses (2026-07-20), except **B8** (no FE screen yet).

### B1. Workspace nested + flat — FE closed

### B2. Fund cash summary KPIs — FE closed

### B3. Status enums — FE closed (labels / batch RUNNING)

### B4/B10/B11. Cash ledger filters + LINES — FE closed

### B5/B14. Broker queueCounts + amounts — FE closed

### B6/B13. Exceptions overdue + summary KPIs — FE closed

### B7. Investor statements — FE closed (`INVESTOR_CAPITAL`)

### B8. Period close — FE later

### B9. Daily movement series — FE closed

### B12. Generate `cashAccountIds[]` — FE closed

### B15–B17. Statement DTO / preview / download — FE closed

### B. FE consumers (cash)

- `lib/api/stock-picker-cash-api.ts`
- `lib/investments-v2/adapters/cash-recon-adapter.ts`
- `app/investments-v2/reconciliation/**`

---

## UX polish — BE enrichment asks (2026-07-20) — **CLOSED**

All six items shipped by BE and consumed on FE. See **[`investments-v2-module-completion.md`](./investments-v2-module-completion.md)** § UX polish enrichments.

| # | Surface | Status | FE consumer |
|---|---------|--------|-------------|
| 1 | Nested `instrument` on holdings/positions | **FE closed** | `mapHoldingsToPositions`, `mapValuedPositionsPayload`, `mapTradingPositions` |
| 2 | `createdByName` on instruments | **FE closed** | `mapInstrumentRow` → `displayPersonName` |
| 3 | Overview income KPIs | **FE closed** | `mapOverviewMetrics` |
| 4 | Exposure `bySector`, `byCountry` | **FE closed** | `app/investments-v2/portfolios/page.tsx` |
| 5 | Price queue `reviewable` | **FE closed** | `mapPriceTick` + prices page gating |
| 6 | Import `canSubmit` on GET | **FE closed** | `fund-cash/page.tsx` before submit |

**Verify:** `npm run uat:investments-v2:ux-polish` (DEV `nts`)
