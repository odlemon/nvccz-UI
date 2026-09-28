# Vendor Master & Vendor Portal: gap check, build and verification

All local (MySQL `arcus_dev`, API :3009, staff portal :3120, **standalone supplier portal :3140**). Nothing deployed, nothing committed.
The supplier UI is its own build (`NEXT_PUBLIC_PORTAL=vendor`, `node scripts/run-portal-dev.mjs vendor`), so supplier testing ran on that build, in a visible browser, using a signed invitation link.

## 1. Migration log (backend repo, apply to dev in this order)

| # | Command | Effect |
|---|---|---|
| 1 | `npm run db:migrate:vendor-master` | **One idempotent script.** `vendors`: `vendor_code` (unique, `VND-#####`, back-filled), `registration_number`, `vat_number`, `commodity_categories` (JSON), `onboarding_date`, `approval_status`, `compliance_status`, `notes`, `approved_by_id/at`, `status_reason`, `status_changed_at/by`; `lifecycle_status` becomes the Vendor Status (8 values), **one-time back-fill** from the old flags (blacklisted→Blocked, pending review→Pending Review, declined/inactive→Inactive, suspended→Suspended, expired clearance→Expired, else Approved) and its column default moves from `ACTIVE` to `DRAFT`. `vendor_kyc_documents`: `expiry_date`, `issue_date`, `document_number`, `notify_days_before`, `last_expiry_notice_at`. `vendor_document_upload_settings.expiry_notice_days` (default 30). `vendor_quotations`: `acknowledged_at`, `superseded_at`. `procurement_invoices.submitted_via`. New table `rfq_reopen_events`. |

Then `npx prisma generate` (stop the API first; on Windows the running process locks the engine DLL). The status back-fill runs only the first time. Scheduler: the API now starts a 6-hourly vendor compliance job (`VENDOR_COMPLIANCE_JOB=off` disables); a cron route `POST /api/cron/vendors/compliance-cycle` exists for an external scheduler. New CORS origins: `localhost:3140/3150`.

## 2. Audit: what was missing / inert
- Status was three unvalidated string flags; only blacklist/suspended/pending were checked, and only when an RFQ was created. **PO, PO send, award, quotation submit, payment and invoice checked nothing.** `lifecycleStatus` was never read.
- No Vendor Code, registration no., VAT column, commodity categories, notes, onboarding date, compliance status.
- Tax clearance expiry: never changed any status, only a manual cron notification.
- Documents had **no expiry**; nothing alerted anyone.
- Payment ignored the vendor's bank record; no vendor bank/payment file existed.
- Delete never checked orders/invoices; `DELETE` had no permission check.
- Supplier portal: no submission lock semantics beyond "deadline passed"; unlimited duplicate submissions; anyone with `extend` could silently move a closed deadline; no supplier-side clarifications; no receipt; portal use never re-checked vendor status.

## 3. What was built
Backend: `vendorStatus.ts` (states, lifecycle table), `VendorGateService` (single gate + live compliance), `VendorLifecycleService` (permission per move, reasons, segregation of duties, audit), `VendorComplianceJobService` (expiry sync + pre-expiry and expired notifications to authorised users), `VendorPaymentFileService` (bank file from vendors' own banking), `supplierVisibility`, `safeFetchUrl`, `vendorPortalRateLimit`. Gate calls sit in: RFQ invite, auto-RFQ list, quotation submit, award, PO create, PO send, invoice capture and approval, payment, attachment upload.
Frontend: live Vendor Registry (status/compliance filters, search), full vendor profile (all §8.1 fields, gate verdict, documents with expiry and per-document alert, banking, history), status-move dialogs, extended register/edit forms, Reopen dialog on closed tenders; supplier portal quotation page (currency, payment terms, delivery, comments, attachments, review step, receipt, clarifications, lock banner), invitation-link landing.

## 4. Enforcement, as tested (blocked paths included)
Draft, Pending Review/Approval, Suspended, Blocked, Inactive, Expired vendors **cannot be invited, awarded, issued or sent a PO, quote, or be paid**; non-compliant vendors cannot be approved; tax-clearance or document expiry flips an Approved vendor to Expired automatically and renewal restores it; the submitter cannot approve; bank payment needs a vendor bank account and writes the payee to the audit trail; the payment file excludes vendors the system would refuse to pay and says why; a vendor with history is made Inactive rather than deleted.

## 5. Supplier boundary (adversarial)
Two competing suppliers: no leak of the other's name, email, id, prices, internal notes or scores in any page or **any API response the supplier's browser received**; forged, expired and cross-event links rejected; body-supplied vendor/RFQ/requisition ids ignored; staff routes refuse anonymous callers and supplier links used as bearer tokens; attachment IDOR closed; anonymous upload closed; SSRF via invoice `documentPath` closed (5 vectors); rate limits verified; deadline lock immutable; reopen needs reason, permission and future date, is recorded in `rfq_reopen_events` and the audit trail, and refuses awarded events.

## 6. Fixed along the way
Invoice submit returned an internal admin's name/email to the public; supplier quotations had no validation (negative price, bad currency); currency defaulted to USD instead of the vendor's; vendor master payment terms overrode what the supplier offered; RFQs raised without a requisition showed suppliers **no lines**; invoices ignored the PO's currency/terms; my earlier segregation rule would have blocked the system user from approving supplier invoices (now keyed on `submitted_via`); vendor bank details were readable by any vendor viewer via `?include=banks`; portal CORS missing for :3140; legacy landing "email + RFQ number" replaced by the invitation link.

## 7. Verification
`vendor-master-e2e.ts` **78/78**, `vendor-portal-adversarial.ts` **56/56**, `vendor-master-ui.mjs` (visible browser, staff) **56/56**, `vendor-portal-ui.mjs` (visible browser, standalone supplier portal) **35/35**; earlier User Master suites re-run green (69/69, guards). Screenshots in `design-refs/vendor-master/screens/`.

## 8. Decisions / limits
- Approval status is a separate field, but Vendor Status is the single gate; the others are kept in step by the lifecycle service.
- Invoice capture stays possible for Suspended/Expired vendors (goods already delivered) but never Blocked/Draft/Inactive; payment needs Approved.
- Pre-expiry notices are in-app (email is blocked by the local mail guard). Local file uploads go to a remote store not in the local stack, so document rows were inserted directly for the UI test; upload code paths are unchanged.
- Supplier "opportunities" are the personal invitation links (one signed link per vendor per event); there is deliberately no supplier login.
- Staff "Vendor portal" button needs `NEXT_PUBLIC_VENDOR_PORTAL_URL` (set in `.claude/launch.json` for the review server).
