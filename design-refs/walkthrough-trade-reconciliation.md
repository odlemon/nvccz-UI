# Trade Reconciliation Walkthrough

**Purpose:** Three-way match — internal blotter vs broker statement vs custodian statement.

**Entry point:** After Step F (Settle & post) in the broker email walkthrough, click **Open trade recon** on the blotter, or go directly to:

`/investments-v2/reconciliation/trade`

---

## Batches list

On `/investments-v2/reconciliation/trade`, the **Batches** panel lists drafts (`OPEN` / `INGESTED` / `MATCHED`) and **Completed** batches. Filter with All / Drafts / Completed. **Resume** opens a draft; **View** opens a completed batch.

API: `GET /api/investment-ops/trade-reconciliation/batches?status=DRAFT|COMPLETED&fundId=`

---

## What you need before starting

| Requirement | How to get it |
|-------------|---------------|
| A trade on the blotter (Settled & Posted) | Complete Steps A–F in the broker email walkthrough |
| The trade's **security symbol** (e.g. `INN`) | Visible on the blotter row |
| The trade's **quantity** and **price** | Visible on the blotter detail panel |
| The trade's **execution date** (today, `YYYY-MM-DD`) | Visible on the blotter row |
| Demo CSV files (or your own) | See Step 2 and Step 3 below |

---

## What reconciliation checks

| Exception code | Meaning |
|---------------|---------|
| **All three match** | Internal ✓, Broker ✓, Custodian ✓ — trade is clean |
| `MISSING_BROKER` | Internal trade exists, broker sent no statement line for it |
| `MISSING_CUSTODIAN` | Internal + broker match, custodian has no record → settlement not confirmed |
| `MISSING_INTERNAL` | Broker or custodian has a line with **no matching internal trade** → unrecorded trade |
| `QTY_MISMATCH` | All three present but quantities differ |
| `PRICE_MISMATCH` | Quantities agree but prices differ |

---

## Step 1 — Create a batch

1. Go to `/investments-v2/reconciliation/trade` (or click **Open trade recon** from the blotter).
2. Select the **fund / portfolio** your trade belongs to.
3. Set **As-of date** to today's date (the date the trade was executed).
4. Click **Create batch**.

**Expect:** Step advances to "Ingest broker".

---

## Step 2 — Ingest broker statement

You need a CSV that represents what the broker says they executed.

### Option A — Happy path (broker confirms exactly your trade)

Create a file called `broker-statement.csv` with this content — replacing the values with your actual trade:

```csv
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,100,10.00,2026-08-05,BRK-001,ZWG
```

| Column | What to put |
|--------|------------|
| `symbol` | Security ticker from the blotter (e.g. `INN`) |
| `side` | `BUY` or `SELL` (uppercase) |
| `quantity` | Trade quantity from the blotter (e.g. `100`) |
| `price` | Execution price from the blotter (e.g. `12.50`) |
| `trade_date` | Execution date in `YYYY-MM-DD` (e.g. `2026-08-05`) |
| `broker_ref` | Any reference, e.g. `BRK-INN-001` |
| `currency` | Trade currency (e.g. `ZWG` or `USD`) |

### Your current blotter trade (happy path — ready to use)

From DB: **TXN-MSFS1945403A8D** · INN BUY 100 @ 12.50 ZWG · executed 05 Aug 2026 · Arcus Listed Portfolio.

**Broker CSV (Demo happy loads this):**
```csv
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,100,12.50,2026-08-05,BRK-INN-001,ZWG
```

**Custodian CSV (Demo happy loads this):**
```csv
symbol,side,quantity,price,trade_date,custodian_ref,currency
INN,BUY,100,12.50,2026-08-05,CSD-INN-001,ZWG
```

On the ingest steps you can also click **Download blank template** to get an empty header-only CSV to fill yourself.

### Option B — Broker shows fewer trades (quantity mismatch scenario)

```csv
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,50,10.00,2026-08-05,BRK-001,ZWG
```

→ Will produce a `QTY_MISMATCH` exception.

### Option C — Broker has a trade you don't

```csv
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,100,10.00,2026-08-05,BRK-001,ZWG
XYZ,SELL,200,5.00,2026-08-05,BRK-002,USD
```

→ The `XYZ` line will produce a `MISSING_INTERNAL` exception (broker has it, your blotter does not).

### To ingest

1. Copy the CSV content into the **Broker CSV** text area on the Trade Recon page, **or** click **Upload CSV** and select the file.
2. Click **Ingest broker**.

**Expect:** Step advances to "Ingest custodian".

---

## Step 3 — Ingest custodian statement

Create a file called `custodian-statement.csv` with custodian's settlement records.

### Option A — Happy path (custodian confirms settlement)

