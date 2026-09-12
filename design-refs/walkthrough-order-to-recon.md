# Order → Reconciliation — meeting dry-run

**Date:** 14 Aug 2026  
**Story:** We are the asset manager. We give an order to a broker. After they fill, we book it, settle it, then prove **Us × Broker × Bank** match.

**Do not demo today:** investment models generating orders, client cash-in / funding, bank release instruction.

---

## Where to log in

| Environment | URL | Login |
|-------------|-----|--------|
| **Your dry run (local)** | http://localhost:3001 | `admin@nts.com` / `admin123` |
| **Client demo (VPS)** | http://31.220.82.129:8080 | `admin@nts.com` / `admin123` |

App Switcher → **Investments V2**.

Open the broker reply link in a **new tab or incognito** so you stay logged in on the main app.

---

## What “the three parties” means

| Party | In this product |
|-------|-----------------|
| **Us** | Orderbook → Trade blotter + cash ledger |
| **Broker** | Email instruction + broker statement CSV |
| **Bank** | Custodian / bank statement CSV |

Every Reconciliation tab has a job. Walk them in this order after settle:

| Tab | Purpose |
|-----|---------|
| **Overview** | Control panel — live KPIs for the three match legs |
| **Trade match** | Us blotter × broker CSV × bank/custodian CSV |
| **Cash match** | Us cash ledger × bank statement (import → match → breaks) |
| **Positions** | Holdings vs quantity implied by settled trades |
| **Cash ledger** | Posted cash (Us books) — Fund vs Trading |
| **Exceptions** | Breaks that need a human decision (approve / reject / more info) |
| **Statements** | **Outgoing** client/investor cash statements (not the bank file you imported) |

Incoming bank file = **Cash match → Import Statements**.  
Outgoing report to the client = **Statements**. Do not mix those two.

---

## 0. Broker + custodian (once)

Skip this if a broker with a real email already exists.

1. **Orders → Setup** (`/investments-v2/orders/setup`).
2. Tab **Broker / Counterparties**.
3. Create a **broker**:
   - Name: `Demo Broker ZSE`
   - **Contact email:** an inbox **you can open** (Gmail etc.).
4. Create a **custodian** if none exists (any name).

You cannot send an instruction if the broker has no contact email.

**Done when:** broker shows an email on the dropdown later.

---

## 1. Place an order (Orderbook)

1. **Orders → Orderbook** (`/investments-v2/orders/orderbook`).
2. **New order**.
3. Fill (use your fund / listed equity if the demo names differ):

| Field | Example |
|--------|---------|
| Portfolio / fund | First demo fund |
| Instrument | `INN` / `CBZ` / `BAT` (approved listed equity) |
| Side | `BUY` |
| Order type | `Limit` |
| Quantity | `100` |
| Limit price | `10.00` |
| Broker | The broker with your email |
| Custodian | Any custodian |
| Notes | optional |

4. Create / place the order.

**Write these down — you need them for recon CSVs:**

| | Your values |
|--|-------------|
| Fund | |
| Symbol | |
| Side | BUY |
| Qty | |
| Price | |
| Currency (from the order / blotter) | |
| Trade date (today) | |

**Expect:** Draft on the Orderbook. **Nothing** on Trade Blotter yet.

---

## 2. Submit → Approve → Send to broker

Select the order. Buttons appear in the detail panel:

1. **Submit** → status **Submitted**.
2. **Approve** → status **Approved**. (Admin can approve their own order.)
3. **Send to broker** — uses the broker and custodian already on the order. No extra picker.

**Expect:**
- Email in the broker inbox.
- Status → **Sent to Broker**.
- Toast has **Copy reply link** — copy it. Use this if the email is slow.

If email delivery fails, toast still gives the reply link. You can also use **Record confirmation** on the order (backup, step 3b).

---

## 3. Broker replies (no login)

1. Open the email **or** paste the copied reply link in a **new** tab.
2. Confirm order ref, side, security, qty, limit.
3. Happy path:

| Field | Value |
|--------|--------|
| Response | **Filled — can execute at these terms** |
| Quantity | Same as order (e.g. `100`) |
| Price | Same as limit (e.g. `10.00`) |
| Message | `Filled as instructed` |

4. **Submit response**.

**Expect:** Success on the public page. Back in the app: notification; Orderbook shows confirmation recorded.

### 3b. Backup if email / public page fails

On the same order: **Record confirmation** → Outcome **Filled**, qty + price same as the order → **Save confirmation**.

---

## 4. Accept → trade appears on blotter

1. Stay on **Orderbook**, same order.
2. **Accept confirmation**.

