# How Procurement works — a guide for the people who use it

**Module:** Procurement (V23) · **Audience:** anyone who raises, approves, sources, receives, or pays
for a purchase · **No technical knowledge assumed**

This describes what each person sees and does, in the order things actually happen. Nothing here is
about how it is built — only how it is used.

---

## The short version

Someone needs something → their manager approves it → Procurement finds a supplier → an order goes
out → the goods arrive and are checked → the supplier's invoice is captured and matched against the
order and the delivery → Finance approves it → Accounts pays it.

Nine steps, and a different person is responsible at almost every one. That separation is
deliberate: the person who orders is not the person who receives, and the person who approves an
invoice is not the person who pays it.

---

## Who does what

| Role | What they are responsible for |
|---|---|
| **Employee (requester)** | Raises a purchase requisition for something their team needs. Anyone can do this — it needs no special role. |
| **Department head** | Approves or returns their own department's requisitions. They only ever see their own department's requests. |
| **Procurement Officer** | Runs the sourcing: invites suppliers, collects quotations, scores bids, raises and sends purchase orders, records deliveries. |
| **Procurement Manager** | Owns sourcing end to end. Awards the winning bid, approves or rejects goods on inspection, manages vendors and contracts, drafts the annual plan. |
| **Buyer / Coordinator** | Narrower sourcing roles. They can run quotations and record receipts, but cannot award or approve. |
| **Accountant (Accounts Payable)** | Captures the supplier's invoice, and records payment once it is approved. |
| **Finance Manager** | Approves or rejects invoices for payment, and approves the annual procurement plan's budget. |
| **Chief Financial Officer** | Approves invoices and plans, and can award tenders. |
| **CEO** | Can award tenders and approve plans. |
| **Internal Auditor** | Reads everything and reviews the audit trail. Changes nothing. |
| **System Administrator** | Full access, and grants roles to people. |

**You only see what your role covers.** If a page isn't part of your job, it is not in your sidebar —
and if you open it by link, the module tells you your role doesn't include it and offers you the
pages that are yours. You will not be shown an empty screen that looks like "there is no data".

---

## The journey, step by step

### 1. Plan the year (optional, but it sets the budget)

**Who:** Procurement Manager drafts · Finance Manager or CFO approves

The Annual Procurement Plan lists what the organisation expects to buy this financial year and what
each line is budgeted at. The Manager drafts it and adds lines; Finance approves it.

Once approved it becomes the baseline that spending is measured against — the dashboard compares
this year's orders to this year's approved plan, and says plainly when no approved plan covers the
year.

> **A plan's author cannot approve their own plan.** The approve option is simply not offered to them.

### 2. Someone asks for something

**Who:** any employee

The requester fills in a short form: what they need, how many, what it's for, and a rough estimated
price if they know one. They can save it as a draft and finish it later.

When they submit it, it goes to **their own department head** — not to a general queue.

> If a request is returned to them, they can correct it and resubmit it. A rejected request is never
> a dead end.

### 3. The department head decides

**Who:** the requester's department head (or deputy)

The head sees only their own department's pending requests in their Approval Centre. They approve it
or return it with a reason. The reason goes back to the requester.

### 4. Procurement finds a supplier

**Who:** Procurement Officer

For an approved request, the Officer either:

- **Runs a quotation round (RFQ/tender)** — picks which suppliers to invite, sets a closing date, and
  sends it. Invited suppliers submit their prices through their own portal link; or
- **Raises a purchase order directly**, where the item and supplier are already settled.

### 5. Bids are compared and one is chosen

**Who:** Procurement Officer scores · Procurement Manager (or CFO/CEO) awards

Quotations that come in are compared side by side. The Officer scores them, and the Manager awards
the winner. Awarding automatically raises the purchase order for the winning supplier.

> **Scoring and awarding are separate jobs.** The person who scores the bids does not decide who wins.

### 6. The order goes to the supplier

**Who:** Procurement Officer

The purchase order can be saved as a draft and sent when ready, or several drafts can be sent at
once. Sending it is the moment the organisation is committed, so it is its own deliberate action.

### 7. The goods arrive and are inspected

