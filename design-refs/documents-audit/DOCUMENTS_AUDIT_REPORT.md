# Document Management & Audit Trail: gap check and build (`/procurement`)

Scope: BRD §32 (document management) and §33 (audit trail). Everything was built and tested locally; nothing was deployed or committed.

## 1. What the audit found

**Document Vault**

| Requirement | State before |
|---|---|
| Formats | Nothing checked the file: any type, any name. No content check. |
| Preview | The vault "preview" was a synthesised page built from record fields with an "Open the stored file" link to the storage URL. An uploaded document did not display. |
| Preview without download | Not possible: the only route to the file was that link. |
| Versioning | A "version" overwrote the file and bumped a label. No history, earlier files lost. "Upload version" on a template or generated record was refused with *"Only a stored vault document takes a new version; templates and generated records have no stored file"*. |
| Metadata | Uploader and date were stored; the related transaction was free text that could name a record that does not exist and linked nowhere. |
| Large files | A 25 MB limit; the storage client cut uploads off at 60 s and a default body cap. |
| Receive / Upload | Opened a separate legacy form with the same gaps. |
| Banner contrast | The buttons on the "Procurement document control" banner rendered black on purple (a shared "button text true black" rule out-specified the banner's own rule). |

**Audit trail**

| Requirement | State before |
|---|---|
| Events | Login was written. **Logout, file download, permission change, workflow change and assignment were never written.** Integration, file upload and closure were only partly written, and several events landed in the wrong class ("record edited"). |
| Fields | The list API returned only time, action, record and actor: **no previous value, new value, IP or device.** Most rows had no IP or device (writers did not pass them). |
| Previous / new value | Many edits recorded the new value only. |
| Pagination | The page paged only through the newest 200 rows already loaded, in the browser. |
| Filters | The bar (year, category, status) was decorative: none filtered the audit trail. |
| Immutability | No route edited or deleted history, but nothing *enforced* it: the application would accept an update or delete from any code path. |

## 2. What was built

### Documents (§32)

- **Eight formats, checked on content.** PDF, DOCX, XLSX, XLS, CSV, JPG, JPEG, PNG. A file is accepted on its extension *and* its first bytes (a renamed executable or a PDF named `.png` is refused with a plain message); a batch with one bad file stores nothing. The SHA-256 checksum is stored.
- **Preview in the browser, no download.** A PDF and an image are served inline from the stored bytes. A DOCX, XLSX, XLS or CSV is converted on the server to HTML (existing `mammoth` and `xlsx` libraries; no new dependency) and shown in a frame that runs no scripts. The preview sits beside the file's details and version list.
- **Download** returns the exact stored bytes with the original file name (the API exposes `Content-Disposition` to the browser app).
- **Real versioning.** New table of versions: a new version adds a row (file, size, checksum, uploader, time, note) and becomes current; earlier versions stay retrievable and previewable. An identical file as a new version is refused. The "Only a stored vault document takes a new version" refusal cannot occur: every stored document takes a version, and a template or generated record's "Upload version" files the upload in the vault (unlinked when its label is not a record number).
- **Metadata captured by the server**: uploader, upload date, size, format, version, checksum. **Related transaction** is chosen from the real records (purchase order, RFQ, requisition, invoice, receipt, contract, plan, vendor) and is refused if it does not exist; the preview's link opens the *actual record* in its own page.
- **Large files.** 100 MB per file (the storage client no longer cuts off at 10 MB bodies or 60 s); a file over the limit is a clear 413, not a crash. Tested at 45 MB in the browser and 60 MB on the API.
- **Receive / Upload** and Upload document open the one live upload form (Receive / Upload pre-files under Vendor Submissions).
- **"Recent controlled documents" is paged**: 25 a page (10 / 25 / 50 / 100 selectable), First / Previous / Next / Last, "Showing 26–50 of N, newest first · Page 2 of M". The vault's search and type / status / owner filters pick the matching documents first and the pager pages those (a filter returns to page 1; the count beside the filters stays the total; no match hides the pager). The vault loads the newest 500 documents.
- Row list shows format, size and related record instead of a caption; row menu offers Preview, Download, Upload new version, Version history, Open related record, Mark approved, Archive.
- **Banner contrast** fixed (light and dark).

### Audit (§33)

- **Eighteen event classes** (`event_type` on every row, back-filled for the 11,700 existing rows): Login, Logout, Record creation, Record edit, Submission, Approval, Rejection, Return, Assignment, File upload, File download, Permission change, User change, Vendor change, Workflow change, Integration transaction, AI processing, Record closure. New events written: **Logout** (`POST /auth/logout`, already called by the app's Sign Out), **File download** (document download and preview, PO PDF, audit export), **Permission change** (role create / update / delete with previous and new permissions), **Workflow change** (approval routes, procurement settings, invoice auto-approval, with previous and new), **Assignment** (evaluation committee, approval delegation), **Integration** (ledger journal posting on payment), **Closure** (contract termination, document archive, finance handoff Closed), and every file stored for a receipt or requisition attachment.
- **Every row carries timestamp, user, action, record, record ID, previous value, new value, IP and device.** IP, device and signed-in user now come from the request itself (a request context), so no writer can omit them. This also exposed and fixed a real bug: audit rows written after a multipart upload lost the request context (multer's stream callbacks); every multer route is now re-bound once at start-up.
- **Previous and new values** added where edits recorded only the new value: plan, contract, requisition (field by field), RFQ criteria, roles, workflow settings, document status and version, committee.
- **Audit page**: server-side pagination (25/50/100/200 per page, first / previous / next / last, true total), filters that filter on the server (event class, user, record type, date range, free text over action, record number or name, person, IP), previous and new values in the rows, IP and device, expandable large values, CSV export of the filtered trail (itself an audited download). Loading, empty and error states.
- **Immutability, server-side, two layers**: (1) the application's database client refuses `update`, `updateMany`, `delete`, `deleteMany` and `upsert` on audit history from any code path; (2) every non-GET request to an audit path is refused (405) before it reaches a controller. A database-level trigger script is provided for a DBA (see §6).

### Pagination across the whole module

- **Every data table in the procurement workspace is paged**, by one generic mechanism (not page by page): 25 rows a page (10 / 25 / 50 / 100 selectable), First / Previous / Next / Last, "Showing 26–50 of N · Page 2 of M". It works with each page's own filters (the filters choose the matching rows, the pager pages those, a filter returns to page 1) and leaves the audit trail and the vault list to their own pagers. Verified on all 19 pages of the module (plans, requirements, requisitions, tenders, quotations, evaluation, vendors, contracts, purchase orders, goods received, invoices, AI capture, accounts, documents, reports, approvals, audit, settings, analytics and the command centre): no table shows more than 25 rows and every longer table has a pager.
- **The registers now hold all their data.** Six registers were asking the API for its default first 50 records, so anything older never appeared (purchase orders showed 50 of 314, goods receipts 50 of 224, tenders 50 of 174, invoices, quotations, requisitions likewise). The loaders now read every page (200 at a time), so the pager pages the complete register.

## 3. Other fixes made on the way

- The audit list failed with "Out of sort memory" on deep pages (wide rows carrying JSON): the sort now runs on ids only.
- A page of workflow events exceeded 2 MB (each row carried a whole approval route): very large values are clipped in the list and read in full from `GET /procurement/audit-events/:id`.
- The user filter offered only the 100 most active people: it now lists everyone who has acted.
- A document staff filed in the vault with type "Vendor compliance document" was shown as a sealed, read-only vendor original: stored vault documents are now treated as vault documents.
- Closing a related-record link from a document remounted the runtime and lost the request: the hand-over is now carried on the page.
- The audit KPI "Events today" is counted by the server, not from the 200 rows loaded.
- The runtime patch script's "already applied" markers can no longer collide with the code they insert.

## 4. Interpretation decisions

- **A preview counts as a file access**, so opening a document is a *File download* event (action `DOCUMENT_PREVIEW`); a saved download is `DOCUMENT_DOWNLOAD`.
- **Record closure** = a record reaching a terminal state: contract terminated, document archived, finance handoff Closed.
- **Assignment** = appointing an evaluation committee and delegating an approval.
- **Related transaction must exist.** A document's related record is chosen from real records and refused if it is not found; a template or generated record's label is not a record number, so those uploads are filed unlinked with the label in the description.
- **Integration transaction** = the ledger journal posted when an invoice is paid.
- **Control blocks and access denials** (policy blocks, sealed-bid denials) stay on the trail as "Other (control blocks)", not forced into one of the eighteen.
- **Sign-out** does not revoke a token (tokens are stateless); it records that the person ended their session.
- **Database triggers** need SUPER on this database; the application account has none, so the enforced layer is the application guard and the trigger script is an optional DBA step. Raw SQL by a DBA is the only way to alter history.

## 5. Migration log (in order, this task)

1. `npm run db:migrate:document-audit` (idempotent):
   - `audit_logs.event_type` + index `(event_type, createdAt)`, back-filled for all existing rows from action and record type;
   - `procurement_documents`: `original_name`, `extension`, `related_record_type`, `related_record_id`, `current_version_no`, `checksum` + index;
   - new table `procurement_document_versions` (document, version number and label, file, size, type, checksum, note, uploader, time) with a foreign key to the document; every existing document gets its version 1 row.
2. `npx prisma generate` (only; `prisma migrate` and `db push` are never used).

Earlier migrations from the same programme (already applied, in order): `db:migrate:user-status`, `nts-remaining`, `user-master`, `vendor-master`, `planning-requisitions`, `sourcing-evaluation`, `procurement-permissions`, `p2p-controls`.

Optional, by a DBA with SUPER: `scripts/audit-immutability-triggers.sql` (database-level refusal of UPDATE / DELETE on `audit_logs`).

## 6. Deploy notes (nothing was deployed)

- Run migration 1 on dev's database, then `prisma generate`, then restart the API.
- The real storage service (`:3050` remote) must accept uploads up to 100 MB; the local mock was raised to 150 MB.
- Ask a DBA to run `audit-immutability-triggers.sql` if a database-level guard is wanted; the API is enforced without it.

## 7. Test evidence

- API suite `scripts/_uat/documents-audit-e2e.ts` (backend repo): every format uploaded, previewed and downloaded byte for byte; refusals; versioning; related record; 60 MB and over-limit files; all 18 event classes triggered deliberately, each with timestamp, user, action, record, record ID, IP and device, previous and new value where it applies; pagination, every filter and their combination; CSV export; 33 attempts to edit, delete or forge audit entries through the API as officer, manager and administrator (none succeed); no route writes audit; the application guard refuses all five write operations.
- Browser suite `scripts/_uat/documents-audit-ui.mjs` (frontend repo), one real visible window: the vault pager (25 a page, Next, page size, Last, filters, no-match, Clear), upload, preview and download each of the eight formats through the vault forms; versioning from the row menu, the preview and the legacy form; related-transaction links opening the purchase order and the vendor record; a 45 MB upload and download; Receive / Upload; vault search; banner contrast in light and dark; the audit page paging, page size, every filter, previous and new values, IP and device, export, large-value expansion; Login, Logout, uploads and downloads made in the browser found on the trail from that browser. Screenshots in `design-refs/documents-audit/screens/`.
- Tables: every module page walked in the browser (no table over 25 visible rows, each long table paged), Next / page size / Last exercised, and the purchase order, goods receipt and tender registers each shown to hold every record the server has.
- Regressions after the changes: purchase-to-pay API 181/181, sourcing 210/210, planning 165/165, user master 69/69, vendor master 78/78, vendor portal adversarial 56/56.

## 8. Known limits

- The local database occasionally refuses a connection for a moment (P1001); test setup retries.
- The first click on a row's "…" menu is occasionally swallowed while the runtime is still enhancing the row; a second click opens it.
