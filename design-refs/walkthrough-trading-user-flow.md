# Trading — Client Demo Walkthrough

**Audience:** Client presentation / UAT  
**Module:** Investments V2 → Orders & Investment Accounting  
**Login:** Use your demo tenant credentials  

This guide walks through the **listed equity trading journey** in presentation order. Each section explains **why you are on the screen**, **what you should see**, **what you can do**, and **what success looks like**.

> Labels are human-readable: order references, tickers, portfolio names, broker and custodian names — not internal database IDs. Where a deep link is available, the app opens the correct trade or accounting record in a new tab with the detail panel already focused.

---

## Journey overview

```text
1. Orderbook              — intent → approval → broker → execution
2. Trade Blotter          — confirm → settle → post (with deep links)
3. Compliance             — pre-trade checks and documented overrides
4. Investment Accounting  — accounting events and journals from posted trades
```

**End-to-end lifecycle (what you are demonstrating):**

```text
Draft → Submitted → Approved → Sent to Broker
  → Partially Executed / Executed → Pending Settlement → Settled → Posted
Alternate outcomes: Rejected · Cancelled · Failed · Archived
```

**Navigation:** Sidebar → **Investments V2** → **Orders** (Orderbook, Trade Blotter, Compliance) and **Investment Accounting**.

---

## 1. Orderbook

**Route:** `/investments-v2/orders/orderbook`

### Why this screen

The Orderbook is the **command centre for order intent**. Every buy or sell starts here: traders and portfolio managers capture the ticket, route it through approval, send it to the broker, and record fills. It is the single place to see where each order sits in the lifecycle and to act on the next permitted step.

### What you should see

| Area | Expect |
| --- | --- |
| **Page header** | Title *Orderbook* with a short lifecycle summary (Draft through Settled, plus alternate outcomes) |
| **Action bar** | **New order** and **New Blotter** (pill buttons, top right) |
| **Open Blotters** | Cards showing blotter name, order count, owner, portfolio, last updated — working sets that group related orders |
| **All orders** | Search box (*Search order or ticker*), sort dropdown (*Newest first*, *Oldest first*, *Largest value*, *Status*), record count |
| **Lifecycle tabs** | Pill tabs: *Orderbook* (all), *Draft*, *Submitted*, *Approved*, *Sent to Broker*, *Partially Executed*, *Executed*, *Pending Settlement*, *Settled*, *Cancelled*, *Failed*, *Rejected*, *Archived* |
| **Orders table** | Columns: Ref, Portfolio, Instrument (ticker + name), Side, Qty, Filled, Px (exec / limit), Gross, Broker, Trader, Dates (trade + value date), Status, Approval, Routing, **Blotter** (Open link when a trade exists) |
| **Pagination** | Page controls at the bottom (*Showing X of Y orders*) |

**When you click a row**, a **Order detail** panel slides in on the right showing portfolio, instrument, side, quantity, broker, trader, approval, routing, trade date, value date, status, trade id, and version.

Below the summary fields:

- **Lifecycle actions** — context-sensitive buttons for the current status
- **Status timeline** — current status plus historical transitions (old → new, reason, timestamp)

### Actions available

| Action | When it appears | What it does |
| --- | --- | --- |
| **New order** | Always | Opens the **Place Equity Order** modal (see *Placing a new order* below) |
| **New Blotter** | Always | Creates a named working set to group orders |
| **Submit** | Order is *Draft* | Moves order to *Submitted* for approval |
| **Approve** | Order is *Submitted* | Moves order to *Approved* |
| **Reject** | *Submitted* or *Approved* | Requires a reason; order moves to *Rejected* |
| **Send to broker** | Order is *Approved* | Routes order to broker; status becomes *Sent to Broker* |
| **Execute (create trade)** / **Record fill** | *Approved*, *Sent to Broker*, or *Partially Executed* | Opens execution dialog — enter fill quantity and price; creates a blotter trade |
| **Fail** | *Sent to Broker*, *Partially Executed*, *Executed*, or *Pending Settlement* | Requires a reason; marks order *Failed* |
| **Archive** | Terminal statuses (*Settled*, *Rejected*, *Cancelled*, *Failed*) | Optional reason; moves order to *Archived* |
| **Cancel** | Most non-terminal statuses | Requires a reason |
| **Open** (table column) | Order has a linked trade | Opens Trade Blotter in a new tab, focused on that trade |
| **Open on Trade Blotter** (detail panel) | Same as above | Same deep link from the detail panel |

