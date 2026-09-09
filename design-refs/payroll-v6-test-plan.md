# Payroll V6 — test plan and results

**Date:** 9 September 2026
**Branch:** `feature/payroll-v6-live` (both repos)
**Environment:** local only — staff portal `localhost:3001`, API `127.0.0.1:3009`, MySQL `arcus_dev`.
**Nothing was deployed.**

This records what was **observed**, not what was inspected. Every number below
came out of a script whose output is in `.payroll-dumps/` and `.payroll-trace/`.

---

## 1. The method

Three scripts, each answering a different question. None of them alone is
sufficient, which is the point.

| Script | Question it answers |
|---|---|
| `scripts/payroll-page-dump.mjs` | Does the screen render, and what did it call? Captures the rendered `#content` plus **every** `/api/` response body. |
| `scripts/payroll-trace-numbers.mjs` | Did the numbers on screen come from those calls? Diffs on-screen numbers against the captured payloads. |
| `scripts/payroll-action-probe.mjs` | Does the button do anything? Clicks a `[data-action]` as a role and reports the API calls, toast, download or dialog it produced. |

Backend round trip: `nvccz/scripts/e2e-payroll-v6-lifecycle.ts` (25 checks).

**Why three.** The dumper will happily report a beautiful screen full of
fiction. The tracer catches that, but says nothing about whether a control
works. The probe catches a button that looks live and silently does nothing —
which is what most of this module's controls were.

## 2. Reproducing

```bash
# backend (nvccz)
npm run db:migrate:payroll-v6-permissions   # grants; -- --check to verify
npm run db:seed:payroll-v6-baseline         # idempotent reference data
npm run db:seed:payroll-v6-history          # last 3 months via the real endpoints
npm run e2e:payroll-v6-lifecycle            # 25-check round trip

# frontend (nvccz-new)
node scripts/patch-payroll-runtime.mjs                       # 68 runtime patches
node scripts/payroll-page-dump.mjs --pages=all --role=sysadmin
node scripts/payroll-trace-numbers.mjs --role=sysadmin
node scripts/payroll-action-probe.mjs --role=sysadmin --page=runs --action=create-run
```

---

## 3. Results — every route renders

**5 roles × 20 pages = 100 page loads. 100 mounted. 0 unmounted.**

After re-running the two pages hit by a dev-server hot-reload reset mid-sweep,
**100/100 loads had zero console errors and zero failed requests.**

API calls per page load, by role — the loaders request only what the role's
grants allow, so this falls with privilege, which is the intended behaviour:

| Role | Backend role | API calls per page |
|---|---|---|
| sysadmin | System Administrator | 17 |
| exec | CEO | 17 |
| hr | HR Manager | 16 |
| deptmgr | Operations Manager | 10 |
| employee | Operations Member | 5 |

## 4. Results — numbers traced to payloads

Untraced numbers across the 20 screens, as sysadmin:

| Stage | Untraced |
|---|---|
| Before any work | **204** |
| After the KPI/fixture work | 100 |
| Final | see §4.3 |

### 4.1 What was found and fixed

The worst offenders were the ones that looked most convincing:

- **Command Centre** read Employees `128`, gross `USD 264,720`, deductions
  `77,444`, net `187,276`, readiness `72 / 100` — directly above a run table
  that was already rendering live rows.
- **My Pay** rendered `employees[0]` — the first person in the roster, not the
  signed-in user — with a fixed payslip of net `1,629.14`. Every employee saw
  the same stranger's pay.
- **Leave** keyed used-YTD, pending and liability off the **row index**
  (`[5,8,12,3,9,2,4]`, `[1480,2940,1320,...]`), so the numbers beside an
  employee belonged to whoever sat at that position.
- **Sidebar badges** `4 / 2 / 3 / 29 / 12 / 3 / 13` were literals.
- **Statutory register** listed five invented rule versions and their approvers.
- **Training** showed six fabricated courses and per-department completion bars
  for departments that do not exist in this database.

### 4.2 Derivations, demonstrated

Numbers the tracer cannot match because they are computed. Each was checked by
hand:

**Command Centre totals** — `42,208.99` gross
= 34,105 (sum of 12 basic salaries) + 8,104 (sum of allowances) = **42,209**,
residual from the ZiG leg's FX round-trip.
Net: `42,209.00 − 8,506.04 = 33,702.96` ✓ matches the screen.

**A payslip, against the ZIMRA bracket and levy tables** — EMP-0005, gross 1,515:

```
PAYE  1515*0.20 - 100      = 203.00   band 500-2000, 20%, offset 100
AIDS  203.00*0.03          =   6.09   AIDS_RATE 0.03
NSSA  min(1515,700)*0.045  =  31.50   NSSA_RATE 0.045, ceiling 700
SDL   1515*0.005           =   7.58   SDL_RATE 0.005
                             ------
                             248.16   screen shows 248.17 (rounding)
net   1515 - 248.17        = 1266.83  matches
```

**Leave liability** — accrued days × (basic ÷ 22 working days):
EMP-0001 holds 21 days on a 3,200 basic → `(3200/22)*21 = 3054.55` ✓ on screen.
EMP-0003, 19 days on 2,975 → `(2975/22)*19 = 2569.32` ✓ on screen.

**Sidebar badges** — employees `12` (12 records), components `10`
(5 allowance + 5 deduction types), tax `3` (3 tax rules), leave `36`
(12 employees × 3 leave types).

### 4.3 What remains untraced, and why

| Screen | Left | What they are |
|---|---|---|
| vendors | ~24 | **No backend.** Whole screen is fixture-rendered; see backend-asks §2.5. |
| inputs | ~13 | **No backend.** No input-batch store; backend-asks §2.2. |
| leave | 11 | The liability derivation above — all verified. |
| overview | 11 | Chart axis ticks (8415/16850/25285/33720 are computed from the live series) and id fragments. |
| audit | 8 | **No backend.** Audit events are in-memory; backend-asks §2.7. |
| approvals | 5 | Sampled-payslip figures inside the review drawer. |
| employees | 5 | Masked account-number fragments split by the tokeniser. |
| mypay | 4 | Fragments of `0040006412` and `63-1445720B16` — real payload values. |
| tax, training, settings | **0** | Fully traced. |

The tokeniser splits `0040006412` into `6412` and `63-1445720B16` into `63` and
`1445720`; those are payload values, not fabrications.

## 5. Results — role matrix

Grants resolved live from `GET /api/payroll/me/access`:

| Role | Grants |
|---|---|
| System Administrator | 30 |
| CEO | 16 |
| HR Manager | 16 |
| Operations Manager | 4 |
| Operations Member | 0 |

### 5.1 Refusals are visible, not silent

Page access, observed on screen:

| Page | sysadmin | hr | deptmgr | employee |
|---|---|---|---|---|
| Roles & Access Control | renders | **refused** | **refused** | **refused** |
| Maker-Checker Review | renders | **refused** | **refused** | **refused** |
| Settings & Integrations | renders | **refused** | **refused** | **refused** |
| Document Vault | renders | **renders** | **refused** | **refused** |
| Vendors | renders | renders | renders | **refused** |
| My Pay | renders | renders | renders | **renders** |

A refusal renders a panel naming the permission required, e.g.

> You do not have access to this page
> Your role does not hold the payroll permission this screen requires.
> Required permission: `payroll.approve`

Document Vault is the useful case: HR keeps it because HR Manager genuinely
holds `payroll.vault.manage`. The gate is the grant, not a hardcoded list.

### 5.2 Backend refusals

Probed directly, all five logins:

| | dashboard | GET employees | GET runs | POST runs | POST allowance-type |
|---|---|---|---|---|---|
| sysadmin | 200 | 200 | 200 | allowed | allowed |
| exec (CEO) | 200 | 200 | 200 | **403** | **403** |
| hr | 200 | 200 | 200 | **403** | **403** |
| deptmgr | 200 | 200 | **403** | **403** | **403** |
| employee | **403** | **403** | **403** | **403** | **403** |

### 5.3 Empty is empty, not fabricated

A department manager has no `payroll.runs.view`, so the loader fetches no runs.
Maker-Checker then reads:

> No payroll run to review · Prepared by — · Gross payroll USD 0.00 · Unresolved critical 0

It previously read "Approval review is 78% complete", "Prepared by Rudo
Sibanda" and "3 unresolved critical" for a payroll that role cannot see. The
Command Centre for a plain employee likewise shows `Employees 0`, `USD 0.00`,
`No run`, and the trend chart says "No payroll trend data available".

## 6. Results — the end-to-end round trip

### 6.1 Through the API (`e2e:payroll-v6-lifecycle`) — **25/25 checks passed**

Including the negative cases: employee and HR refused run creation (403), HR
and employee refused approval (403), processing an unapproved run refused
(400), employee refused the administrative payslip route (403) and bank-file
generation (403).

Note the real state machine: `assertCanProcess` requires **APPROVED** before
processing, so approval gates calculation rather than following it.

