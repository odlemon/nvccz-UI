# Trading retune — user flow (go here, do this)

**Date:** 2026-07-22  
**Audience:** Ops / PM / UAT / client demo  
**Module:** Investments V2  
**Product rule:** Broker negotiation stays **outside** this system. You record intent, send the instruction, capture the broker’s confirmation when it comes back, book the executed trade, settle with the custodian, then reconcile.

**Related:** [`investments-trading-recon-retune-api.md`](./investments-trading-recon-retune-api.md) · older demo walkthrough: [`walkthrough-trading-user-flow.md`](./walkthrough-trading-user-flow.md)

---

## Journey at a glance

```text
Orderbook                          Blotter                         Recon
─────────                          ───────                         ────
1. New order                       7. Confirm trade                10. Trade recon batch
2. Submit                          8. Settle with custodian            (ingest → match)
3. Approve                         9. Post books                   11. Cash ledger by trade
4. Send to broker (+ custodian)       └─ Open trade recon / cash
5. Record confirmation
6. Accept → trade appears on blotter
   (or Reject → stay on orderbook)
```

| Screen | URL | What lives here |
|--------|-----|-----------------|
| **Orderbook** | `/investments-v2/orders/orderbook` | Pending orders only (until Accept) |
| **Trade blotter** | `/investments-v2/orders/blotter` | Executed trades only |
| **Trade recon** | `/investments-v2/reconciliation/trade` | 3-way statement match batch |
| **Cash ledger** | `/investments-v2/reconciliation/cash-ledger` | Cash lines (filter by `tradeId`) |
| **Client / Cash** | `/investments-v2/reconciliation` · `/…/fund-cash` | Client overview · fund cash |

---

## 1. Create the order

1. Go to **Investments V2 → Orders → Orderbook**  
   (`/investments-v2/orders/orderbook`)
2. Click **New order**.
3. Fill ticket: portfolio, instrument, side, qty, prices, **broker**, **custodian**, settlement account, value date.
4. Run pre-trade review / place (or save draft).
5. Order appears on the Orderbook as **Draft** (or Submitted if you submitted immediately).

**Success:** Row visible on Orderbook. **No** row on Trade Blotter yet.

---

## 2. Submit for approval

1. Stay on **Orderbook**.
2. Click the order → detail panel opens.
3. Click **Submit** (when status is Draft).

**Success:** Status → **Submitted**.

---

## 3. Approve

1. Still on Orderbook detail for that order.
2. Click **Approve** (when status is Submitted).

**Success:** Status → **Approved**. Still no blotter trade.

---

## 4. Send to broker (and confirm custodian)

1. On Approved order, click **Send to broker**.
2. Confirm modal opens — Phase-1 custodian authorisation:
   - Select / confirm **Custodian** (required)
   - Set **Settlement / value date**
   - Check settlement account (from create)
   - Optional notes (e.g. “emailed to ABC Brokers”)
3. Click **Send instruction**.

**What this means:** Instruction is marked sent. Broker work happens **outside** Arcus (phone, email, their portal).

**Success:** Status → **Sent to Broker**. Toast says no blotter row yet. Order stays on Orderbook.

---

## 5. Record broker confirmation (when they come back)

1. When the broker confirms (outside the system), open the same order on Orderbook.
2. Click **Record confirmation**.
3. Enter what they confirmed:
   - Outcome: Filled / Partial / Counter / Unable  
   - Quantity, price  
   - Broker reference, trade/value dates, notes  
4. Click **Save confirmation**.

**Success:** Status → **Confirmation Recorded** (or equivalent). Actions show **Accept** and **Reject / keep looking**. Still no blotter trade.

---

## 6a. Accept → create executed trade

1. Review the recorded qty/price.
2. Click **Accept confirmation**.

**Success:**
- Order → **Executed** (or Partially Executed if qty &lt; order qty)
- Toast offers **Open blotter**
- A **trade** now exists on Trade Blotter only

---

## 6b. Reject / keep looking (alternate)