**Important talking point:** *Send to broker* tells the broker the order is live — it does **not** create a trade on the blotter. **Execute** is what creates the trade record and begins settlement.

### Placing a new order (from Orderbook)

Click **New order** → **Place Equity Order** modal.

| Area | Expect |
| --- | --- |
| **Instrument panel** | Selected ticker, latest price, side toggle (**BUY** / **SELL**) |
| **Ticket fields** | Portfolio / fund, instrument, order type (Limit, Market, Stop, Stop Limit), quantity, limit/stop prices, time in force, validity / value date, broker, custodian, settlement account, approval route |
| **Footer** | *Save as Draft* checkbox, *Review Order*, then *Place Buy Order* / *Place Sell Order* (or *Save Draft*) |

**Required step before placing:** click **Review Order**. The pre-trade preview shows gross, fees, taxes, settlement amount, holding / cash / exposure impact, and a **compliance outcome** (Passed, Warning, Failed, Requires Override, etc.). You cannot place until review completes (unless *Remember review for this session* is checked).

### Demo flow — happy path through Orderbook

Use lifecycle tabs to walk orders forward. Sample references may appear in your demo environment (e.g. draft EcoCash order, submitted CBZ order, approved Delta order):

| Step | Tab | Action | Success criteria |
| --- | --- | --- | --- |
| 1 | **Draft** | Select a draft order → **Submit** | Toast *Order submitted for approval*; order appears under **Submitted** |
| 2 | **Submitted** | Select order → **Approve** | Toast *Order approved*; order under **Approved** |
| 3 | **Approved** | Select order → **Send to broker** | Toast *Order sent to broker*; order under **Sent to Broker** |
| 4 | **Sent to Broker** | Select order → **Execute (create trade)** | Dialog: enter fill qty (partial e.g. 400 of 1,000, or full remaining) and execution price → **Confirm execution**. Wait for completion (may take up to ~40 seconds). Toast shows trade created with **Open blotter** action |
| 5 | — | Click **Open** in Blotter column or toast **Open blotter** | New tab opens Trade Blotter with trade selected (see Section 2) |

**Partial fill:** If you execute less than full quantity, status becomes **Partially Executed**; remaining quantity stays open for another fill via **Record fill**.

**Alternate branch — Fail then Archive:**

1. On a *Sent to Broker* or *Partially Executed* order → **Fail** → enter reason (e.g. *Broker reject — market closed / no liquidity*).
2. Order moves to **Failed** tab.
3. Select it → **Archive** → optional reason → confirm.
4. Order appears under **Archived**.

### Success vs empty

- **Good:** Multiple orders across lifecycle tabs with realistic tickers, portfolios, and status pills (green = executed/settled/approved; amber = in-flight; red = cancelled/failed/rejected).
- **Empty:** No rows under a tab means no orders at that stage — switch tabs or place a new order.
- **Blotter column shows —:** No trade yet; execute the order first, then refresh or re-select the row to see **Open**.

---

## 2. Trade Blotter

**Route:** `/investments-v2/orders/blotter`

Deep link from Orderbook: `/investments-v2/orders/blotter?tradeId=…&orderId=…&orderRef=…&select=1`

### Why this screen

Once an order is **executed**, the economic event lives on the **Trade Blotter**. Operations teams confirm broker details, mark custodian settlement, and post to the general ledger — in a strict sequence. This screen is where post-trade processing happens.

### What you should see

