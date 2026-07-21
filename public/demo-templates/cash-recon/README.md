# Cash recon demo import templates

**For today's walkthrough** — upload these on **Fund Cash → Import Statements**.

Live seed (2026-07-20 UAT):

| Setup | Value |
| --- | --- |
| Provider | **CBZ Custody / CBZ Bank** (`code: CBZ_CUSTODY`) |
| Layout | **CBZ_CSV_V1** (`layoutCode: CBZ_CSV_V1`, status ACTIVE) |
| Currency | **USD** |
| Pick | Any seeded USD client cash account in the Import dropdown |

---

## Which file to use in the demo

| Demo beat | File | Expected result |
| --- | --- | --- |
| Happy path ingest → Validate → Submit → Commit | [`cbz-csv-v1-happy-path.csv`](./cbz-csv-v1-happy-path.csv) | RECEIVED → VALIDATED → commit OK |
| Create unmatched / variance / weak matches | [`cbz-csv-v1-breaks-demo.csv`](./cbz-csv-v1-breaks-demo.csv) | Commit OK; recon shows breaks / weak suggestions |
| Show Validate errors (line codes) | [`cbz-csv-v1-validation-fail.csv`](./cbz-csv-v1-validation-fail.csv) | VALIDATION_FAILED; Commit blocked |
| Alternate column shape (needs BE column map) | [`cbz-csv-v1-debit-credit-columns.csv`](./cbz-csv-v1-debit-credit-columns.csv) | Only if BE maps `debit_amount`/`credit_amount` |

**Primary demo file:** `cbz-csv-v1-happy-path.csv`

Download in browser (dev server running):

- http://localhost:3001/demo-templates/cash-recon/cbz-csv-v1-happy-path.csv
- http://localhost:3001/demo-templates/cash-recon/cbz-csv-v1-breaks-demo.csv
- http://localhost:3001/demo-templates/cash-recon/cbz-csv-v1-validation-fail.csv

---

## Canonical CSV structure (CBZ_CSV_V1)

**Required header (exact names):**

```text
value_date,trade_date,amount,debit_credit,reference,counterparty,description
```

| Column | Type | Rules |
| --- | --- | --- |
| `value_date` | `YYYY-MM-DD` | Required; mapped via layout `dateMapJson.valueDate` |
| `trade_date` | `YYYY-MM-DD` | Optional but preferred; mapped via `dateMapJson.tradeDate` |
| `amount` | decimal ≥ 0 | Magnitude only (sign from `debit_credit`) |
| `debit_credit` | `Debit` \| `Credit` | Sign map: Debit=NEGATIVE, Credit=POSITIVE (Arcus cash asset convention) |
| `reference` | string | Used in match fingerprint + scoring |
| `counterparty` | string | Scoring component (10%) |
| `description` | string | Display / staging |

**Control totals (API body, not CSV):** when validating/committing, FE/API may send:

```json
{
  "controlOpening": "10000.00",
  "controlClosing": "14119.50"
}
```

Happy-path arithmetic check (Credit − Debit on signed cash):

- Credits: 10000 + 5000 + 3200 + 50 = **18250**
- Debits: 2450 + 125.50 + 980 + 75 + 1500 = **5130.50**
- Net movement = **+13119.50**
- If opening = 10000 → closing should be **23119.50** (adjust controls to match BE’s opening continuity rules)

---

## Backend seed / layout contract

See [`layout-contract-cbz-csv-v1.json`](./layout-contract-cbz-csv-v1.json) and `backend_asks.md` **BA-R6**.

Parser must accept the happy-path file against seeded `CBZ_CSV_V1` without column guessing.
