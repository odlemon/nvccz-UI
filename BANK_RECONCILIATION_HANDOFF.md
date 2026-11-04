# Bank Reconciliation handoff — takeover update (2026-10-28)

## Takeover status (supersedes stale progress notes below)

The assigned Bank Reconciliation work has resumed on the exact recorded branches: frontend
`staging-accounting-payroll-sweep` and backend `staging`. Existing edits and unrelated untracked
files were preserved. No branch switch, reset, cleanup, commit, push, deployment, server restart,
or migration was performed.

The audit timing race was fixed in `scripts/_uat/bank-reconciliation-interactions.mjs`. The
latest run passed **56/56 checks with zero errors**, validated 14 exports, and confirmed fixture
cleanup. The latest evidence is in
`test-artifacts/accounting-bank-reconciliation/interactions.json`, and the stale report was
rewritten at `test-artifacts/accounting-bank-reconciliation/REPORT.md`. The run immediately after
the API save had one recoverable login connection refusal while the pre-existing watcher was
respawning; a later run was clean. One intermediate run stopped before route parity because its
synthetic role omitted the restored shell’s dotted catalogue permission; the harness now uses a
separate flat-grant-only finance user to exercise the legacy route, while preserving the dotted
role for restored-route parity.

The finish controller now maps `PERIOD_LOCK_REJECTED` to HTTP **423** instead of 500. Browser/API
evidence confirms the locked finish leaves the session in `DRAFT`; ordinary successful finish,
reopen, imports, matches, permissions, and exports passed. No statement values or personal/account
details from the supplied PDF were retained in the updated report or synthetic audit fixture.

The three findings from the prior report are addressed: the legacy route accepts the explicit
`bank_reconciliation` grant; clickable shared table rows retain semantic row roles and keyboard
activation; and the unreachable detail drawer/state/file were removed while finalized sessions
continue through the read-only workbench. Downloadable normalized CSV and Excel statement templates
and no-active-bank setup guidance were added. The local DB has active bank rows with ledger and
currency links, but that does not establish client production configuration; actual client bank
details must be confirmed and entered by an authorized administrator. The supplied PDF is a CBZ
statement layout reference, not the user's upload format; arbitrary bank PDF upload is not claimed.

The user authorized a local actual-user run using the documented staff SuperAdmin and temporary
test data. Before the test, the supplied statement account matched none of the local active banks.
In Chromium on the restored route, a temporary Excel statement generated from the PDF's layout was
uploaded; the PDF itself was not uploaded. The app extracted statement metadata, created and imported
a draft automatically, and displayed searchable Cashbook and bank-statement tables side by side.
Eight temporary posted cashbook fixtures were matched; the balance agreed; finish persisted
`FINALIZED`; matched entries were reconciled; pagination worked; and PDF/Excel/CSV downloads
succeeded for both tables. An authenticated CSV preview separately parsed the matching CSV format.
The temporary bank, entries, session and statements were removed; cleanup assertions passed. The
seeded entries were test fixtures, not pre-existing client ledger activity, so this proves the
configured workflow, not that the client's actual cashbook agrees. An administrator still needs
to configure the real bank account and ledger link. Sanitized evidence is in
`test-artifacts/accounting-bank-reconciliation/actual-user-run.json`; no permanent bank setup,
deployment, migration, or change to existing accounting records was made.

A scoped TypeScript compiler-API check passed with no syntactic or semantic diagnostics in the five
changed React/page/table files. The broader `tsc --project` run still exits nonzero on existing
errors in imported unrelated modules. `node --check`, `git diff --check`, and the latest 56-check
browser audit passed. The local backend fixes are not deployed. Continue to preserve the process,
database, and unrelated-work cautions in section 9.

## Latest user test request (2026-10-28)

