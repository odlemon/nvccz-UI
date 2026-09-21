# Procurement — every screen, what's on it, and who sees it

Captured from the running module on dev, page by page, as two different people: a **Procurement
Manager** (17 pages) and an **Accountant** (13 pages). Figures shown are the live dev values at the
time of capture — they illustrate what the cards actually compute.

---

## What each role sees in the sidebar

| Group | Page | Procurement Manager | Accountant |
|---|---|:--:|:--:|
| Overview | Command Centre | ✅ | ✅ |
| Overview | Annual Procurement Plan | ✅ | — |
| Overview | Approval Centre | ✅ | ✅ |
| Source | Purchase Requisitions | ✅ | ✅ |
| Source | Tenders & RFx | ✅ | — |
| Source | Quotation Comparison | ✅ | — |
| Source | Bid Evaluation | ✅ | — |
| Source | Vendor Registry | ✅ | ✅ |
| Source | Contracts & Awards | ✅ | ✅ |
| Fulfil & Account | Purchase Orders | ✅ | ✅ |
| Fulfil & Account | Receiving & Inspection | ✅ | ✅ |
| Fulfil & Account | Invoices & 3-Way Match | ✅ | ✅ |
| Fulfil & Account | **AI Invoice Capture** | — | ✅ |
| Fulfil & Account | Accounts & Asset Transfers | ✅ | ✅ |
| Documents & Control | Document Vault | ✅ | ✅ |
| Documents & Control | Reports Vault | ✅ | ✅ |
| Documents & Control | Audit & Compliance | ✅ | — |
| Documents & Control | Configuration & RBAC | ✅ | ✅ |

The Accountant has no Plan, Tenders, Quotation Comparison, Bid Evaluation or Audit — they aren't part
of the job. The Procurement Manager has no AI Invoice Capture: reading an invoice belongs to Accounts
Payable, and the Manager holds only view rights on intake.

Numbers in the sidebar are live counts of work waiting — Purchase Requisitions **7**, Tenders **3**,
Purchase Orders **9** for the Manager. No badge means nothing is waiting.

---

## Overview

### Command Centre
*Procurement operations — enterprise-wide activity, plan execution, sourcing, fulfilment and accounting hand-offs*

**Buttons:** New record · Activity

**Cards across the top:** Approved plan `$600,000` · Committed spend `$21,587` · Open tenders `3` ·
Pending approvals `0` · Vendors `6` · AP exposure `$5,140`

**On the page:**
- **Plan, commitment and actual spend** — click any month for entity, category and transaction detail
- **Procurement cycle status** — where everything currently sits in the pipeline
- **Spend by category** — share of managed spend
- **My approval queue** — *your* decisions, not the latest activity
- **Control and system activity** — exceptions, documents and accounting hand-offs

The Accountant sees the same page with their own figures: Approved plan reads `—` because plans
aren't theirs to see, while Committed spend and AP exposure are populated.

### Annual Procurement Plan
*Strategy and budget*

**Buttons:** Create plan · Add plan item · Submit plan & budget · Import prior year · Actuals vs Plan

**Cards:** Consolidated budget `$780,000` · Submitted plans `6 of 6` · Budget coverage `32.3%` ·
Strategic tenders `—` · Plan amendments `2` · Unfunded exposure `$0`

**Registers:**
- **Procurement plans** — Plan · Entity · Budget · Committed · Execution · Version · Status
- **Plan requirement register** — Item · Requirement · Entity · Category · Quarter · Method · Budget · Status

### Approval Centre
*Decision workflow*

**Buttons:** Approval matrix · New eSignature

**Cards:** Awaiting me `0` · Due today `0` · CEO prompts `0` · CFO prompts `0` · eSign pending `0` ·
SoD checks `Enforced`

**Queue columns:** Approval · Type · Record · Entity · Value · Role · Due · Priority · Status · Actions

Everything awaiting *your* decision, whatever kind of record it is — requisitions, awards, receipts,
invoices, plans.

---

## Source

