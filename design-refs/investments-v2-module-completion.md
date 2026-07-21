# Investments V2 — Module completion (BE single source of truth)

**Date:** 2026-07-20  
**Audience:** Backend + Frontend + Product  
**Base:** `/api/investment-ops`  
**This file supersedes parallel asks for BE status.** FE Part B (F1–F13) remains FE-owned.

**Contracts:** [`investments api.md`](./investments%20api.md), [`recon.md`](./recon.md)  
**FE closure:** [`investments-v2-module-completion-fe-closure.md`](./investments-v2-module-completion-fe-closure.md)

Historical: `investments-v2-be-scan-answers.md`, `investments-v2-e2e-be-answers.md`, `investments-v2-fe-gap-closure.md`  
Also: [`investments-v2-backend-asks.md`](./investments-v2-backend-asks.md) · [`investments-v2-end-to-end-gaps.md`](./investments-v2-end-to-end-gaps.md) (stale — use this file)

---

## Definition

| Tier | Meaning |
| --- | --- |
| **T0** | Create→trade + cash recon smoke |
| **T1** | Every sidebar route usable with real API data |
| **T2** | Polish / optional |

---

## BE response (filled) — closed 2026-07-20

```text
A1 seed/migrate: DONE | npm run db:reset:investments-v2-demo  (clear UAT + lean real Arcus demo on nts)
A2 POST /portfolios canonical: ALREADY | GET /portfolios lists new fund; POST /setup/funds also OK (parity)
A3 listedEquitySecurityId on create: ALREADY | always assigned on POST /instruments
A4 instrument submit/approve version: ALREADY | body/If-Match expectedVersion; returns status + auditVersion
A5 validation-queue version: ALREADY | tick.version; approve/reject require expectedVersion
A6 send-to-broker body: empty OK | Idempotency-Key optional (auto-minted if missing); defaults venue/broker
A7 cash masters seed: DONE | included in db:seed:investments-v2-t0 (+ fund-linked cash account)
A8 GET /compliance/overrides: ALREADY | paged items with id,orderId,reason,status,createdAt,createdByName
A9 transaction linked ids: DONE | tradeId,journalEntryId,documentId; valuationRunId always null today
A10 setup PATCH + subcategories: ALREADY | tags/CA/instrument-types PATCH need expectedVersion; subcategories live
A11 setup enrichment: ALREADY | brokers/custodians name+contact+status; currencies decimalPlaces/decimals (not on brokers)
A12 document download: ALREADY | format: file stream (Content-Disposition); FE downloadDocument already exists
A13 accounting workflow: submit→approve→post supported; posting-status: ALREADY; ledger-exports: POST create then GET download
A14 valuation inputs/PnL: ALREADY | runs include realizedPnl/unrealizedPnl/totalPnl; inputs return prices+fxRates
A15 reporting: ALREADY | templates/generate/download; seed creates sample report fixture on demo fund
A16 exception fileId pipeline: ALREADY | same upload-session→/files→complete→POST …/attachments {fileId}
A17 order→trade UAT path: APPROVED → POST /orders/:id/execute (expectedVersion; Idempotency-Key optional)
             → creates listedEquityTrade + sets order.tradeId → Blotter Confirm → Settle
             Optional: send-to-broker first; execute also auto-routes if still APPROVED
P1 Manual position UI: WONT for T1 | API exists: POST /portfolios/:fundId/transactions/manual-adjustments
P2 Holdings recon in V2 sidebar: WONT for T1 | keep §22 /reconciliation/* separate from cash
P3 Cash period close / GL screens: WONT for T1 | APIs exist; FE later
P4 Recon Export/Columns: WONT | hide in FE
P5 Instrument restrict/archive UI: WONT for T1 | APIs exist; FE optional (F11)
```

| ID | BE | FE |
| --- | --- | --- |
| A1–A7, A9–A11, A14–A15 | DONE / ALREADY | Consume seeded `nts`; no further BE wait |
| A6 | ALREADY | Orderbook send uses `expectedVersion`; Idempotency-Key optional (FE still sends) |
| A8 | ALREADY | Compliance history wired |
| A10 | ALREADY | Tags/CA/settings + subcategories wired |
| A12 | ALREADY | Documentation download wired |
| A13 | ALREADY | Journal submit/approve/post + create ledger export wired |
| A16 | ALREADY | Exception file picker → upload → attach wired |
| A17 | APPROVED path documented | Orderbook **Execute (create trade)** wired |
| P1–P3, P5 | WONT T1 | Not built |
| P4 | WONT | Export/Columns hidden |

**Leaves nonempty (rich Arcus book):** 8 ZSE instruments/holdings, 12 trades (10 settled + 2 routing), 8 orders, 10 transactions, valuation run + items, recon, accounting, docs/reports, blotters, model/sims, PENDING_REVIEW prices, cash masters.

