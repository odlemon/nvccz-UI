# Payroll V6 — live functional sweep findings (28 Sept 2026)

Full role × page browser-driven audit, following the same methodology as
`design-refs/accounting-sweep/FINDINGS.md`: every finding below was reproduced with
real clicks against the running dev server (`localhost:3120`) and the dev database,
not found by reading code. Numbered `PF-xx` (Payroll Finding) to avoid colliding with
the accounting sweep's `OA-xx` numbering.

## PF-01 — Suspend/Reinstate/Terminate employee had no button anywhere (High)

`suspend-employee`, `reinstate-employee` and `terminate-employee` were fully wired
end to end — real routes (`POST /payroll/employees/:id/{suspend,reinstate,terminate}`),
real controller/service logic, permission-checked
(`payroll.employees.manage`), on the frontend's `API_ACTIONS` allowlist
(`components/payroll-v6-mock/payroll-v6-app.tsx`) and the `lib/payroll-v6/actions.ts`
case handlers — but no control anywhere in the vendored runtime ever emitted one of
these three `data-action` ids. Grepped the whole compiled
`matanho-payroll-runtime.js`: zero matches. Confirmed live by opening every
employee's drawer as `perf.sysadmin@nts.local` and finding only `edit-employee`
next to it, for every employee, regardless of status.

**Fix:** `scripts/patch-payroll-runtime.mjs`, patch block "4a17b" — adds the three
buttons to both drawer-render call sites, gated on the employee's status
(`Terminated` → none, `Suspended` → Reinstate only, otherwise → Suspend + Terminate),
mirroring the status badge the drawer already shows.

## PF-02 — Suspending an employee made them vanish from the roster with no way back (High, found while fixing PF-01)

Once PF-01's buttons existed, testing Suspend on a real employee (Tatenda Gumbo,
EMP-0012) revealed the backend's `GET /payroll/employees` hard-filtered
`where: { isActive: true, terminated: false }` — so a suspended employee
(`isActive: false`, `terminated: false`) disappeared from the Employee Directory
entirely. Total employee count dropped from 12 to 11, and there was no filter,
toggle, or other page anywhere in Payroll to see a suspended employee again — the
Reinstate button that PF-01 just added was permanently unreachable for anyone it
was suspended. This contradicted the frontend's own
`deriveExceptions()` logic (`lib/payroll-v6/live-loaders.ts`), which already
assumed a suspended employee stays "on the active roster" and flags them as a
High-severity exception.

**Fix:** `src/controllers/PayrollController.ts` `getEmployees` — changed the
`where` clause from `{ isActive: true, terminated: false }` to just
`{ terminated: false }`. `terminated` is the state that actually leaves the roster;
`isActive: false` alone (suspended) does not. Verified: employee count returned to
12, the suspended employee reappears with `status: "Suspended"`, and Reinstate is
reachable again.

## PF-03 — Confirm-on-destructive-action must live in the app's action dispatcher, not the button (High, found testing PF-01's own confirm)

First implementation of PF-01 put `onclick="if(!confirm(...))return false"` directly
on the Suspend/Terminate buttons. Live testing (real clicks, not code reading)
uncovered two successive bugs in that approach:

1. The confirm message referenced `${e.name}` — but an inline `onclick=""` HTML
   attribute compiles to a handler evaluated in the global/element scope, not the
   JS closure the surrounding template literal was built in. Clicking threw
   `ReferenceError: e is not defined` *before* `confirm()` ever ran, so the action
   proceeded immediately with no confirmation at all (verified: DB showed the
   employee suspended after one real click).
2. After making the message a static string (no interpolation), the handler ran
   and correctly called `confirm()`, but a Cancel still didn't stop anything: this
   runtime's own document-level `[data-action]` → `matanho:before-action` bridge
   (`matanho-payroll-runtime.js`, ~line 1102) is registered in the **capture**
   phase. For any action the React host claims with `event.preventDefault()`
   (which it does for every `API_ACTIONS`-listed id, including these three), that
   capture listener calls `event.stopImmediatePropagation()` on the original click
   — which runs *before* the event ever reaches the button's own listeners,
   inline `onclick` included. So the confirm dialog and the live API call are on
   two completely independent paths; the button-level confirm can never gate the
   dispatcher's own action.