### 6.2 Through the browser — observed at each step

| Step | Actor | Observed |
|---|---|---|
| Create run | sysadmin | `POST 201 /payroll/payroll-runs` — "October 2026 Monthly Staff" appears in the register |
| Submit for approval | sysadmin | `POST 200 .../submit-for-approval` |
| Approve — refused | hr | Control **not present**; the page itself refuses |
| Approve | exec (checker) | `POST 200 .../approve` |
| Process | sysadmin | run reaches `COMPLETED`, gross `42,209.00` |
| Bank file | sysadmin | `POST 200 .../bank-file`, CSV returned, no error toast |
| See the payslip | employee | My Pay shows pay period **2026-10**, net `USD 1,266.83`, 4 payslips on record |

Two defects were found by doing this rather than reasoning about it:

1. The Create Payroll Run dialog offered exactly two hardcoded periods, July
   2026 and June 2026, **both of which already had runs**. Since the API rejects
   an overlapping period, a run could not be created through the UI at all.
2. The bank file returned `200` and then showed the user an error, because the
   endpoint serves CSV and the client defaulted to `response.json()`.

## 7. Results — controls

All 107 runtime action ids are catalogued in
`design-refs/payroll-v6-action-inventory.md`. Sample verdicts from the probe:

| Action | Verdict |
|---|---|
| `create-run` | LIVE — `POST 201` |
| `continue-run` | LIVE — `POST 200` |
| `approve-payroll` | LIVE — `POST 200` (checker only) |
| `commit-inputs` | LIVE — processes the run |
| `download-close-pack` | LIVE — `POST 200`, bank file |
| `export-employees` | EXPORT — CSV containing live rows |
| `export-leave` | EXPORT — CSV |
| `compare-runs` | VIEW-STATE |
| `upload-inputs` | VIEW-STATE — opens a dialog (no backend behind it) |
| `open-rule` | VIEW-STATE — opens a dialog |

The exported roster is live, dashes included where the record has no field:

```
"Employee ID","Name","Job title","Department","Branch","Readiness","Status"
"EMP-0001","Perf SysAdmin","—","IT","—","100","Ready"
"EMP-0002","Perf Executive","—","Operations","—","100","Ready"
```

## 8. Tabbed screens

Checked explicitly for the documented pattern of tabs navigating away instead
of switching in place. The tab controls on Earnings & Deductions
(`data-component-filter`) and the run register segmented control are handled by
the runtime's own click handlers and re-render `#content` in place; no
`data-page`/router navigation is attached to any of them. The chart range
toggles (6M/12M/24M) and series toggles likewise mutate `state` and call
`replaceChartV3` in place. **No tab was observed navigating to a different
route.**

## 9. Type check

| | Errors |
|---|---|
| Baseline (before any change) | 997 |
| Final | 997 |
| **Delta** | **0** |
| Errors in `payroll-v6` / `lib/payroll-v6` | **0** |

The 997 are pre-existing, mostly in `stock-price-module` and the legacy
`app/payroll/` module (69 of them), which was not touched.

## 10. Runtime patch reproducibility

`scripts/patch-payroll-runtime.mjs` — **68 patches, 0 missed.**

Verified by restoring a clean pre-patch runtime and re-patching:

- clean extract + patch → md5 stable
- patching again → "runtime already up to date — nothing written"
- result parses as an ES module (`node --check`)

All runtime edits go through this script. The runtime is never hand-edited.

## 11. Known limitations

1. **Screens with no backend** — Vendors, Inputs & Validation, Pay Groups &
   Calendar, Onboarding, Document Vault and Audit Trail still render the
   runtime's fixtures because there is nothing to call. Each is itemised in
   `payroll-v6-backend-asks.md` §2 with what would need building. They are
   reachable and look finished, which is a risk: they should either be built or
   removed from the nav before anyone treats them as real.
2. **`new-employee` / `edit-employee`** are not wired. The endpoints exist, but
   the runtime's form has no `userId` and `Employee.userId` is required —
   backend-asks §2.1.
3. **Payslip PDF** — the backend serves a real hash-verified PDF; the UI still
   builds one client-side. Wiring, not capability.
4. **Environment instability during testing.** The two dev servers are shared
   with another agent working in the same checkout; the API restarted mid-sweep
   several times, producing `ECONNREFUSED`/`ECONNRESET` in some runs. Every such
   run was re-run and the results above are from clean runs. One transient
   `500` on `GET /payroll-runs` as HR did not reproduce (200 on three
   consecutive retries) and is recorded as environmental, not a defect.
