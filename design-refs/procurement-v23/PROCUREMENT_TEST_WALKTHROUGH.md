# Procurement — manual test guide (dev)

**Staff app:** https://dev.matanho.com/login · **Procurement:** https://dev.matanho.com/procurement
**Vendor portal (no login):** https://dev.vendor.matanho.com/vendor-portal/register
**Accounting (Payables):** https://dev.matanho.com/accounting/payables

> The module moved from `/procurement-v23` to `/procurement`. Old `/procurement-v23/…` links still work — they
> redirect. `/procurement-legacy` is the old, frozen module: **do not test there**.

**Password:** every test account below uses the shared **dev test password** (ask the team if you do not have it).
Dev test accounts only — never use them on production.

Part A walks the whole purchase, from plan to audit. Part B covers what is new in this round. Each step says **who to
log in as**, **which page**, **what to click**, and **what you should see**.

> **Tip:** use one browser profile (or an incognito window) per user you switch between, so you are not logging in
> and out all the time. To switch in the same window: profile menu (top right) → log out.

> **Dev only — emails are not sent.** A mail guard blocks every email on dev (RFQ invitations, PO emails, vendor
> registration approved/declined). The action itself still happens; only the email is held back.

> **Dev already has realistic data.** Nine vendors, the FY 2026 plan (approved) and FY 2027 plan, and purchases at
> every stage. Some decisions are already waiting — **leave these as they are** unless you mean to change the demo
> (if you do change them, say so before the next automated test round, and they can be restored):
> - Finance Manager: the Jacaranda stationery invoice (`INV_20260908_0002`) and the **FY 2027 plan**.
> - Procurement Manager: the network upgrade award (`RFQ_20260906_0005`) and the boardroom furniture receipt
>   (`GRN_20260912_0003`).
> - Department Head: the **training-room projector** and first-aid requisitions.
>
> **Start every title you type with `UAT`** (as in the examples below), and give test vendors an email ending
> `@vendors.example.test`. The dev cleanup after each automated test round removes those records and everything
> raised from them; anything else you create stays on dev.

---

## Test accounts

| User | Name shown on dev | Email | What they do in this guide |
|---|---|---|---|
| Procurement Manager | Tafadzwa Moyo | `proc.mgr@nts.local` | Plans, awards bids, inspects goods, contracts, **approves or declines vendor self-registrations** |
| Procurement Officer | Rumbidzai Chikwanha | `proc.officer@nts.local` | RFQs, scoring, purchase orders, goods received, documents, **edits vendor details** |
| Buyer | Tinotenda Marufu | `proc.buyer@nts.local` | Negative checks (cannot create purchase orders or edit vendors) |
| Requester (Operations member) | Kudakwashe Ncube | `proc.requester@nts.local` | Raises the requisition |
| Department Head (Operations) | Farai Mutasa | `perf.deptmgr@nts.local` | Approves / returns the requisition |
| Accountant | Chipo Mlambo | `proc.ap@nts.local` | AI invoice capture, payment (in Procurement or in Accounting), posting the journal |
| Finance Manager | Blessing Sibanda | `payroll.finmgr@nts.local` | Approves the plan and the invoice |
| Chief Financial Officer | — | `proc.cfo@nts.local` | Approval matrix and invoice auto-approval settings (Part B) |
| Internal Auditor | Rutendo Dube | `payroll.intaudit@nts.local` | Reviews the audit trail (read-only) |

Not usable on dev: `perf.sysadmin@nts.local` and `payroll.cfo@nts.local` (their passwords were changed on dev).

**What each role sees in the sidebar** (a quick sanity check when you log in):

| Page | Proc. Manager | Accountant | Requester |
|---|:--:|:--:|:--:|
| Command Centre | ✅ | ✅ | — |
| Annual Procurement Plan | ✅ | — | — |
| Approval Centre | ✅ | ✅ | ✅ |
| Purchase Requisitions | ✅ | ✅ | ✅ |
| Tenders & RFx · Quotation Comparison · Bid Evaluation | ✅ | — | — |
| Vendor Registry · Contracts & Awards | ✅ | ✅ | — |
| Purchase Orders · Receiving & Inspection · Invoices & 3-Way Match | ✅ | ✅ | — |
| AI Invoice Capture | — | ✅ | — |
| Accounts & Asset Transfers · Document Vault · Reports Vault | ✅ | ✅ | — |
| Audit & Compliance | ✅ | — | — |
| Configuration & RBAC | ✅ | ✅ | ✅ |