| Area | Expect |
| --- | --- |
| **KPI strip** | Gross traded, Executed count, Pending count, Unmatched count |
| **Trades table** | Search (*Search trade or ticker*), status filter (*All*, *Executed*, *Partially Executed*, *Pending Settlement*, *Settled*, *Pending*) |
| **Table columns** | Trade / order ref, Portfolio, Instrument, Side, Quantity, Exec price, Gross, Fees, Taxes, Net, Broker, Custodian, Trade date, Value date, Status, Settlement, Accounting, Confirmation |
| **Deep-link banner** | Blue info bar when arriving from Orderbook: *Focused trade … · order …* |
| **Trade detail panel** | Opens when a row is selected (or via deep link): ticker, side, qty, gross / fees+tax / net summary |

### Settlement & confirmation (detail panel)

Three numbered steps — **must be done in order:**

| Step | Section | Pill states | Button |
| --- | --- | --- | --- |
| **1. Broker confirmation** | Match price, quantity, broker reference | *Awaiting* → *Confirmed* | **Confirm trade** |
| **2. Custodian settlement** | Custodian name and value date | *Pending Settlement* → *Settled* | **Mark settled** (disabled until step 1 complete) |
| **3. Accounting posting** | Post books after settlement | *Unposted* → *Posted* | **Mark posted** (disabled until step 2 complete) |

Hint text appears if you try to skip ahead (*Confirm the trade first*, *Mark settled first*).

After **Posted**, an **Open accounting event** button appears — this is the handoff to Section 4.

### Actions available

| Action | Where | Result |
| --- | --- | --- |
| **Confirm trade** | Detail panel step 1 | Confirmation pill → *Confirmed* |
| **Mark settled** | Detail panel step 2 | Settlement pill → *Settled* |
| **Mark posted** | Detail panel step 3 | Accounting pill → *Posted*; **Open accounting event** enabled |
| **Open accounting event** | Detail panel (after Posted) | New tab → Investment Accounting, focused on the linked event/journal |
| **New order** | Page header | Opens order entry modal (order lands in Orderbook until executed) |
| Row click | Trades table | Opens / updates detail panel |

### Deep links

| From | To | URL pattern |
| --- | --- | --- |
| Orderbook **Open** / **Open on Trade Blotter** | Blotter with trade selected | `/investments-v2/orders/blotter?tradeId=…&select=1` |
| Execute toast **Open blotter** | Same | Same |
| After **Mark posted** → **Open accounting event** | Accounting (Section 4) | `/investments-v2/accounting?tab=events&tradeRef=…&tradeId=…&fundId=…&select=1` |

When a deep link succeeds, the matching trade row is highlighted and scrolled into view; the detail panel opens automatically.

### Demo flow — Confirm → Settle → Post

| Step | Action | Success criteria |
| --- | --- | --- |
| 1 | Arrive via Orderbook **Open** (or select a *Pending Settlement* / *Executed* trade) | Detail panel open; step 1 shows *Awaiting* confirmation |
| 2 | **Confirm trade** | Confirmation pill → *Confirmed*; **Mark settled** becomes active |
| 3 | **Mark settled** | Settlement pill → *Settled*; **Mark posted** becomes active |
| 4 | **Mark posted** | Accounting pill → *Posted*; **Open accounting event** button visible |
| 5 | **Open accounting event** | New tab opens Investment Accounting (Section 4) |

### Success vs empty

- **Good:** Trades with populated gross/fees/net, colour-coded side (green BUY, red SELL), settlement and accounting pills progressing through the sequence.
- **Empty:** *No trades found* — execute an order from Orderbook first.
- **Deep link fails:** Banner explains trade could not be found; execute the order or pick the trade manually from the list.

---

## 3. Compliance

**Route:** `/investments-v2/orders/compliance`

### Why this screen

Before orders reach the blotter, **mandate rules** run automatically at order entry. Compliance officers use this page to see which checks passed or failed, submit **documented overrides** for eligible breaches, and maintain an **audit trail** of who approved exceptions. It complements the inline pre-trade review in the Place Order modal.

> This page has **no inner tabs** — scroll through the stacked sections below.

### What you should see

