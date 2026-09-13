# Procurement — manual test guide with data (dev)

| | |
|---|---|
| Staff app | https://dev.matanho.com/login |
| Procurement | https://dev.matanho.com/procurement |
| Vendor portal (no login) | https://dev.vendor.matanho.com/vendor-portal/register |
| Accounting › Payables | https://dev.matanho.com/accounting/payables |

**Password:** every staff account below uses the shared dev test password.

**Emails are ON on dev.** Every email goes to its real recipient. The vendors in this guide use `+` addresses of the
tester's Gmail: replace `yourname` with your Gmail name, so every vendor email lands in your inbox (Gmail delivers
`yourname+anything@gmail.com` to `yourname@gmail.com`). See **Emails to check** at the end.

**Files you need** (already in the repo):

| File | Path |
|---|---|
| Supplier invoice PDF | `C:\Users\lysp\Downloads\nvccz-new\scripts\_uat\fixtures\test-invoice.pdf` |
| Second PDF (new document version) | `C:\Users\lysp\Downloads\nvccz-new\scripts\_uat\fixtures\invoices\msasa-boardroom.pdf` |
| KYC stand-in PDF (vendor portal) | `C:\Users\lysp\Downloads\nvccz-new\scripts\_uat\fixtures\invoices\kopje-multipage.pdf` |

The invoice PDF is `INV-SW-4471`, dated 2026-09-08, USD. It prints VAT at 15%; **dev applies VAT at 15.5%**, so the
purchase order, the captured invoice and the payment come to **607.53** (526.00 + 81.53):

| Line | Qty | Unit price | Line total |
|---|---|---|---|
| A4 Bond Paper (ream) | 40 | 6.50 | 260.00 |
| Ballpoint Pens (box of 50) | 12 | 14.25 | 171.00 |
| Lever Arch Files | 25 | 3.80 | 95.00 |
| **Subtotal** | | | **526.00** |
| **VAT 15% (as printed)** | | | **78.90** |
| **Total (as printed)** | | | **604.90** |
| **Total in the system (VAT 15.5%)** | | | **607.53** |

**Rules for dev data**
- Everything you create starts with `UAT`. The dev cleanup after an automated test round deletes `UAT` records, so tell
  me before you start and I will not run one while you test.
- Leave the demo records alone: the Jacaranda invoice `INV_20260908_0002`, the FY 2027 plan, the network upgrade award
  `RFQ_20260906_0005`, the boardroom receipt `GRN_20260912_0003`, and the projector and first-aid requisitions.
- Vendor names, BP numbers and VAT numbers must be unique. If one is refused as already existing (a second run), add
  ` 2` to the name and `2` to the end of the BP and VAT numbers.
- Record numbers (`APP-…`, `REQ_…`, `RFQ_…`, `PO_…`, `GRN_…`, `INV_…`, `CTR-…`) are given by the system. Write yours
  down; later steps use them.
- Tip: one browser profile or incognito window per person, so you are not logging in and out.

## Test accounts

| Who | Login email | Name on dev |
|---|---|---|
| Procurement Manager | `proc.mgr@nts.local` | Tafadzwa Moyo |
| Procurement Officer | `proc.officer@nts.local` | Rumbidzai Chikwanha |
| Buyer | `proc.buyer@nts.local` | Tinotenda Marufu |
| Requester (Operations) | `proc.requester@nts.local` | Kudakwashe Ncube |
| Department Head (Operations) | `perf.deptmgr@nts.local` | Farai Mutasa |
| Accountant | `proc.ap@nts.local` | Chipo Mlambo |
| Finance Manager | `payroll.finmgr@nts.local` | Blessing Sibanda |
| Chief Financial Officer | `proc.cfo@nts.local` | Tendai Chirwa |
| Internal Auditor | `payroll.intaudit@nts.local` | Rutendo Dube |

## The vendors used in this guide

