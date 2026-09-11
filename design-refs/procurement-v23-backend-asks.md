# Procurement V23 — backend asks

**Branch:** `feature/procurement-v23-live` (nvccz and nvccz-new) · **As of:** 11 September 2026 · local only, nothing deployed
**Findings raised along the way:** [`procurement-v23/TEST_FINDINGS.md`](procurement-v23/TEST_FINDINGS.md)

This is the list of what the V23 screens need and the backend does not yet provide. Everything
not listed here is either connected, or a view the runtime builds from data already loaded.

Where a screen has no backend behind it, the live build shows an honest empty state or an em
dash, and a write action is refused with "not connected to the backend yet". It never shows the
vendored demo records or a success toast for a save that did not happen.

---

## What is connected

| Screen | Reads | Writes |
|---|---|---|
| Access (all screens) | `GET /procurement/me/access` *(added)* | — |
| Command Centre | requisitions, RFQs, POs, GRNs, invoices, vendors (KPIs, cycle donut, attention list derived) | — |
| Approval Centre | prompts built from real pending decisions | approve and reject: requisition, award (quotation accept), GRN, invoice |
| Purchase Requisitions | `GET /procurement/requisitions`, `/my`, `/pending-approval` | raise and submit, save draft, approve, reject |
| Tenders & RFx | `GET /procurement/rfq`, `GET /vendor-quotations` | send an RFQ from an approved requisition (tender builder) |
| Bid Evaluation | real bids and `GET /procurement/rfqs/:id/comparison-matrix` | evaluation-team technical scores; award from the award panel |
| Vendor Registry | `GET /accounting/vendors` | register vendor (V6 form); bank details held for Finance |
| Purchase Orders | `GET /procurement/purchase-orders` | send PO |
| Receiving & Inspection | `GET /procurement/goods-received-notes` | record a GRN against a sent PO (received, accepted, rejected per line) |
| Invoices & 3-Way Match | `GET /procurement/invoices`, real PO → GRN → invoice chain per tender | capture a supplier invoice against a PO (OCR upload not connected) |
| Audit & Compliance | `GET /procurement/audit-events` *(added)* | — |

**Added to the backend for V23** (nvccz, local commits):
- `GET /procurement/me/access`;
- `GET /procurement/audit-events` and the `procurement.audit.view` grant;
- staff invoice capture reachable (PROC-004);
- 404/400/409 instead of 500 on quotation errors (PROC-003);
- per-action procurement permissions (PROC-002);
- `PUT /vendor-quotations/:id/evaluation` for the evaluation team's technical score, with a
  vendor's own declared score no longer counted and price scored against the lowest bid (PROC-006);
- an accepted quotation recorded on its RFQ as the award, closing it to further quotes (PROC-007);
- vendor email links that work (PROC-008):
  - public `GET /procurement/vendor-portal/purchase-order?token=` behind the PO email's invoice
    link, which now opens `/vendor/invoice/submit`;
  - vendors can invoice a PO after its goods are received;
  - `VENDOR_PORTAL_BASE_URL` set on both servers, so RFQ invitations and PO emails link to the
    vendor portal, not the staff host.

---

## Asks

Priority reflects what blocks a real procure-to-pay cycle first.

### 1. Estimated value on requisition lines — HIGH

- **Screen:** the requisition form collects a **unit estimate** per line. The register shows
  **Estimate** and **Budget check** columns, and the Approval Centre shows a value.
- **Gap:** `PurchaseRequisitionItem` has no price field. `PurchaseRequisition.totalAmount` is
  always `0` for department requisitions, so all three show "—".
- **Proposal:** `estimatedUnitPrice Decimal?` on `PurchaseRequisitionItem`, accepted by
  `POST /procurement/requisitions`. `totalAmount` becomes the sum of quantity × estimate.
- **Unblocks:** ask 2, and the value a department head approves against.

### 2. Budget check against department or cost-centre budgets — HIGH

- **Screen:** "Budget check" column, "Budget warnings" KPI, the form's "Live budget check"
  notice, and department budget cards.
- **Gap:** no budget model or check exists.
- **Proposal:**
  - a budget per department (or cost centre) and financial year;
  - on submit, compare committed + pending requisitions + this request against it;
  - return `withinBudget | warning | blocked` and the remaining amount on the requisition.
- **Depends on:** ask 1.

### 3. Annual procurement plan — HIGH

- **Screens:** Annual Procurement Plan (plans, plan line items, versions, submit/approve) and
  Analytics (plan vs committed vs actual).
- **Gap:** no plan model.
- **Proposal:**
  - models: `ProcurementPlan` (entity or department, year, version, status, budget) and
    `ProcurementPlanItem` (description, category, quarter, method, budget, status);
  - endpoints: CRUD plus submit and approve;
  - link: a requisition may reference a plan item, so plan vs actual can be computed.

### 4. Bid evaluation scores — DONE (single score per bid); per-criterion scoring remains — MEDIUM

- **Done in cycle three:** `PUT /vendor-quotations/:id/evaluation` records one technical score
  (0–100) per bid. The comparison matrix ranks on it, and the V23 workspace scores and awards
  through it (PROC-006).
- **Remaining:**
  - scores per criterion and per evaluator (the V23 form asks for technical, commercial, delivery
    and risk weights), with conflict declarations;
  - the backend still weighs only price against one non-price share, so delivery and risk
    weights are folded into that share when an RFQ is sent.
