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

## Cycles nine to fourteen — SRD completion, the "nothing half built" sweep and the move to /procurement, 13 September 2026 (dev only)

Dev only; nothing was deployed to production. Mail guard on for every write run (outbound mail blocked). Each run ends
with `dev_cleanup_procurement.mjs --apply` and `demo_integrity.mjs`.

### Deployed to dev

| Cycle | API | UI | Migrations |
|---|---|---|---|
| nine | `a086977` invoice viewer and highlights, flag for review, requisition project, line suggestions | `0796fbc` | `procurement_invoices.review_note`, `purchase_requisitions.project_id` (+ index) |
| ten | `fbe5a01` vendor create/update permissions, authz probe | `892857f` | none |
| eleven | unchanged | `4b15cec` Budget check column out, immediate pay confirmation, KPI cards, compliance filter | none |
| twelve | `dc224d5` vendor self-registration decline, review queue guard and audit, `/procurement` notification links | `f4ff8be` module moved to `/procurement` (legacy to `/procurement-legacy`, redirects), self-registration review, Accounting messages | none |
| thirteen | unchanged | `c0bac67` vendor portal requires SWIFT/BIC; portal buttons | none |
| fourteen | unchanged | `9e8acbd` vendor self-registrations as decision cards | none |

### Found and fixed

1. **Dates read two ways on one page.** en-GB's short month is "Sept" on newer ICU and "Sep" on older, so a vendor
   profile showed an order "30 Aug 2026" beside an invoice "08 Sept 2026". Loaders, bridge and the Accounting audit now
   spell the month out ("13 Sep 2026"). The PO filters check caught it.
2. **Accounting V52 drew its dialogs, drawers and profile menu unstyled.** Every Accounting style is scoped to
   `.accounting-v52-root`, but the runtime appends its focus, drawer, modal and deep layers, its toolbar and its profile
   menu (with the prototype user "Tariro Moyo") to `<body>`, and Payables' Pay dialog did the same. They rendered below
   the page; the sidebar covered the dialog's Pay button. The profile menu is not installed in a live session; the host
   moves every other layer into the root as it is added; the Pay dialog is inserted there. Found by the Payables UAT
   (the Pay click was intercepted by the sidebar toggle).
3. **Any staff account could create or change a vendor, and the plain update could blacklist one.** `POST` and `PUT
   /accounting/vendors` only required a staff sign-in, and `PUT` accepted `isBlacklisted` and `registrationStatus`
   without `procurement.vendors.approve`. Both now need `procurement.vendors.manage`; the blacklist and registration
   fields also need approval rights; each change is audited with old and new values. The authz probe asserts it.
4. **Vendor master could not be edited.** Edit profile opened the prototype's form (country, currency, status, WHT rate —
   none stored) whose Save was refused. It now offers only the stored fields (name, contact, email, phone, address,
   payment terms, tax clearance) and saves them; the Company profile card shows phone, address and payment terms.
