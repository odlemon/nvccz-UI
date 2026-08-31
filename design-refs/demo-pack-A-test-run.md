# Pack A — Test run (order → settle → reconcile)

**Purpose:** Dry-run the full trading story on dev **before** the client demo.  
**Environment:** https://dev.arcus.co.zw  
**Login:** `admin@nts.com` / `admin123`  
**Upload files folder:** `public/demo-templates/demo-pack-test/`

---

## Scenario at a glance

| Item | Value |
|------|--------|
| **Portfolio** | Arcus Listed Portfolio |
| **Cash available** | ~USD 5,000,000 (seeded) — verify in Place Order preview |
| **Instrument** | **CBZ** — CBZ Holdings Limited |
| **Side** | BUY |
| **Quantity** | **2,000** |
| **Limit price** | **12.50** ZWG |
| **Est. gross** | 25,000 ZWG (+ fees in preview) |
| **Broker** | **Imara Capital** (set contact email to **your inbox** before send) |
| **Custodian** | Any seeded custodian (e.g. CBZ Custody) |
| **Trade / value date** | **20 Aug 2026** (today) |
| **Currency (recon CSVs)** | **ZWG** |

**Story in one line:** “We buy CBZ for the listed portfolio, broker fills, we settle, then prove Us × Broker × Bank match.”

---

## Files to have ready (download from repo or dev)

| Step | File | Upload where |
|------|------|----------------|
| After settle | `broker-statement.csv` | Reconciliation → Trade match → Ingest broker |
| After settle | `custodian-statement.csv` | Trade match → Ingest custodian |
| Cash recon | `bank-statement-settlement.csv` | Reconciliation → Cash match → Import Statements |
| Optional evidence | `upload-trade-confirmation.pdf` | Investments → Documentation → `TRADE_CONFIRMATION` |
| Optional evidence | `upload-custodian-statement.pdf` | Documentation → `CUSTODIAN_STATEMENT` |

On dev (after deploy):  
`https://dev.arcus.co.zw/demo-templates/demo-pack-test/broker-statement.csv` (same for other files).

---

## Pre-flight (5 min)

1. App Switcher → **Investments V2**.
2. **Orders → Setup** → tab **Broker / Counterparties**.
   - Edit **Imara Capital** → set **Contact email** to an inbox you can open (Gmail, etc.).
3. Confirm custodian exists (create one if empty).
4. **Portfolios** → open **Arcus Listed Portfolio** → note cash KPI is non-zero.

---

## Part 1 — Orderbook → Blotter

### 1. Place order

**Orders → Orderbook** → **New order**

| Field | Value |
|-------|--------|
| Side | Buy |
| Portfolio | Arcus Listed Portfolio |
| Instrument | CBZ |
| Order type | Limit |
| Quantity | 2000 |
| Limit price | 12.50 |
| Validity / value date | 20 Aug 2026 |
| Broker | Imara Capital |
| Custodian | (your custodian) |

Click **Review Order** → confirm **Cash before** is enough → **Place Buy Order**.

**Write down after create:**

| | Your value |
|--|------------|
| Order ref | ORD-… |
| Symbol | CBZ |
| Qty | 2000 |
| Price | 12.50 |

### 2. Approve workflow

Select the order in the table → detail panel:

1. **Submit**
2. **Approve**
3. **Send to broker** → copy **reply link** from toast if email is slow

### 3. Broker reply (new tab / incognito)

Open reply link OR email → public broker page:

| Field | Value |
|-------|--------|
| Response | Filled — can execute at these terms |
| Quantity | 2000 |
| Price | 12.50 |
| Message | Filled as instructed — test run |

**Backup:** Orderbook → **Record confirmation** → Outcome **Filled**, same qty/price.

### 4. Accept → trade

Back on Orderbook → **Accept confirmation**.

**Expect:** Row moves toward Executed; **Orders → Trade Blotter** shows the trade.

### 5. Confirm & settle

**Trade Blotter** → select trade:

1. **Confirm trade**
2. **Settle & post**

**Expect:** Settlement = Settled, Accounting = Posted.

**Note the blotter row:** symbol, qty, exec price, **net settlement amount**, currency — adjust bank CSV amounts if net differs from 25,000.

---

## Part 2 — Reconciliation

### 6. Overview

**Reconciliation → Overview** → fund = **Arcus Listed Portfolio**.

Three KPI cards: Trade match · Cash match · Positions.

### 7. Trade match (three-way)

**Reconciliation → Trade match** (or **Open trade recon** from blotter)

1. **Create batch** — fund = Arcus Listed Portfolio, as-of = **20 Aug 2026**
2. **Ingest broker** — upload `broker-statement.csv`
3. **Ingest custodian** — upload `custodian-statement.csv`
4. **Run match** → should match on CBZ / 2000 / 12.50 / ZWG
5. **Complete batch**

If mismatch: compare CSV to blotter (symbol, side, qty, price, date, currency).

### 8. Cash match (bank statement)

**Reconciliation → Cash match**

1. Select fund / create **New batch** if needed (USD, period covering 20 Aug 2026)
2. **Import Statements** → upload `bank-statement-settlement.csv`
3. **Run Reconciliation**
4. Review matched rows / breaks

Talking point: trade match = **security**; cash match = **money movement**.

### 9. Cash ledger

**Reconciliation → Cash ledger** → toggle **Fund** / **Trading** → filter **Arcus Listed Portfolio**.

Point at settlement line after **Settle & post**.

### 10. Positions

**Reconciliation → Positions** → same fund → CBZ qty should include +2,000 from this trade (may show 0 breaks).

### 11. Documentation (optional)

**Investments → Documentation** → **Upload document**

| File | Document type | Portfolio |
|------|---------------|-----------|
| `upload-trade-confirmation.pdf` | Trade Confirmations | Arcus Listed Portfolio |
| `upload-custodian-statement.pdf` | Custodian & Bank | Arcus Listed Portfolio |

---

## Test checklist

| # | Step | Done |
|---|------|------|
| 0 | Broker email = your inbox | ☐ |
| 1 | Order placed (CBZ 2000 @ 12.50) | ☐ |
| 2 | Sent to broker + reply | ☐ |
| 3 | Accept → blotter trade | ☐ |
| 4 | Confirm + Settle & post | ☐ |
| 5 | Trade match complete | ☐ |
| 6 | Cash match import + run | ☐ |
| 7 | Cash ledger line visible | ☐ |
| 8 | Docs uploaded (optional) | ☐ |

---

## If something breaks

| Symptom | Fix |
|---------|-----|
| Insufficient cash on preview | Use **Arcus Listed Portfolio** only; re-run seed if needed |
| Send to broker disabled | Order must be Approved; broker needs email |
| Trade match miss | Edit CSV dates/qty/price to match blotter exactly |
| Cash match empty | Wrong batch period — include 20 Aug 2026 |
| Bank file rejected | Header must be `value_date,trade_date,amount,debit_credit,reference,counterparty,description` |

When Pack A passes end-to-end, run **Pack B** once with the client script (`design-refs/demo-pack-B-client-demo.md`).