**Test invoice PDF (for step 14):** `scripts/_uat/fixtures/test-invoice.pdf` — supplier invoice `INV-SW-4471`, dated
2026-09-08, three lines:

| Line | Qty | Unit price | Total |
|---|---|---|---|
| A4 Bond Paper (ream) | 40 | 6.50 | 260.00 |
| Ballpoint Pens (box of 50) | 12 | 14.25 | 171.00 |
| Lever Arch Files | 25 | 3.80 | 95.00 |

Record numbers (`REQ_…`, `RFQ_…`, `PO_…`, `GRN_…`, `INV_…`, `APP-…`, `CTR-…`) are assigned by the system — write yours
down as you go; later steps refer back to them. Dates read like `13 Sep 2026`.

---

# Part A — the whole purchase, end to end

## 1. Create the annual plan

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. Go to **Annual Procurement Plan** (`/procurement/plan`).
2. Click **Create plan**.
3. Fill in:

| Field | Example |
|---|---|
| Plan name | `UAT Operations FY2026 plan` |
| Department | `Operations` |
| Financial year | current year |
| Budget ceiling | `150000` |
| Currency | `USD` |
| Plan line — description | `Office stationery` |
| Plan line — value | `42000` |

4. Click **Create plan**.

**Expect:** toast "`APP-… created as a draft with 1 line. Submit it for budget approval when it is complete.`" The plan
appears as **Draft**.

5. Open the plan (**Open**) → click **Submit plan & budget**.

**Expect:** "`APP-… submitted for budget approval.`" Status **Submitted**.

6. Go to **Approval Centre** (`/procurement/approvals`).

**Expect (negative check):** there is **no Approve** for your own plan — an author cannot approve their own plan.

---

## 2. Approve the plan

**Log in as:** Finance Manager — `payroll.finmgr@nts.local`

1. Go to **Approval Centre** (`/procurement/approvals`).
2. Find the card for **your** plan (`APP-…`, not the FY 2027 demo plan) → click **Approve**.

**Expect:** "`APP-… approved as the plan baseline.`" Plan status **Approved**.

*(Optional reject path: **Review** → **Reject / return** → Decision, Reason category, Detailed reason → **Confirm
decision**. The Manager can then **Add plan item** and submit again.)*

---

## 3. Raise a requisition (save draft, then submit)

**Log in as:** Requester — `proc.requester@nts.local`

1. Go to **Purchase Requisitions** (`/procurement/requisitions`).
   *(Check: your sidebar shows only Approval Centre, Purchase Requisitions and Configuration & RBAC.)*
2. Click **New requisition**.
3. Fill in:

| Field | Example |
|---|---|
| Category | `Office Supplies` (required — it decides which vendors can be invited) |
| Requirement title | `UAT Stationery restock — Operations office` |
| Project / cost centre | pick one if any are listed (searchable); otherwise the form says none is registered yet |
| Line items | `A4 Bond Paper (ream)` × `40` · `Ballpoint Pens (box of 50)` × `12` · `Lever Arch Files` × `25` |
| Internal motivation | `Quarterly stationery restock for the Operations office.` |

   Fill the first line, then click **Add line** for each further line (**Remove last line** takes one off).
   **As you type an item name**, items bought before are suggested with their **last price and vendor**; choosing one
   fills in the estimate and says where the figure came from. The estimated total updates as you type.

4. Click **Save draft**.

**Expect:** the requisition is saved as **Draft**. *(The register has no "Budget check" column — requisitions are not
budget-checked.)*

5. On the requisition's row, open the row menu (**⋯**) → **Edit request** → change anything (e.g. the title) → click
   **Submit for approval**.

**Expect:** "`REQ_… submitted to the Operations department head for approval.`" Status **Pending Head of Operations**
(the status names who it waits on).

*(Negative check: **New requisition** with no title → **Submit for approval** is refused and nothing is saved.)*

---

## 4. Department head returns it with a reason

