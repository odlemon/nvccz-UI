# Accounting sweep: findings

## Access and integrity (phase 1)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| A-01 | 304 of 420 accounting routes | Only login was checked, and login also admits LP, investee and applicant accounts: anyone signed in could read the ledger, post, void and reverse journals, reconcile banks and change the chart of accounts | CRITICAL | One guard in front of every Accounting and Cashbook router (`accountingAccessGuard`, rules in `config/accountingAccess.ts`): staff only, and the permission the route needs |
| A-02 | Role grants | Only the `admin` role held any accounting key (the CFO gets some by code), so the few guarded routes refused every finance role | CRITICAL | Grants per tier (A0) |
| A-03 | Periods | `POST /api/cashbook/periods/lock` let anyone lock or unlock a ledger period | CRITICAL | `accounting.period_lock.manage` |
| A-04 | Journals | Any signed-in user could void a posted journal | CRITICAL | `manage_ledger` (the posting service still refuses the preparer) |
| A-05 | Statements | Role-name lists allowed only roles literally named "admin" or "accountant": the Finance Manager, auditors and executives were refused the income statement, balance sheet and cash flow | HIGH | Permission-based (`view_financial_reports`) |
| A-06 | Scheduler endpoints | `POST /api/cron/exchange-rate-display/snapshot-refresh` and `/api/cron/lp-portal/snapshot-refresh` had no check at all; payroll's certificate-expiry run was open whenever no secret was configured | HIGH | Shared secret, or the server itself only (`requireCronCaller`) |
| A-07 | Short-term investments | Any user could switch the posting mode (draft ↔ approved) | HIGH | `accounting.treasury.approve` |

## Scheduled jobs (phase 2)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| J-01 | Interest accrual | Ran whenever someone signed in (every login), so interest was booked only on days somebody signed in, and at unpredictable times | HIGH | Scheduled 23:59 tenant time with catch-up (`AccountingJobService`) |
| J-02 | Depreciation | The monthly run existed as an endpoint nothing called | HIGH | Scheduled on the 1st for the month just ended |
| J-03 | Rates | No rate was ever stored; conversions called the live source each time | MEDIUM | Daily 09:00 official rate, with fallback and an alert |
| J-04 | Recurring journals, month-end investment FX, maturity alerts, overdue receivables, close reminders, ledger integrity | Not scheduled (manual only) or not built | MEDIUM | Scheduled jobs with a run log, off switches and Run now |
| J-05 | Fiscal time zone | Defaulted to UTC, so the fiscal day turned over at 02:00 Harare time | MEDIUM | Africa/Harare when none is configured (D2) |
| J-06 | Ledger (data) | The first integrity run found 13 posted journals that do not balance and a trial balance difference of −322,209.92 locally: payroll test runs from 9 September (some dated 2030 and 2036), each short on the debit side, all from before the payroll posting fix (42b234a) | HIGH | Dev: voided with the reason recorded (D18); the integrity check now follows the reports' rule for void pairs; ledger balances (TB 5,030,286.31 both sides). Other environments: run the check, correct with a reviewed journal |

## Short-term investments (phase 3)

Checked against the SRD's UAT script, suites 01–08 (`scripts/_uat/acct-sti.mjs`, 50 checks) and by role in the browser (`scripts/_uat/acct-ui-roles.mjs`).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| S-01 | Accrual approval | An approver could not post the day's interest journal: the posting check refused it because the system, not the approver, had drafted it | HIGH | Approving an accrual posts it as the approver (D10) |
| S-02 | CFO approval of large placements | Every CFO had to approve a placement over USD 50,000 before it was booked (three CFO accounts: three approvals), so it never booked | HIGH | Accounting approval steps settle on one decision, like procurement (payments, investment bookings, chart-of-accounts changes) |
| S-03 | Approval threshold in ZiG | ZiG placements were converted to USD with the wrong rate direction, so large ZiG placements skipped the CFO | HIGH | Uses the stored Accounting rate (USD→ZiG divides) |
| S-04 | Future dates | Interest could be accrued, and investments settled, for days that had not happened yet | HIGH | Both refused past today (tenant time) |
| S-05 | Rate input | A rate of "12" could be read as 12% or 1,200% depending on a guess | MEDIUM | The page sends a percentage explicitly |
| S-06 | Backdated rate change | A rate effective in the past was stored but the days already accrued kept the old rate, contrary to SRD 2.5 | HIGH | Draft days from the effective date are recalculated; days already posted are ledger history, so the change is refused with the first date it can take (D11) |
| S-07 | Portfolio totals | The dashboard added ZiG amounts to USD amounts as if they were the same currency (a ZiG 1,000,000 placement counted as USD 1,000,000) | CRITICAL | Totals, maturity ladder and daily yield in the reporting currency at the as-of rate; a currency without a rate is left out and alerted (D12) |
| S-08 | Void | Voiding a placement booked in error reversed its interest but left the cash sitting in the investment account | HIGH | The placement journal is voided or reversed too; the reason is recorded |
| S-09 | Month's yield | Interest reversed by a void still counted as interest earned this month | MEDIUM | Voided investments are excluded |
| S-10 | Alerts | Placements waiting for the CFO and settlement journals still in draft were invisible on the investments page; the opening rate showed as a "rate change" | MEDIUM | Both listed as awaiting approval; the opening rate is not a change |
| S-11 | Page | The Short-Term Investments page showed a fixed chart axis (USD 3.2m–4.3m, Aug–Jul), a heat map and risk panels with no data behind them, and buttons that did nothing | HIGH | Rebuilt on the live API: KPIs, needs-attention list, daily interest this month, liquidity forecast, register (active / settled / voided), detail with rate and accrual history; place, change rate, accrue, approve, liquidate, void, posting mode, each offered only to roles that may do it |
| S-12 | Error messages (all modules) | Where a server answered `{ error }` rather than `{ message }`, the screen said "HTTP error! status: 400" instead of the reason | MEDIUM | The shared API client shows either |
| S-13 | Scheduler log | Every minute the scheduler logged a database error for each slot already run | LOW | Checks the slot first |