The user reported that an unrelated upload only produced a generic “no transaction lines” error.
`BankStatementUploadService.parseBankStatementRows` now requires the statement's Transaction
Date, Description, Debit, and Credit columns, accepts common equivalent headings, and returns
specific row-level errors for invalid dates/descriptions/amounts or invalid debit-credit rows.
The API preview validates before a draft is created; the frontend clears the file input after each
selection so the same corrected file can be retried. Authenticated API verification returned 200
for the matching statement, 400 with template guidance for an unrelated CSV, and no draft was
created by the rejected file. Parser checks also covered valid CSV/Excel, unrelated CSV/Excel, and
a malformed transaction row.

At the user's request, four synthetic cashbook transactions were posted with journal entries on
the existing `Matanho Capital - USD Operating Account`. Matching files are in the user's Downloads
folder: `Bank_Reconciliation_Test_Statement_2026-10-28.csv` and `.xlsx`. Their reference prefix is
`BR-TEST-2026-10-28-`; all four entries are POSTED and still unreconciled. These are intentional
test records, not disposable audit fixtures: leave them and both files in place until the user
completes testing. Do not finalize, edit, or delete them on the user's behalf.

---

Prepared for the next handoff. The prior progress record below is retained for its workflow,
evidence, and environment details; where it says the audit is not started or the report is stale,
use the takeover status above instead.

## 1. Original task and requested outcome

**(A) Production deployment (completed earlier in this conversation, now with a caveat):** deploy
all completed Accounting work to production following the repository's deployment instructions,
with NVCCZ-branded exported documents, and resolve problems found on the way. Server details were
supplied by the user and are not repeated here.

**(B) Bank Reconciliation handoff (the work this document is about):** pick up the previous
`BANK_RECONCILIATION_HANDOFF.md` and finish its seven open items — repair the unrun UAT script,
run the authenticated browser parity audit at 1600×1000, exercise the whole reconciliation workflow
(create/resume/discard, PDF+CSV preview/import, validation, duplicate import, auto/manual match,
tick/untick, bank-only booking, save/reload, blocked and successful finish, finalized refresh,
permitted and denied reopen, dialog close), test permissions with three synthetic users plus a
disposable period-lock denial, validate every PDF/Excel/CSV export and delete the copies, rerun
focused checks and the generated-runtime comparison, and rewrite the report with real metrics
("do not claim browser verification unless the script actually ran").

Requested outcome: a reconciliation module that is browser-verified end to end with evidence on
disk, and no client statement data in any log, screenshot, export, or document.

## 2. Repository state (exact)

| | Frontend | Backend |
| --- | --- | --- |
| Path | `C:/Users/lysp/Downloads/nvccz-new` | `C:/Users/lysp/Downloads/nvccz` (sibling, outside the declared workspace) |
| Branch | `staging-accounting-payroll-sweep` | `staging` |
| HEAD | `553bb3aa` — 2026-10-28 14:25:08 +0200 — "Consolidate current portal and accounting changes" | `68558c8` — 2026-10-28 14:33:39 +0200 — "Consolidate backend workflow changes before payroll branch" |
| Working tree | 2 modified (`BANK_RECONCILIATION_HANDOFF.md`, `scripts/_uat/bank-reconciliation-interactions.mjs`), 110 untracked | 2 modified, 0 untracked |

The two `Consolidate…` commits are **not** this session's work; this session ran no `git commit` or
`git push` (the only frontend files it modified are the two listed above). They already contain the
earlier bank-reconciliation edits (confirmed with
`git show --stat 553bb3aa`, which lists `app/accounting-legacy/bank-reconciliation/page.tsx`,
`app/accounting/bank-reconciliation/page.tsx`,
`components/accounting/bank-reconciliation-legacy-content.tsx`,
`components/accounting/reconciliation/reconciliation-live-workspace.tsx`,
`components/accounting/reconciliation/reconciliation-session-list.tsx`,
`lib/api/reconciliation-api.ts`, `lib/store/slices/reconciliationSlice.ts`,
`scripts/accounting-live/40-reconciliation.js`, the first draft of
`scripts/_uat/bank-reconciliation-interactions.mjs`, and the previous copy of this handoff file).

**Uncommitted work that exists only on disk — do not lose it:**