| Code | Company | Added by | Email |
|---|---|---|---|
| V1 | `UAT Msika Stationers (Pvt) Ltd` | Staff (step 3) | `yourname+msika@gmail.com` |
| V2 | `UAT Kariba Office Supplies (Pvt) Ltd` | Staff (step 3) | `yourname+kariba@gmail.com` |
| V3 | `UAT Chimanimani Paper Co (Pvt) Ltd` | Itself, on the vendor portal (step 4) | `yourname+chimanimani@gmail.com` |
| V4 | `UAT Nyanga Print House (Pvt) Ltd` | Itself, then declined (step 5) | `yourname+nyanga@gmail.com` |

---

# Part A — the whole purchase, end to end

## 1. Create and submit the annual plan

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Annual Procurement Plan** (`/procurement/plan`) → **Create plan**

| Field | Enter |
|---|---|
| Plan name | `UAT Operations FY2026 plan` |
| Department | `Operations` |
| Financial year | `FY 2026` |
| Budget ceiling | `150000` |
| Currency | `USD` |
| Planning assumptions | `Stationery and office consumables for the Operations office, bought each quarter.` |
| Plan lines, row 1 — description | `Office stationery` |
| Plan lines, row 1 — category | `Office supplies` |
| Plan lines, row 1 — quarter | `Q4` |
| Plan lines, row 1 — method | `RFQ` |
| Plan lines, row 1 — value | `42000` |
| Plan lines, rows 2–4 | leave empty |

Click **Create plan**.
**Expect:** `APP-… created as a draft with 1 line. Submit it for budget approval when it is complete.` Status **Draft**.

On the plan's row click **Open** → **Submit**.
**Expect:** `APP-… submitted for budget approval.` Status **Submitted**.

**Negative check:** **Approval Centre** (`/procurement/approvals`) shows **no Approve** on your own plan.

## 2. Approve the plan

**Log in as:** Finance Manager `payroll.finmgr@nts.local` → **Approval Centre**

On the card for `UAT Operations FY2026 plan` (not the FY 2027 plan) click **Approve**.
**Expect:** `APP-… approved as the plan baseline.` Plan status **Approved**.

## 3. Staff register two vendors

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Vendor Registry** (`/procurement/vendors`) → **Register vendor**

| Field | V1 | V2 |
|---|---|---|
| Legal name | `UAT Msika Stationers (Pvt) Ltd` | `UAT Kariba Office Supplies (Pvt) Ltd` |
| Category | `Office Supplies` | `Office Supplies` |
| Contact person | `Tendai Moyo` | `Rudo Chari` |
| Email | `yourname+msika@gmail.com` | `yourname+kariba@gmail.com` |
| Phone | `+263 242 700 301` | `+263 242 700 302` |
| Payment terms | `30 days from invoice` | `30 days from invoice` |
| BP number | `BP-UAT-7301` | `BP-UAT-7302` |
| VAT number | `10097301` | `10097302` |
| Tax clearance (ITF263) expiry | `30/06/2027` | `30/06/2027` |
| Address | `14 Kwame Nkrumah Avenue, Harare` | `22 Samora Machel Avenue, Harare` |

Click **Register vendor** for each.
**Expect:** `UAT Msika Stationers (Pvt) Ltd registered with a valid tax clearance.` (and the same for V2). Both appear in
the register as active vendors.

**Check:** the form has no bank fields — bank details are Finance's.

## 4. A vendor registers itself on the vendor portal

**Log in as:** nobody — open a new incognito window.

1. Go to **Vendor Registry** as the Procurement Officer and click **Vendor portal** (page header).
   **Expect:** a **new tab** opens at `https://dev.vendor.matanho.com/vendor-portal/register`. Use that tab (no login).

2. **Step 1 — Company details:**

| Field | Enter |
|---|---|
| Company name | `UAT Chimanimani Paper Co (Pvt) Ltd` |
| Display Name | `UAT Chimanimani Paper Co (Pvt) Ltd` |
| Email | `yourname+chimanimani@gmail.com` |
| Contact person | `Farai Dube` |
| Phone number | `+263772440088` |
| Category | `Office Supplies` |

Click **Next**.

3. **Step 2 — Bank details:**

