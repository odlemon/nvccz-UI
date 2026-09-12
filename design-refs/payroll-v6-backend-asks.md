# Payroll V6 — backend work done, and what remains

**Date:** 9 September 2026
**Backend repo:** `../nvccz`, branch `feature/payroll-v6-live`
**Frontend:** `nvccz-new`, branch `feature/payroll-v6-live`
**Not deployed.** Everything below was applied to local `arcus_dev` only.

---

## Part 1 — Built during this work

### 1.1 Authorisation on `/api/payroll` (security defect)

**What was wrong.** Every route in `src/routes/payrollRoutes.ts` was
`authenticate` only. Any logged-in user could create, process, approve, release
and delete payroll. Confirmed by probe, not by reading:

```
POST /api/payroll/payroll-runs   as perf.employee@nts.local (Operations Member)
  -> 500 from the controller, NOT 403
```

A 500 means the request reached the controller and was executing. The only
thing stopping a plain employee from running payroll was a schema validation
error.

Separately, `GET /api/payroll/dashboard` returned **403 to every role including
System Administrator**, because it used `authorize(["admin","hr_manager",…])`,
which matches on role *name*, and SYSADMIN's name is "System Administrator".

**What was built.**

- `src/config/payrollPermissions.ts` — a 30-permission catalogue following the
  house `<module>.<area>.<view|manage>` convention, plus default grants per role.
- Guards on every payroll route (`requireAnyPermission`).
- The dashboard route moved off the role-name list onto `payroll.dashboard.view`.
- `scripts/run-payroll-v6-permissions-migration.ts` — idempotent grant script,
  `npm run db:migrate:payroll-v6-permissions` (`-- --check` verifies).

**Maker-checker is enforced by grant, not just by code:**
`payroll.runs.manage` (maker) and `payroll.runs.approve` (checker) are never
granted to the same non-admin role.

**Verified after applying** — five test logins:

| | dashboard | GET employees | GET runs | POST runs | POST allowance-type |
|---|---|---|---|---|---|
| sysadmin | 200 | 200 | 200 | allowed | allowed |
| exec (CEO) | 200 | 200 | 200 | **403** | **403** |
| hr (HR Manager) | 200 | 200 | 200 | **403** | **403** |
| deptmgr (Ops Manager) | 200 | 200 | **403** | **403** | **403** |
| employee (Ops Member) | **403** | **403** | **403** | **403** | **403** |

### 1.2 `GET /api/payroll/me/access` (new endpoint)

The login payload carries `roleName`/`roleCode` but **not** the role's
permission array, so the frontend had no way to gate on real grants. The only
alternative was re-deriving entitlement from `roleCode` client-side — a second
copy of the authorisation rules that drifts the first time a grant changes.

Returns the caller's effective payroll grants plus their own employee record
(My Pay needs the employee id). Authenticated-only and self-scoped.

Verified: sysadmin 30 grants, CEO 16, HR Manager 16, Ops Manager 4,
Ops Member 0 — each resolving its own employee number.

### 1.3 Payroll money maths (three real defects)