---

## T0 seed / reset

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm run db:reset:investments-v2-demo
```

Alternate lean seed: `npm run db:seed:investments-v2-t0`

---

## Part B — FE wiring status (against existing OpenAPI)

| # | Route / tab | Status |
| --- | --- | --- |
| F1 | `/orders/compliance` | **Wired** — `GET /compliance/overrides` |
| F2 | `/setup` Instrument Types | **Wired** — subcategory create + list |
| F3 | `/setup` Tags / CA / Settings | **Wired** — Check saves PATCH/PUT |
| F4 | `/documentation` | **Wired** — download via `GET /documents/:id/download` |
| F5 | `/orders/orderbook` | **Wired** — Execute + Reject (+ submit/approve/send/cancel) |
| F6 | `/orders/blotter` | Partial — Confirm/Settle live; routing hops optional polish |
| F7 | `/accounting` | **Wired** — submit → approve → post; ledger-exports create + download |
| F8 | `/valuation` exceptions | **Wired** — escalate / approve-override / reject-override |
| F9 | `/reconciliation/exceptions` | **Wired** — file picker → upload → attach `{fileId}` |
| F10 | Recon toolbars | **Hidden** (P4 WONT) |
| F11 | Instruments restrict/archive | **Deferred** (P5 WONT for T1) |
| F12 | Approval routes edit/delete | Optional polish — not blocking T0 |
| F13 | Client cash account create UI | Optional — seed covers T0 |

---

## A17 detail (blotter smoke)

1. Place order → Submit → Approve  
2. `POST /orders/:id/execute` with `expectedVersion` (Idempotency-Key optional)  
3. Order gains `tradeId`; blotter lists trade  
4. `POST /trades/:id/confirm` then settle/post as already wired  

Do **not** expect send-to-broker alone to create a blotter trade.

---

## UX polish enrichments (2026-07-20) — BE + FE closed

| # | Ask | BE | FE |
| --- | --- | --- | --- |
| 1 | Positions/holdings nested `instrument` | **DONE** — `GET …/holdings`, `GET …/positions`, `GET /positions/:id` | Adapters prefer `instrument` snapshot (`portfolio-adapter`, `orders-adapter`) |
| 2 | `GET /instruments` → `createdByName` | **DONE** — list + detail | `mapInstrumentRow` + `displayPersonName` |
| 3 | Overview income KPIs | **DONE** — `dividendIncome`, `interestIncome`, `marginUsed` | `mapOverviewMetrics` |
| 4 | Exposure `bySector`, `byCountry` | **DONE** — alongside `byExchange` | Portfolio overview pies |
| 5 | Price queue `reviewable` + `PENDING_REVIEW` approve | **DONE** | `mapPriceTick` + disabled approve/reject |
| 6 | Import `canSubmit` / `canValidate` / `canCommit` | **DONE** — on import GET | Fund-cash upload checks `canSubmit` before submit |

**UAT:** `npm run uat:investments-v2:ux-polish` (DEV `nts`, live login)

---

## UAT checklist (T0 then T1)

### T0 — Create→trade + cash

1. Portfolio Setup → **New portfolio** → appears in order fund select  
2. Instruments → Create → Submit → **Approve** → Active  
3. Prices → Manual → Validation queue → **Approve**  
4. Blotter/Orderbook/Trading → **New order** → Review → Place  
5. Orderbook → Submit → Approve → **Execute (create trade)** (optional Send to broker first)  
6. Blotter → Confirm → Settle  
7. Fund Cash → **New batch** → **Import** CSV → Run Reconciliation  

### T1 — Remaining tabs smoke

8. Compliance → create override → **reload** → still listed  
9. Setup → edit tag/CA via pencil → persists  
10. Documentation → upload → **download**  
11. Accounting → submit/approve/post; create ledger export → download  
12. Valuation → create run → P&L/Price/FX; exception escalate/override approve  
13. Reporting → generate → download  
14. Exceptions → attach file via **picker**  
15. Transactions → linked ids when applicable  
16. UX polish script: positions show symbols; instruments created-by name; overview KPIs; sector pie; price review gating; import submit blocked when `canSubmit=false`

---

## After this

1. FE runs T0 + `uat:investments-v2:ux-polish` against seeded `nts`  
2. FE Part B F1–F13 — **done** except F6/F11/F12/F13 optional polish  
3. Hide P4 Export buttons — **done**  
4. Mark IDs closed in this file — **done**; do not open a third parallel asks doc  

**FE owners:** `lib/api/investment-ops-api.ts`, `lib/api/stock-picker-cash-api.ts`, `app/investments-v2/**`, `components/investments-v2/**`