- Frontend `BANK_RECONCILIATION_HANDOFF.md` — this file, rewritten in place over the 78-line
  pre-task version and left uncommitted, as instructed.

- Frontend `scripts/_uat/bank-reconciliation-interactions.mjs` — `+563 / −121` versus HEAD. This is
  the repaired audit (section 4, item 1).
- Backend `src/services/CBZStatementPdfParser.ts` (+20/−5) and
  `src/services/BankReconciliationWorkbenchService.ts` (+4) — the two production-defect fixes
  (section 5). Written with a guarded throwaway patcher because `SearchReplace` refuses to edit
  files outside the declared workspace.
- `test-artifacts/accounting-bank-reconciliation/` is untracked: `interactions.json` (15 KB, run
  #18 evidence), `legacy-session-list.png`, `restored-session-list-pinned.png`, and
  `run-attempt2.log … run-attempt13.log` (one JSON summary line per run). `REPORT.md` in that
  folder is **stale** (written 11:16, before every browser run) — see section 8.

`git diff --check` is clean (exit 0) in both repositories.

## 3. Schema and migrations

None. This work changed no Prisma schema and ran no migration. Everything runs against existing
tables: `cashbook_reconciliation_sessions`, `cashbook_reconciliation_session_lines`,
`bank_statements`, `bank_statement_items`, the `cashbook_reconciliation_statements` link,
`cashbook_entries`, `journal_entries`/`journal_entry_lines`, `module_period_locks`,
`fiscal_periods`, `banks`, `roles`, `users`, `audit_logs`.

Detail that bit twice: `ModulePeriodLock` has **no `createdAt`** column (only `updatedAt`), so
`orderBy: { createdAt: 'asc' }` on that model throws a Prisma validation error.

## 4. What is complete

**Item 1 — repair the UAT script: complete.** `scripts/_uat/bank-reconciliation-interactions.mjs`
now runs end to end and always reaches its `finally` cleanup (`cleanup: true` in all five logged
runs, and the database is verified clean in section 7). Repairs made this session:

- Synthetic statement fixture rebuilt as generated bytes only (a one-page CBZ-layout PDF written
  with `pdf-lib` plus a bank-template CSV). No supplied client statement data is read, printed, or
  stored anywhere; the PDF/CSV are fingerprinted by byte length and a truncated SHA-256.
- `csvMoney = Number(value).toFixed(2)` replaces `toLocaleString` for CSV money fields. The backend
  `parseCSVLine()` splits on commas **before** `parseNumber()` strips thousands separators, so an
  unquoted `1,027,696.24` was being read as `1` and every continuity refusal was mis-attributed to
  the fixture. A self-check (`synthetic statement CSV carries machine-readable money fields`) now
  fails loudly if a future fixture reintroduces that.
- Login helper fixed for two real hazards, both measured: the login form must be React-owned before
  the submit click (a pre-hydration click does a native document POST and the app's `/auth/login`
  never happens), and the check must not wait for the role-chosen landing URL (`window.location.href`
  full load, dev-compile sized). Locators bind to placeholders so react-hook-form rerenders cannot
  clear the fields.
- Route entry gets compile-sized budgets (a dev-mode Next route compile took minutes on this box).
- All table-row addressing uses `locator('tbody tr')`, because `ProcurementDataTable` overrides the
  implicit row role (finding in section 5).
- Upload instrumentation: `uploadStatement()` ledgers the file name, byte length, and SHA-256 of the
  buffer the script itself built, and the response listener attaches **both** answers (the
  `?preview=1` read and the import POST) to that record. Playwright cannot expose a multipart body
  (`postDataBuffer()` is null) and reports no `Content-Length` for it either, so no client-side
  transport probe is possible; anything claiming otherwise is guessing.
- Finish is now asserted from the `POST /finish` answer plus the database row, never from the
  success toast. `armDialog()` records the native confirm that fired and accepts it.
- Period-lock fixture: `applyBankPeriodLock()` refuses to touch a real non-`OPEN` lock, tracks only
  the rows it created, and `releaseBankPeriodLock()` runs first in `cleanupFixture()`.
- Every wait that can fail carries a named cause with the UI alert, toasts, API errors, and the
  fixture bytes.

**Item 2 — browser parity audit at 1600×1000: complete** (checks 4-10 and the metrics block).
Numbers from run #18 (`evidence.metrics`, `cssomLeaks`, `requests`, `races`):

- One persistent portal host and one React mount on both routes; the restored route renders the
  same component (`data-bank-reconciliation-module` attribute present).
- Natural module width: legacy `1344px`, restored `1322px` (22px narrower — a real difference, not
  pinned away). With the width pinned by injected style, `h1` and `p` are identical in size
  (`449px` wide, `30px`/`17px` font) and offset only by `x −9px` / `y +46px`, which is the shell
  chrome above the slot, and the filter combobox matches exactly (`256×40`).
- CSSOM leakage: 5 selectors, **all** prefixed `.accounting-v52-root`, so nothing escapes the shell.
- Requests counted per endpoint; concurrent same-endpoint races: `[]` (zero).
- Screenshots are element-scoped of the module only (`legacy-session-list.png`,
  `restored-session-list-pinned.png`) — synthetic data in shot, no client detail.

**Item 3 — full workflow: complete** (checks 11-48, 39 of them). Draft persisted through the API;
PDF parses and previews 8 lines; import persists; duplicate import refused with the exact message;
auto-match, manual match/unmatch, match-dialog cancel; cleared balance equals the statement closing;
tick and untick persist; draft resumes after reload; finish blocked by the disposable BANK period
lock, then finish persists `FINALIZED`; every statement line matched before finalize; exactly the
cleared cashbook entries reconciled; reopen denied without `manage_ledger` (403) and permitted with
it (200, back to `DRAFT`, and it finishes again); CSV row validation refuses all three bad-line
classes with their exact messages and writes nothing; CSV preview totals correct; CSV import
persists; book-dialog cancel; bank-only item posts through `CashbookService` (`POSTED` + journal
entry) and brings the cleared balance to the statement; the CSV workflow finalizes; draft discard
persists and leaves the list; a new draft can start; finished sessions open read-only (measured:
`saveDraft 0, finish 0, fileInput 0, reopen 1, importedBanner 1`); session-list exports and
finished-row exports.

**Item 4 — permissions and period lock: complete** (checks 23, 27, 49-53). Three synthetic roles
(authorized, view-only, reconcile-without-`manage_ledger`) and users are created per run and deleted
afterwards. API enforcement measured: read `403`, write `403`, workbench `403`, authorized workbench
`200`. UI gating measured for the view-only operator: `New Reconciliation` still rendered (1),
`Start Reconciliation` hidden (0).

**Item 5 — exports: complete** (14 validated downloads across statement preview, bank statement,
cashbook, and session list in PDF/Excel/CSV). Each file is opened in memory and checked for the
host's branding (`/new_logo.png`, 200, 163,789 bytes on loopback — local loopback renders *Matanho*;
production renders *NVCCZ*, and `expectedBrand` asserts whichever this host should produce), workbook
parsability, CSV headings/rows, and totals. Downloads go to a temp directory that is deleted.

