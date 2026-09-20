# Payroll — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). Current module is `payroll-v6` (path `/payroll`, legacy
`payroll` module frozen at `/payroll-legacy`) — a "-mock" vendored-runtime port with real live-loaders
(`lib/payroll-v6/live-loaders.ts`) and an existing, actively-used runtime patch script
(`scripts/patch-payroll-runtime.mjs`, already covering ~15 prior live-data/permission fixes before this
pass).

## A substantial prior sweep exists, unmerged and superseded — noted, not resurrected

Found a local-only branch `feature/payroll-v6-live` (worktree at `nvccz-new-payroll-wt`, never pushed to
GitHub) with 24 payroll-specific commits doing real work: live employee CRUD, real audit trail, real vendor
registry, real payslip downloads, retiring fabricated KPIs. Checked whether to cherry-pick it in, the same
way the Fundraising KYC fix was rescued earlier in this sweep — but `git diff origin/dev
feature/payroll-v6-live` showed **456 files changed, 51,026 lines deleted**, including Performance's and
Procurement's entire runtime patch scripts, because the branch predates almost all of this engagement's
later work. Attempted a scoped cherry-pick of just the payroll commit range
(`fc8c150^..586e15f`) onto fresh `dev`; it conflicted immediately on
`scripts/patch-payroll-runtime.mjs`/`matanho-payroll-runtime.js` themselves, because dev's current patch
script is a materially more evolved, still-actively-maintained version (confirmed: live-tested the Command
Centre and Employees screens below against a module that is *already* substantially real-data-wired, not
the "no backend" state that old branch's early commits describe). Concluded the old branch's work is
superseded by whatever produced dev's current, more mature state, rather than a gap to fill in — did not
force the merge. Flagging its existence and location for whoever owns this module next, in case anything in
those 24 commits (e.g. specific payslip-download or audit-trail details) is genuinely still missing and
worth a closer diff.

## Screens covered

- **Command Centre** (`/payroll`) — see findings below. Otherwise a real, correctly-wired dashboard: KPI
  cards, readiness score, department cost chart, recent runs, exceptions, activity timeline all render with
  honest data (all zero, since this environment has no employees seeded — not fabricated non-zero numbers).
- **Employees** (`/payroll/employees`) — genuinely empty (0 employees on this dev environment), correct
  honest empty state, no defects found. Most other screens (Runs, Approvals, Leave, Vault) couldn't be
  meaningfully exercised further without seeded employee/pay data — noted as a coverage limit, not a defect.
- **Tax & Statutory** (`/payroll/tax`) — real, correctly computed data: 8 statutory levy rows (4 rulesets ×
  USD/ZIG), 6 PAYE brackets, matching the KPI counts exactly. No defects found.

## FINDING-PR-001 — Trend chart showed "NaN%" movement — fixed

**Severity:** Medium (a raw "NaN%" is a jarring, unprofessional-looking display bug on the main dashboard).
**Status: fixed, via `scripts/patch-payroll-runtime.mjs` — never hand-edited the vendored runtime directly.**

Command Centre's "Payroll movement trend" chart showed `12M movement: NaN%`. Root cause:
`trendSummaryV3()`'s `change` calculation is `((last[1]-first[1])/first[1])*100` with no guard — this
environment's gross payroll is genuinely `USD 0.00` for every month (no payroll processed yet), so
`first[1]` is `0` and the division produces `NaN`, which `.toFixed(1)` renders as the literal string "NaN".
Fixed by treating a zero baseline as "no movement to report" (0%) rather than propagating the NaN.

## FINDING-PR-002 — Statutory deadlines showed a stale, misleadingly-safe countdown — fixed (partially; the dates themselves are still fixture data)

**Severity:** High for a compliance-calendar feature — showing "12 days remaining" against a
regulatory deadline that already passed 2+ months ago is actively worse than showing nothing.
**Status: countdown logic fixed via the patch script; the underlying deadline dates remain a known gap, not fixed.**

"Upcoming statutory deadlines" hardcoded all four rows' countdowns as literal strings
(`['PAYE return and payment','10 Jul 2026','12 days']`, etc.) baked into the vendored runtime at design
time. Live on dev (today: 2026-09-20), every deadline still read "12 days remaining" / "17 days remaining"
against dates in July — over two months in the past. Fixed the countdown to compute real days-remaining (or
"N days overdue") from the actual date at render time, via the same patch script. **Not fixed: the deadline
dates themselves (10/15 Jul 2026) are still hardcoded fixture data, not a real recurring compliance
calendar** — there is no backend source for "when is the next PAYE/NSSA/AIDS/NEC filing due" (checked
`lib/payroll-v6/live-loaders.ts` — no calendar/deadline export exists). Building a real statutory filing
calendar (recurring monthly dates per Zimbabwe tax authority rules) is out of scope for this pass; flagging
as a backend-ask rather than guessing at real due dates.

## Coverage note

Given this dev environment has zero seeded employees, most write-heavy Payroll screens (Runs, Approvals,
Leave & Benefits, Document Vault, Reports, Settings) could not be meaningfully exercised beyond confirming
they load without errors. A follow-up pass with seeded employee/pay-period data would be needed to test the
actual payroll-run lifecycle, approvals, and payslip generation end to end.
