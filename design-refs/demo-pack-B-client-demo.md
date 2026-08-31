# Pack B — Client demo (order → settle → reconcile)

**Purpose:** Live client presentation on [dev.arcus.co.zw](https://dev.arcus.co.zw).  
**Login:** `admin@nts.com` / `admin123`  
**Upload files:** `public/demo-templates/demo-pack-client/` (copy to desktop before the meeting)

---

## Locked match contract (do not improvise)

Use **exactly** these order values so Trade match CSVs and bank cash line align with the blotter after settle.

| Field | Value | Why it matters |
|-------|--------|----------------|
| Portfolio | **Arcus Income Mandate** | Same fund on order, blotter, recon batches |
| Instrument | **INN** (Innscor Africa Limited) | `symbol` in broker + custodian CSVs |
| Side | **BUY** | CSV `side` |
| Quantity | **500** | CSV `quantity` |
| Limit / fill price | **42.10** ZWG | CSV `price` |
| Broker fill | Same **500** @ **42.10** | Accept confirmation creates blotter trade |
| Trade / as-of date | **2026-08-20** (or *today* if you change all files) | CSV `trade_date` + Trade match as-of |
| Currency | **ZWG** | CSV `currency` + settlement cash account |
| Gross | **21,050.00** (= 500 × 42.10) | |
| Commission | **20 bps** → **42.10** | Seeded Imara Edwards rate |
| **Net settle (cash)** | **21,092.10** | One ledger debit + bank CSV debit |

**Broker ref (CSV):** `BRK-CLIENT-INN-001`  
**Custodian ref (CSV):** `CSD-CLIENT-INN-001`  
**Bank settlement ref:** `TRD-BUY-INN-CLIENT`

If the demo day is **not** 20 Aug 2026, change `trade_date` / `value_date` in **all three** CSVs to that day **before** the meeting, and use the same date as Trade match **As of**.

---

## Files (already aligned to the contract)

| File | Used on | Must equal |
|------|---------|------------|
| `broker-statement.csv` | Trade match → Ingest broker | INN · BUY · 500 · 42.10 · date · ZWG |
| `custodian-statement.csv` | Trade match → Ingest custodian | Same numbers (different ref) |
| `bank-statement-settlement.csv` | Cash match → Import | Debit **21092.10** for net settle |
| `upload-trade-confirmation.pdf` | Documentation | Evidence only |
| `upload-custodian-statement.pdf` | Documentation | Evidence only |
| `upload-mandate-excerpt.pdf` | Documentation (opener) | Optional |

Dev URLs (after UI has these files):  
`https://dev.arcus.co.zw/demo-templates/demo-pack-client/<filename>`

---

## What each Reconciliation tab does (say this in the room)

| Tab | One-liner for the client |
|-----|--------------------------|
| **Overview** | Control panel — live counts for trade match, cash match, and position health on the selected fund. |
| **Trade match** | Three-way security match: **our blotter × broker statement × custodian statement** (symbol, side, qty, price, date). |
| **Cash match** | Money match: **our cash books × bank statement** after you import the bank CSV and run match. |
| **Positions** | Holdings check: do **position quantities** agree with **settled trades** for this fund? |
| **Cash ledger** | The **auditable cash book** (Fund / Trading) — every posted debit/credit and running balance after settle. |
| **Exceptions** | Breaks that need a person — investigate, attach evidence, approve or reject. |
| **Statements** | **Outgoing** client/investor cash statements we issue (not the bank file you imported on Cash match). |

Walk order after settle: **Overview → Trade match → Cash match → Cash ledger → Positions** (Exceptions / Statements only if time).

---

## Pre-flight (before client joins)

1. Pack A dry-run already passed once.
2. **Arcus Income Mandate** has cash (Place Order → Review shows Cash before).
3. **Orders → Setup** → **Imara Edwards Securities** contact email = inbox you control (or plan **Record confirmation**).
4. Desktop copies of Pack B CSVs/PDFs — confirm broker/custodian lines still read `INN,BUY,500,42.10,…,ZWG` and bank debit `21092.10`.
5. Incognito ready for broker reply link.

---

## Demo script (45–60 min)

### Act 1 — Context (3 min)

**Portfolios** → **Arcus Income Mandate**  
Optional: **Documentation** → upload `upload-mandate-excerpt.pdf`.

### Act 2 — Order (8 min)

**Orders → Orderbook** → **New order**

| Field | Value |
|-------|--------|
| Portfolio | Arcus Income Mandate |
| Instrument | INN |
| Side / type | BUY · Limit |
| Quantity / price | **500** · **42.10** |
| Value date | **2026-08-20** (or today if CSVs updated) |
| Broker | Imara Edwards Securities |
| Custodian | CBZ Custody (or seeded custodian) |

**Review Order** → **Place Buy Order** → **Submit** → **Approve** → **Send to broker**.

### Act 3 — Broker fill (5 min)

Reply link (incognito): **Filled** · **500** · **42.10** → Submit.  
App: **Accept confirmation** → open **Trade Blotter**.

### Act 4 — Settlement (5 min)

Blotter → **Confirm trade** → **Settle & post**.  
Expect Settlement **Settled**, Accounting **Posted**, net ≈ **21,092.10** ZWG.

Write blotter **trade date** and **net** on the worksheet. If net ≠ 21092.10, stop and fix bank CSV before Cash match.

### Act 5 — Reconciliation overview (2 min)

**Reconciliation → Overview** → fund = **Arcus Income Mandate**.  
Point at the three KPI cards; use the tab blurbs above.

### Act 6 — Trade match (10 min) — guaranteed three-way

**Reconciliation → Trade match**

1. **Create batch** — fund = Arcus Income Mandate · **As of** = trade date (2026-08-20 or today).
2. **Ingest broker** → `broker-statement.csv`
3. **Ingest custodian** → `custodian-statement.csv`
4. **Run match** → INN should match Us / Broker / Custodian
5. **Complete batch**

If it misses: blotter qty/price/date/currency ≠ CSV (do not invent different numbers on the fly).

### Act 7 — Cash match + Cash ledger (10 min)

**Cash match**

1. **New batch** if needed — pick the **ZWG** cash account for this fund when listed; period must include the trade date.
2. **Import Statements** → `bank-statement-settlement.csv` (debit **21092.10**).
3. **Run Reconciliation** — show bank line vs internal suggestion / match.

**Cash ledger** — toggle Fund/Trading, filter **Arcus Income Mandate**, point at the settle debit after **Settle & post**.

### Act 8 — Positions + docs (5 min)

**Positions** — INN qty vs settled trades.  
**Documentation** — upload trade confirmation + custodian PDFs.  
**Statements** (optional) — Client → Generate → Preview PDF.

---

## Worksheet (fill live)

| Field | Value |
|-------|--------|
| Order ref | |
| Trade / blotter ref | |
| Trade date (YYYY-MM-DD) | 2026-08-20 or |
| Net settlement | must be **21092.10** (or update bank CSV) |
| Broker CSV ref | BRK-CLIENT-INN-001 |
| Custodian CSV ref | CSD-CLIENT-INN-001 |

---

## Checklist

| # | Moment | Done |
|---|--------|------|
| 1 | Mandate / portfolio | ☐ |
| 2 | Order 500 @ 42.10 placed & approved | ☐ |
| 3 | Broker filled same qty/price | ☐ |any
| 4 | Accept → blotter | ☐ |
| 5 | Confirm + Settle & post | ☐ |
| 6 | Trade match complete (three-way) | ☐ |
| 7 | Cash match import + run | ☐ |
| 8 | Cash ledger settle line | ☐ |
| 9 | Docs uploaded | ☐ |

---

## Fallbacks

| Issue | Do |
|-------|-----|
| Email delay | Copy reply link / **Record confirmation** Filled 500 @ 42.10 |
| Trade match miss | Re-check CSV vs blotter; re-ingest corrected file |
| Net ≠ 21092.10 | Edit bank CSV debit to blotter net, then import |
| Cash match empty | Wrong currency/account or period — use ZWG + trade date |

---

## Pack A vs Pack B

| | Pack A (test) | Pack B (client) |
|--|---------------|-----------------|
| Doc | `demo-pack-A-test-run.md` | This file |
| Files | `demo-pack-test/` | `demo-pack-client/` |
| Portfolio | Arcus Listed Portfolio | Arcus Income Mandate |
| Trade | CBZ 2,000 @ 12.50 | **INN 500 @ 42.10** |
| Net cash | ~25,050 (gross+20bps) | **21,092.10** |