**Expect:** Trade created. Open **Orders → Trade Blotter** (`/investments-v2/orders/blotter`). Your row is there.

---

## 5. Confirm → Settle & post

On the blotter, select the trade. Right-hand sequence:

1. **Confirm trade**.
2. **Settle & post**.

**Expect:** Settlement **Settled**, accounting **Posted**.

Keep this trade selected — next button is **Open trade recon**.

---

## 6. Reconciliation overview (control panel)

1. **Reconciliation → Overview** (`/investments-v2/reconciliation`).
2. Pick the **same fund** as the order.
3. You should see three cards with live numbers:
   - **Trade match** — Us × Broker × Bank
   - **Cash match** — Us ledger × Bank statement
   - **Positions** — holdings × settled trades

4. Use the tab bar under the title for the rest of this section (Overview / Trade match / Cash match / Positions / Cash ledger / Exceptions / Statements).

**Expect:** Trade / Cash / Positions counts for this fund. Then **Start trade match**.

---

## 7. Trade match (the three-way demo)

From the blotter: **Open trade recon**, or Overview → **Start trade match**.

Wizard steps (pills at the top):

### 7.1 Create batch

1. Fund = the fund you traded.
2. **As of date** = the trade date (today).
3. **Create batch**.

### 7.2 Ingest broker statement

1. **Download blank template**.
2. Fill **one row** that matches **your** blotter trade (not the sample INN/12.50 unless that is what you traded):

```text
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,100,10.00,2026-08-14,BRK-DEMO-001,ZWG
```

- `symbol` / `side` / `quantity` / `price` / `trade_date` / `currency` must match the blotter.
- `broker_ref` can be any unique string.

3. **Upload CSV** (or paste) → **Ingest broker**.

### 7.3 Ingest bank / custodian statement

Same numbers, different ref column:

```text
symbol,side,quantity,price,trade_date,custodian_ref,currency
INN,BUY,100,10.00,2026-08-14,CSD-DEMO-001,ZWG
```

**Download blank template** → fill → **Ingest custodian**.

### 7.4 Run match → Complete

1. **Run match**.
2. Left: clean matches. Right: exceptions (should be empty on happy path).
3. **Complete batch**.

**Expect:** Us / Broker / Bank sides match on this trade.

If it does **not** match: check symbol, qty, price, date, currency against the blotter row. A qty mismatch is a useful “break” demo if you want one — change custodian qty to `99` on a second run.

---

## 8. Cash match (Us ledger × Bank statement)

**Tab:** Cash match (`/investments-v2/reconciliation/fund-cash`)

**Why:** Trade match proved the **security**. Cash match proves the **money** — our cash ledger vs the bank’s statement.

Same fund as the order. Do not tell a “client gave us money” story — this is bank vs our books after settle.

### 8.1 New batch (if none for this fund)

1. **New batch**.
2. Cash account + currency + period from/to covering the trade date.
3. **Create batch**.
4. Confirm the batch is selected in the dropdown.

### 8.2 Import the bank statement (incoming file)

1. **Import Statements**.
2. Confirm cash account / provider / currency (prefilled from the selected batch).
3. Select the CSV (use `public/demo-templates/cash-recon/bank-statement-jan-aug-2026.csv` for the Jan–Aug 2026 USD batch).

The file is validated and posted in **one step**. If the file is bad, the modal stays open and lists the line errors — pick a corrected file. There is no Validate / Submit / Commit sequence.

Talking point: the bank file either lands on the statement or it is rejected with a reason. Matching still waits for **Run Reconciliation**.

### 8.3 Run match

1. Leave **Auto-match** on.
2. **Run Reconciliation**.
3. Three columns: **Internal** (us) · **Bank statement** · **Matched / Breaks / Unmatched**.
4. Suggestions at the bottom — confirm a high-confidence pair, or pick one internal line + one bank line → **Confirm manual match**.
5. Optional: **Unmatch (reversal)** with a reason.

**Expect:** Matched rows, or explicit breaks. Chips **Balanced** (totals tie) vs **Fully reconciled** (nothing left open).

If the workspace is empty: wrong batch / period, or import not committed.

---

## 9. Positions (holdings × settled trades)

**Tab:** Positions (`/investments-v2/reconciliation/positions`)

**Why:** After settle, our **position qty** should match **qty implied by settled trades**. This is us-side break detection (not the broker CSV).

1. Same fund.
2. Read KPIs: Positions · Settled trades · Breaks · As of.
3. If **Breaks = 0**: “Holdings match settled trades.”
4. If breaks exist: walk a row — Symbol, Position qty, Expected (settled), Variance. Demo data can already have breaks; that is a real finding, not a fake screen.