| Area | Expect |
| --- | --- |
| **Page description** | Explains pre-trade mandate checks, overrides, and audit |
| **KPI strip** | Active rules, Inactive rules, Override history count, Rule types |
| **Mandate rule library** | Table: Code, Category, Rule, Scope, Threshold, Status, Action. Active rules show a disabled *Use results below ↓* button (overrides start from results, not the library) |
| **Pre-trade results** | Table: Order ref, **Outcome** (Passed / Warning / Failed / Requires Override — colour pills), Action, Ticker, Side, Rule, Portfolio, Limit, Current, After trade, Checked. Filter chips: **All** and **Override-eligible (N)** |
| **Override audit history** | Cards: order ref, status pill (PENDING / Approved / Rejected), reason text, approver, timestamp |

### Actions available

| Action | Where | Result |
| --- | --- | --- |
| Search rules | Mandate rule library | Filters rule table |
| **All** / **Override-eligible** | Pre-trade results header | Filters to Failed / Warning / Requires Override rows |
| **Override** | Eligible result row | Opens **Compliance override** modal with order ref, rule, outcome, reason field |
| **Submit override** | Override modal | Override recorded; appears in audit history as **PENDING** |
| **Approve override** / **Reject** | PENDING card in audit history | Finalises override; status pill updates |

### Demo flow — pre-trade check and override

| Step | Action | Success criteria |
| --- | --- | --- |
| 1 | Open Compliance from sidebar | KPIs and rule library load; pre-trade results show recent order checks |
| 2 | Click **Override-eligible** filter | Table narrows to Failed / Warning / Requires Override rows (highlighted) |
| 3 | On an eligible row → **Override** | Modal opens pre-filled with order ref and rule |
| 4 | Enter reason (e.g. *Client override demo — documented exception*) → **Submit override** | Toast *Override recorded (PENDING)*; card appears in audit history |
| 5 | On the PENDING card → **Approve override** | Toast *Override approved*; status pill updates |

**Talking point:** The same compliance outcome appears during **Review Order** in the Place Order modal — the platform enforces *no blind place*; fees, cash, exposure, and mandate checks run before submission.

### Connecting Compliance to Orderbook

1. Place or submit an order that touches a mandate limit (visible in Review Order preview).
2. Show the matching row in **Pre-trade results** with the same outcome label.
3. If override is required and approved, return to Orderbook to continue approval and execution.

### Success vs empty

- **Good:** Mix of Passed and Failed/Warning outcomes with readable rule names and limit/current/after-trade columns.
- **Empty pre-trade results:** No orders have been reviewed yet — place an order and run **Review Order** first.
- **No override-eligible rows:** Switch to **All** or place an order that breaches a mandate threshold.

---

## 4. Investment Accounting (from posted trades)

**Route:** `/investments-v2/accounting`

Deep link from Blotter: `/investments-v2/accounting?tab=events&tradeRef=…&tradeId=…&fundId=…&select=1`

### Why this screen

When a trade is **posted** on the blotter, the platform generates **accounting events** and **journal entries** — the bridge between trading operations and the general ledger. This screen lets finance teams inspect what was booked, verify double-entry balance, and trace any trade back to its journal.

### What you should see

| Area | Expect |
| --- | --- |
| **Page header** | *Investment accounting* — *Control accounting events, balanced journals, postings and ledger delivery* |
| **Summary KPIs** | Events, Ready to post, Failed, Posted |
| **Main tabs** | *Accounting Events*, *Journals*, *Posting Statuses*, *Reversals*, *Ledger Exports* |
| **Deep-link banner** | Blue info when arriving from Blotter: focused event or opened journal for the trade |

**Accounting Events tab (primary for this demo):**

| Control | Purpose |
| --- | --- |
| Search | Filter by event id, trade ref, source |
| Portfolio filter | Narrow to the fund linked to the trade |
| Status filter | All statuses or specific posting state |

| Column | Expect |
| --- | --- |
| Event ID | Event type · date |
| Event type | e.g. Trade Settlement, Dividend, Fee |
| Portfolio | Fund name |
| Reference | Trade reference from blotter |
| Event date | Posted or created date |
| Amount | Currency-formatted amount |
| Journal | *Linked journal* when present |
| Status | Posted / Ready / Failed pill |
| Reverse | Action to reverse (disabled if already reversed) |