## Journals and periods (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| P-01 | Fiscal calendar (data) | Two FY2026 calendars overlapped (one with every month starting a day early), and the period lookup took whichever it found first: a lock on September could be bypassed through the other "September 2026", and the Period Close page showed the wrong period's tasks | CRITICAL | A3 removes the duplicate; the nightly ledger integrity check now also reports overlapping periods |
| P-02 | Void | Voiding a posted journal did not check the period lock, and reports leave out a voided journal together with its reversal, so a void silently changed the figures of a month already locked and reported | CRITICAL | A posted journal is voided only while its month is open (D16) |
| P-03 | Maker-checker | The CFO and administrators could post journals they had prepared themselves | HIGH | Nobody posts their own journal (D14); system postings keep their explicit exception |
| P-04 | Maker-checker | An approver could change someone else's draft (amounts, accounts) and then post it, checking their own work | HIGH | Only the preparer changes a draft; an approver rejects it instead |
| P-05 | Dates | Journals could be dated in the future | MEDIUM | Refused after today, tenant time (D15) |
| P-06 | Drafts | A preparer had no way to withdraw their own draft (only approvers could void it), and nothing stopped a draft raised by an invoice, payroll run or investment from being voided from the register, orphaning its record | MEDIUM | Discard for the preparer's own manual drafts; drafts raised for another record are withdrawn from that record |
| P-07 | Register ↔ investments | Posting an investment's interest journal from the journal register left the investment showing the day as awaiting approval | MEDIUM | Posting marks the accrual posted too |
| P-08 | Line descriptions | Saving a journal line without its own description failed with an empty error | LOW | The line carries the journal's description |
| P-09 | Journal Entries page | Save draft, import, export and "Request reversal" only changed the screen; the reject reason was not kept; nothing showed what a journal was raised for | HIGH | Rebuilt on the live API: register by status and dates with search and paging, detail with lines and source, new/edit draft with a live balance check, post, reject (with reason), discard, void (reverse); each offered only to roles that may do it |
| P-10 | Investment clean-up (data) | Placement journals of investments voided before S-08 were left as drafts (34) | LOW | Voided |
| P-11 | Period lock | A month could be locked with its close checklist still open (SRD ACC-PER-07: the lock is the last task, blocked until the others are complete) | HIGH | Refused while tasks are open (the lock override permission can proceed, and is warned); draft journals dated in the month are reported on locking |
| P-12 | Close tasks | Only the period manager could move a task, so a task's owner could not mark their own work done | MEDIUM | Owners start and complete their own tasks; reopening stays with the period manager |
| P-13 | Period Close page | Workstreams, exceptions, evidence, sign-offs, readiness %, a fixed forecast ("01 Aug 17:20") and "July 2026" were fixtures, and "Request period lock" only changed the screen | HIGH | Rebuilt on the live API: month picker (defaults to last month while it is open), readiness (checklist, draft journals, unreconciled bank lines, investment interest, depreciation, lock), checklist by workstream with owners, due dates and dependencies, standard checklist, add task, lock month (GL, AR, AP, BANK) and reopen with reason, lock history |

## Bank reconciliation (phase 3)

Checked by `scripts/_uat/acct-bankrec.mjs` (26 checks, on a dedicated test account) and in the browser.

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| B-01 | Reconciliation page | "Run auto-match" and "Submit for sign-off" ticked every unreconciled entry and finished the reconciliation: nothing was compared with the bank statement, and it only ever succeeded if nothing was outstanding | CRITICAL | Rebuilt: per-account overview; workbench with the statement beside the cashbook (ACC-CB-33); import, auto-match, match by hand, book bank-only lines, tick, finish, discard, reopen |
| B-02 | Statements | Statements could not be brought into the reconciliation used by the books; the only import fed a separate matcher that compared against journals and never reconciled anything (several of its routes fail) | HIGH | Statement import into the reconciliation (bank CSV template or typed lines), checked to add up (opening + in − out = closing) and to follow on from the last reconciliation |
| B-03 | Matching | No matching of statement lines to cashbook entries existed | HIGH | Auto-match: same direction, same amount, within two days, reference preferred, one to one; two equally likely entries are left for a person. Manual match refuses the wrong direction, a different amount, or an entry already matched |
| B-04 | Bank-only lines | Charges, interest and direct debits on the statement had no way into the books from the reconciliation | MEDIUM | "Book to cashbook" posts a receipt or payment for the line against a chosen account and matches it |
| B-05 | First reconciliation | The first reconciliation of any account always failed ("openingBalance is required"): the page never sent an opening balance | HIGH | The first reconciliation asks for the statement's opening balance; later ones start from the last closing balance |
| B-06 | Finish | Finish did not require the statement's lines to be matched, and two reconciliations finishing together could both clear the same entries | HIGH | Every imported line must be matched; entries are claimed only while still unreconciled |
| B-07 | Reconciled dates (ACC-PER-04) | Entries could be booked, or back-dated, into a period already reconciled, silently breaking the reconciled balance | HIGH | Nothing can be booked to an account on or before its last reconciled statement date (every cashbook path) |
| B-08 | Void / unreconcile | The cashbook void used by the app did not check reconciliation (SRD: "Transaction must be unreconciled before voiding."), and one entry of a finished reconciliation could be unreconciled on its own, leaving the reconciliation's closing balance false | HIGH | Both refused; a finished reconciliation is reopened as a whole (latest first, by an approver, with a reason) |
| B-09 | Statement dates | A reconciliation could be dated in the future, overlap an earlier one, or run twice at once for the same account | MEDIUM | Refused |
| B-10 | Test data route | `POST /api/cashbook/reconciliation/seed-five-unreconciled` (creates posted cashbook lines) was open on every server | MEDIUM | Off unless `ALLOW_TEST_SEEDS=on` |

## Cashbook (phase 3)