| Field | Enter |
|---|---|
| Bank name | `CBZ Bank` |
| Account name | `UAT Chimanimani Paper Co (Pvt) Ltd` |
| Account number | `44100073011` |
| Branch code | `4101` |
| Currency | `USD` |
| SWIFT / BIC code | leave **empty** first |

**Negative check:** click **Submit Registration** → refused: `SWIFT/BIC code is required so payments reach the account`.
Now enter SWIFT / BIC code `CBZKZWHA` → **Submit Registration**.

**Expect:** step 3, **Compliance & KYC Upload**.

4. **Step 3 — KYC documents:** for each of **Certificate of incorporation**, **CR14 - company extract** and **Bank
   confirmation / account letter**, click **Upload File**, choose `kopje-multipage.pdf`, then **Upload File** in the confirmation. Then click
   **Submit KYC Documents**.

## 5. Staff review self-registrations: approve one, decline one

**First register a second vendor on the portal** (repeat step 4 in a new incognito window):

| Field | Enter |
|---|---|
| Company name / Display Name | `UAT Nyanga Print House (Pvt) Ltd` |
| Email | `yourname+nyanga@gmail.com` |
| Contact person | `Tatenda Sibanda` |
| Phone number | `+263772440099` |
| Category | `Office Supplies` |
| Bank name / Account name | `CBZ Bank` / `UAT Nyanga Print House (Pvt) Ltd` |
| Account number / Branch code / Currency / SWIFT | `44100073012` / `4101` / `USD` / `CBZKZWHA` |

(KYC upload can be skipped for this one.)

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Vendor Registry**
**Expect:** a **Self-registrations awaiting review** card lists V3 and V4 with contact, category **Office Supplies**,
bank accounts and documents. The Officer sees **Open profile** only (no Approve / Decline).

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Vendor Registry**

1. On `UAT Chimanimani Paper Co (Pvt) Ltd` click **Approve**.
   **Expect:** `UAT Chimanimani Paper Co (Pvt) Ltd is approved: an active vendor that can be invited to RFQs, and emailed to say so.`
2. On `UAT Nyanga Print House (Pvt) Ltd` click **Decline** → leave the reason empty → **Decline registration** (the form
   will not submit) → Reason `The bank letter does not match the account name.` → **Decline registration**.
   **Expect:** `UAT Nyanga Print House (Pvt) Ltd: registration declined, and the vendor emailed the reason.`

📧 Check Gmail: an approval email to `+chimanimani`, a decline email with the reason to `+nyanga`.

## 6. Raise the requisition (save draft, then submit)

**Log in as:** Requester `proc.requester@nts.local` → **Purchase Requisitions** (`/procurement/requisitions`) → **New requisition**

| Field | Enter |
|---|---|
| Entity | `Matanho Investment Management (Private) Limited` (only option) |
| Department / cost centre | `Operations` (only option) |
| Category | `Office Supplies` |
| Requirement title | `UAT Stationery restock - Operations office` |
| Line 1 — item / unit / quantity / unit price | `A4 Bond Paper (ream)` / `Ream` / `40` / `6.50` |
| Line 2 (click **Add line**) | `Ballpoint Pens (box of 50)` / `Box` / `12` / `14.25` |
| Line 3 (click **Add line**) | `Lever Arch Files` / `Each` / `25` / `3.80` |
| Internal motivation | `Quarterly stationery restock for the Operations office. Stock of paper and files runs out by October.` |

**Expect:** the estimated total reads **526.00**.

Click **Save draft**. **Expect:** saved as **Draft**.

On the row open **⋯** → **Edit request** → click **Submit for approval**.
**Expect:** `REQ_… submitted for approval: Head of Operations (Nyasha K, Farai Mutasa).` Status **Pending Head of Operations**.

**Negative check:** **New requisition** with everything empty → **Submit for approval** is refused and nothing is saved.

## 7. The department head returns it

**Log in as:** Department Head `perf.deptmgr@nts.local` → **Purchase Requisitions**

On **your** `REQ_…` → **Review** → **Reject or return**:

| Field | Enter |
|---|---|
| Decision | `Return for correction` |
| Reason category | `Specification requires revision` |
| Detailed reason | `Please confirm the quantity of pens: 12 boxes is more than last quarter.` |

