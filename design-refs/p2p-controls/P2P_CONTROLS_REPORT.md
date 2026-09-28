# Purchase Orders → Receipt → Invoice → Matching → Accounting Handoff, plus the optional AI layer

Scope: `/procurement`, BRD §21–§25 (Part A) and §29–§31 (Part B). Everything was built and tested locally; nothing was deployed or committed.

## 1. What was missing

| Area | Gap found |
|---|---|
| §21 PO | No link from a PO to its RFQ and award, no vendor code, cost centre, budget code, GL code or purchase conditions; PO PDF had no per-environment logo and the preview differed from the download; no PO approval. |
| §22 Receipts | No delivery note, location or attachments; partial receipts did not recalculate outstanding; over-receipt was not blocked; no service receipts (period, evidence, no quantity). |
| §23 Invoices | No supplier invoice number; no duplicate detection; invoices not tied to a receipt. |
| §24 Matching | Only a loose two-way check; the seven exceptions were not detected individually; tolerances were fixed; a "3-way match" screen showed fixture numbers. |
| §25 Handoff | No states, no ordering, no audit trail; payment could be recorded on any approved invoice. |
| §29 AI | Extraction could write into records; no review with provenance; no source view. |
| §30 Prohibitions | Nothing stopped AI influencing approval decisions. |
| §31 Controls | No on/off switch, no usage record, no limits, no user-group or document-type restriction. Large PDFs failed ("Command token too long: 128"). |

## 2. What was built

**Purchase orders.** A PO carries vendor and vendor code, requisition, RFQ, award, cost centre, budget code, GL code (taken from the requisition and budget when not typed), currency, payment terms, delivery date and address, purchase conditions, lines with received and outstanding, subtotal, VAT and total. A PO can be created from a requisition on screen; the form sends all accounting fields. One server-rendered PDF is used for preview, download and email, so they are identical (verified byte-for-byte in the browser). The logo is chosen by environment: Matanho on dev, NVCCZ on prod. PO approval is optional (Configuration switch) and runs through the approval engine stage `PURCHASE_ORDER`; a PO cannot be sent until approved when the switch is on, and a draft made before the switch was turned on is shown as "Approval required".

**Receipts.** Goods receipts record delivery note, location, comments and attachments; accepted plus rejected must equal received; outstanding is recalculated after every receipt (10 → 7 after 3 accepted); receiving more than outstanding is blocked. Service receipts use period, amount confirmed and evidence (evidence required), no quantities.

**Invoices.** The supplier's invoice number is required (also on the vendor portal, which now has the field). A duplicate number for the same vendor is refused whatever the case or punctuation; a rejected invoice frees its number. Invoices link to vendor, PO, receipt and event.

**Matching.** Seven exceptions detected individually: quantity, value, tax, missing receipt, missing PO, excess invoice, duplicate. Tolerances (unit price, value, VAT, quantity) are configurable; inside tolerance passes, outside raises. The match is re-run before approval and before payment. Enforcement is server-side: an invoice with a blocking exception cannot be approved unless a user holding the override permission approves over it with a reason; the override, reason, user and time are stored. The match screen shows real counts and the checks one by one with the tolerances applied.

**Handoff.** Ready for Finance → Submitted → Accepted → Paid → Closed, with Returned/Rejected going back to Ready for Finance. No skipping (API refuses with `HANDOFF_ORDER`), each move recorded with user and time in an append-only history, shown on screen. Payment requires Accepted.

**AI layer (optional, fully disableable).** Extraction for quotations, invoices, company profiles, tax clearance, registration, technical submissions, delivery notes and price schedules. Every value is reviewed as AI extracted value → original source (quoted text, verified against the document) → your confirmation, with accept, correct, reject, manual entry and open-the-original. Provenance (original, AI-extracted, human-confirmed) has visibly different styling. AI proposals never overwrite official data. Prohibitions (§30) are enforced: AI cannot award, reject vendors, approve, or change payment details; auto-approval is rule-based and AI can only add caution. Admin controls (§31): on/off, monthly document and call limits, approved user groups, permitted document types, usage table; usage is recorded for every call including blocked ones. Large PDFs work: text is read with pdf-parse, then `pdftotext`, then OCR.

With AI off, Part A works unchanged (tested).

## 3. Other fixes made while testing

- PO form was not sending accounting fields (fixed).
- Draft POs created before approval was enabled showed no approval state (backend now reports "Approval required"; the chip is shown beside the status, not hidden in the row menu).
- Runtime patch script: a marker collision and a stale marker caused a patch to skip/miss; corrected so the script is safe to re-run.
- Old regression suites updated for the supplier invoice number and handoff rules.
- Vendor portal invoice page: supplier invoice number field added.

## 4. Interpretation decisions

- PO approval is a setting (off by default), using the existing approval engine, not a new workflow.
- Payment requires the Finance "Accepted" handoff state.
- Match enforcement defaults to ENFORCE; WARN is available; override needs its own permission and a reason.
- AI is on by default; the switch, groups and document types are configurable.
- Services are confirmed by amount.
- Bank details are never extracted by AI.
- A rejected invoice releases its number.
- AI uses the DeepSeek key hardcoded in `src/config/llmGlobals.ts` as its fallback (as the owner instructed); setting `LLM_API_KEY` in the environment overrides it. The real extractions in the tests ran on it.

## 5. Test evidence

- API suite `scripts/_uat/p2p-e2e.ts` (backend repo): 181/181, including real LLM extraction, the prohibitions, limits, and large or awkward PDFs.
- Browser suite `scripts/_uat/p2p-ui.mjs` (one real, visible, off-screen window; roles sign in in the same tab): results below. Screenshots in `design-refs/p2p-controls/screens/`.
- Chain tested more than once; exception paths tested deliberately; tested with AI on and off.

## 6. Migration log (order applied)

1. `db:migrate:user-status`
2. `db:migrate:nts-remaining`
3. `db:migrate:user-master`
4. `db:migrate:vendor-master`
5. `db:migrate:planning-requisitions`
6. `db:migrate:sourcing-evaluation`
7. `db:migrate:procurement-permissions`
8. `db:migrate:p2p-controls` (idempotent; adds PO accounting fields, receipt and invoice columns, match result and override columns, handoff columns and event table, AI controls and usage tables)
9. `prisma generate` (only; `prisma migrate` and `db push` are never used)

## 7. Deploy notes (nothing was deployed)

- Set `APP_BRAND` (or the matanho URLs) on dev so the PO PDF uses the Matanho logo.
- No AI key setup is needed: the built-in DeepSeek fallback is used unless `LLM_API_KEY` is set.
- `ALLOWED_DOCUMENT_HOSTS` is a local-only setting for the upload mock.
- Run the migration list above on each environment's database, in order.

## 8. Known limits

- The local database occasionally refuses a connection for a moment (P1001); the test setup retries.
- The first click on a row's action menu is occasionally swallowed while the row is still being enhanced by the runtime; a second click opens it.

## 9. Results

Browser suite `p2p-ui.mjs`, by stage, final passing runs: purchase orders 20/20; receipts, invoices, matching and handoff 59/59 (one continuous run, no failures); configuration and blocked paths 22/22 in the last run plus the AI review stage 18/18 (with the AI switched off, at the monthly limit, and outside the approved user group all covered). Every failure seen along the way was either a test-script assumption or one of the product fixes listed in section 3.

Regression suites, all passing after the invoice-number and handoff updates: vendor master 78/78, vendor portal adversarial 56/56, sourcing and evaluation 210/210, planning and requisitions 165/165, user master 69/69, purchase-to-pay API 181/181.