**(a) Mixed currencies summed as one scalar.**
`calculateEmployeePayrollWithLegs` computed
`grossPay = legs.reduce((s,l) => s.add(l.grossPay))`, adding a USD leg to a ZiG
leg as if they were the same unit. An employee on a 2,975 basic with a 70/30
split reported a gross of **25,848.97**, and the run total was
**158,036.97** against a real package of 42,209. Employee-level figures are now
reporting values in USD (the ZiG leg divided by the run's FX rate); the true
per-currency amounts stay on `EmployeePayrollLeg`, which is what payslips and
bank files read.

**(b) Allowances silently dropped for split-salary employees.**
The same function returned `totalAllowances: 0, allowances: []`, so anyone on a
USD/ZiG contract lost their housing, transport and medical lines while
single-currency employees kept theirs. It now loads the same active salary
structures the single-currency path uses.

**(c) Two different PAYE engines disagreeing.**
Split-salary employees went through the bracket-driven `ZimraStatutoryEngine`;
single-currency employees went through `calculateEmployeePayroll`, which applies
flat `TaxRules` with a `rate/100` convention. The result: an employee on 1,515
gross was assessed **2.27** in total deductions — 0.15%. Everyone now goes
through the bracket engine (a 100%-USD contract is simply a single USD leg).

Same employee after the fix, verified against the bracket and levy tables:

```
PAYE  1515*0.20 - 100      = 203.00   (band 500-2000, 20%, offset 100)
AIDS  203.00*0.03          =   6.09   (AIDS_RATE 0.03)
NSSA  min(1515,700)*0.045  =  31.50   (NSSA_RATE 0.045, ceiling 700)
SDL   1515*0.005           =   7.58   (SDL_RATE 0.005)
                             ------
                             248.16   API returns 248.17 (rounding)
net   1515 - 248.17        = 1266.83  matches
```

### 1.4 Dashboard aggregation keyed off the wrong date

All six aggregation sites in `PayrollDashboardService` bucketed runs by
`updatedAt` ("when payroll was completed"). Runs for June, July and August 2026
all reported under **September** because that is when they were processed, and
any later status change would silently move a month's payroll to a different
bar. The axis is labelled by month, so it now buckets on the run's pay-period
end date.

Verified: trend reads Jun/Jul/Aug 2026 at 33,702.96 net over 12 employees each,
September zero because no run exists for it.

### 1.5 Employee provisioning

See §2.1 — built during this work rather than left as an ask.

### 1.6 Payroll audit trail

See §2.7 — built during this work rather than left as an ask.

### 1.7 Data

- `scripts/seed-payroll-v6-baseline.ts` — the payroll tables were **completely
  empty** (0 employees, 0 runs, 0 payslips, 0 salary structures), so no screen
  could have shown anything but fiction. Seeds ZiG alongside USD, 5 allowance
  and 5 deduction types, statutory tax rules, 12 employees backed by real user
  accounts (including all five test logins so My Pay resolves), their salary
  structures, leave balances and a bank file template. Idempotent.
- `scripts/seed-payroll-v6-history.ts` — clears the `E2E Lifecycle` runs the
  test leaves parked in 2030-2036 (one still carried the pre-fix 158,036.97
  gross) and rebuilds the last three completed months **by driving the real
  endpoints**, not by writing rows.
- `scripts/e2e-payroll-v6-lifecycle.ts` — 25-check end-to-end round trip.

Migration logged in `design-refs/vps-pending-migrations.md` as
`2026-09-09-payroll-v6-role-permissions`, `appliedToVps=false`.

---

## Part 2 — Still missing on the backend

Ordered by value. Each blocks specific UI that currently has no endpoint to
call; see `payroll-v6-action-inventory.md` for the affected action ids.

### 2.1 Employee create through the module UI — BUILT

Was: `POST`/`PUT /payroll/employees` existed and were guarded, but
`Employee.userId` is required and unique and the form collected only a name,
job title and department — no email, no employee number, no salary — so there
was nothing to create a user account from and the control was decorative. It
also pre-filled a fake person ("Kundai Marufu").

Now: `POST /payroll/employees/with-user` provisions both rows in one
transaction, behind `payroll.employees.manage`. The account gets a random
password — none is accepted from the caller and none is returned — so
onboarding runs the normal reset flow. Validation reports every missing field
at once; a duplicate email or employee number is a 409 naming which.
The form gained the three missing fields and its fake defaults were cleared.

Verified: created through the API and again through the browser form
(`POST 201`, roster reloaded); empty input returns all five validation
messages; a plain employee gets 403. Both probe records were removed afterwards.

**Still open:** employee *update* (`edit-employee`) is not wired, and employee
changes are not written to the audit trail (§2.7).

### 2.2 Payroll input batches — HIGH

No model exists. Blocks the whole Inputs & Validation screen (`upload-inputs`,
`resolve-input`, `export-errors`, `download-input-template`) and is why the
Command Centre's "1,247 of 1,284 valid" had nothing behind it. Needs a
`PayrollInputBatch` + `PayrollInputRow` pair with validation status, plus
upload and commit endpoints.

### 2.3 Payroll exceptions — MEDIUM

No table. The register is currently **derived** from genuine data-quality
blockers on real employee records (missing ZIMRA BP number, missing bank
details, missing national ID, zero basic salary, suspended-but-active), which
is honest and useful, but resolution cannot be persisted — `resolve-exception`
and `escalate-exception` have nowhere to write. Needs a `PayrollException`
model with owner, status and audit trail.

### 2.4 Pay groups and payroll calendar — MEDIUM

No model. Blocks Pay Groups & Calendar entirely (`new-paygroup`,
`edit-paygroup`, `edit-schedule`, `copy-calendar`). Runs currently have no
concept of a pay group, which is also why the runs list reports a single
"Monthly Staff" group.

### 2.5 Vendors and quotations — MEDIUM

The `Vendor` model exists in the schema but there is no payroll-facing vendor or
RFQ API. The entire Vendors & Quotations screen is fixture-rendered — it is the
largest remaining block of untraced numbers (25). Either wire it to the
procurement vendor tables or remove the screen from the payroll nav; it should
not stay as a page of invented figures.

### 2.6 Payroll document vault — MEDIUM

No payroll document store. Blocks `upload-document`, `create-document`,
`save-document`. The screen currently renders the runtime's own document
fixtures.

### 2.7 Payroll audit trail — BUILT

Was: `logEvent()` wrote to an in-memory array that died with the page, so the
governance screen showed six invented events and nothing that actually happened
was recorded. `ActivityLog` exists but is performance/portfolio shaped
(`goalId`, `taskId`, `kpiId`) and payroll never wrote to it.

Now: `payroll_audit_events`, created by
`npm run db:migrate:payroll-v6-audit-table` (idempotent raw SQL, managed
outside Prisma so schema.prisma cannot drift), written on run created,
submitted, approved, rejected and processed, and read by
`GET /api/payroll/audit` behind `payroll.audit.view`.

Recording is best-effort and swallows its own errors — an audit write must
never fail the payroll run it is recording — and the read returns an empty
trail rather than a 500 on a database without the migration.

Still open on this: employee-record changes are not yet audited (only the run
lifecycle is), and there is no evidence-hash chain behind the screen's
"Verify ledger hash" control.

### 2.8 Onboarding pipeline — LOW

No candidate model. Blocks `complete-onboarding`, `save-onboarding`.

### 2.9 Report generation — LOW

No endpoint behind `custom-report`, `save-report`, `scheduled-reports`.
Reports are currently produced client-side from rendered data.

### 2.10 Payslip PDF download — LOW (wiring, not capability)

`GET /payroll/employee/payslips/:id/download` already returns a real,
hash-verified PDF. `download-payslip` still builds a local PDF instead. This is
a frontend wiring task, not a missing capability.

---

## Part 3 — Behaviour changes worth knowing about

1. **Tightened access.** Roles that previously reached payroll routes because
   there was no guard at all (e.g. Accountant, Investment Analyst) now get 403
   unless granted. This is intentional; add grants in
   `src/config/payrollPermissions.ts` and re-run the migration if a role needs
   access.

2. **The legacy `payroll` module shares these routes.** It is in
   `SUPERSEDED_MODULE_IDS` and frozen, and `lib/api/payroll-api.ts` was not
   touched — but it now calls guarded endpoints. Admin-role users are
   unaffected (the `admin` role holds all 30 grants).

3. **Processing order.** `assertCanProcess` requires a run to be **APPROVED**
   before it can be processed, so approval gates calculation rather than
   following it. The UI's workflow stepper reflects the real state machine.

4. **Payroll figures changed** for existing data because of the money-maths
   fixes in 1.3. Any historical run processed before this change carries the
   old, wrong totals until reprocessed.
