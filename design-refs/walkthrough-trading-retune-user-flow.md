# Trading flow — simple success path

**Where:** Investments V2 → Orders  
**Rule:** Create orders only on **Orderbook**. Broker work stays outside the system.

Use today’s date where a date is needed. If a dropdown name below is missing in your tenant, pick the **first available** option of that type.

---

## Step 1 — Create order (Orderbook)

1. Open **Orders → Orderbook**
2. Click **New order**
3. Fill the form like this:

| Field | What to enter / select |
|--------|-------------------------|
| Portfolio / fund | First fund in the list (e.g. your demo equity fund) |
| Instrument | Search and pick a listed equity (e.g. **CBZ** or whatever is seeded) |
| Side | **BUY** |
| Order type | **Limit** |
| Quantity | `1000` |
| Limit price | `10.00` |
| Broker | First broker in the list |
| Custodian | First custodian in the list |
| Settlement account | Leave blank unless you know a valid fund cash account |
| Value / validity date | Today + 2 days (e.g. if today is 23 Jul → `2026-07-25`) |
| Notes | `Demo buy CBZ for trading flow` |

4. Under **Portfolio**, check **Available cash** (shown after you pick the fund).
   - If it is `0` or much lower than qty × price, lower the quantity (e.g. `10`) or pick another fund / ask BE to top up cash.
   - Leave **Settlement account** empty (Optional) unless you know the fund settlement account.
5. Run review / place order
6. Close the modal

**You should see:** New row on Orderbook. Status **Draft** (or Submitted). Nothing on Trade Blotter yet.

---

## Step 2 — Submit

1. Click that order row (detail panel opens)
2. Click **Submit**

**You should see:** Status **Submitted**

---

## Step 3 — Approve

1. Same detail panel
2. Click **Approve**

**You should see:** Status **Approved**

---

## Step 4 — Send to broker

1. Click **Send to broker** — uses the broker and custodian already on the order (no extra modal).

**You should see:** Status **Sent to Broker**. Still nothing on Trade Blotter.

---

## Step 5 — Record confirmation

*(Pretend the broker called / emailed back with a fill.)*

1. Same order → click **Record confirmation**
2. Fill:

| Field | What to enter / select |
|--------|-------------------------|
| Outcome | **Filled** |
| Broker reference | `BRK-8821` |
| Confirmed quantity | `1000` |
| Confirmed price | `10.00` |
| Trade date | Today (e.g. `2026-07-23`) |
| Value date | `2026-07-25` |
| Notes | `Filled at limit` |

3. Click **Save confirmation**

**You should see:** Confirmation recorded. Buttons **Accept confirmation** and **Reject / keep looking**. Still no blotter trade.

---

## Step 6 — Accept confirmation

1. Click **Accept confirmation**
2. If toast says **Open blotter**, click it (or go to **Orders → Trade Blotter**)

**You should see:** Order **Executed**. New trade on **Trade Blotter**.

---

## Step 7 — Confirm trade (Blotter)

1. On **Trade Blotter**, click your trade
2. Under **1. Confirm trade** → click **Confirm trade**

**You should see:** Confirmation = **Confirmed**

---

## Step 8 — Settle with custodian

1. Under **2. Custodian settlement** → click **Settle with custodian**
2. Fill:

| Field | What to enter |
|--------|----------------|
| Settled at | Now (leave default datetime) |
| Custodian / CSD reference | `CSD-99102` |

3. Click **Confirm settlement**

**You should see:** Settlement = **Settled**

---

## Step 9 — Post books

1. Under **3. Accounting posting** → click **Post books**

**You should see:** Accounting = **Posted**

---

## Step 10 — Trade recon (optional)

1. On the same trade detail → **Open trade recon**  
   (or **Reconciliation → Trade**)
2. Do this in order:
   1. **Create batch** — pick your fund, as-of = today, leave default templates → **Create batch**
   2. **Ingest broker** — click **Demo happy** → **Ingest broker**
   3. **Ingest custodian** — click **Demo happy** → **Ingest custodian**
   4. **Run match**
   5. If no exceptions, go to **Complete batch** → **Complete batch**

*(To show a break instead: use **Demo qty mismatch** on broker — expect a qty mismatch exception.)*

---

## Done

Happy path in one line:

**Orderbook:** New order → Submit → Approve → Send → Record confirmation → Accept → **Blotter:** Confirm → Settle (`CSD-99102`) → Post → (optional) Trade recon