```csv
symbol,side,quantity,price,trade_date,custodian_ref,currency
INN,BUY,100,10.00,2026-08-05,CSD-001,ZWG
```

Same columns as broker, except the last reference column is `custodian_ref` (not `broker_ref`).

### Option B — Custodian has no record (funds/securities didn't move)

Leave the custodian CSV blank, or use only unrelated lines:

```csv
symbol,side,quantity,price,trade_date,custodian_ref,currency
```

→ Will produce a `MISSING_CUSTODIAN` exception — broker confirmed but settlement not confirmed by custodian.

### To ingest

1. Paste or upload the custodian CSV into the **Custodian CSV** area.
2. Click **Ingest custodian**.

**Expect:** Step advances to "Run match".

---

## Step 4 — Run match

Click **Run match**.

**The system will:**
- Pull all internal blotter trades for the fund on the as-of date.
- Compare each internal trade against broker lines (symbol + side + date).
- Compare each internal trade against custodian lines (symbol + side + date).
- Raise exceptions for any mismatch or missing party.

**Expect:** Results appear on the Exceptions step.

---

## Step 5 — Review exceptions

| Exception | What it means | Action |
|-----------|--------------|--------|
| No exceptions | All three parties agree — clean | Proceed to Complete |
| `MISSING_BROKER` | Your blotter has the trade, broker doesn't | Investigate with broker; write off if already known |
| `MISSING_CUSTODIAN` | Trade executed but no settlement evidence | Chase custodian; write off when resolved |
| `MISSING_INTERNAL` | Broker/custodian has a trade not in your blotter | Record the missing trade internally |
| `QTY_MISMATCH` | Parties disagree on quantity | Investigate; manual match if acceptable |
| `PRICE_MISMATCH` | Quantities agree but price differs | Investigate; manual match if acceptable |

For each exception you can:
- **Manual match** — accept the blotter trade as matched without requiring a statement line (e.g. broker confirmed offline). Row moves from Exceptions to Matches.
- **Write off** — close the break with an audit reason (not a match). Enter a reason first, then Write off. All open exceptions must be cleared before Complete.

Step 5 shows **Matches** (left) and **Exceptions** (right) side by side.

---

## Step 6 — Complete the batch

Once all exceptions are either **matched** or **written off**:

1. Click **Complete batch**.

**Expect:** Batch status → `COMPLETED`.

---

## Quick checklist

| Step | What happens |
|------|-------------|
| 1. Create batch | Fund + as-of date locked |
| 2. Ingest broker CSV | Broker statement lines loaded |
| 3. Ingest custodian CSV | Custodian statement lines loaded |
| 4. Run match | 3-way comparison runs |
| 5. Resolve exceptions | Mismatches investigated / written off |
| 6. Complete | Batch closed |

---

## Scenarios to demo

### Scenario A — Clean three-way match

Use **happy** files: broker qty and price match internal trade; custodian confirms.

→ **Zero exceptions**, batch completes cleanly.

### Scenario B — Broker quantity mismatch

Broker says `50` shares, internal blotter says `100`.

→ `QTY_MISMATCH` exception raised. Demo the write-off or manual match.

### Scenario C — Settlement not confirmed

Broker file shows the trade, custodian file is empty.

→ `MISSING_CUSTODIAN` raised. Shows money/securities haven't confirmed as moved yet.

### Scenario D — Broker has a trade you don't

Add an extra row to the broker CSV for a security not in your blotter.

→ `MISSING_INTERNAL` raised. Shows a trade happened externally but was never booked internally.

---

## CSV template (copy-paste ready — matches your INN trade)

**Broker:**
```csv
symbol,side,quantity,price,trade_date,broker_ref,currency
INN,BUY,100,12.50,2026-08-05,BRK-INN-001,ZWG
```

**Custodian:**
```csv
symbol,side,quantity,price,trade_date,custodian_ref,currency
INN,BUY,100,12.50,2026-08-05,CSD-INN-001,ZWG
```

Or click **Demo happy** on each ingest step — those files are pre-filled with this trade.

---

## If something fails

| Symptom | What to check |
|---------|--------------|
| No exceptions AND no matches | Symbol, side, or date in the CSV doesn't match the blotter exactly (case, format) |
| `MISSING_INTERNAL` for every line | As-of date doesn't match execution date on the blotter |
| Fund has no trades on that date | Wrong fund selected, or trade was executed on a different date |
| Batch won't complete | Unresolved `OPEN` exceptions — write them off first |

---

## Related

- Broker email instruction flow: [`walkthrough-broker-email-instruction.md`](./walkthrough-broker-email-instruction.md)
- Longer trading path (manual confirm): [`walkthrough-trading-retune-user-flow.md`](./walkthrough-trading-retune-user-flow.md)
