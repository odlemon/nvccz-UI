# Investments — Trading & Reconciliation retune (client meeting)

**Status:** Target product model + backend asks · **API contract:** [`investments-trading-recon-retune-api.md`](./investments-trading-recon-retune-api.md) · **FE wired** (BA-TR-2 confirmations, Phase-1 custodian auth, BA-RC-1 trade batch wizard, BA-TR-4 recon-summary)  
**Date:** 2026-07-21  
**Audience:** Backend + Frontend  
**Module:** Investments V2 (`/investments-v2/orders/*`, `/investments-v2/reconciliation/*`)  
**API base:** `/api/investment-ops`  
**FE clients:** `lib/api/investment-ops-api.ts`, `lib/api/stock-picker-cash-api.ts`

---

## 1. Product context (why this exists)

In Zimbabwe (SECZIM-regulated), investor capital is **not** held by the asset manager.

| Party | Role |
|-------|------|
| **Investor** | Contributes / redeems capital |
| **Asset manager (AM)** | Decides buy/sell for the fund; instructs others; **does not** trade the exchange or hold client money |
| **Stockbroker** | Licensed intermediary; executes on ZSE / VFEX ATS |
| **Custodian bank** | Trust account; holds cash + securities for the fund |
| **CSD** | Clearinghouse; dematerialised share + cash settlement (e.g. via RBZ rails) |

**Constraint for this release (explicit):**  
**Broker interaction is outside this system.** Negotiation with the broker (finding a counterparty, counter-prices, emails, phone, broker portals) happens externally. This product records AM intent, internal approval, “sent to broker”, then **records the outcome** when confirmation returns, then settlement and reconciliation.

Do **not** build a broker login, broker fillable RFQ inbox, or live exchange connectivity for this wave.

---

## 2. Target trading flow (digitised in-app)

```text
1. AM decides buy/sell (off-system thought process)
2. Create order in system (trading / orderbook)
3. Internal review + approve
4. Mark order Sent to Broker  ← instruction issued (export/email optional later)
   └── broker work happens OUTSIDE the system
5. Ops/AM records broker confirmation (qty, price, refs) when it comes back
6. Accept confirmation → Trade EXECUTED
7. Trade appears on Trade Blotter (executed trades ONLY)
8. Settlement via custodian (cash + securities movement)
9. Reconciliation: internal × broker statements × custodian statements
```

### Orderbook vs Trade blotter (hard rule)

| Screen | Contains |
|--------|----------|
| **Orderbook** | Pending buy/sell **orders** not yet executed (Draft → Approved → Sent to Broker → Awaiting confirmation / Counter recorded) |
| **Trade blotter** | **Executed trades only** — final economic event after confirmation is accepted |

No pending orders on the blotter. No “execute by typing a fill” as the primary path without a recorded confirmation.

### Lifecycle statuses (proposed)

| Status | Meaning | In |
|--------|---------|-----|
| `DRAFT` | Order being prepared | Orderbook |
| `SUBMITTED` | Awaiting internal approval | Orderbook |
| `APPROVED` | Internally approved; not yet sent | Orderbook |
| `SENT_TO_BROKER` | Instruction issued; waiting for external broker outcome | Orderbook |
| `BROKER_CONFIRMATION_RECORDED` | External confirmation captured (may include counter-price) | Orderbook |
| `EXECUTED` | Confirmation accepted; trade created | Orderbook row terminal for order; **trade on blotter** |
| `PENDING_SETTLEMENT` | Awaiting custodian/CSD settlement | Blotter (trade) |
| `SETTLED` | Custodian settlement complete | Blotter |
| `REJECTED` / `CANCELLED` / `FAILED` / `ARCHIVED` | Alternate outcomes | Orderbook |

Optional: `COUNTER_OFFERED` if product wants to distinguish “broker proposed different price” before AM accept/reject/keep looking — can be a flag on the confirmation record instead of a status.

### In-system actions (no broker user)

| Step | Who | System action |
|------|-----|---------------|
| Create | Trader / PM | `POST /orders` (after preview as today) |
| Submit / Approve / Reject | Maker / checker | Existing order workflow |
| Send to broker | Ops | Status → `SENT_TO_BROKER` (+ optional instruction PDF/email later) |
| Record confirmation | Ops | Capture broker outcome (qty, price, broker ref, notes, attachment optional) |
| Accept confirmation | Ops / PM | Creates **trade**; order → `EXECUTED`; trade appears on blotter |
| Reject confirmation / keep looking | Ops | Stay on orderbook; order remains `SENT_TO_BROKER` (or back after reject) |
| Settle | Ops | Custodian settlement on **trade** |
| Reconcile | Ops | Match blotter vs imported broker + custodian statements |