**Fix:** moved the confirm entirely into the one place that actually decides
whether the action runs — `payroll-v6-app.tsx`'s `onBeforeAction` handler, right
after it claims the action with `preventDefault()` and before calling
`handlePayrollV6Action`. This is the same "one dispatcher, not per-button"
principle CLAUDE.md already documents for busy/loading state. Verified live, both
directions: overriding `window.confirm` to return `false` leaves the employee's DB
row untouched; returning `true` suspends/reinstates as expected. A real trusted
click (native dialog, no override) also correctly leaves the record untouched in
this sandboxed browser, which auto-dismisses unhandled JS dialogs.

## Migration log addition

No schema migration required for PF-01/PF-02/PF-03 — PF-02 is a query-filter
change only (`where` clause), not a schema change. No `prisma migrate`/`db push`
run.

## Files changed

- `scripts/patch-payroll-runtime.mjs` (nvccz-new) — new patch block, no onclick
- `components/payroll-v6-mock/matanho-payroll-runtime.js` (nvccz-new, compiled, via patch script)
- `components/payroll-v6-mock/payroll-v6-app.tsx` (nvccz-new) — confirm gate in dispatcher
- `src/controllers/PayrollController.ts` (nvccz) — `getEmployees` where clause

## PF-04 — Terminate left `lifecycleStatus` stale at "ACTIVE" (Low, found verifying terminate-employee)

Verified `terminate-employee` live using a disposable test record created via the
`complete-onboarding` flow (`UatTest Disposable`, EMP-TEST01) rather than touching a
real seeded employee. Terminate correctly set `terminated: true`, `terminatedAt`,
`isActive: false` — but left `lifecycleStatus` at whatever it was ("ACTIVE"), unlike
Suspend, which does set it to `"SUSPENDED"` (`PayrollExtendedController.ts`). No
current query is affected: every place that filters on `lifecycleStatus` also
checks `isActive`/`terminated` in the same `where`, so this didn't produce a wrong
result anywhere today — but it is simply incorrect data on a field other code may
one day rely on alone.

**Fix:** `src/services/EmployeeTerminationService.ts` now also sets
`lifecycleStatus: "TERMINATED"` (a free-text `VarChar` column, not an enum, so no
migration needed). Backfilled the one stale row this session created
(EMP-TEST01) directly; no other terminated employee existed in the dev DB.

## Live-verified LIVE actions (this session, real clicks)

In addition to `suspend-employee` / `reinstate-employee` / `terminate-employee`
above:

- `save-employee` — edited Tatenda Gumbo's Next of kin field via the real form;
  confirmed persisted (`nextOfKin` updated in DB).
- `complete-onboarding` — created a real employee (UatTest Disposable, EMP-TEST01)
  through the full New Employee form; correctly rejected the submission once
  (missing employee number) before succeeding, confirmed in DB.

`create-run`, `continue-run`, `commit-inputs`, `approve-payroll`,
`release-payroll`, `download-close-pack` are already covered by the backend
`e2e-payroll-v6-lifecycle.ts` suite (25/25, rerun clean this session). Still to
verify with real UI clicks: `reject-payroll`, `save-paygroup`, `download-payslip`,
`preview-payslip` — plus the remaining four roles, and filters/pagination across
all 20 pages.

## PF-05 — Run drawer's "Control status" and "Calculation evidence" were hardcoded, identical for every run (Medium-High)