**Who:** Procurement Officer records · Procurement Manager inspects

When a delivery arrives, the Officer records a **goods received note**: how many were received, how
many accepted, how many rejected. It then goes to the Manager for inspection, who accepts it or
rejects it with a reason.

> Again, separated on purpose: the person who receives the goods is not the person who signs off
> their quality.

### 8. The supplier's invoice is captured

**Who:** Accountant

Two ways to do this:

**By hand** — choose the purchase order, enter the invoice date and the price per line. The invoice
number is assigned and VAT applied when it is saved.

**With AI Invoice Capture** — see the section below.

Either way the invoice is checked against the order and the delivery (the "three-way match"), and
goes to Finance for approval.

### 9. Finance approves, Accounts pays

**Who:** Finance Manager approves · Accountant pays

The Finance Manager approves the invoice for payment, or rejects it with a reason. Only then can the
Accountant record the payment — with proof of payment attached, which is required.

Recording the payment creates the expense journal. The journal is **created but not posted**: posting
is an accounting decision, made in Accounts. The module says so rather than claiming the books are
already updated.

> **Whoever approves an invoice cannot be the one who pays it**, unless they are an administrator.

---

## AI Invoice Capture — reading a supplier invoice

**Who:** Accountant (or Finance Officer)

Instead of typing an invoice out, upload the supplier's PDF and let the system read it.

**What you do:**

1. Open **AI Invoice Capture** in the sidebar.
2. Choose the PDF of the supplier's invoice.
3. Pick the purchase order it relates to. (Optional, but worth doing — it identifies the supplier,
   keeps the reading on file, and helps the system learn that supplier's layout.)
4. Press **Read the invoice**.

**What you get back:** the invoice number, date, currency, tax treatment and every line item — each
shown with **how confident the system is** about that particular field. Amounts are shown to the
cent, so you can compare them against the PDF directly.

5. Check the figures against the PDF.
6. Press **Capture this invoice** — the capture form opens with the reading already filled in.
7. Correct anything that needs correcting, and save.

**Nothing is saved by reading.** The invoice only exists once you save the capture form. From there
it follows exactly the same path as one typed by hand — match, approval, payment.

### What it will tell you honestly

| If this happens | You are told |
|---|---|
| The reading is below the confidence threshold | It says so, and asks you to check every field before saving |
| The PDF is a photo or a flat scan with no readable text | It says the document can't be read and asks you to capture it by hand |
| The reading service can't be reached | It says so and asks you to capture by hand — it never invents figures |
| The invoice's lines don't match the order's lines | It fills in the date but leaves the prices alone, and tells you why |

The confidence figures are the system's own assessment of what it read. They are not a guarantee that
the invoice is correct — **you are still the one who checks it.**

---

## Alongside the main flow

| Area | Who | What it's for |
|---|---|---|
| **Vendor Registry** | Procurement Manager / Officer | Supplier records, tax clearance status, blacklisting and reinstating |
| **Contracts & Awards** | Procurement Manager | Agreements that follow an award; activating and terminating them |
| **Document Vault** | Anyone with document access | Tender packs, contracts, evidence — with versioning |
| **Approval Centre** | Anyone who approves | One place showing everything waiting on *your* decision |
| **Command Centre** | Everyone | Your own queue and the figures for what you can see |
| **Audit & Compliance** | Internal Auditor | Who did what, to which record, and when |

---

## Things the module deliberately will not let you do

These are not faults. They are the controls:

- **Approve your own plan** — the option isn't offered to its author.
- **Pay an invoice you approved** — approving and paying are held by different roles.
- **Pay without proof of payment** — the payment is refused.
- **Decide another department's requisition** — you only ever see your own.
- **Open a form your role can't finish** — you're told before you fill it in, not after.
- **Award a tender you scored**, unless you hold the award grant as well.

---

## A note on honesty

Where something isn't measured or isn't connected yet, the module says so instead of showing a
plausible number. A figure with no source behind it reads as "—" with an explanation, an empty
register says "No records to show yet", and a button that cannot complete its job refuses and tells
you why.

If a screen shows you a number, that number came from real records.
