# Accounting: who may do what

How access to Accounting is decided, as built. The server decides every request (the Accounting access guard,
`nvccz/src/middleware/accountingAccessGuard.ts`, rules in `nvccz/src/config/accountingAccess.ts`); pages only offer what
`GET /api/accounting/me` says the user holds. The live review of who holds what is the Access Control page
(`GET /api/accounting/access`).

## Permissions

| Key | Name on screen | Allows |
|---|---|---|
| `view_accounting` | View accounting | Read the accounting pages and records |
| `manage_accounting` | Prepare | Prepare journals, invoices, expenses, assets, accounts, schedules, stock movements, tax packs, revaluations; upload to the vault |
| `view_ledger` | View ledger | Read the general ledger |
| `manage_ledger` | Post / approve | Post others' journals; void; send credit notes; switch on recurring journals; set up and change bank accounts; book stock count differences; run scheduled jobs |
| `view_financial_reports` | Financial reports | Run the statements, VAT return, consolidation |
| `bank_reconciliation` | Bank reconciliation | Import statements, match, finish and reopen reconciliations |
| `accounting.period_lock.view` | View periods | See period locks |
| `accounting.period_lock.manage` | Lock periods | Lock and unlock periods |
| `accounting.period_lock.override` | Period override | Post into a locked period; lock with close tasks open |
| `accounting.period_lock.audit_view` | Period audit | Read the period-lock log |
| `accounting.treasury.manage` | Book investments | Book, roll over and settle short-term investments |
| `accounting.treasury.approve` | Approve investments | Approve interest and settlements; void investments; investment settings |
| `accounting.timesheets.view` | View timesheets | Book own time; read projects |
| `accounting.timesheets.manage` | Approve timesheets | Approve or return the team's weeks; manage projects; approve or return the team's expense claims (line manager step) |
| `accounting.access.manage` | Manage access | Review accounting access |

The CFO holds the standing CFO grants (`CFO_MODULE_PERMISSIONS`) in addition to the role's own; everyone else holds what
their role grants. Portal accounts (LP, investee, applicant) are refused all of Accounting.

## Default roles (dev, 2026-09-28)

| Role | Holds |
|---|---|
| admin, System Administrator | Everything |
| Chief Financial Officer | Everything except Manage access |
| Finance Manager | View, Prepare, View ledger, Post / approve, Reports, Bank reconciliation, View / Lock periods, Period audit, Book and Approve investments, timesheets |
| Accountant, Finance Officer | View, Prepare, View ledger, Reports, Bank reconciliation, View periods, Book investments, View timesheets |
| Finance Assistant | View, Prepare, View ledger, View timesheets |
| Internal Auditor | View, View ledger, Reports, View periods, Period audit, View timesheets |
| External Auditor | View, View ledger, Reports, View periods, Period audit |
| CEO | View, Reports, timesheets (view and approve) |
| Payroll Manager | View, View ledger, timesheets (view and approve) |
| Procurement, operations and other staff | Timesheets only (their own; managers approve their team) |

Roles are changed in Admin; this table is what the Access Control page showed on the date above.

## Controls that hold whatever the role

- **Maker-checker (D14):** nobody posts a journal they prepared — the CFO and administrators included. Flows that raise
  and complete their own journal (sending an invoice, a stock movement, a scheduled accrual) are posted by the flow.
- **Approvals:** nobody approves their own request, timesheet, recurring schedule, tax pack or chart-of-accounts change.
  A chart-of-accounts change by anyone but the CFO or an administrator waits for CFO approval.
- **Tax packs:** signed off by the CFO (or a checker role), never by the preparer.
- **Periods:** a locked period refuses postings unless the user holds Period override; a period with open close tasks
  is locked only with the override.
- **Reconciled bank lines:** cannot be changed or voided until the reconciliation is reopened (latest only, by an
  approver, with a reason).
- **Bank accounts:** currency and ledger account fixed once entries exist; switched off only when empty and reconciled.
- **Accounts:** switched off only with no balance, no draft, no active bank or sub-account; deleted only if never used.
- **Stock:** journals move with their stock and are corrected by another movement; count differences by approvers.

## Combined duties

People holding both halves of a control are listed on Access Control (Combined duties): prepare and post journals, book
and approve investments, reconcile the bank and void cash entries, lock periods and override locks. Holding both is
allowed — the controls above still stop anyone completing their own item — and is for periodic review.

## Checked by

`scripts/_uat/acct-ui-roles.mjs` (pages × roles for investments, journals, close, reconciliation, cash, assets,
receivables, FX), `scripts/_uat/acct-ui-pages.mjs` (the other sixteen pages × CFO, Accountant, Internal Auditor, and
refused to someone outside finance), and the API suites per area.