Checked by `scripts/_uat/acct-cashbook.mjs` (11 checks, on test accounts).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| C-01 | Cashbook page | The register said "No cashbook records" while 48 posted entries existed; "Unreconciled lines 4", "Bank feeds 0/1", "Ledger integrity: Balanced" and "4 statement lines, 0 matched" were fixtures; a "Batch processing model" tutorial panel; Save draft and Import batch did nothing | HIGH | Rebuilt: cash at bank per currency, month in/out, awaiting allocation, not reconciled; per-account cashbook vs ledger balance; register with account, type, status, dates, search and paging; receipt, payment (account, customer or supplier), transfer, void |
| C-02 | Void | Any preparer could void a cashbook entry (SRD ACC-CB-15: the Cashbook Void permission) | HIGH | Approvers only (`manage_ledger`) |
| C-03 | Reconcile one entry | `PUT /api/cashbook/entries/:id/reconcile` marked an entry reconciled with no reconciliation behind it (SRD ACC-CB-26: N → R only through bank reconciliation) | HIGH | Refused; entries are reconciled by finishing a reconciliation |
| C-04 | Dates | Receipts, payments and transfers could be dated in the future | MEDIUM | Refused after today (tenant time) |
| C-05 | Ledger vs cashbook (integration) | The operating account's ledger balance differs from its cashbook by USD 179,699.22 locally: postings to the bank account without a cashbook line (investment placements and settlements, some performance journals). They can never be reconciled | HIGH | Fixed: any journal that pays into or out of one bank account now records its cashbook line — when it is posted (the post step), and every morning for journals other modules post directly (capital call receipts, distribution payouts, performance postings; the integrity job's first step). The owning module reverses its own line. Locally 72 lines were recorded and the operating account's cashbook equals its ledger (difference 0) |

## FX (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| FX-01 | Ledger currency model | Journal lines carry no base-currency amount (SRD ACC-GL-04: foreign amount, base amount and rate on every line); the trial balance and statements add amounts across currencies unless filtered to one, and do not translate. The bank revaluation endpoint builds on this: it treats the bank ledger total as a foreign-currency balance, values it at the first transaction's rate, and books the whole movement again on every run | CRITICAL | Fixed (phase 5, D17 as built): every line is valued in USD at the rate locked on its journal when posted (the journal's USD/ZiG snapshot; other currencies at the stored rate for the date); the trial balance, balance sheet, income statement, cash flow, general ledger and Command Centre in USD cover every currency at those amounts, and in ZiG show ZiG journals in ZiG. Month-end revaluation (`/multi-currency/revaluation`, FX page, job `fx.revaluation` at 23:50 on the last day) books only the movement since the last revaluation, as a draft for an approver, against 4050. The old per-bank revaluation endpoint is retired (410). Checked by `acct-fx-base.mjs` (7) and `acct-fx-reval.mjs` (6) |
| FX-02 | FX page | Everything shown was fixture data: USD/ZAR, EUR/USD and GBP/USD rates, a USD 3.49m exposure, entities that do not exist; Rate sources, Preview journal and Run revaluation did nothing | HIGH | Rebuilt: latest rate per pair with the movement since the previous one, missing and stale rates, the daily official-rate job, exposure by currency (bank accounts, investments, open invoices and bills) at the latest rate, the rate table; enter and correct rates (a correction keeps the old value and the reason); fetch today's official rate |
| FX-03 | Rate table API | `GET /multi-currency/exchange-rates` did not list stored rates: each call fetched a live quote and invented record ids, so rates entered or stored daily could not be listed; it also failed outright because the currency is coded ZIG (it looked for ZWL or ZWG) | HIGH | `GET/POST /multi-currency/rates` list and record the stored rates; the live quote accepts ZIG |
| FX-04 | Topbar rate | The rate pill scraped the Reserve Bank's website from each browser through a public CORS proxy (failing on every load) and showed a rate saved in the browser ("27 Jul 2026") | MEDIUM | Shows the stored rate the ledger uses; its refresh button reads it again |
| FX-05 | Live layer robustness | One failing live page file stopped every live page after it from loading | MEDIUM | Each page file loads on its own |

## Fixed assets (phase 3)

