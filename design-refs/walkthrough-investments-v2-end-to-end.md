# Investments V2 — end-to-end user guide

**Meeting dry-run (order → recon):** [`walkthrough-order-to-recon.md`](./walkthrough-order-to-recon.md)

**App (VPS):** http://31.220.82.129:8080 · **Local:** http://localhost:3001  
**Login:** `admin@nts.com` / `admin123`

Open the broker reply link in a **new tab / incognito** so you stay logged in on the main app.

---

## 1. Create a broker (and use an email you can open)

1. Log in → App Switcher → **Investments V2**.
2. Go to **Orders → Setup** (`/investments-v2/orders/setup`).
3. Open the **Broker / Counterparties** tab.
4. Create a **broker** with:
   - **Name** — e.g. `Demo Broker ZSE`
   - **Contact email** — an inbox **you can open** (Gmail, etc.). The instruction email is sent here.
5. (Recommended) Also create a **custodian** the same way if you do not already have one.

You cannot send an instruction if the broker has no contact email.

---

## 2. Create an order (Orderbook)

1. Go to **Orders → Orderbook** (`/investments-v2/orders/orderbook`).
2. Click **New order**.
3. Enter details like this (use your fund / listed equity if different):

| Field | Example |
|--------|---------|
| Portfolio / fund | First demo fund |
| Instrument | e.g. `INN` / `CBZ` / `BAT` (approved listed equity) |
| Side | `BUY` |
| Order type | `Limit` |
| Quantity | `100` |
| Limit price | `10.00` (or near market) |
| Broker | The broker you just created (must show an email) |
| Custodian | Any custodian |
| Notes | optional |

4. Place / create the order.

**Expect:** Draft order on the Orderbook. Nothing on Trade Blotter yet.

---

## 3. Submit → Approve → Send to broker

1. Select the order → **Submit** → status **Submitted**.
2. **Approve** → status **Approved**.  
   (As admin you can approve your own order.)
3. Click **Send to broker** — uses the broker and custodian already on the order (no picker).

**Expect:**
- Email sent to the broker contact email.
- Order status → **Sent to Broker**.
- Toast / detail panel has **Copy reply link** if you need it.

The link in the email looks like:

`http://207.180.234.151:8080/broker-instruction/{token}`

---

## 4. Open the email and reply (broker — no login)

1. Open the broker inbox.
2. Open the instruction email → click the reply link  
   (or paste the copied link into a **new** browser tab).
3. Confirm you see order ref, side, security, qty, limit.
4. Happy path — fill:

| Field | Value |
|--------|--------|
| Response | **Filled — can execute at these terms** |
| Quantity | Same as order (e.g. `100`) |
| Price | Same as limit / fill (e.g. `10.00`) |
| Message | `Filled as instructed` |

5. **Submit response**.

**Expect:** Success on the public page. Back in the app you get a **notification**; Orderbook shows confirmation recorded / broker communication updated.

---

## 5. Accept on Orderbook → trade on Blotter

1. Stay on **Orderbook**, select the same order.
2. Click **Accept** on the broker confirmation.

**Expect:** Trade created → open **Orders → Trade Blotter** (`/investments-v2/orders/blotter`).

---

## 6. Settle & post (accounting)

1. On **Trade Blotter**, select the trade.
2. **Confirm** if shown.
3. Click **Settle & post** (settlement + GL posting).

**Expect:** Settlement **Settled**, accounting **Posted**. You can open cash / ledger views from the trade if shown.

---

## 7. Trade match (bank vs us vs broker)

1. Go to **Reconciliation → Overview** — confirm Trade / Cash / Positions KPIs for the fund.
2. Open **Trade match** (`/investments-v2/reconciliation/trade`), or **Open trade recon** from the blotter.
3. Select the **fund**, set **as-of date** to the trade date → **Create batch**.
4. **Download blank template** for broker and for bank/custodian (or use your own CSVs).
5. Fill both CSVs to match the settled trade, then **Ingest broker** → **Ingest bank/custodian** → **Run match**.
6. Review matches / exceptions → **Complete** the batch.
7. Optionally open **Cash match** (ledger × bank statement) and **Positions** (holdings × settled trades).

**Expect:** Happy path — us / broker / bank sides match on Trade match; Cash and Positions show healthy or explicit breaks.

---

## 8. Reports

1. Go to **Reporting** (`/investments-v2/reporting`).
2. Pick a template (e.g. **Performance Report**).
3. Choose fund / params (period, valuation date, etc.) → format **DOCX** → **Generate**.
4. When status is **Completed**, **Download**.

**Expect:** File named like `Performance Report - 05 Aug 2026.docx` (no database ids). Open in Word — yellow placeholders filled, blue instruction boxes removed.

---

## Quick checklist

| Step | Where | Done when |
|------|--------|-----------|
| 1 | Orders → Setup | Broker with email you can open |
| 2 | Orderbook | Draft order |
| 3 | Orderbook | Approved + email sent |
| 4 | Email / public link | Broker filled |
| 5 | Orderbook → Accept | Trade on blotter |
| 6 | Blotter | Settled & posted |
| 7 | Recon → Overview / Trade match | Us × Broker × Bank matched |
| 8 | Reporting | Report generated & downloaded |