**Deprecate as primary path:** AM-driven `POST /orders/:id/execute` with ad-hoc fill qty/price **without** a confirmation record. Keep execute only as an internal implementation behind “Accept confirmation”, or retire once confirmation APIs exist.

### Custodian authorisation (same wave or next)

When the order is sent / confirmed, AM also authorises the custodian to prepare cash (buy) or securities (sell). Minimum for this wave:

- Fields on order/trade: `custodianId`, settlement account, settlement date  
- Status on trade: settlement pending → settled  

Full dual “instruction message to custodian” can be Phase 2 if BE capacity is tight; settlement recording is Phase 1.

---

## 3. Target reconciliation flow

Reconciliation = control step **after** trading:

> Did **internal**, **broker**, and **custodian** all record the same trade / cash the same way?

### Types

| Type | Compare |
|------|---------|
| **Trade recon** | Blotter executed trades ↔ broker statement lines ↔ custodian trade/settlement lines |
| **Cash recon** | Expected cash from trades ↔ custodian/bank cash movements (existing Fund cash strength) |
| **Client account recon** | Client/fund portfolios and balances reflect correct trades |

### Workflow

1. Trade executed → on blotter  
2. Receive broker and/or custodian statements (file ingest)  
3. System matches external lines to internal blotter / cash  
4. Mismatches → exceptions (qty/price/missing/duplicate)  
5. Review → correct or escalate  
6. Mark reconciliation complete  

**Example break:** Internal Buy 1,000 ABC @ 10; broker statement Buy 900 ABC @ 10 → flag for investigation.

### UI must support

- Ingest external files/statements (templates)  
- Compare to internal records  
- Clear exceptions  
- Manual match / correction  
- Customisable import templates (over time)

### Keep vs extend

| Keep | Extend |
|------|--------|
| Fund cash 2-way match (`stock-picker-cash-api`) | Frame as **Cash recon** |
| Exceptions workspace | Field-level trade diffs |
| Broker & custodian queue | Align to **Trade recon** 3-leg story |
| Client statements / overview | Frame as **Client account recon** |
| §22 holdings/trade APIs (if present) | Mount or replace with explicit trade-recon batch API |

**Do not** require broker users in-app for recon — ops ingest **statements** produced outside.

---

## 4. Gap vs current Investments V2

| Area | Today | Target |
|------|-------|--------|
| Send to broker | Status flip | Same, but means “instruction out; waiting externally” |
| Execute | AM enters fill → creates trade | **Record confirmation → Accept → trade** |
| Blotter | Trade after execute; Confirm → Settle → Post | Executed-only; settle = custodian |
| Broker UI | Implicit | Confirmation capture form + history on order |
| Recon | Strong cash; weak trade 3-way spine | Trade + Cash + Client IA; blotter deep-link |
| Journey | Orders and recon loosely linked | Blotter → Reconcile CTA |

Open legacy asks still relevant: **BA-T5** (order↔trade ids), **BA-T6** (settle flips order to SETTLED) — see root `backend_asks.md`.

---

## 5. Backend asks

### BA-TR-1 — Order lifecycle for “broker outside”

**Why:** Orderbook must represent pending instructions until confirmation is accepted.

**Ask:** Support statuses (or equivalent):