**Expect:** Live numbers from position recon. Use **Trade match** from this page if you need to jump back.

---

## 10. Cash ledger (posted books)

**Tab:** Cash ledger (`/investments-v2/reconciliation/cash-ledger`)

**Why:** After settle (and cash match), finance reads the **auditable cash book** — every debit/credit and running balance. This is **Us**, not the bank file.

1. Toggle **Fund** vs **Trading**.
   - **Fund** — fund cash movements and balances.
   - **Trading** — client/trading cash, settlements, available to trade.
2. Filter **Fund / Portfolio** to the same fund. Valuation date = today (or trade date).
3. Point at a row: date, account, type, debit/credit, running balance, approval status.
4. Stay on **Ledger**. Capital Calls / Distributions / Fees / Documents jump to other modules — skip those in this recon walk.

From the blotter, **Open cash ledger** (if shown) should land on this tab with the trade/fund already scoped.

**Expect:** At least one line after **Settle & post**. Empty table usually means the Fund/Trading toggle or date filter is wrong — switch the other view before calling it broken.

---

## 11. Exceptions (breaks that need a person)

**Tab:** Exceptions (`/investments-v2/reconciliation/exceptions`)

**Why:** Not every break auto-clears. Material variances become **owned work items** — investigate, attach evidence, decide.

1. Read KPIs: Critical / High, Overdue, Pending, match rate.
2. Filter **Pending Approval** or **Investigating** if the list is long.
3. Click a row. Detail panel: account, reason, amount difference, assigned to.
4. Tabs: **Timeline** · **Comments** · **Attachments** · **Audit Trail**.
5. Optional dry-run (only if you are willing to close a demo exception):
   - Add a comment, or attach a small PDF.
   - **Approve & Adjust** or **Reject** + notes → **Submit Decision**.

**Expect:** If cash/trade match left breaks, they show here. Empty list = clean book (or filters too tight). Do not treat `—` on a name column as a dead screen — that is a missing display label.

---

## 12. Statements (outgoing to the client)

**Tab:** Statements (`/investments-v2/reconciliation/statements`)

**Why:** After books are reconciled, we **issue** a cash statement. This is not the CSV you imported on Cash match.

Stay on segment **Client** (Investor is LP capital statements — mention it, then switch back).

1. Filters: Account / Currency / Status = All.
2. If the table is empty: **Generate Batch**.
3. Select a run → **Preview** (opening cash, movements, closing cash).
4. **Approve** (Draft / Pending → Approved).
5. **Download PDF**.
6. **Email** only if you want to show delivery (needs mail config — skip if it errors).

**Expect:** Preview + PDF from the trading cash ledger. Talking point: “Incoming bank file vs outgoing client statement — two different artefacts.”

---

## Quick checklist (tick while you dry-run)

| # | Where | Done when |
|---|--------|-----------|
| 0 | Orders → Setup | Broker with an inbox you can open |
| 1 | Orderbook | Draft order |
| 2 | Orderbook | Approved + email / reply link |
| 3 | Email or new tab | Broker filled |
| 4 | Orderbook → Accept confirmation | Trade on blotter |
| 5 | Blotter | Confirmed + Settled & posted |
| 6 | Recon → Overview | Same fund, three KPI cards |
| 7 | Trade match | Batch complete, us × broker × bank matched |
| 8 | Cash match | Bank file committed + run match (matched or explicit breaks) |
| 9 | Positions | Holdings vs settled trades reviewed |
| 10 | Cash ledger | Posted line for the settle (Fund and/or Trading) |
| 11 | Exceptions | Open item reviewed (decision optional) |
| 12 | Statements | Client segment: generate / preview / approve / PDF |

---

## If something fails in the room

| Symptom | What to do |
|---------|------------|
| No **Send to broker** | Order must be **Approved**. Broker must have an email. |
| No email | Use **Copy reply link** from the toast / order detail. |
| Public reply page error | Use **Record confirmation** (step 3b). |
| Blotter empty | You skipped **Accept confirmation**. |
| Settle disabled | **Confirm trade** first. |
| Trade match miss | CSV row must match blotter symbol / qty / price / date / currency. |
| Cash match empty | Create **New batch**, **Commit** an import, then **Run Reconciliation**. |
| Cash ledger empty | Toggle Fund ↔ Trading; widen valuation date; confirm settle posted. |
| Exceptions empty | Clean book, or loosen severity/status filters. |
| Statements empty | **Generate Batch** on Client segment. |
| Login “Server has closed the connection” | Local DB tunnel dropped — tell the agent, don’t debug in front of the client. Use VPS `http://31.220.82.129:8080` instead. |