Click **Confirm decision**.
**Expect:** `REQ_… returned to the requester with your reason.` The requisition's reason reads
`Return for correction: Specification requires revision. Please confirm the quantity of pens: 12 boxes is more than last quarter.`

## 8. The requester corrects and resubmits

**Log in as:** Requester `proc.requester@nts.local` → **Purchase Requisitions** → your `REQ_…` → **⋯** → **Edit request**

| Field | Change to |
|---|---|
| Requirement title | `UAT Stationery restock - Operations office (pens confirmed)` |

Click **Submit for approval**.
**Expect:** `REQ_… corrected and resubmitted for approval: Head of Operations (Nyasha K, Farai Mutasa).`

## 9. The department head approves

**Log in as:** Department Head `perf.deptmgr@nts.local` → **Purchase Requisitions** → your `REQ_…` → **Review** → **Approve requisition**
**Expect:** `REQ_… approved.` Status **Approved**.

## 10. Send the RFQ to three vendors

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Tenders & RFx** (`/procurement/tenders`) → **Create tender**

| Field | Enter |
|---|---|
| Source record | your `REQ_… - UAT Stationery restock - Operations office (pens confirmed)` |
| RFx type | `Request for Quotation (RFQ)` |
| Tender / RFx title | `UAT Stationery restock RFQ` |
| Category | fills in as `Office Supplies` (leave it) |
| Currency | `USD · US Dollar` |
| Procurement objective | `Restock the Operations office with paper, pens and files for Q4.` |
| Closing date and time | `30/09/2026 12:00` |
| Lines | leave — they are copied from the requisition |
| Detailed scope | `Deliver to the Operations office, 5th floor, within 10 business days of the purchase order.` |
| Technical / Commercial / Delivery / Risk weight | leave `45` / `35` / `15` / `5` (total 100%) |
| Vendor invitation | **Send to selected vendors only** |
| Vendors to tick | `UAT Msika Stationers (Pvt) Ltd`, `UAT Kariba Office Supplies (Pvt) Ltd`, `UAT Chimanimani Paper Co (Pvt) Ltd` (untick Jacaranda and Granite Ridge) |

**Check:** the form has only these sections: 1. Source and title · 2. Closing date · 3. Lines and scope · 4. Evaluation
weights · 5. Vendors invited. `UAT Nyanga Print House` is **not** offered (declined).

Click **Create and send invitations**.
**Expect:** `RFQ_… sent to 3 vendors, with the lines of REQ_….`

📧 Check Gmail: three RFQ invitations (`+msika`, `+kariba`, `+chimanimani`), each with its own **quotation link**.

## 11. The vendors submit quotations (vendor portal, no login)

Open each vendor's email → click its quotation link (each in a new incognito window). Company name, email and the three
lines are already filled in.

| Field | V1 Msika | V2 Kariba | V3 Chimanimani |
|---|---|---|---|
| Tax EIN / Registration | `10097301` | `10097302` | `10097311` |
| Contact Person Name | `Tendai Moyo` | `Rudo Chari` | `Farai Dube` |
| Phone Number | `+263 242 700 301` | `+263 242 700 302` | `+263772440088` |
| Business Address | `14 Kwame Nkrumah Avenue, Harare` | `22 Samora Machel Avenue, Harare` | `5 Main Street, Mutare` |
| A4 Bond Paper — Brand / Unit Price | `Typek` / `6.50` | `Rotatrim` / `7.00` | `Mondi` / `6.90` |
| Ballpoint Pens — Brand / Unit Price | `BIC` / `14.25` | `Pilot` / `15.00` | `BIC` / `14.80` |
| Lever Arch Files — Brand / Unit Price | `Croxley` / `3.80` | `Marlin` / `4.10` | `Croxley` / `4.00` |
| Quote Valid Until | `31/10/2026` | `31/10/2026` | `31/10/2026` |
| Delivery Time | `10 business days` | `14 business days` | `7 business days` |

