# Investments V2 — End-to-end gaps (audit 2026-07-20)

**Audience:** Frontend + Backend  
**Related:** [`investments-v2-backend-asks.md`](./investments-v2-backend-asks.md) (prior closure list)  
**Contracts:** [`investments api.md`](./investments%20api.md), [`recon.md`](./recon.md)  
**Base:** `/api/investment-ops`

---

## Direct answer

**No — not “every form, zero leftovers.”**  
**Yes — the create→trade spine is FE-wired** (portfolio → instrument approve → price approve → place order → orderbook lifecycle) when BE is seeded.

Remaining work to finish the module is tracked in **[`investments-v2-module-completion.md`](./investments-v2-module-completion.md)** (BE A1–A18 + FE-only F1–F13). Do not treat older scorecard rows below as live status without checking that file.

| Path | Status after full-page scan FE pass |
| --- | --- |
| Create portfolio | **LIVE** (Portfolio Setup) |
| Instrument create → submit → approve → Active | **LIVE** (registry drawer) |
| Manual/upload price → validation approve | **LIVE** (+ `expectedVersion`) |
| Preview → create order → submit | **LIVE** (blotter / orderbook / trading) |
| Orderbook lifecycle | **LIVE** (submit / approve / cancel / send) |
| Fund-cash New batch + Import | **LIVE** (needs seed masters) |
| Manual New Position / holdings POST | **Removed** (BE-1) |
| Setup subcategory | Still local / disabled |
| Orphan `*-mock.ts` on disk | Unused (not imported) |

---

## Page / tab scorecard

| Route | Tabs / areas | Read | Write / create |
| --- | --- | --- | --- |
| `/investments-v2` | Summary, allocation, FX, funds | **LIVE** | Recalc → API |
| `/portfolios` | Holdings, exposure, New Position | **LIVE** | New Position = **local only** |
| `/portfolios/instruments` | Registry + create + lifecycle | List **LIVE** | Create + submit + approve **LIVE** |
| `/portfolios/prices` | Latest / Ingest / Validation | List **LIVE** | Manual/upload/approve = **local** |
| `/portfolios/positions` | Positions | **LIVE** | No create (from trades/valuation) |
| `/portfolios/transactions` | Txns | **LIVE** | No create |
| `/portfolios/folder-setup` | Hierarchy | **SEED** | All actions **local** |
| `/portfolios/setup` | Fund config, limits | **PARTIAL** | Status/broker/limits **LIVE**; cost-basis/settlement cycle often UI-only |
| `/orders/blotter` | Trades, New order, drawer | List **LIVE** | New order modal **HARDCODED**; settle/post often **local** |
| `/orders/orderbook` | Status filters, blotters | **LIVE** | Create blotter **LIVE**; no place-order |
| `/orders/trading` | Positions grid | **LIVE** | Recalc **LIVE**; views in `localStorage` |
| `/orders/compliance` | Rules, results, override | Rules/results **LIVE** | Override = **local history** |
| `/orders/simulation` | Run | **LIVE** | Run → API |
| `/orders/models` | Models, drift | **LIVE** | Create/edit → API |
| `/orders/setup` | Order + reference tabs | Mixed | Brokers/etc **LIVE**; instrument types / CA / tags / icons often **local** |
| `/reconciliation` | Overview | **LIVE** | Read-only |
| `/reconciliation/cash-ledger` | Trading\|Fund; other tabs | Ledger **LIVE** | Capital Calls / Dist / Fees / Docs = **stub panels** |
| `/reconciliation/fund-cash` | Workspace | **LIVE** | Run/match/review → API |
| `/reconciliation/broker-custodian` | Queue | **LIVE** | Confirm/escalate/clear → API |
| `/reconciliation/exceptions` | List + panel tabs | List/actions **LIVE** | Comments / Attachments / Audit = **stubs** |
| `/reconciliation/statements` | Client\|Investor | **LIVE** | Generate/approve/email/download → API |
| `/valuation` | NAV / P&L / Price / FX / Ex | **MOSTLY LIVE** | Create run + resolve → API; P&L reuses NAV list |
| `/reporting` | Templates + generate | **LIVE** | Generate/download → API |
| `/documentation` | Register + upload | List **LIVE** | Metadata create **LIVE**; **bytes upload incomplete** |
| `/accounting` | Events / Journals / … | **PARTIAL** | Reverse/post **LIVE**; Posting Statuses = **empty stub** |

---

# Part 1 — FE wiring backlog (API already documented)

These block “create real data” on the FE even though endpoints exist in `investments api.md`. **No new BE invent required** — FE must wire + align request shapes.

### FE-1. Equity order ticket (P0) — **FE wired 2026-07-20**

- **Page:** `components/investments-v2/place-equity-order-modal.tsx` (blotter New order)
- **Now:** Loads `listPortfolios` + `listInstruments`; Review → `POST /orders/preview`; Place → `POST /orders` with `{ previewId, inputHash }` + Idempotency-Key; best-effort `submitOrder`; chart uses price history when `listedEquitySecurityId` present
- **Still depends on BE:** seeded ACTIVE instruments with approved marks; preview may reject MARKET without price

