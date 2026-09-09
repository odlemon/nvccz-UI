# Performance module — role matrix, enforcement points, verification

**Date:** 8 September 2026
**Companion to:** [`performance-module-map.md`](./performance-module-map.md) ·
[`performance-functional-requirements.md`](./performance-functional-requirements.md)

**Status:** Step 0 of the implementation plan is **done and verified** (§1.1). The route,
module and server-guard holes are closed. Component-level gating is still cosmetic, and 213
endpoints remain `authenticate`-only — those belong to later steps.

---

## 1. Enforcement layers — before and after Step 0 (8 Sep 2026)

| Layer | Where | Before | After |
|---|---|---|---|
| Route (auth) | `middleware.ts` → `isStaffPublicPassThrough` | **OPEN** — `/performance` in `STAFF_PUBLIC_PASS_THROUGH`, returning `next()` before the token check | **CLOSED** — entry removed; unauthenticated `/performance*` → `307 /login` |
| Route (permission) | `middleware.ts` routePermissions loop | **DEAD CODE** — never reached | **LIVE** — 25 entries now execute |
| Module (frontend) | `lib/config/role-permissions.ts` | **OPEN** — `hasModuleAccess`/`hasSubModuleAccess` both `return true` unconditionally for `performance-v22` | **CLOSED** — bypass removed; resolves via `MODULE_ID_ALIASES` against real per-role grants |
| Module identity | `getModuleByPath` | returned the **superseded** `performance-management` | returns `performance-v22` — superseded modules now sort last |
| Component | runtime `allowed()` / `canPage()` / `noAccess()` | **COSMETIC** | **still cosmetic** — Step 1+ |
| **Server** | `../nvccz/src/routes/*` | 22 permissioned · 213 auth-only · **7 unguarded** | 22 permissioned · **220 auth-only** · **0 unguarded** |

### 1.1 Step 0 — what changed, and how it was verified

**Backend (`../nvccz`)**

- `performanceBreakdownRoutes.ts` — added `authenticate` to the two GETs. The file already
  imported it and used it on its POSTs; the GETs simply omitted it.
- `individualGoalToTaskRoutes.ts` — added the import and a router-wide `router.use(authenticate)`,
  so a future route cannot silently inherit the old behaviour.

Verified on a clean instance, then again on the running dev backend after respawn:

```
no token   401 GET  /breakdown/departments/available      (was 200)
no token   401 GET  /breakdown/users/Finance              (was 200)
no token   401 GET  /individual-goals/users/:id/performance-tasks
no token   401 GET  /individual-goals/departments/:d/performance-tasks
no token   401 POST /individual-goals/:id/convert-to-tasks
no token   401 POST /individual-goals/users/:id/convert-goals-to-tasks
no token   401 POST /individual-goals/departments/:d/convert-goals-to-tasks
perf.hr    200 GET  /breakdown/departments/available      ← feature still works
perf.hr    200 GET  /breakdown/users/Finance
```

**Frontend**

- `lib/portal/config.ts` — removed `/performance` from `STAFF_PUBLIC_PASS_THROUGH`.
- `lib/config/modules.ts` — `getModuleByPath` now prefers non-superseded modules on a path
  collision, fixing the whole class rather than reordering the array.
- `lib/config/role-permissions.ts` — removed the `performance-v22` blanket bypass from both
  access helpers; added `MODULE_ID_ALIASES` so the port inherits the per-role
  `performance-management` grants that already exist, with administrative surfaces
  (`pm22-access`) gated behind `full`.
- `middleware.ts` — **this one was a regression I introduced and then caught.** Middleware
  carried its own duplicate copies of both access helpers that read `ROLE_PERMISSIONS_MAP`
  directly and knew nothing about aliases. Because every client-design port sits in the
  pass-through, that loop had never run for any of them; removing `/performance` from the
  list made it the first to reach it, and it then denied **every** role — including HR_MGR —
  because `performance-v22` is not a key in the map. Fixed by delegating to the shared
  helpers. The pre-existing `OPS_MGR` short-circuit was preserved verbatim (it affects other
  modules; almost certainly a copy-paste error given the comment says "Admin role", but
  changing it is out of scope — flagged, not fixed).

Verified in-browser at 1440×900:

| Case | Result |
|---|---|
| No session → `/performance`, `/performance/reviews`, `/performance/settings` | `307 → /login?from=…` |
| No session → `/performance-legacy` | `307 → /login` (was also exposed by the same `startsWith`) |
| No session → `/procurement-v23` (untouched sibling) | `200` — unchanged, as intended |
| `perf.hr@nts.local` (HR_MGR, full grant) → `/performance` | module renders, "People Performance Command Centre" |
| `BOARD_MEMBER` (no `performance-management` grant) → `/performance` | redirected to `/home`, module does not load |

`tsc --noEmit`: **997 errors before, 997 after**, none in any file touched.

---

## 1.2 Demo role toggle removed — real role now drives the UI (8 Sep 2026)

The runtime drove every permission check off `state.role`, a string chosen from a
`#roleSelect` dropdown literally labelled `aria-label="Demo role"`, whose five roles matched
no real user. **That dropdown is now removed from the DOM** (not hidden — a disabled control
that silently does nothing is worse than none) and replaced by real resolution.

**How it resolves.** `lib/performance-v22-mock/access.ts` derives the tier from two facts
that already exist for every one of the 36 roles, rather than enumerating them:

1. `getModuleAccessLevel(roleCode, 'performance-management')` → full | write | read | none
2. `departmentRole === 'HEAD'` → the user leads their department

giving the scopes the runtime's own `MatanhoDynamicRBAC` registry already declares:

| roleCode | tier | scope | permissions |
|---|---|---|---|
| `SYSADMIN`, `admin` | admin | organization | `*` |
| `CEO` | executive | organization | 23 |
| `HR_MGR` | hr | organization | 19 |
| `OPS_MGR` | manager | **department** | 14 |
| `OPS_MEM` | individual | **self** | 12 |
| `FUND_MGR` | individual | self | 12 |
| `LIMITED_PARTNER` | **none** | none | 0 |

Permission strings are the runtime's own vocabulary (`view_kpi`, `manage_team_tasks`, …), so
`allowed()` and `canPage()` keep working unchanged — only their input became real.

**Verified in-browser, both directions:**

| Signed in as | Role shown | Tier / scope | `/performance/access` |
|---|---|---|---|
| `perf.hr@nts.local` (HR_MGR) | "HR Manager" | hr / organization, 19 perms | **reachable** — holds `manage_roles_limited` |
| `perf.employee@nts.local` (OPS_MEM) | "Operations Member" | individual / self, 12 perms | **bounced to dashboard** — lacks the permission |

The dashboard header renders `EXECUTIVE COMMAND CENTRE · HR MANAGER` / `· OPERATIONS MEMBER`
from the real role. `#roleSelect` is absent in both cases.

**Still display-level only.** This scopes what the UI offers. The endpoints behind it remain
`authenticate`-only with no server-side scope filtering (§4), so this is not yet a security
boundary — it is the honest role model the demo toggle was standing in for. Server-side
scoping is the next block of work.

## 1.3 Dead routes removed

`/performance/ad-hoc-reports`, `/performance/scheduled-reports` and
`/performance/report-history` all client-side redirected to `/performance/performance-reports`
at ~800 ms while still holding route files, `nav.ts` entries and `routePermissions` entries —
three permission entries guarding nothing. All three are now deleted from `app/performance/`,
`lib/performance-v22-mock/nav.ts` and `middleware.ts`. `next build` confirms they are no
longer emitted. The remaining textual matches elsewhere belong to the separate legacy
`performance-mock` module and the historical extract script, and are untouched.

## 2. Real users now exist per tier

Created by `nvccz/scripts/seed-performance-test-users.ts`
(`npm run db:seed:performance-test-users`, idempotent, `-- --remove` to delete). Local only.
All verified logging in against `POST /api/auth/login` → 200 with the correct role.

| Tier | User | roleCode | `roles` row | Department / departmentRole | Intended scope |
|---|---|---|---|---|---|
| System admin | `perf.sysadmin@nts.local` | `SYSADMIN` | System Administrator | — | organisation |
| Executive | `perf.exec@nts.local` | `CEO` | CEO | — | organisation |
| HR / M&E | `perf.hr@nts.local` | `HR_MGR` | HR Manager | Human Resources / HEAD | organisation (people) |
| Department manager | `perf.deptmgr@nts.local` | `OPS_MGR` | Operations Manager | Operations / HEAD | **department** |
| Individual | `perf.employee@nts.local` | `OPS_MEM` | Operations Member | Operations / MEMBER | **self** |