Click **Submit Quotation**.
**Expect:** a confirmation page. Subtotals: Msika **526.00**, Kariba **562.50**, Chimanimani **553.60**.
**Log in as** Procurement Officer → **Quotation Comparison** (`/procurement/quotations`) shows all three for your RFQ.

## 12. Score the bids

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Bid Evaluation** (`/procurement/evaluation`) → your RFQ → **Open bid evaluation**

| Vendor | Technical score |
|---|---|
| UAT Msika Stationers | `85` |
| UAT Kariba Office Supplies | `75` |
| UAT Chimanimani Paper Co | `70` |

Click **Save scores**. **Expect:** `Technical scores saved for 3 bids.`

## 13. Award the winner

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Bid Evaluation** → your RFQ → **Open bid evaluation**

In the award panel choose `UAT Msika Stationers (Pvt) Ltd` (marked **System recommendation**) → replace the text in
**Decision rationale** with `Lowest price and highest technical score; delivery within 10 business days.` →
**Record winning bidder** → **Confirm and route**.
**Expect:** `RFQ_… awarded to UAT Msika Stationers (Pvt) Ltd; PO_… raised.`

📧 Check Gmail: `+msika` gets the acceptance with the purchase order; `+kariba` and `+chimanimani` get "not successful".

## 14. Send the purchase order

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Purchase Orders** (`/procurement/purchase-orders`)

Find `PO_…` for `UAT Msika Stationers`. If it reads **Draft**: **⋯** → **Send**. If it already reads **Sent**, nothing to do.
**Expect:** status **Sent**, total **607.53** (526.00 + VAT at 15.5%, 81.53).

**Negative check — log in as Buyer `proc.buyer@nts.local`:** Purchase Orders → **Create PO** → refused:
`Your role does not have permission for raising purchase orders.`

## 15. Record the goods received note

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Receiving & Inspection** (`/procurement/goods-received`) → **Record GRN**

| Field | Enter |
|---|---|
| Purchase order | your `PO_… · UAT Msika Stationers (Pvt) Ltd` |
| Received on | today |
| A4 Bond Paper — Received / Accepted / Rejected | `40` / `40` / `0` |
| Ballpoint Pens — Received / Accepted / Rejected | `12` / `12` / `0` |
| Lever Arch Files — Received / Accepted / Rejected | `25` / `25` / `0` |

Click **Create GRN**.
**Expect:** `GRN_… recorded against PO_… and sent for inspection approval.`

**Negative check (before saving):** Accepted `40`, Rejected `5` on the paper line → refused: accepted plus rejected must
equal received. Put it back to `0`.

## 16. Inspect and accept the goods

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Approval Centre** → **your** `GRN_…` card (not `GRN_20260912_0003`) → **Approve**
**Expect:** `GRN_… accepted on inspection.`

## 17. Capture the supplier invoice with AI

**Log in as:** Accountant `proc.ap@nts.local` → **AI Invoice Capture** (`/procurement/intake`)

| Field | Enter |
|---|---|
| Purchase order | your `PO_… · UAT Msika Stationers (Pvt) Ltd` (choose it **first**) |
| Supplier invoice (PDF, scan or photo) | `test-invoice.pdf` |

Click **Read the invoice**.
**Expect:** the PDF on the left with the values it read highlighted; on the right the capture form and **What was read**:
`INV-SW-4471`, 2026-09-08, USD, lines 6.50 / 14.25 / 3.80, subtotal 526.00, VAT printed 78.90, total printed 604.90.
The PDF's supplier (Stationery World) is not your vendor, so it says the supplier's document disagrees — carry on.

In the capture form check / enter:

| Field | Enter |
|---|---|
| Invoice date | `08/09/2026` (filled in) |
| Due date | `08/10/2026` |
| Lines — quantity / unit price | `40` / `6.50` · `12` / `14.25` · `25` / `3.80` (filled in) |
| Why it needs review | leave empty |

