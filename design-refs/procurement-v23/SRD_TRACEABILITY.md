# Procurement V23 against the SRD — what works, verified

**SRD:** `Arcus (SRD)_ Procurement Module (2).pdf` (Downloads; v1.0, 15 Sept 2025). **Rule:** a requirement is "Works"
only when it has been exercised on dev through the UI or the API and the evidence is named. Anything else says exactly
what is missing, and is built or removed from the live UI — never left as a control that says "not connected".

| # | SRD requirement (section) | Status on dev | Evidence / what is missing |
|---|---|---|---|
| R1 | Vendor master: company, contact, email, phone, address, payment terms (§3) | Works | Vendor Registry, register vendor form; `GET /accounting/vendors` |
| R1b | Vendor history: past POs, invoices received, flagged discrepancies, performance (§3, §2) | **Missing** | Vendor profile shows company profile, tax rule, compliance documents, messages — no orders, invoices, discrepancies or delivery record |
| R2 | Requisition form: requester and department filled in, line items with totals, justification required, draft and submit (§3, §7) | Works | actions suite steps 1–3, workflows W1–W2 |
| R2b | Project / cost centre on the requisition (§7) | **Missing** | no field on `PurchaseRequisition` |
| R2c | Line lookups suggesting pre-approved vendors and standard item costs (§3) | **Missing** | no lookup |
| R3 | Approval routing by rules, e.g. amount needing two levels (§3, §4 System Administrator) | Backend works; **no V23 screen** | `ApprovalService` stages (user, role, department, amount threshold) with department-head fallback; configured only through the frozen legacy module |
| R3b | Approver notified on submission (§6.2) | To verify | `ApprovalService.sendApprovalStepNotifications` exists |
| R4 | Approve / reject requisitions from one dashboard, on a phone (§4 Department Manager) | Works | Approval Centre; phone layout checked (cycle eight) |
| R5 | One-click PO from an approved requisition, branded PDF, emailed to the vendor (§3, §6.3) | Works | workflows W4–W6; PO PDF with letterhead; send by email (mail guard on dev) |
| R6 | PO register with status and filters by vendor, date and status (§5 Phase 2) | **Partial** | status and year filters only; no vendor or date-range filter |
| R7 | Invoice upload, PDF or image, fields read and prefilled for review (§3, §4 Accounts Clerk, §6.5) | Being verified | LLM reading of text PDFs exact on dev; OCR for scans and photos deploying (`af5b3a1`) |
| R7b | Invoice processing screen: document viewer beside editable fields, Approve and Flag for Review (§7) | **Missing** | AI Invoice Capture shows the reading and prefills the capture form; no document viewer, no flag-for-review |
| R8 | Three-way match flagging quantity, price and items not on the PO (§3) | Works | `ProcurementInvoiceMatchService`; workflows W8 |
| R8b | Automated notification to the procurement officer on a flagged invoice (§3, §4, §6.6) | **Missing** | the match stores flags; nobody is notified |
| R8c | Duplicate invoice detection (§2) | **Missing** | only accounting bills check a duplicate reference |
| R8d | Exact match auto-approved into the payment queue (§6.6) | **Missing** | every invoice waits for Finance approval |
| R8e | Supplier's document compared with the capture (§1, §4 Supplier) | Being verified | `ProcurementInvoiceReadingService` deploying |
| R9 | Approved invoice becomes a payment request queued in AP by due date; AP payment updates procurement (§3, §2) | **Partial** | Payables lists procurement invoices; payment is recorded in procurement (journal and cashbook posted); paying from Accounting is not wired |
| R10 | Finance: outstanding POs and invoices, committed spend, cash forecast (§4 Finance Manager) | **Partial** | committed spend and payables shown; "Spend forecasting is not available" |
| R11 | Insights: unusual spending, vendor on-time delivery and cost per item over time, top departments, reliable vendors (§2) | **Partial** | on-time receipt KPI, spend by category/department; no anomaly, cost trend or vendor ranking |
| R12 | Dashboard: awaiting my approval, recent POs, spend by department over a chosen range, invoices to review with reasons (§7) | **Partial** | approval queue and cycle charts; no date range; no invoices-to-review list with flag reasons |
| R13 | RBAC; HTTPS; secure auth (§8) | Works | per-action procurement grants; census refusals; HTTPS on dev and prod |
| R14 | Clear errors for bad uploads; correct misread fields (§8) | Being verified | upload type refusal and unreadable-document errors deploying; capture form editable |

Controls the V23 design shows that the SRD does not ask for, currently answering "not connected": eSignature, approval
delegation, emailing vault documents, vendor messaging and document requests, compliance reminder runs, withholding tax,
evaluation committees and declarations, contract obligations, fixed-asset transfers, report schedules and board packs,
RBAC editing. Each is to be built or taken out of the live UI; none stays as it is.