Found opening the September 2026 draft run's drawer: the Payroll Runs page's own
KPI card said "Open exceptions: 0", but the SAME run's drawer, one click away,
said "Exceptions: 3 critical remain open". Traced to `runDrawer(id)` in the
compiled runtime: the "Control status" checklist (`Employee population`,
`Input batch`, `Calculation version`, `Exceptions`, `Maker-checker`,
`Release authority`) and the "Calculation evidence" callout
("Ruleset ZW-2026.06 / Calculation hash 74f2a90c...e81c") were a single hardcoded
array and string, identical regardless of which run `id` was opened — never
reading `r` (the actual run object) at all. This is the exact "hardcoded values
masquerading as live data" pattern CLAUDE.md flags as previously found in other
modules.

**Fix (`scripts/patch-payroll-runtime.mjs`, patch "4a17c"):** rebuilt the
checklist from fields the run object genuinely carries — `employees` (also
fixed by PF-06 below), `approvalStatus`, `stage`, `rawStatus` — and dropped the
two rows with no real backing data (`Input batch` row-count and
`Calculation version`) rather than inventing different fake numbers for them.
Replaced the fabricated ruleset/hash callout with an honest per-run summary
(period, real gross pay, real employee count). Verified live: the September
draft now correctly shows all-`Pending`/`Review` with 0 employees; a released
run (August 2026) correctly shows all-`Complete` with 12 employees, matching its
own real figures — the two runs are now visibly different, which they never
were before.

## PF-06 — Run register always showed "Employees: null" (Medium)

Every row in the Payroll Runs register showed the literal text "null" in the
Employees column, for every run including fully released ones with 12 real
employees. `adaptRuns()` computed `employeeCount` only from
`Array.isArray(r.employeePayrolls)` — but the runs LIST endpoint
(`GET /payroll/payroll-runs`, what the register actually calls) never hydrates
that relation; it sends a Prisma `_count: { employeePayrolls, payslips }`
instead. Only the single-run detail endpoint carries the real array, so the
register's count fell through to `null` on every row.

**Fix:** `lib/payroll-v6/live-loaders.ts` `adaptRuns()` — falls back to
`r._count?.employeePayrolls` when the array isn't present. Verified live: the
register now reads 12/12/0/12/12/12 across the six runs, matching the real
`_count` values, instead of "null" on every row.

## PF-07 — Variance column rendered the literal text "null%" (Low)

`adaptRuns()` correctly leaves `variance` as `null` when there's no prior period
to diff against (the first run chronologically, or a gap in the monthly
sequence) — a deliberate, honest "not computable" rather than a fabricated
number. But the runtime's display (`${r.variance>0?'+':''}${r.variance}%`)
printed the literal string "null%" for June 2026 and October 2026 in the
register, and would do the same in the run drawer. Fixed (patch "4a17d") to
render "—" when variance is `null`. Verified live in the register.

## PF-08 — Run actions target "the newest run by start date", not the run in view (Medium, design weakness)

`payroll-v6-app.tsx` passes `currentRunId = live.payrollRuns[0].id` (runs are sorted
newest-first by `startDate`) to every run-scoped action — `continue-run`,
`approve-payroll`, `reject-payroll`, `commit-inputs`, `release-payroll`. Found live:
with a 2026-11 draft created through the UI, clicking Command Centre → "Continue
payroll run" answered "Only DRAFT payroll runs can be submitted for approval",
because the action had targeted the newest-dated run, the E2E suite's leftover
2030-02 released run, not the draft. In production the newest-dated run is
normally the one being worked on so it mostly works, but as soon as two runs are
open at once (or any future-dated run exists) the wrong one is acted on, silently.
**Not fixed** — the right fix is for run-scoped actions to read the run id from
the drawer/row that emitted them (`data-run` / `data-record-id`), which touches
several runtime buttons; logged here as a backend-ask/UI follow-up rather than
patched blind. The E2E suite's permanent 2030-xx runs also pollute the dashboard
("Last release 2030-02").

## reject-payroll — backend verified, UI click blocked by PF-08

Verified against the API with real users: maker submits → checker (`perf.exec`)
rejects a non-pending run correctly (400 "not pending approval"); after rejection
the run returns to `DRAFT` with `approvalStatus: REJECTED` and can be resubmitted.
Could not click through the UI reject button because of PF-08 above.

