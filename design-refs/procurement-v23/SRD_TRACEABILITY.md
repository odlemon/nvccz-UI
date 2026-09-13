# Procurement V23 against the SRD — what works, verified

**SRD:** `Arcus (SRD)_ Procurement Module (2).pdf` (Downloads; v1.0, 15 Sept 2025). **Rule:** a requirement is "Works"
only when it has been exercised on dev through the UI or the API and the evidence is named. Anything else says exactly
what is missing, and is built or removed from the live UI — never left as a control that says "not connected".

Evidence below is from dev (dev.matanho.com / dev-api.matanho.com), 13 September 2026, cycles nine to fourteen: cycle
nine (API `a086977`, UI `0796fbc`), cycle ten (API `fbe5a01`, UI `892857f`), cycle eleven (UI `4b15cec`), cycle twelve
(API `dc224d5`, UI `f4ff8be` — the module moved from `/procurement-v23` to `/procurement`; old links redirect), cycle
thirteen (UI `c0bac67`) and cycle fourteen (UI `9e8acbd`). UAT scripts are under `scripts/_uat/`; every run ends with the
dev cleanup and `demo_integrity.mjs` (18/18, demo dataset intact).

| # | SRD requirement (section) | Status on dev | Evidence |
|---|---|---|---|
| R1 | Vendor master: company, contact, email, phone, address, payment terms (§3) | Works | `procurement-v23-vendor-master.mjs` 18/18 (cycle ten): profile shows phone, payment terms and address; Edit profile offers only the stored fields and the save reaches the vendor record, keeping what was not changed; no messaging, document request or sample register; Finance Manager refused before the form opens; the API refuses a blacklist or registration change through the update and any update from a role without vendor maintenance |
| R1a | Vendors onboarded two ways: staff register them, or they register themselves on the vendor portal (§4 Supplier) | Works | `procurement-v23-vendor-self-registration.mjs` 22/22 (cycle fourteen): the portal's registration page opens with no invitation; without a SWIFT/BIC code it refuses and says why; the registration is accepted and asks for KYC documents; the vendor waits in PENDING_REVIEW, counted with its bank account, token not exposed, not invitable to RFQs; a requester cannot list the queue; the officer sees its decision card (Open profile only) and the API refuses the officer's approval; "Vendor portal" opens the registration page in a new tab; the Procurement Manager approves (active) and declines another with a reason (inactive; without a reason, refused); the old `/procurement-v23` address opens the registry at `/procurement` |
| R1b | Vendor history: past POs, invoices received, flagged discrepancies, performance (§3, §2) | Works | `procurement-v23-vendor-history.mjs` 10/10: orders, invoices, flagged count, on-time delivery and item prices equal the registers |
| R2 | Requisition form: requester and department, line items with totals, justification, draft and submit (§3, §7) | Works | actions suite, workflows W1–W2 |
| R2b | Project / cost centre on the requisition (§7) | Works | `procurement-v23-requisition-assist.mjs` 14/14 (cycle twelve): project offered and searchable, saved on the draft, shown when the requester reopens it; no register claims a budget check |
| R2c | Line lookups suggesting vendors and standard item costs (§3) | Works | `procurement-v23-requisition-assist.mjs`: suggestion with last price and vendor fills the estimate and says where it came from |
| R3 | Approval routing by rules, e.g. amount needing two levels (§3, §4) | Works | `procurement-v23-approval-route.mjs` 52/52: matrix set by the CFO, requisitions routed by total, step-by-step decisions |
| R3b | Approver notified on submission (§6.2) | Works | same suite: in-app notification and email (mail guard on) to the current step's approvers |
| R4 | Approve / reject from one dashboard, on a phone (§4) | Works | Approval Centre; phone layout checked (cycle eight) |
| R5 | One-click PO from an approved requisition, branded PDF, emailed (§3, §6.3) | Works | workflows W4–W6 |
| R6 | PO register filters by vendor, date and status (§5 Phase 2) | Works | `procurement-v23-po-filters.mjs` 11/11, checked against the API's orders |
| R7 | Invoice upload, PDF or image, fields read and prefilled (§3, §4, §6.5) | Works | `procurement-v23-ai-capture.mjs` scanned PDF 18/18 and photo 18/18 (OCR); invoice reading suite 76/76 |
| R7b | Processing screen: document beside editable fields, Approve and Flag for Review (§7) | Works | `procurement-v23-invoice-processing.mjs` 11/11: page images with read fields highlighted, flag with a reason |
| R8 | Three-way match flagging quantity, price and items not on the PO (§3) | Works | `ProcurementInvoiceMatchService`; workflows W8 |
| R8b | Procurement officer notified of a flagged invoice (§3, §4, §6.6) | Works | invoice-processing: Finance Manager alerted with the reason; Invoices to review lists it |
| R8c | Duplicate invoice detection (§2) | Works | invoice documents / duplicates / alerts suite 24/24 |
| R8d | Exact match auto-approved into the payment queue (§6.6) | Works | `procurement-v23-invoice-auto-approval.mjs` 20/20: off, limit, on; approved by no person, queued, notified, audited; label in the match workspace |
| R8e | Supplier's document compared with the capture (§1, §4) | Works | auto-approval case 3 (another supplier's document disagrees and waits for Finance); invoice documents suite |
| R9 | Approved invoice queued in AP by due date; AP payment updates procurement (§3, §2) | Works | `accounting-v52-payables.mjs` 23/23 (cycle twelve): listed, queued with Pay, its real lines; paid from Accounting with proof, confirmed straight away, dialog closed; procurement shows it paid with its journal and bank reference |
| R10 | Finance: outstanding POs and invoices, committed spend, cash forecast (§4) | Works | `procurement-v23-analytics.mjs` 14/14: cash requirements by due date and delivery date plus payment terms |
| R11 | Insights: unusual spending, on-time delivery, cost per item over time, top departments, reliable vendors (§2) | Works | analytics suite 14/14 |
| R12 | Dashboard: awaiting my approval, recent POs, spend by department over a range, invoices to review with reasons (§7) | Works | `procurement-v23-dashboard.mjs` 9/9, each card against the API |
| R13 | RBAC; HTTPS; secure auth (§8) | Works | `procurement-authz-probe.mjs` (cycle ten, inside the dev API container): every asserted cell matched the policy, including vendor create, update and blacklist-through-update. Before the fix, vendor create/update needed only a staff sign-in and the plain update could blacklist: fixed (`d5d27b8`). Checked on dev API `fbe5a01`: Buyer update 403 (needs `procurement.vendors.manage`); officer blacklist or registration change through the update 403 (needs approval rights); officer's own update reaches the handler |
| R14 | Clear errors for bad uploads; correct misread fields (§8) | Works | upload type refusal and unreadable-document errors; capture form editable (invoice reading suite) |