- **Proposal:** an evaluation record per evaluator × quotation × criterion, with the weights
  stored on the RFQ, and an aggregated score returned by the matrix.

### 5. Invoice rejection — DONE

- **Screen:** Approval Centre → Review → Reject / return on an invoice prompt.
- **Built:** `PUT /procurement/invoices/:id/reject` `{ rejectionReason }` behind
  `procurement.invoices.approve` (nvccz `321fcdc`), wired in the Approval Centre
  (nvccz-new, same day).
  - Only an invoice awaiting approval can be rejected.
  - It sets `REJECTED` with the reason and a content fingerprint, and writes a `REJECT` audit
    event. Nothing is posted.
- **Verified:** actions UAT step 11 and the authorisation probe row.

### 6. Three-way match result on staff-captured invoices — MEDIUM

- **Screens:** Invoices & 3-Way Match ("Matched", "Exceptions", "Match variance") and the match
  workspace panels.
- **Gap:** `ProcurementInvoice.matchingStatus` stays `PENDING`. Suite 06 has `run-match` for
  intakes, not for invoices captured against a PO.
- **Proposal:** compute on capture, or on demand:
  - invoice lines against PO lines and accepted GRN quantities, per line: quantity, unit price
    and tax variance, with a tolerance;
  - store the status and the variances;
  - expose them on `GET /procurement/invoices`.

### 7. Contracts and awards register — MEDIUM

- **Screen:** Contracts & Awards (contract from an accepted quotation, value, term, signature
  status, renewals, obligations).
- **Gap:** no contract model. The accepted quotation and its PO are the only award record.
- **Proposal:** `ProcurementContract`:
  - fields: `quotationId`, `vendorId`, `value`, `startDate`, `endDate`, `status`, `signedAt`;
  - create on award (optional) or manually;
  - list endpoint.

### 8. Procurement document vault — MEDIUM

- **Screens:** Document Vault and the upload / preview / send actions on tenders, evaluations,
  POs and contracts.
- **Gap:** no procurement document register. Vendor KYC documents exist per vendor only.
- **Proposal:** a document register (category, linked record, version, uploaded by) on the
  existing upload service, with list, upload and download endpoints. The payroll vault is the
  model to follow.

### 9. GRN accounting hand-off (accruals, fixed-asset capitalisation) — MEDIUM

- **Screen:** Accounts & Asset Transfers (journal queue, asset transfer queue).
- **Gap:**
  - journals are created only on invoice payment;
  - GRN approval posts nothing;
  - PO lines are not classified as fixed assets.
- **Proposal:**
  - a fixed-asset flag on PO lines;
  - on GRN approval, an accrual journal (GRNI) and, for assets, an asset-register candidate;
  - list endpoints for both queues.

### 10. RFQ register counts — LOW

- **Screen:** Tenders & RFx, "Vendor invitations" and "Clarifications" KPIs.
- **Gap:** `GET /procurement/rfq` does not return invitation or clarification counts. Per-RFQ
  clarifications exist.
- **Proposal:** include `_count: { invitations, clarifications }` in the list.

### 11. Vendor master fields — LOW

- **Screen:** vendor register (country, default currency, rating).
- **Gap:** no `country`. The list returns `settlementCurrencyId` without the code. `vendorRating`
  is rarely set.
- **Proposal:**
  - `country` on `Vendor`;
  - include `settlementCurrency { code }` in `GET /accounting/vendors`;
  - a rating update endpoint, if ratings are to be kept.

### 12. Tax-clearance reminder automation — LOW

- **Screen:** Vendor Registry → Automated compliance reminders (cadence, thresholds, last and next run).
- **Gap:** no scheduler. The screen says "Not configured" and "Never run".
- **Proposal:** a scheduled job over `taxClearanceExpiryDate` / `taxRevalidationAlertDueAt`
  (already on `Vendor`), with a settings row and a run log.

### 13. Access requests and the procurement role matrix — LOW

- **Screen:** Configuration & RBAC.
- **Gap:** roles and grants are managed in Admin; procurement has no access-request workflow.
- **Proposal:** either link the tab to Admin → Roles, or add an access-request model (request,
  approve, expire). Decide before building.

### 14. Local proof-of-payment storage — LOW (environment)

- **Behaviour:** `POST /procurement/invoices/:id/payment` uploads the proof through
  `RemoteUploadService`. With `REMOTE_UPLOAD_SERVICE_URL` empty, that is the shared VPS upload
  service, even from a local run. Local testing therefore does not exercise payment
  (`procurement-p2p-flow.mjs --pay` is opt-in).
- **Proposal:** point local environments at the local mock (`http://127.0.0.1:3050/upload`).

---

## Test assets

| Script | Repo | Proves |
|---|---|---|
| `scripts/_uat/procurement-authz-probe.mjs` | nvccz | who can call what, against the permission policy |
| `scripts/_uat/procurement-p2p-flow.mjs` | nvccz | procure-to-pay through the API as the allowed personas; builds the local dataset |
| `scripts/_uat/procurement-v23-baseline.mjs` | nvccz-new | per page, as a persona: demo records, live records, KPI cards, errors |
| `scripts/_uat/procurement-v23-actions.mjs` | nvccz-new | connected controls used through the UI, verified through the API |
