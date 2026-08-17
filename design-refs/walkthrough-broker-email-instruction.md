# UI test — Broker email instruction (send → reply link → accept)

**App:** http://localhost:3001  
**API:** http://localhost:3009  

**What this proves:** Asset manager emails a PO-style instruction to the broker’s profile email. Broker opens a link (no login), responds (fill / counter / unable). AM Accepts on the orderbook → trade appears on the blotter.

---

## Before you start

1. Log in to the app.
2. App Switcher → **Investments V2**.
3. Confirm the broker you will use has a **contact email** on their broker record (Orders setup / stakeholders). If they have no email, Send will block.

### If Place Order shows cash = 0 or “No approved FX snapshot”

Your fund cash was empty / FX pair missing. On the **backend** (`nvccz`) run once:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npx ts-node --transpile-only -r dotenv/config scripts/fix-investments-order-preview-blockers-nts.ts
```

Then refresh the UI, open **New order** again → **Review Order**. Cash should be large and the FX banner should be gone.

**Tip for INN (ZWG priced):** keep Limit price near market or use a small qty; after top-up, `100 × 10 ZWG` is fine.

---

## A — Create the order (Orderbook only)

1. Go to **Orders → Orderbook**  
   URL: `/investments-v2/orders/orderbook`
2. Click **New order**.
3. Fill roughly:

| Field | Value |
|--------|--------|
| Portfolio / fund | First demo fund |
| Instrument | e.g. CBZ / BAT (any approved listed equity) |
| Side | BUY |
| Order type | Limit |
| Quantity | `100` (or lower if cash is tight) |
| Limit price | e.g. `10.00` |
| Broker | Pick a broker that shows an email |
| Custodian | Any custodian |
| Notes | `UI test — broker email flow` |

4. Place / create the order.
5. **Expect:** New row, status **Draft**. Nothing on Trade Blotter yet.

---

## B — Submit → Approve

1. Select the order.
2. Click **Submit** → status **Submitted**.
3. Click **Approve** → status **Approved**.

> **Admin note:** As `admin@nts.com` you can approve your own order (four-eye skip). Non-admins still cannot approve orders they created.

**Expect:** Still only on Orderbook. No blotter row.

---

## C — Send email instruction to broker

1. With the order selected, click **Send to broker**.
2. That sends immediately using the broker and custodian already on the order (broker must have a contact email).

**Expect:**
- Toast that email was sent (or that a reply link was created).
- Toast action **Copy reply link** (or use **Copy broker reply link** in the detail panel).
- Order status → **Sent to Broker**.
- Still **no** Trade Blotter row.
- Detail panel shows **Broker communication** (outbound instruction).

---

## D — Broker responds (public link — no login)

1. Copy the **broker reply link** (from toast or order detail).
2. Open it in a **new browser tab** (incognito is fine).  
   Shape: `http://localhost:3001/broker-instruction/{token}`
3. You should see the instruction (order ref, side, security, qty, limit).
4. Choose a response:

### Path D1 — Happy fill (recommended first test)

| Field | Value |
|--------|--------|
| Response | **Filled — can execute at these terms** |
| Quantity | Same as instruction (e.g. `100`) |
| Price | Same as limit or fill price (e.g. `10.00`) |
| Message | `Filled as instructed` |

Click **Submit response**.

**Expect:** Green success: fill recorded; AM will Accept on the orderbook.

### Path D2 — Counter (optional)

| Field | Value |
|--------|--------|
| Response | **Counter** |
| Quantity / Price | e.g. qty `100`, price `10.50` |
| Ask proceed? | Checked |
| Message | `Best available is higher — proceed?` |

Then on Orderbook: **Reject / keep looking** (to re-negotiate) or **Accept** if you agree to the counter terms (creates blotter trade at broker qty/price).

**Expect on Orderbook detail panel:**
- **Broker communication** panel (wider) shows stage chips — current step highlighted.
- **Latest broker terms** card with quantity, price, currency, notes.
- Message thread with the **latest inbound reply** highlighted (bold + blue border).
- Topbar **notification** (realtime) to the user who sent the instruction — click opens this order.