## Controls with nothing behind them

Not offered in a live session (removed as they render; `lib/procurement-v23/actions.ts` `hasNoBackend`): eSignature,
approval delegation, emailing vault documents, vendor messaging and document requests (including "Send compliance
reminder"), compliance reminder automation, CSV line import, internal notes, evaluation criteria, report builder and
schedules, quotation import, record attachments and generic record edit, document and template editors, vendor invites
outside the tender builder, the vendor bid-form preview, record history drawers. KPI cards for features procurement does
not record (withholding tax, eSignature, committees and declarations, board packs, report schedules and downloads, and
the like) are left out rather than shown as a dash. The census (`procurement-v23-explore.mjs`) records any modal left
with nothing to save (`deadEnds`) and every KPI card left out (`hiddenKpis`) per page. Cycle ten census, Procurement
Manager (every control on 19 pages): 0 dead ends, 0 controls answering "not connected", 0 page errors, 0 failed load
calls. Procurement Officer, Accounts Payable and the requester (19 pages each; the requester reaches only the pages its
role allows): the same, all zero. Demo dataset intact after the clean-up, 18/18. Cycle twelve, after the move to
`/procurement`: the Procurement Manager census again reads 0 on each of those, and sidebar navigation passes 17/17 pages.

The requisition registers' Budget check column and the view's Budget line (no budget check exists), and six KPI cards
that could only read zero (vendor messages, compliance requests and documents; contracts awaiting signature; asset
purchases; report templates) are also not shown (`971d420`, `668ce17`, deploying in cycle eleven).
