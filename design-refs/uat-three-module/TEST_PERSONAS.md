# Test personas and interaction plan — LP Portal, Payroll, Fundraising

**Engagement:** three-module UAT / QAT / UI-UX · **Stage 1** · 10 September 2026
**Branch:** `qa/three-module-uat-20260910` (both repos)
**Environment:** local — MySQL 8.4 on `127.0.0.1:3306` (`arcus_dev`), API on `:3009`

> The persona list in the brief was inferred from module names. This is the corrected
> list, derived from `nvccz/src/config/payrollPermissions.ts`, the `lp.*` guard
> catalogue, and the `roles` table in the running database. Where the brief and the
> implementation disagree, the implementation wins and the difference is noted.

---

## 1. What the brief got wrong

| Brief assumed | Implementation |
|---|---|
| 4 payroll personas | **12**, keyed by role *display name*, with maker-checker segregation enforced in the grant map |
| "Payroll Approver / Finance" | Three distinct checkers — **CFO** (approve + release), **CEO** (approve), **Finance Manager** (approve + components + reports) |
| Employee self-service is a role | Plain staff hold **no payroll grant at all**. My Pay is authenticated-only and scoped to the caller's own employee record |
| LP is one persona | LPs carry an `lp_role` of **MANAGER / SIGNATORY / VIEWER**, *and* optional per-fund entitlement via `lp_user_relations.fund_ids` |
| LP Portal = statements + documents | 20 `lp.*` permissions including a **dealing flow** (`subscribe`, `redeem`, `estimate`), **messages**, **service requests** and **notice acknowledgement** |
| Fundraising = pipeline + commitments | Also **DDQ cases**, **data rooms** with access logging, **agreements + signatories**, **campaigns**, **closings**, **compliance holds**, **approval events** |

Two personas in the brief have **no corresponding role in this platform**: "LP Portal Admin"
and "IR / Investor Relations" are not roles — those duties sit with `admin` /
`System Administrator` and with the Fundraising module's own approval roles. Tested as
such rather than invented.

---

## 2. Accounts — existing

All passwords `admin123`. All addresses are on synthetic domains (`nts.local`, `nts.com`,
`example.com`) except the LP and investee test accounts on the firm's own `arcus.co.zw`.

### Payroll

| Persona | Account | Authority |
|---|---|---|
| System Administrator | `perf.sysadmin@nts.local` | full — **both** sides of maker-checker |
| CEO (checker) | `perf.exec@nts.local` | all view + `runs.approve` |
| HR Manager | `perf.hr@nts.local` · `test.hr@nts.local` | employees, leave, training, vault; sees runs, cannot run them |
| Operations Manager | `perf.deptmgr@nts.local` | dashboard, employees, leave, training — view only |
| Plain staff (My Pay) | `perf.employee@nts.local` | **no payroll grant**; own record only |
| admin | `admin@nts.com` | 108 permissions |

### LP Portal — the isolation matrix

| Persona | Account | Client org | `lp_role` | Fund entitlement |
|---|---|---|---|---|
| **LP A** | `lp.test@arcus.co.zw` | `cmtc7r6fc…fe2` | MANAGER | `null` — all funds of its client |
| **LP B** | `lp.signatory@example.com` | `cmtmb1j0v…dcc` | SIGNATORY | 2 named funds of 7 |
| **LP C** | `lp.viewer@example.com` | `cmtmb1j0v…dcc` | VIEWER | same 2 funds as B |

This yields three independent isolation axes, all testable with accounts that already exist:

1. **Cross-organisation** — A vs B/C. Different clients; neither may see the other's data.
2. **Intra-organisation role** — B vs C. *Same* client and *same* funds, different authority.
   A VIEWER must not reach `lp.dealing.*`, `lp.notices.acknowledge` or `lp.requests.create`.
3. **Fund entitlement** — B/C are restricted to 2 of 7 funds. Fund 3-7 data must be
   unreachable even within their own organisation.

Axis 2 is the subtle one and the most likely to be wrong: it is the case where hiding a
nav item looks identical to enforcing a permission.

### Fundraising / cross-cutting

| Persona | Account | Note |
|---|---|---|
| Investment Analyst | `investments.analyst@nts.com` | pipeline data entry |
| CEO / Partner sign-off | `perf.exec@nts.local` | approval authority |
| Investee (applicant) | `company.nts@arcus.co.zw` + 3 others | downstream of fundraising |

---

## 3. Accounts that must be created — and why it matters

**No account holds these roles.** Each must be provisioned through the platform before
Stage 2, as the brief requires.

| Role to create | Why it is not optional |
|---|---|
| **Payroll Manager** | The **maker**. Prepares and releases runs and is deliberately denied `runs.approve`. Without it, maker-checker segregation is only testable via System Administrator, which holds *both* sides — that would prove nothing. This is the single most important missing account. |
| **Chief Financial Officer** | Checker + release. The intended approval path. |
| **Finance Manager** | Second checker variant — approve + `components.manage` + `reports.manage`. |
| **Compliance Officer** | Tax and training manage; audit view. |
| **External Auditor** | The brief's read-only Auditor. Holds exactly 3 grants — `audit.view`, `reports.view`, `runs.view`. A tight negative-test subject. |

**Open discrepancy, to confirm in Stage 2:** `payrollPermissions.ts` grants
`"Internal Auditor": [...ALL_VIEW]`, but no role of that name appears in the `roles`
table. Either the role was never seeded or the grant is dead code. Recorded now so it is
not mistaken for a test-setup failure later.

---

## 4. Interaction plan — lifecycles to run twice each

### Payroll — two consecutive periods

```
HR Manager records a joiner / compensation change
  → Payroll Manager opens the run for the period
  → inputs and adjustments entered (overtime, deductions, bonuses, leave)
  → gross-to-net calculated
  → Payroll Manager submits for approval        [must NOT be able to approve it]
  → CFO reviews → REJECT, returns to Payroll Manager      (cycle 1)
  → corrected, resubmitted → CFO APPROVES                 (cycle 1)
  → run processed and committed
  → payslips generated and published
  → plain staff opens My Pay, sees own payslip only
  → posts to Accounting/GL (cashbook + journal entry)
  → External Auditor reviews the trail
```

Run twice over **consecutive periods**, so period-over-period behaviour, overlap
rejection and historical-run visibility are exercised rather than assumed.

### Fundraising → LP Portal

```
Analyst adds prospect → progresses pipeline stages
  → DDQ case raised, data room access granted (access is logged)
  → commitment recorded → checklist items
  → approval request → CEO signs off → closing
  → LP onboarded, portal access provisioned (invite email — intercepted by the guard)
  → LP sets password on first login
  → capital call issued → LP sees it and responds
  → capital account, statements and distributions update
  → External Auditor reviews the trail across both modules
```

Run twice: once through **LP A's** organisation (MANAGER, all funds), once through
**B/C's** (SIGNATORY + VIEWER, fund-restricted), so both entitlement shapes are covered.

### What every session ends with

For each persona: log in, complete the journey, and confirm the money on screen
reconciles to its source records — then log in as the *neighbouring* persona and confirm
none of the first one's data is reachable.
