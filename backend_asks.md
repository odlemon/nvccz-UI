# Walkthrough Backend Asks — 2026-07-20

**Tester:** FE agent — API smoke + Playwright browser walkthrough (`admin@nts.com` / `admin123`)  
**App:** `http://localhost:3001` · **API:** `http://localhost:3009/api`  
**Database:** DEV `nts` only  
**Updated:** Same day — trading BA-T* + recon BA-R* waves closed on BE; FE rewired  

**Repeat tests:**
- BE: `uat:investments-v2:walkthrough` (8/8) · `trading-asks` (10/10) · `recon-asks` (13/13)
- FE: `node scripts/uat-walkthrough-investments.mjs` · `walkthrough-investments-browser.mjs` · `uat-trading-lifecycle.mjs`

**Pre-session:**

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm run db:seed:investments-v2-demo
npm run uat:investments-v2:walkthrough
npm run uat:investments-v2:trading-asks
npm run uat:investments-v2:recon-asks
```

FE demo CSVs: `public/demo-templates/cash-recon/*`  
Canonical header: `value_date,trade_date,amount,debit_credit,reference,counterparty,description`  
Import UI: Provider = CBZ Custody · Layout = `CBZ_CSV_V1` · Currency = USD

---

## Executive summary

| ID | Area | Priority | BE status | FE status |
| --- | --- | --- | --- | --- |
| **BA-1** | Cash ledger purpose filters | Blocker | **DONE** | **Wired** |
| **BA-2** | Execute + `tradeId` | Blocker | **DONE** (~30–40s) | **Wired** |
| **BA-3** | OPEN recon exceptions | Blocker | **DONE** | Seed ready; approve/reject/info live |
| **BA-4** | Holdings/trade recon screens | Can wait | **WONT for V2** | Broker & custodian + Blotter |
| **BA-5** | Statement PDF stream | Can wait | **OPEN** | **FE wired** blob + base64/`%PDF` guard — see `design-refs/recon-display-labels-pdf-backend-asks.md` |
| **BA-6** | DRAFT/SUBMITTED seed | Can wait | **DONE** | Orderbook tabs ready |
| **BA-7** | SRD match status labels | Can wait | **OPEN** | FE semantic mapping |
| **BA-8** | Excel/CSV statement export | Can wait | **OPEN** | Not implemented |
| **BA-9** | Investor capital lines | Can wait | **OPEN** (partial) | Client segment demo |
| **BA-T1** | Compliance SRD six | Can wait | **DONE** | **Wired** |
| **BA-T1b** | Override create body | — | **DONE** (BE) | **Wired** — FE sends `complianceResultId` + `reasonCode` + `reason` |
| **BA-T2** | PARTIALLY_EXECUTED / PENDING_SETTLEMENT | Can wait | **DONE** | **Wired** |
| **BA-T3** | STOP / settlement / approval route | Can wait | **DONE** | **Wired** |
| **BA-T4** | Fail / Archive | Can wait | **DONE** | **Wired** |
| **BA-R1** | Import maker-checker + control totals | Blocker | **DONE** | **Wired** — controls on validate/commit; 409 codes |
| **BA-R2** | Match score components | Can wait | **PARTIAL** | **Wired** — nested components/weights/hardFailures |
| **BA-R3** | Split/net match topologies | Can wait | **OPEN** | ONE_TO_ONE only |
| **BA-R4** | Period close (SRD §15) | Can wait | **OPEN** | Not in UI |
| **BA-R5** | Exception lifecycle / OPEN seed | Blocker | **DONE** (= BA-3) | Seed ready |
| **BA-R6** | CBZ_CSV_V1 + line errors + dup hash | Blocker | **DONE** | **Wired** — templates + `/errors` parse + DUPLICATE_SOURCE |

### Walkthrough readiness

| Area | Status |
| --- | --- |
| **Reconciliations** | **Ready** — re-seed; import gates + OPEN exceptions + purpose ledger |
| **Client Statements** | **Ready with known issues** — BA-5/8/9 optional |
| **Trading Workflow** | **Ready** — lifecycle seed + fail/archive + STOP ticket |

---

## BA-R* closed this wave (reference)

### BA-R1 — Import maker-checker + control totals (DONE)

Flow: `RECEIVED` → Validate → `VALIDATED` → Submit → `PENDING_APPROVAL` → Commit → `COMMITTED`

| Gate | Behaviour |
| --- | --- |
| Submit | **409** unless `VALIDATED` |
| Commit | **409** unless `PENDING_APPROVAL`; requires `controlOpening` + `controlClosing`; rejects if opening+movements≠closing (±0.01) |
| Maker≠checker | **409 `MAKER_CHECKER_CONFLICT`** for non-admin same user; **admins bypass** (`admin@nts.com`) |

Validate/commit return `controlTotals: { opening, closing, movements, expectedMovement, balanced }`.

FE: control opening/closing inputs; sent on create (optional), validate (`requireControlTotals` when both set), commit (required); structured error messaging.

### BA-R2 — Score components (PARTIAL)

Suggestions return `scoreTotal`, `scoreComponents`, `weights` (0.5/0.2/0.2/0.1), `weighted`, `hardFailures` / `hardRuleFailures`. Competing scores still skip auto-match.

FE maps nested components + shows weighted breakdown on Fund Cash suggestions.

### BA-R5 — OPEN exceptions (DONE)

Same as BA-3: 2× OPEN + 1× INVESTIGATING.

### BA-R6 — CBZ_CSV_V1 (DONE)

Seed provider `CBZ_CUSTODY` + ACTIVE layout `CBZ_CSV_V1`; line errors `{ lineNumber, code, message }[]`; duplicate hash **409 `DUPLICATE_SOURCE`**.

FE: demo CSV downloads (incl. debit/credit cols); `mapImportLineErrors` reads `{ errors: [] }`; dup code messaging.

---

## Still open (can wait)

| ID | Notes |
| --- | --- |
| BA-4 | Product — Broker & custodian + Blotter |
| BA-5 | Optional true PDF stream |
| BA-7 | FE semantic mapping for match statuses |
| BA-8 | Excel/CSV export |
| BA-9 | Investor capital lines on preview |
| BA-R3 | One-to-many / many-to-one match |
| BA-R4 | Cash period close workflow |
| **BA-T5** | **`GET /trades` must return `orderId` + `orderRef`; orders that have a blotter trade must return `tradeId` on list/GET.** FE Open is a plain tab (`?tradeId=&select=1`) with **no** resolve API. Seed every executed / pending-settlement demo order (esp. `ALP-ORD-PENDING-SETTLE-CBZ`) with a real listed-equity trade and set both sides of the link. |
| **BA-T6** | **`POST /trades/:id/settle` must flip linked `order.status` → `SETTLED`** (today order stays `PENDING_SETTLEMENT` after blotter Confirm → Settle → Post). FE workaround: orderbook joins `listTrades` and promotes row to Settled when linked trade `settlementStatus=SETTLED`. |

---

## FE wiring (recon wave)

| Fix | File |
| --- | --- |
| Control totals send/display + maker-checker / DUP codes | `fund-cash/page.tsx`, `cash-recon-adapter.ts` |
| Validate/commit body types | `stock-picker-cash-api.ts` |
| Nested scoreComponents / weights / hardFailures | `cash-recon-adapter.ts`, fund-cash suggestions UI |
| Import errors GET `{ errors: [] }` parse | `mapImportLineErrors` |
| Debit/credit demo CSV link | fund-cash import modal |

Prior trading/ledger wires remain (see previous revision).

---

## Recommended walkthrough script

1. **Login** → `http://localhost:3001/login`
2. **Recon Overview** → KPIs
3. **Fund cash → Import** → RECEIVED → Validate → Submit → Commit (checker if non-admin)
4. **Fund cash → New batch** → Run Reconciliation → Confirm suggestion / manual match
5. **Broker & custodian** → 3-way
6. **Exceptions** → resolve an **OPEN** exception live
7. **Cash ledger** → Fund / Trading tabs
8. **Statements** → Preview → Approve → Download
9. **Trading / New order** → Review → Place (optional STOP_LIMIT)
10. **Orderbook** → DRAFT / SUBMITTED / PARTIAL / PENDING_SETTLEMENT; Approve → Send → Execute
11. **Failed / Archived** → Fail → Archive
12. **Blotter** → Confirm / settle

Click-through user flows (with example data):
- [`design-refs/walkthrough-trading-user-flow.md`](./design-refs/walkthrough-trading-user-flow.md)
- [`design-refs/walkthrough-recon-user-flow.md`](./design-refs/walkthrough-recon-user-flow.md)

Alignment docs:
- [`design-refs/recon-srd-story-alignment.md`](./design-refs/recon-srd-story-alignment.md)
- [`design-refs/trading-srd-story-alignment.md`](./design-refs/trading-srd-story-alignment.md)