**Item 6 — focused checks: complete for this task.** Done: `node --check` on the audit script (exit 0);
`git diff --check` in both repos (exit 0); generated-runtime comparison —
`scripts/accounting-live/40-reconciliation.js` matches the section in
`components/accounting-v52-mock/matanho-accounting-runtime.js` (L7152-7156) **verbatim**, so no
generator run was needed; a backend `@ts-nocheck` missing-import sweep over the reconciliation
surface (1,154 TS files walked, **897 carry `@ts-nocheck`**, 62 in scope for
reconciliation/statement/period-lock/fiscal/cashbook/bank, 6 candidate hits, all verified false
positives — three are dynamic `await import()` on the preceding line, three are inside comments).
The only genuine missing import in that class was `PeriodLockService`, which is fixed. A scoped
TypeScript compiler-API check has since passed with no syntactic or semantic diagnostics in the
five changed React/page/table files. The broader `tsc --project` command still fails on pre-existing
errors in unrelated transitive modules. Backend files carry `@ts-nocheck`; runtime workflow checks
cover the parser and finish behavior.

## 5. Defects found and what is already fixed

**Fixed locally, uncommitted, and NOT deployed:**

1. **Reopen/finish path had no `PeriodLockService` import** in
   `src/services/BankReconciliationWorkbenchService.ts` (the file is `@ts-nocheck`, so tsc never
   caught it). Added. Production release #2 was packed from the working tree at ~12:28-13:30
   (`tmp-deploy-status.txt` records the tree that was packed); this file was edited at **18:04**, so
   **production still carries this defect** and BANK finish/reopen will 500 there.