- `SENT_TO_BROKER`
- `BROKER_CONFIRMATION_RECORDED` (optional if confirmation entity is enough)
- `EXECUTED` only after confirmation accept
- Keep `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `FAILED`, `ARCHIVED`

**Endpoints:**

- Existing: submit / approve / reject / cancel / fail / archive  
- `POST /orders/:id/send-to-broker`  
  Body example:

```json
{
  "expectedVersion": 3,
  "sentAt": "2026-07-21T14:00:00.000Z",
  "channel": "EMAIL",
  "notes": "Instruction emailed to ABC Brokers"
}
```

**Response:** updated `Order` with `status: "SENT_TO_BROKER"`, `sentToBrokerAt`.

**Errors:** `409` version conflict; `422` if not `APPROVED`.

**FE:** `app/investments-v2/orders/orderbook/page.tsx`, `lib/api/investment-ops-api.ts`

---

### BA-TR-2 — Broker confirmation record (external outcome)

**Why:** Broker negotiation is outside; system must store what came back.

**Ask:** Confirmation entity linked to order.

**Endpoints:**

- `POST /orders/:id/broker-confirmations`

```json
{
  "expectedVersion": 4,
  "outcome": "FILLED" | "COUNTER" | "UNABLE" | "PARTIAL",
  "quantity": "1000",
  "price": "10.00",
  "currencyCode": "USD",
  "brokerReference": "BRK-8821",
  "tradeDate": "2026-07-21",
  "valueDate": "2026-07-23",
  "notes": "Counter at 10.00 vs limit 9.85",
  "attachmentFileId": null
}
```

- `GET /orders/:id/broker-confirmations`
- `POST /orders/:id/broker-confirmations/:confirmationId/accept` → **creates trade**, order `EXECUTED`, returns `{ order, trade }`
- `POST /orders/:id/broker-confirmations/:confirmationId/reject`  
  Body: `{ "reason": "Price too high — keep looking", "expectedVersion": 5 }`  
  Order stays / returns to `SENT_TO_BROKER`

**Accept response example:**

```json
{
  "success": true,
  "data": {
    "order": { "id": "…", "status": "EXECUTED", "tradeId": "…" },
    "trade": {
      "id": "…",
      "orderId": "…",
      "orderRef": "ORD-1042",
      "quantity": "1000",
      "price": "10.00",
      "status": "EXECUTED",
      "settlementStatus": "PENDING_SETTLEMENT"
    }
  }
}
```

**Rules:**

- Blotter list must only include trades (not orders)  
- Accept is the only happy path that creates the blotter trade for this model  
- Partial: confirmation qty &lt; order qty → order may stay open / `PARTIALLY_EXECUTED` per existing BA-T2 semantics

**Errors:** `422` if order not `SENT_TO_BROKER` (or not awaiting); `409` stale version; `409` if already executed.

**FE:** Order detail panel confirmation form (localStorage draft until endpoints live; Accept bridges via `executeOrder`); blotter opens via `tradeId` (BA-T5). See UI retune 2026-07-21.

---

### BA-TR-3 — Trade blotter = executed only + custodian settlement

**Why:** Tatenda: blotter is completed/executed trades; settlement is custodian.

**Ask:**

1. `GET /trades` returns only executed (and later settlement states) trades — never draft orders.  
2. Each trade includes: `orderId`, `orderRef`, `brokerId`/`brokerName`, `custodianId`/`custodianName`, qty, price, tradeDate, valueDate, `settlementStatus`.  
3. Settlement APIs clearly mean **custodian**:

- `POST /trades/:id/confirm` — optional “terms locked / broker advice matched”  
- `POST /trades/:id/settle` — custodian cash+securities settled  

```json
{
  "expectedVersion": 2,
  "settledAt": "2026-07-23T16:00:00.000Z",
  "custodianReference": "CSD-99102",
  "allowDeferredAccounting": true
}
```

4. On settle → linked order status `SETTLED` or trade `SETTLED` with orderbook reflecting settlement (**fixes BA-T6**).

**FE:** `app/investments-v2/orders/blotter/page.tsx`

---

### BA-TR-4 — Blotter → reconciliation handoff

**Why:** Recon is step 10 of the same journey.

**Ask:**

- `GET /trades/:id/reconciliation-summary` or query params on recon batches: `tradeId`, `orderId`, `tradeDate`, `fundId`  
- Deep-link contract FE will use:  
  `/investments-v2/reconciliation?tab=trade&tradeId={id}`  
  (or fund-cash / broker-custodian with same filters)

**Response sketch:**

```json
{
  "tradeId": "…",
  "internalMatched": false,
  "brokerStatementMatched": false,
  "custodianMatched": false,
  "openExceptionIds": ["exc_1"]
}
```

---

### BA-RC-1 — Trade reconciliation (3-way)

**Why:** Compare internal blotter ↔ broker statements ↔ custodian statements.

**Ask:** First-class trade recon workspace (extend broker-custodian or new `/trade-reconciliation/*`).

Minimum:

1. **Ingest broker statement** (CSV/PDF later; CSV first)  
2. **Ingest custodian trade/settlement statement**  
3. **Run match** against blotter trades for period/fund  
4. **Exceptions** with codes: `QTY_MISMATCH`, `PRICE_MISMATCH`, `MISSING_INTERNAL`, `MISSING_BROKER`, `MISSING_CUSTODIAN`, `DUPLICATE`  
5. Manual match / unmatch / write-off with reason  
6. Mark batch `COMPLETED`

Example exception payload:

```json
{
  "code": "QTY_MISMATCH",
  "instrumentSymbol": "ABC",
  "side": "BUY",
  "internalQuantity": "1000",
  "brokerQuantity": "900",
  "price": "10.00",
  "tradeDate": "2026-07-21",
  "tradeId": "…",
  "brokerLineId": "…",
  "status": "OPEN"
}
```

**Reuse:** Exception comments/attachments pipeline already on cash recon.

**Do not** confuse with cash `/reconciliation-batches` namespace — keep cash vs trade recon distinct (same as current cash vs §22 split), unless BE unifies carefully.

**FE:** Recon landing Trade / Cash / Client; `broker-custodian` or new trade-recon page.

---

### BA-RC-2 — Cash recon framing (**done**)

**Why:** Tatenda cash recon = custodian/bank cash vs expected after trades.

**Shipped:** `sp_cash_journals.trade_id` on settle; `GET /cash-ledger?tradeId=`; FE Trade column + filter + blotter deep-link.

**FE:** `cash-ledger`, `fund-cash` (Cash nav); blotter “Open cash ledger for trade”.

---

### BA-RC-3 — Client account reconciliation

**Why:** Client portfolios must reflect correct trades/balances.

**Ask:**

- Read API: per fund/client — holdings vs expected from settled trades (or expose existing portfolio positions + break list)  
- Optional: exceptions when position ≠ sum of settled trades  

Can start as **read-only dashboard** using existing portfolio/positions APIs if break engine is later.

**FE:** Overview + positions deep-link; label as Client account recon.

---

### BA-RC-4 — Statement templates

**Why:** UI must support customisable import templates.

**Ask:**

- Broker statement layout registry (like CBZ cash CSV layouts)  
- Custodian trade/settlement layout  
- Demo files under something like `public/demo-templates/trade-recon/`  
  - happy path match  
  - qty mismatch (1000 vs 900)  
  - missing broker line  

**FE:** Import dialogs reuse fund-cash pattern (`cash-recon-adapter` patterns).

---

## 6. Out of scope (this wave)

- Broker portal / broker login  
- Live ZSE/VFEX/CSD connectivity  
- Email RFQ form filled by broker (optional Phase 2; confirmation record is enough)  
- AM corporate bank holding client money  
- Changing LP Portal capital contribution flows (adjacent story)

---

## 7. FE plan (after BE contract)

1. Retune orderbook actions: Send to broker → Record confirmation → Accept/Reject.  
2. Hide/retire primary “Execute (create trade)” without confirmation.  
3. Enforce blotter = trades only in UI copy + empty states.  
4. Settlement labels = custodian.  
5. Recon home: Trade | Cash | Client.  
6. Blotter CTA → recon with `tradeId`.  
7. Wire confirmation + trade-recon APIs when available; mock via flag if needed for UAT.

**Primary FE files:**

- `app/investments-v2/orders/orderbook/page.tsx`  
- `app/investments-v2/orders/blotter/page.tsx`  
- `components/investments-v2/place-equity-order-modal.tsx`  
- `lib/investments-v2/adapters/orders-adapter.ts`  
- `app/investments-v2/reconciliation/**`  
- `lib/api/investment-ops-api.ts`  
- `lib/api/stock-picker-cash-api.ts`

---

## 8. How to verify with FE

### Trading

1. Create order → Submit → Approve → **Send to broker** → status Sent to Broker; **no blotter row**.  
2. Record confirmation (counter price) → Reject → still no blotter; status back to awaiting.  
3. Record confirmation → **Accept** → trade on blotter; order Executed.  
4. Settle trade → custodian settlement status Settled; orderbook reflects settlement.  
5. Orderbook tabs never list blotter-only working sets as “orders.”

### Reconciliation

1. From blotter, open Reconcile for that trade.  
2. Import broker statement (900 qty) vs internal 1000 → exception `QTY_MISMATCH`.  
3. Import matching custodian/broker lines → matched; batch complete.  
4. Cash path: settlement cash appears on ledger; fund-cash can match bank file.  
5. Client overview shows fund positions consistent with settled trades.

---

## 9. Ask ID summary

| ID | Title | Priority |
|----|-------|----------|
| **BA-TR-1** | Send-to-broker lifecycle | P0 |
| **BA-TR-2** | Broker confirmation record + accept/reject | P0 |
| **BA-TR-3** | Blotter executed-only + custodian settle (+ BA-T6) | P0 |
| **BA-TR-4** | Trade → recon handoff | P1 |
| **BA-RC-1** | Trade 3-way recon + ingest | P0 |
| **BA-RC-2** | Cash recon tradeId link | Done (BE + FE filter) |
| **BA-RC-3** | Client account recon breaks | P2 |
| **BA-RC-4** | Broker/custodian statement templates | P1 |
| **BA-T5** | orderId/tradeId link (existing) | P0 |
| **BA-T6** | Settle flips order SETTLED (existing) | P0 |

---

## 10. Related docs

- `design-refs/walkthrough-trading-user-flow.md` — current demo script (to update after retune)  
- `design-refs/walkthrough-recon-user-flow.md` — cash recon demo  
- `design-refs/recon.md` — cash API contract  
- `design-refs/investments-v2-backend-srd.md` §13 / §22 — OMS + holdings recon  
- Root `backend_asks.md` — BA-T5 / BA-T6  

---

**One-line product rule for engineering:**  
This system digitises the **asset manager’s books and controls**; the **broker stays outside**; we **record instructions and confirmations**, **book executed trades**, **settle via custodian**, and **reconcile three ways**.