### Purchase Requisitions

This page changes title depending on who opens it:

- **Procurement Manager** — *"Purchase Requisition Approval Queue"* (Assigned decisions). Button:
  Open Approval Centre. Cards: Awaiting my decision `0` · Approved for sourcing `4` · Returned drafts
  `0` · Median approval time `1 min` · Department isolation `Enforced`.
- **Accountant** — *"My Purchase Requisitions"* (Demand intake). Buttons: New requisition · Import CSV
  lines. Cards: My open requests `0` · Returned drafts `0`.

**Columns:** PR number · Requirement · Source · Entity · Category · Estimate · Budget check · Status · Action

"Department isolation: Enforced" is the guarantee that you only ever see your own department's requests.

### Tenders & RFx
*Competitive sourcing*

**Buttons:** Create tender · Invite vendors

**Cards:** Active tenders `3` · Vendor invitations `—` · Secure submissions `24` · Closing this week
`0` · Clarifications `—` · Value in market `$0`

**Tender register:** Tender · Description · Entity · Method · Estimate · Bids · Closing · Stage

### Quotation Comparison
*Commercial analysis*

**Buttons:** Create RFQ · Import quotations

**Cards:** Events with quotations `9` · Supplier responses `24` · Potential savings `$2,495` ·
Recommendations due `0`

**Register:** Tender / RFQ · Entity · Category · Method · Estimate · Responses · Stage · Closing · Owner · Readiness

### Bid Evaluation
*Governed decisioning*

**Buttons:** Configure criteria · Export evaluation register

**Cards:** Awaiting evaluation `0` · Recommendations pending `0` · Evaluated value `$0`

**Tenders ready for evaluation:** Tender · Description · Entity · Bids · Closing · Stage

Only tenders that actually have bids and no award yet appear here — awarded tenders are not offered
for evaluation.

### Vendor Registry
*Supplier master and communications*

**Buttons:** Register vendor · Request compliance · Vendor portal · Run reminders

**Cards:** Registered vendors `6` · Current tax clearance `3` · Expiring / expired `3` · Missing
documents `0` · Inbound messages `0` · Pending compliance requests `0`

**On the page:** Automated compliance reminders · Compliance status · Vendor communication inbox

**Register:** Vendor ID · Vendor · Category · BP number · Currency · Tax clearance · Document gaps ·
Rating · Status · Actions

The compliance filter genuinely filters: choosing Valid, Expiring, Expired or Review narrows the list
and tells you how many match; choosing it again restores all.

### Contracts & Awards
*Awards and obligations*

**Buttons:** Create contract · Signature queue

