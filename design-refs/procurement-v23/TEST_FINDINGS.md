# Test findings — Procurement V23

**Engagement:** Procurement V23 end-to-end (UI to backend) · branch `feature/procurement-v23-live` (both repos)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only after it has been reproduced.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 1 |
| HIGH | 0 | 0 | 4 |
| MEDIUM | 0 | 0 | 2 |
| LOW | 0 | 0 | 1 |

The table counts the numbered findings below. **Cycle seven** (12 September 2026, see its section) found and
fixed, on dev only: HIGH — buttons dead after any sidebar navigation (D1); HIGH — journal posting blocked by
CORS, dev and production; MEDIUM — grants missing for 4–5 s after each navigation; MEDIUM — audit trail missing
plans, contracts, documents, invoice readings and vendor submissions; LOW — Contract value overstated. Two LOW
vendor-portal defects were handed off. **None of it is on production yet.**

## Deployment — 11 September 2026

Every finding below is deployed to **production** (NVCCZ) and **dev** (Arcus).

| | Production | Dev |
|---|---|---|
| API | nvccz `321fcdc` | nvccz `321fcdc` |
| Staff, vendor, LP portals | staff nvccz-new `9cceab1`; vendor and LP `a3da504` (no vendor or LP code changed after it) | `9cceab1` |
| Migrations | `db:migrate:all`: 141 ok, 0 failed | `db:migrate:all`: 0 failed |
| Rollback images | `nvccz-prod-api:pre-uat-20260911`, `nvccz-prod-api:pre-reject-20260911` | `arcus-dev-api:pre-uat-20260911` |

**Environment:**
- `VENDOR_PORTAL_BASE_URL` set on both APIs; `PUBLIC_VENDOR_PORTAL_URL` set on the production staff build.
- The previous env files are kept as `*.bak-20260911-vendorlinks`.

**Deploy blocker found and fixed.** Five Performance migrations called the seed-only
`assertDevDatabase` guard, so `db:migrate:all` refused `nvccz_prod` and the API was not swapped.
- Production's tables already matched dev column for column.
- Those five were run once with the guard's own override, and the guard calls were removed from
  the scripts (nvccz `eeb975a`).

**Verified on production, read-only** (no email sent, no record written):
- **API:** health 200, 0 restarts; staff routes 401 without a token; the invoice reject route is
  compiled in.
- **Grants:** procurement permissions `--check` would add 0; RFQ award backfill would change 0;
  performance role permissions would grant 0.
- **Vendor links:**
  - Inside the API, the RFQ invitation and PO invoice links resolve to `https://vendor.nvccz.online/…`.
  - The staff host forwards both paths there with the token intact (307).
  - The vendor pages answer 200.
  - `GET /procurement/vendor-portal/purchase-order` refuses a missing or forged token.
- **Staff build:** carries the live V23 bridge, the invoice rejection call and the refused controls.
  The vendor build carries the token invoice page. LP login 200.

**Verified behaviourally locally, and on dev where no email results:**
- the authorisation probe (every asserted cell matches; on dev the one mismatch is a PO create that
  needs a vendor dev does not have);
- the V23 actions UAT (steps 1–11);
- the quotation integrity probe;
- the vendor invoice link probe.

A full requisition-to-invoice run was not repeated on production: mail there is not redirected, so
it would have emailed real vendor addresses. On dev it was run in cycle four with all mail blocked.

---

## Cycle four — gap closure, 11 September 2026 (dev only)

The controls that cycle three still refused, and the screens that still showed fixture data, were
connected to the backend.

**Deployed to dev only.** Production still runs the builds in the table above.

| | Dev |
|---|---|
| API | nvccz `d83bea1` |
| Staff portal | nvccz-new `5eab544` (later commits change only the UAT script) |
| Migrations | `db:migrate:all`: 142 ok, 0 failed; adds `procurement_documents`, `procurement_contracts`, `procurement_plans`, `procurement_plan_items` |
| Rollback image | `arcus-dev-api:pre-uat-20260911` |

### What was connected

| Screen | Control | Backend |
|---|---|---|
| Invoices, Accounts | Record payment | `GET /cashbook/banks`, `POST /procurement/invoices/:id/payment`; posts the expense journal |
| Invoices | three-way match column | `ProcurementInvoiceMatchService`: MATCHED, DISCREPANCY, AWAITING_RECEIPT or NO_PO, per-line flags; runs on capture and on every GRN change; `POST /procurement/invoices/:id/match` |
| Purchase Orders | Create PO (save draft, or save and send), Send selected | `POST /procurement/purchase-orders`, only from an APPROVED requisition, once |
| Requisitions | unit estimate, budget notice | line estimates stored and totalled, never copied onto an RFQ; the notice reads approved plans |
| Annual Plan | create, edit, add line, submit; approve or reject in the Approval Centre | `/procurement/plans`; the author cannot decide, and a rejection needs a reason |
| Contracts & Awards | create from an award or standalone, edit a draft, activate, terminate | `/procurement/contracts`; one live contract per award; expired by date |
| Document Vault | upload, upload a new version | `/procurement/documents` on the shared upload service |
| Accounts | payables tab, journal queue, bank file export | live invoices; the export lists unpaid approved invoices only |
| Reports Vault | Run, PDF, Excel, CSV | exports the live records the report is named for |

- **New grants:** `procurement.plans.view|manage|approve`, `procurement.contracts.view|manage`,
  `procurement.documents.view|manage`.
- **Seed:** creates the department head, Finance Manager and Internal Auditor personas when a
  database lacks them, and never changes existing ones.

### Verification

**Local**, `scripts/_uat/procurement-v23-actions.mjs`: 17 steps through the real screens, each
checked through the API afterwards.
- 16/17 in one run. Step 16 timed out opening the contract row menu; the script now waits for the
  reloaded register, and step 16 then passed on its own.
- The new steps:

| Step | Result |
|---|---|
| 12 Officer raises and sends a PO from an approved requisition | `REQ_20260911_0029`, estimate prefilled → `PO_20260911_0014` SENT, requisition CONVERTED_TO_PO |
| 13 Accountant records payment of an approved invoice | `INV_20260911_0008` USD 2,702.70 → PAID, journal posted |
| 14 Manager creates an annual plan with a line | `APP-2026-003` DRAFT, 1 line, planned 42,000 |
| 15 Author submits, Finance Manager approves | `APP-2026-003` → APPROVED |
| 16 Manager creates a contract from an award and activates it | passed on rerun |
| 17 Officer files a document in the vault | v1.0, under review, in Tenders & Bids |

**Dev**, with the mail guard on (all mail blocked; 56 emails blocked during the API run):
- API health 200, 0 restarts. Grants `--check` would add 0; RFQ award backfill would change 0.
- Authorisation probe: every cell matches the policy except a valid PO create, which read 400
  because dev had no usable vendor at the time.
- Procure-to-pay through the API: requisition, RFQ to 3 vendors, award, PO, GRN, invoice, approval.
- Production build of the staff portal, fresh page loads as five roles on eight V23 screens: all
  render, with no page errors.
- Accounts: 1 live payable and no fixture payment batches. The bank export lists
  `INV_20260911_0001`, USD 2,702.70, Approved.
- Requisition form as the Procurement Officer: "No approved procurement plan covers Procurement for
  FY 2026, so this request is not checked against a budget."
- The 17-step UI suite against the dev build, each step checked through the dev API: **all 17
  pass.**
  - The first full run passed 15. Steps 1 and 15 failed when the test machine's connection dropped
    ("fetch failed"), not on the server.
  - The script now retries reads over a dropped connection. Steps 1, 14 and 15 were rerun: 3/3.
  - No page errors on any step. The mail guard was turned off after each run.