1. Click **Reject / keep looking**.
2. Enter reason (e.g. “Price too high”).

**Success:** Confirmation rejected; order back to **Sent to Broker**. Still no blotter row. You can record another confirmation later.

---

## 7. Trade Blotter — confirm trade

1. Go to **Orders → Trade Blotter**  
   (`/investments-v2/orders/blotter`)  
   or use the toast / Orderbook **Open** blotter link.
2. Select the trade (deep-link may already focus it).
3. In the detail panel: **1. Confirm trade** → click **Confirm trade**.

**Success:** Confirmation = Confirmed. This is ops checking blotter terms — **not** the earlier broker-outside confirmation.

---

## 8. Settle with custodian

1. Still on blotter detail → **2. Custodian settlement**.
2. Click **Settle with custodian**.
3. Enter:
   - Settled at  
   - **Custodian / CSD reference** (required, e.g. `CSD-99102`)
4. Click **Confirm settlement**.

**Success:** Settlement = Settled. Cash journals may link `tradeId` (BA-RC-2).

---

## 9. Post books

1. Blotter detail → **3. Accounting posting**.
2. Click **Post books**.
3. Optionally **Open accounting event**.

**Success:** Accounting = Posted.

---

## 10. Reconcile — Trade (3-way)

1. From blotter detail → **4. Reconcile** → **Open trade recon**  
   (or go to **Reconciliation → Trade**)  
   (`/investments-v2/reconciliation/trade`)
2. Step through the batch wizard:
   1. **Create batch** — fund + as-of date + templates  
   2. **Ingest broker** CSV (paste, upload, or Demo qty mismatch)  
   3. **Ingest custodian** CSV  
   4. **Run match**  
   5. Review **Exceptions** (`QTY_MISMATCH`, `DUPLICATE`, `MISSING_*`, …) — Manual match / Write off  
   6. **Complete batch**

Demo files: `/demo-templates/trade-recon/broker-*.csv` and `custodian-*.csv`.

**Success:** Matches and exceptions handled; batch completed.  
**Story to show:** Internal 1000 vs broker 900 → `QTY_MISMATCH`.

---

## 11. Reconcile — Cash (optional follow-up)

1. From blotter → **Open cash ledger for trade**  
   or **Reconciliation → Cash ledger** with Trade id filter  
   (`/investments-v2/reconciliation/cash-ledger?tradeId=…`)
2. Confirm cash lines linked to that trade after settle.

For fund vs bank/custodian cash matching, use **Reconciliation → Cash** (`/investments-v2/reconciliation/fund-cash`).

---

## What you should *not* do in this flow

| Old habit | New rule |
|-----------|----------|
| Type a fill and **Execute (create trade)** on Orderbook | Use **Record confirmation → Accept** |
| Expect a blotter row after Send to broker | Blotter only after **Accept** |
| Treat blotter Confirm as “broker fill” | Broker fill was already accepted on Orderbook |
| Put pending orders on the blotter | Orderbook = pending; Blotter = executed only |

---

## Happy-path checklist (UAT)

- [ ] Create → Submit → Approve → Send (custodian set) → **no blotter**
- [ ] Record counter → Reject → **still no blotter**
- [ ] Record fill → Accept → **trade on blotter**; order Executed
- [ ] Confirm → Settle (custodian ref) → Post
- [ ] Trade recon: ingest mismatch → `QTY_MISMATCH` → complete
- [ ] Cash ledger `?tradeId=` shows linked lines after settle

---

## Sidebar map

```text
Investments V2
├── Orders
│   ├── Orderbook          ← steps 1–6
│   ├── Trade Blotter      ← steps 7–9 (+ links to 10–11)
│   └── Compliance
├── Reconciliation
│   ├── Client             ← overview
│   ├── Trade              ← step 10 (batch wizard)
│   ├── Cash               ← fund cash
│   ├── Cash ledger        ← step 11
│   ├── Exceptions
│   └── Statements
└── …
```