## Maker-checker self-approval (by design, noted for the owner)

`sysadmin` (holds both `payroll.runs.manage` and `payroll.runs.approve`) approved a
run it had itself submitted. This is the intentional, narrowly-scoped
`canBypassMakerCheckerSegregation` rule (only a role holding BOTH sides may
self-approve; a checker-only role such as CEO may not) — not a defect, but worth
the owner knowing for a production tenant.

## PF-09 — Activity timeline dots/rail sat on the card border, text clipped at the edge (Low, reported with a screenshot)

The Command Centre "Activity timeline" (and the five other `.card-body.timeline`
cards, e.g. the employee audit history) had the coloured dots and the vertical
rail straddling the card's left border, with the text touching the edge and no
top/right inset. Cause: `.timeline{padding-left:20px}` overrode the
`.card-body` padding shorthand, and the dots are positioned at `left:-17px`.
**Fix:** `payroll-v6-overrides.css` — `.card-body.timeline` now inset with margin
(rail and dots are positioned relative to the timeline box so they move with
it) plus `min-width:0; overflow-wrap:anywhere` on the text column. Verified at
420px and desktop widths.

## Role sweep (real browser loads, all 20 pages × exec / hr / deptmgr / employee)

80 page loads via `scripts/payroll-page-dump.mjs --base=http://localhost:3120`, plus
sysadmin's 20 earlier: no payroll API failures, no script errors. The only failed
requests were `net::ERR_ABORTED` on `/homepage/notifications` (the shared topbar
poll cancelled by navigation), unrelated to Payroll. Pages correctly differ by
role (HR sees no run pages' figures, employee sees only overview and My Pay).

## NOT verified this session (be aware)

- Filters and pagination on the 20 pages (only the Employees department/readiness
  filter controls were seen, not exercised).
- `save-paygroup`, `download-payslip`, `preview-payslip`, and the UI click of
  `reject-payroll` (blocked by PF-08; backend verified).
- Write actions as roles other than sysadmin (permission refusals are covered by
  the e2e suite: 25/25).

## Follow-up fixes (same day, second pass)

**PF-08 fixed.** Each run action now targets the newest run in the state that action
works on (`continue-run` → draft, `approve/reject-payroll` → pending approval,
`commit-inputs` → approved) instead of `runs[0]` (`payroll-v6-app.tsx`). Verified
live: with the 2030 E2E runs on record, Command Centre → Continue payroll run
submitted the December draft, not the 2030 run. Clicking a run action before the
data has loaded now says "Payroll data is still loading" instead of "No payroll run
selected".

**PF-10 — Employee photos were hardcoded (Medium).** The runtime embedded seven
stock portraits and drew EMP-0007's for every employee it had none for, plus the
same portrait captioned "Tariro Moyo" as the top-bar avatar. Now: the employee's own
uploaded photo (`Employee.pictureUrl`, re-rooted on the API the app talks to) or
their initials; a photo that fails to load falls back to initials in place; the
embedded portraits are removed from the bundle. Users upload from **Edit employee**
and **Add employee** (`Profile photo` file input; PNG/JPEG/WebP, 10 MB, validated
client and server), and can tick **Remove current photo**. Backend: `POST
/payroll/employees/with-user` now accepts multipart and stores `pictureUrl` (the
update route already did). Verified live: upload via the form (image loaded at
240px), remove (initials return), create-with-photo (row stored with URL),
wrong-type file refused. The form and drawer now close after a successful save so a
chosen file can't be uploaded twice.

**PF-11 — Reviewer's reject comment was silently dropped (Medium).** The reject
handler read `#decisionBasis`, but the Maker-Checker card's box is
`#approvalComment`, so every run was stored as "Rejected by checker". Fixed; verified
the typed reason is stored (`processError`). `reject-payroll` is now also verified by
a real UI click.

Regression: payroll lifecycle e2e 25/25; no type errors in payroll-v6 files.