**Journals tab (opened automatically when deep link finds a linked journal):**

- Left: journal list (reference, description, currency, total, status)
- Right: selected journal detail — account lines with debits and credits, **Balanced** badge when totals tie out

### Actions available

| Action | Where | Result |
| --- | --- | --- |
| **Open accounting event** | Blotter detail (after Posted) | Deep link opens this page |
| Click event row | Accounting Events table | Selects event; loads linked journal if present |
| Click journal row | Journals tab | Shows debit/credit lines in detail panel |
| **Reverse** | Event row | Opens reason dialog to reverse a posted event |
| Tab switch | Header tabs | Posting Statuses, Reversals, Ledger Exports for extended finance workflows |

### Demo flow — trace a posted trade to the books

| Step | Action | Success criteria |
| --- | --- | --- |
| 1 | Complete Blotter **Confirm → Settle → Post** (Section 2) | Accounting pill on blotter = *Posted* |
| 2 | Click **Open accounting event** | New tab; banner confirms focused event or journal for the trade ref |
| 3 | On **Accounting Events** tab | Matching row highlighted; reference column shows trade id; status *Posted* |
| 4 | Click the event (or follow auto-switch to **Journals**) | Journal detail shows balanced debit/credit lines for the settlement |
| 5 | (Optional) Point out event type *Trade Settlement* and portfolio filter scoped to the fund | Client sees end-to-end traceability: order → trade → books |

### Success vs empty

- **Good:** Posted event with trade reference, linked journal, balanced lines, green status pills.
- **Event not found yet:** Banner may say event is still posting — wait a moment after **Mark posted**, then refresh or search by trade ref.
- **Empty register:** No trades have been posted in this environment — complete the blotter posting sequence first.

---

## Status timeline (any order)

On any Orderbook detail panel, scroll to **Status timeline**.

| Expect | Detail |
| --- | --- |
| Current status | Blue dot with status pill and created date |
| Historical transitions | Each entry: old status → new status, transition type, reason (if any), timestamp |

**Talking point:** Every lifecycle action (Submit, Approve, Send, Execute, Fail, Archive) is auditable — who changed what, when, and why.

---

## Demo checklist

Use this as a quick tick list during the client session:

- [ ] **Orderbook** — walk Draft → Submit → Approve → Send to broker
- [ ] **Orderbook** — Execute (partial or full fill); open blotter via deep link
- [ ] **Blotter** — Confirm trade → Mark settled → Mark posted
- [ ] **Blotter** — Open accounting event deep link
- [ ] **Compliance** — show pre-trade results; submit and approve an override
- [ ] **Accounting** — verify posted event and balanced journal for the trade
- [ ] *(Optional)* **New order** — Review Order preview with compliance line before place
- [ ] *(Optional)* **Fail + Archive** — alternate lifecycle outcome on Orderbook

---

## Key talking points

| Moment | What to say |
| --- | --- |
| Review before Place | "No blind orders — every ticket runs fees, cash, exposure, and compliance before submission." |
| Send vs Execute | "Send tells the broker the order is live; Execute creates the trade on the blotter." |
| Partial fill | "We filled 400 of 1,000 — the order stays Partially Executed until the rest fills or is cancelled." |
| Confirm → Settle → Post | "Operations confirms with the broker, settles with the custodian, then posts to the ledger — in that order." |
| Deep links | "From any order with a trade, one click opens the blotter; from a posted trade, one click opens the accounting entry." |
| Compliance override | "Breaches can be documented and approved — full audit trail, not a silent bypass." |
| Fail vs Archive | "Failed is a business outcome; Archive is housekeeping on terminal orders." |

---

## Related

- Alignment: [`trading-srd-story-alignment.md`](./trading-srd-story-alignment.md)
- Sister flow: [`walkthrough-recon-user-flow.md`](./walkthrough-recon-user-flow.md)