### FE-2. Instruments create / lifecycle (P0) — **FE create + submit/approve wired 2026-07-20**

- **Page:** `/portfolios/instruments`
- **Now:** `POST /instruments`; drawer `POST …/submit` + `POST …/approve` with `expectedVersion`; optional submit-after-create checkbox; opens drawer after create
- **Still open:** archive / restrict UI (not required for order path)

### FE-3. Market data writes (P0) — **FE wired 2026-07-20**

- **Page:** `/portfolios/prices`
- **Now:** validation queue list; `postManualPrice`; `uploadPrices` (CSV text); approve/reject ticks
- **Still depends on BE:** instruments need `listedEquitySecurityId` for manual entry select

### FE-4. Folder hierarchy (P1) — **FE wired 2026-07-20**

- **Page:** `/portfolios/folder-setup`
- **Now:** Fund picker + `listPortfolioFolders` / create / patch / archive / restore / reorder

### FE-5. Blotter / trade lifecycle buttons (P1) — **FE wired 2026-07-20**

- **Page:** blotter drawer
- **Now:** Confirm → `POST /trades/:id/confirm`; Settled/Posted → `POST /trades/:id/settle` (`allowDeferredAccounting` true/false)

### FE-6. Compliance override (P1) — **FE wired 2026-07-20**

- **Page:** `/orders/compliance`
- **Now:** Override from Pre-trade BREACH/WARNING rows via `createComplianceOverride`; rule-library override disabled with hint

### FE-7. Document binary upload (P1) — **FE wired 2026-07-20**

- **Page:** `/documentation`
- **Now:** upload-session → base64 `POST /files` → complete → `createDocument` with `fileId`

### FE-8. Setup reference writes (P2) — **FE wired 2026-07-20**

- **Tabs:** Instrument Types, Corporate Actions, Tags via `/setup/*` list+create
- **Still local (labeled):** Coupon Frequency, Icons — no OpenAPI (see BE-6)

### FE-9. Order configuration persistence (P2) — **FE wired 2026-07-20**

- **Page:** Order Setup
- **Now:** `GET/PATCH /orders/configuration/:fundId` (+ four_eye settings). No hardcoded CABS/SWIFT defaults when API empty.

### FE-10. Delete unused mock modules (P3) — **Done 2026-07-20**

- Removed unused `lib/investments-v2/*-mock.ts`

---

# Part 2 — Backend asks — **answered + FE applied 2026-07-20**

See BE note + FE closure: [`investments-v2-e2e-be-answers-fe-closure.md`](./investments-v2-e2e-be-answers-fe-closure.md).

| Ask | BE decision | FE |
| --- | --- | --- |
| **BE-1** | No `POST /holdings`; optional later `…/transactions/manual-adjustments` | New Position **removed** |
| **BE-2** | Same `/valuation/runs` + PnL fields | P&L tab wired to same runs |
| **BE-3** | comments / attachments / audit | Exceptions panel wired |
| **BE-4** | Not cash-owned → deep-link | Cash-ledger tabs deep-link |
| **BE-5** | `GET /accounting/posting-status` | Accounting tab wired |
| **BE-6** | coupon-frequencies + icons catalogs | Setup tab wired |
| **BE-7** | history returns `series` | Order modal uses `series` |
| **BE-8** | config keys on fund config | Portfolio setup persists |
| **BE-9** | `decimalPlaces` / `decimals` | Currencies table |
| **BE-10** | `ownerName` / `createdByName` | Orderbook blotter + trader |

### Deferred FE

- Manual adjustment create UI (after product wants it under portfolios)
- Icons/coupon archive/PATCH UI (create+list only for now)

---

## What *is* creatable against live APIs today (non-exhaustive)

When authenticated against a seeded BE (after BE migrate):

- Instruments, prices (manual/upload/queue), orders (preview→create), blotters, folders
- Model portfolios, valuation runs, simulation, reports
- Document binary upload → `fileId` → create
- Cash recon match/exceptions (incl. comments/attachments), statements
- Setup: brokers/custodians/…/instrument-types/tags/CA/coupon/icons
- Fund limits, approval routes, order configuration, fund config keys

---

## Recommended leftover work

1. Optional: wire `POST /portfolios/:fundId/transactions/manual-adjustments` as admin adjust entry  
2. Run BE migrate before UAT smoke  
3. Soft gaps: setup subcategory prototype; fund-cash Import/Rules ghost buttons; orphan `*-mock.ts` files still on disk but unused  
4. Instrument archive/restrict UI (optional)

---

## How to verify after FE wires P0 + BE answers

1. Create instrument → Submit → **Approve** → status Active → `/portfolios/instruments`  
2. Manual price → validation queue → approve  
3. Preview + create order → orderbook (instrument must be Active) 
4. Blotter confirm/settle  
5. No New Position on portfolios overview  
6. Exception Comments/Attachments/Audit  
7. Accounting Posting Statuses  
8. Setup coupon/icons create  
9. Portfolio setup persists cost basis / settlement / cutoff  