Password `admin123`. Each roleCode is a member of the frontend `RoleCode` union and already
carries a `performance-management` grant in `ROLE_PERMISSIONS_MAP`.

The scope column is not invented: the runtime's own `MatanhoDynamicRBAC` v24.5 registry
declares exactly this model — `organization` for CEO / Executive / HR / SysAdmin,
`department` for Department Manager, `self` for Employee (map §13.7).

### 2.1 How scope can actually be enforced

| Scope | Signal available | Usable? |
|---|---|---|
| self | `User.id` | yes |
| team | `Employee.lineManagerUserId` | **no — `employee` table is empty** |
| department | `User.departmentId` / `User.userDepartment` + `User.departmentRole` (`HEAD`/`MEMBER`) | yes |
| organisation | — | yes |

There is **no manager→report relation on `User`** and **no head field on `Department`**. Until
`employee` is populated, "my team" must mean "my department, where I am `HEAD`", not a
line-manager graph. Any story implying a true reporting hierarchy is not currently
implementable.

---

## 3. Intended matrix

Least-privilege reading, per the brief. `R` = read, `W` = create/edit, `—` = no access.
Scope in brackets is the row set the tier should see.

| Page | SysAdmin | Executive (CEO) | HR / M&E | Dept Manager | Individual |
|---|---|---|---|---|---|
| Command Centre | R *(org)* | R *(org)* | R *(org)* | R *(dept)* | R *(self)* |
| Company Strategy | W | R | R | R | R |
| Strategic Themes | W | R | W | — | — |
| BSC Pillars | W | R | R | — | — |
| Scorecards | W | R *(org)* | W *(org)* | W *(dept)* | R *(self)* |
| Objectives & KPIs | W | R *(org)* | R *(org)* | W *(dept)* | R *(self)* |
| KPI Management | W | R | R | R | — |
| KPI Analytics | R | R *(org)* | R *(org)* | R *(dept)* | R *(self)* |
| Tasks & Projects | W | R *(org)* | R *(org)* | W *(dept)* | W *(self)* |
| Timesheets | W | R *(org)* | R *(org)* | W *(dept, approve)* | W *(self, submit)* |
| Performance Contracts | W | R *(org)* | W *(org)* | W *(dept)* | R *(self)* |
| Performance Reviews | W | R *(org)* | W *(org, cycles)* | W *(dept, as reviewer)* | W *(self-assessment only)* |
| Corrective Actions | W | R *(org)* | W *(org)* | W *(dept)* | R *(self)* |
| Risk Register | W | R *(org)* | R | W *(dept)* | — |
| Reports & Compliance | W | R *(org)* | W *(org)* | R *(dept)* | — |
| Performance Reports | W | R | W | R *(dept)* | — |
| Document Vault | W | R *(org)* | W *(HR docs)* | W *(dept docs)* | W *(own docs)* |
| Alerts & Escalations | W | R *(org)* | R *(org)* | R *(dept)* | R *(self)* |
| Departments | W | R | R | R *(own dept)* | — |
| Integrations | W | — | — | — | — |
| Access & Settings | W | R | R *(limited)* | — | — |
| Settings | W | — | R | — | — |

Derived from the runtime's own permission sets (`rolePerms` at runtime L52-60 and the
`MatanhoDynamicRBAC` registry), reinterpreted least-privilege where the two disagreed. **This
is a proposal, not an existing product policy** — flag anything that contradicts how the
business actually works.

### 3.1 Segregation of duties

Two rules the review workflow needs, neither of which exists today:

- **No self-review.** An individual may submit a self-assessment but must not be able to act
  as their own reviewer/approver.
- **No self-approval of contracts.** A department manager may author a contract for a report
  but not approve their own.

Both must be enforced **server-side** and tested in both directions — that the self case is
blocked, and that the legitimate second-party case succeeds. Testing this needs two real
users, which §2 now provides (`perf.deptmgr` and `perf.employee` share a department).

---

## 4. Enforcement point per action, and verification

`Server guard` is the only column that matters for security. `Verified` is filled in only
after the control exists and has been exercised as the named role.