### Path D3 — Unable (optional)

| Field | Value |
|--------|--------|
| Response | **Unable** |
| Message | `Cannot find at that price` |

Then on Orderbook: **Reject / keep looking** or **Fail** the order — do **not** expect a blotter trade.

### Path D3b — Try another broker (or same broker again)

After **Reject / keep looking**:

1. Order status returns to **Sent to Broker** (no open confirmation).
2. Click **Send again** — sends immediately to the broker already on the order (must have a contact email). A **new email** and **new reply link** are created (the old link is one-time only).

**Expect:** Broker communication panel shows a new outbound instruction. You can repeat until filled or you **Fail** the order.

---

## E — AM Accepts on Orderbook (after D1)

1. Back to **Orderbook**, select the same order.
2. Status should be **Confirmation Recorded** (or similar).
3. You should see confirmation actions: **Accept** / **Reject / keep looking**.
4. Click **Accept**.

**Expect:**
- Toast with trade id / **Open blotter**.
- Order moves off the pending inbox (Executed / Pending Settlement).
- Trade now exists on **Trade Blotter**.

---

## F — Trade Blotter (custodian settle)

1. Go to **Orders → Trade Blotter**  
   `/investments-v2/orders/blotter`
2. Select the new trade.
3. **Confirm** (if shown).
4. **Settle & post** — one click (custodian settlement + accounting; uses today’s date).

**Expect:** Settlement → Settled, Accounting → Posted. Optional: **Open trade recon** / **Cash ledger for trade**.

---

## G — Trade recon (three-way match)

After **Settle & post**, click **Open trade recon** on the blotter detail panel (or go to `/investments-v2/reconciliation/trade`).

**Full step-by-step with CSV templates:** [`walkthrough-trade-reconciliation.md`](./walkthrough-trade-reconciliation.md)

**Quick version:**

1. Create a batch → select fund + today's date (`2026-08-05`).
2. **Ingest broker CSV** — click **Demo happy** (pre-filled for your INN trade), or paste:
   ```
   symbol,side,quantity,price,trade_date,broker_ref,currency
   INN,BUY,100,12.50,2026-08-05,BRK-INN-001,ZWG
   ```
3. **Ingest custodian CSV** — click **Demo happy**, or paste:
   ```
   symbol,side,quantity,price,trade_date,custodian_ref,currency
   INN,BUY,100,12.50,2026-08-05,CSD-INN-001,ZWG
   ```
4. **Run match** — system compares internal blotter vs broker vs custodian.
5. **Expect:** Zero exceptions if all three agree. Resolve any mismatches then **Complete batch**.

Use **Download blank template** on either ingest step if you want an empty CSV to fill yourself.

---

## Quick checklist

| Step | Screen | Result |
|------|--------|--------|
| A | Orderbook | Draft order |
| B | Orderbook | Approved |
| C | Orderbook | Sent to Broker + email + reply link |
| D | Public reply page | Broker confirmation recorded |
| E | Orderbook Accept | Trade on blotter |
| F | Blotter | Settled & posted |
| G | Trade recon | Three-way match — all parties agree |

---

## If something fails

| Symptom | What to check |
|---------|----------------|
| Cannot Send — no broker email | Broker record missing `contactEmail` |
| Email not received | Check spam; toast still gives **Copy reply link** — use that |
| Reply page 404 / expired | Link is 14 days; re-Send to get a new link |
| Accept does nothing / error | Confirmation must be **Recorded** (from broker reply or manual Record) |
| No cash / preview fails | Lower qty or top up fund cash |
| Blotter empty after Accept | Refresh blotter; confirm toast showed a trade id |

---

## Related

- Longer trading path (manual record confirmation): [`walkthrough-trading-retune-user-flow.md`](./walkthrough-trading-retune-user-flow.md)
- Trade reconciliation (three-way match step-by-step): [`walkthrough-trade-reconciliation.md`](./walkthrough-trade-reconciliation.md)
- Recon demo (fund cash / overview): [`walkthrough-recon-user-flow.md`](./walkthrough-recon-user-flow.md)