**Log in as:** Department Head — `perf.deptmgr@nts.local`

1. Go to **Purchase Requisitions** (`/procurement/requisitions`) — you see the approval queue for your own department only.
2. On **your** requisition (`REQ_…`, not the projector or first-aid demo requisitions) → **Review** → **Reject or return**.
3. Fill in **Decision**, **Reason category**, **Detailed reason** (e.g. `Please confirm the quantity of pens`).
4. Click **Confirm decision**.

**Expect:** "`REQ_… returned to the requester with your reason.`"

---

## 5. Requester corrects and resubmits

**Log in as:** Requester — `proc.requester@nts.local`

1. **Purchase Requisitions** → your requisition's row menu (**⋯**) → **Edit request**.
2. Change something (the system refuses a resubmission with nothing changed) → **Submit for approval**.

**Expect:** "`REQ_… corrected and resubmitted to the Operations department head.`" Status pending again.

---

## 6. Department head approves

**Log in as:** Department Head — `perf.deptmgr@nts.local`

1. **Purchase Requisitions** → your requisition → **Review** → **Approve requisition**.
   *(Or: **Approval Centre** → the requisition card → **Approve**.)*

**Expect:** "`REQ_… approved.`" Status **Approved**. *(If an approval matrix with a second level applies to its amount,
the message says it now waits for the next step instead — see Part B, B5.)*

---

## 7. Send an RFQ to vendors

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Tenders & RFx** (`/procurement/tenders`).
2. Click **Create tender**.
3. Fill in:

| Field | Example |
|---|---|
| Source record | your approved requisition (`REQ_…`) — the Category fills in from it |
| RFx type | `Request for Quotation (RFQ)` (an **Open tender** is a public listing whose prices stay sealed until closing) |
| Tender / RFx title | `UAT Stationery restock RFQ` |
| Dates | closing date in the future (e.g. one week) |
| Vendor invitation | **Send to selected vendors only**, then tick `Jacaranda Office Supplies (Pvt) Ltd` and `Granite Ridge Stationers (Pvt) Ltd` |

4. Click **Create and send invitations**.

**Expect:** "`RFQ_… sent to 2 vendors, with the lines of REQ_….`" Write down the RFQ number.

> **Vendor links:** on dev the invitation emails are blocked. Ask for the **vendor quotation links** for your `RFQ_…`
> and the vendors you ticked — they are generated for you.

---

## 8. Vendors submit quotations (vendor portal — no login)

**Log in as:** nobody — open each vendor link in a **new incognito window**.

1. Open the vendor link. You land on **Submit Quotation**, showing your RFQ number.
2. Fill in:

| Field | Vendor 1 | Vendor 2 |
|---|---|---|
| Company Name | the vendor's name | the vendor's name |
| Contact Person Name | `Tanaka Gumbo` | `Loice Mavhunga` |
| Email Address | any | any |
| Phone Number | `+263 242 000 000` | `+263 242 000 001` |
| Item Name / Quantity / Unit Price | the three lines — `6.50`, `14.25`, `3.80` | same lines — `7.00`, `15.00`, `4.10` |
| Quote Valid Until | a date next month | a date next month |
| Delivery Time | `10 business days` | `14 business days` |

3. Click **Submit Quotation**.

**Expect:** a confirmation page. Back in the app (Procurement Officer): **Quotation Comparison** (`/procurement/quotations`)
shows both quotations for your RFQ.

---

## 9. Score the bids

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Bid Evaluation** (`/procurement/evaluation`).
2. On your RFQ → **Open bid evaluation**.
3. Enter a technical score for each bid (e.g. `80` and `70`).
4. Click **Save scores**.

**Expect:** "`Technical scores saved for 2 bids.`"

---

## 10. Award the winner

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. **Bid Evaluation** → your RFQ → **Open bid evaluation**.
2. In the award panel, choose the winner (the **System recommendation** option is the best-scoring bid).
3. Click **Record winning bidder** → **Confirm and route**.

**Expect:** "`RFQ_… awarded to <vendor>; PO_… raised.`" A purchase order now exists for the winning vendor.

---

## 11. Send the purchase order

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Purchase Orders** (`/procurement/purchase-orders`) and find `PO_…`.
   *(Try the filters above the register: vendor, order date range and status each narrow the list; **Clear** restores it.)*