> **Correction (8 Sep).** An earlier revision of this document said only two roles
> (FUND_MGR, PORTFOLIO_MGR) narrow `performance-management` with a subModules allowlist.
> That came from a source-text regex and was wrong: **12 of 36 roles** declare one, in three
> competing naming conventions, and only **CFO** grants `performance-reviews`. Reading the
> parsed `ROLE_PERMISSIONS_MAP` instead of the source corrected it — and the difference
> mattered: the first version of the alias mapping denied Reviews to HR_MGR. See the note in
> `role-permissions.ts` above `ADMIN_SUBMODULE_IDS`.

| Action | Endpoint(s) | Server guard **today** | Required | Verified |
|---|---|---|---|---|
| View any performance page | *(frontend)* | **authenticated + module access** ✅ | — | ✅ 8 Sep — three cases in §1.1 |
| List / create / edit KPI | `GET /api/kpis`, `POST /api/performance/kpis` | `authenticate` only | `performance.kpi.manage` | ☐ |
| List / create goal | `/api/performance/goals` | `authenticate` only | scope-filtered | ☐ |
| List / create task | `/api/tasks` | `authenticate` only | scope-filtered | ☐ |
| Scorecards | `/api/performance/scorecards` | `authenticate` only | scope-filtered | ☐ |
| Contracts | `/api/performance/contracts` | `authenticate` only | + no self-approve | ☐ |
| Reviews / cycles | `/api/performance-reviews`, `/api/performance/review-cycles` | `authenticate` only | + no self-review | ☐ |
| Risk assessments | `/api/risk-assessments` | `authenticate` only | scope-filtered | ☐ |
| Departments | `/api/departments` | `authenticate` only | read-all / write-admin | ☐ |
| Timesheets submit / approve | `/api/accounting/timesheets/*` | `authenticate` only | + no self-approve | ☐ |
| Rollups | `/api/performance/rollup`, `/api/performance/analytics` | `authenticate` only | scope-filtered | ☐ |
| Corrective actions read | `GET /api/performance/corrective-actions{,/summary,/:id}` | **permissioned** ✅ `performance.corrective.view\|manage` *(added 8 Sep)* | — | ✅ 401 / 200 / 403 per role |
| Corrective actions write | `POST\|PATCH\|DELETE /api/performance/corrective-actions` | **permissioned** ✅ `performance.corrective.manage` *(added 8 Sep)* | — | ✅ employee 403, manager 201 |
| Alerts read | `GET /api/performance/alerts{,/summary,/:id}` | **permissioned** ✅ `performance.alerts.view\|manage` *(added 8 Sep)* | — | ✅ 401 / 200 / 403 per role |
| Alerts write + lifecycle | `POST\|PATCH\|DELETE /api/performance/alerts`, `/:id/{acknowledge,escalate,resolve}` | **permissioned** ✅ `performance.alerts.manage` *(added 8 Sep)* | — | ✅ employee 403, manager 201 |
| Document vault read | `GET /api/performance/documents{,/folders,/:id}` | **permissioned** ✅ `performance.documents.view\|manage` *(added 8 Sep)* | — | ✅ 401 / 200 / 403 per role |
| Document vault write | `POST\|PATCH\|DELETE /api/performance/documents` | **permissioned** ✅ `performance.documents.manage` *(added 8 Sep)* | — | ✅ employee 403, manager 201 |
| CEO dashboard | `/api/ceo-dashboard` | **permissioned** ✅ | — | ☐ |
| Automated reporting | `/api/automated-reporting/*` | **permissioned** ✅ (`accountant`/`finance_manager`/`cfo`) | reconsider — these are finance roles on a performance surface | ☐ |
| Department breakdown | `/api/performance/breakdown/*` | `authenticate` ✅ *(fixed 8 Sep)* | + scope filtering | ✅ 401/200 both ways |
| Goal→task conversion | `/api/performance/individual-goals/*` | `authenticate` ✅ *(fixed 8 Sep)* | + scope filtering | ✅ 401/200 both ways |

### 4.1 The unguarded seven — as found, before the fix

Called with **no `Authorization` header**:

```
local    200  GET /api/performance/breakdown/departments/available
local    200  GET /api/performance/breakdown/users/Finance        → id, firstName, lastName, EMAIL
local    200  GET /api/performance/individual-goals/users/:id/performance-tasks
local    401  GET /api/kpis            ← control, correctly rejected
local    401  GET /api/departments     ← control, correctly rejected

arcus-dev-api-1    200  /api/performance/breakdown/departments/available
arcus-dev-api-1    401  /api/kpis
nvccz-prod-api-1   200  /api/performance/breakdown/departments/available
nvccz-prod-api-1   401  /api/kpis
```

Full list (2 in `performanceBreakdownRoutes.ts`, 5 in `individualGoalToTaskRoutes.ts`):

| Verb | Path |
|---|---|
| GET | `/api/performance/breakdown/departments/available` |
| GET | `/api/performance/breakdown/users/:departmentName` |
| GET | `/api/performance/individual-goals/users/:userId/performance-tasks` |
| GET | `/api/performance/individual-goals/departments/:departmentName/performance-tasks` |
| POST | `/api/performance/individual-goals/individual-goals/:id/convert-to-tasks` |
| POST | `/api/performance/individual-goals/users/:userId/convert-goals-to-tasks` |
| POST | `/api/performance/individual-goals/departments/:departmentName/convert-goals-to-tasks` |

The three POSTs mutate data and were **not** fired — the GET evidence plus identical
`guards=[none]` in the same routers establishes it.

**Exposure scope, stated precisely:** on dev and prod, `/breakdown/users/Finance` returned
`200` with **0 records**, because no user sits in a department of that exact name there.
Locally, where data exists, it returned real names and email addresses. So the endpoints are
open in all three environments; whether they currently return personal data depends on each
environment's department naming. **No production personal data was retrieved.**

---

### 4.2 The three new registers — guarded before any write was enabled (8 Sep)

Corrective Actions, Alerts and the Document Vault had no model at all before this session, so
their tables, services, controllers and routes were built from scratch. The route files
shipped with `router.use(authenticate)` and **nothing else** — the same shape as the other 220
performance endpoints. That meant:

> Any logged-in user of ANY portal — a Limited Partner, an applicant, an investee company —
> could list, create, edit and delete records in all three registers.

This was found and fixed before a single write path was enabled in the UI, which is why
`API_ACTIONS` in `lib/performance-v22-mock/actions.ts` stayed empty until now: enabling a
write against an unguarded endpoint hands an unprivileged user a mutation, which is strictly
worse than a button that does nothing.

**What was added.** `requireAnyPermission` on all 21 routes across the three files — read
takes `<register>.view` or `<register>.manage`, write takes `<register>.manage` only. The six
keys are granted by the (extended) `scripts/run-performance-role-permissions-migration.ts`:
`.view` to all 52 internal staff roles, `.manage` to the 16 manager/exec roles, and **nothing
at all** to the 7 external roles.

**Verified over HTTP, 8 Sep** — not reasoned about, called:

```
no token          corrective 401   alerts 401   documents 401
perf.employee     corrective 200   alerts 200   documents 200   POST corrective 403   POST alert 403
perf.deptmgr      corrective 200   alerts 200   documents 200   POST corrective 201   POST alert 201
perf.hr           corrective 200   alerts 200   documents 200   POST corrective 201   POST alert 201
perf.exec         corrective 200   alerts 200   documents 200   POST corrective 201   POST alert 201
perf.sysadmin     corrective 200   alerts 200   documents 200   POST corrective 201   POST alert 201
```

Read/write separation therefore holds for a real employee: they see the register, they cannot
change it.

External roles were verified at the permission layer rather than by logging in — their
credentials are not known and must not be guessed or reset. Confirmed directly against the
`roles` table that `applicant`, `INVESTEE`, `Limited Partner`, `LP Viewer`,
`LP Institutional Manager` and `External Auditor` hold **none** of the six keys, while
`Operations Member` holds exactly the three `.view` keys and no `.manage` key. That is the
same mechanism already proven end-to-end by the employee's 403 above.

**Still outstanding.** 220 of 242 performance endpoints remain `authenticate`-only. Nothing in
this section changes that; it only means the three registers with live write paths are not
among them.

### 4.3 The other 118 write endpoints — guarded in the same pass (8 Sep)