Click **Save invoice**.
**Expect:** `INV_… captured against PO_… and sent to Finance for approval.` The invoice total is **607.53** (VAT at
dev's 15.5%). Because the PDF's supplier differs, it also appears under **Invoices to review** with that reason.

*(Alternative path instead of Save invoice: Why it needs review `The supplier on the PDF is Stationery World, not Msika Stationers.` → **Flag for review** →
`INV_… captured against PO_… and flagged for review: …`. It then shows under **Invoices to review** on Invoices & 3-Way Match and the Command Centre.)*

## 18. Approve the invoice

**Log in as:** Finance Manager `payroll.finmgr@nts.local` → **Approval Centre** → **your** `INV_…` card (not `INV_20260908_0002`) → **Approve**
**Expect:** `INV_… approved for payment.`

## 19. Pay the invoice — do 19a **or** 19b (an invoice is paid once)

### 19a. In Procurement

**Log in as:** Accountant `proc.ap@nts.local` → **Invoices & 3-Way Match** (`/procurement/invoices`) → **Record payment**

| Field | Enter |
|---|---|
| Invoice | your `INV_… · UAT Msika Stationers (Pvt) Ltd` |
| Amount | `607.53` (filled in, read-only) |
| Payment date | today |
| Method | `Bank transfer` |
| Paid from | `UAT Procurement Test Bank · UAT-PROC-0001` |
| Payment reference | `EFT-UAT-0001` |
| Proof of payment | `test-invoice.pdf` |
| Notes | `Paid in full.` |

**Negative check first:** clear **Proof of payment** → **Record payment** → refused; nothing is paid.
Attach the proof → **Record payment**.
**Expect:** `INV_… paid to UAT Msika Stationers (Pvt) Ltd. Its expense journal was created and awaits posting in Accounts.`

### 19b. From Accounting › Payables

**Log in as:** Accountant `proc.ap@nts.local` → **Accounting › Payables** → **Bills** → your `INV_…` (**Procurement · Approved**) → **Pay bill**

| Field | Enter |
|---|---|
| Pay from | `UAT Procurement Test Bank · UAT-PROC-0001 (USD)` |
| Payment date | today |
| Bank reference | `EFT-UAT-0002` |
| Amount | `607.53` (read-only) |
| Proof of payment | `test-invoice.pdf` |

Click **Pay $607.53**.
**Expect:** `INV_… paid $607.53 to UAT Msika Stationers (Pvt) Ltd. The journal and cashbook entry are posted, and procurement shows the invoice paid.`

📧 Check Gmail: `+msika` gets the payment confirmation.

## 20. Post the expense journal (only after 19a)

**Log in as:** Accountant `proc.ap@nts.local` → **Accounts & Asset Transfers** (`/procurement/accounts`) → **Journal queue**
On `EXP-…-INV_…` → **⋯** → **Post**.
**Expect:** `EXP-… posted to the ledger.` *(After 19b the journal is already posted.)*

## 21. Create and activate the contract

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Contracts & Awards** (`/procurement/contracts`) → **Create contract**

| Field | Enter |
|---|---|
| Award | your RFQ's award to `UAT Msika Stationers (Pvt) Ltd` |
| Vendor (standalone only) | leave |
| Contract title | `UAT Stationery supply agreement` |
| Contract value | filled in from the award (leave) |
| Currency | `USD` |
| Start date | `01/10/2026` |
| End date | `30/09/2027` |
| Payment terms | leave the filled-in text |
| Scope and deliverables | `Quarterly supply of A4 paper, ballpoint pens and lever arch files to the Operations office.` |

Click **Save draft**. Then on its row **⋯** → **Edit** → **Activate**.
**Expect:** `CTR-… is now active.`

## 22. File a document, then a new version

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Document Vault** (`/procurement/documents`) → **Upload document**

| Field | Enter |
|---|---|
| Files | `test-invoice.pdf` |
| Folder | `Tenders & Bids` |
| Document type | `Supporting document` |
| Document title | `UAT Stationery RFQ pack` |
| Description | `Quotations and bid evaluation for the stationery RFQ.` |

**Check:** no owner, version, access, retention or letterhead fields. Click **Upload & create record**.
**Expect:** `1 document filed in Tenders & Bids for review.` Version **v1.0**.

On its row **⋯** → **Upload version** → **Replacement or supporting file** `msasa-boardroom.pdf` → **Upload version**.
**Expect:** `UAT Stationery RFQ pack is now v2.0, awaiting review.`

## 23. Review the audit trail

**Log in as:** Internal Auditor `payroll.intaudit@nts.local` → **Audit & Compliance** (`/procurement/audit`)

**Expect** rows for your records: create / submit / approve plan (`APP-…`), register vendor and approve / decline
registration, create / submit / reject / approve requisition (`REQ_…`), submit quotation (`QUO_…`, actor
`<vendor> (vendor portal)`), award, GRN, invoice, payment (`INV_…`), contract (`CTR-…`), document and version.

**Negative checks (still as Internal Auditor):** **Create plan**, **Create tender**, **Create PO**, **Upload document**
are refused with `Your role does not have permission for …`.

---

# Part B — more checks

## B1. Edit a vendor's details

**Log in as:** Procurement Officer `proc.officer@nts.local` → **Vendor Registry** → click `UAT Kariba Office Supplies (Pvt) Ltd` → **Edit profile**

**Check:** the form has legal name, category, contact person, email, phone, payment terms, address and tax clearance
expiry — nothing else.

| Field | Change to |
|---|---|
| Phone | `+263 242 700 399` |
| Payment terms | `45 days from invoice` |
| Address | `30 Jason Moyo Avenue, Harare` |

Click **Save changes**. **Expect:** `UAT Kariba Office Supplies (Pvt) Ltd updated.` and the profile shows the new values.

**Negative check — log in as Finance Manager `payroll.finmgr@nts.local`:** open the same vendor → **Edit profile** →
refused: `Your role does not have permission for changing vendor details.`

## B2. Compliance chips

**Log in as:** Procurement Manager `proc.mgr@nts.local` → **Vendor Registry** → click **Expired / missing**.
**Expect:** `N of M vendors have expired or missing tax clearance` and the register shows exactly those N. Click again to
show all.

## B3. Two-level approval route by amount

**Log in as:** Chief Financial Officer `proc.cfo@nts.local` → **Configuration & RBAC** (`/procurement/settings`) →
**Requisition approval route** → **Edit route** → **Add step**:

| Step 2 field | Enter |
|---|---|
| Who decides | `Role` |
| Which | `Finance Manager (1 person)` |
| Only above ($) | `500` |

Click **Save route**.

**Log in as:** Requester `proc.requester@nts.local` → **New requisition**:

| Field | Enter |
|---|---|
| Category | `Office Supplies` |
| Requirement title | `UAT Toner for Operations printers` |
| Line 1 | `HP 26A toner cartridge` / `Each` / `6` / `95.00` (total **570.00**) |
| Internal motivation | `Six toner cartridges for the two Operations printers for Q4.` |

**Submit for approval**. **Log in as** Department Head → **Review** → **Approve requisition**.
**Expect:** it now reads **Pending Finance Manager**, and the message names who it waits on.
**Log in as** Finance Manager → **Approval Centre** → approve it. **Expect:** **Approved**.

**Put it back:** CFO → **Edit route** → **Remove** on step 2 → **Save route**. The route is one step again
(Head of Operations).

## B4. Invoice auto-approval (optional)

**Log in as:** CFO → **Configuration & RBAC** → tick **Approve an invoice automatically when it matches exactly** →
Only up to this total ($) `1000` → **Save**. **Expect:** `Now: On, for invoices up to $1,000.00.`
**Switch it back off** (untick → **Save**) before anything else.

## B5. Command Centre and Analytics

**Log in as:** Procurement Manager → **Command Centre** (`/procurement`): **Awaiting my approval**, **Spend by
department** (change the range; hover a bar), **Invoices to review**, **Recent POs**. **Analytics**
(`/procurement/analytics`): cash requirements, spend, unusual spending, reliable vendors, price trends.
**Expect:** figures from the records; KPI cards read "Loading live figures…" for a moment, then the value.

---

## Emails to check

| Step | Email | Sent to | Lands in your Gmail? |
|---|---|---|---|
| 5 | Vendor registration approved | `+chimanimani` | ✅ |
| 5 | Vendor registration declined, with the reason | `+nyanga` | ✅ |
| 10 | RFQ invitation with the quotation link | `+msika`, `+kariba`, `+chimanimani` | ✅ (3 emails) |
| 13 | Quotation accepted, with the purchase order | `+msika` | ✅ |
| 13 | Quotation not successful | `+kariba`, `+chimanimani` | ✅ |
| 14 | Purchase order (when sent from Draft) | `+msika` | ✅ |
| 19 | Invoice paid | `+msika` | ✅ |
| 6, 8 | Requisition waiting for your approval | Head of Operations: Farai Mutasa (`@nts.local`) and "Nyasha K" | ❌ (`@nts.local` has no mailbox; "Nyasha K" gets it in that account's own Gmail) |
| 7, 9 | Requisition returned / approved | Requester (`@nts.local`) | ❌ |
| 11 | Quotation received | Requester and procurement staff (`@nts.local`) | ❌ |
| 17 | Invoice captured for review / flagged | Procurement staff and invoice reviewers (`@nts.local`) | ❌ |

## What you should not see

These were taken out because nothing saved them. If you find one, note the page:

- Tender builder: entity, internal estimate, cost centre, owners, issue date, clarification deadline, briefing, bid
  validity, opening method, late bid rule, file uploads, pass mark, committee, award authority, eSignature, email
  subject, send timing, reminder schedule, invitation message, publication checklist, **Preview tender pack**
- Upload document: owner, initial version, read / write access, retention, letterhead
- Upload version: new version number, review status, change summary
- Return a requisition: the "Notify requester…" checkbox
- Register vendor: bank, branch and account fields
- eSignature, approval delegation, sending documents by email, vendor messaging and document requests, compliance
  reminders, CSV import, internal notes, report builder and schedules, the Budget check column, board packs
- Any demo name (e.g. "Tariro Moyo", "TechNova") or sample number (`PO-2026-…`, `INV-98431`), or a control that answers
  "not connected"

## Quick checklist

| Step | Who | Done when |
|---|---|---|
| 1 | Procurement Manager | Plan **Submitted**, no self-approve |
| 2 | Finance Manager | Plan **Approved** |
| 3 | Procurement Officer | V1, V2 registered with valid tax clearance |
| 4 | Vendor (portal) | V3 registered, SWIFT refused when empty, KYC uploaded |
| 5 | Officer, Manager | V3 approved, V4 declined with reason, 2 emails |
| 6 | Requester | Draft saved, total 526.00, submitted |
| 7 | Department Head | Returned with category and reason |
| 8 | Requester | Resubmitted |
| 9 | Department Head | **Approved** |
| 10 | Procurement Officer | RFQ sent to 3 vendors, 3 emails |
| 11 | Vendors (portal) | 3 quotations submitted |
| 12 | Procurement Officer | Scores 85 / 75 / 70 saved |
| 13 | Procurement Manager | Msika awarded, PO raised, 3 emails |
| 14 | Procurement Officer | PO **Sent**, 607.53 · Buyer refused |
| 15 | Procurement Officer | GRN recorded, bad split refused |
| 16 | Procurement Manager | GRN accepted |
| 17 | Accountant | Invoice captured, values match the PDF |
| 18 | Finance Manager | Invoice **Approved** |
| 19 | Accountant | Invoice **Paid** 607.53, proof required, email |
| 20 | Accountant | Journal **Posted** (19a only) |
| 21 | Procurement Manager | Contract **Active** |
| 22 | Procurement Officer | Document **v2.0** |
| 23 | Internal Auditor | Trail shows the steps; creates refused |
| B1 | Officer / Finance Manager | Vendor updated; Finance Manager refused |
| B2 | Procurement Manager | Expired / missing filters what it counts |
| B3 | CFO, Requester, Head, Finance Manager | 570.00 requisition needs Finance Manager; route put back |
| B4 | CFO | Auto-approval on then off |
| B5 | Procurement Manager | Live figures |