2. If its status is **Draft**: row menu (**⋯**) → **Send**.

**Expect:** status **Sent** (if it already shows **Sent**, nothing to do).

> **Without an RFQ (direct order):** **Create PO** → Approved requisition, Vendor, Expected delivery, Payment terms,
> Delivery address, Order lines → **Save draft** (then **⋯ → Send**) or **Save and send to vendor**.

**Negative check — log in as Buyer `proc.buyer@nts.local`:** Purchase Orders → **Create PO** → refused: "`Your role
does not have permission for raising purchase orders.`" No form opens.

---

## 12. Record the goods received note

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Receiving & Inspection** (`/procurement/goods-received`).
2. Click **Record GRN**.
3. Fill in: **Purchase order** = your `PO_…` · **Received on** = today · **Lines** = received / accepted / rejected per
   line (accepted + rejected must equal received).
4. Click **Create GRN**.

**Expect:** "`GRN_… recorded against PO_… and sent for inspection approval.`" Status **Received**.

---

## 13. Inspect and accept the goods

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. **Approval Centre** → **your** goods receipt card (`GRN_…`, not the boardroom demo receipt) → **Approve**.

**Expect:** "`GRN_… accepted on inspection.`" Status **Approved**.

*(Reject path: **Review** → **Reject / return** → reason → **Confirm decision** → status **Rejected**.)*

---

## 14. Capture the supplier invoice with AI

**Log in as:** Accountant — `proc.ap@nts.local`

1. Go to **AI Invoice Capture** (`/procurement/intake`) — open it from the sidebar.
2. **Supplier invoice (PDF)** → choose `test-invoice.pdf` (a scanned PDF or a phone photo of an invoice works too).
3. **Purchase order** → your `PO_…`.
4. Click **Read the invoice**.

**Expect:** the invoice is shown **beside** the fields read from it: `INV-SW-4471`, 2026-09-08, USD, VAT 15%, the three
lines with amounts to the cent and a confidence figure. Values read are **highlighted on the document**; hovering a field
lights its box, and the viewer zooms. The reading says whether it was filed; when the PDF's supplier (Stationery World)
is not your order's vendor, it says the document disagrees — carry on either way.

5. Click **Capture this invoice**.

**Expect:** the **Capture supplier invoice** form opens on your purchase order, **Prefilled from the read invoice**:
invoice date 2026-09-08 and the unit prices 6.50 / 14.25 / 3.80 (if your PO has those three lines).

6. Check the figures against the PDF → click **Capture invoice**.

**Expect:** "`INV_… captured against PO_… and sent to Finance for approval.`" Invoice status **Draft**.

*(By hand instead: **Invoices & 3-Way Match** (`/procurement/invoices`) → **Capture invoice** → Purchase order,
Invoice date, Due date, lines → **Capture invoice**.)*

---

## 15. Approve the invoice

**Log in as:** Finance Manager — `payroll.finmgr@nts.local`

1. **Approval Centre** → **your** invoice card (`INV_…`, not the Jacaranda demo invoice) → **Approve**.

**Expect:** "`INV_… approved for payment.`" Status **Approved**.

*(Reject path: **Review** → **Reject / return** → reason → **Confirm decision**.)*

---

## 16. Pay the invoice — in Procurement, or from Accounting

Do **one** of these (an invoice can only be paid once).

### 16a. In Procurement

**Log in as:** Accountant — `proc.ap@nts.local`

1. Go to **Invoices & 3-Way Match** (`/procurement/invoices`).
2. Click **Record payment**.
3. Fill in: **Invoice** = your `INV_…` · **Amount** (prefilled) · **Payment date** · **Method** · **Paid from** ·
   **Payment reference** (e.g. `EFT-0001`) · **Proof of payment** (attach any PDF — required).
4. Click **Record payment**.

**Expect:** "`INV_… paid to <vendor>. Its expense journal was created and awaits posting in Accounts.`"

*(Negative check: the same form **without** proof of payment is refused — nothing is paid.)*

### 16b. From Accounting › Payables

**Log in as:** Accountant — `proc.ap@nts.local`

1. Go to **Accounting › Payables** (`/accounting/payables`). The landing counts your invoice under **Approved,
   awaiting payment**, and **Approved to pay** is not $0.
2. **Bills** tab → your `INV_…` reads **Procurement · Approved** → click the row: the bill shows the invoice's own lines
   against the order and who approved it.
3. **Payment queue** tab (or the bill) → **Pay bill** → choose the **bank account**, enter a **reference**
   (e.g. `EFT-0002`), attach **proof of payment** → **Pay $…**.

**Expect, straight away:** a message "`INV_… paid $… to <vendor>. The journal and cashbook entry are posted, and
procurement shows the invoice paid.`" and the Pay dialog closes. The bill register reads **Paid**; in Procurement the
invoice shows **Paid** with its payment journal.

*(Negative check: **Pay** without proof of payment is refused.)*

---

## 17. Post the expense journal

**Log in as:** Accountant — `proc.ap@nts.local`

1. Go to **Accounts & Asset Transfers** (`/procurement/accounts`) → **Journal queue** tab.
2. Find `EXP-…-INV_…` (status **Pending**) → row menu (**⋯**) → **Post**.

**Expect:** "`EXP-… posted to the ledger.`" The journal leaves the pending queue (status **Posted**).
*(If you paid from Accounting in 16b, the journal is already posted — nothing to do here.)*

---

## 18. Create and activate the contract

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. Go to **Contracts & Awards** (`/procurement/contracts`).
2. Click **Create contract**.
3. Fill in: **Award** = your awarded RFQ (the **Contract value** fills in from the award) · **Contract title** (e.g.
   `UAT Stationery supply agreement`) · **Start date** · **End date** · **Payment terms** · **Scope and deliverables**.
4. Click **Save draft**.
5. On the new contract's row → row menu (**⋯**) → **Edit** → **Activate**.

**Expect:** "`CTR-… is now active.`" Status **Active**. *(**Terminate** is available on the same screen.)*

---

## 19. File a document, then a new version

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Document Vault** (`/procurement/documents`).
2. Click **Upload document** → **Files** (any PDF) · **Folder** `Tenders & Bids` · **Document type** · **Document title**
   (e.g. `UAT Stationery RFQ pack`) → **Upload & create record**.

**Expect:** "`1 document filed in Tenders & Bids for review.`" Version **v1.0**.

3. On the document's row → row menu (**⋯**) → **Upload version** → **Replacement or supporting file** · **New version**
   · **Change summary** → **Upload version**.

**Expect:** "`<title> is now v2.0, awaiting review.`"

---

## 20. Review the audit trail

**Log in as:** Internal Auditor — `payroll.intaudit@nts.local`

1. Go to **Audit & Compliance** (`/procurement/audit`).

**Expect** rows (newest first) such as:
- **Create / Submit / Approve requisition** — `REQ_…`, by the requester / department head
- **Submit quotation** — `QUO_…`, actor "`<vendor> (vendor portal)`"
- **Approve plan** — `APP-…`, by the Finance Manager
- **Create contract** / **Approve contract** (activation) — `CTR-…`
- **Create document** / **Update document** (new version)
- **Payment invoice** — `INV_…`

**Negative checks (still as the Internal Auditor):** **Annual Procurement Plan → Create plan**, **Tenders & RFx → Create
tender**, **Purchase Orders → Create PO**, **Document Vault → Upload document** are all refused ("Your role does not
have permission for …").

---

# Part B — new in this round

## B1. A vendor registers itself on the vendor portal (no invitation)

There are two ways onto the vendor register: **staff add the vendor** (B2), or **the vendor registers itself** here.

**Log in as:** nobody — open a **new incognito window**.

1. Go to https://dev.vendor.matanho.com/vendor-portal/register — it opens without any invitation link.
2. **Company details:** Company name `UAT Self-registered Supplies` · Name · Email `uat-selfreg-1@vendors.example.test`
   · Contact person · Phone number · Industry → **Next**.
3. **Bank details:** Bank name · Account name · Account number · Branch code · Currency `USD` (SWIFT optional) →
   **Submit Registration**.

**Expect:** the registration is accepted and the page asks for **KYC documents** (certificate of incorporation, CR14,
bank letter; tax clearance optional). You can upload them here or stop — the registration is already waiting for review.

---

## B2. Staff review it in the Vendor Registry

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. Go to **Vendor Registry** (`/procurement/vendors`).

**Expect:**
- A card **Self-registrations awaiting review** lists `UAT Self-registered Supplies` with its contact, category, tax
  clearance, number of bank accounts and documents, and when it registered.
- In the register below, that vendor reads **Awaiting review**.
- As the Officer you see **Open profile** only — no **Approve** or **Decline**, and a note that a role that approves
  vendors decides these.

2. Click **Vendor portal** (page header).

**Expect:** the vendor portal's registration page opens **in a new tab** — this is the link you give vendors.

*(Staff can still add a vendor themselves: **Register vendor** → fill in the company, contact and tax details → save.)*

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

3. **Vendor Registry** → in **Self-registrations awaiting review**, on your vendor → **Approve**.

**Expect:** "`UAT Self-registered Supplies is approved: an active vendor that can be invited to RFQs, and emailed to say
so.`" It leaves the card; in the register it is an ordinary vendor.

4. Register a **second** vendor in the portal (B1 again, e.g. `UAT Self-registered Declined`,
   `uat-selfreg-2@vendors.example.test`). Back in the Vendor Registry → on it → **Decline**.
5. Try **Decline registration** with the reason empty → the form will not submit. Enter a reason (e.g. `The bank letter
   does not match the account name`) → **Decline registration**.

**Expect:** "`UAT Self-registered Declined: registration declined, and the vendor emailed the reason.`" It leaves the card
and does not appear among active vendors. *(A vendor awaiting review is never offered for RFQ invitations.)*

---

## B3. Edit a vendor's details

**Log in as:** Procurement Officer — `proc.officer@nts.local`

1. **Vendor Registry** → open any vendor you created (row → profile).

**Expect:** the **Company profile** card shows BP number, VAT number, primary contact, email, **phone, payment terms and
address**. Below it: purchase orders, invoices received (with flagged count), **on-time delivery** and **item prices over
time** (to the cent), all from the real records.

2. Click **Edit profile**.

**Expect:** the form offers only what the vendor record keeps — legal name, contact person, email, phone, payment terms,
address, tax clearance (ITF263) expiry. *(Bank details are changed by Finance; blacklisting and registration approval are
separate actions.)*

3. Change the **phone**, **payment terms** (e.g. `45 days from invoice`) and **address** → **Save changes**.

**Expect:** "`<vendor> updated.`" The profile shows the new values after it reloads.

**Negative check — log in as Finance Manager `payroll.finmgr@nts.local`:** open a vendor → **Edit profile** → refused:
"`Your role does not have permission for changing vendor details.`"

---

## B4. The compliance chips filter what they count

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. **Vendor Registry** → the compliance chips (**Current**, **Expiring**, **Expired / missing**, **Under review**).
2. Click **Expired / missing**.

**Expect:** the message says "`N of M vendors have expired or missing tax clearance`" and the register shows exactly those
N vendors — the same share the chip shows. Click it again to show all.

---

## B5. Approval route by amount (approval matrix)

**Log in as:** Chief Financial Officer — `proc.cfo@nts.local`

1. **Configuration & RBAC** → **Approval matrix** (or Approval Centre → **Approval matrix**).
2. Look at (or set) a two-level route: e.g. step 1 department head, step 2 Finance Manager above an amount.

**Expect:** a requisition above the amount, once approved by the department head, reads **Pending Finance Manager** and
the message names who it now waits on; the requester sees the route on the requisition. **Do not leave a changed matrix in
place** — put it back as you found it.

---

## B6. Invoice processing: review and flag

**Log in as:** Accountant — `proc.ap@nts.local`

1. After reading an invoice (step 14), use **Flag for review** with a reason instead of approving.

**Expect:** the invoice records the reason, who flagged it and when; the Finance Manager gets an alert with the reason;
the **Invoices to review** card (Invoices & 3-Way Match, and the Command Centre) lists it with why. *(A requester cannot
flag an invoice; a flag needs a reason.)*

**Invoice auto-approval (CFO, optional):** Configuration & RBAC → **Invoices that match exactly** — when switched on, an
invoice that matches its order exactly (and whose document agrees) is **Approved automatically**, shown with that label in
its match workspace. **Switch it back off** when you are done.

---

## B7. Command Centre and Analytics

**Log in as:** Procurement Manager — `proc.mgr@nts.local`

1. **Command Centre** (`/procurement`): **Awaiting my approval**, **Spend by department** (change the range — the chart
   redraws; hover a bar for the exact amount), **Invoices to review** (with reasons), **Recent POs**.
2. **Analytics** (`/procurement/analytics`): cash requirements by due date, spend, unusual spending, reliable vendors,
   price trends.

**Expect:** every figure comes from the records. KPI cards show "Loading live figures…" for a moment while the page loads,
then the real value.

---

## What you should no longer see

These had nothing behind them and were **taken out** (not just disabled). If you find one, it is a bug — note the page:

- eSignature (New eSignature, Signature queue, "Awaiting signature") · approval delegation
- Sending documents by email · vendor messaging, inbox and document requests · **Send compliance reminder** · reminder
  automation (Run reminders, schedule card)
- CSV line import · internal notes · evaluation criteria settings · report builder and report schedules
- Quotation import · record attachments and generic record edit · document and template editors
- Vendor invites outside the tender builder · vendor bid-form preview · record history drawers
- The **Budget check** column on requisitions · withholding tax (WHT) cards · board packs, committees, declarations
- KPI cards that could only read zero (inbound messages, pending compliance requests, missing documents, asset purchases)
- A filter bar on a page with no register to filter

**Also check:** no page shows a demo name (e.g. "Tariro Moyo", "TechNova") or a sample record number (`PO-2026-…`,
`INV-98431`), and no control answers "not connected".

---

## Quick checklist

| Step | User | Page | Done when |
|---|---|---|---|
| 1 | Procurement Manager | Annual Procurement Plan | Plan **Submitted**; no self-approve |
| 2 | Finance Manager | Approval Centre | Plan **Approved** |
| 3 | Requester | Purchase Requisitions | Draft saved (suggestions, project) → pending |
| 4 | Department Head | Purchase Requisitions | **Returned** with a reason |
| 5 | Requester | Purchase Requisitions | Corrected → pending |
| 6 | Department Head | Purchase Requisitions | **Approved** |
| 7 | Procurement Officer | Tenders & RFx | RFQ **sent** to vendors |
| 8 | Vendors (no login) | Vendor portal link | Quotations **submitted** |
| 9 | Procurement Officer | Bid Evaluation | Scores **saved** |
| 10 | Procurement Manager | Bid Evaluation | Winner **awarded**, PO raised |
| 11 | Procurement Officer | Purchase Orders | PO **Sent** · filters work · Buyer refused Create PO |
| 12 | Procurement Officer | Receiving & Inspection | GRN **Received** |
| 13 | Procurement Manager | Approval Centre | GRN **Approved** |
| 14 | Accountant | AI Invoice Capture | Invoice **Draft**, values match the PDF, highlights on the document |
| 15 | Finance Manager | Approval Centre | Invoice **Approved** |
| 16 | Accountant | Invoices (16a) or Accounting › Payables (16b) | Invoice **Paid**; 16b confirms straight away |
| 17 | Accountant | Accounts & Asset Transfers | Journal **Posted** |
| 18 | Procurement Manager | Contracts & Awards | Contract **Active** |
| 19 | Procurement Officer | Document Vault | Document **v2.0** |
| 20 | Internal Auditor | Audit & Compliance | Steps above visible in the trail |
| B1 | Vendor (no login) | Vendor portal | Registered, asked for KYC documents |
| B2 | Officer, then Manager | Vendor Registry | Listed awaiting review · Vendor portal opens a new tab · approved · second declined with a reason |
| B3 | Procurement Officer | Vendor Registry → profile | Phone, terms, address saved · Finance Manager refused |
| B4 | Procurement Manager | Vendor Registry | Expired / missing shows the vendors it counts |
| B5 | CFO | Configuration & RBAC | Two-level route by amount (matrix put back) |
| B6 | Accountant | Invoices | Flag for review with a reason · Finance alerted |
| B7 | Procurement Manager | Command Centre, Analytics | Live figures, range change redraws |