Sections 4.1 and 4.2 covered the seven originally-unguarded endpoints and the three brand
new registers. Everything else in the module — goals, scorecards, BSC entry/workflow,
reviews/review-cycles, contracts, strategy config, the KPI catalogue, integration, ETL,
workflow, the dashboard, analytics, rollup, risk assessments and department breakdown —
was in the **identical** unguarded state: `router.use(authenticate)` and nothing else, across
22 route files and 118 write endpoints.

Guarded with a single `methodGuard()` middleware (`src/middleware/methodGuard.ts`) applied
once per router rather than once per route: GET/HEAD get `performance.<domain>.view` (or
`.manage`), everything else gets `.manage` only. Applying it at the router level means a
route added to any of these files later inherits the guard automatically — the previous
unguarded state existed because nobody added a guard when the route was written, and a
per-route approach reproduces that exact failure mode for the next route.

**Two exclusions, checked before excluding:**

- `board-reviews` (`/api/board-reviews`) is **not** a Performance-module resource — it backs
  the Portfolio / Investment-Committee deal-flow board review (`lib/api/board-review-api.ts`,
  `lib/portfolio-v11/*`). Guarding it with a Performance permission would have 403'd deal
  analysts who hold no Performance-module access at all. Left alone.
- `risk-assessments` (`/api/risk-assessments`) **was** guarded (domain `risks`), after
  confirming — not assuming — that nothing outside the Performance module touches it: no
  other backend service calls `prisma.riskAssessment.*`, and no other frontend module calls
  the route. This is despite `RiskAssessment`'s schema shape reading like a deal
  due-diligence record (`companyName`, `dealValue`, `sector`) rather than an enterprise risk —
  see `performance-module-map.md` for the standing product question about whether that model
  belongs on this page at all. Guarding it does not answer that question, only its access.

Two more cross-module call sites were checked and cleared: `lib/api/goal-api.ts` and
`lib/api/task-api.ts` hit the same `/performance/goals` and
`/performance/individual-goals/*` paths, but their only importers are the orphaned legacy
`components/performance/` React module (no live route renders it) and Employee Hub, whose
users are internal staff and already hold the granted `.view` keys as part of the same
migration.

**Verified over HTTP, 8 Sep** — 15 endpoints probed across all three states:

```
no token       401 on every guarded path
employee       200 on every guarded read; 403 on POST /performance/goals and
               POST /performance/scorecards
HR Manager     POST /performance/goals -> 400 (validation error - reached the controller,
               not blocked by the guard)
external role  0 of 30 new performance.* keys held (verified at the role-permissions table,
               applicant / INVESTEE / Limited Partner)
```

## 5. Verification protocol for this module

Per brief §7, and specific to what is broken here.

1. **Fresh tab per page.** Cheap today (nothing is cached because nothing is fetched), but
   mandatory once Step 2 wiring lands.
2. **Network panel on every write.** The baseline is established: today *every* write button
   produces zero requests. Any wiring claim must show the specific `POST`/`PATCH`, its 2xx,
   its response body, and an independent re-query proving the row changed.
3. **All five tiers, every time.** Testing as `admin@nts.com` proves almost nothing here —
   privileged users short-circuit the gates. Use the §2 users.
4. **Both directions on segregation of duties.** `perf.employee` blocked from reviewing
   themselves; `perf.deptmgr` able to review `perf.employee`. Same department by design.
5. **Call the endpoint directly as the wrong role.** Hiding a control proves nothing —
   §4 shows 213 endpoints where the control is the only thing standing in the way.
6. **Watch for `NaN%`.** Every rollup divides by counts that are legitimately zero right now
   (brief §8.10); the fabricated fixtures never had a zero denominator.
7. **Re-check `localStorage`.** `MatanhoDynamicRBAC.save()` persists policy edits to
   browser storage (map §13.7) — a §8.8 staleness risk once real policy exists.

---

## 6. Open decisions

1. **Is the proposed matrix in §3 right?** It is my least-privilege reading of the runtime's
   own permission sets, not an existing business policy.
2. **Does the demo role toggle survive?** If it stays it must become display-only, with
   server-side scoping unaffected — and that must be verified, not assumed.
3. **`/api/automated-reporting` is guarded by finance roles** (`accountant`, `finance_manager`,
   `cfo`) but surfaces on performance report pages. Either the guard or the usage is wrong.
4. **Team scope.** Until `employee` has rows, "my team" can only mean "my department". If a
   real reporting line is needed, `Employee.lineManagerUserId` has to be populated first.
