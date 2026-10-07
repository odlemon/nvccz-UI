# Accounting — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). Current module is `accounting-v52` (path `/accounting`, legacy
`accounting`/`accounting-v2` frozen), 22 screens. Found a substantial prior audit already merged into `dev`
(`.claude/worktrees/accounting-v52-audit`, 0 commits ahead — fully merged) that built a real Income
Statement/Balance Sheet/Cash Flow engine, wired the Approval Centre, FX Revaluation and Period Close to live
data. This module is clearly mature and extensively real — not treated as a fresh build.

## Screens covered this pass

Command Centre, Financial Reports. Given the module's size (22 screens) and that this was the last of nine
modules in a long sweep, prioritized the highest-value screens (the dashboard and the statement engine) over
exhaustive coverage.

## FINDING-ACC-001 — Income Statement shows a $2M loss instead of a $2.4M profit — sign inversion on 4100 Dividend Income, same root cause already referred in the LP Portal re-sweep

**Severity:** Critical (a materially wrong profit/loss figure on a signed, board-facing financial statement).
**Status: confirmed, not fixed — same already-escalated root cause, needs the same chart-of-accounts
sign-off already requested.**

`/accounting/reports`' Income Statement for Jul 2026 shows:
- `4100 · Dividend Income: -$2,000,000.00` (negative)
- Total revenue: **-$1,599,750.59**
- Profit before tax: **-$1,618,524.59** (a loss)
- "101.2% margin" — a nonsensical figure produced by dividing two negative numbers

The Command Centre dashboard, covering the same period, shows the same underlying figure correctly:
**"Revenue and investment income: $2,000,000.00 CR"** (positive, credit-normal, as a real dividend/income
posting should read). If `4100 Dividend Income` were correctly signed positive on the Income Statement,
total revenue would be `249.41 + 400,000.00 + 2,000,000.00 = $2,400,249.41` and profit before tax would be
a real **~$2.38M profit**, not a $1.6M loss.

This is not a new, isolated Accounting-module bug — it's the same issue already found, root-caused and
explicitly referred (not fixed, pending chart-of-accounts sign-off) during this sweep's earlier LP Portal
re-sweep pass: **"every distribution debits `4100 Dividend Income` regardless of actual source."** A debit
to a credit-normal revenue account is exactly what would flip its displayed balance negative — this
Income Statement is the downstream, board-visible manifestation of that same posting-side issue, not a
separate display bug in Financial Reports' own code. Consistent with that earlier finding, **not attempting
a fix here either** — the two GL/posting-treatment issues already flagged in the LP Portal findings doc
(distributions always hitting `4100 Dividend Income`, and `RETURN_OF_CAPITAL`/`INCOME` distribution types
being rejected by the backend's `ALLOWED_SOURCES` despite the LP portal offering them as valid options) are
the real root cause and need the same sign-off before any code changes, in either module.

**Escalating this specific finding for visibility**, since its impact is more severe than it looked from the
LP Portal side alone: this isn't just an internal ledger quirk, it's currently producing a **signed,
distributable financial statement (Income Statement, version 9, with Prepared/Reviewed/Approved signature
lines) that shows the fund at a loss when it's actually profitable** — worth prioritizing the underlying
chart-of-accounts decision given a real reporting cycle could ship this externally.

## Also observed, not independently investigated further

- **Period Close integrity** step 3 ("Trial balance: Exception") and the Command Centre's "Control and
  approval queue" (VAT reconciliation exception, 4 unmatched bank statement lines, 1 pending journal
  approval) all look like genuine, real exception states reflecting actual data conditions — not fabricated
  placeholders. Not chased further given time; worth checking whether any of these particular exceptions are
  themselves symptoms of the same 4100-posting issue (e.g., if VAT or trial-balance checks are thrown off by
  the same sign inversion) in a follow-up pass.
- Transient full-page blank render with ~100 console 404s on the very first navigation to `/accounting` this
  session, which did not reproduce on two subsequent reloads — not investigated further as a one-off, but
  worth a note in case it recurs for someone else.

## Not exercised

20 of the module's 22 screens (Approval Queue, Period Close, General Ledger, Journal Entries, Cash &
Liquidity, Bank Reconciliation, Payables & Payments, Receivables, Expenses & Claims, Inventory Accounting,
Fixed Assets, Short-Term Investments, Compliance & Tax, FX Revaluation, Group Consolidation, Chart of
Accounts, Document Vault, Audit Trail, Access Control, Integrations) were not opened this pass, given this
was the last module in a nine-module sweep and time constraints. Given the confirmed depth of prior real
engineering work here (a full statement engine, live approval/FX/period-close wiring), a dedicated follow-up
sweep is warranted rather than treating this as complete coverage.