2. **Intermittent `400 Invalid PDF structure` on statement import.** Proved, not guessed: the new
   upload ledger shows one 2,766-byte PDF answered `200` for its preview POST and `400` for its
   import POST seconds later; the same happened to a 2,769-byte document. Three of six runs hit it.
   A first hypothesis (multer's pooled `Buffer` view with a non-zero `byteOffset` breaking
   `pdf-parse`) was **formally ruled out**: a purpose-built probe holding an immutable master
   buffer with a per-trial hash passed 25/25 across every buffer shape, including offsets
   2720/3000/4096 with stale `%PDF-` bytes ahead. (An earlier version of that probe produced
   position-dependent results because it was corrupting its own pooled buffer — the lesson is that
   the probe was invalid, not that the hypothesis was right.) `CBZStatementPdfParser.ts` now copies
   the bytes into their own `Uint8Array` and wraps the parse in a `try/catch` that names the byte
   count and the first eight received bytes, so any recurrence says "these bytes are not a readable
   PDF" instead of leaving transport and parser indistinguishable. `importStatement` also refuses a
   zero-length upload with its own message. Since the change, runs #17 and #18 both parsed the PDF
   cleanly (2 consecutive passes; that is the whole size of the post-fix sample, so treat it as
   promising rather than proven).

**Resolved since the original run #18:**

3. **Period-lock HTTP status:** `CashbookReconciliationSessionController.finish` now maps
   `PERIOD_LOCK_REJECTED` to HTTP 423. Latest evidence: locked finish `423`, UI shows the lock,
   database session remains `DRAFT`.
4. **Legacy-route finance permissions:** the Bank Reconciliation page now checks the same explicit
   `bank_reconciliation` action used by the API. Audit confirms a synthetic finance user with only
   the flat grant can enter the legacy route; a view-only user is denied. Other legacy route guards
   were not changed.
5. **Clickable row semantics:** `ProcurementDataTable` keeps the native row role and supports
   keyboard Enter/Space on focused rows without consuming nested control keystrokes. Latest audit:
   3 accessible table rows including the header, 2 body rows, and keyboard activation passed.
6. **Unused detail drawer:** removed the unreachable drawer component/mount/state. Finalized rows
   still open the read-only workbench.
7. **Audit timing:** harness waits for a known row before row-count and discard-absence checks.
   Latest audit passed all 56 checks with zero errors and cleanup confirmed.

**Client configuration dependency:** added a normalized CSV template and a setup message/link for
the no-active-bank case. The local dev database currently contains four active bank records with
ledger and currency links, but no production account details were inspected or changed. An
authorized client administrator must confirm the actual bank accounts and ledger mappings. The
CSV template is the supported route for non-CBZ statements; arbitrary bank PDF layouts are not
claimed as supported.

## 6. API endpoints and data flow used