| Step | Dev result |
|---|---|
| 1 Operations head approves PR-B | `REQ_20260911_0002` → APPROVED (rerun) |
| 2 Manager awards RFQ-B | `QUO_20260911_0005` accepted, `PO_20260911_0002` SENT |
| 3 Operations member raises a requisition | `REQ_20260911_0007` PENDING_APPROVAL, Operations |
| 4 Officer registers a vendor | created, tax clearance ACTIVE |
| 5 OCR extraction is refused | invoices 1 → 1, nothing saved |
| 6 Officer sends an RFQ from PR-E | `RFQ_20260911_0004` from `REQ_20260911_0005`, 1 vendor |
| 7 Officer scores RFQ-C bids | scores 70, 80, 90 stored, evaluation complete |
| 8 Manager awards RFQ-C | `QUO_20260911_0007` accepted, `PO_20260911_0003`, RFQ AWARDED |
| 9 Officer records a GRN against PO-B | `GRN_20260911_0002` RECEIVED |
| 10 Accountant captures the invoice for PO-B | `INV_20260911_0002` DRAFT, USD 1,605.45 |
| 11 Finance Manager rejects the invoice | `INV_20260911_0002` REJECTED with the reason |
| 12 Officer raises and sends a PO from an approved requisition | `REQ_20260911_0008`, estimate prefilled → `PO_20260911_0004` SENT, USD 831.60 |
| 13 Accountant records payment | `INV_20260911_0001` USD 2,702.70 PAID, journal posted |
| 14 Manager creates a plan with a line | `APP-2026-002` DRAFT, 1 line, planned 42,000 (rerun; the first run's `APP-2026-001` stays a draft) |
| 15 Author submits, Finance Manager approves | `APP-2026-002` submitted, then APPROVED (rerun) |
| 16 Manager creates a contract from an award and activates it | `CTR-2026-0001` ACTIVE, USD 1,362.90, UAT P2P Stationery World |
| 17 Officer files a document in the vault | v1.0 under review in Tenders & Bids |

Page loads on dev took 78–130 s from the test machine. The server answers in 0.06 s; the delay is
the test machine's link to the VPS.

### Still not built

- OCR invoice extraction, eSignature, vendor messaging and document requests;
- asset capitalisation and transfers, GRN accruals;
- budget enforcement (the notice warns and does not block), per-criterion bid scoring, plan import.

---

## Cycle five — full UI test as every role, 11–12 September 2026 (local)

**Method.** Each of ten seeded personas used the module through the browser:
- `scripts/_uat/procurement-v23-explore.mjs` opens every page as each role and operates every tab,
  button, row menu, select, search and modal control from a clean page. It records what each one did:
  navigation, modal, toast, download, API call, in-place change, nothing, or a page error. Controls
  that write through the API are listed, not clicked.
- `procurement-v23-screens.mjs` takes full-length screenshots of all 18 pages for all 10 roles, which
  were reviewed by eye.
- `procurement-v23-workflows.mjs` fills in the forms and takes the decisions the 17-step actions
  suite does not cover, and checks what must refuse.
- Each test user starts with a session for their own account, the same one the login page issues.
  Everything after that is clicks in the browser.

### Found and fixed

UI nvccz-new `8270439`, `b7b1d8a`, `db218d2`, `61c58fa`, `1c9e2b8`, `4c29f44`; API nvccz `40774bf`.

| Area | What the tester saw | Fix |
|---|---|---|
| Vendor Registry compliance filter | Valid / Expiring / Expired / Review each said "Showing vendors with … compliance records"; all 12 vendors stayed on screen | Shows only the vendors with that tax-clearance status and says how many; choosing it again shows all |
| Analytics headline, Remaining, Variance | "$21,772 committed against $550,000 of approved plans… 4%": 2026 orders measured against FY 2027 plans | This fiscal year's orders against this fiscal year's approved plans; says when no plan covers the year |
| Sidebar, requester and department head | Every page offered; pages without the role's grant rendered as empty registers | Sidebar by grants; a page opened by URL says the role lacks it |
| Requisitions, head of another department | "Awaiting my decision 4" and another department's requests offered for decision | The approver queue holds only what that approver can decide |
| Requisitions, requester | A draft or rejected request could not be corrected or resubmitted; the edit form changed only the browser's copy and carried sample text | Edit request on drafts and rejected requests; Save draft, or Save and submit |
| Filter bar, 19 pages | Apply said charts, KPIs and tables now used the filters; nothing changed | Registers filter by status, department and year; the toast says how many rows match and that cards are not filtered |
| KPI cards | "Approved plan: no procurement plan is recorded yet" beside 3 approved plans; invoice, accounts payable, quotation, evaluation and analytics cards blank | Figures from the records where they answer; the others say why not |
| Charts and analysis headlines | Empty charts beside 14 purchase orders; headlines such as "$5.12m committed against an $8.24m plan" | Charts and headlines drawn from records |
| Document Vault | Folder tiles such as "Invoices & AP 4,102 records"; "7 files require review"; "12 active secure links" | Counts from stored files; sharing marked as not tracked |
| Vendors, purchase orders, contracts | Every vendor under "Specialist review" for tax clearance, because the vendor record holds no country; "Document gaps: Complete" with no documents; "Automated reminders active" | An unknown country is not non-resident; "Not on file"; no reminder claim |
| Bid Evaluation | "Tenders ready for evaluation" listed awarded tenders | Only tenders with bids and no award |
| Command Centre | "Pending approvals" counted every pending requisition; "My approval queue" listed the latest requisitions | Both show the user's own decisions |
| Generated documents | Letterhead of a sample company ("Matanho Holdings Limited · Company No. 12345/2024") | The company profile, else the organisation's name; the Matanho logo only on Matanho |
| Invoices | The OCR queue "captured" sample files such as invoice_aug_001.pdf | Refused, since OCR is not connected |
| Accounts | Payment said "the accounting entries were posted", but its journal stays PENDING and Post was hidden | A pending journal can be posted from the queue; the payment message says it awaits posting |
| Contracts, Vendors, Plan | Signature queue tabs crashed the page; the vendor inbox crashed; Actuals vs Plan showed sample observations and crashed on a department | eSign and the inbox are refused; observations come from approved plans; the crash is guarded |
| Activity menu, Document Vault | "Secure link copied: expires in seven days"; "Replacement request prepared", with nothing created or sent | Share copies the page's own link; replacement requests are refused |
| Any form a role cannot complete | A Buyer could fill in the whole Create PO form before being refused | The opener checks the role's grant first |
| Error messages | A user saw "Invalid `prisma.procurementInvoice.count()` invocation: Can't reach database server…" | The API and the page show a plain message instead of internals |
| Plans | FY 2027 plans numbered APP-2026-### | Numbered by the plan's fiscal year |
| Empty registers | Column headers and nothing else | "No records to show yet." |

Found while fixing: on a Windows checkout the runtime patch script silently dropped bridge edits
(CRLF line endings). After the first merge every V23 page threw `__pr23PageAllowed is not defined`.
Fixed in `db218d2`; the script now stops if the bridge does not land.

### Workflows

`procurement-v23-workflows.mjs`, local, each checked through the API afterwards: **15 of 15 pass**.

| Workflow | Result |
|---|---|
| W1 Requester saves a draft, edits it and submits it | `REQ_20260911_0034` PENDING_APPROVAL; one requisition with that title |
| W2 Operations head rejects a requisition with a reason | `REQ_20260911_0035` REJECTED with the reason |
| W3 Requester corrects the rejected requisition and resubmits it | `REQ_20260911_0035` PENDING_APPROVAL; an unchanged resubmission is refused by the API |
| W4 Procurement Manager approves one receipt inspection, rejects another | `GRN_20260911_0006` APPROVED; `GRN_20260911_0002` REJECTED |
| W5 Finance Manager approves a captured invoice | `INV_20260911_0010` APPROVED |
| W6 Officer saves a PO as a draft then sends it; sends two drafts with Send selected | `PO_20260911_0015` DRAFT → SENT; `PO_20260911_0016`, `PO_20260911_0017` SENT |
| W7 Procurement Manager terminates an active contract | `CTR-2026-0004` TERMINATED |
| W8 Finance rejects a plan; its author adds a line and resubmits | `APP-2026-004` SUBMITTED with 2 lines |
| W9 Officer uploads a new version of a vault document | v1.0 → v2.0 |
| N1–N4 must refuse | No title: nothing saved. Plan author: not offered their own approval. Payment without proof: not paid. Buyer: refused before Create PO opens |

The first run passed 11 of 15:
- W1 and W2 were test errors: a required field was left empty, and Reject sits in the Review modal.
- W3 depended on W2.
- N4 was the real gap listed above.

### For you to decide (unchanged)

- Finance can approve an invoice whose three-way match is still awaiting receipt: W5 approved
  `INV_20260911_0010` at AWAITING_RECEIPT. Block it, require a reason, or allow it?
- Approval Centre "Group queue" shows the same prompts as "My approvals"; no group routing exists
  behind it.
- A requester and a department head hold no procurement grants, so the module's landing page (the
  Command Centre) now tells them their role does not include it and links to Approval Centre and
  Purchase Requisitions. Should those roles land on their own queue instead?

### Still not built

eSignature, vendor messaging, withholding tax, fixed-asset transfers, evaluation committees and
declarations, report schedules and download logs, and budget enforcement.

OCR extraction left this list on 12 September 2026; it is built and verified in cycle six below.

### Re-crawl on the fixed build

Every page operated again as all ten roles:

| Role that clicked everything | Problems flagged | KPI cards without a live figure | Success messages with no API call |
|---|---|---|---|
| System Administrator | 38 → 16 | 46 → 23 | 16 → 9 |
| Procurement Manager | 44 → 17 | 46 → 20 | 16 → 11 |