Checked by `scripts/_uat/acct-assets.mjs` (17 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| FA-01 | Fixed Assets page | Run depreciation, Preview, Post run, Transfer, Impairment, Dispose, Capitalise and Record verification opened a generic dialog whose confirm button only closed it; asset intelligence ("88% verification coverage"), a carrying-value chart on a fixed axis and a lifecycle mix (54/28/18%) were fixtures | HIGH | Rebuilt: KPIs, register (in use / disposed), asset detail with depreciation history, add asset, move, dispose, depreciation run with preview; decorative panels no longer injected into live pages |
| FA-02 | Asset currency | An asset added without a currency or paying bank was recorded in ZiG (the code looked for ZiG first) | HIGH | The base currency |
| FA-03 | Funding | An asset added without saying how it was paid credited whichever account first matched "Cash" or "Bank" by name; a sale with proceeds did the same | HIGH | The paying bank or account to credit is required; proceeds need a bank or account |
| FA-04 | Bank lines (integration) | Assets bought or sold through a bank account credited or debited the bank's ledger account with no cashbook line, so the bank could not be reconciled (and the same for short-term investment placements and settlements: C-05) | HIGH | The bank side is recorded as a cashbook line linked to the journal, following it when posted or voided; it is reversed from the asset or investment, not the cashbook. Existing ones: A5 backfill |
| FA-05 | Depreciation run | A month could be depreciated before it ended; there was no preview (SRD ACC-FA-09) | MEDIUM | Only completed months; preview per asset (charge, or why left out: bought later, already posted, fully depreciated) |
| FA-06 | Register edits | An edit could switch an asset off (`isActive: false`), removing it from the register without a disposal entry | MEDIUM | Edits change descriptive fields only; an asset leaves by disposal |
| FA-07 | Linking to a supplier bill | An asset linked to a bill posts its own credit to payables on top of the bill's, doubling the liability | MEDIUM | Fixed: an asset bought on a supplier bill moves its cost out of the account the bill's own posted journal debited (Dr asset / Cr that expense), so the bill stays the one amount owed; refused for a bill not yet posted or a cost above the bill before VAT. The Add asset form offers "On a supplier bill already posted" with the posted bills listed. Checked by `acct-asset-bill.mjs` (3) |
| J-07 | Journal void ↔ cashbook | Voiding a journal from the register left its cashbook line posted (cashbook and ledger then disagreed); a journal whose bank line was reconciled could be voided | HIGH | The cashbook line follows the journal; a reconciled one blocks the void |

## Figures shown (phase 4)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| H-01 | Sidebar counts | Counted from the screen's own copies of the data, loaded once and stale after any change (Journal Entries showed 86 with 51 drafts); Bank Reconciliation's count came from demo statement lines | MEDIUM | Counted by the server for the signed-in user (`GET /accounting/me/counts`): approvals and journals waiting on them, the close month's open tasks, bank accounts behind on reconciliation, overdue customer invoices, supplier bills due within a week, investment approvals; refreshed every minute and after each save |
| H-02 | Payables | Bills were titled by their internal id ("cmtr0lzo3000…") | LOW | Titled by invoice number |
| H-03 | Payables → Procurement | "Capture a supplier invoice", "Open in procurement" and similar left Accounting for Procurement in the same tab | LOW | New tab (CLAUDE.md cross-module links) |
| AP-01 | Supplier payment run | No payment run (select approved bills → validate → approve the batch → bank file → confirm settlement, SRD ACC-AP-11) | MEDIUM | Fixed: Payment Runs (`/accounting/payment-runs`, from Payables): a preparer gathers approved, unpaid bills payable from one bank account (the others show why not: finance has not accepted them, no vendor bank on record, another currency, already in a run); someone else with posting rights approves it (the bills are checked again); the bank file lists each payee's bank account; settling with the bank's confirmation pays each bill through the procurement payment step (journal, cashbook line, bill paid), keeping any failure with its reason to settle again; cancelled only with a reason; every step audited. Checked by `acct-payrun.mjs` (14) |

## Receivables (phase 3)

Checked by `scripts/_uat/acct-receivables.mjs` (24 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| AR-01 | Receipt → invoice | The page's receipt flow posted the cashbook receipt (Cr receivables), then could not match it (the open-items answer carried its list in the message field) and fell back to "mark as paid", which posted a second Dr bank / Cr receivables: receivables credited twice for the same money | CRITICAL | Open items answer in `data`; a receipt is allocated, never also "marked paid"; same-currency "mark as paid" refused (cross-currency settlement paths unchanged) |
| AR-02 | Receipts and payments | Customer and supplier receipts/payments defaulted to 15% VAT, so part of a customer's payment was booked as output VAT | HIGH | No VAT on money settling invoices; an entry against an account carries VAT only when a code is given |
| AR-03 | Allocation | Allocation did not check the customer, currency, invoice status (drafts and voided invoices were accepted) or what was already allocated, could drive an invoice negative, and was not atomic; draft and deleted invoices were listed as open; undo never worked (route without the receipt id) and did not restore amounts | HIGH | All checked, in one transaction; open items are sent, unpaid invoices; undo restores the invoice |
| AR-04 | Credit notes | Posted straight to the ledger at creation (no approver, no period check); editing or deleting a draft left that journal in place; applying one always failed (a table that does not exist) | HIGH | Drafted with the note, posted by an approver when issued; amounts fixed once raised; deleting a draft withdraws its journal; apply works (same customer and currency, sent invoice, not more than outstanding) |
| AR-05 | Invoice void | Paid invoices could be voided; voiding created a new, unposted reversal while the invoice's own journal stayed (a draft's in the approval queue) | HIGH | Paid or part-paid: refused; a sent invoice's posting is reversed (open period, approver); a draft's journal is withdrawn |
| AR-06 | Due dates | The due date given on an invoice was dropped (every invoice counted as overdue) | MEDIUM | Kept; empty means the customer's payment terms (30 days when none) |
| AR-07 | Routes and data | `GET /invoices/summary` was unreachable (read as an invoice id); customer payment terms sent as a number failed | LOW | Fixed |
| AR-08 | Receivables page | "Weighted quote pipeline $448,620" and quotations were fixtures (quotations are not stored), "Outstanding $7,800" counted a draft, the date filter was fixed to Jul–Aug 2026; statements, recurring billing, credit notes and email did nothing | HIGH | Rebuilt: owed by currency, overdue, over 90 days, DSO, receipts to allocate, drafts; invoices, receipts to allocate, credit notes, customers with balances, ageing; new invoice (lines, due date), send, record receipt and allocate, credit note raise / issue / apply / delete, void, new customer |

## Expenses (phase 3)

Checked by `scripts/_uat/acct-expenses.mjs` (9 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| EX-01 | Expense status | An expense was marked POSTED the moment it was saved while its journal was a draft awaiting approval; approving or voiding that journal never changed the expense | HIGH | Submitted on saving; approved when its journal is posted, returned (rejected) or voided when voided; existing ones set from their journal (A6) |
| EX-02 | Paid from a bank | "Paid by bank" credited whichever bank account the code found first, with no cashbook line | HIGH | The paying bank is chosen and must be in the expense currency; the payment is a cashbook line that posts with the approval (FA-04 mechanism) |
| EX-03 | Expenses page | Claim review, evidence, "Return for correction" and card import did nothing; corporate cards, recurring expenses and the policy studio were fixtures | HIGH | Rebuilt: awaiting approval / approved / returned, waiting on me, record expense (supplier, category, VAT, how paid), approve (posts) and return (with what needs correcting), never by the person who recorded it |
| EX-04 | Routes | `GET /expenses/summary` was unreachable (read as an expense id); the list did not say who recorded each expense | LOW | Fixed |
| EX-05 | Employee claims workflow | The SRD's claim chain (employee → line manager → finance reviewer → finance manager, reimbursement run, per-diem and duplicate checks) has no backend: expenses are supplier expenses | MEDIUM | Fixed: Employee Claims (`/accounting/claims`, `ExpenseClaimService`, `/api/accounting/claims`, A11). Staff itemise a claim with receipts (required above the policy threshold); line manager (same department, `accounting.timesheets.manage`) → finance reviewer (`manage_accounting`, assigns the expense account per item) → finance manager (`manage_ledger`, not the reviewer) approves — posting Dr expense / VAT input, Cr 2260 — or rejects; any step returns with a reason; possible duplicates and a category's daily limit are flagged and approved only with a note; reimbursement from a bank in the claim's currency (Dr 2260 / Cr bank, cashbook line). Claim journals cannot be voided on their own. Tests: acct-claims 20/20, acct-ui-claims 11/11 |


## Reports and ledger (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| RP-01 | Trial Balance, Financial Reports, General Ledger | Computed in the browser from at most 1,000 journals (silently wrong beyond that); prior-year columns, signatories, approval status and ratio reports were fixtures; exports, preview, approval and signatures did nothing; an injected "multi-currency reporting" panel showed a July rate register | HIGH | Built on the server's statements: trial balance (as of, currency, debits = credits check, drill to the ledger), income statement, balance sheet (balance check), cash flow, general ledger (account, dates, running balance); CSV export |
| RP-02 | Integrity check vs reports | The integrity check counted a voided journal's reversal as an unbalanced posted journal (the reports leave the pair out) | LOW | Same rule as the reports |
| AQ-01 | Approval Queue | Showed pending journals and approval requests from the screen's own copies, with fixture rows approved locally; "Refresh policy" did nothing; procurement approvals mixed in with no way to act on them | HIGH | Rebuilt on `GET /accounting/me/queue`: approval requests assigned to the user and journals prepared by others, labelled by what they were raised for, with age; approve / reject (with reason), post / reject journals; procurement items open in Procurement (new tab); invoices and credit notes go to Receivables |
| AQ-02 | Posting an invoice's journal | An invoice's or credit note's draft journal could be posted from the register, leaving the document in draft with its amount in the ledger | HIGH | Refused: posted by sending the document |
| AQ-03 | Procurement → journals (data and code) | Procurement created expense journals with the currency id "default-currency" (no such currency) when the invoice had none; 14 drafts could not be read by any screen that joins the currency | HIGH | The base currency; the 14 corrected |

## Recurring journals and chart of accounts (phase 3)

Chart of accounts checked by `scripts/_uat/acct-coa.mjs` (17 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| RJ-01 | Recurring journals | A new template was switched on the moment it was saved, and its author could switch it on: every month it then posted without anyone else reviewing it | HIGH | Saved switched off; switched on only by an approver other than its author, recorded in the audit trail |
| RJ-02 | Recurring Schedules page | Schedules, next runs and amounts were fixtures; "Run" and "Pause" changed only the screen | HIGH | Rebuilt on the templates: on / waiting / paused, next posting date (tenant time), lines, switch on, pause, run now, run what is due |
| CA-01 | Switched-off accounts | A switched-off account could still be posted to, and an account could be switched off with a balance, a draft journal, an active bank account or active sub-accounts depending on it | HIGH | Journals to a switched-off account are refused when prepared and when posted; switching off is refused while anything depends on the account |
| CA-02 | Account history | Adding, changing, approving a change to or deleting an account left nothing in the audit trail | MEDIUM | Each is recorded (who, when, before and after) and shown on the account |
| CA-03 | Changes sent for approval | A preparer's change was queued for the CFO even when it could never be applied (e.g. a type outside the number range), failing only at approval | LOW | Checked when submitted |
| CA-04 | Deleting | An account a bank account posts to could be deleted while still unused | LOW | Refused |
| CA-05 | Chart of Accounts page | Governance history, import and change requests were fixtures | HIGH | Rebuilt: accounts by number range, usage per account, add (number range checked), change (approval for anyone but the CFO or an administrator), switch off, delete when unused, history |
| CA-06 | Data | Account 1000 is a reporting bucket not meant for posting but carries one posted line; UAT runs left test bank ledger accounts | LOW | Open (clean-up) |

## Audit trail (phase 3)

Checked by `scripts/_uat/acct-audit.mjs` (13 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| AU-01 | Audit Trail page | Showed the last 100 events from every module (logins, vendors, procurement) with raw record ids; no filters, paging or search; "Export audit log" and "Verify integrity" did nothing useful (the only check looked at the last 10 journal numbers) | HIGH | Rebuilt on `GET /accounting/audit`: accounting records plus period-lock actions, by area, action, person, dates (tenant days) and reference (a deleted record included), paged; each event with its reference, who, role, what changed before → after, reason |
| AU-02 | Export | No export existed | MEDIUM | `GET /accounting/audit/export`: CSV of exactly what is filtered (before and after values included); the export is itself recorded |
| AU-03 | Integrity | No full check of the journal sequence | MEDIUM | `GET /accounting/audit/integrity`: every journal number checked (missing, repeated, unnumbered, counter behind) and every posted journal balanced |
| AU-04 | Journals deleted by the system | An investment rate restatement deleted the draft interest journals it replaced, and payroll's accounting rebuild deleted posted journals: holes in the journal numbering (74 numbers missing on dev, most from these and from test clean-up) | HIGH | Withdrawn or voided instead, never deleted (D20); the dev gaps cannot be restored and are reported by the check |
| AU-05 | Tenant clock | The fiscal clock fell back to UTC while the investment and job clocks used Harare: from midnight to 02:00 Harare a journal dated today was refused as future-dated; FX rates and close readiness used the UTC day | HIGH | One clock, Africa/Harare unless configured (D19) |
| AU-06 | Live pages (all) | A page's filters were wired on an animation frame, which never fires in a background tab: filters opened in another tab did nothing until the tab was shown | LOW | Wired on a timer |

## Access, settings and bank accounts (phase 3)

Bank accounts checked by `scripts/_uat/acct-banks.mjs` (13 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| AC-01 | Access Control page | Listed all 2,235 users of every module with invented columns (scope, approval authority, MFA, last active, review); "Invite user", "Create role" and "Run access certification" did nothing | HIGH | Rebuilt on `GET /accounting/access`, worked out as the server decides each request: roles × permissions, the people holding each (search, role, permission, last sign-in), people holding both halves of a control, what each permission allows; roles and users are changed in Admin (new tab) |
| ST-01 | Settings page | Configuration change control, "Save configuration", change requests, feed status ("Bank feed"), integrations and access counts were fixtures; only 1 of 21 bank accounts shown | HIGH | Rebuilt: bank accounts (currency, ledger account, cashbook balance, difference to the ledger, reconciliation state; add, change, switch off / on), company details (administrators edit the letterhead here; addresses and logo in Admin, new tab), currencies with the latest rate |
| ST-02 | Bank accounts | Any preparer could set up or change a bank account; its currency or ledger account could be changed after entries were recorded (cashbook and ledger then disagree); an account could be switched off with money, unposted or unreconciled entries, a reconciliation in progress or an investment settling into it; nothing was audited | HIGH | Set up and changed by approvers; currency and ledger account fixed once entries exist; switching off refused while anything is left, with the reasons; every change audited (area Cash and bank) |
| ST-03 | New bank account | Its ledger account number was the clock's last four digits (could collide), and on a duplicate account number the ledger account was created anyway and left behind | LOW | Numbered after the last bank ledger account; the account number checked first |
| ST-04 | Scheduled job run times, statement import times | Stamped with the database server's local time but read as UTC: two hours late wherever the database is not on UTC | LOW | Stamped in UTC |
| ST-05 | Data (dev) | The operating account's cashbook balance is negative (−USD 3.56m) and differs from the ledger by USD 0.22m; 20 switched-off UAT bank accounts; company profile empty | LOW | Open (clean-up; C-05) |
| PF-01 | Live pages (performance) | Every rebuilt page still triggered the old page loaders (up to 1,000 journals for the ledger pages) whose results it never read | MEDIUM | Not loaded for live-drawn pages |
| IN-01 | Integrations page | Eight invented connectors (CBZ and Stanbic bank feeds, Entra ID SSO, ZIMRA gateway, "Workshop OS") all shown "Connected" with made-up sync times, data-exchange health and governance controls; "Add connector" and "Open connector" did nothing | HIGH | Rebuilt on `GET /accounting/integrations`: each module that actually feeds the ledger (procurement, payroll, short-term investments, fixed assets, performance, funds and portfolio, exchange rates) with its journals (30 days, all, waiting, voided, latest), the scheduled jobs that carry it and their last run, and failures recorded in 30 days; other modules open in a new tab |

## Timesheets (phase 3)

Checked by `scripts/_uat/acct-timesheets.mjs` (11 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| TS-01 | Timesheets & Projects page | "Import timesheets" and "Approve selected" did nothing; "Unbilled WIP", utilisation, margin and "evidence gaps" were shown though no cost or billing rates exist; instructional captions under each table | MEDIUM | Rebuilt: weeks waiting for the approver (lines, approve, return with what to correct), the team's weeks by status, projects with approved / billable / waiting hours (add and change for those who manage them); no money figures without rates |
| TS-02 | `GET /accounting/me` | Left out the timesheet permissions, so a page could not tell an approver from anyone else | LOW | Included |
| TS-03 | Project list | Carried no hours | LOW | Approved, billable and waiting hours per project |
| TS-04 | Data (dev) | Approved zero-hour weeks back to 2012 for the admin account (test debris) | LOW | Open (clean-up) |

## Inventory (phase 3)

Checked by `scripts/_uat/acct-inventory.mjs` (12 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| IV-01 | Stock movements | Receipts, issues and count adjustments never reached the ledger: the inventory account and the stock value drifted apart (dev: USD 2,100 of stock, USD 0 in 1400) | CRITICAL | Each movement posts its journal in the same transaction (D22): receipt Dr inventory / Cr where it came from; issue Dr cost of sales or an expense / Cr inventory; count difference against a variance account |
| IV-02 | Opening quantity | Creating an item with an opening quantity set it on the item and also received it: counted twice (dev item 50 on hand, 25 received) | HIGH | Received once; dev item corrected (A8) |
| IV-03 | Count adjustments | A shortfall was added to stock (the quantity was made positive); any preparer could adjust | HIGH | Signed difference (a shortfall reduces stock); approvers only |
| IV-04 | Cost | The "weighted average" never moved: receipts at another cost left the item's cost unchanged, and the cost could be typed over | HIGH | Moving weighted average (D21); not changed by hand once stock has moved |
| IV-05 | Sales with stock | The cost-of-sales journal named a currency "default" that does not exist and looked for a "Cost of Goods Sold" account the chart does not have, so a sale with stock items failed | HIGH | Base currency, the tenant's day, 5005 Cost of Sales (added, A8) |
| IV-06 | Stock journals | Could be voided from the journal register, leaving stock and ledger apart | MEDIUM | Refused: corrected by another movement |
| IV-07 | Item changes | An item with stock could be switched off; its inventory account could change after stock moved; errors came back as "Failed to …" without the reason | MEDIUM | Refused with the reason |
| IV-08 | Inventory page | Recent movements (ISS-4118, RSV-0871, GRN-2391 …), usage, replenishment and count screens were fixtures; "Transfer" and "Cycle count" did nothing | HIGH | Rebuilt: items (receive, issue, count, change), movements with their journals, month roll-forward (opening + received − issued ± counted = closing), ledger check per inventory account |

## Compliance and tax (phase 3)

Checked by `scripts/_uat/acct-tax.mjs` (10 checks).

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| TX-01 | VAT accounts | Each posting and the VAT report looked up "VAT Input" by name, matching both 1101 and 2110: the report could read 2110 (no postings) while input VAT sat on 1101 | HIGH | One resolver for every posting and report (D23) |
| TX-02 | VAT return | Counted draft journals as VAT due, and a voided journal's reversal; added ZiG VAT into USD totals | HIGH | Posted journals only, voided pairs left out as in every report; one currency at a time (base by default), other currencies listed apart; drafts carrying VAT shown separately |
| TX-03 | Tax return packs | Only portfolio roles (admin, fund manager, CFO, analyst) could open them: accountants and finance managers were refused | HIGH | Open to accounting roles; accounting preparers compile; sign-off stays with the CFO and never the preparer |
| TX-04 | Tax return packs | Compiling refused any period containing a voided journal ("unposted journals"), so a real period could never be compiled | HIGH | Only drafts waiting to be posted hold a return up |
| TX-05 | Compliance & Tax page | Pack register rows, readiness %, exceptions, PBC requests, signature queue and workflow were fixtures; "New compliance pack" and "Run readiness scan" did nothing; instructional captions | HIGH | Rebuilt: VAT return by quarter or month and currency (output, input, net, drafts apart, every line, CSV) and tax return packs (create, compile, submit, sign off, history, sealed PDF) |

## Balance sheet and group consolidation (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| RP-03 | Balance Sheet | Retained earnings were computed apart from the sheet (every currency, voided reversals included) and, whenever the sheet did not balance, replaced by whatever made it balance: an imbalance could never show | HIGH | Earnings from the same journal lines as the rest of the sheet (same currency, dates, voided-pair rule); a difference is reported, never absorbed. Today's sheet balances without it |
| CN-01 | Consolidated statements | Accumulated depreciation was added to assets; "Long-Term Liability" accounts were left out (matched as "Long-term Liability"); "Income" accounts took the expense sign; income-statement accounts never reached equity, so the consolidated sheet never balanced (equity USD 456,057.50 against the Balance Sheet's −94,806.97) | HIGH | Contra assets reduce their section, long-term liabilities included, income credit-normal, earnings rolled into equity: the consolidation now equals the Balance Sheet for the single entity and balances |
| CN-02 | Group Consolidation page | "Import trial balances", "Run matching" and "Generate consolidation" did nothing; the workflow steps and statuses were fixtures | MEDIUM | Rebuilt: entities (balance sheet at the date, year-to-date results, balance check), eliminations, consolidated totals, the consolidated balance sheet by account with the source currency and rate of each translated amount |
| CN-03 | Data (dev) | A fund distribution (DIST-…) debited 4100 Dividend Income USD 400,000, so revenue this year is negative | HIGH | Open (phase 5: portfolio distributions) |

## Command Centre (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| OV-01 | Command Centre | Revenue showed "USD 400,000 CR" when the year's revenue is a net debit of USD 390,750; payables "USD 1,004,380 · 377 open bills" counted draft and rejected procurement invoices; the budget chart was empty; "VAT reconciliation exception", "5 instruments scheduled at 23:59" and the close steps were fixtures; the page computed its figures from the screen's own copies of up to 1,000 journals | HIGH | Rebuilt on `GET /accounting/overview`: cash per currency and bank (ledger), receivables and payables (control accounts, with open documents), revenue and net income for the year against last year and by month (the same journals as the statements), what is waiting with a way to it, the month being closed, the last integrity check, the latest postings |
| OV-02 | Data (dev) | Invoice INV_20260820_0001 stayed DRAFT while its USD 7,800 journal was posted (the AQ-02 case) | MEDIUM | Marked SENT (A9) |

## CEO View and Document Vault (phase 3)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| CE-01 | CEO View | A USD 550,864 loss was shown as "Operating profit USD 557,334 CR" with a 139.8% margin; an overdrawn bank counted as liquidity; the board-budget chart, risk cockpit and "Board pack" were fixtures | HIGH | Rebuilt on the Command Centre figures: liquidity (bank per currency plus investments at carrying value), profit or loss for the year against last year, owed each way, entity contribution, results by month, what is waiting on a decision |
| VA-01 | Document Vault | Any file type up to 50 MB could be uploaded (executables included); uploads were not in the audit trail; "Create document", versions, approval and retention were fixtures | MEDIUM | Documents only (PDF, Office, spreadsheets, images, text, archives); each upload audited (area Document vault); the page lists, searches, opens and uploads by category |

## Statements and multi-currency (phase 5)

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| RP-04 | Income Statement | Sections were chosen by account number: every 41xx account (Dividend, Interest, Realised Gains, Other Investment Income — the firm's main income) was treated as "returns" and sign-flipped, and "Income"-type accounts were given no amount, so the statement showed revenue USD 409,250 and a USD 249,136 profit where the ledger holds revenue −USD 390,750 and a USD 550,864 loss; 5500 Corporate Tax Expense sat in operating expenses | CRITICAL | Sections by account type (revenue and income credit-normal; tax expense in its own section); the statement now equals the balance sheet's earnings. The older dashboard service had the same 41xx flip, also fixed |
| RP-05 | General ledger | An account's opening balance counted draft journals (and voided pairs), so the running balance did not follow on from the ledger | HIGH | Posted journals only, the same rule as the period's lines |
| RP-06 | Reports with no currency | Took "the first active currency" (not the base) and added other currencies' amounts in unconverted | HIGH | No currency means the base currency, every currency at its locked rate (FX-01) |
| J-08 | Scheduled jobs | Foreign-currency balances were never revalued at month end | MEDIUM | Job `fx.revaluation` prepares the month-end revaluation draft and tells approvers |
| FX-06 | Month-end revaluation (found by the regression) | After a revaluation for a date was voided, preparing a new one for that date failed (its journal reference was already taken) | MEDIUM | The next one takes the next reference (FXREV-date-2 …); one standing revaluation per date |
| RB-01 | Live pages | A page whose first load was cut off in transit (the first page after signing in, a rebuild) showed "could not be loaded" until reloaded | LOW | Tried once more before showing an error |
| DB-01 | Database connections (local) | Under a burst of new connections (the first page after signing in) the local database occasionally refused one ("Can't reach database server", 45 times in the server log), failing that request | MEDIUM | A refused connection means the query never ran: it is tried once more after a short pause, for every query |
| NV-01 | Deep links to live-only pages | Opening Payment Runs or Scheduled Jobs by its address landed on the Command Centre: the runtime reports a navigation while it is still starting, before those pages exist | MEDIUM | The host ignores what the runtime reports until it has started, then opens the requested page |
| AP-02 | Payment runs (found by the regression) | A bill whose three-way match had an open exception (no goods receipt) was offered for a run and approved, then refused when the run was settled | MEDIUM | The run checks the match as the payment step does: such a bill is listed with the reason and cannot be included |
| JB-01 | Scheduled Jobs page (found by the regression) | "Run now" and "Switch off" were shown to readers (accountants, auditors); the server refused them | LOW | Shown only to people who may post to the ledger |
| RB-02 | Recurring Schedules page | Showed the old demo page again: a later part of the runtime re-installs its own page 600 ms after load | HIGH | Live pages cannot be replaced once registered |

## Full operational audit (28 Sept 2026)

Live browser and data verification of every page and the correctness checks in design-refs/audit-accounting-correctness.md-style script (`nvccz/scripts/audit-accounting-correctness.mjs`), against the running local servers, not a code read. Two real defects found and fixed; everything else held up.

| ID | Where | Defect | Sev | Fix |
|---|---|---|---|---|
| OA-01 | Voiding a journal (`JournalEntryService.voidJournalEntry`) | Its auto-generated reversal was posted with no balance check. 13 old, already-broken payroll test journals had been voided (correctly) as dev debris, but their auto-reversals were themselves unbalanced and left POSTED — doubling, not fixing, the ledger's imbalance (a live $322,209.92 trial-balance break, found by direct verification, not by trusting the module's own "Ledger integrity: Passed" status). Compounding this: the Audit Trail's "Verify integrity" check and the nightly `ledger.integrity` job both explicitly excluded `VR-`/`REV-` journals from their balance check, so the one tool meant to catch this never could | CRITICAL | `voidJournalEntry` now refuses to auto-post an unbalanced reversal (mirroring a broken journal doesn't fix it) and builds the reversal inside one transaction; both integrity checks now verify every posted journal's own balance, VR-/REV- included, while still excluding void/reversal pairs from the reports' trial balance (a different, correct concern). The 13 broken reversals voided (A12). Trial balance now ties to $0.00 exactly, live-verified |
| OA-02 | Group Consolidation / CEO View entity figures (`ConsolidatedReportService.generateConsolidatedIncomeStatement`) | An account typed "Expense" whose name also matched the tax check (e.g. "Corporate Tax Expense") landed in both the operating-expense and the tax sections of the income statement, so its amount was subtracted twice. Net income for the one entity read $552,466.49 loss where the Command Centre, CEO KPI, standalone Income Statement and Balance Sheet all agreed on $551,466.49 — found by comparing two figures for the same period on the same screen, not by trusting either | CRITICAL | Categorisation made mutually exclusive (tax classified before expense, expense excludes anything already tax); the entity's net income now matches the Command Centre's for the same period, live-verified in the browser. New suite `acct-consolidation.mjs` (4/4) guards against a recurrence |
| OA-06 | `GET /accounting/me` | Found while re-testing the OA-05 fix with a genuinely narrow role: someone holding only `accounting.timesheets.view` (no general accounting key) got 403 from `/accounting/me` itself, so the fixed nav could never learn they held that key — Timesheets stayed hidden from a person the SRD explicitly means to have it. The endpoint's whole purpose is disclosing which keys the caller holds, so gating it behind holding one first defeated it for anyone whose only key was a narrow one | HIGH | `/accounting/me` (and `/me/counts`) exempted from the general Accounting access guard, with its own portal-user check kept directly on the router; every other route is unaffected. Verified live: the timesheets-only employee now sees Timesheets → Projects in the sidebar and nothing else; full submit → return → resubmit → approve cycle exercised live and confirmed in the database |
| OA-05 | Sidebar / direct navigation, every page | The vendored runtime's own nav-permission check filtered by a demo "role simulator" (`state.role`, read from browser localStorage, defaulting to a permissive persona) that was never wired to the signed-in user's real permissions — so every real user, including one with no Accounting access at all, saw and could open every page in the sidebar, landing on a page that only then said "you do not have access to this" once its data load failed. Pages the live layer added later (CEO, Timesheets, Payment Runs, Scheduled Jobs, Employee Claims, Trial Balance, Recurring) had no entry in that map at all, so they were shown to literally everyone regardless of role — a second copy of the same gap. Found by the user directly: a screenshot of an employee's Journal Entries page showing full filter/tab chrome above a "you do not have access" notice, asking how they reached a page they cannot use | CRITICAL | The live layer now computes real per-page view access from `/accounting/me`'s permission keys (mirroring the server's own read rules) and replaces the runtime's `permittedPage` check with it; the sidebar, direct navigation and command-palette search all use the one function, so a page nobody's role can view is neither listed nor reachable — the person is taken to the first page they can actually use. Verified live: an employee outside finance now sees only Employee Claims in the sidebar and is redirected there from any other URL; CFO, Accountant and Internal Auditor keep full access, unaffected |
| OA-04 | Fixed Assets, dispose dialog | The "Written off" disposal reason sent `disposalMethod: "WRITE_OFF"`; the server accepts only SALE, SCRAP, DONATION or TRADE_IN, so every write-off was refused with "Invalid disposalMethod" — found by actually clicking Dispose in the browser and submitting it, not by reading the code or trusting the API-only test suite (which never exercised this option since it always sent SALE). The dialog also never offered TRADE_IN, the fourth value the server does accept | HIGH | The option now sends `SCRAP` (a write-off has no proceeds and nothing changes hands, which SCRAP already models), labelled "Scrapped / written off"; added "Traded in" (`TRADE_IN`) as its own option. Verified live: create an asset funded from a posted bill, then dispose it as scrapped — both succeed |
| OA-03 | Not a defect (verified) | A "Compile failed" VAT tax-return pack, a failed daily FX-rate job, and job-run counts that looked high on Integrations, all investigated individually | — | Correct behaviour: a real PENDING journal legitimately blocks compilation (TX-04 working as designed); the FX-rate job fails because this dev machine has no route to the external rate source (`zimrate.com` — `ENOTFOUND`) and correctly reports the failure and falls back rather than hiding it; the "failures" counts on Integrations are procurement/performance postings rejected during months of intentional negative-path UAT testing, not live errors |