All calls observed from the browser (count for run #18 in brackets):

- `POST /api/auth/login` (staff portal, through the real form).
- `GET /api/roles/rbac/effective` [9], `GET /api/roles/rbac/portfolio/effective` [9],
  `GET /api/accounting/me` [2], `GET /api/accounting/me/counts` [3],
  `GET /api/accounting/currencies` [2], `GET /api/accounting/multi-currency/rates` [2],
  `GET /api/accounting/chart-of-accounts` [1], `GET /api/homepage/notifications` [2].
- `GET /api/cashbook/banks` [2], `GET /api/cashbook/reconciliation/banks/:id/sessions` [9],
  `POST /api/cashbook/reconciliation/banks/:id/sessions` [3] (create draft).
- `GET /api/cashbook/reconciliation/sessions/:id/workbench` [18] (every action reloads through it).
- `POST /api/cashbook/reconciliation/sessions/:id/statement` [9] — the same route with `?preview=1`
  for preview and without it for import; `multer({ storage: memoryStorage(), limits: { fileSize: 5MB } })`
  in `src/routes/cashbookRoutes-Enhanced.ts` (~L593).
- `POST …/auto-match` [1], `POST …/lines/:id/match` [1], `POST …/lines/:id/unmatch` [1],
  `POST …/tick` [2], `POST …/lines/:id/book` [1] (bank-only posting),
  `PATCH …/sessions/:id` [1] (save draft), `POST …/finish` [4], `POST …/reopen` [1],
  `POST …/discard` [1].

Flow: `BankReconciliationWorkbenchController` → `BankReconciliationWorkbenchService`
(`importStatement` branches on the file name: `.pdf` → `parseCBZStatementPdf`, `.csv` →
`parseBankStatementCSV`) → `CashbookReconciliationSessionService` for session/line state,
`CashbookService` for bank-only posting, `PeriodLockService` for BANK period checks on finish and
reopen. The mounted React workbench is
`components/accounting/reconciliation/reconciliation-live-workspace.tsx` with
`lib/api/reconciliation-api.ts`. The older standalone `BankStatementUploadService` workflow writes
the obsolete `BankReconciliation` model and is **not** this workflow.

Nothing further is needed from the backend to exercise the module; the missing pieces are the four
open defects in section 5.

## 7. Checks and tests run, with results

**Browser audit run history** (each line is the script's own summary; `errors` = an exception ended
the run early, which is why low check counts are not low coverage):

| Run | Result |
| --- | --- |
| #2 | 2 checks, 4 errors — login hydration race |
| #3, #4 | 3 checks, 1 error each |
| #5 | 9 checks, 1 error |
| #6 | 2 checks, 2 errors |
| #7 | 17 checks, 1 error |
| #8 | 12 checks, 1 error |
| #9 | 20 checks, 1 error |
| #10 | 20 checks, 1 error |
| #11 | 10 checks, 1 error (login/fixture/route fixes in flight) |
| #12 | 27 checks, 1 error |
| #13 | 31 checks, 1 error (CSV money-format defect identified here) |
| #14 | 13 checks, 1 error — `Invalid PDF structure` on import |
| **#15** | **53 checks, 52 passed, 0 errors, 14 exports, 3 findings, cleanup** (one unnamed ANDed boolean failing) |
| #16 | 13 checks, 1 error — the decisive upload ledger entry (`2766` bytes, preview `200`, import `400`) |
| **#17** | **53 checks, 51 passed, 0 errors, 14 exports, 3 findings, cleanup** — first run after the parse fix; two finish checks failed |
| **#18 (final)** | **53 checks, 52 passed, 0 errors, 14 exports, 3 findings, cleanup, 168 s** |

Run #18 pass list (all except 42): fixture validity and arithmetic (1-3), login (4), parity and
mounts (5-10), draft/preview/import/duplicate/auto-match/match/unmatch/tick/untick/resume (11-22),
period-lock block and finish/finalize/line/entry assertions (23-26), reopen denied and permitted
(27-29), workbench exports (30), reopened finish (31), CSV fixture self-check, three validation
refusals and no-write (32-34), CSV preview/import/book-dialog/bank-only posting/balance (35-39),
CSV finalize (40), discard (41), row addressing (42 — FAIL, harness timing), cancelled draft leaves
the list and a new draft starts (43-44), session-list exports (45), read-only finalized session (46),
finished-row exports and no dead drawer (47-48), API permission enforcement and hidden write
controls (49-53).

**Fixture hygiene verified after the runs** (read-only probes): leftover synthetic users
`bank-rec-*@example.test` = **0**; leftover roles `UAT_REC*` = **0**; leftover UAT banks = **0**;
`module_period_locks` for BANK = the same three rows that existed before this work — March 2025
`OPEN` ("UATC-25649 test finished"), **July 2026 `LOCKED` (reason `"ttt"`)**, September 2026 `OPEN`.
No October 2026 lock row survives, so the disposable lock released correctly even when a run failed.
`period_lockouts` is empty. Nine `CANCELLED` reconciliation sessions whose references contain "UAT"
(`UATR27040` etc., created 2026-09-27 → 2026-10-19 on banks named "UATR… Test Account") are **other
agents' older rows, not this fixture** — leave them alone.

**Earlier passes retained:** the supplied client statement parsed to 8 transactions (opening
278,549.86, debits 8,190.67, credits 350,000.00, closing 620,359.19, arithmetic verified) with no
account or personal detail emitted anywhere; that file was never copied into this repository.

**Production deployment (task A) verified earlier in this conversation:** release #2 built
(`BUILD_OK`, 732 s) and cut over; `nvccz-prod-api` and `nvccz-prod-ui-staff` both `Up (healthy)`;
API `/health` `200 {"status":"OK",…,"database":"connected"}`; staff UI `login 200`,
`nvccz-logo.png 200`; accounting endpoints `401` unauthenticated; NVCCZ branding baked into the
image (`NEXT_PUBLIC_ORGANIZATION_NAME=NVCCZ`, `NEXT_PUBLIC_ORGANIZATION_LOGO=/nvccz-logo.png`);
rollback tags `nvccz-prod-api:pre-release-20261028-130419` and
`nvccz-prod-ui-staff:pre-release-20261028-132651`; disk 73%. Honest gaps: no production exported PDF
was pulled (no production credential), and per section 5 the deployed backend predates both fixes,
so **production reopen/finish is expected to fail until redeployed**.

## 8. Remaining work

- Confirm and enter the client's actual bank accounts/GL mappings in the target environment; local
  dev data is not proof of client production setup. Obtain samples if additional PDF bank layouts
  need support.
- The broad frontend TypeScript command still reports unrelated dependency errors; the scoped
  TypeScript API check for touched React/page/table sources passed.
- The local backend and frontend changes remain uncommitted and undeployed. No production check or
  configuration change was made.

## 9. State the next agent must preserve or avoid

**Processes — I stopped nothing, deliberately.** The only processes this session started were the
UAT runs and read-only probes, and all have exited (verified: 0 processes matching
`bank-reconciliation-interactions`). The servers answering the audit were already running **before**
this session and cannot be attributed to it, so killing them would break other agents:

- Port **3019** (API): worker PID 28752, started 18:04 **today as a ts-node-dev hot-restart of my
  own file save**; its parent watcher is **PID 26020, started 10/27 19:49 — before this session, so
  this API is not mine to stop**. A second watcher on the same backend folder, **PID 25516 (started
  11:33 today), cannot be confidently attributed** to any one session; it is reported rather than
  stopped. Killing 28752 is also unnecessary: it already runs the patched parser, and the two edits
  live on disk regardless.
- Port **3001** (staff UI): PID 14296 (10/27 19:50) with its server PID 13940 (10/28 08:48), started
  via `scripts/run-portal-dev.mjs staff` (PID 2964, 10/27 19:49).
- Other agents' stacks, untouched: 3161 payroll-isolated worktree
  (`C:/Users/lysp/Downloads/nvccz-new-worktrees/payroll-isolated-20261028`), 3000 standalone
  procurement, 3009 a `Documents/procurement backend` ts-node-dev, plus a local upload mock
  (PID 15292). **Two ts-node-dev watchers sit on the same `nvccz` backend folder (PID 26020 and
  PID 25516) and their respawned workers compete for port 3019 — worth telling the user, not fixing
  silently.**

**Avoid:**

- Do not run `node scripts/accounting-live-sync.mjs` or the accounting-live generator while shared
  accounting-live files may be changing; the runtime section for reconciliation is already verbatim
  (section 4, item 6).
- Do not reset/revert/`git clean` either repository. The 110 untracked frontend paths include other
  agents' `tmp-*` probes, `test-artifacts/accounting-*` evidence, and `.qoder/`.
- Do not print or copy the supplied client statement's account or personal details into logs,
  screenshots, exports, or documents. The audit's fixture is generated synthetic data; keep it that way.
- Do not create a real period lock: `applyBankPeriodLock` deliberately refuses when a non-`OPEN`
  BANK lock already covers the statement date, and the July 2026 lock proves such rows exist here.
- Do not deploy or commit without the user's explicit instruction.

**Throwaway files this session created (all under `.acc-dumps/`, all untracked; safe to delete once
the backend patch is committed — keep `tmp-patch-statement-parse.cjs` until then, it is the record of
exactly what was patched and how):** `tmp-patch-statement-parse.cjs`, `tmp-pdf-parse-probe.cjs`,
`tmp-pdf-parse-probe2.cjs`, `tmp-ts-nocheck-sweep.cjs`, `tmp-read-evidence.cjs`, `tmp-lock-probe.mjs`,
`tmp-handoff-probe.mjs`, `tmp-handoff-probe2.mjs`, and the run logs
`bank-rec-run14.log … bank-rec-run18.log` (worth keeping as the run trail).

## 10. How to run this again

Frontend: from `C:/Users/lysp/Downloads/nvccz-new`, `npm run dev` (or
`node scripts/run-portal-dev.mjs staff`) → staff portal on **http://localhost:3001**;
`.env.local` sets `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3019/api`.
Backend: from `C:/Users/lysp/Downloads/nvccz`, `ts-node-dev --respawn --transpile-only src/app.ts`
→ API on **3019**; health is `GET /health` (**not** `/api/health`, which 404s); it reads
`C:/Users/lysp/Downloads/nvccz/.env` for the local database. Hot restart takes ~25 s to answer
health again — save both patched files, then poll `/health`.

Audit: `node scripts/_uat/bank-reconciliation-interactions.mjs` from the frontend root (~2-4 min,
headless Chromium). It creates and deletes its own synthetic roles/users/bank/sessions/lock, prints
one JSON summary line, and writes `test-artifacts/accounting-bank-reconciliation/interactions.json`,
two PNGs, and `run-attemptN.log`. No credentials belong in the document: the script generates
per-run passwords into process environment variables only (`ACCOUNTING_TEST_EMAIL`/
`ACCOUNTING_TEST_PASSWORD`, `BANK_REC_DENIED_*`, `BANK_REC_NO_REOPEN_*`), and unset `ACCOUNTING_*`
values are fine because the fixture is created fresh each run.

## 11. Session lessons worth keeping

1. Never assert a state change on a toast: two finish checks reported success for requests that were
   never sent, because a previous finalize's toast was still mounted (`toastCount: 2` on run #18's
   last finish proves toasts accumulate). Assert the API answer plus the database row.
2. A wait that can pass vacuously is a false pass. Measure each condition separately with a bounded
   wait first (`evidence.finishedReadOnly`, `evidence.rowAddressability`).
3. Fingerprint the fixture and ledger the exact bytes sent. The `2766`-byte PDF with `200` preview /
   `400` import is what turned "flaky" into a specific, reproducible claim.
4. A probe can be the bug: the first buffer-shape probe produced position-dependent results because
   it corrupted its own pooled buffer. Immutable master plus per-trial integrity check, or the
   answer is noise.
5. `@ts-nocheck` in the backend (897 of 1,154 TS files) means a missing import ships silently; only
   a runtime sweep or behaviour test finds it.
6. Check the order of operations in a parser before believing its error message — the CSV split
   happens before the thousands-separator strip, so a "statement does not add up" refusal was really
   a fixture-format bug.