What remains in those counts is not defect: clicking the tab that is already open, clearing a filter that
was never applied, the refusals the openers now raise ("Your role does not have permission for recording
invoice payments"), honest filter and export messages, and cards that now say what is not measured.

Two page loads failed during the crawl. Both were the local Next dev server failing to serve a chunk
under crawler load ("Loading chunk app/layout failed", "Invalid or unexpected token"); each page opens in
3–12 seconds on its own, and the Audit page was re-crawled cleanly afterwards (8 controls, none flagged).

Sidebars follow grants: the requester and the Operations head see Approval Centre, Purchase Requisitions
and Configuration; the Accountant has no Plan, Tenders, Quotation Comparison, Bid Evaluation or Audit;
the rest see what their grants allow.

Checked in the browser after the last two fixes:
- Vendor Registry compliance filter: Valid shows 8 of 12, Review 4 of 12, and choosing the same status
  again shows all 12.
- Analytics: "$21,772 committed in FY 2026 · 17 purchase orders this year… No approved procurement plan
  covers FY 2026", with Remaining and Variance saying the same, because the three approved plans are FY 2027.
- Audit & Compliance: the three blank cards say what is not measured.

### Deployed to dev and confirmed there

12 September 2026 · API nvccz `40774bf`, staff portal nvccz-new `4c29f44`.

| | Dev |
|---|---|
| API | built, `db:migrate:all` exit 0, health 200 |
| Staff portal | rebuilt and swapped (stamp 20260912-001122) |
| Mail | blocked for every test run and restored afterwards; 58 messages blocked while the data was rebuilt |

- **Actions suite, 17 steps:** 11/17 on the first pass. Steps 1, 2, 6, 7, 8 and 9 failed only because the
  previous dev run had consumed the procure-to-pay dataset — a requisition to approve, an un-awarded RFQ,
  an approved requisition to source. After `dev_p2p_flow.py` rebuilt it, those steps and step 10 were
  rerun: **7/7**.
- **Workflows:** 14/15, then W4b on rerun: **15/15**. W4b had failed because W4a consumed the only goods
  receipt awaiting inspection; the test now arranges its own, and rejected `GRN_20260911_0005` on dev.
- **Screens:** 54 full-length pages for the Procurement Manager, the requester and the Accountant, none
  failed. The manager's Command Centre shows Approved plan $450,000 across 3 approved plans, Committed
  spend $8,374 from 8 purchase orders, AP exposure $832, Pending approvals 0 with "Nothing awaits your
  decision", a monthly spend line drawn from records, and Spend by category at Operations 100%. The
  requester's sidebar carries only Approval Centre, Purchase Requisitions and Configuration & RBAC.

**Production:** unchanged. It still runs the cycle-three build (API `321fcdc`, staff `9cceab1`); nothing
from cycle four or cycle five is deployed there.

---

## Cycle six — AI invoice capture, 12 September 2026 (local and dev)

**What was asked.** Replace the fixture OCR queue with real extraction — an LLM reading the document,
the way the portfolio module reads an application — and give it a page.

**What was built.** Procurement → **AI Invoice Capture** (`intake`), in the sidebar between Invoices &
3-Way Match and Accounts. One PDF at a time: it uploads, Suite 06 reads it (pdf-parse → LLM → strict
JSON), and every field comes back with the model's own confidence beside it. "Capture this invoice"
opens the existing capture form with the reading carried across. The invoice is still written by
`POST /procurement/invoices`, so three-way matching, approval and payment are untouched.

UI nvccz-new `1ae2c63`; API nvccz `b9e86f6`, `09a19ad`.

### Why a new endpoint

Suite 06 already had an intake pipeline, but `POST /procurement/suite06/intakes` demands a vendor, a
purchase order **and** a goods receipt before it will read anything, and its `create-draft-bill` writes a
**PurchaseInvoice** — a different register from V23's **ProcurementInvoice**. Neither suits the desk that
opens the post. `POST /procurement/suite06/extract-for-capture` takes one PDF and returns the fields in a
single call. Where the vendor is known (named, or resolved from the purchase order) the reading is stored
as a `VendorInvoiceIntake`, so it reaches the verification queue and feeds the per-vendor correction map;
the schema already made both links nullable. Without a vendor the PDF is still read and nothing is stored,
because refusing to read an invoice merely because nobody has picked the vendor yet would be worse.

### What it says when it cannot read

| Situation | What the operator is told |
|---|---|
| Scanned PDF with no text layer | 400 — "most likely a scan with no text layer. Capture this invoice by hand." |
| Model unreachable, or the read timed out | 503 — "could not be reached… capture this invoice by hand, or ask an administrator" |
| Extraction not configured on the server | 503 — capture by hand, or set `LLM_API_KEY` |
| Below the 0.85 confidence threshold | The page says so and asks for every field to be checked against the PDF |
| Role without `procurement.intake.manage` | Refused before the upload, so no LLM call is spent |

### Found and fixed while testing

| What the tester saw | Fix |
|---|---|
| Unit prices on the review screen read $7, $14 and $4 for a $6.50, $14.25 and $3.80 invoice — the runtime's `money()` rounds to whole dollars | Extracted amounts render to the cent, in the invoice's own currency |
| An unreachable model would have surfaced as a bare 500 | A network failure or timeout answers 503, saying to capture by hand |

### Results

`scripts/_uat/procurement-v23-ai-capture.mjs` drives the page in a browser as the Accountant.

| | Local | Dev |
|---|---|---|
| Extraction through the API | 200 in 2s | 200 in 2s |
| UI checks | **12/12** | **12/12** |
| Guard: manager / requester / accountant | 403 / 403 / 200 | 403 / 403 / 200 |

Read from the test invoice in both places: `INV-SW-4471`, 2026-09-08, USD, VAT 15%, three lines
(40 × $6.50, 12 × $14.25, 25 × $3.80) at 0.98 confidence, filed as `VIN-2026-0001` on dev.

### Deployed to dev and confirmed there

12 September 2026 · API `09a19ad`, staff portal `1ae2c63` (stamp 20260912-025314).

| | Dev |
|---|---|
| API | built, `db:migrate:all` 142 ok / 0 failed / 6 skipped, IMAGE_MATCH, health 200 |
| Staff portal | rebuilt and swapped, healthy |
| Mail | guard on for the run and restored afterwards; the run saves no invoice, so no mail was produced |

Two false alarms, recorded because both cost time and neither was a defect:

- **The dev container looked to have no outbound HTTPS.** `wget` inside the image called every host
  unreachable, npm and Google included. The images carry no CA certificates, so busybox wget fails TLS
  validation and cannot be told apart from a blocked network. Node's own `fetch` — what axios actually
  uses — reaches the model host (401/421/200).
- **AI Invoice Capture appeared to be missing from the dev sidebar.** The deployed chunk was correct all
  along. `scripts/_uat/_routes.mjs` mints its login token from `NEXT_PUBLIC_API_BASE_URL`, which
  `.env.local` pins to the local API, so the dev run signed in against the *local* database and was
  bounced to `/login`. Dev sweeps need `NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api`.

### Needs an administrator, not code

`src/config/llmGlobals.ts` carries a literal API key on line 13, tracked in git since `d53ca49`
(4 May 2026). Every environment without `LLM_API_KEY` falls back to it — dev included — so invoice
reading on dev currently runs on that key. It should be rotated and moved into the environment.

### Promoted to production — 12 September 2026

Cycles four, five and six went to production together: API `321fcdc` → `09a19ad`, staff portal
`9cceab1` → `2a36e93`.

**The stock prod API script would have broken three pages.** `deploy_prod_api_committed.py` states
"No migrations" — true when it was written, but the promoted range adds
`db:migrate:procurement-registers`, and a direct probe found `procurement_documents`,
`procurement_contracts`, `procurement_plans` and `procurement_plan_items` all **absent** on
`nvccz_prod` and all present on dev. Swapping the image alone would have served Plan, Contracts and
Document Vault against tables that do not exist. `deploy_prod_api_registers.py` therefore builds,
tags the running image for rollback, runs the migration from the **new** image, verifies all four
tables, and swaps only then — refusing to swap if the migration fails or any table is still missing.
The migration is additive (`CREATE TABLE IF NOT EXISTS`, no drops, no rewrites) and idempotent.

The prod UI script rebuilds all six portals; this promotion is staff-scoped, so
`deploy_prod_staff_only.py` cut it to `ui-staff`. The other five portals were never touched.

| | Production |
|---|---|
| API | built, migration `MIGRATE_EXIT=0`, four tables created, IMAGE_MATCH, PROD_API_OK, restarts 0 |
| Register tables | absent before → present after (rows=0, awaiting real records) |
| Staff portal | rebuilt and swapped, healthy, restarts 0; "AI Invoice Capture" present in the served chunk |
| Other portals | lp, investee, apply, vendor, events untouched (11–17 hours uptime) |
| Rollback | `nvccz-prod-api:pre-registers-20260912`, `nvccz-prod-ui-staff:pre-registers-20260912` |

Verification on production is read-only by design: it carries no procurement test data and none was
seeded. Reading an actual invoice there needs a real vendor document and a real user.

### Full regression on the promoted build (dev)

AI Invoice Capture was verified on dev when it landed, but the rest of the module was not re-run
against the new build until that gap was pointed out. Both suites were then run on dev against
API `09a19ad` and staff `1ae2c63`, mail guard on and restored afterwards:

| Suite | Result |
|---|---|
| `procurement-v23-actions.mjs`, 17 steps | **17/17** verified through the API |
| `procurement-v23-workflows.mjs`, W1–W9 + N1–N4 | **15/15** verified through the API |

The procure-to-pay dataset was rebuilt first, because the earlier dev run had consumed it.

One test was stale and was rewritten rather than deleted. Actions step 5 asserted "OCR extraction is
refused, nothing saved", which cycle six made false. It now asserts what must still hold: Upload
invoice opens AI Invoice Capture, and merely opening it creates no invoice — the run recorded
`invoices 8 -> 8`. Deleting the step would have quietly dropped the guard against a phantom invoice.

Dev runs need the login pointed at dev as well as the browser, or `seedAuth` mints its token from the
local database and every request 401s:
`API=https://dev-api.matanho.com/api STAFF_BASE=https://dev.matanho.com NEXT_PUBLIC_API_BASE_URL=https://dev-api.matanho.com/api`.

**Production was not redeployed for this.** Everything committed after the promotion is documentation
and test tooling: `09a19ad..HEAD` is empty in the API repo and the staff diff is one markdown file, so
production already runs the exact code these suites passed. The suites are deliberately never run
against production — they create requisitions, vendors, orders, invoices and payments, would need test
personas seeded as real users, and would send real email, since the mail guard covers dev only.

**LLM credentials — settled.** Production deliberately runs on the committed default in
`src/config/llmGlobals.ts`, the same DeepSeek key and base URL the portfolio module already uses for
application scoring. No `LLM_*` variables are set on prod and none are wanted; `getLlmConfig()`
falls through to `LLM_GLOBAL_DEFAULTS`.

Verified on production through the same path the invoice reader uses: `baseUrl
https://api.deepseek.com/v1`, `model deepseek-chat`, `configured true`, `fromEnv false`, and a live
chat round-trip returned `ok`. Extraction therefore works on prod as shipped.

The key being in the repository rather than the environment is a known, accepted trade-off, recorded
here so the next person does not "fix" it by moving it and breaking both modules at once.

---

## Cycle seven — demo readiness, 12 September 2026 (dev)

Worked from `HANDOFF_AND_TEST_PLAN.md`, phases 0 → 6.

### Phase 0 — preflight

| Check | Result |
|---|---|
| Branch, both repos | `feature/procurement-v23-live`; UI `61e756f`, API `09a19ad`; unrelated dirty files left alone |
| Dev health | API `/health` 200, staff `/procurement-v23` 200 |
| Dev runs the §2 SHAs | staff: latest deploy stamp `20260912-082647` (the `61e756f` build); API: the `09a19ad` change is in the compiled controller on dev **and** prod |
| Mail guard | ON (`MAIL_REDIRECT_ENFORCE=true`, no redirect address) |
| Dataset | rebuilt: `REQ_20260912_0013` approved → `RFQ_20260912_0005` → `PO_20260912_0008` → `GRN_20260912_0004` → `INV_20260912_0003` approved; 58 messages blocked during the run |

**One persona cannot sign in on dev.** `perf.sysadmin@nts.local` answers 401 "Invalid credentials" to
the shared test password, which every seed script sets; the other personas sign in. Its password has been
changed on dev outside the seeds. It was **not reset**, because other modules' UAT signs in as the same
account; Phase 3 runs with the nine personas that sign in until someone confirms it can be reset.

### D1 — "Capture this invoice" did nothing after opening the page from the sidebar

**Reproduced on dev** (`61e756f`), as the Accountant, starting on Invoices: sidebar → AI Invoice
Capture → upload `test-invoice.pdf` → choose a PO → Read (98% confidence, three lines) → **Capture this
invoice**. No form, no toast, no route change. At the click the page threw:

```
TypeError: Cannot read properties of null (reading 'classList')
  closeOverlay  ← openModal ← __pr23InvoiceCaptureModal ← invoiceIntakeModalV5   ($('#drawerLayer') is null)
```

(minified frames resolved against the served chunk). The suspects in the handoff — a re-render wiping the
form, the no-open-orders modal, the prefill — were each ruled out by the same trace: nothing re-rendered
and no modal opened.

**Root cause.**
- `RouteTransition` in the root layout renders the page inside `<motion.div key={pathname}>`, so **every
  client-side navigation unmounts the procurement host and starts a new runtime**. The trace shows it: after
  the sidebar click the runtime hydrated twice more, first with the empty payload and then with live data,
  which is the host's mount sequence.
- `destroy()` aborts `__pr23Abort`, but only **7 of the runtime's 22** document and window listeners had
  been given its signal. The other 15 — including the vendored layers' capture-phase click dispatchers —
  stayed attached, bound to the emptied root of the runtime they came from.
- The first stale dispatcher to match a click called `stopImmediatePropagation`, so the live runtime never
  saw it, and then threw against its own empty root.

So after **one** sidebar navigation, every button the host does not claim was dead — not only this one.

**Why no suite saw it.** `actions`, `workflows`, `explore` and `screens` all open every page with
`page.goto`, a fresh load. The AI capture test passed on `1ae2c63` only because `intake` had no route
then, so opening it pushed no navigation. `61e756f` gave it a route, which is what exposed the leak.

**Fix — nvccz-new `b89e968`.** Patch step 24 routes every document and window listener through
`__pr23On`, which adds the abort signal, so `destroy()` removes all of them; the bridge's own change
listener uses it too. Patch `0 missed`, idempotent, `--check` clean; no bare `document`/`window`
`addEventListener` is left in the runtime; typecheck clean for `procurement-v23`.

**New suite: `scripts/_uat/procurement-v23-sidebar-nav.mjs`.** Opens every page in the role's sidebar
*from the sidebar*, checks it stays and the address bar follows, then clicks the page's first opener
(create / new / record / …) and requires something visible — a form, a drawer, a refusal or a page change —
with no page errors. It never confirms a form, so it writes nothing (nvccz-new `c9a7fee`).

**Before the fix** — dev `61e756f`, Procurement Manager, starting on Vendors: navigation was sound on all
17 pages (each stayed, and the address bar followed), but **9/17 pages passed and only 3/11 openers
worked**. D1 was the most visible case of a module-wide fault:

| Page | Opener | After a sidebar navigation |
|---|---|---|
| Annual Procurement Plan | Create plan | **dead** — `Cannot read properties of null (reading 'classList')` |
| Tenders & RFx | Create tender | **dead** — same |
| Quotation Comparison | Create RFQ | **dead** — same |
| Contracts & Awards | Create contract | **dead** — same |
| Purchase Orders | Create PO | **dead** — same |
| Invoices & 3-Way Match | Upload invoice | **dead** — `Cannot set properties of null (setting 'innerHTML')` |
| Document Vault | Upload document | **dead** — `classList` |
| Vendor Registry | Register vendor | **dead** — `classList` |
| Command Centre | New record | works |
| Receiving & Inspection | Record GRN | works |
| Reports Vault | New template | works (honest "not connected" refusal) |

The three that worked are handled by listeners that do not stop the click, so the live runtime still
received it alongside the stale one.

### Phase 1 — result on dev

Staff portal `b89e968` deployed to dev (stamp `20260912-202541`, container healthy, 0 restarts; the served
procurement layout chunk changed from `layout-11f13d9d…` to `layout-bb126c38…`).

| Suite | Before (`61e756f`) | After (`b89e968`) |
|---|---|---|
| `procurement-v23-ai-capture.mjs`, starting on Invoices | 12/13 — Capture this invoice opened nothing | **13/13** |
| `procurement-v23-sidebar-nav.mjs`, Procurement Manager from Vendors | 9/17 pages, 3/11 openers | **17/17 pages, 11/11 openers, no page errors** |

On the after run the capture form opened on the order chosen on AI Invoice Capture
(`PO_20260912_0008 · UAT P2P Office Supplies Ltd`) with that order's two lines, the invoice date
2026-09-08 carried from the PDF, and the unit prices left alone with the reason stated — the PDF's three
lines do not line up with the order's two. The reading was filed as `VIN-2026-0005`.

**Exit criterion met.**

### Phase 2 — regression suites on dev (`b89e968`)

Dataset rebuilt first (`PO_20260912_0009` → `INV_20260912_0004`); mail guard on throughout.

| Suite | Result |
|---|---|
| `procurement-v23-actions.mjs` | **17/17** verified through the API |
| `procurement-v23-workflows.mjs` (W1–W9, N1–N4) | **15/15** verified through the API |
| `procurement-v23-ai-capture.mjs` | **13/13** |

**Exit criterion met: 45/45.** W5 approved `INV_20260912_0006` while its match was still
`AWAITING_RECEIPT` — the current behaviour for the open product decision (§7.1 of the handoff: block,
require a reason, or allow). Nothing was changed; it is recorded so the decision is made knowingly.

### Phase 3 — navigation as every role (sidebar-nav, `b89e968`)

| Persona | Pages | Openers |
|---|---|---|
| Procurement Manager | 17/17 | 11/11 |
| Procurement Officer | 16/16 | 12/12 |
| Buyer | 16/16 | 12/12 |
| Operations member (requester) | 3/3 | 1/1 |
| Operations head | 3/3 | — (no create-style button on its pages) |
| Accountant | 13/13 | 10/10 |
| Finance Manager | 17/17 | 11/11 |
| Internal Auditor | 17/17 | 11/11 |
| System Administrator | **cannot sign in on dev** | |
| Chief Financial Officer | **cannot sign in on dev** | |

Every page, for every persona that signs in, opened from the sidebar, stayed, and kept the address bar in
step, with no page errors. `perf.sysadmin` and `payroll.cfo` both answer 401 "Invalid credentials" to the
shared test password that every seed script sets, so both passwords were changed on dev outside the seeds.
Neither was reset: other modules' UAT signs in as the same accounts.

**A second defect behind the green numbers — grants missing for 4–5 s after every navigation.** "Does
something" counted a form as a pass, but several forms opened for roles that cannot use them, and the
same role got different answers from the same button:

- Finance Manager: **Create tender** opened a form on Tenders & RFx, and then, from Quotation Comparison,
  the same action was refused ("Your role does not have permission for creating tenders and RFQs").
- Internal Auditor: Create tender, Create RFQ, Register vendor, Create contract and Upload document all
  opened forms.
- Buyer (no `intake.manage`): Upload invoice moved them onto AI Invoice Capture instead of refusing.

Measured on dev as the Procurement Manager (no `intake.manage`): after a sidebar navigation the host had no
grants for **4.5 s**. "Upload invoice" clicked in that window opened AI Invoice Capture; clicked after it,
it was refused. The cause is the same remount as D1: every navigation starts a new host with no live
payload, so the host's opener refusals (`refusedOpener`) and the runtime's page grants had nothing to check
against, and every page briefly rendered with no records.

**Fix — nvccz-new `74aa990`.** The host keeps the last live payload at module scope with the auth token it
was loaded under, shows it at once on a new mount when the token matches (grants included), and refreshes
straight away. The sidebar-nav suite now also reads each role's grants from the API — not from the page —
and fails a gated opener that opens for a role without the grant, or is refused to a role that holds it.

**Found in passing, no change:** "New requisition" opens its form for every role, including the Buyer, which
holds no requisition-create grant. It is not one of the host's gated openers; whether any employee may
raise a requisition is a product rule, so it is noted rather than changed.

### Phase 4 — storyline step 6, the vendor portal, end to end

Not verified before this cycle; the P2P flow submits quotations through the public API route, never the page.
Driven in a real browser on dev (the RFQ link is minted inside `arcus-dev-api-1`, so the signing secret
never left the container; mail guard on):

| Check | Result |
|---|---|
| Procurement Officer sends an RFQ for `REQ_20260912_0017` to UAT P2P Office Supplies Ltd | `RFQ_20260912_0012` (201) |
| The vendor's link opens on `dev.vendor.matanho.com/vendor-quotations/rfq-respond` | 200, "Submit Quotation to Arcus", names the RFQ |
| Vendor fills company, contact, email, phone, the line, delivery time and a validity date; submits | the portal confirms; subtotal 227.50 |
| The quotation exists through the API | **`QUO_20260912_0025` SUBMITTED, 262.76** (227.50 + VAT) |

**Two low-severity defects on the vendor page, neither blocking a submission:**
- **A page error on every vendor page:** `Unexpected token '<'`. `<Analytics />` in the root layout injects
  `/_vercel/insights/script.js`; off Vercel that path does not exist, the vendor portal's middleware
  redirects every unknown path to `/vendor-portal` (307), and the browser runs that HTML page as a script.
  Traced with the redirect chain: `307 /_vercel/insights/script.js → 200 /vendor-portal`. The other
  portals whose middleware redirects unknown paths (lp, investee, apply, events) will do the same. The fix
  is in shared code (`middleware.ts` or the root layout), so it was handed off rather than changed here.
- **The page decodes the wrong half of the token.** It reads `token.split('.')[1]` — the HMAC signature —
  as the payload, logs "Error decoding token", and never sets `requisitionId`. The server verifies the token
  itself and ignores the field, so submissions still land.

### Phase 4 — storyline step 12, AI capture saved and compared with the PDF

The AI capture suite never saves. To check the saved invoice against the PDF, a purchase order whose three
lines match `test-invoice.pdf` was raised first through the API (`REQ_20260912_0030` → `PO_20260912_0016`,
UAT P2P Stationery World, SENT, 607.53). Then, in the browser as the Accountant, starting on Invoices:

| Check | Result |
|---|---|
| Upload the PDF, choose `PO_20260912_0016`, read | 98% confidence, filed as `VIN-2026-0006` |
| Capture this invoice opens on that order | yes |
| Invoice date, unit prices and quantities prefilled from the PDF | 2026-09-08 · 6.50, 14.25, 3.80 · 40, 12, 25 |
| Save | no page errors |
| Saved invoice (API) | **`INV_20260908_0001` DRAFT, 40×6.50, 12×14.25, 25×3.80, subtotal 526.00, total 607.53** |

The script's "success message" check read the first toast on screen, which was still the earlier "Read 3
lines…" message; the saved record is the evidence. **Note for the product owner:** the invoice was numbered
from its invoice date (`INV_20260908_…`), not the day it was captured (`INV_20260912_…`), so a late invoice
lands in an old date's series.

### Phase 5 — demo polish: what was fixed, and what is a decision

| Item | Outcome |
|---|---|
| **Contract value `$3,409,800`** | Stale figure from the earlier screen capture; the card read **$22,684** on dev. It is a live figure, but it summed every register row — two terminated contracts, and each terminated contract's award again as an award awaiting a contract. **Fixed, nvccz-new `9ac9e73`:** active contracts plus awards awaiting a contract, and the card says so. |
| **Tax alerts `18`** | Real. All 19 POs on dev belong to the three UAT P2P vendors, none of which has a tax clearance date on file, so each attracts withholding. For a demo, give the vendors clearance dates — a data fix, not code. |
| **Approval Centre "Approval queue" twice** | Decision owed (handoff §7.2). On My approvals the same prompts render as the card grid and again as the queue table; Group queue is every prompt, decided ones included. Not changed. |
| **Invoices & 3-Way Match asks for a tender first** | Kept. The page-head buttons (Upload invoice, Capture invoice, Record payment, AI invoice capture) work without choosing one; the demo path reaches AI Invoice Capture from the sidebar. |
| **Reports Vault and Audit & Compliance mostly "—"** | Each dash states its reason ("No live source for this figure yet"). Acceptable if said out loud in the demo; hiding them is a design decision. |
| **Not built** — eSignature, vendor messaging, withholding tax, asset transfers, evaluation committees, report schedules, budget enforcement, reminder automation | All refuse honestly. Keep them out of the demo script. |
| **Demo data** | Records on dev are named "UAT P2P …" / "UAT WF …". Replacing them with a clean realistic set means deleting test records on dev — **needs the owner's go-ahead**, so not done. |

### Grants after the fix (`74aa990`)

The sidebar-nav suite now reads each role's grants from the API and fails a gated opener that opens for a
role without the grant, or is refused to a role holding it (nvccz-new `8aee3cc`). On dev `74aa990`, starting
on Vendors:

| Persona | Pages | Openers | Grant checks |
|---|---|---|---|
| Finance Manager | 17/17 | 11/11 | 9/9 — Create tender now refused on both pages that offer it |
| Buyer | 16/16 | 12/12 | 9/9 — Upload invoice now refused |
| Procurement Manager | 17/17 | 11/11 | all pass |
| Internal Auditor | 17/17 | 12/12 | all pass — plan, tender, contract, PO, GRN, invoice, document and vendor openers all refused |

(The Auditor's first run timed out on a slow load and passed on the rerun.)

### Found while walking the storyline — two defects behind steps 15 and 18

**Step 18 — the Internal Auditor's trail had no plans, contracts, documents or vendor submissions.**
`GET /procurement/audit-events` reads `audit_logs` filtered to a list of entity types. The registers and AI
capture had been writing rows since they shipped — on dev in 36 hours, 38 `ProcurementPlan`, 11
`ProcurementContract`, 7 `ProcurementDocument`, 6 `VendorInvoiceIntake` — but none of those types was in the
list. And a quotation submitted through the vendor's link wrote no row at all (only approve, reject and score
existed for quotations). **Fix — nvccz `0567a73`:** the four types are listed and labelled by business
number; the portal submission writes `SUBMIT` naming the vendor as actor (a failed audit write is logged and
never fails the submission); the trail falls back to that name when there is no user. nvccz-new `4995f5e`
names the new types on Audit & Compliance.

**Step 15 — posting a journal from Accounts did nothing, on dev and on production.** The Post item (in the
journal row's actions menu) sends `PATCH /accounting/journal-entries/:id/post`, and the browser never sent it:
the preflight answered `Access-Control-Allow-Methods: GET,OPTIONS,PUT,POST,DELETE`. The API's own `cors()`
allows PATCH; the header comes from the Traefik CORS middleware in our compose files, which omitted it.
Read-only preflights confirmed the same header on `dev-api.matanho.com` and `api.nvccz.online`. In procurement,
journal posting is the only live PATCH (the document-status client call has no UI caller). **Fix — nvccz-new
`bb21fd2`:** PATCH added to both `deploy/arcus/docker-compose.dev.yml` and `deploy/nvccz/docker-compose.prod.yml`.
The staff deploys copy those files onto the server; the live files were diffed first and differ from the repo
copies only by this line. Traefik reads labels when the API container is created, so each API is recreated
after its staff deploy.

**Audit trail — verified on dev (API `0567a73`, `db:migrate:all` 142 ok / 0 failed, IMAGE_MATCH, DEV_API_OK).**
Read as the Internal Auditor:

| Record | In the trail now |
|---|---|
| Plan `APP-2026-007` | CREATE, UPDATE, SUBMIT by Proc Manager; **APPROVE by Payroll FinanceManager** |
| Contract `CTR-2026-0004` | CREATE, APPROVE (activation), UPDATE (termination) by Proc Manager |
| Vault document "UAT P2P tender pack" | CREATE and UPDATE (new version) by Proc Officer |
| AI capture reading `VIN-2026-0006` | UPDATE by Proc Payables |
| Quotation `QUO_20260912_0026`, submitted through the vendor portal after the fix (`RFQ_20260912_0013`) | **SUBMIT by "UAT P2P Office Supplies Ltd (vendor portal)"** |

`QUO_20260912_0025`, submitted before the fix, has no row — nothing was written at the time, and nothing is
back-filled.

**Deploying on a flaky link.** Two staff deploys and one vendor-portal walk died mid-run with the VPS healthy
and idle (load 0.17, 25 GB free): `EOFError` inside the 45 MB `sftp.put`, `ConnectionResetError` on HTTPS.
The walk had in fact submitted `QUO_20260912_0026` before its last API check was reset, so it was not re-run.
The staff deploy was re-run through `deploy_dev_staff_resilient.py` (scratchpad): the same packing and remote
build script, with a resumable, sha256-checked upload and the build detached on the server so a dropped session
cannot kill it.

### Test → fix → deploy loop, 13 September 2026 (dev only)

Each round: run the suites and the storyline on dev, read the report, fix, commit, deploy from a clean worktree
at the SHA, run again. Production was not touched (API `09a19ad`, staff `2a36e93`); the mail guard stayed on.

| Round | What the run found | Fix |
|---|---|---|
| 1 — storyline step 3 | A requisition carried one line; the form had no way to add another. | nvccz-new `dc10b9b`: Add line / Remove last line, total recalculated, every line saved. |
| 1 — storyline step 7 | Every requisition raised from the UI was sourced as TECHNOLOGY without anyone choosing it (the Category select defaulted to it), and the API then refused the RFQ to any Office Supplies vendor: "category does not match this requisition sourcing category". | nvccz-new `166e38f`: the requester chooses the category; the RFQ builder takes it from the requisition and lists the vendors registered in it. |
| 2 — actions suite, as the requester | The category list was built from vendors, which a requester cannot read, so it was empty. New requisition also showed the fixture "Matanho Holdings" and "IT & Digital / CC-1001", neither of which is saved. | nvccz-new `3f368d2`: one shared category list for every role and form (requisition, vendor, RFQ); entity and department are the organisation and the requester's own department, read-only. |
| 3 — storyline step 18 | A contract raised from an award had a value of 0: the award read the quotation's price, which is sealed on a public RFQ, even after the award. | nvccz `877d469`: prices are no longer sealed once the RFQ is awarded, closed, cancelled or completed. nvccz-new `14f0793`: the award's value falls back to the purchase order total. |
| 3 — storyline step 9 | Technical scores being typed were wiped a few seconds after the page opened: the fresh load redrew the page even when nothing had changed. The RFQ builder opened with no vendor selected. | nvccz-new `6d0baf3`: an identical payload no longer redraws; the builder opens on the vendors that can be invited. |
| 4 — census (every page and form, as proc.mgr) | Fixture data still in a live session: Preview vendor form named "TechNova Solutions", a 1,280,000 bid, 12 weeks and 36 months against TN-2026-014; the Create tender / RFx, Edit record, Build procurement report, access request and letterhead selects offered Matanho Holdings, Matanho Capital Management, Kariba Agro Limited, Lumina Health Group, Kudu Logistics and Nyanga Hospitality; a record with no owner showed "Group Procurement". | nvccz-new `29346b6`: the runtime's entity list is replaced in place on hydrate with "All entities" and the organisation, so all twenty selects that read it are covered; letterhead choices name the organisation; the bid preview shows what the vendor fills in, with nothing invented. |
| 5 — census text, second pass | More sample content reachable in a live session: Create eSignature Envelope prefilled signer "Tendai Moyo · CEO"; Delegate approval offered "Rudo Ndlovu", "Tinashe Chaka · CFO" and "Tendai Moyo · CEO"; Send document prefilled `approver@matanho.co.zw`; the staff preview of the vendor form offered "Submit to Matanho"; the Document Vault gained two sample vendor submissions (DOC-00201 "GreenGrid Energy · ITF263 Tax Clearance FY2026") whenever the organisation had no Vendor Submissions folder. The browser tab read "Matanho Procurement & Tender Management - V23". Register vendor prefilled the internal owner "Nyasha Moyo \| Group Procurement". Both Send document forms prefilled `procurement.approver@matanho.africa` and announced "Document sent" with no mail backend. Preview on a contract, a purchase order or an award report showed a blank document headed "[object Object] \| v1.0 \| Draft": five handlers passed the document itself to a lookup by id. | nvccz-new `460932b`: the tab reads "Procurement & Tender Management". `b0d330a`: eSignature, delegation, send-by-email and the vendor form preview are refused before their forms open (none has a backend; their final steps were already refused); the vault no longer receives sample submissions. `4c4663c`: a passed document is shown as it is, so those previews carry the contract, order or award; no sample internal owner; both Send document openers refused. |
| 6 — census, Reports | "Manage all templates" showed the Report Templates folder for a moment and then the Document Vault root. Every route change remounts the module, and the new runtime started without the folder the old one had set; the same held for a vendor, an evaluation tender, an invoice match tender, a quotation tender, an approvals tab and an analytics drill-down opened from another page. | nvccz-new `121413d`: the navigation hook keeps the destination page's own sub-view and the next runtime opens on it. Verified on dev: the folder stays open at 0.3 s, 2 s and 5 s; the sidebar still opens Document Vault at its root. |
| 7 — census, Procurement Officer | Send vendor communication offered the sample records TN-2026-014, PO-2026-0584 and CTR-2026-081 as the related record; Request vendor documents proposed a due date already past (5 Aug 2026). Both final steps were already refused. | nvccz-new `07ddece`: Message and Request docs are refused before their forms open, saying vendor messaging is not connected. Verified on dev: each raises its message and opens no form. |
| 4 — census problem list | 17 lines. Probed one by one in a real browser (read-only): 13 were the census itself. A control inside a modal was located page-wide, so Delegate and Preview aimed at the covered button behind the modal and timed out; a refusal toast identical to one still showing was not counted (Run now); the click's own scroll closed the row actions menu it had just opened; tabs that were already selected (Journal queue, Approver queue, My approvals) were reported as dead. The other 4 are expected: Command Centre clicked while on it, Clear with no filter set, a status select inside a form, and Preview tender pack on an empty form (the browser's own required-field bubble). | nvccz-new `8714851`: the census scopes a control to its modal or drawer, counts toasts, scrolls before clicking, and reports "already selected". |

**Verified on dev `6d0baf3` / API `877d469`:** actions 17/17, workflows 15/15, AI capture 13/13, sidebar
navigation 8/8 roles (every page and every gated opener), storyline 20/20 (plan to audit trail, as the people who
do each step, including the vendor's own portal submission).

**Verified on dev `4c4663c` / API `877d469` (after rounds 4 and 5):** dataset rebuilt through the API (58 mails
held by the guard), actions 17/17, workflows 15/15, AI capture 13/13, sidebar navigation 8/8 roles, storyline 20/20.
Checked by hand in a browser: Create tender offers only the organisation; Preview vendor form invents nothing and
offers only Close; a contract preview carries its own agreement (`CTR-2026-0010`); the tab reads "Procurement &
Tender Management"; Edit default letterhead opens in 81 ms; no page errors.

**Verified on dev `121413d` (after round 6):** dataset rebuilt (58 mails held), actions 17/17, workflows 15/15,
AI capture 13/13, sidebar navigation 8/8 roles on the first pass, storyline 20/20.

**Verified on dev `8a81936` and `5072202` (rounds 7–8, the Approval Centre fix, accounting Payables and the polish):**
- In a browser, 15/15 on each build: the Approval Centre renders for the Procurement Manager and Finance Manager
  with decision cards that carry Approve, and all open approvals with who they wait on; accounting Payables shows
  procurement's orders, open RFQs and supplier bills and no sample record; no page errors.
- Regression on `8a81936`: actions 17/17, workflows 14/15 (W8's race, then 1/1 once fixed in `f7cd03c`), AI
  capture 13/13, sidebar navigation 8/8 roles on the first pass. The storyline's step 14 timed out waiting for the
  page while `5072202` was being swapped in; it is re-run on its own below.
- After each run the cleanup removed what the suites had created (on that run: 4 vendors, 13 requisitions, 5 RFQs,
  10 quotations, 8 purchase orders, 4 GRNs, 3 invoices, 1 reading, 3 plans, 2 contracts, 2 documents, 1 cashbook
  entry and 2 journals, with 125 audit rows), and the demo integrity check read 17/17.

The Procurement Manager's first sidebar-navigation run timed out on AI Invoice Capture and passed 17/17 on the
rerun. The suite read the sidebar before the role's grants had loaded: until they land (a few seconds on a cold
first load) every page is listed, and AI Invoice Capture then disappears for a role without the grant. The suite
now waits for the grants (nvccz-new, next commit). A person sees the same brief flash on a cold first load only;
later navigations reuse the loaded grants.

**Seen, not changed:**
- ~~No company profile on dev~~ — set up; see the next section.
- ~~Group queue repeats My approvals~~ — redesigned; see the next section.
- **perf.sysadmin and payroll.cfo cannot sign in on dev.** Their passwords were not reset for this cycle; the
  eight other roles cover the storyline.
- The only other failed request on every page is `/_vercel/insights/script.js` (dev is not hosted on Vercel).

### Dev data, company profile, Approval Centre and accounting — 13 September 2026 (owner's instruction, dev only)

The owner asked for the Group queue to be fixed, a company profile, the dev data cleaned and replaced with realistic
data, and procurement tested together with accounting. Production was not touched.

**Backup first.** `arcus_dev` was dumped before anything was deleted:
`/var/www/projects/arcus/backups/arcus_dev-20260913-063341-pre-procurement-cleanup.sql.gz` (gzip integrity checked).

**Test data removed.** Every procurement record on dev was test data. Removed in one transaction, children first, with
the accounting postings they had created: 11 vendors, 116 requisitions, 45 RFQs, 92 quotations, 67 purchase orders,
32 GRNs (52 lines), 33 invoices, 16 AI capture readings, 25 plans, 14 contracts, 16 vault documents, 14 cashbook
entries, 28 journal entries, and the 1,045 audit rows about them. Nothing outside procurement pointed at those rows
(expenses, sales invoices, statements, reconciliations, contra entries and fund disbursements were all checked first).

**Company profile and people.** The profile names Matanho Investment Management (Private) Limited, procurement@matanho.com,
matanho.com and the Harare head office, so letterheads carry it. Registration and tax numbers are left empty on purpose:
they must come from the organisation, not be invented. The eight demo personas keep their logins and now show realistic
names (Procurement Manager Tafadzwa Moyo, Procurement Officer Rumbidzai Chikwanha, Buyer Tinotenda Marufu, Requester
Kudakwashe Ncube, Accounts Payable Chipo Mlambo, Operations head Farai Mutasa, Finance Manager Blessing Sibanda,
Internal Auditor Rutendo Dube) instead of "Proc Manager" and "Payroll FinanceManager".

**Demo dataset, built through the API** as the person who does each step, with the mail guard on:
- 9 fictional vendors in five categories (example.com mailboxes), with realistic tax clearance dates — one expiring in 12 days.
  The API refused a vendor with an expired clearance, a real rule, so none is seeded that way.
- FY 2026 Operations plan approved by Finance; FY 2027 plan submitted and waiting on Finance.
- Laptops: requisition → RFQ (2 bids, scored) → award → PO → GRN accepted → invoice approved → paid; the expense journal
  posted to the ledger.
- Stationery: received; the invoice waits on Finance. Generator and HVAC maintenance: PO open, 12-month contract active.
- Boardroom furniture: the receipt waits on inspection. Network upgrade: two scored bids, award waiting on the Procurement
  Manager. Welcome packs: RFQ open, no bids yet.
- Requisitions in every other state: approved awaiting sourcing, two pending approval, a draft, one rejected with a reason.
- Three vault documents (plan and maintenance agreement approved, RFQ pack under review).

It was then spread over the past four months in business order — 51 records and their 86 audit rows — and dated
documents renumbered to their day (`REQ_20260913_0001` → `REQ_20260806_0001`), with the 71 copies of those numbers
(quotations, contract, journals, cashbook entry, vault document, audit values) following. The API's next number for a
day is one past the highest suffix for that day, so numbering is unaffected.

The tooling is in `scripts/procurement-ops/dev-data/` (nvccz-new `bba6bda`, `aa76463`) with a README: inventory,
cleanup (test-named records by default, `--all` to rebuild from nothing), profile and personas, dataset, backdating.

**Approval Centre** (nvccz-new `3c80409`, `4f9c686`). "Awaiting me" is a grid of decision cards, oldest first, with
Review, Approve and Reject on each card; "All open approvals" is a table of every requisition, award, receipt, invoice
and plan still open in the registers the role can read, with who it waits on and for how long. The KPIs count the same
records. The eSignature and Delegations tabs (sample envelopes and people, no backend) are gone from a live session.

**The redesign took the Approval Centre down on dev, and why no check caught it.** On `bba6bda` the page showed
Next's "Application error": `ReferenceError: smallAction is not defined`. The bridge runs at the runtime's top level,
and `smallAction` and `actionV6` are declared inside its V5/V6 layers, so the new renderer could not reach them. The
runtime passed `node --check` and the patch script, because both only look at syntax; the regression had just started
and was stopped (its test records were cleaned). **Fix — nvccz-new `8a81936`:** the bridge renders its own buttons
with the same markup, and the patch script now refuses to write a runtime whose bridge calls a helper declared only
inside a layer. Run against the crashed build's runtime, the guard names exactly `smallAction` and `actionV6`; against
the fixed one, nothing.

Two more things surfaced while stopping that run. Stopping its background task did not stop its child processes: the
shell scripts and `node` suites kept running for another quarter of an hour, created test records, and workflows W7
terminated the demo's maintenance contract (it took the first active contract). The processes were found by command
line and killed, the test records cleaned, and the contract restored to active with the termination's audit row
removed; the demo integrity check (`scripts/procurement-ops/dev-data/demo_integrity.mjs`) caught it and reads 17/17
again. And the UAT-only patterns added to the suites in `aa76463` held a literal backspace byte where a word boundary
was meant (the backslash was lost on the way into the files), so they could never match. **Fix — nvccz-new
`5334700`:** real word boundaries, checked against UAT and demo names; W7 terminates only a contract the suites
created.

On the regression run against `8a81936` workflows W8 failed once: it read its plan straight after clicking Submit,
while the "Line added" toast was still on screen, and saw REJECTED; the plan was SUBMITTED a second later (the API
shows it updated at that moment, and no other plan changed). A race in the suite, not the module. **Fix — nvccz-new
`f7cd03c`:** the step polls the plan's status for up to 20 seconds.

**Suites kept off the demo** (nvccz-new `aa76463`). Several steps took the first record in a state — the first draft
invoice, the first receipt waiting on inspection, the first vault document, any submitted plan, the second order in AI
capture's list — which on dev are now demo records. Each takes a UAT record, arranging one where it did before. After a
regression run, the cleanup removes what the suites created and leaves the demo.

**Procurement and accounting, checked as the Finance Manager:**

| Accounting page | What it shows of procurement |
|---|---|
| Journal Entries, General Ledger | The laptop invoice's posted expense journal (`EXP-…-INV_20260822_0001`) and its bank payment (`CB-2BGSVFW9`), USD 11,577.72 — correct. |
| Payables & Payments | **Was wrong.** Open commitments USD 118,600 and a sourcing pipeline of USD 1,988,000 across "3 active RFQs", with the Purchase orders and Quotations & sourcing tabs listing TechNova Solutions, AfriCloud Infrastructure and other sample records: the page read the runtime's own arrays, which nothing replaced. Procurement's supplier invoices did not appear at all (the page read only accounting's purchase-invoice bills). **Fixed — nvccz-new `a44bed9`, verified in a browser on dev `8a81936` (15/15 checks: no sample commitments, pipeline or vendors; the Purchase orders, Quotations & sourcing and Supplier bills tabs show procurement's records; no page errors), polished in `63b7ca7` (a bill is referenced by its invoice number; the date filter covers the last 90 days):** the loader reads procurement's orders, RFQs, quotations and invoices; the Purchase orders tab, open commitments and the pipeline come from them; procurement invoices sit beside accounting's bills (awaiting approval reads Review, approved reads Approved, paid reads Paid); the Sourcing intelligence figures are counted from the RFQs beside them. A role without procurement access sees none (a 403 is not an error). |
| Cash & Liquidity | Cash at bank is computed from posted journal lines (dev's bank shows a net credit). The register lists cashbook batches only, so a procurement payment — a single cashbook entry — is not listed there. Not changed. |

**Decision owed (accounting policy).** A procurement invoice reaches the ledger only when it is paid:
`ProcurementService.approveProcurementInvoice` posts nothing ("accounting entries will be created when invoice is
PAID"), and payment posts the expense (Dr expense and VAT, Cr AP) and the bank payment (Dr AP, Cr bank) together. So an
approved, unpaid supplier invoice is not a liability in the general ledger, trial balance or balance sheet. The platform
already has an accrual path — accounting bills (`PurchaseInvoice`, `POST /procurement/purchase-orders/:id/convert-to-bill`,
and AI capture's intake-to-bill). Recommendation: recognise the bill when Finance approves the invoice and settle it at
payment. That changes what is posted and when, so it needs the accountant's sign-off before it is built.

---

## Cycle 0 — baseline

### What the module renders before any wiring

`scripts/_uat/procurement-v23-baseline.mjs`, as System Administrator and again as Procurement
Officer, 1440px, local stack:

- All 17 pages render with **0 page or console errors**, and the Procurement Officer lands on
  every page (the frontend does not block the role).
- **16 of 17 pages show the vendored demo dataset** — `PR-X8F2-0187`, `TN-2026-014`,
  `TechNova Solutions`, `PO-2026-0584`, `GRN-2026-0219`, `INV-98431`, `FA-000882`, `T. Moyo` and
  others. The local database holds no requisitions, purchase orders, RFQs, GRNs or invoices,
  so none of it can have come from the API. The 17th (Settings) shows the demo role matrix,
  which the probe's markers do not cover.
- The runtime exposes an integration surface: `MatanhoProcurementUI.hydrate`, `getSnapshot`,
  `setBackendAdapter`, `request`, `openApproval`, `openDocument`, `createTender`, and 252 base
  action handlers on `window.MatanhoProcurementHandlers`.
- `hydrate()` accepts 13 of the store's collections. `planItems`, `grns`, `journals`, `assets`
  and the versioned add-ons (`contractsV6`, `bidAwardsV6`, `approvalPromptsV6`,
  `vendorMessagesV6`, `vendorAuditTrailV19` and others) cannot be replaced through it.
- 81 distinct actions appear across the pages; **32 have no base handler** and are either
  handled by one of the later capture-phase layers (V5–V21) or do nothing: `record-grn`,
  `submit-plan`, `add-plan-item`, `invite-vendors`, `create-tender`, `open-evaluation`,
  `sync-accounting`, `export-bank`, `scan-delivery`, `import-plan` and 22 more.

### The local data set was not testable

No local user held any procurement role (PROC_MGR, PROC_OFF, BUYER) or a payables role.
`nvccz/scripts/seed-procurement-test-users.ts` adds one real login per missing persona; the
department head, Finance Manager, CFO, Internal Auditor and System Administrator reuse existing
test users.

---

## PROC-FINDING-001

**Title:** Any LP or investee portal account can use the internal procurement API — reading vendor master data and creating requisitions
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Access Control / Data Isolation
**Severity:** CRITICAL
**Persona affected:** Every vendor on file; the organisation's procurement records
**Surface:** API · `/api/procurement/*`, `/api/procurement/suite06/*`, `/api/procurement-approval-configs/*`, `/api/accounting/vendors/*`, `/api/vendor-quotations/*`

### Steps to reproduce

1. Sign in to the **LP portal** as an LP (`POST /api/auth/login`, `portal: "lp"`). The token
   carries `aud: "lp"`, role `LIMITED_PARTNER`.
2. With that token, `GET /api/accounting/vendors/:id`.
3. With that token, `POST /api/procurement/requisitions` with a title, a department and one item.

### Expected

403 on both. An external portal account has no business with internal procurement.

### Actual

Both succeed.

- **Vendor master data:** `GET /api/accounting/vendors/:id` returns 200 with `taxNumber`,
  `bpNumber`, `contactPerson`, `email`, `phone`, `address`, `paymentTerms`,
  `taxClearanceExpiryDate`.
- **Vendor bank accounts and KYC documents:** `GET .../vendors/:id/banks` and
  `.../vendors/:id/kyc-documents` return 200. The local vendor has no rows, so the arrays were
  empty; the endpoints answered the LP token all the same.
- **Every procurement register and both dashboards:** requisitions, purchase orders, RFQs,
  GRNs, invoices, payments, quotations, approval configurations (accounting's configured
  approval chains by name and stage), Suite 06 intakes and the CFO dashboard — all 200.
- **Writes:** the requisition create returned **201** (`REQ_20260911_0001`, requested by the LP
  account). An Internal Auditor's create also returned 201 (`REQ_20260911_0002`). Both were
  deleted immediately.

Across 28 endpoints the LP account was refused on **2**.

### Root cause

All five routers are mounted with `authenticate` and nothing else. `authenticate` proves a
token is valid, not that its holder is staff. Role logic, where it exists, lives inside
individual controller methods — `createPurchaseRequisition` checks only that a title, items
and a department are present. `requireInternalStaffUser()` already exists for exactly this
case (added for FINDING-006 in the three-module engagement) and was never applied here.

### Fix

`requireInternalStaffUser()` directly after `authenticate` on all five routers. Vendors are
unaffected by design: they never hold a JWT, and their flows (invoice upload and submit,
quotation submit) are public routes declared **before** `authenticate`. No LP, investee or
applicant frontend calls these routers; the applicant procurement flow has its own router at
`/api/applicant`.

Commit `90976cf` on `feature/procurement-v23-live` (nvccz).

### Verification

`nvccz/scripts/_uat/procurement-authz-probe.mjs`, before and after, 11 personas × 28 endpoints:

| | Before | After |
|---|---|---|
| LP account not refused | 26 / 28 | **0 / 28** |
| No token, not refused | 0 / 28 | 0 / 28 (401 throughout) |
| LP `POST /procurement/requisitions` (valid body) | 201 | **403** "This account is not authorized for staff resources." |
| Operations member `POST /procurement/requisitions` | 201 | 201 (legitimate, unchanged) |
| Public vendor routes with no token | reachable | reachable (400 on an empty body) |

**Status:** DEPLOYED to the production API on 11 September 2026 (commit `90976cf`, with the
user's approval) and verified there:

- `requireInternalStaffUser()` is present in both `src` and the compiled `dist` of all five
  routers inside the running container;
- `/health` 200, container restarts 0, no error lines in the log after start;
- `GET /api/procurement/dashboard` with no token returns 401;
- the admin login still succeeds.

Not run on production: the behavioural check with a real LP token. It was run locally (the table above).

---

## PROC-FINDING-002

**Title:** Any staff account can raise purchase orders, approve receipts, approve and pay invoices, award quotations and change vendor bank details
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Access Control / Segregation of Duties
**Severity:** HIGH
**Persona affected:** The organisation's spend and payments; every vendor's bank details
**Surface:** API · `/api/procurement/*`, `/api/vendor-quotations/*`, `/api/procurement/suite06/*`, `/api/accounting/vendors/:id/{banks,blacklist,kyc-documents}`

### Steps to reproduce

1. Sign in as an Operations member with no procurement role (`proc.requester`, role code `OPS_MEM`).
2. `POST /api/procurement/purchase-orders` with a real `vendorId` and one line.

### Expected

403. Raising a purchase order commits the organisation's money; it belongs to the procurement desk.

### Actual

**201**, `PO_20260911_0001`, status DRAFT, total 1.16. The same request as an Internal Auditor
returned 201 (`PO_20260911_0002`) and as an Accountant 201 (`PO_20260911_0003`). All three were
deleted immediately.

The empty-body matrix showed the same for every other desk action. As every staff persona,
PO send, PO-to-bill, GRN approve, invoice approve, invoice payment, quotation accept (the
award), vendor blacklist and vendor bank create reached the handler's own validation instead
of a refusal. RFQ create failed for those roles only because the local vendor had no email
address (400 "Vendors without email").

The inverse was also true. `GET /procurement/requisitions` returned **403** to the Procurement
Officer and the Buyer — the roles that turn approved requisitions into RFQs and purchase orders.

### Root cause

- No route or controller checks the caller's role before any of these actions. Only
  `authenticate` stood in front of them, and after PROC-001 only the staff check.
- `getAllPurchaseRequisitions` admits only a department HEAD, DEPUTY or `PROC_MGR`, and
  filters to the caller's own department.

### Fix

Commit `0847b16` on `feature/procurement-v23-live` (nvccz):

- **Permission catalogue** — `src/config/procurementPermissions.ts`,
  `procurement.<area>.<action>` in the payroll convention, with default grants for 13 roles.
  The grants keep duties apart:
  - running an RFQ and awarding it are separate grants;
  - approving an invoice (Finance Manager, CFO) and paying it (Accountant, Finance Officer)
    are never held by the same non-administrator role;
  - vendor bank details are managed by finance, not by the desk that onboards the vendor.
- **Route guards** — `requireAnyPermission` on each desk action and register.
- **Deliberately staff-wide:**
  - raising your own requisitions;
  - approving or rejecting a requisition (the approval engine decides per record);
  - vendor create and edit, shared with accounting's vendor screen;
  - the approval-configuration list (its create is already administrator-only).
- **Cross-department requisitions** — `procurement.requisitions.view` now sees every
  department's requisitions. Investee fund scoping still applies.
- **Grants migration** — `npm run db:migrate:procurement-permissions`, idempotent, with
  `--check`. Run locally: 169 grants across 13 roles.

### Verification

The same probe, now asserting the policy for each persona: 11 personas × 34 endpoints, plus a valid-body PO.

| | Before | After |
|---|---|---|
| Operations member, valid PO | 201 | **403** "Required one of: procurement.orders.manage" |
| Accountant, valid PO | 201 | **403** |
| Procurement Officer, valid PO | 201 | 201 (legitimate; deleted) |
| Procurement Officer / Buyer list requisitions | 403 / 403 | **200 / 200**, every department |
| Department head list requisitions, approval queue | 200, 200 | 200, 200 (own department, unchanged) |
| Vendor bank details, read | every staff persona | Administrator, Procurement Manager, Accountant, Finance Manager, Internal Auditor |
| Vendor bank details, create | every staff persona | Administrator, Finance Manager |
| Invoice approve / pay | every staff persona | Finance Manager / Accountant (and Administrator) |
| Quotation accept (award) | every staff persona | Administrator, Procurement Manager |
| Asserted cells not matching the policy | — | **0** |

**Status:** DEPLOYED to production and dev on 11 September 2026 (nvccz `321fcdc`). Grants
applied by `db:migrate:procurement-permissions`; `--check` on production would add 0. The policy
probe was run locally and inside the dev API; production has no seeded test personas.

**Deploy note:** the guards and grants must ship together. Run
`npm run db:migrate:procurement-permissions` against the target database before, or with, the
API; otherwise the procurement desk is refused everywhere.

The grants are defaults, not business sign-off, and can be changed per role in Admin → Roles.

---

## PROC-FINDING-003

**Title:** Two quotation endpoints answer 500 where the request is at fault
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Error Handling
**Severity:** LOW
**Surface:** API · `POST /api/vendor-quotations/:id/accept`, `POST /api/vendor-quotations/submit`

### Actual

- `POST /vendor-quotations/:id/accept` with an id that does not exist, as the Procurement Manager
  or System Administrator: **500**. `reviewQuotation` throws, and the controller hands every
  error to `next(error)`, including "not found".
- `POST /vendor-quotations/submit` (public, the vendor's own route) with an empty body: **500**.
- The same submit with a portal token that carries no RFQ id: **500** "Invalid RFQ portal token".

### Expected

404 and 400. A 500 tells the vendor or the desk that the system broke, not that the request
was wrong, and it hides real failures in the error log.

### Root cause

`VendorQuotationService` throws a plain `Error` for every problem, and every controller method
passes it to `next(error)`. The error middleware answers any error without a status as 500.

### Fix

Commit `b7e2163` on `feature/procurement-v23-live` (nvccz). `VendorQuotationController` sets
the status before handing the error on:

- "not found" → 404;
- "already been …" → 409;
- a missing field, or a bad or expired token → 400.

Prisma errors are left alone and stay 500.

### Verification

| Request | Before | After |
|---|---|---|
| Accept an unknown quotation (Procurement Manager) | 500 | **404** "Quotation not found" |
| Reject an unknown quotation | 500 | **404** |
| Read an unknown quotation | 500 | **404** |
| Public submit, empty body | 500 | **400** "vendorPortalToken is required" |
| Public submit, forged token | 500 | **400** "Invalid vendor portal token signature" |

**Status:** DEPLOYED to production and dev on 11 September 2026 (nvccz `321fcdc`); see Deployment at the top.

---

## PROC-FINDING-004

**Title:** Accounts payable cannot capture a supplier invoice — the staff path of the invoice endpoint is unreachable
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Functional / Routing
**Severity:** MEDIUM
**Persona affected:** Accountant, Finance Officer
**Surface:** API · `POST /api/procurement/invoices`

### Steps to reproduce

1. Run a requisition through to an approved goods received note (`nvccz/scripts/_uat/procurement-p2p-flow.mjs` does this).
2. Sign in as the Accountant.
3. `POST /api/procurement/invoices` with the PO id, the vendor id, an invoice date, a due
   date and the invoice lines.

### Expected

201, a captured invoice. The controller has a staff branch for exactly this: it requires an
invoice date and a vendor id when the caller is staff.

### Actual

**400** "vendorPortalToken is required for vendor-submitted invoices". Every staff capture is
refused this way, whatever the role. An invoice can only enter procurement through the vendor's
emailed link.

### Root cause

The route is the public vendor submission route and is declared **before**
`router.use(authenticate)`. Nothing ever reads the Authorization header on it, so `req.user`
is never set, and the controller treats every request as a vendor's.

### Fix

Commit `b7e2163` on `feature/procurement-v23-live` (nvccz):

- **With an Authorization header,** the route authenticates the token, holds the caller to
  internal staff, and requires `procurement.intake.manage`. The controller's staff branch then
  applies.
- **Without a header,** it is still the vendor's token-signed submission, unchanged.

### Verification

| | Before | After |
|---|---|---|
| Accountant captures the invoice for `PO_20260911_0001` | 400 | **201** `INV_20260911_0001`, then approved by the Finance Manager |
| Staff persona without the capture grant | 400 (vendor token demanded) | **403** |
| LP portal token | 400 | **403** |
| No Authorization header, no vendor token | 400 | 400 (vendor path, unchanged) |

The authorisation probe now carries this row, and every asserted cell matches the policy.

**Status:** DEPLOYED to production and dev on 11 September 2026 (nvccz `321fcdc`); see Deployment at the top.

---

## PROC-FINDING-005

**Title:** Procurement V23 showed the vendored demo dataset as the organisation's records, and its forms confirmed saves that were never made
**Module:** Procurement V23 (frontend) · **Dimension:** QAT · **Category:** Data Integrity / Functional
**Severity:** HIGH
**Persona affected:** Everyone who uses the module
**Surface:** UI · `/procurement-v23/*`

### Steps to reproduce

1. Sign in as any staff persona, with no procurement records in the database.
2. Open any V23 page.
3. Raise a requisition, record a GRN, or approve anything.

### Expected

The organisation's own records, or an honest empty state. A save either reaches the API or is
refused with the reason.

### Actual

- **Demo data shown as real (reproduced):** `procurement-v23-baseline.mjs` found:
  - 16 of 17 pages showing demo records — `PR-X8F2-0187`, `TN-2026-014`, `TechNova Solutions`,
    `PO-2026-0584` — while the database held no requisition, RFQ, PO, GRN or invoice;
  - 113 KPI cards carrying fixture literals, such as "Vendors 482" and "Open tenders 8";
  - sidebar badges, the cycle donut ("287 active records"), the spend trend and the category
    bars, all fixed.
- **Saves that never happened (from the runtime source):** the handlers do not call the API.
  - `submitPR` adds a row to the in-browser store and toasts "Approval routing was created and
    the department head was notified".
  - `create-grn-confirm` toasts "GRN created".
  - `approve-prompt-v6` flips the prompt's status in memory.

  Before the fix, the host routed no action anywhere, so none of these could have reached the
  API. This part was established from the code, not reproduced in a browser.

### Root cause

`components/procurement-v23-mock/procurement-v23-app.tsx` mounted the vendored runtime and
nothing else: no loaders, no hydrate, no action routing.

### Fix

nvccz-new `9d3c7fd` and the cycle-two commit on `feature/procurement-v23-live`:

- **Data:** live loaders by grant, and every demo-bearing store hydrated from the API or emptied.
- **Figures:** KPI literals become live figures or an em dash; fixture charts become empty
  states; the donuts, invoice-match chains and attention list are derived from records.
- **Approvals:** prompts built only from real pending decisions.
- **Actions:**
  - connected: raise, submit, approve and reject a requisition; award; approve and reject a
    GRN; approve an invoice; register a vendor; send a PO; and, in cycle three, send an RFQ from
    the tender builder, score bids, award from the award panel, record a GRN, capture an invoice;
  - every other confirm, save or submit step is refused as not connected, so nothing is
    reported as saved when it was not.

### Verification

| | Before | After |
|---|---|---|
| Pages showing demo records (System Administrator, Procurement Officer, Operations head, Operations member) | 16 / 17 | **0 / 17** |
| Page or console errors | 0 | 0 |
| Raise a requisition through the form (Operations member) | in-memory row only | **`REQ_20260911_0004` PENDING_APPROVAL**, Operations, read back from the API |
| Approve a requisition in the Approval Centre (Operations head) | in-memory status | **`REQ_20260911_0002` APPROVED** |
| Award from the Approval Centre (Procurement Manager) | in-memory status | **`QUO_20260911_0005` accepted, `PO_20260911_0002` raised and sent** |
| Register a vendor through the V6 form (Procurement Officer) | in-memory row | **vendor created**, with email, BP number and tax status |
| Run OCR extraction, still unconnected (Accountant) | "extracted" in memory | **refused**: "not connected to the backend yet", invoice count unchanged |
| Audit & Compliance event stream | five invented events | the real procurement audit trail (`GET /procurement/audit-events`) |
| Send an RFQ from the tender builder (Procurement Officer) | "Tender published", in-memory record; the form's default closing date had already passed | **`RFQ_20260911_0004`** from `REQ_20260911_0005`, requisition lines copied, closing 2026-10-02 |
| Score bids in Bid Evaluation (Procurement Officer) | four invented bidders with fixed scores | **RFQ-C's three real bids scored** 70, 80, 90; `evaluationComplete` true |
| Record the winning bidder (Procurement Manager) | in-memory "winner selected" | **`QUO_20260911_0007` accepted, `PO_20260911_0002` raised, RFQ AWARDED** |
| Record a GRN (Procurement Officer) | "GRN created", nothing saved | **`GRN_20260911_0002`** RECEIVED against `PO_20260911_0003` |
| Capture a supplier invoice (Accountant) | in-memory row with an invented number | **`INV_20260911_0002`** DRAFT, $1,605.45, against `PO_20260911_0003` |

Evidence scripts:
- `scripts/_uat/procurement-v23-actions.mjs` checks each action through the API afterwards;
- `scripts/_uat/procurement-v23-baseline.mjs --live=…` reports the census per page.

**Status:** DEPLOYED to production and dev on 11 September 2026 (staff portal nvccz-new
`9cceab1`). The production staff build carries the live bridge, the invoice rejection call and the
refused controls. The actions UAT, now eleven steps, verifies every step through the API locally.

Connected since, on 11 September 2026:
- **invoice rejection** from the Approval Centre (`PUT /procurement/invoices/:id/reject`, actions UAT
  step 11);
- nine more controls that announced invented outcomes are now refused: vendor bid draft and submit,
  OCR extract, flag invoice, email PO, new folder, access review, archive record, plan validation;
- in cycle four: invoice payment, direct purchase orders, send selected, annual plans, contracts,
  the document vault, exports of live records, and the payables and journal tabs (see Cycle four).

Still unconnected, and refused rather than faked:
- OCR invoice extraction;
- eSignature, vendor messaging and document requests;
- asset capitalisation and transfers, and GRN accruals.

They are tracked in [`../procurement-v23-backend-asks.md`](../procurement-v23-backend-asks.md).

---

## PROC-FINDING-006

**Title:** A vendor could set its own technical evaluation score, and the RFQ comparison ranked bids on it
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Procurement Integrity / Evaluation
**Severity:** HIGH
**Persona affected:** Every competing vendor; the award decision
**Surface:** API · `POST /api/vendor-quotations/submit` (public), `GET /api/procurement/rfqs/:id/comparison-matrix`

### Steps to reproduce

1. Send an RFQ to two vendors.
2. Through its own portal link, vendor 1 submits a quotation carrying
   `technicalScoreJson: { score: 100 }`.
3. Vendor 2 submits the same price with no `technicalScoreJson`.
4. Read the comparison matrix.

### Expected

Nothing a vendor submits can become its technical evaluation. Both bids read as unscored until
the evaluation team scores them.

### Actual

| Bid | Price | technicalScore | Weighted (composite) score |
|---|---|---|---|
| Vendor 1, self-declared 100 | identical | **100** | **93.9** |
| Vendor 2 | identical | 0 | 43.9 |

A self-declared score was the only way a technical score could exist: no staff endpoint recorded
one. The price score was an absolute curve, `100 / (1 + total / 10000)`, that ignored the other
bids.

### Root cause

- The public submit stored the vendor's `technicalScoreJson` exactly as sent.
- `ProcurementRfqService.getComparisonMatrix` read its `score` as the technical evaluation.

### Fix

nvccz `177ddd2` on `feature/procurement-v23-live`:

- **Public submit:** drops `score` and `evaluation` from a vendor's `technicalScoreJson`. The
  vendor's declarations (warranty, ESG, local content) are kept.
- **Staff scoring:** `PUT /api/vendor-quotations/:id/evaluation` `{ score 0–100, notes }`.
  - It sits behind `procurement.quotations.manage` and works on open bids only (409 once the bid
    is decided).
  - It stores the score as `technicalScoreJson.evaluation`, with the scorer and time, and writes a
    `SCORE` audit event.
- **Comparison matrix:**
  - reads only the evaluation score (`evaluationScore`, null while unscored);
  - scores price relative to the lowest bid;
  - reports `evaluationComplete` only when every bid is scored.
- **Separation of duties:** scoring (Procurement Officer, Buyer, Manager) and awarding
  (`procurement.rfq.award`, Manager) stay separate grants.

### Verification

`nvccz/scripts/_uat/procurement-quotation-integrity-probe.mjs`, and the V23 actions UAT:

| | Before | After |
|---|---|---|
| Self-scored vendor: technicalScore / weighted | 100 / 93.9 | **0 / 50.0** — unscored, the same as the other bid |
| Other vendor at the same price | 0 / 43.9 | 0 / 50.0 |
| Evaluation team scores bids in V23 Bid Evaluation | no endpoint | RFQ-C scored 70, 80, 90; `evaluationComplete` true |
| Scoring endpoint, by persona | — | Administrator, Procurement Manager, Officer, Buyer pass; other staff 403; LP 403; no token 401 |

The legacy `/procurement` comparison view still receives numeric `technicalScore` and
`compositeScore`. Both now reflect the evaluation team's score.

**Status:** DEPLOYED to production and dev on 11 September 2026 (nvccz `321fcdc`); see Deployment at the top.

---

## PROC-FINDING-007

**Title:** Awarding a quotation left its RFQ open with no award recorded, and vendors could keep quoting on it
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Workflow / Procurement Integrity
**Severity:** MEDIUM
**Surface:** API · `POST /api/vendor-quotations/:id/accept`, `POST /api/vendor-quotations/submit`

### Steps to reproduce

1. The Procurement Manager accepts a quotation on an RFQ.
2. Read the RFQ.
3. Another invited vendor submits a quotation through its link.

### Expected

The RFQ records the award (status and `awardedQuotationId`) and stops accepting quotations.

### Actual

- The accept returned 200 and raised `PO_20260911_0003`.
- The RFQ stayed **OPEN**, with `awardedQuotationId` null.
- A quotation submitted after the award was **accepted**: 201, "Quotation submitted
  successfully".

### Root cause

- The accept path creates and sends the purchase order and never writes to the RFQ.
- `awardedQuotationId` was set only by the retired award endpoint (410).
- Quotation submit checks that the RFQ is OPEN, but nothing ever changed that status.

### Fix

- On acceptance, the RFQ is set to `AWARDED`, with `awardedQuotationId` and the review notes as
  `awardRationale`.
- Submit already accepts only OPEN RFQs, so a late quotation is now refused. That error, which
  surfaced as 500, is mapped to 400.

### Verification

| | Before | After |
|---|---|---|
| RFQ after its quotation is accepted | OPEN, `awardedQuotationId` null | **AWARDED**, `awardedQuotationId` = the accepted quotation |
| Quotation submitted after the award | 201, accepted | **400** "RFQ is not accepting quotations (status: AWARDED)" |
| Award from the V23 award panel | — | RFQ-C AWARDED, award recorded |

The integrity probe went from 0/3 to 3/3.

**Deploy note:** RFQs awarded before this fix stay OPEN in any database where awards have already
happened. At deploy, correct them from their accepted quotation: set `status = AWARDED` and
`awardedQuotationId`.

**Status:** DEPLOYED to production and dev on 11 September 2026 (nvccz `321fcdc`); see Deployment at the top.

---

## PROC-FINDING-008

**Title:** Vendors could not act on either procurement email: the RFQ invitation link failed, and the PO invoice link led nowhere
**Module:** Procurement (backend and frontend) · **Dimension:** QAT · **Category:** Functional / Integration
**Severity:** HIGH
**Persona affected:** Every invited or contracted vendor; the invoice leg of procure-to-pay
**Surface:** Email links · `/vendor-quotations/rfq-respond`, `/procurement/vendor-invoice` · API `POST /api/procurement/invoices`

### Steps to reproduce

Probed on the servers on 11 September 2026 with dummy tokens, so no email was sent:

1. Build the RFQ invitation link the API would email: `FRONTEND_URL` + `/vendor-quotations/rfq-respond?token=…&rfqNumber=…`.
2. Open it on dev (`dev.matanho.com`) and on production (`nvfnvvcz.my.matanho.com`).
3. Do the same for the PO email's invoice link, `FRONTEND_URL` + `/procurement/vendor-invoice?token=…`.
4. With a valid token, submit a vendor invoice against a PO whose goods have been received.

### Expected

Both links open the vendor page with the token intact. A vendor can invoice a delivered order.

### Actual

| Link | Dev | Production |
|---|---|---|
| RFQ invitation | **500** | **307 to the staff login** |
| PO invoice | 307 to the staff login | 307 to the staff login |

- On dev, the staff log showed `ERR_INVALID_URL`, input `-quotations/rfq-respond`.
- `/procurement/vendor-invoice` has no page in the frontend at all.
- The page that does exist, `/vendor/invoice/submit`, demanded quotation, RFQ and email query
  parameters that the PO email never sends. It also crashed on submit (missing `Loader2` import).
- With a valid token, a vendor invoice against a DELIVERED PO was refused: "Purchase order is not
  open for vendor invoices (status: DELIVERED)". Recording the GRN moves a PO to DELIVERED, so the
  normal order of events — goods arrive, then the invoice — could never finish.

### Root cause

- **No vendor host in the API's link settings.** Neither API had `VENDOR_PORTAL_BASE_URL` set, so
  links were built on `FRONTEND_URL`, the staff host. Production staff has no vendor redirect, so
  its login guard caught the path.
- **Blank portal URLs in production builds.** `lib/portal/config.ts` read the portal URLs through
  `process.env[key]`. Next does not inline a computed key, so every external portal URL was blank.
- **Broken redirect on dev staff.** Dev staff does redirect vendor paths, but it built
  `'' + suffix`. The prefix regex matched `vendor` before `vendor-quotations`, and it dropped the
  query string (and with it the token).
- **Wrong default path.** `vendorPoInvoiceEmailLinks.ts` defaulted to a path with no page.
- **Status gate too narrow.** `canVendorSubmitProcurementInvoice` excluded
  PARTIALLY_DELIVERED and DELIVERED.

### Fix

- **nvccz `cf23bb3`:**
  - the invoice link defaults to `/vendor/invoice/submit`;
  - new public `GET /api/procurement/vendor-portal/purchase-order?token=`, scoped to the PO and
    vendor in the signed token;
  - delivered POs accept vendor invoices (BILLED still closes them);
  - `scripts/_uat/procurement-vendor-invoice-link-probe.mjs`.
- **nvccz-new `a3da504`:**
  - literal `NEXT_PUBLIC_*` reads;
  - the vendor redirect forwards the whole path and query, and only to an absolute URL;
  - vendor token pages open on the staff host when no vendor portal is configured;
  - `/vendor/invoice/submit` rebuilt around the token: loads the order, prefills lines at the
    received quantities, shows the server's VAT and any earlier invoices, and takes an optional PDF.
- **Environment (backups `*.bak-20260911-vendorlinks`):**
  - production `VENDOR_PORTAL_BASE_URL` and `PUBLIC_VENDOR_PORTAL_URL` = `https://vendor.nvccz.online`;
  - dev `VENDOR_PORTAL_BASE_URL` = `https://dev.vendor.matanho.com`.

### Verification

Local, `procurement-vendor-invoice-link-probe.mjs` and a browser on the vendor portal build:

| | Before | After |
|---|---|---|
| Token resolves the PO (`PO_20260911_0002`, DELIVERED) | no endpoint | **200**, lines numeric, VAT 15.5%, no internal ids |
| Token for another vendor / RFQ token / expired token | — | **404 / 400 / 400** |
| Vendor invoice on a DELIVERED PO | 400 "not open for vendor invoices" | **201** `INV_20260911_0003` |
| Invoice page opened from the token | "Invalid Invoice Submission" (missing params) | order shown, line prefilled at the received quantity, total matches the PO (USD 1,605.45) |
| Submit through the page | crash on submit | **`INV_20260911_0004`**, confirmation with our reference |

Also checked on the servers:
- both vendor hosts answer 200 on both paths;
- the production API's CORS admits `https://vendor.nvccz.online`.

**Status:** DEPLOYED and verified on production and dev, 11 September 2026.

| | Production | Dev |
|---|---|---|
| RFQ invitation link, built inside the API | `https://vendor.nvccz.online/vendor-quotations/rfq-respond?…` | `https://dev.vendor.matanho.com/vendor-quotations/rfq-respond?…` |
| PO invoice link, built inside the API | `https://vendor.nvccz.online/vendor/invoice/submit?…` | `https://dev.vendor.matanho.com/vendor/invoice/submit?…` |
| Same paths opened on the staff host | 307 to the vendor portal, token kept | 307 to the vendor portal, token kept (was 500) |
| Vendor pages | 200 | 200 |
| `GET /procurement/vendor-portal/purchase-order` with a forged token | 400 | 400 |

---

## Not yet findings

- **`POST /procurement/rfqs/:id/award` returns 410** to everyone. This is intended: award was
  retired in favour of accepting a quotation, which creates the purchase order. The V23
  "award" action must call `POST /vendor-quotations/:id/accept`.
- **The approval queue** (`GET /procurement/requisitions/pending-approval`) returns 400 to
  anyone who is not a department head. The response still needs checking against a real
  pending requisition.