**Cards:** Active contracts `1` · Awaiting signature `1` · Contract value — active contracts plus awards still awaiting a contract. (At capture it read `$3,409,800`
and later `$22,684` against one $1,362.90 active contract: it summed terminated contracts, and a terminated
contract's award again. Corrected in cycle seven, nvccz-new `9ac9e73`.)

**Register:** Contract · Description · Vendor · Entity · Value · Tax clearance · Tax clause · Expiry ·
Status · Actions

---

## Fulfil & Account

### Purchase Orders
*Committed procurement — orders generated from approved awards or requisitions, with vendor tax
clearance and withholding rules evaluated before approval*

**Buttons:** Create PO · Send selected · Signature queue

**Cards:** Open POs `10` · Value outstanding `$6,468` · Tax alerts `18` · Asset purchases `0` ·
Awaiting acknowledgement `9` · eSign coverage `—`

**Register:** PO · Vendor · Entity · Amount · Classification · Tax clearance · Tax rule · Delivery ·
Status · Actions

### Receiving & Inspection
*Record GRNs against POs, inspect quantity and quality, transfer qualifying assets*

**Buttons:** Record GRN · Scan delivery note

**Cards:** Receipts today `5` · Pending inspection `0` · Discrepancies `2` · Third-party GRNs `0` ·
On-time receipt `100%`

**Goods received notes:** GRN · PO · Item / service · Entity · Value · Classification · Status · Action

### Invoices & 3-Way Match
*Invoice automation*

**Buttons:** Upload invoice · Capture invoice · Record payment · **AI invoice capture**

**Cards:** Invoices captured `9` · Matched `7` · Exceptions `2` · WHT required `—` · VAT input
`$1,527` · Invoice exposure `$5,140`

You pick the tender or sourcing event first; the workspace then shows that chain only — its orders,
receipts, invoices and match exceptions.

### AI Invoice Capture — *Accountant only*
*Accounts payable — reads the supplier's invoice PDF and hands the fields to the capture form*

**Button in the header:** Capture by hand

**Card 1 — "Upload the invoice" (one PDF at a time)**
- Supplier invoice (PDF) — file picker
- Purchase order — dropdown of every order open for invoicing (`19` on dev at capture time)
- Note: *the PDF has to carry selectable text; a photograph or flat scan cannot be read. Naming the
  purchase order identifies the vendor, keeps the reading on record, and teaches the model that
  vendor's layout.*
- **Read the invoice**

**Card 2 — "What was read" (check each field against the PDF before saving)**

Before anything is uploaded it says plainly: *"Nothing read yet."*

After reading, a banner gives the overall confidence, then each field with its own confidence and a
Ready / Review pill:

| Field | Example | Confidence |
|---|---|---|
| Invoice number | INV-SW-4471 | 99% |
| Invoice date | 2026-09-08 | 99% |
| Currency | USD | 99% |
| Tax treatment | VAT 15% | 99% |

Then the lines, to the cent:

| Description | Quantity | Unit price | Line total |
|---|---|---|---|
| A4 Bond Paper (ream) | 40 | $6.50 | $260.00 |
| Ballpoint Pens (box of 50) | 12 | $14.25 | $171.00 |
| Lever Arch Files | 25 | $3.80 | $95.00 |

Footer: *"Lines total $526.00 before tax. Filed as VIN-2026-0001 in the intake register."*

**Capture this invoice** then opens the normal capture form, pre-filled, with a note saying exactly
what was filled in and what wasn't.

### Accounts & Asset Transfers
*Accounting hand-off*

**Buttons:** Export bank file · Sync accounting API

**Cards:** Journal queue `3` · AP liability `$5,140` · WHT payable `—` · VAT input `$1,527` ·
Accounting API `Ledger`

Paying an invoice creates its expense journal as **pending**. Posting it is an accounting decision
taken here — the payment message says so rather than claiming the books are already updated.

---

## Documents & Control

### Document Vault
*Version-controlled records and templates*

**Buttons:** Upload document · Create template · Receive / Upload

**Cards:** Vault health · Recent controlled documents

**Columns:** UID · Document · Type · Version · Owner · Updated · Status

Document names and UIDs open the actual preview; the three-dot menu holds the actions.

### Reports Vault
*Management information*

**Buttons:** Build report · Schedule reports · New template

**Cards:** Report templates `6` · Published reports `—` · Scheduled deliveries `—` · Board packs `—` ·
Downloads this month `—` · Data freshness `—`

**Library:** Report · Name · Period · Entity · Status · Actions

### Audit & Compliance
*Assurance*

**Buttons:** Export audit trail · Run access review

**Event stream:** Event · Activity · Record · Actor · Timestamp · Classification

### Configuration & RBAC
*Roles and permissions are managed centrally in Admin, so one change applies across every module*

**Button:** Open Admin

**Cards:** Your role · Procurement permissions — `26` for the Procurement Manager, `11` for the
Accountant

**Table:** Permission · Status — every procurement permission, and whether you hold it.

---

## Why so many cards read "—"

A dash is deliberate. It means *this is not measured yet*, and hovering or reading the sub-line tells
you why — "Report downloads are not logged", "Journal accuracy is not measured in procurement".

The alternative would be a plausible-looking zero or a sample figure, which is worse: you cannot tell
a real zero from a missing one. Every number that *is* shown was computed from live records.