5. **Controls that opened a form nobody could save.** An audit of every control the census met that `actions.ts` did
   not name found openers whose only save was refused (CSV line import, internal notes, evaluation criteria, report
   builder and schedules, quotation import, record upload and generic edit, document and template editors, vendor
   invites, bid-form preview, record history, "Send compliance reminder") and two terminal steps that announced success
   without saving ("Validate import: 12 line items passed", the report builder's sample preview). None is offered in a
   live session; Vendor Registry's reminder automation card, the profile's messaging card and its sample compliance
   register are not shown; New record's Annual plan opens the live plan form.
6. **KPI cards with no source.** Cards for features procurement does not record (withholding tax, eSignature,
   committees, board packs, report schedules...) and fixture figures no loader answers showed "—" with "No live source".
   They are left out; the census lists them per page.
7. **A filter bar with nothing to filter.** On a page with no register row its Apply answered "This page has no register
   to filter". It is not shown there.
8. **Test clean-up that did not clean up.** The invoice-processing UAT passed its invoice ids to the delete script joined
   by commas, which the script read as no ids; the auto-approval UAT's approved invoices were refused by the same script.
   Ids are now separate arguments and `--approved-unpaid` removes a test's own approved, unpaid, unposted invoices
   (still never a paid or posted one). Found by the demo integrity check (four supplier invoices where the demo has two).
9. **A check that could not fail.** The AI capture UAT passed "the reading was filed" on either "Filed as VIN-…" or "Not
   filed". A reading without a purchase order is deliberately not kept (the vendor is unknown), so the check now requires
   exactly that message.
10. **A Budget check column with nothing behind it.** Requisitions are not budget-checked (the loaders set the budget to a
    dash), yet both requisition registers carried a Budget check column and the requisition view a Budget line, reading
    "—" on every requisition. Not shown in a live session (`971d420`). Found reading the requisition assist screenshot.
11. **A payment made from Accounting said nothing for over two minutes.** The Accounting host reloaded the six registers a
    payment touches before showing "paid", so the payment went through (invoice PAID, journal and bank reference recorded)
    while the person saw no confirmation. The confirmation now comes first (`c3cf673`). Found by the Payables UAT, which
    now times it.
12. **KPI cards that could only read zero, and cards that popped in.** Six cards were computed by the design from records
    procurement does not keep (vendor inbound messages, pending compliance requests, missing documents; contracts awaiting
    signature; asset purchases; editable report templates) and read 0 as if the feature existed; they are left out
    (`668ce17`). Separately, before the first live load every fixture figure counted as sourceless, so cards were left out
    and then appeared; they now show "Loading live figures…" until the loaders answer (`c1d6877`). Found by the census.
13. **A compliance chip whose filter showed none of the vendors it counted.** Vendor Registry's chips counted a vendor
    with no tax clearance on file as "Expired / missing" (31%), but the filter read each row's chip, which said "Missing",
    so choosing the chip showed no vendor while "Under review 0%" showed four. Both now use one classification
    (`4b15cec`); the vendor history UAT clicks the chip and compares the rows with the API. Found in the census toasts of
    the Procurement Manager and Officer.
14. **A vendor that registered itself could not be reviewed.** Vendors register on the vendor portal (its own domain,
    no invitation) and wait in PENDING_REVIEW, but the Vendor Registry never showed that queue: they appeared as
    ordinary vendors, with no way to approve or decline, and "Vendor portal" was hidden as not built. The registry now
    marks them "Awaiting review" and lists them under "Self-registrations awaiting review" with their bank accounts and
    documents; a role that approves vendors approves or declines with a reason, and the vendor is emailed either way
    (new decline route, audited; approval audited). The review queue needed only a staff sign-in and returned each
    vendor's portal upload token: it now needs vendor view rights and omits the token. "Vendor portal" opens the
    registration page in a new tab. Backend `5d7f106`, UI `a9ca03c`; UAT `procurement-v23-vendor-self-registration.mjs`
    22/22 in cycle fourteen (after items 17 and 19).
15. **Every Accounting V52 write was silent.** The runtime's `commitSuccess` and `commitError` call handlers defined in
    another of its closures, so neither showed anything: a supplier payment, a chart-of-accounts change or a journal
    submission never said whether it worked. Confirmed on dev by calling `commitSuccess` directly (no error, no message).
    The host now shows each result as a toast (`6086abf`). Found by the Payables UAT.
16. **Procurement moved to `/procurement`.** At the owner's request the module left `/procurement-v23`: the frozen legacy
    pages moved unchanged to `/procurement-legacy`, and `/procurement-v23/...` redirects (308) to `/procurement/...`, so
    links in notifications and emails already sent still open. Notification links from the API use the new paths.
    UI `f4ff8be`, API `dc224d5`; verified in cycle twelve (sidebar navigation 17/17 pages at `/procurement`, census clean
    there) and the redirect by the self-registration UAT in cycle fourteen.

17. **The vendor portal called a required field optional.** The self-registration form marked SWIFT code optional and
    sent nothing when it was blank, but the API refuses a vendor bank account without one ("requires Branch Code,
    SWIFT/BIC code, and Currency to ensure payment success"): a vendor who trusted the form was refused at the last step.
    The form now requires it and says why (`361dfa5`). Found by the vendor self-registration UAT on dev (6/12 in cycle
    twelve: nothing after the refused submission could exist), confirmed by posting the form's payload to the API.
18. **A probe row that could not run.** The authz probe's new "list vendor self-registrations" row passed a `null` body on
    a GET, so fetch threw before any request and every cell read `-1`. Fixed (`3bc06ac`); re-run on dev: every asserted
    cell matched the policy.

19. **A decision hidden behind a menu.** The review queue for vendor self-registrations was a table, and the module folds a
    table row's buttons into its ⋯ menu, so Approve and Decline were a click away and the self-registration UAT waited for
    a button that was not on the page (the officer's "offers no Approve" check passed only because nothing was shown).
    Each registration is now a decision card, as in the Approval Centre, with Open profile and — for a role that approves
    vendors — Approve and Decline in view (`9e8acbd`). A row click could not have approved a vendor: the row's click
    action is chosen from non-mutating labels, and "Open profile" always ranked first.

### Cycle thirteen results (UI `c0bac67`: SWIFT/BIC required on the vendor portal)

| Suite | Result |
|---|---|
| vendor self-registration | 12/13 — the portal refuses a registration without SWIFT/BIC and accepts it with one; the vendor waits in PENDING_REVIEW with its bank account counted and no token exposed, is not invitable; the requester cannot list the queue; the officer sees it and cannot decide (API 403); the manager's Approve was folded into a row menu (item 19) |
| vendor master | 18/18 |
| cleanup | nothing left behind |
| demo integrity | 18/18 |

### Cycle twelve results (API `dc224d5`, UI `f4ff8be`)

| Suite | Result |
|---|---|
| vendor self-registration | 6/12 — SWIFT required by the API but optional in the form (item 17); fixed and re-run in cycles thirteen and fourteen |
| vendor master | 17/18 — the UAT still expected the profile's "Open vendor portal" gone; it now opens the portal (UAT updated) |
| vendor history (incl. compliance filter) | 11/11 |
| requisition assist (project, suggestions, no Budget check column) | 14/14 |
| procure-to-pay flow | completed |
| Accounting Payables (pay from Accounting, confirmation straight away) | 23/23 |
| authz probe | every asserted cell matched the policy (after the probe fix, item 18) |
| sidebar navigation at `/procurement` | 17/17 pages, openers 10/10 |
| census, Procurement Manager, at `/procurement` | 0 dead ends, 0 "not connected", 0 page errors, 0 failed calls. Four controls with no visible effect: the three benign ones seen before, and "Vendor portal", whose new tab opens with `noopener` and so is not seen by the census (the self-registration UAT checks that tab) |
| demo integrity after cleanup | 18/18 (the two records restored at the owner's request read as the demo expects) |

### Cycle fourteen results (UI `9e8acbd`: self-registrations as decision cards)

| Suite | Result |
|---|---|
| vendor self-registration | 21/22, then 22/22 — the first run looked the approved vendor up with `?isActive=all`, which the API reads as inactive only (UAT fixed, `7ad30dc`); on re-run every check passed |
| cleanup | nothing left behind |
| demo integrity | 18/18 |

### A manual decision on the demo dataset (not a defect)

After cycle eleven, `demo_integrity.mjs` reported 16/18: the FY 2027 plan read APPROVED (expected SUBMITTED) and the
projector requisition REQ_20260911_0008 read REJECTED (expected PENDING_APPROVAL). The audit trail shows both decisions
made by the **Admin NTS** account at 19:21 CAT, nine seconds apart, while no suite was running (cycle eleven was still
deploying its UI) and while dev was open for manual use; no suite signs in as Admin NTS. No code changed either record.
`scripts/procurement-ops/dev-data/dev_restore_demo_decisions.mjs` (`09ce17f`) puts both back if the owner wants the demo
storyline restored — its dry run: the requisition and its one approval request reopened (two approval rows back to
PENDING), the plan back to SUBMITTED, one decision notification removed; audit rows kept. The owner chose to restore:
applied on dev at 20:10 and read back through the API (requisition PENDING_APPROVAL, plan SUBMITTED).

### Census, cycle ten (UI `892857f`)

Procurement Manager, every control operated on 19 pages: **0 dead ends, 0 controls answering "not connected", 0 page
errors, 0 controls that could not be operated, 0 failed load calls.** The six success messages seen were live filters
reporting what they matched. Three controls had no visible effect and are benign (Command Centre while on it, Preview
tender pack on an empty form, Clear with no filter set). 23 KPI cards were left out without a live figure; each is either
a feature procurement does not have (eSignature, delegations, board votes, SLAs, contract variations and obligations,
regulatory exports, bank-change tracking) or an older layer's card whose live equivalent is on the same page ("Waiting
on me", "Contract value", on-time delivery, the analytics tables). Procurement Officer, Accounts Payable and the requester
(19 pages each): the same, all zero.

### Results

| Suite | Cycle nine | Cycle ten |
|---|---|---|
| dashboard | 9/9 | — |
| analytics (cash, insights) | 14/14 | — |
| PO filters | 11/11 | 11/11 |
| invoice auto-approval | 20/20 | — |
| AI capture, scanned PDF | 18/18 | 18/18 (stricter filing check) |
| AI capture, photo | 18/18 | 18/18 |
| invoice processing (viewer, flag) | 11/11 | — |
| requisition assist | 12/13 (project display check) | 12/13 (the check clicked a row that opens nothing; fixed in the UAT) |
| vendor history | 10/10 | 10/10 |
| vendor master | — | 18/18 |
| Accounting Payables | 14/16 (Pay dialog) | 21/22 (paid, journal and reference recorded; the confirmation waited for a reload) |
| authz probe | — | every asserted cell matched the policy |
| census, four roles (19 pages each) | — | 0 dead ends, 0 "not connected", 0 page errors, 0 failed calls |
| demo integrity after cleanup | 18/18 | 18/18 |

## Cycle eight — full browser test, 13 September 2026 (dev)

The owner asked for the whole module to be tested from the browser, phase by phase, fixing and re-testing without
waiting. Every phase drives real Chromium sessions as the demo personas against dev (staff `e393b63`, API `877d469`);
production is not touched and the dev mail guard stays on.

| Phase | What | Result |
|---|---|---|
| 0 | Preflight: build, mail guard, test data, demo integrity | Clean: working tree at `c2ec9e6`, mail guard on, no leftover test records or processes, demo integrity 17/17 |
| 1 | Visual review of every page for the 8 roles that sign in (desktop screenshots read by a person), and tablet and phone widths | 152 desktop pages and 36 tablet/phone views read; 16 findings, all fixed in `55016b0` and `0a3ecc2` (below); dev audit trail tidied |
| 2 | Every control on every page for all 8 roles (census): dead controls, errors, unrefused writes, sample text | On `0a3ecc2`: Procurement Manager, Accounts Payable and Operations head complete (19 pages each). No render failure, failed call or unrefused write. Flags triaged below; one wording fix (`9e9a458`), and the approval support documents found beside it. Remaining roles re-run on the next build |
| 3 | End-to-end business flows through the UI: storyline, actions, workflows, AI capture | pending |
| 4 | Permissions and refusals per role | pending |
| 5 | Cross-module: accounting (journals, ledger, payables, cash), vendor portal, exports and letterheads | Exports and accounting 32/32 on `0a3ecc2`: every export downloads a real file with no sample or test text; Payables agrees with procurement ($2,518 outstanding = the stationery invoice awaiting Finance; $19,277 open commitments = the two uninvoiced POs; $7,421 sourcing pipeline). Vendor portal 2/4: the invited vendor's quotation form was blank (fix below, deploying) |
| 6 | Fix, deploy, re-test until clean | pending |

### Phase 1 — what a person reading the pages found

Read as each role would see them, full-length at 1440px, plus 768px and 390px for two roles. Nothing showed sample
text or a crash; what follows is what made pages wrong or unprofessional.

| # | Where | Found | Fix |
|---|---|---|---|
| 1 | Tablet and phone, every page | The menu opened expanded as a 278px drawer with no backdrop, over the heading, head buttons and first KPIs | `55016b0` step 44: narrow screens start on the icon rail |
| 2 | Every table | Words broke mid-word as columns squeezed: "Operation s", "$10,40 0" (`overflow-wrap:anywhere` on cells) | `procurement-v23-live.css`: `break-word`, imported after the vendored sheet (which an extract would overwrite) |
| 3 | Vendor Registry | First column printed database ids (`cmtzc7u8s02j…`); contact line "— \| email"; Currency all dashes; "— / 5" | Step 46: Vendor · Contact (person, email, phone) columns; no currency column; "Not rated" |
| 4 | Vendor Registry | A clearance 35 days from expiry read "Valid" in the table but "Expiring" in the doughnut | Step 45: `daysUntilV6` counted from the design's frozen 1 Aug 2026; now from today |
| 5 | Contracts & Awards | Awards awaiting a contract showed their PO number in the Contract column | Step 47: "Not yet contracted", award and order under the description |
| 6 | Tenders, Invoices, Analytics | Every RFQ read "Restricted tender"; Category and Estimate always "—" | Loader: "Request for quotation" unless publicly listed; category and estimate from the source requisition |
| 7 | Approval Centre | A goods receipt awaiting inspection showed Value "—" (Receiving showed $6,290) | Loader: the receipt's value |
| 8 | Sidebar | Purchase Requisitions badge "2" over the Procurement Manager's empty queue (counted every pending requisition) | Loader: requisitions awaiting my decision, else my own in approval |
| 9 | Command Centre | "Spend by category" listed one bar, "Operations 100%" — grouped by department | Bridge: grouped by the requisition's sourcing category |
| 10 | Analytics | "Entity plan execution — committed as a percentage of approved plan" read 100%; the header said 18% | Bridge: committed against each department's approved plan budget |
| 11 | Command Centre, Analytics | Trend lines fell to zero across October–December, months that have not happened | Bridge: lines stop at the current month |
| 12 | Reports Vault | "Report consumption" drew the spend trend (report runs are not logged) | Bridge: says report runs and downloads are not logged yet |
| 13 | Invoices & 3-Way Match, Accounts Payable | Empty "Select a tender" card and no invoice: sources came from RFQs, which the role cannot read | Step 50 + `__pr23MatchSources`: sources from its purchase orders; workspaces resolve them |
| 14 | Requester opening the module | Landed on "Your role does not include Command Centre" | Bridge + host: replaced by the first page the role's menu offers |
| 15 | Audit & Compliance | 200 rows on one 8,000px page, most "Create RFQ RFQ_20260913_000x" left by test runs (RFQ rows are keyed by number, so cleanup never matched them) | Step 49: latest 50 with a line saying so; RFQ rows named; cleanup removes RFQ rows; `dev_audit_tidy.mjs` removed 57 orphaned rows and re-pointed 7 renumbered demo RFQs; integrity checks the trail |
| 16 | Document Vault | The "Request for Quotation" template captioned "Vendor-submitted original · read-only" | Step 48: templates are never vendor submissions |

Re-checked on dev after deploying `0a3ecc2` (`_tmp-v23-cycle8-fixes-check.mjs`): 26/27. The goods receipt still read
"Value —" in the Approval Centre: the card is built from the approval prompt, a second place the value was left null —
fixed with the Accounts Payable source cards naming the supplier where the role cannot see the department. Tablet and
phone re-check: the menu no longer covers pages; the requester's "799px sideways scroll" was the closed side drawer
parked off-screen (the document does not scroll), a false positive of the check, which now measures the viewport.

### Phase 2 — census flags, triaged

| Flag | Verdict |
|---|---|
| "Command Centre" in the menu while on the Command Centre: no visible effect | Expected — already on the page |
| Document Vault "Clear" with no filter set: no visible effect | Expected — nothing to clear |
| Report template status select "Draft": no visible effect | Expected — takes effect on save |
| Create tender → "Preview tender pack" on the empty form: no visible effect | Expected — the browser's required-field prompt shows, nothing else changes |
| Vendor Registry "Vendor portal": could not operate | Known — a not-built opener; its refusal toast covers the button |
| Document Vault "Download PDF": console CORS error on socket.io | Transient — the dev API container was being recreated; CORS headers for `dev.matanho.com` are correct |
| Accounts Payable: "No procurement plan has been approved yet", "No approved plan covers FY 2026", "No requisition has been approved yet" | **Wrong** — that role cannot read plans or others' requisitions; now "not visible to your role" (`9e9a458`) |

KPI cards that show "—" all say why (no withholding calculation, no eSignature, report runs not stored…), and every
success toast without an API call is a refusal, a filter count or a client-side export — none claims work that did
not happen.

### Approval support documents were fixtures presented as evidence

Found reading what the census reported the department head opening in a requisition approval. The three supporting
documents offered beside the decision paper were the design's samples with the record number filled in:

- "Budget availability and funding confirmation" named the sample CFO "Tinashe Chaka" and said the commitment "has been
  checked against the approved annual plan, department budget and current commitments" — no budget check exists;
- "Evaluation or technical recommendation" scored three sample bidders (TechNova, NetShield, CloudAxis);
- "Conflict and independence declaration" read "No conflict declared · SSO + MFA" though nobody declared anything;
- every paper, the decision paper included, was "Generated 02 Aug 2026".

The census's sample-text check did not see them: they open in a modal from inside a modal. Step 51 builds them from the
records in a live session (`__pr23SupportDocument`): **Budget position** — the department's approved plan budget,
commitments this year and where this request would take them, and a plain statement that no finance confirmation is
recorded; **Quotation comparison** — the RFQ's submitted quotations, lowest first, with evaluation scores, for an award
(and "not applicable" otherwise); **Conflict of interest declaration** — says none is recorded. The decision paper is
dated today.

Round-two check on dev after deploying `9e9a458` (`_tmp-v23-cycle8-round2-check.mjs`): **11/17**. Passing: the goods
receipt's value, the support documents' labels, Accounts Payable's source cards, and the vendor form (title,
organisation, the vendor's details, the lines, the closing date). Still wrong, and fixed next:

- **The award decision paper** was still the vendored memorandum — step 51 replaced the supporting documents, not the
  paper itself: "TechNova Solutions" as the selected bidder, three sample bidders' scores, bids "opened under committee
  control", and an approval table showing the sample CFO "Tinashe Chaka — Signed — 01 Aug 2026". Now built from the
  records (`__pr23AwardMemo`): the RFQ, its submitted quotations ranked by total with their evaluation scores, the basis
  of the recommendation, and what approving does. Requisition, receipt, invoice and plan approvals use the generic
  decision paper, which carries no sample content.
- **Every paper's footer** read "Generated 02 Aug 2026" — a literal in two renderers; now today's date.
- **The vendor form's page error** "Unexpected token '<'" was not the form: the root layout renders Vercel Analytics,
  whose `/_vercel/insights/script.js` answers with an HTML page on a self-hosted server — so every page in every portal
  logged it. `<Analytics />` now renders only on Vercel builds.

### The requester's phone opened with the menu over the page

The tablet and phone re-check on `9e9a458` was 31/36: four phone pages whose head buttons run into a sideways-scrolling
row (the design's phone layout, accepted in cycle seven), and the requester on a phone, where "Export register" was
covered. A browser trace showed why. The requester opening `/procurement-v23` is sent on to the Approval Centre
(`9e9a458`), and that page opened with the full 278px menu over it. Nothing clicked it open: the second runtime read
`window.innerWidth` as **784** on a 390px phone, because content overflows during the route transition and the mobile
layout viewport widens. So step 44's `innerWidth > 780` thought it was a tablet. Step 52 decides with
`matchMedia('(max-width: 780px)')`, the stylesheet's own breakpoint, which measures the device width.

### Phase 5 — the invited vendor's quotation form was blank

Found by the cross-module check, as Jacaranda Office Supplies opening its invitation link for `RFQ_20260912_0006`: the
form showed the RFQ number and nothing else — no title, no lines, no closing date or delivery terms, the vendor's own
details unfilled — and was headed "Submit Quotation to Arcus". The page decoded the token's signature as if it were the
payload (so even the RFQ id was lost), and no endpoint let a vendor read the RFQ with their link.

- API `dc8290e`: `GET /procurement/vendor-portal/rfq?token=` — public and token-scoped like the PO invoice link; only an
  invited vendor (or anyone on a publicly listed RFQ) can read it. Returns the RFQ, its lines as issued (never
  prices), closing date and delivery terms, the vendor's master details, the organisation's legal name, and the
  quotation this vendor already sent.
- UI: the form shows what is being bought, prefills the lines and the vendor's details, names the organisation,
  says when the RFQ has closed or the vendor has already quoted (and disables Submit), and reads the token correctly.

The first deploy of the endpoint answered 500 to every invited vendor: it ordered the vendor's earlier quotation by
`createdAt`, which `VendorQuotation` does not have (it records `submittedAt`); the local Prisma client was stale and
the typecheck did not see it. Fixed in API `7d7826f`. On dev (`check_vendor_rfq_endpoint.mjs`) **9/9**: an invited vendor
reads its RFQ, lines without prices, its own details and the organisation's name; no token, an altered token and an
uninvited vendor are refused (400, 400, 404).

Census harness: the finance manager's run crashed when a call failed during the API container recreate — the
`requestfailed` handler called `.request()` on what is already the request. Fixed; the internal auditor's run failed
to sign in during the same recreate. Both are re-run on the next build.

Seen and left: the journal reference `EXP-1789275136052-INV_20260822_0001` is the accounting API's own reference and
reads the same in Accounting; the Configuration page lists raw permission keys, which is what Admin → Roles uses.

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
- On `5072202`, with the test dataset rebuilt first: **storyline 20/20** (step 14, AI capture, passes: its earlier
  timeout was the container swap). Cleanup, then demo integrity 17/17.

**Census on `5072202` — Accounts Payable, Finance Manager, Internal Auditor** (the last three roles; it never clicks a
live write, and the demo integrity check read 17/17 before and after it):
- **Document Vault, Accounts Payable — real.** Preview, Download PDF, Edit document and Upload new version on the RFQ
  pack threw `Cannot read properties of undefined (reading 'id')`. A document of a recognised type (tender pack,
  annual plan…) was rebuilt by `generatedDocumentV11` from its related record, which looks the tender up, and a role
  that cannot see RFQs has none; where it did not throw, an uploaded document was shown generated text instead of its
  stored file. **Fix — nvccz-new `e393b63`:** in a live session a document with a stored file previews as it was filed.
  Verified on dev `e393b63` as Accounts Payable and the Procurement Manager: the RFQ pack's preview shows its folder,
  version and related record (`RFQ_20260808_0001`), an "Open the stored file" link to the uploaded PDF, and the
  organisation's letterhead from the company profile; Download PDF, Edit document and Upload new version raise no
  error. (The check first reported the link missing: it read only the first 300 characters of the preview, and the
  link sits at 378.) On the same build the Approval Centre and Payables checks read 15/15 and demo integrity 17/17.
- **Vendor Registry "Vendor portal" could not be clicked (all three) — not a defect.** The button is visible and
  clickable (a trial click passes; it raises the not-connected refusal); the census's previous refusal toast, shown
  top-right, covered the page-head button for a few seconds.
- Expected, as before: Command Centre clicked while on it, Clear with no filter set, a status select inside a form.

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

## PROC-FINDING-009

**Title:** `GET /procurement/vendor-portal/rfq` 404'd on a hand-minted token — investigated as a possible regression of PROC-FINDING-008, confirmed not a defect
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Investigation (no code defect found)
**Severity:** N/A (not a defect)
**Persona affected:** None — real vendor invitation links are unaffected
**Surface:** API `GET /api/procurement/vendor-portal/rfq`

### Steps to reproduce (as reported)

While UAT-testing SRD §9/§15 on dev on 18 September 2026: created RFQ `RFQ_20260918_0001`
(`procurement_rfqs.id = cmu6tel5o002qnz01eebn8wfu`, status `OPEN`, `visibility = INVITED_ONLY`) from an
approved requisition through the live staff UI, which genuinely invited two vendors (confirmed via
`RfqVendorInvitation` rows). A token was then hand-minted for the invited vendor Baobab Networks &
Computing (`vendorId cmtzc7u8s02jhnu01al4q2jeo`) using the API's own `signVendorPortalToken`
(`src/utils/vendorPortalToken.ts`), run inside `arcus-dev-api-1` so it used the real signing secret,
with payload `{ k: "RFQ_SUBMIT", v: vendorId, r: "RFQ_20260918_0001", exp: <valid> }`. Calling
`GET /vendor-portal/rfq?token=<that token>` returned **404** `"No request for quotation matches this
link"`, despite the RFQ genuinely existing, being open, and the vendor genuinely being invited.

### Investigation

`ProcurementController.getVendorPortalRfq` (`src/controllers/ProcurementController.ts:1391`) resolves
the RFQ with `prisma.procurementRfq.findUnique({ where: { id: payload.r }, … })` — it looks up the
signed token's `r` field as the RFQ's **database id** (a cuid), not its human-readable `rfqNumber`.
The hand-minted token above put the *rfqNumber* (`"RFQ_20260918_0001"`) in `r`, so the id lookup found
nothing and the generic "no match" 404 fired — the same 404 a genuinely-unrelated token would produce.

Checked every place the backend actually mints an `RFQ_SUBMIT` token, to see whether any real flow
could produce a token shaped like the hand-minted one:
- `ProcurementService.createAndSendRFQ` (`src/services/ProcurementService.ts:2054-2057`) — `r: rfqRow.id`
- `ProcurementRfqService.extendClosing` (`src/services/ProcurementRfqService.ts:301-304`) — `r: rfq.id`
- `ProcurementRfqService.postRfqClarification`-triggered resend (`ProcurementRfqService.ts:406-409`) — `r: rfq.id`

All three sign `r` as the RFQ's id. The emailed link itself
(`src/utils/vendorRfqEmailLinks.ts:buildVendorRfqResponsePageUrl`) also carries a separate
`rfqNumber=` query parameter for the page to *display*, but that parameter never enters the signed
token — the frontend (`lib/api/procurement-api-v2.ts:getRfqInvitation`) forwards only the `token`
value to this endpoint. There is no code path, frontend or backend, that ever signs `r` as the
rfqNumber; the frontend cannot mint tokens at all (it doesn't hold `VENDOR_PORTAL_TOKEN_SECRET`).

### Root cause

Not a backend defect. The reproduction script minted its own token by hand and put the RFQ's
display number in the `r` field instead of its database id — an easy mix-up, since the controller's
own comment merely says "`r` = RFQ id" without spelling out *which* id. A real vendor's invitation
link, built entirely server-side, always embeds the correct database id and was never at risk.

### Fix

None required — no code changed, nothing deployed.

### Verification

Live on dev, tokens minted inside `arcus-dev-api-1` with the real `signVendorPortalToken`:

| Token | Result |
|---|---|
| `r` = rfqNumber (`"RFQ_20260918_0001"`, the original repro) | **404** `"No request for quotation matches this link"` |
| `r` = the RFQ's actual id (`cmu6tel5o002qnz01eebn8wfu`), same vendor | **200** — `organisation: "Matanho Investment Management (Private) Limited"`, `rfqNumber: "RFQ_20260918_0001"`, `status: "OPEN"`, `open: true`, `closingAt: 2026-10-09T10:00:00.000Z`, one line item (`Ergonomic office chairs`, qty 4, no prices), and the vendor's own master details (Baobab Networks & Computing, contact, phone, tax number, address) |
| No token | **400** `"This quotation link is missing its token"` |
| Signature altered (last 2 chars of a valid token flipped) | **400** `"Invalid vendor portal token signature"` |
| Correctly-shaped token (`r` = real id) for a vendor never invited to this RFQ | **404** `"No request for quotation matches this link"` |

Matches PROC-FINDING-008's originally-verified shape for this endpoint. No regression; no fix shipped.

**Status:** CLOSED — not a defect, confirmed on dev 18 September 2026. No branch, no deploy.

---

## PROC-FINDING-011

**Title:** Cross-department authorization bypass — a department head could view and approve another department's purchase requisition
**Module:** Procurement (backend) · **Dimension:** Security · **Category:** Broken access control (segregation of duties)
**Severity:** CRITICAL — major security failure; the approval workflow's segregation-of-duties control (SRD §12 "Requisition Approval") did not hold, and an unauthorized user could complete an approval action that should have required a different department's authority (SRD §70 "Critical Security Test Cases", test 2: "one department cannot access restricted records of another department unless authorised")
**Persona affected:** Any department HEAD/DEPUTY, against any other department's purchase requisitions
**Surface:** API `GET /api/procurement/requisitions/:id`, `PUT /api/procurement/requisitions/:id/approve`, `PUT /api/procurement/requisitions/:id/reject`

*Numbered 011, not 010: PROC-FINDING-010 (an unrelated `GET /users` directory-exposure bug) was claimed concurrently by a sibling agent on its own branch before this one merged.*

### Steps to reproduce (as reported, live on dev, 18 September 2026)

1. Logged in as `payroll.finmgr@nts.local` (Finance Manager, Finance department, `departmentRole: HEAD`). Created a purchase requisition via `POST /procurement/requisitions` with `department: "Finance"` (`cmu6uqz7j003vnz01f24nx5ij`, `REQ_20260918_0003`), then submitted it via `PUT /procurement/requisitions/:id/submit` — moved to `PENDING_APPROVAL` correctly.
2. Logged in as `perf.deptmgr@nts.local` (Head of Operations — a different department). `GET /procurement/requisitions/pending-approval` correctly returned only Operations department requisitions (3 of them).
3. `GET /procurement/requisitions/cmu6uqz7j003vnz01f24nx5ij` (the Finance requisition, by direct id) as the Operations department head returned **200** — full read access to another department's requisition.
4. `PUT /procurement/requisitions/cmu6uqz7j003vnz01f24nx5ij/approve` as the same Operations department head returned **200 "Purchase requisition approved successfully"** — an Operations head actually approved a Finance department requisition.

### Investigation

Two independent gaps, both stemming from the same root misconfiguration:

**Root cause (data):** the live requisition approval matrix (`GET /procurement/approval-matrix`, the general/company-wide route, `config.department = null`) had exactly one step, `DEPARTMENT_HEAD`, but with its department hard-pinned to `"Operations"` instead of left dynamic (`department: null`, meaning "the requester's own department"). `ApprovalService.createApprovalRequest`'s `DEPARTMENT`-step branch (`src/services/ApprovalService.ts:226-248`) honors a stage's fixed `requiredUserDepartment` before ever falling back to the submitting requisition's own department — so **every** submitted requisition, regardless of department, got its sole approval step assigned to the Operations department head. This is a live, active misconfiguration, not a hypothetical: the only 3 requisitions in `PENDING_APPROVAL` at investigation time were all (correctly, coincidentally) Operations', so it had gone unnoticed.

**Root cause (code, the actual exploitable gap):** even granting that a stage's approver assignment could be wrong (by data-entry error today, or in principle a future misconfiguration, or a user's department changing after being assigned), nothing re-validated the assignment against the specific requisition being acted on:

- `ProcurementController.getPurchaseRequisitionById` (`src/controllers/ProcurementController.ts:349`) called only `ProcurementService.assertUserCanViewInvesteePurchaseRequisition`, which is a no-op (`if (!r.portfolioCompanyId) return;`) for every ordinary department requisition — i.e. it enforces investee/fund isolation for Suite 02 records only, and enforces *nothing* department-wise for the common case. Any authenticated user could view any department's requisition by id.
- `ProcurementRequisitionApprovalService.decide()` (`src/services/ProcurementRequisitionApprovalService.ts:197`, shared by both approve and reject) only checked "does a `PENDING` `Approval` row exist with `approverId === actorId` at the current step" (`own`). It never checked that a `DEPARTMENT`-type step's approver actually belongs to *this* requisition's department — so the Operations head's (misassigned) Approval row was honored at face value.

Reject shares the identical `decide()` code path (confirmed by reading `ProcurementService.rejectPurchaseRequisition`, `src/services/ProcurementService.ts:1345-1453`), so it had the same gap. There is no separate "return for amendment" action in this codebase to check.

### Fix

Backend-only; branch `fix/procurement-department-authz-bypass` (2 files changed):

- `ProcurementController.ts`: added `assertUserCanViewDepartmentPurchaseRequisition` — a requisition may be viewed by its own requester; an admin/CFO or `procurement.requisitions.view` holder; `PROC_MGR`; a member of the requisition's own department; or a genuine cross-department approver on *this* requisition's route whose step is ROLE/USER/AMOUNT_THRESHOLD (not DEPARTMENT). Wired into `getPurchaseRequisitionById` for the non-investee case.
- `ProcurementRequisitionApprovalService.ts`: `decide()` now re-checks, for a `DEPARTMENT`-type step, that the actor's own `userDepartment` matches the requisition's actual `department` (looked up live, not trusted from the `Approval` row) before honoring an `own` match, unless the actor is module-privileged (admin/CFO). ROLE/USER/AMOUNT_THRESHOLD steps (CFO, PROC_MGR, a named person, a threshold-based finance approver) are explicitly unaffected — they are legitimately cross-department by design.
- Data: also corrected the live misconfigured approval matrix via the existing (legitimate, admin-only) `PUT /procurement/approval-matrix` endpoint — the single general-route step's department was changed from the hard-pinned `"Operations"` back to `null` ("the requester's own department"), which is what `ApprovalService`'s dynamic-routing branch already expected. Without this, the code fix alone would have left every non-Operations department (including Finance) with no valid approver at all for their own requisitions — confirmed there were no other pending non-Operations requisitions at the time, so this was safe to correct immediately.

### Verification

Live on dev (`https://dev-api.matanho.com`), after deploying the API-only fix and correcting the matrix:

1. Created and submitted a fresh Finance-department test requisition as `payroll.finmgr@nts.local` (`cmu6vos7u000io101zghaxyl5`, `REQ_20260918_0004`).
2. `perf.deptmgr@nts.local` (Operations HEAD) `GET` by id → **403** `"You are not authorized to view Finance department requisitions."` (was 200 before the fix).
3. `perf.deptmgr@nts.local` `PUT .../approve` → **400** `"This requisition waits for step 1 of 1, Head of Finance (Blessing Sibanda). You are not an approver on that step."` (same refusal style/status as the pre-existing, already-correct self-approval check; was 200 "approved successfully" before the fix).
4. `perf.deptmgr@nts.local` `GET /requisitions/pending-approval` (regression check) → unchanged, still only the 3 Operations-department requisitions.
5. `payroll.finmgr@nts.local` (the legitimate Finance HEAD) `PUT .../approve` on their own department's requisition → **200** `"Purchase requisition approved successfully"`, `approvedBy: payroll.finmgr@nts.local` — legitimate same-department approval still works.
6. `perf.deptmgr@nts.local` `GET` by id after approval → still **403** (department isolation holds post-decision, not just pre-decision).

### Cleanup

The two test requisitions created during discovery and verification (`cmu6uqz7j003vnz01f24nx5ij`, now incorrectly `APPROVED` by the Operations head from before the fix — left as-is; and `cmu6vos7u000io101zghaxyl5`, correctly `APPROVED` by Finance's own head after the fix) were left in `arcus_dev`. Both are titled "safe to delete" / "Post-fix verification" and are non-draft, so there is no delete endpoint for them per the SRD's soft-delete/historical-integrity rule — this matches the expected, by-design limitation, not an omission.

**Status:** FIXED — deployed to dev (API only, no UI/portal service touched), verified live 18 September 2026. Branch `fix/procurement-department-authz-bypass`, commit `15d0363`, pushed to `origin`. Not merged to prod. Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-012

**Title:** `GET /procurement/vendor-portal/rfq` read its line-item snapshot as if it were stored as a bare array — always false, silently masked by a fallback
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Functional / data integrity
**Severity:** MEDIUM (no live vendor was ever shown wrong data by this — see "Actual" below — but the fallback it depended on is not always safe)
**Persona affected:** An invited vendor on an RFQ with no linked requisition (would see zero line items, forever); an invited vendor on an RFQ whose source requisition's items were edited after the RFQ was sent (would silently see the requisition's *current* items instead of what the RFQ actually asked for)
**Surface:** API `GET /api/procurement/vendor-portal/rfq`

### Steps to reproduce

Continuing the same SRD §9/§15 UAT as PROC-FINDING-009, now with a correctly-shaped token (`r` =
the RFQ's database id, per that finding): `RFQ_20260918_0001`
(`procurement_rfqs.id = cmu6tel5o002qnz01eebn8wfu`), vendor Baobab Networks & Computing
(`cmtzc7u8s02jhnu01al4q2jeo`). Before trusting the endpoint's item output, its `itemsSnapshot`
column was read directly from the database: `{"items":[{"unit":"Each","itemName":"Ergonomic
office chairs","quantity":4,"lineTotal":null,"unitPrice":null}]}` — an **object** with an `items`
key, not a bare array.

### Actual

`ProcurementController.getVendorPortalRfq` (`src/controllers/ProcurementController.ts:1449`, before
this fix) computed the lines with:

```ts
const snapshot = Array.isArray(rfq.itemsSnapshot) ? (rfq.itemsSnapshot as any[]) : [];
const lines = (snapshot.length ? snapshot : ((rfq.requisition?.items as any[]) ?? [])).map(...)
```

`itemsSnapshot` is **always** persisted as `{ items: [...] }` — see
`ProcurementService.ts:1991` (`itemsSnapshot: { items: resolvedItems } as object`) and the existing
unwrap helper `enrichRfqItemsSnapshotForApi` (`src/utils/rfqItemInput.ts:118-137`), which every other
reader of this column already accounts for. `Array.isArray(rfq.itemsSnapshot)` was therefore always
`false`, `snapshot` was always `[]`, and every call silently fell through to
`rfq.requisition?.items` — the requisition's row **right now**, not the RFQ's own snapshot as issued.

This produced no visible symptom for `RFQ_20260918_0001`, because its linked requisition still
exists and its items are unchanged since the RFQ was sent — the fallback happens to return the same
data the snapshot would have. A direct call to the live (pre-fix) endpoint with a correctly-shaped
token confirmed this: **200**, full vendor details, and the one item (`Ergonomic office chairs`,
qty 4, unit `Each`) — already correct, for the wrong reason. The comment directly above the code
("The lines as the RFQ was issued (its snapshot), else the requisition's") describes intent this
code did not actually implement.

Two cases where it would have mattered, neither present in this dataset: an RFQ raised without a
linked requisition (`requisitionId` null) would show no items at all, forever, since both the
snapshot read and the fallback would be empty; an RFQ whose requisition's line items were edited,
added to, or removed after the RFQ was sent would silently show the requisition's edited state
rather than what the vendor was actually asked to quote on.

### Root cause

`Array.isArray()` checked the wrapper object itself instead of unwrapping its `items` field first,
unlike every other reader of this same JSON column.

### Fix

**nvccz `d93713a`** (branch `fix/procurement-vendor-quote-prefill`,
`src/controllers/ProcurementController.ts`): unwrap `itemsSnapshot.items` the same way
`enrichRfqItemsSnapshotForApi` and `ProcurementRfqService.extendClosing` (`ProcurementRfqService.ts:290`)
already do, keeping the bare-array shape as a defensive fallback for any pre-existing row, and only
then falling back to the requisition's current items when the snapshot truly has none.

No frontend change was needed or made. `app/vendor-quotations/rfq-respond/page.tsx` and
`lib/api/procurement-api-v2.ts:getRfqInvitation` already call this endpoint and prefill company
name, contact person, email, phone, tax EIN, address, currency and every line from the response —
this is the PROC-FINDING-008 / cycle-eight-phase-5 fix, already on `origin/dev` (verified identical,
byte for byte after line-ending normalisation, to what is checked into `nvccz-new`'s working tree)
and already in the deployed `arcus-dev-ui-vendor-1` bundle (built 15 September 2026; the marker
string added by that fix, `"quotation link is not valid"`, is present in the served chunk
`app/vendor-quotations/rfq-respond/page-293ab9a3291ba47d.js`). There is nothing to fix or deploy on
the UI side for this finding.

### Verification

Tokens minted inside `arcus-dev-api-1` with the real `signVendorPortalToken`, `r` = the RFQ's actual id:

| | Before `d93713a` | After `d93713a` (deployed) |
|---|---|---|
| `GET /procurement/vendor-portal/rfq` | **200** — vendor details correct; item correct *only* via the requisition fallback | **200** — identical output, now read from the RFQ's own `itemsSnapshot` |
| Compiled fix present in the running container | — | `grep` on `/app/dist/controllers/ProcurementController.js` inside `arcus-dev-api-1` finds the new comment |

Live browser render of `https://dev.vendor.matanho.com/vendor-quotations/rfq-respond` with a fresh
token (post-deploy): organisation name ("Matanho Investment Management (Private) Limited"), RFQ
title, closing date (09 Oct 2026), and all of Company Name, Tax EIN, Contact Person, Email, Phone
and Business Address prefilled from the vendor's master record; Quoted Items pre-populated with
"Ergonomic office chairs", qty 4, unit "Each" — all editable, matching the digest fix's original
intent ("prefill the lines and the vendor's details, names the organisation").

**End-to-end quotation submission**, through that same live form: Unit Price 185, Delivery Time
"10 business days", Quote Valid Until 18 Oct 2026 (30 days out). Submitted successfully —
confirmation screen showed quotation number `QUO_20260918_0001`, total USD 740.00. Confirmed
independently, read-only, in the database inside `arcus-dev-api-1`:

```
VendorQuotation { quotationNumber: "QUO_20260918_0001", status: "SUBMITTED", totalAmount: "854.7",
  currencyCode: "USD", vendorId: "cmtzc7u8s02jhnu01al4q2jeo", vendorEmail: "accounts@baobabnetworks.example.com" }
```

(854.70 includes tax on the 740.00 subtotal.) Confirmed on the staff side, signed in as the
Procurement Manager (`proc.mgr@nts.local`) at `dev.matanho.com`:

- **Tenders & RFx** register: `RFQ_20260918_0001` now reads **BIDS 1**, stage **Evaluation** (was 0
  bids, Open, before this submission).
- **Quotation Comparison** register: the same RFQ reads **"1 supplier response,"** stage
  Evaluation, "0 of 1 scored."

### A note on the originally-reported symptom

The premise this investigation started from — opening the real vendor form with a correctly-signed
token and finding Company Name, Contact Person, Email, Phone and the item line all blank — did
**not** reproduce here. Every live check above, with the RFQ id correctly placed in the token's `r`
field, returned fully prefilled vendor details and line items both before and after `d93713a`. This
matches PROC-FINDING-009's conclusion: the only way this endpoint has been made to return blank or
missing data on dev was a hand-minted token with the RFQ's display number in `r` instead of its
database id, which the endpoint correctly refuses with 404 (a blank *error* page, not a loaded form
with blank fields) — a token no real invitation link can ever produce. The `itemsSnapshot` defect
fixed above is real and worth shipping regardless, but it is not the cause of the originally-reported
blank-form symptom, which no combination of steps in this session could reproduce against the live
dev endpoint.

**Status:** DEPLOYED to dev API, 18 September 2026 (`arcus-dev-api-1` rebuilt from
`fix/procurement-vendor-quote-prefill` at `d93713a`, health 200). Branch pushed to
`odlemon/nvccz` — **not merged to `master`**. No frontend branch: nothing to change.

| | Dev |
|---|---|
| API | `fix/procurement-vendor-quote-prefill` (`d93713a`), built and swapped, health 200 |
| Staff portal | rebuilt from unmodified `origin/dev` alongside the API deploy (no functional change; same commit already running) |
| Vendor portal | untouched — already carries the PROC-FINDING-008 fix, unaffected by this change |
| Real record created | `QUO_20260918_0001` against `RFQ_20260918_0001`, USD 854.70, SUBMITTED — a genuine test artifact on dev, left in place as the finding's evidence |

---

## PROC-FINDING-013

**Title:** User Master had no Active/Suspended/Locked/Deactivated state -- a suspended user could still log in
**Module:** Backend platform (`nvccz`, shared `User` model -- not procurement-specific, but exercised through this UAT pass) . **Dimension:** Security . **Category:** Missing capability (SRD requirement never implemented)
**Severity:** CRITICAL -- SRD `NTS_SRD_DT_ProcMS` section 7 "User Master" requires users to be capable of Active, Suspended, Locked and Deactivated states, and section 70 "Critical Security Test Cases" lists "suspended users cannot log in" as a mandatory pre-production test. Neither the schema nor the login path had any notion of account status at all, so a suspended/locked/deactivated staff member's credentials kept working indefinitely with no way to cut them off short of deleting the account (itself against section 7's "records should not be permanently deleted where they have historical transactions").
**Persona affected:** Every staff user; specifically, any account an admin needs to suspend, lock or deactivate without deleting
**Surface:** Prisma `User` model / `users` table; API `POST /api/auth/login`; API `PUT /api/users/:id`

### Investigation

Grepped the entire `User` model in `prisma/schema.prisma` (`nvccz`) for any status/active/suspended/locked/deactivated field -- zero matches. `AuthController.login` (`src/controllers/AuthController.ts`, the `login` method) selected only `id, email, firstName, lastName, password, mustChangePassword, userDepartment, roleCode, roleId, tokenVersion, role.name` and never checked any status field, because there wasn't one to check. `PUT /api/users/:id` (`UserController.updateUser` / `UserService.updateUser`) also had no route-level permission middleware at all -- `router.put("/:id", UserController.updateUser)` -- despite already accepting other privileged fields (`roleId`, `roleCode`, `department`), while the sibling `POST /api/users` route in the same file already required `requireInternalStaffUser()` + `requirePermission("manage_users")`. So even after adding a status field, there was no properly-gated place to set it.

### Fix

Branch `security/user-master-status-enforcement`, commit `8f37f29`, cut from a clean `origin/master` worktree (not from any of the other in-progress feature branches sitting in the shared checkout). 7 files changed:

- **Schema:** `prisma/schema.prisma` -- added `User.status String @default("ACTIVE") @db.VarChar(32)` (matches the house style used by other status columns, e.g. `vendors.tax_compliance_status`) plus `@@index([status], map: "users_status_idx")`.
- **Migration:** `scripts/run-user-status-migration.ts`, registered as `npm run db:migrate:user-status` in `package.json` (auto-picked up by `db:migrate:all`, which discovers every `db:migrate:*` script). Idempotent: `ALTER TABLE users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'` guarded by an `information_schema.COLUMNS` existence check (same pattern as `run-employee-terminated-columns-migration.ts`), backfills any blank/null row to `'ACTIVE'`, adds the index, then verifies every row's value is one of the four SRD states.
- **Enforcement:** `AuthController.login` now selects `status` and, immediately after the `!user` check and *before* `bcrypt.compare` (so a suspended/locked/deactivated account's password is never compared -- no timing side-channel, same shape as the existing early return), rejects non-`ACTIVE` accounts with **403** and a status-specific message (`"This account is suspended. Contact your administrator."` / `"...is locked..."` / `"...has been deactivated..."` -- never the generic "Invalid credentials," which would misrepresent the actual reason).
- **Admin-facing update path:** `PUT /api/users/:id` now accepts and validates `status` (must be one of `ACTIVE`/`SUSPENDED`/`LOCKED`/`DEACTIVATED`, case-normalized, else **400**). Rather than adding a new, separately-protected way to change it, the route itself was gated with `requireInternalStaffUser()` + `requirePermission("manage_users")` -- the same check `POST /api/users` already uses -- closing the pre-existing gap where this endpoint had no permission check at all. Status changes are audit-logged (`USER_STATUS_UPDATE`, old/new value, actor, IP, user agent), matching the existing `USER_ROLE_UPDATE` audit entry already emitted by the same function.

### Deploy

Deployed API-only to dev (no UI/portal service touched): built from the clean `security/user-master-status-enforcement` worktree, avoiding the shared dirty `nvccz` checkout entirely (per "deploy committed code only"). The first attempt raced with another sibling agent's concurrent deploy against the shared `src/api` staging directory on the VPS and had to be rebuilt from an isolated remote build context to get a clean, unambiguously-this-branch image -- confirmed by grepping the compiled `dist/controllers/AuthController.js` and `dist/services/UserService.js` inside the resulting `arcus-dev-api-1` container for `SUSPENDED` / `accountStatus` / `USER_STATUS_UPDATE` before trusting it. The freshly built image briefly crash-looped (`P2022: The column arcus_dev.users.status does not exist`) because the container's own startup admin-seed script queries the `User` model before the migration had run; ran `npm run db:migrate:user-status` via a one-off container on the same Docker network against the real dev database, then recreated `arcus-dev-api-1`, which came up healthy with no further errors.

### Verification

Live against `https://dev-api.matanho.com`, in order, all in a single pass:

| Step | Result |
|---|---|
| Admin login (`admin@nts.com` / `admin123`) | **200** |
| Seeded persona baseline (`proc.requester@nts.local` / `admin123`) | **200** |
| `POST /users` -- create throwaway user (`userstatus.throwaway.<ts>@nts.local`, IT_MGR) as admin | **201**, `temporaryPassword` returned in response |
| Throwaway user login, before any status change | **200** |
| `PUT /users/:id` `{status: "SUSPENDED"}` as admin | **200** |
| Throwaway user login while `SUSPENDED`, same password | **403** `"This account is suspended. Contact your administrator."` |
| Seeded persona login, mid-test | **200** -- unaffected |
| `PUT /users/:id` `{status: "ACTIVE"}` as admin | **200** |
| Throwaway user login after reactivation, same password | **200** -- succeeds again |
| `PUT /users/:id` `{status: "LOCKED"}` as admin | **200** |
| Throwaway user login while `LOCKED` | **403** `"This account is locked. Contact your administrator."` |
| `PUT /users/:id` `{status: "DEACTIVATED"}` as admin | **200** |
| Throwaway user login while `DEACTIVATED` | **403** `"This account has been deactivated. Contact your administrator."` |
| `PUT /users/:id` `{status: "ACTIVE"}` (final restore) | **200** |
| Throwaway user login after final restore, same password | **200** |
| Seeded persona login, end of test | **200** -- unaffected throughout |
| `PUT /users/:id` `{status: "BOGUS"}` as admin | **400** `"Invalid status. Valid statuses: ACTIVE, SUSPENDED, LOCKED, DEACTIVATED"` |

Migration output on the real dev database: `[ok] added users.status`, `[ok] backfill: blank/null status -> ACTIVE`, `[ok] added index users_status_idx`, `[verify OK] users.status`, `[verify OK] all users.status values are within the allowed SRD set`. The throwaway test user was deleted (`DELETE /users/:id`) after verification; no seeded persona was modified.

**Status:** FIXED and deployed to dev (API only), verified live 18 September 2026. Branch `security/user-master-status-enforcement`, commit `8f37f29`, pushed to `origin` (`odlemon/nvccz`). Merged to `master` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`). The migration has **not** been run against production -- run `docker exec <prod-api-container> npm run db:migrate:user-status` deliberately, after this is reviewed and scheduled for a prod deploy.

---

## PROC-FINDING-014

**Title:** A quotation can be awarded (and its PO generated) without the bid ever being technically scored
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Process control (not security, not data integrity)
**Severity:** LOW — a documented UAT step can be silently skipped; no data corruption, no unauthorized access
**Persona affected:** Procurement Manager (award), Procurement Officer (evaluation) — the two are meant to be separate desks by design (see `vendorQuotationRoutes.ts:396-398`'s own comment: "Scoring... and awarding... are separate grants, so the desk that scores is not the one that decides")
**Surface:** API `POST /vendor-quotations/:id/accept`, `PUT /vendor-quotations/:id/evaluation`

### Steps to reproduce (live on dev, 18 September 2026, completing SRD §60 steps 6-15 with fresh data)

Continuing the fresh `RFQ_20260918_0001` chain used in PROC-FINDING-009/011/012 (own requisition → RFQ → vendor invitation → `QUO_20260918_0001` submitted):

1. As `proc.mgr@nts.local`, `POST /vendor-quotations/cmu6vmoe.../accept` with no prior scoring call — **200**, `"Quotation accepted. Purchase order PO_20260918_0001 created and emailed to the vendor."` RFQ moved straight to `AWARDED`, `awardedQuotationId` set, PO generated in the same call.
2. As `proc.officer@nts.local`, `PUT /vendor-quotations/cmu6vmoe.../evaluation` (score 85) *after* the accept above — **409** `"Quotation has already been accepted"`.

### Expected

Per SRD §60's example journey ("6. Supplier submissions are compared. 7. Committee evaluates. 8. Recommendation is prepared. 9. Approver approves. 10. PO is generated."), evaluation/scoring is a distinct, required step before a recommendation/award decision — the UI's own Bid Evaluation page frames scoring as something that happens before the "Final Award Decision" panel unlocks. Nothing server-side enforces that order.

### Root cause

`VendorQuotationController.acceptQuotation` (gated on `rfq.award`) does not check whether `technicalScoreJson` is populated before accepting. This wasn't reachable as a bug in earlier cycles because those UATs always scored before awarding (following the intended UI flow); testing the API directly, out of order, showed the server has no independent enforcement of the sequence a determined or careless user could skip in the UI as well (nothing disables "Final Award Decision" pending a score in the frontend either — it only disables *recording who won* until a role check passes, not until scoring is complete).

### Assessment

Not escalated to a fix agent at the time: this is a process-control question (should the platform force evaluation before award, or is scoring advisory/optional for a single-bid RFQ where there's nothing to "compare"?), not a defect with an obvious right answer. Recorded as a finding for a product decision rather than shipping a guess.

### Decision and fix (19 September 2026)

Took option (a), scoped to when it actually matters: `VendorQuotationService.reviewQuotation` now blocks `ACCEPT` when the RFQ has more than one open (`SUBMITTED`/`UNDER_REVIEW`) quotation and any of them lacks a `technicalScoreJson.evaluation.score`. A sole-source/single-bid RFQ (0 or 1 open quotations) is unaffected -- there's nothing to compare, matching the SRD's own framing of scoring as a comparison step rather than an award gate in its own right, and matching option (b)'s reasoning for exactly that case. This closes the actual risk (a competitive award skipping evaluation) without inventing a new restriction for the case the original assessment explicitly said should stay flexible.

Branch `fix/proc-remaining-uat-findings` (`nvccz`), commit `c9b8876`, cut from a clean worktree off `origin/master`.

### Verification

Live on dev, 19 September 2026, via direct API calls (own fresh data, not reused fixtures):

1. Created `REQ_20260919_0008` (Operations, own requisition), approved, converted to `RFQ_20260919_0004` inviting two vendors (Baobab Networks & Computing, Granite Ridge Stationers). Both submitted quotations (`QUO_20260919_0003`, `QUO_20260919_0004`).
2. `POST /vendor-quotations/{QUO_20260919_0003 id}/accept` as `proc.mgr@nts.local`, **neither** quotation scored -> **400** `"All submitted quotations on this RFQ must be technically scored before one can be awarded. Missing evaluation for: Baobab Networks & Computing (Pvt) Ltd, Granite Ridge Stationers (Pvt) Ltd."` (was **200** before this fix -- this is the exact finding's original repro, now blocked).
3. Separately, a sole-source RFQ (`RFQ_20260919_0005`, single vendor invited, `QUO_20260919_0005`): `accept` with **no** scoring -> **200**, `"Quotation accepted. Purchase order PO_20260919_0002 created..."` -- confirms single-bid/sole-source flexibility is preserved exactly as intended.
4. Back on the competitive RFQ: scored only `QUO_20260919_0003` (`PUT .../evaluation {score: 82}` as `proc.officer@nts.local`), then retried `accept` -> **still 400**, message narrowed to the one remaining unscored vendor ("Missing evaluation for: Granite Ridge Stationers (Pvt) Ltd.") -- confirms the gate checks *every* open quotation, not just the one being accepted.
5. Scored `QUO_20260919_0004` (`score: 74`), retried `accept` -> **200**, `"...Purchase order PO_20260919_0003 created..."` -- award proceeds once every open quotation is scored.

### Cleanup

`REQ_20260919_0008`/`RFQ_20260919_0004`/`QUO_20260919_0003`/`QUO_20260919_0004`/`PO_20260919_0003` (competitive path, correctly awarded after both scored) and `REQ_20260919_0009`/`RFQ_20260919_0005`/`QUO_20260919_0005`/`PO_20260919_0002` (sole-source path, correctly awarded without scoring) are left in `arcus_dev`, clearly titled "PROC-FINDING-014 verification" and traceable by number/timestamp.

**Status:** FIXED -- deployed to dev (API only), verified live 19 September 2026 (5 sub-cases, all passed). **Merged to `master`, not prod.**

---

## SRD §60 UAT journey — completed end-to-end with fresh live data, 18 September 2026

The 15-step example journey in `NTS_SRD_DT_ProcMS_16_09_2026.pdf` §60 was walked in full using one fresh, self-created record chain (not historical data), confirming the module implements every step:

| Step | SRD text | Result |
|---|---|---|
| 1 | User creates requisition | `REQ_20260918_0001` created by `proc.requester@nts.local` |
| 2 | Manager approves | Department-scoped approval, correctly enforced (see PROC-FINDING-011) |
| 3 | Procurement converts requisition to RFQ | `RFQ_20260918_0001` created from the approved requisition |
| 4 | Suppliers invited | 2 vendors invited (`RfqVendorInvitation` rows confirmed), `INVITED_ONLY` visibility |
| 5 | Quotations received | `QUO_20260918_0001` submitted through the real vendor portal (token-scoped link), after PROC-FINDING-009 (false alarm, hand-minted token) and a real latent bug found and fixed in PROC-FINDING-012 (`itemsSnapshot` unwrap) |
| 6 | Supplier submissions compared | Quotation Comparison / Bid Evaluation screen shows the bid ranked against the RFQ's lowest-bid baseline |
| 7 | Committee evaluates | Evaluation endpoint works (`PUT /vendor-quotations/:id/evaluation`), but see PROC-FINDING-014 — not enforced before award |
| 8 | Recommendation prepared | `POST /vendor-quotations/:id/accept` as Procurement Manager |
| 9 | Approver approves | Award and approval are the same action in the live implementation (see PROC-FINDING-014) |
| 10 | PO generated | `PO_20260918_0001` created and emailed to the vendor in the same call as step 8/9 |
| 11 | Goods received | `GRN_20260918_0001`, 4/4 units received, quality PASSED; PO moved to `DELIVERED` |
| 12 | Invoice captured | `INV_20260918_0001` captured by `proc.ap@nts.local`, DRAFT |
| 13 | Matching controls operate | Three-way match ran automatically on capture: `matchingStatus: MATCHED`, line-level detail confirms ordered/accepted/invoiced quantities and prices all agree |
| 14 | Invoice marked Ready for Finance | `PUT /invoices/:id/approve` by `payroll.finmgr@nts.local` → `status: APPROVED`, `paymentStatus: PENDING` |
| 15 | Audit trail confirms every step | `GET /procurement/audit-events` shows, in order: CREATE/SUBMIT/APPROVE `PurchaseRequisition`, CREATE `RFQ`, SUBMIT/APPROVE `VendorQuotation`, CREATE/SEND `PurchaseOrder`, CREATE `GoodsReceivedNote`, CREATE/APPROVE `ProcurementInvoice` — every step of this exact chain is present |

**Status:** PASSED end-to-end, own fresh data, 18 September 2026. One process-control gap noted separately as PROC-FINDING-014.

---

## PROC-FINDING-015

**Title:** A requester who is also their own approver could approve (and reject) their own purchase requisition
**Module:** Procurement (backend) · **Dimension:** Security · **Category:** Broken access control (segregation of duties)
**Severity:** CRITICAL — SRD `NTS_SRD_DT_ProcMS_16_09_2026.pdf` §70 "Critical Security Test Cases" test 4, "requestors cannot self-approve where prohibited", did not hold. This is a separate defect from PROC-FINDING-011 (cross-department bypass): that fix made a `DEPARTMENT`-step approval honor only the requisition's *own* department, but never checked whether the deciding actor *is* the requester, regardless of department.
**Persona affected:** Any user who is simultaneously a requester and a legitimate approver for their own request — most directly a department head/deputy raising a requisition in their own department where they are also the sole approval-step approver, but the same gap applied to a threshold or named-person approval step and was not waived for admin/CFO either
**Surface:** API `PUT /procurement/requisitions/:id/approve`, `PUT /procurement/requisitions/:id/reject`

### Steps to reproduce (as reported, live on dev, 18 September 2026)

1. Logged in as `payroll.finmgr@nts.local` (Blessing Sibanda, Finance Manager, Finance's department HEAD).
2. Created a purchase requisition via `POST /procurement/requisitions` (`department: "Finance"`), submitted it via `PUT /procurement/requisitions/:id/submit` — `REQ_20260918_0005`, moved to `PENDING_APPROVAL` correctly, routed to "Pending Head of Finance" with "Can decide: Blessing Sibanda" (themselves — Finance's sole department-head approval step).
3. Opened the approval review screen as the same user: the "Approve requisition" button was live, no warning or block.
4. `PUT /procurement/requisitions/cmu.../approve` as the same user — **200** `"Purchase requisition approved successfully"`. The requester approved their own requisition.

### Investigation

`ProcurementRequisitionApprovalService.decide()` (the same function PROC-FINDING-011 already patches for the department check) verified only:
(a) is there a `PENDING` `Approval` row assigned to the deciding actor at the current step (or is the actor module-privileged), and
(b) — after the PROC-FINDING-011 fix — for a `DEPARTMENT`-type step, does the actor's own department match the requisition's department.

Neither check compares the deciding actor's id against the requisition's `requestedById`. A department head deciding a `DEPARTMENT`-type step for their own department's own requisition passes both checks even when they are also the requester, because "am I an approver on this step" and "does this step belong to my department" are both true — the missing question is "am I the person who asked for this."

`ProcurementService.rejectPurchaseRequisition` shares the identical `decide()` code path for routed requisitions, so self-*reject* had the same gap (confirmed by reading, not separately exploited live — self-reject is a lesser concern than self-approve, but the SRD gives no exception process for either, so both are blocked the same way). Two further, independent copies of the same gap were found while fixing: `ProcurementService.approvePurchaseRequisition` and `rejectPurchaseRequisition` each carry a **legacy fallback branch** (`routed = await decide(...); if (routed) return routed;` falls through when a requisition has no open approval route — e.g. one submitted before routes were enforced) that re-implements its own department-head/deputy check and does not call `decide()` at all, so it had no self-decision check either, before or after PROC-FINDING-011.

An existing, already-correct precedent for this exact rule was found in the same codebase: `ProcurementRegistersService.ts:473`, `if (plan.createdById === userId) throw new RegisterError(403, "The plan's author cannot approve or reject it");` for Annual Procurement Plans. The requisition fix mirrors this pattern rather than an escalation-to-next-approver scheme, since the SRD gives no exception process and Finance's approval matrix has exactly one step with exactly one named approver — there is nowhere to escalate to without a product decision this finding doesn't make.

### Fix

Backend-only; branch `fix/proc-finding-015-self-approval` (cut from a clean worktree off `origin/master`, merged with the three sibling fixes already live on dev but not yet in `master` — `fix/procurement-department-authz-bypass` (PROC-FINDING-011), `fix/procurement-vendor-quote-prefill` (PROC-FINDING-012), `security/user-master-status-enforcement` (PROC-FINDING-013) — so this deploy would not regress any of them), commit `1386889`, 2 files changed:

- `ProcurementRequisitionApprovalService.ts`, `decide()`: after the existing "is this actor a valid approver on this step" and department-of-record checks, a new unconditional check blocks the decision outright with **400** `"You cannot approve or reject your own purchase requisition."` when `requisition.requestedById === actorId`. Unlike the department check, this applies to **every** step type (`DEPARTMENT`, `ROLE`, `USER`, `AMOUNT_THRESHOLD`) and is **not** waived for a module-privileged actor (admin/CFO) — privilege lets them decide someone else's pending step, never their own request. No escalation-to-next-approver was implemented (the SRD gives no exception process); a requisition with genuinely no other valid approver is left blocked with a clear error rather than silently approved.
- `ProcurementService.ts`: the same guard added to both legacy no-open-route fallback branches in `approvePurchaseRequisition` and `rejectPurchaseRequisition`, which don't call `decide()` and so wouldn't otherwise inherit the fix.

No schema change; no migration.

### Verification

Live on dev (`https://dev-api.matanho.com`), after deploying the API-only fix (`arcus-dev-api:proc015-20260918`, confirmed by grepping the compiled `dist/services/ProcurementRequisitionApprovalService.js` and `dist/services/ProcurementService.js` inside the recreated `arcus-dev-api-1` container for the new message text before trusting it; container healthy, `RestartCount=0` before and after):

1. Created and submitted a fresh Finance-department test requisition as `payroll.finmgr@nts.local` (`REQ_20260918_0007`), routed to "Head of Finance (Blessing Sibanda)" — the same self-approver shape as the original report.
2. `payroll.finmgr@nts.local` `PUT .../approve` on their own `REQ_20260918_0007` → **400** `"You cannot approve or reject your own purchase requisition."` (was 200 "approved successfully" before the fix, per the original report on `REQ_20260918_0005`).
3. `payroll.finmgr@nts.local` `PUT .../reject` on the same requisition → **400**, same message (self-reject also blocked).
4. **PROC-FINDING-011 regression check:** `perf.deptmgr@nts.local` (Operations HEAD, a different department) `PUT .../approve` on Finance's `REQ_20260918_0007` → **400** `"This requisition waits for step 1 of 1, Head of Finance (Blessing Sibanda). You are not an approver on that step."`; `GET` by id → **403** `"You are not authorized to view Finance department requisitions."` — both unchanged from the PROC-FINDING-011 fix, confirming this change did not reopen it.
5. **Legitimate different-person approval still works:** created and submitted a fresh Operations-department requisition as `proc.requester@nts.local` (an Operations member, `REQ_20260918_0008`); `perf.deptmgr@nts.local` (Operations HEAD, a different person from the requester) `PUT .../approve` → **200** `"Purchase requisition approved successfully"`, `approvedBy: perf.deptmgr@nts.local` — ordinary same-department, different-person approval is unaffected.

### Cleanup

`REQ_20260918_0007` (Finance, left `PENDING_APPROVAL` — every approve/reject attempt against it was refused, so it has no valid decision) and `REQ_20260918_0008` (Operations, correctly `APPROVED` by its legitimate department head) were left in `arcus_dev`, following the same precedent as PROC-FINDING-011's cleanup note (both titled with "verification"/"regression check" and traceable to this finding by requisition number and timestamp).

**Status:** FIXED — deployed to dev (API only, no UI/portal service touched), verified live 18 September 2026. Branch `fix/proc-finding-015-self-approval`, commit `1386889`, pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-016

**Title:** User Master had no Approval Level/Approval Limit -- a valid approver's decision was never checked against their own personal authority ceiling
**Module:** Backend platform (`nvccz`, shared `User` model plus `ProcurementRequisitionApprovalService`/`ProcurementService`) -- not procurement-specific by SRD section, but exercised and enforced through this module's approval path. **Dimension:** Security. **Category:** Missing capability (SRD requirement never implemented)
**Severity:** CRITICAL -- SRD `NTS_SRD_DT_ProcMS_16_09_2026.pdf` §7 "User Master" requires the user master to maintain, among other fields, Approval Level and Approval Limit. §6/§8 give a worked example ("Approver A: up to US$5,000; Approver B: US$5,001-25,000; Approver C: US$25,001-100,000; Executive Committee: above configured threshold") and state "a user must not be able to approve a transaction where the approved segregation-of-duties matrix prohibits it" and "the system must support configurable approval limits. Actual approval limits must come from Client configuration." §70 "Critical Security Test Cases" explicitly lists "approval limits are enforced server-side" as a mandatory pre-production test.
**Persona affected:** every approver whose personal authority should be capped below what the shared workflow routing would otherwise let them decide; every requisition whose value should require an escalation the matrix alone doesn't force
**Surface:** Prisma `User` model (`nvccz/prisma/schema.prisma`); `ProcurementRequisitionApprovalService.decide()`; `ProcurementService.approvePurchaseRequisition`'s legacy no-open-route fallback; `PUT /api/users/:id`

### Investigation

Grepped the full `User` model in `prisma/schema.prisma` -- no `approvalLimit` or `approvalLevel` field anywhere. Amount-based approval routing does exist, but only as a shared, admin-configured workflow-step property: the `AMOUNT_THRESHOLD` step type in `ApprovalService.ts` (~line 249) decides *who gets assigned* a pending `Approval` row at submission time by comparing the transaction amount against a threshold configured on the approval matrix/workflow stage itself -- never against any attribute of the individual user. Once that row is assigned, `ProcurementRequisitionApprovalService.decide()` (the same function PROC-FINDING-011 and PROC-FINDING-015 already patch this cycle) honors it purely on "is there a pending row for this actor at this step" -- it never independently re-checks that the specific approving user's own authorized ceiling actually covers the transaction amount. Per that function's own pre-existing structure, `ROLE`/`USER`/`AMOUNT_THRESHOLD`-type steps are exempt from the PROC-FINDING-011 department re-validation, and there was no decision-time amount/authority re-validation of any kind for any step type. Practical risk: if the shared approval-matrix config is ever misconfigured (PROC-FINDING-011's root cause was exactly this) or a user's seniority changes between when an `Approval` row is created and when they act on it, nothing server-side catches an approval that exceeds what that specific person should be allowed to authorize -- and there was no admin-facing way to say "this person's authority tops out at $X" independent of the shared workflow config at all.

### Fix

Branch `fix/proc-approval-limits`, commit `1bac209`, cut from a clean worktree off `origin/master`, fast-forward-merged with `origin/fix/proc-finding-015-self-approval` (which already carries PROC-FINDING-011, PROC-FINDING-012 and PROC-FINDING-013, live on dev but not yet in `master`) so this deploy would not regress any of them. 7 files changed:

- **Schema:** nullable `User.approvalLimit` (`Decimal(15,2)`, maps to `approval_limit`). Null means "no personal ceiling override, defer entirely to workflow routing" -- additive, no behavior change for any user who doesn't opt in.
- **Migration:** `scripts/run-approval-limit-migration.ts`, idempotent (`information_schema` column-existence guard, same pattern as `run-employee-terminated-columns-migration.ts` / `run-user-status-migration.ts`), registered as `db:migrate:approval-limit` in `package.json` (auto-discovered by `db:migrate:all`, which enumerates every `db:migrate:*` script -- no change to the runner itself needed).
- **Enforcement:** `ProcurementRequisitionApprovalService.decide()` -- after the existing step/department/self-approval checks -- refuses an **APPROVE** decision with **400** (`"Your approval limit is $X; this transaction is $Y. Escalate to an approver with sufficient authority."`) when the actor has a non-null `approvalLimit` below the requisition's `totalAmount`. Waived for a module-privileged actor (`isModulePrivilegedUser`: admin/CFO -- the same bypass this codebase already uses for the DEPARTMENT check and the approval matrix itself); **not** waived for the self-approval rule, since that check is unrelated and fires first regardless. Only gates `APPROVE`, never `REJECT` (rejecting authorizes nothing). The identical guard was added to `ProcurementService.approvePurchaseRequisition`'s legacy no-open-route fallback branch, which doesn't call `decide()` and wouldn't otherwise inherit it -- mirrors how that branch already re-implements the self-approval check added in PROC-FINDING-015.
- **Admin-facing:** `PUT /api/users/:id` (`UserController.updateUser` / `UserService.updateUser`) now accepts an optional `approvalLimit` -- a non-negative number, or `null` to clear a previously-set ceiling -- validated the same way as the existing `status` field, gated by the same `manage_users` permission the route already carries (PROC-FINDING-013), and audit-logged as `USER_APPROVAL_LIMIT_UPDATE` (old/new value, actor, IP, user agent), matching the existing `USER_STATUS_UPDATE`/`USER_ROLE_UPDATE` entries. `getAllUsers`/`getUserById` now select and surface the field so an edit screen can show the current value.

**Scoped out, investigated but not extended:** `ProcurementService.approveProcurementInvoice` and `approveGoodsReceivedNote` (POs/invoices/GRNs) were checked for an equivalent decision point. They use a different, permission-based authorization model (`procurement.invoices.approve` etc. via `PERMISSION_DECISIONS`) with no stepped per-approver amount matrix and no pending-row concept to re-validate against -- extending personal approval limits there would need a separate product decision about what "authority" means for a role-permission-gated action, not a like-for-like extension of this fix. Left as a follow-up rather than force-fitted.

### Deploy

Deployed API-only to dev (`arcus-dev-api-1` on the NTS shared VPS, `dev-api.matanho.com`), same build -> migrate -> swap pattern as PROC-FINDING-013/015. The migration step initially hit the identical trap PROC-FINDING-013 documented: the throwaway migration container's own entrypoint runs `ensure-admin` (via `RUN_SEED=1` inherited from `secrets/dev.env`) *before* executing the passed `npm run db:migrate:all` command, so the admin-seed upsert crashed with `P2022: The column arcus_dev.users.approval_limit does not exist` before the migration ever ran. Fixed by passing `-e RUN_SEED=0` on that one-off container (overrides the env-file value for the same key), which skips the seed step and lets migrations run first; the real `arcus-dev-api-1` container keeps `RUN_SEED=1` from `secrets/dev.env` for its own normal boot, so its admin-seed still runs (and succeeded, post-migration). `db:migrate:all`: 157 ok, 0 failed, 6 skipped (expected fan-out/legacy-guard scripts, same as always); `approval_limit columns: 1` confirmed present on `arcus_dev.users` before the swap. Container recreated, image matched the newly built one, health check `DEV_API_OK`, `RestartCount=0`. Confirmed by grepping the compiled `dist/services/ProcurementRequisitionApprovalService.js` and `dist/services/ProcurementService.js` inside the running container for `"Your approval limit is"` before trusting it -- both matched.

### Verification

Live on dev, 18 September 2026, using `proc.requester@nts.local` (Operations member, requester), `perf.deptmgr@nts.local` (Farai Mutasa, Operations HEAD, the approver under test), `payroll.finmgr@nts.local` (Blessing Sibanda, Finance HEAD, used as the cross-department actor and, separately, as Finance's own sole approver), and `admin@nts.com` (the `manage_users`-permission admin bootstrap account):

1. **Baseline, no personal limit (true default for every existing user before this fix):** created and submitted a fresh Operations requisition (`REQ_20260918_0009`, $8,000). `perf.deptmgr@nts.local` `PUT .../approve` → **200** `"Purchase requisition approved successfully"` -- unchanged from before this field existed, confirming no regression for the common case.
2. `admin@nts.com` `PUT /api/users/{perf.deptmgr's id}` with `{ "approvalLimit": 5000 }` → **200**; a follow-up `GET /api/users/{id}` (before the later clear) confirmed the stored value.
3. **Over the limit:** created and submitted `REQ_20260918_0010` ($8,000). `perf.deptmgr@nts.local` (now capped at $5,000) `PUT .../approve` → **400** `"Your approval limit is $5,000.00; this transaction is $8,000.00. Escalate to an approver with sufficient authority."` (was 200 before this fix).
4. **Within the limit:** created and submitted `REQ_20260918_0011` ($3,000). `perf.deptmgr@nts.local` (still capped at $5,000) `PUT .../approve` → **200** `"Purchase requisition approved successfully"` -- a limit that comfortably covers the amount does not block a legitimate approval.
5. **PROC-FINDING-011 regression check:** `payroll.finmgr@nts.local` (Finance HEAD, a different department, not an approver on this step) `PUT .../approve` on Operations' still-pending `REQ_20260918_0010` → **400** `"This requisition waits for step 1 of 1, Head of Operations (Nyasha K, Farai Mutasa). You are not an approver on that step."` -- identical shape/status to PROC-FINDING-011's and PROC-FINDING-015's own regression checks, confirming the approval-limit check (which runs later in `decide()`) never gets a chance to mask or interfere with the earlier "not an approver on this step" gate.
6. **PROC-FINDING-015 regression check (redone against a real self-approval shape, not just a non-approver):** logged in as `payroll.finmgr@nts.local` (Finance's sole HEAD, i.e. the assigned approver), created and submitted a fresh Finance requisition (`REQ_20260918_0012`, $1,500) as themselves, then `PUT .../approve` on their own submission → **400** `"You cannot approve or reject your own purchase requisition."` -- unchanged from the PROC-FINDING-015 fix, confirming the self-approval check (which also runs before the new approval-limit check) still fires correctly and takes precedence.
7. **Cleanup of the admin-set limit:** `admin@nts.com` `PUT /api/users/{perf.deptmgr's id}` with `{ "approvalLimit": null }` → **200**; `GET /api/users/{id}` afterwards showed `"approvalLimit": null`, confirming the field can be cleared back to "no personal ceiling, defer to workflow routing" and that `null` is distinguished from "field omitted."

### Cleanup

`REQ_20260918_0009` (Operations, $8,000, correctly `APPROVED` before any limit was set) and `REQ_20260918_0011` (Operations, $3,000, correctly `APPROVED` within the $5,000 test limit) are legitimate decisions, left in `arcus_dev`. `REQ_20260918_0010` (Operations, $8,000 -- every approval attempt against it was refused, either by the approval-limit block or the cross-department regression check, so it has no valid decision) and `REQ_20260918_0012` (Finance, $1,500 -- refused by the self-approval check) were left `PENDING_APPROVAL`, following the same precedent as PROC-FINDING-011/015's cleanup notes (all four titled "verification"/"regression re-check" and traceable to this finding by requisition number and timestamp). `perf.deptmgr@nts.local`'s `approvalLimit` was restored to `null` (its pre-test state) so no test configuration was left active on dev.

### Scope review (19 September 2026)

A code review of this fix raised a PLAUSIBLE concern: `decide()`'s approval-limit check gates any `APPROVE` decision by the requisition's `totalAmount`, regardless of whether the specific step being decided is an `AMOUNT_THRESHOLD` step or a `DEPARTMENT`/`USER`/`ROLE` step. Re-examined against the actual data model rather than guessing:

- `ProcurementRequisitionApprovalService.decide()` is hard-scoped to `stageType: "PURCHASE_REQUISITION"` (the `STAGE` constant at the top of the file) -- it is never reused for a non-monetary `ApprovalRequest` kind. Every requisition that reaches this method carries a real dollar `totalAmount`, no matter which step type the workflow happened to route it through.
- A personal approval limit (SRD §7 "User Master" Approval Limit) is defined as *that person's* authorized ceiling on approving spend, full stop -- not a property of a particular routing mechanism. `DEPARTMENT`/`USER`/`ROLE` steps still authorize the same dollar exposure a `AMOUNT_THRESHOLD` step would; the routing type only decides *who* gets asked, never *whether real money is on the line*.
- Narrowing the check to `AMOUNT_THRESHOLD`-only steps would reopen exactly the risk this finding exists to close: a department head or named approver with a low personal limit could approve a requisition far beyond their authorized ceiling whenever the workflow happened to route it as a `DEPARTMENT`/`USER`/`ROLE` step instead of a threshold step -- which, per PROC-FINDING-011's own root cause, is a config mistake that has already happened once on this system.

**Conclusion: no code change.** The current broad enforcement (any `APPROVE` decision on a `PURCHASE_REQUISITION`, any step type) is the correct behavior, not a bug. Recording this reasoning here so the concern doesn't resurface as an open question.

**Status:** FIXED -- deployed to dev (API only, no UI/portal service touched), verified live 18 September 2026; scope re-confirmed correct-as-designed 19 September 2026 (no code change). Branch `fix/proc-approval-limits`, commit `1bac209`, pushed to `origin`. **Merged to `master`, not prod** (19 September 2026 consolidation, `nvccz` `dd74dea`).

---

## PROC-FINDING-017

**Title:** Vendor's own submitted Payment Terms silently overwritten by the vendor master's stored default
**Module:** Procurement (backend, `nvccz`) · **Dimension:** QAT · **Category:** Functional / data integrity
**Severity:** HIGH -- SRD `NTS_SRD_DT_ProcMS_16_09_2026.pdf` SS15 "Quotation Management" lists Payment Terms as a minimum per-quotation field the vendor states; SS9 "Vendor Portal / Supplier Submission" requires the supplier interface to support "payment terms" as something the vendor supplies on submission. A vendor's own stated terms for a specific quote were discarded and replaced with a stale, unrelated default.
**Persona affected:** Every vendor with a `paymentTerms` value already set on their `Vendor` master record (i.e. almost every real vendor, since historical quotations show this field populated) submitting any quotation, for any RFQ -- their actual proposed terms for that specific bid were never recorded, only ever the vendor master's one fixed value.
**Surface:** `VendorQuotationService.createVendorQuotation` (`src/services/VendorQuotationService.ts:294`, before this fix); `POST /api/vendor-quotations/submit`

### Discovered via

While live-verifying the companion frontend fix (below, PROC-FINDING-018 -- adding a Payment Terms field to the public vendor RFQ response form, which until that fix did not exist at all), the newly-added field was exercised for the first time against a real submission: vendor Baobab Networks & Computing, isolated verification RFQ `RFQ_20260918_0003`, quotation `QUO_20260918_0003`. Typed `paymentTerms: "Net 30, 50% advance on order confirmation"` into the form and submitted; `SELECT paymentTerms FROM vendor_quotations WHERE quotationNumber = "QUO_20260918_0003"` came back as plain `"Net 30"` -- silently truncated to the vendor master's own stored default, not what was actually typed.

### Investigation

```ts
const resolvedPaymentTerms =
  vendorRow.paymentTerms?.trim() || trimIn(paymentTerms) || undefined;
```

This is the same "vendor master wins" precedence used immediately above it for `resolvedTaxEIN`, `resolvedPhone`, `resolvedAddress` and `resolvedCompanyName` -- correct for those, because they are stable vendor *identity* fields the server should trust over a value resubmitted on a public form (a vendor shouldn't be able to silently change its own registered tax number or address by editing a quotation form). Payment terms is not identity data: it is a negotiated, per-quotation commercial term, explicitly listed by the SRD as something that varies quotation-to-quotation. The identity-field precedence pattern was copied onto a transactional field it doesn't apply to, so every quotation from any vendor with a non-null `Vendor.paymentTerms` recorded that fixed default instead of whatever was actually proposed for that specific bid -- with no error, no warning, and a vendor-facing confirmation screen (client-side state, never round-tripped through the server) that still showed the vendor what *they* typed, masking the discrepancy from the vendor's own view.

### Fix

Branch `fix/proc-finding-017-vendor-payment-terms-override` (`nvccz` repo), cut from a clean worktree off `origin/master`, commit `f4fcda5`. One file changed (`src/services/VendorQuotationService.ts`): swapped precedence so the vendor's own submitted value wins, falling back to the vendor master's stored value only when the vendor sends nothing (e.g. an older client). No schema change.

### Deploy

Deployed API-only to dev. Rather than rebuilding from `origin/master` (which would have reverted whatever combination of not-yet-merged fixes -- PROC-FINDING-011/012/013/014/015/016 -- is currently live on `arcus-dev-api-1` and not tracked by any single branch), the exact currently-deployed source tree on the VPS (`/var/www/projects/arcus/src/api`, the API service's own Docker build context) was patched in place with the identical one-line precedence change, then `docker compose build api && up -d --no-deps --force-recreate api`. No migration needed. Pre-rebuild image (`sha256:a492024f...`) snapshotted to `rollback/api.proc017-pre.image` first. Container came back healthy.

### Verification

Live on dev, 18 September 2026. A second isolated verification RFQ (`RFQ_20260918_0004`, same vendor, Baobab Networks & Computing) was minted the same way as PROC-FINDING-018 below, then a quotation submitted with `paymentTerms: "60% deposit, balance on delivery (PROC-FINDING-017 fix verification)"` -- deliberately different from the vendor master's stored `"Net 30"`. Response and a direct `arcus_dev.vendor_quotations` read both show `paymentTerms` persisted exactly as submitted, not overwritten. Regression check: `deliveryTerms`/`notes` (same call, see PROC-FINDING-018) also came back exactly as submitted, confirming the fix didn't touch the fields around it.

### Cleanup

`RFQ_20260918_0003`/`QUO_20260918_0003` and `RFQ_20260918_0004`/`QUO_20260918_0004` are isolated, clearly-titled verification records ("PROC-FINDING-01[6-8] verification ... isolated, safe to ignore/delete") invited only to the real Baobab Networks & Computing vendor master row (no fabricated vendor); left in `arcus_dev` for anyone who wants to inspect the before/after directly, same precedent as prior findings' cleanup notes.

**Status:** FIXED -- deployed to dev (API only), verified live 18 September 2026. Branch `fix/proc-finding-017-vendor-payment-terms-override`, commit `f4fcda5`, pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-018

**Title:** Public vendor RFQ response form had no Payment Terms, Comments, or document-attachment fields, despite the backend and DB already supporting all three
**Module:** Procurement (frontend, `nvccz-new`) · **Dimension:** QAT · **Category:** Missing capability (SRD requirement never implemented in the UI)
**Severity:** HIGH -- SRD `NTS_SRD_DT_ProcMS_16_09_2026.pdf` SS15 "Quotation Management" lists Payment Terms, Delivery Period, Quotation Validity and Attachments as minimum fields every quotation must record; SS9 "Vendor Portal / Supplier Submission" explicitly requires the supplier interface to support "quotation upload", "PDF/document attachments", "payment terms", "comments" and "final submission".
**Persona affected:** Every invited vendor submitting a quotation through the real emailed RFQ link -- no way to state payment terms, add a comment, or attach any supporting document (a formal quote PDF, a spec sheet, a compliance certificate) to a bid.
**Surface:** `app/vendor-quotations/rfq-respond/page.tsx` (the route `VENDOR_RFQ_RESPONSE_PATH`/`vendorRfqEmailLinks.ts` actually emails to invited vendors -- confirmed this is the live route, not one of the two other, unused vendor-quotation-form variants in this codebase, `app/vendor/quotation/submit` and `app/vendor-portal/rfq/[rfqNumber]`, neither of which is linked from any invitation email)

### Steps to reproduce (as reported, live on dev, 18 September 2026)

Fresh RFQ `RFQ_20260918_0002`, real vendor-portal link, real submission as Baobab Networks & Computing: `read_page` of every interactive element on the quotation form showed only Item Name, Brand, Quantity, Unit, Unit Price, Total, Quote Valid Until (date), Delivery Time (text), Submit. No Payment Terms field, no Comments field, no file/document upload control anywhere on the form -- despite `VendorQuotation.paymentTerms`/`deliveryTerms`/`notes`/`attachments` all already existing as columns (historical quotations show `paymentTerms` populated, e.g. "Net 30") and the page's own submit payload already silently sending empty values for `paymentTerms`, `notes` and `attachments: {}` on every call.

### Fix

Branch `feature/proc-quotation-vendor-fields` (`nvccz-new` repo), cut from a clean worktree off `origin/dev`, commit `57bfe04`. Two files changed:

- `app/vendor-quotations/rfq-respond/page.tsx`: rendered Payment Terms (required) and Delivery Terms inputs and a Comments textarea, wired to the `paymentTerms`/`deliveryTerms`/`notes` state the page already declared but never rendered; added a PDF attachment picker (multi-file, client-side type/size validation) that stages each file via the existing `POST /procurement/document-attachments/portal/upload` endpoint on submit and sends the returned ids as `attachmentIds`, which `VendorQuotationService.createVendorQuotation` already links to the new quotation server-side (a "Phase 2" hook that existed in the request type but had no caller). Confirmation screen now also shows Payment Terms and attachment count back to the vendor.
- `lib/api/procurement-api-v2.ts`: added `attachmentIds?: string[]` to `SubmitQuotationRequest` and a new `uploadQuotationAttachment()` client method.

No backend/schema change needed for this half -- the fields and the staged-upload endpoint already existed, just unused by this form. `npx tsc --noEmit` diffed line-for-line against an `origin/dev` baseline confirms zero new type errors introduced.

### Deploy

Deployed to dev, `ui-vendor` only (the portal `dev.vendor.matanho.com` is where this route is actually served -- confirmed via `vendorRfqEmailLinks.ts`'s `VENDOR_PORTAL_BASE_URL`, not the default `staff` portal a naive path-based guess would pick). Packed from the clean worktree/commit above (not the shared, concurrently-dirty `nvccz-new` checkout) via a locally-patched copy of `scripts/deploy-arcus-dev-selective.py` with `UI_ROOT` pointed at that worktree, `--portals vendor`. Deploy stamp `20260918-214359`; `arcus-dev-ui-vendor-1` recreated and came up healthy.

### Verification

Live on dev, 18 September 2026, two full real submissions as vendor Baobab Networks & Computing against isolated verification RFQs invited to that same real vendor master record (the shared `RFQ_20260915_0001` "E2E sweep" RFQ some other automated suite depends on was deliberately **not** reused, to avoid disturbing its fixture state):

1. `RFQ_20260918_0003` / `QUO_20260918_0003` -- browser UI pass. The rebuilt form rendered Payment Terms, Delivery Terms, Comments and an "Attach document" (PDF, up to 50MB) control exactly as coded. Filled and submitted with `paymentTerms: "Net 30, 50% advance on order confirmation"`, a comment, delivery terms/time -- no attachment on this pass (browser sandbox has no OS file-picker to drive a native `<input type=file>` dialog). Confirmation screen showed Payment Terms back correctly. DB read after submission showed `deliveryTerms`/`deliveryTime`/`notes` persisted exactly as submitted -- but `paymentTerms` came back as plain `"Net 30"`, which is what led to PROC-FINDING-017 above.
2. `RFQ_20260918_0004` / `QUO_20260918_0004` -- direct call to the same public endpoints the page itself calls (`POST /procurement/document-attachments/portal/upload` then `POST /vendor-quotations/submit` with `attachmentIds`), used because of the same file-picker limitation, run **after** the PROC-FINDING-017 fix was deployed: uploaded a real PDF (`quotation-support.pdf`, `sha256` confirmed), then submitted with a distinct `paymentTerms`, `deliveryTerms: "CIF Harare"` and a `notes` comment. Response and a direct DB read both confirm all three land correctly: `paymentTerms` exactly as submitted (not the vendor-master default -- proves PROC-FINDING-017's fix), `notes` exactly as submitted, and `vendor_document_attachments` shows the uploaded PDF's `entity_id` set to the new quotation's id (status `ACTIVE`) -- i.e. genuinely linked to the quotation a staff reviewer would open, not just staged and orphaned.

Staff-side visibility (Quotation Comparison / Bid Evaluation reading these same `vendor_quotations`/`vendor_document_attachments` rows) was not separately screenshotted this session -- verification relied on direct, read-only `arcus_dev` queries of the same columns/tables those screens read from, not a staff UI login.

### Cleanup

See PROC-FINDING-017's cleanup note -- both isolated verification RFQs/quotations are clearly titled and left in `arcus_dev`.

**Status:** FIXED -- deployed to dev (`ui-vendor` only), verified live 18 September 2026 (frontend fields; attachment leg verified via direct API call rather than a literal file-picker click, see above). Branch `feature/proc-quotation-vendor-fields`, commit `57bfe04`, pushed to `origin`. Companion backend fix PROC-FINDING-017 also deployed to dev. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-019

**Title:** Purchase Requisition creation form had no Required Date, Delivery Location or Budget Code fields, and no Attachments -- SRD §11 minimum fields never implemented; gap propagated into the RFQ and vendor-portal quotation form
**Module:** Procurement (frontend `nvccz-new` + backend `nvccz`) · **Dimension:** QAT · **Category:** Missing capability (SRD requirement never implemented, both schema and UI)
**Severity:** HIGH -- SRD `NTS_SRD_DT_ProcMS_16_09_2026.pdf` §11 "Purchase Requisitions" lists Required Date, Budget Code, Delivery Location and Attachments among the minimum fields a requisition must capture. None of the four existed anywhere in the module: not as `PurchaseRequisition` columns, not on the creation form, not on the requester's edit form, not on the view/approval-review panel.
**Persona affected:** Every requester raising a purchase requisition (no way to state when goods are needed, where to deliver them, which budget line covers them, or attach supporting documents); every approver reviewing one (nothing to review for these fields either); every vendor invited to quote on an RFQ built from an affected requisition.
**Surface:** `components/procurement-v23-mock/matanho-procurement-runtime.js` (New/Edit requisition forms, requisition view), `nvccz` `PurchaseRequisition` Prisma model and `POST/PUT /procurement/requisitions`, `ProcurementService.createAndSendRFQ`, `app/vendor-quotations/rfq-respond/page.tsx` (downstream)

### Steps to reproduce (as reported, confirmed live on dev, 18 September 2026)

Fresh requisition `REQ_20260918_0005`, created via Purchase Requisitions > New requisition as `payroll.finmgr@nts.local`: `read_page` of every interactive element on the creation modal showed only Entity, a combined Department/cost-centre dropdown, Category, Requirement title, line items (item/UOM/qty/unit estimate), Internal motivation and a read-only "Live budget check" narrative -- no Required Date, no Delivery Location, no Budget Code (as a real field, only the read-only budget-check text), no Attachments anywhere on the form, and the same absence on the requester's edit form and the read-only view. Downstream consequence confirmed: the real vendor-portal quotation form (`rfq-respond`) for an RFQ built from this requisition showed "Delivery required by: Not set" and "Deliver to: To be confirmed", because `ProcurementRfq.expectedDeliveryDate`/`deliveryAddress` (which the vendor portal reads directly) had nothing to be populated from.

### Root cause

`purchase_requisitions` had no `required_date`, `delivery_location` or `budget_code` columns at all, and no attachment relationship. `ProcurementRfq` already had `deliveryAddress`/`expectedDeliveryDate` columns and `createAndSendRFQ` already accepted them as params -- but the tender builder (`create-send-tender-v13` in `actions.ts`) never sent them, and there was nothing on the source requisition to default them from even if it had.

### Fix

Two branches, both named `fix/proc-requisition-missing-fields`, cut from clean worktrees off `origin/master` (`nvccz`, commit `b0cd9e7`) and `origin/dev` (`nvccz-new`, commits `68354ef` + `3925ef5`).

**Backend (`nvccz`, `b0cd9e7`):**
- `purchase_requisitions` gains `required_date` (DATE), `delivery_location` (VARCHAR 255) and `budget_code` (VARCHAR 100), all nullable, via an idempotent raw-SQL migration (`npm run db:migrate:procurement-requisition-fields`, registered in `db:migrate:all`); Prisma schema updated to match.
- `createPurchaseRequisition` / `updatePurchaseRequisitionByOwner` accept and persist the three fields; the controller passes them through from the request body.
- `createAndSendRFQ` now defaults the RFQ's `expectedDeliveryDate`/`deliveryAddress` from the source requisition's `requiredDate`/`deliveryLocation` when the tender builder does not explicitly override them -- this is what fixes the vendor-portal "Not set"/"To be confirmed" symptom without needing any change to the RFQ builder UI itself.
- New `POST`/`GET /procurement/requisitions/:id/attachments`, reusing the Document Vault's storage (`ProcurementDocuments`, folder `"Requisitions"`, `relatedRecord` = requisition number) but gated by requisition ownership rather than `procurement.documents.manage`, which a requester does not hold (the vendored form's original Attachment/Supporting-documents fields were removed in an earlier cycle for exactly this reason -- see the "requisition forms offer only what is saved" patch note -- so a genuinely working upload needed its own authorization path, not reuse of the gated Document Vault endpoint as-is).

**Frontend (`nvccz-new`, `68354ef` + a same-day follow-up fix `3925ef5`, see below):**
- `lib/api/procurement-v23-api.ts`: `createRequisition`/`updateRequisition` carry the three new fields; new `uploadRequisitionAttachments`/`listRequisitionAttachments`.
- `lib/procurement-v23/live-loaders.ts`: `requisitionsView` carries `requiredDate`, `deliveryLocation`, `budgetCode` so the view/edit/approval-review panels render them without an extra fetch.
- `scripts/procurement-runtime-live-bridge.inc.js`: `__pr23RequisitionExtraFields` (Required date / Delivery location / Budget code inputs -- Budget Code is free text, since no budget-code register exists on this backend, per `procurement-v23-backend-asks.md` ask 2), a real `__pr23RequisitionAttachmentsField` (replaces the vendored fields that saved nothing), and a lazy `__pr23RequisitionAttachmentsBox` fed by a sweep-observer hook, so opening one requisition's view/edit modal fetches only that record's attachments -- not one request per row in the register.
- `scripts/patch-procurement-runtime.mjs`: wires the above into the New requisition form, the requester's edit form, and the read-only view shared by "My requisitions" and the Approval Centre's review modal (`viewPrV11` modes `'view'`/`'approve'`) -- an approver sees the same three fields and attachments the requester entered.
- `lib/procurement-v23/actions.ts`: `save-pr`/`submit-pr` and `save-pr-v11`/`submit-pr-v11` read the new fields and, once the requisition exists, upload any selected attachment files.
- `components/procurement-v23-mock/procurement-v23-app.tsx`: exposes `__pr23FetchRequisitionAttachments` for the bridge's lazy loader.

**Self-caught regression, same session:** the first patch commit (`68354ef`) broke `npm run build` on dev -- three of the five new `replaceUnique` calls anchored on pristine pre-patch text instead of the already-patched text an earlier cycle had baked into the committed `matanho-procurement-runtime.js`. Since `replaceUnique` matches substrings anywhere, two calls silently duplicated `__pr23RequisitionProjectField()` and a third spliced a ternary inside an existing single-quoted string, producing invalid nested template-literal syntax (`Expected '}', got 'class'`). Caught when the dev staff UI deploy failed with a webpack compile error; fixed in `3925ef5` by anchoring each `from` on the current already-patched text (mirroring how the other two new patches in the same commit were already anchored correctly); reran the patch script (`0 missed`), `node --check` on the regenerated runtime, and grepped for duplicate calls before redeploying.

Business Unit and Branch are intentionally **not** added: no `BusinessUnit` concept exists anywhere in the schema, and `Branch` exists only as a free-text property of `Department`, not a distinct selectable dimension on a requisition.

### Deploy

- API: `deploy_dev_api_committed` (locally-patched copy pointed at the `nvccz` worktree). First attempt raced with a concurrent deploy on the shared VPS -- the DB migration ran and columns landed correctly, but the running container ended up on someone else's image (`grep budgetCode` on the deployed `dist/` came back empty despite the migration having just added the columns for it). Caught by directly grepping the running container's `dist/` for the new code before trusting the deploy script's own `IMAGE_MATCH` check (which had reported a mismatch, correctly, but for a build-race reason not immediately obvious from the log alone); redeployed once no other build was in flight, verified `dist/controllers/ProcurementController.js` and `dist/routes/procurementRoutes.js` contain the new code and `purchase_requisitions` has all three columns.
- UI: `deploy-arcus-dev-selective.py` (locally-patched copy pointed at the `nvccz-new` worktree), `--portals staff`. First attempt failed to build (the substring-overlap bug above); redeployed after the fix, confirmed via `grep` for literal strings ("OPEX-2026-IT-014", "Delivery location") in the built `.next/static` chunks that survive minification (function names do not, since they are safely renamed by the minifier).

### Verification

Live on dev, 18 September 2026, both via direct API calls and the real browser UI:

1. **API, as `proc.requester@nts.local`:** `POST /procurement/requisitions` with `requiredDate: "2026-11-02"`, `deliveryLocation`, `budgetCode` -- **201**, all three echoed back correctly. `POST .../attachments` with a text file -- **201**. `GET /procurement/requisitions/:id` (reload/persistence check) -- all three fields and the attachment still present. `GET .../attachments` as `perf.deptmgr@nts.local` (the approver, who does **not** hold `procurement.documents.manage`) -- **200**, sees the same attachment (proves the ownership-gated endpoint, not the Document Vault's own gate, is what's actually serving this). Submitted and approved (`perf.deptmgr@nts.local`, department head). Sent an RFQ (`proc.officer@nts.local`) from the approved requisition **without** passing `expectedDeliveryDate`/`deliveryAddress` (exactly what the tender builder currently sends) -- direct DB read of `procurement_rfqs` for the new `RFQ_20260918_0005` confirms `delivery_address` and `expected_delivery_date` were defaulted from the requisition's `deliveryLocation`/`requiredDate` exactly as coded.
2. **Real vendor portal, most direct reproduction of the originally reported symptom:** minted a real signed vendor-portal token server-side (`signVendorPortalToken`, same secret the running API uses, via `docker exec` into `arcus-dev-api-1`) for the vendor invited to `RFQ_20260918_0005`, and loaded the actual public page, `https://dev.vendor.matanho.com/vendor-quotations/rfq-respond?token=...&rfqNumber=RFQ_20260918_0005`. It now reads **"Delivery required by: 02 Nov 2026"** and **"Deliver to: Head Office Stores, 14 Samora Machel Ave, Harare"** -- previously "Not set" / "To be confirmed" on the originally reported `REQ_20260918_0005` (a different, coincidentally same-numbered record from the original report).
3. **Real browser UI, as `proc.requester@nts.local` (Kudakwashe Ncube):** opened Purchase Requisitions > New requisition -- Required date, Delivery location and Budget code render as real inputs (date picker, two text fields with the documented placeholders) and Attachments renders a working file picker ("Uploaded when you save."), none hidden behind `__pr23Live()` as the old vendored fields were. Filled all three plus a line item and motivation, submitted -- created `REQ_20260918_0014`, routed to Pending Head of Operations. Reopened the record (persistence/reload check): the view panel shows **Required date: 15 Nov 2026**, **Delivery location: Head Office Stores, 14 Samora Machel Ave, Harare**, **Budget code: OPEX-2026-UAT-099**, and an honest "No attachment has been uploaded yet." (none was attached on this pass).
4. **Real browser UI, as `perf.deptmgr@nts.local` (Farai Mutasa, Head of Operations, the approver):** opened the same `REQ_20260918_0014` from the Purchase Requisitions register's own "Review" action (`viewPrV11` mode `'approve'` -- the Approval Centre's own "Review" button opens a different view, the motivation decision-paper, which does not carry these fields; the register's own Review action is the one patched) -- shows the identical Required date / Delivery location / Budget code the requester entered, plus "Approve requisition" / "Reject or return" actions. Confirms the approver sees these fields too, not only the requester.

### Cleanup

`REQ_20260918_0013` (API-created verification record; submitted, approved, RFQ `RFQ_20260918_0005` sent to Baobab Networks & Computing) and `REQ_20260918_0014` (browser-UI-created verification record; submitted, left `Pending Head of Operations` -- not approved, so nothing downstream was created from it) were left in `arcus_dev`, both clearly titled "PROC-FINDING verification" / "UI live verification" and traceable to this finding by requisition number and timestamp, following the precedent in PROC-FINDING-011/015's cleanup notes. Mail guard was already `ACTIVE` on dev when this session started (a concurrent agent's write-test protection) and was left untouched rather than toggled, since turning it off could have exposed another session's in-flight test to real outbound email.

**Status:** FIXED -- deployed to dev (API and staff UI), verified live 18 September 2026 via direct API calls, a minted real vendor-portal token against the actual public page, and the real staff browser UI as both the requester and the approver persona. Branches `fix/proc-requisition-missing-fields` in both repos (`nvccz` commit `b0cd9e7`; `nvccz-new` commits `68354ef`, `3925ef5`), pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-020

**Title:** Code review of PROC-FINDING-019 found the new requisition-attachments GET had no department check, the upload had no file-type filter, and the deploy that shipped PROC-FINDING-019 had silently regressed seven already-fixed, not-yet-merged security/procurement issues on dev
**Module:** Procurement (backend `nvccz`) · **Dimension:** Security / QAT · **Category:** Authorization bypass (Issue 1), missing input validation (Issue 2), deploy-process gap (regression)
**Severity:** HIGH (Issue 1 and the regression), MEDIUM (Issue 2)
**Persona affected:** Issue 1 -- any authenticated staff account, against any other department's requisition attachments. Issue 2 -- any requester uploading a requisition attachment. Regression -- every persona relying on the seven previously-fixed issues (see below), between this branch's first dev deploy and this fix.
**Surface:** `nvccz` `src/controllers/ProcurementController.ts` (`listRequisitionAttachments`), `src/routes/procurementRoutes.ts` (`uploadRequisitionAttachment` multer config), and the dev deploy of branch `fix/proc-requisition-missing-fields` itself

### Issue 1: `GET /procurement/requisitions/:id/attachments` had no department/ownership check

PROC-FINDING-019 added this endpoint gated only by authentication and the requisition existing -- it never called the department-scoping check `getPurchaseRequisitionById` already runs (`assertUserCanViewDepartmentPurchaseRequisition`, added for PROC-FINDING-011). Any authenticated staff account could list another department's requisition attachments (names, `fileUrl`, storage paths) by id alone, bypassing PROC-FINDING-011's fix entirely for this one new endpoint.

**Root cause:** the endpoint was written by generalizing "does this requisition exist" from a quick ownership-only check (needed for the *upload* side, where only the owner or `documents.manage` may write) and never added the separate, additional check the *read* side needs -- the same distinction `getPurchaseRequisitionById` already draws.

**Fix:** `listRequisitionAttachments` now selects `department`, `requestedById`, `portfolioCompanyId`, `fundId` on the requisition lookup and runs the identical two checks `getPurchaseRequisitionById` runs before returning data: `ProcurementService.assertUserCanViewInvesteePurchaseRequisition`, then (for non-investee records) `ProcurementController.assertUserCanViewDepartmentPurchaseRequisition`, returning **403** on failure with the same message shape.

### Issue 2: `uploadRequisitionAttachment` had no file-type restriction

The multer config backing `POST /procurement/requisitions/:id/attachments` set only `fileSize`/`files` limits, no `fileFilter` -- unlike the sibling `uploadDocument` config in `vendorDocumentAttachmentRoutes.ts`, which restricts to PDF for exactly this reason. Nothing rejected an `.exe`, `.html` or any other file type from being stored (and served back via a public `fileUrl`) as a "Requisition attachment", against SRD §32 (supported formats: PDF/DOCX/XLSX/XLS/CSV/JPG/JPEG/PNG) and §43 (file-upload restrictions, file-type verification).

**Fix:** added a `fileFilter` to `uploadRequisitionAttachment` checking both file extension and mimetype against the SRD §32 list plus legacy `.doc` (matching the form's own `accept` attribute); rejects with a clear message otherwise.

### Regression: dev lost seven already-fixed, not-yet-merged issues

Found while implementing the two fixes above, before redeploying. All seven sibling fix branches below share the same parent commit as `fix/proc-requisition-missing-fields` (`bc131bb`, `origin/master`) -- none are merged to `master` yet, and each had been deployed to dev independently by the agent that fixed it. PROC-FINDING-019's own first deploy was built from a worktree that only had `fix/proc-requisition-missing-fields` checked out on top of `origin/master`, with none of these merged in -- overwriting dev's API image with a build that silently dropped all seven:

| Branch | Fixes |
|---|---|
| `fix/procurement-department-authz-bypass` | PROC-FINDING-011 (department-scoped requisition GET/approve/reject) |
| `fix/procurement-vendor-quote-prefill` | Vendor-portal RFQ endpoint reading `itemsSnapshot` as a bare array (masked bug, always fell through to current requisition items) |
| `security/user-master-status-enforcement` | User status (Active/Suspended/Locked/Deactivated), enforced at login |
| `fix/proc-finding-015-self-approval` | PROC-FINDING-015 (self-approval/-rejection block) |
| `fix/proc-finding-017-vendor-payment-terms-override` | PROC-FINDING-017 (vendor-submitted Payment Terms silently overridden by vendor master default) |
| `fix/proc-approval-limits` | Per-user approval limit (SRD User Master), enforced at decision time |
| `fix/proc-finding-010-users-directory-trim` | PROC-FINDING-010 (`GET /users` response trimmed for callers without `manage_users`) |

Caught by grepping the running container's compiled `dist/` for each fix's marker code (e.g. `assertUserCanViewDepartmentPurchaseRequisition`, `"cannot approve or reject your own purchase requisition"`, `snapshotRaw.items`) and finding all of them absent, despite each being present and merged on `origin` at the time.

**Fix:** merged all seven branches into `fix/proc-requisition-missing-fields` (`git merge --no-edit origin/<branch>` for each). Six merged cleanly; one conflict in `package.json` (two branches adding an adjacent `db:migrate:*` script line) resolved by keeping both lines. `prisma/schema.prisma` merged cleanly (verified the `security/user-master-status-enforcement` branch's `User.status` field and index are both present post-merge). `npx tsc --noEmit` clean after all merges plus the two fixes above.

### Deploy

API only (no UI change in this fix). `deploy_dev_api_committed` (locally-patched copy pointed at the `nvccz` worktree, same as PROC-FINDING-019's deploy). Verified this time, before trusting the deploy script's own exit code, by grepping the running container's `dist/` directly for: `assertUserCanViewDepartmentPurchaseRequisition` (3 occurrences: definition + `getPurchaseRequisitionById` + `listRequisitionAttachments`), the self-approval block message (both service files), `snapshotRaw.items`, `approvalLimit`, `SUSPENDED`, and `REQUISITION_ATTACHMENT_ALLOWED` (the new file-filter constant) -- all present. `purchase_requisitions` still has `required_date`/`delivery_location`/`budget_code` from PROC-FINDING-019's migration. Container healthy, `RestartCount=0`, `/health` 200.

### Verification

Live on dev, 18 September 2026, fresh requisition `REQ_20260918_0015` (Operations department, `proc.requester@nts.local`):

1. **Issue 1, department scoping:** owner (`proc.requester@nts.local`) `GET .../attachments` -- **200**. Same-department approver (`perf.deptmgr@nts.local`, Head of Operations) `GET .../attachments` -- **200**. Cross-department caller (`proc.ap@nts.local`, Accounts) `GET .../attachments` -- **403** `"You are not authorized to view Operations department requisitions."` (same message `getPurchaseRequisitionById` returns for the same case).
2. **Issue 2, file-type filter:** `.exe` upload -- rejected (500, "Only PDF, Word, Excel, CSV, JPG or PNG files are accepted here." -- same un-wrapped-error shape as the sibling `uploadDocument` PDF-only filter this mirrors). `.html` upload -- rejected, same message. A correctly-typed `.pdf` (`mimetype: application/pdf`) -- **201**, stored and returned normally. A `.png` (image mimetype) -- **201**. A `.docx` (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) -- **201**.
3. **Regression fixes**, spot-checked live rather than just via `dist/` grep: confirmed `purchase_requisitions`, `users.status` and the approval-limit columns all exist on `arcus_dev` post-migration (the merged branches' own migrations ran cleanly as part of the same `db:migrate:all`, all idempotent `[skip]`/`[ok]` as expected against data those branches' own earlier deploys had already migrated).

### Cleanup

`REQ_20260918_0015` (Operations, left `DRAFT` -- never submitted, this session only exercised the attachments endpoints directly) and its four attachments (one `.pdf`, one `.png`, one `.docx`, both rejected uploads never persisted) left in `arcus_dev`, clearly titled "PROC-FINDING-019 review-fix verification" and traceable by requisition number/timestamp.

**Status:** FIXED -- both code-review issues fixed and the regression reversed, deployed to dev (API only), verified live 18 September 2026. Branch `fix/proc-requisition-missing-fields` (`nvccz`, commit `412e963`, includes merges of the seven sibling branches above), pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-021

**Title:** RFQ closing date accepted no server-side validation on create or extend -- a past `rfqDeadline` created an already-expired RFQ and sent a real vendor invitation for a tender no vendor could ever quote on
**Module:** Procurement (backend `nvccz`) · **Dimension:** Data validation (SRD §41)
**Severity:** HIGH
**Persona affected:** Any PROC_OFF/PROC_MGR/BUYER creating or extending an RFQ; downstream, the invited vendor(s), who receive an invitation for a tender that is dead on arrival
**Surface:** `src/services/ProcurementService.ts` (`createAndSendRFQ`, backing `POST /procurement/rfq`), `src/services/ProcurementRfqService.ts` (`extendClosing`, backing `PATCH /procurement/rfqs/:id/closing`)

SRD §41 "Data Validation" lists "closing date restrictions" as a required server-side validation example, alongside "Server-side validation is mandatory even where frontend validation exists." Neither RFQ-creation nor closing-date-extension enforced it.

**Confirmed live on dev, 19 September 2026**, via `POST /procurement/rfq` as `proc.officer@nts.local`: `closingDate: "2020-01-01T00:00:00.000Z"` (over 6 years in the past) was accepted -- **201**, created `RFQ_20260919_0001` (id `cmu821kal0039ms01actuc752`), and sent a real invitation to vendor Baobab Networks & Computing. `closingAt` was persisted straight from `rfqDeadline` with no check against "now". The RFQ was `OPEN` and already past its own closing date the instant it existed -- the existing "RFQ is not accepting quotations" check (which correctly rejects a vendor submission once `closingAt` has passed) meant no vendor could ever quote on it, so the invitation was pure waste and the dead tender would only surface later as an unexplained "0 bids".

The sibling extension endpoint had the identical gap: `extendClosing` wrote whatever `newClosingAt` it was given straight to `closingAt`, with no check that it was in the future or later than the RFQ's current closing date -- an "extension" could move a closing date backward, or into the past outright.

**Fix:**
- `ProcurementService.createAndSendRFQ`: when `rfqDeadline` is supplied, reject with 400 ("Closing date must be in the future.") unless it is strictly after the current time; reject invalid dates too. `rfqDeadline` stays optional (unset means no closing restriction, an existing, intentional state used elsewhere e.g. `listPublicOpen`'s `closingAt: null` case) -- only a *supplied* past/invalid date is rejected.
- `ProcurementRfqService.extendClosing`: reject with 400 unless the new closing date is valid, strictly in the future, and strictly later than the RFQ's current `closingAt` ("New closing date must be in the future." / "...must be later than the RFQ's current closing date.").
- No schema change.

### Regression found and fixed during this session's deploy (same failure mode as PROC-FINDING-020)

Before deploying, `git branch -a` / `git log` showed several other open `fix/proc-*` and `security/*` branches already based on the same `origin/master` tip (`bc131bb`) as this fix, all documented elsewhere in this file as already deployed to dev. A pre-deploy `docker exec` grep of the running `arcus-dev-api-1` container's `dist/` for each of their marker strings found **all of them missing** except the most recent one (`fix/proc-negative-quantity-price-validation`) -- a concurrent agent had just redeployed dev from a single-branch worktree (`fix/proc-vendor-email-validation`, one commit directly on `origin/master`, tarball `/tmp/arcus-api-vendoremail.tgz`) that silently dropped: PROC-FINDING-011 (department-scoped requisition GET/approve/reject), self-approval block (PROC-FINDING-015), vendor payment-terms override fix (PROC-FINDING-017), per-user approval limits, the requisition-attachment department check and file-type filter (PROC-FINDING-019/020), the vendor-quote-prefill fix, and user status (Active/Suspended/Locked/Deactivated) enforcement. A second check moments later showed dev had been redeployed *again* (still missing the same set), confirming multiple agents are deploying narrow single-branch builds to this shared box without merging each other's already-live fixes first.

**Fix:** merged all eight currently-live sibling branches into this fix branch before deploying (`git merge --no-edit origin/<branch>` for each) -- `fix/proc-negative-quantity-price-validation` (itself already carrying the seven branches PROC-FINDING-020 merged, per its own merge history), plus `fix/proc-vendor-email-validation` on top. All merged cleanly, no conflicts. `npx tsc --noEmit` clean after each merge and after this finding's own fix.

### Deploy

API only (no UI change). One-off script modeled on `scripts/deploy-arcus-dev-selective.py`'s `--api` path but restricted to the `api` service only (no UI rebuild), pointed at a clean worktree (`git worktree add ... origin/master`, then this fix plus the eight merges, nothing else) rather than the dirty main `nvccz` checkout. Checked for an in-flight build on the VPS immediately before running (`pgrep -fa 'docker compose.*build'`) to avoid racing the concurrent activity above. Verified after deploy, before trusting the deploy script's exit code, by grepping the running container's `dist/` directly: `assertUserCanViewDepartmentPurchaseRequisition` (3), self-approval block message (2), `approvalLimit` (4), `REQUISITION_ATTACHMENT_ALLOWED` (1), `snapshotRaw.items` (1), `SUSPENDED` in `AuthController.js` (1), the vendor-email-format validation strings in `VendorController.js`/`VendorSelfRegistrationService.js`, the negative-quantity-price marker (1), and this finding's own `"Closing date must be in the future"` (1) / `"New closing date must be"` (2) -- all present. Container healthy, `docker compose ps` shows `api` up, `/health` 200.

### Verification

Live on dev (`https://dev-api.matanho.com`), 19 September 2026, as `proc.officer@nts.local`:

1. **Exact repro of the original bug:** `POST /procurement/rfq` with `rfqDeadline: "2020-01-01T00:00:00.000Z"` (same vendor, Baobab Networks & Computing, and the same shape of request that produced `RFQ_20260919_0001`) -- **400**, `"Closing date must be in the future."` No RFQ created, no invitation sent.
2. **Regression check:** the identical request with a real future closing date (+14 days) -- **201**, `RFQ_20260919_0003` created and sent normally (mail-guard was `ACTIVE` on dev for this whole session, confirmed via `docker logs`, so no real email left the box -- and the vendor's address is a non-routable `.example.com` test domain regardless).
3. **Extend-closing, past date:** `PATCH /procurement/rfqs/RFQ_20260919_0003's-id/closing` with `newClosingAt: "2020-01-01T00:00:00.000Z"` -- **400**, `"New closing date must be in the future."`
4. **Extend-closing, earlier than current (but still future):** current closing was +14 days; requested +1 day -- **400**, `"New closing date must be later than the RFQ's current closing date."`
5. **Extend-closing, valid:** requested +21 days -- **200**, `closingAt` updated correctly.

### Cleanup

`RFQ_20260919_0001` (id `cmu821kal0039ms01actuc752`, the original incident record -- real invitation already sent to Baobab Networks & Computing before this fix existed) is left as-is: this module has no delete path for a non-draft RFQ (soft-delete-only convention, consistent with PROC-FINDING-011/015/019's own cleanup notes), and the invitation was already sent so there is nothing left to prevent. `RFQ_20260919_0003` (this session's live-verification record, future closing date, sent to the same test vendor, mail-guard blocked the actual send) is left in `arcus_dev`, clearly titled "PROC-FINDING closing-date live verify FUTURE-OK" and traceable by RFQ number/timestamp.

**Status:** FIXED -- deployed to dev (API only), verified live 19 September 2026 via direct API calls reproducing the original incident's exact payload. Branch `fix/proc-rfq-closing-date-validation` (`nvccz`, commit `5ee8ae0`, includes merges of the eight sibling branches above), pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-022

**Title:** Vendor email accepted with no server-side format validation on create, update, or public self-registration
**Module:** Accounting / Procurement shared Vendor Master (backend `nvccz`) · **Dimension:** Data validation (SRD §41)
**Severity:** MEDIUM
**Persona affected:** Any staff account creating/updating a vendor (`procurement.vendors.manage`); any public, unauthenticated vendor self-registering through the vendor portal
**Surface:** `src/controllers/VendorController.ts` (`createVendor`, `updateVendor`), `src/services/VendorSelfRegistrationService.ts` (`registerFromPublicPortal`)

SRD §41 "Data Validation" lists "valid email" as a required server-side validation example, and states "Server-side validation is mandatory even where frontend validation exists." SRD §8.1 "Vendor Record" tracks Contact Email as a tracked vendor field.

**Confirmed live on dev, 19 September 2026**, via `POST /accounting/vendors` as `proc.officer@nts.local`: `email: "not-an-email"` (no `@`, not a remotely valid format) was accepted -- **201**, persisted as-is (`id cmu82dnjh001npb010pycvsja`, name "Bad Email Vendor Co"). This system already emails vendor contact addresses for real (RFQ invitations, PO notifications, self-registration confirmations, all confirmed working elsewhere this session) -- a malformed address would silently fail delivery with nothing catching it at entry time. The public, unauthenticated self-registration endpoint (`POST /api/public/vendor-registration`) had the identical gap: only checked `email` was non-empty, never its format.

**Fix:** added the same email-format check `UserService.updateUser` already uses for user accounts (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), rejecting with 400 `"Invalid email format"`:
- `VendorController.createVendor` -- when `email` is supplied and non-blank.
- `VendorController.updateVendor` -- same, only when the caller is actually changing `email`.
- `VendorSelfRegistrationService.registerFromPublicPortal` -- `email` is already required here, now also format-checked (throws, caught by the controller's existing catch-all which already returns 400).

No shared validation helper exists elsewhere in the codebase (`EventController`, `NewsletterSubscriptionController`, `UserController`, `ApplicationService` all inline the identical regex) -- this fix follows that established convention rather than introducing a new abstraction. No schema change.

### Regression risk from this session's own deploy (same failure mode as PROC-FINDING-020/021)

This fix was branched from a worktree at bare `origin/master`, exactly the setup PROC-FINDING-020 and PROC-FINDING-021 warn silently drops every other not-yet-merged sibling fix already live on dev. The first deploy of this finding's fix (`fix/proc-vendor-email-validation`, commit `a41140c`, tarball `/tmp/arcus-api-vendoremail.tgz`) did exactly that -- it is the single-branch regression PROC-FINDING-021 documents catching and fixing by merging this branch into its own consolidated superset (`fix/proc-rfq-closing-date-validation` commit `5ee8ae0`, which already includes this fix plus all eight other sibling branches). By the time this was checked from this session's side, dev was already back on `5ee8ae0`. As an independent safety check, redeployed `5ee8ae0` again from a fresh worktree and grepped the running container's `dist/` directly for every sibling fix's marker plus this finding's own (`assertUserCanViewDepartmentPurchaseRequisition`, `SUSPENDED` in `AuthController.js`, the self-approval block message, `approvalLimit`, `manage_users` trim, `REQUISITION_ATTACHMENT_ALLOWED`, the negative-quantity/price markers, `closingAt` handling, and `"Invalid email format"` in both `VendorController.js` and `VendorSelfRegistrationService.js`) -- all present, container healthy, `/health` 200.

### Deploy

API only (no UI change). Two deploys this session: (1) a narrow single-branch worktree off `origin/master` -- the regression described above; (2) a corrective redeploy from `fix/proc-rfq-closing-date-validation` (`5ee8ae0`), the consolidated superset a sibling agent had already built and verified (see PROC-FINDING-021), confirmed to include this fix. Both used a one-off script modeled on `scripts/deploy-arcus-dev-selective.py`'s `--api` path, scoped to the `api` service only, sourced from a clean worktree rather than the dirty main `nvccz` checkout.

### Verification

Live on dev (`https://dev-api.matanho.com`), 19 September 2026, as `proc.officer@nts.local` (staff) and unauthenticated (public self-registration), against the corrective (`5ee8ae0`) deploy:

1. `POST /accounting/vendors` with `email: "not-an-email"` -- **400** `"Invalid email format"`. No vendor created.
2. `POST /accounting/vendors` with a valid email -- **201**, vendor created normally (no regression).
3. `PUT /accounting/vendors/:id` with `email: "still-not-an-email"` -- **400** `"Invalid email format"`.
4. `PUT /accounting/vendors/:id` with a valid email -- **200**, updated normally (no regression).
5. `POST /api/public/vendor-registration` (name + banks + `email: "not-an-email"`) -- **400** `"Invalid email format"`. No vendor created.
6. `POST /api/public/vendor-registration` with a valid email -- **201**, registration submitted normally, `registrationStatus: "PENDING_REVIEW"` (no regression).

### Cleanup

The original incident record, `Bad Email Vendor Co` (id `cmu82dnjh001npb010pycvsja`, email `not-an-email`), is left as-is and documented here rather than deleted, per this finding's own precedent of preserving the incident record. All four vendors this session's live verification created (two staff-created via steps 1-4 above, two self-registered via steps 5-6, across both the regression deploy and the corrective redeploy) were soft-deleted (`DELETE /accounting/vendors/:id`) immediately after verifying each, since none had linked expenses/transactions.

**Status:** FIXED -- deployed to dev (API only; corrective redeploy verified as of commit `5ee8ae0`, which is the current state of dev's `api` container), verified live 19 September 2026 for both the staff vendor-master path and the public self-registration path. Branch `fix/proc-vendor-email-validation` (`nvccz`, commit `a41140c`), pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-023

**Title:** Requisition/PO/quotation line items accepted negative or zero quantity and negative unit price with no server-side check -- a negative line persisted a negative `totalAmount` on the requisition itself
**Module:** Procurement (backend `nvccz`) · **Dimension:** Data validation (SRD §41)
**Severity:** HIGH
**Persona affected:** Any requester creating/editing a purchase requisition; any PROC_MGR/PROC_OFF/BUYER creating a purchase order; any vendor submitting a quotation through the public portal
**Surface:** `src/services/ProcurementService.ts` (`createPurchaseRequisition`, `updatePurchaseRequisitionByOwner`, `createPurchaseOrder`), `src/services/VendorQuotationService.ts` (`createVendorQuotation`), new shared helper `src/utils/procurementLineItemValidation.ts`

SRD §41 "Data Validation" lists "positive quantity" and "numeric value restrictions" as required server-side validation examples and states "Server-side validation is mandatory even where frontend validation exists."

**Confirmed live on dev, 19 September 2026**, via direct API calls to `POST /procurement/requisitions` as `proc.requester@nts.local`: a line with `quantity: -5, unitPrice: 10` was accepted -- **201**, persisted exactly as submitted (item row `{quantity: "-5", unitPrice: "10", totalPrice: "-50"}`) with the requisition's own `totalAmount` stored as **-50** (negative). A line with `quantity: 0` was also accepted -- **201**, no rejection. A line with `unitPrice: -100` was also accepted -- **201**. A negative or zero total defeats the `AMOUNT_THRESHOLD`/personal `approvalLimit` check in `ProcurementRequisitionApprovalService.decide()` (added by PROC-FINDING sibling `fix/proc-approval-limits`, already merged into this branch's ancestry): that check compares the requisition's signed `totalAmount` against the approver's limit, so a negative total never exceeds a positive limit regardless of the line items' true absolute value, routing straight to the lowest-authority tier.

The same gap existed on the update path (`updatePurchaseRequisitionByOwner` -- a DRAFT/REJECTED requisition could be edited to introduce a bad line after the fact) and on direct purchase-order creation (`createPurchaseOrder`, which builds PO lines straight from request body `items` with no check) and vendor quotation submission (`createVendorQuotation`, the public vendor-portal endpoint -- a vendor-submitted negative price would flow straight onto a PO if the quotation were accepted). RFQ line items (`normalizeRfqItemLinesFromBody`/`prItemsToNormalizedRfqLines`) and PO-from-accepted-quotation building (`buildPoLinesFromRfqAndQuotation`) were checked and found **already safe**: the former silently coerces a non-positive quantity to `1` (`coercePositiveQuantity`), the latter already throws on a negative unit price -- neither was changed.

**Fix:** added `assertValidProcurementLineItems(items, { requireUnitPrice? })` (`src/utils/procurementLineItemValidation.ts`): quantity must be a finite number `> 0`; unit price, when present, must be a finite number `>= 0` (zero stays legitimate -- e.g. a free sample or warranty-replacement line). Throws a plain `Error` naming the offending line 1-indexed and by item name (e.g. `"Line 1 (Bad item): quantity must be greater than zero"`), caught by each controller's existing catch-all and surfaced as 400. Wired into:
- `ProcurementService.createPurchaseRequisition` and `updatePurchaseRequisitionByOwner` (`requireUnitPrice: false` -- a requisition's unit price is only the requester's optional internal estimate).
- `ProcurementService.createPurchaseOrder` and `VendorQuotationService.createVendorQuotation` (`requireUnitPrice: true` -- a PO line or a vendor's quote must state a real price).

Also reworded the negative-price message from "unit price cannot be negative" to **"unit price must not be negative"** after live-testing found `VendorQuotationController`'s `withClientStatus()` maps a thrown message to 400 only via a keyword regex (`/not found|already .../must |required|invalid|expired|.../i`); the original wording matched none of those keywords and fell through to an unhelpful 500 on the vendor-quotation path specifically (`ProcurementController`'s requisition/PO paths always answer a flat 400 regardless of message, so they were unaffected). No schema change.

Checked the equivalent vendored frontend form (`nvccz-new`, `components/procurement-v23-mock/matanho-procurement-runtime.js`, `__pr23PrLineRowHtml()` backing the live `#prForm`): it already has `min="1" step="1"` on quantity and `min="0" step="0.01"` on unit price, and `lib/procurement-v23/actions.ts`'s `save-pr`/`submit-pr` dispatcher already rejects `quantity <= 0` client-side and collapses any non-positive price estimate to `undefined` before the API call -- added in an earlier phase, not this session. The requisition edit form (`#editPrFormV11`, `save-pr-v11`/`submit-pr-v11`) does not currently submit `items` at all (only title/justification/project), so it cannot introduce a bad line through the UI regardless -- only a direct API call can, which the server-side fix now rejects. No frontend change was needed.

### Regression risk from this session's own deploys (same failure mode as PROC-FINDING-020/021/022)

This branch was built from a worktree already carrying PROC-FINDING-019/020's seven-branch merge (`fix/proc-requisition-missing-fields` @ `412e963`), but two early deploys of this fix alone (commits `017f1b4`, then `02cb17f`) were single-branch builds that did not yet include `fix/proc-rfq-closing-date-validation` (PROC-FINDING-021) or `fix/proc-vendor-email-validation` (PROC-FINDING-022), both already live on dev from concurrent sibling agents at the time. Each of those two deploys silently dropped both fixes from the running container -- confirmed by re-testing `POST /vendor-quotations/submit` with a negative price shortly after the second deploy and getting **201** (fully accepted, negative totals persisted) instead of the expected 400, then confirming via `docker exec` grep that `dist/utils/procurementLineItemValidation.js` and the `assertValidProcurementLineItems` import were entirely absent from the running image despite the deploy script reporting success -- a race with a concurrent agent's own narrow single-branch deploy landing after this one (the deploy script's own `IMAGE_MISMATCH` warning, easy to miss, was the tell).

**Fix:** fast-forward merged `origin/fix/proc-rfq-closing-date-validation` (`5ee8ae0`, already a strict superset containing this fix's own two commits plus PROC-FINDING-021 and 022) into this branch, pushed, checked for no in-flight `docker compose build` on the VPS immediately before redeploying, and redeployed. Verified this time, before trusting the deploy script's exit code, by grepping the running container's `dist/` directly for eleven markers spanning every sibling fix documented live on dev (PROC-FINDING-010, 011, 015, 017, 019/020, 021, 022, the per-user approval limit, and this finding's own `"unit price must not be negative"`) -- all eleven present. Container healthy, `IMAGE_MATCH`, `/health` 200.

### Verification

Live on dev (`https://dev-api.matanho.com`), 19 September 2026, as `proc.requester@nts.local` (requisitions), `admin@nts.com` (purchase orders), and a server-minted real vendor-portal token for Baobab Networks & Computing (quotations), against the final consolidated (`5ee8ae0`) deploy:

1. **Requisition create, exact repro of the original bug:** `quantity: -5, unitPrice: 10` -- **400** `"Line 1 (Bad item): quantity must be greater than zero"`. `quantity: 0` -- **400**, same message. `unitPrice: -100, quantity: 5` -- **400** `"Line 1 (Bad item): unit price must not be negative"`. A normal `quantity: 5, unitPrice: 10` line -- **201**, `REQ_20260919_0005`/`REQ_20260919_0006` created with `totalAmount: "50"` (positive, correct).
2. **Requisition update:** editing a valid DRAFT requisition's item to `quantity: -3` -- **400**, same message; to `unitPrice: -20` -- **400**, same message; to a legitimate `quantity: 7, unitPrice: 15` -- **200**, `totalAmount` recalculated to `"105"` correctly.
3. **Purchase order create:** `quantity: -2` -- **400** `"Line 1 (...): quantity must be greater than zero"`; `unitPrice: -100` (or `-1`) -- **400** `"Line 1 (...): unit price must not be negative"`; a normal `quantity: 2, unitPrice: 100` line -- **201**, `PO_20260919_0001` created with `subtotal: "200"`, `taxAmount: "31"`, `totalAmount: "231"` (all positive, correct).
4. **Vendor quotation submit** (real signed `RFQ_SUBMIT` token minted server-side via `docker exec ... node -e "signVendorPortalToken(...)"`, same technique as PROC-FINDING-019's vendor-portal verification): `quantity: -2` -- **400** `"...quantity must be greater than zero"`; `unitPrice: -50` -- **400** `"...unit price must not be negative"` (this is the case that returned an incorrect 500 before the message-wording fix, retested and confirmed 400 after); a normal `quantity: 2, unitPrice: 50` line -- **201**, `QUO_20260919_0002` created with `subtotal: 100, taxAmount: 15.5, totalAmount: 115.5` (all positive, correct).

### Cleanup

`REQ_20260919_0005` (submitted, approved by `perf.deptmgr@nts.local`, used to raise `RFQ_20260919_0002` to Baobab Networks & Computing for the quotation-path verification) and `REQ_20260919_0006` (left `DRAFT`), `RFQ_20260919_0002`, `PO_20260919_0001`, and quotations `QUO_20260919_0001` (the pre-fix-wording negative-total record from the 500-returning deploy window, `subtotal: -100, totalAmount: -115.5` -- left as the incident record, same precedent as PROC-FINDING-021's original-incident RFQ) and `QUO_20260919_0002` (valid control) are left in `arcus_dev`, all clearly titled "PROC-FINDING verification" and traceable by number/timestamp.

**Status:** FIXED -- deployed to dev (API only; final consolidated redeploy verified as of commit `5ee8ae0`, the current state of dev's `api` container, confirmed to include all ten prior sibling fixes plus this one), verified live 19 September 2026 across requisition create/update, purchase order create, and vendor quotation submit. Branch `fix/proc-negative-quantity-price-validation` (`nvccz`, commits `017f1b4`, `02cb17f`, fast-forwarded to `5ee8ae0`), pushed to `origin`. **Merged to `master`/`dev`, not prod.** Merged to `master`/`dev` as part of the 19 September 2026 consolidation (`nvccz` `dd74dea`, `nvccz-new` `dd0b2e2`). Still not deployed to production.

---

## PROC-FINDING-024

**Title:** A partially-failed vendor-quotation attachment upload left already-succeeded files orphaned, unlinked to any quotation
**Module:** Procurement (frontend `nvccz-new` + backend `nvccz`) · **Dimension:** Code review · **Category:** Data hygiene / partial-failure handling
**Severity:** LOW -- no security or financial impact, but every failed multi-file batch left storage rows nothing would ever clean up
**Persona affected:** Any invited vendor attaching more than one document to a quotation via the public RFQ response form, where one file in the batch fails (size, network, transient error) after another has already uploaded
**Surface:** `app/vendor-quotations/rfq-respond/page.tsx` (`handleSubmit`'s attachment upload block); `POST /procurement/document-attachments/portal/upload`

### Origin

Raised as a PLAUSIBLE finding during code review of PROC-FINDING-018 (the RFQ response form's Payment Terms/attachments fix): `attachmentFiles.map(...)` was awaited via `Promise.all`, so one rejected upload rejected the whole batch immediately, but any sibling upload that had already resolved had already been persisted server-side (`VendorDocumentAttachment` row, `status: ACTIVE`, `entityId: null`) with no rollback. Retrying re-submitted the *entire* `attachmentFiles` array, including the ones already uploaded, compounding the orphan count with each retry that still contained a failing file.

### Fix (19 September 2026)

- **Backend** (`nvccz`, branch `fix/proc-remaining-uat-findings`, commit `c9b8876`): `VendorDocumentAttachmentService.deleteAttachment` no longer unconditionally rejects a portal actor -- it now only rejects when the attachment is already linked to a submitted record (`row.entityId` set). A new route, `DELETE /procurement/document-attachments/portal/:attachmentId` (token via query string, same pattern as the existing `portal/:attachmentId/download`), lets the public vendor portal remove a STAGED (never-linked) upload it just made. Anything already linked to a submitted quotation/invoice is still staff-only to delete, unchanged.
- **Frontend** (`nvccz-new`, same branch, commit `05bc62a`): `handleSubmit`'s upload step switched from `Promise.all` to `Promise.allSettled`. On any failure, the files that *did* upload are rolled back (best-effort, via the new endpoint) before surfacing a single error naming exactly which file(s) failed -- so a failed batch never leaves a partial set of attachments behind, and a clean retry starts from zero rather than compounding duplicates.

### Verification

Live on dev, 19 September 2026, via direct calls to the same public endpoints the form itself calls (the browser sandbox has no OS file-picker to drive a real multi-file `<input type=file>` selection, same limitation noted in PROC-FINDING-018's own verification):

1. **Rollback on partial failure:** uploaded a valid PDF as the sole-source RFQ's invited vendor (`RFQ_20260919_0005` token) -- **201**, staged (`entityId: null`). Uploaded a second, non-PDF file with the same token to force the batch's second call to fail -- rejected (multer's route-level PDF filter rejects it before the controller runs; the existing filter is unrelated to this fix). Called the new rollback endpoint, `DELETE /procurement/document-attachments/portal/{id}?vendorPortalToken=...`, on the first file's id -- **200**. A second delete attempt on the same id -- **404** `"Attachment not found"`, confirming it is genuinely gone (soft-deleted), not still sitting there unlinked.
2. **Portal cannot delete a linked attachment:** created a fourth RFQ (`RFQ_20260919_0006`), uploaded a PDF with its vendor's token, then submitted `QUO_20260919_0006` with that attachment's id in `attachmentIds` (**201**, linked -- `entityId` now set). Attempted the same portal-delete endpoint on that now-linked attachment -- **403** `"Portal users cannot delete an attachment already linked to a submitted record"`, confirming the fix only relaxes the restriction for staged (never-linked) uploads and a vendor still can't retract a document from a record it has already submitted.

Both the rollback mechanism and its security boundary (staff-only once linked) are confirmed working exactly as designed.

### Cleanup

`REQ_20260919_0010`/`RFQ_20260919_0006`/`QUO_20260919_0006` (the linked-attachment negative test, left `SUBMITTED` -- never decided, no need to) are left in `arcus_dev`, clearly titled "PROC-FINDING-024 verification". The rolled-back staged attachment left no residual row of consequence (soft-deleted, as intended).

**Status:** FIXED -- deployed to dev (API and `ui-vendor`), verified live 19 September 2026. Branches `fix/proc-remaining-uat-findings` in both repos (`nvccz` `c9b8876`, `nvccz-new` `05bc62a`), pushed to `origin`. **Not yet merged to `master`/`dev`, not prod.**

---

## Not yet findings

- **`POST /procurement/rfqs/:id/award` returns 410** to everyone. This is intended: award was
  retired in favour of accepting a quotation, which creates the purchase order. The V23
  "award" action must call `POST /vendor-quotations/:id/accept`.
- **The approval queue** (`GET /procurement/requisitions/pending-approval`) returns 400 to
  anyone who is not a department head. The response still needs checking against a real
  pending requisition.
