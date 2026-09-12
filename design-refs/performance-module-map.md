# Performance module — Phase 0 architecture & inventory map

**Date:** 8 September 2026
**Scope:** the live `/performance` module (Matanho Performance Management V22)
**Status:** discovery only — no code changed, no schema touched, nothing deployed.
**Method:** every claim below cites a file and line. Where I inferred rather than
observed, it says so explicitly.

---

## 0. Headline findings

Seven findings materially change the shape of this work versus the brief's starting
assumptions. Each is evidenced in the sections below.

| # | Finding | Evidence | Impact |
|---|---|---|---|
| F1 | **The live module has no data layer at all.** The vendored runtime contains zero `fetch(` calls, zero `/api/` references, and never dispatches `matanho:before-action`. There is no `actions.ts`, no `live-loaders.ts`, no `adapters.ts`. | §4 | Not "partially real" — 100% fabricated. Every KPI, table, chart and button. |
| F2 | **The host component has no interception hook.** Unlike the three wired `-mock` modules, `performance-v22-app.tsx` only wires navigation. | §4.2 | The runtime must be hand-patched to *emit* actions before anything can be wired to them. |
| F3 | **`/performance` is completely unauthenticated.** It sits in `STAFF_PUBLIC_PASS_THROUGH`, which returns `NextResponse.next()` before the token check and before the permission loop. | §6.1 | All 25 `routePermissions` entries for `/performance*` are dead code. Blocking prerequisite for wiring real data. |
| F4 | **`getModuleByPath('/performance')` resolves to the *superseded* module.** `performance-management` (index 257) precedes `performance-v22` (index 301) and `MODULE_CONFIG.find` returns the first match. | §6.3 | Module identity is wrong at runtime; permission checks keyed by module id look at the wrong id. |
| F5 | **Module access is hard-coded open for everyone.** `hasModuleAccess` and `hasSubModuleAccess` both `return true` unconditionally for `performance-v22`. No role in `ROLE_PERMISSIONS_MAP` is granted it. | §6.4 | Third independent layer of no-access-control. |
| F6 | **The role model is fictional.** The runtime's five demo roles (`Executive`, `HR/M&E Manager`, `Department Manager`, `Employee`, `SysAdmin`) map to **no real role held by any real user**. Its own copy calls it "your current demo role". | §7 | §8.17 confirmed. The entire role surface is cosmetic and must be rebuilt against real roles. |
| F7 | **The performance database is empty.** KPI 0, PerformanceGoal 0, Scorecard 0, Strategy 0, Theme 0, Pillar 0, Review 0, ReviewCycle 0, RiskAssessment 0. Only Department (9), Task (29), MetricSnapshot (4), Timesheet (3) hold rows. | §9 | Wiring alone yields an empty module. Content sourcing is an open business question — see §11. |

**Two corrections to the brief's premises** (both stated in the brief as strong hints; both
turned out to point at a different module):

- The ten `tsc` errors listed under "Known starting signals" are **all real** (§8) but they
  live in `lib/api/performance-data.ts`, `kpi-api.ts`, `goal-api.ts`, `score-card-data.ts`
  and `board-review-api.ts`, which are imported **only** by `components/performance/*` — the
  **superseded legacy** module at `/performance-legacy`. The live `/performance` module
  imports none of them. `performance-data.ts` is indeed a half-migrated mock→live file, but
  it is not the live module's data layer; it is the dead one's.
- The brief's §8.5 trap ("`pages.X` reassigned, last wins") does **not** apply in this form.
  There is no `pages` object. There are 43 duplicate `function` names, but the file is
  organised as one core function plus ~30 sibling IIFEs, so most duplicates are
  **scope-isolated**, not shadowing. Details and the one genuine risk in §5.

---

## 1. Module identity

### 1.1 Two entries, one path

`lib/config/modules.ts` defines two performance modules whose paths collide:

| | `performance-management` | `performance-v22` |
|---|---|---|
| declared at | [modules.ts:257](../lib/config/modules.ts) | [modules.ts:301](../lib/config/modules.ts) |
| `path` | `/performance` | `/performance-v22` |
| `hiddenFromSwitcher` | `true` | *(absent → false)* |
| in `SUPERSEDED_MODULE_IDS` | **yes** ([modules.ts:116](../lib/config/modules.ts)) | no |
| sub-module paths | `/performance/goals`, `/performance/kpis`, `/performance/reviews`, … | `/performance-v22/*` |
| actually renders | nothing — `app/performance-legacy/**` serves the old UI | `/performance-v22` redirects away |

`middleware.ts:338-341` permanently redirects `/performance-v22` → `/performance`. So the
**canonical URL is `/performance`** and the **current module id is `performance-v22`**, but
`modules.ts` still declares the superseded module as the owner of that path. See §6.3 for
the consequence.

### 1.2 Routes that resolve

`app/performance/**` — 25 route segments, one per runtime page. Every `page.tsx` is a stub:

```tsx
/** Public fixture preview — no ModuleGuard (middleware pass-through). */
export default function Page() {
  return <span>Performance V22</span>
}
```

These render into a `sr-only` slot ([client-design-module-shell.tsx:125-127](../components/layout/client-design-module-shell.tsx));
the visible UI is the vendored runtime. The stub comment is accurate and is itself the
disclosure of finding F3.

`app/performance-legacy/**` — 37 pages, the superseded React module. Untouched by this work.

Full page list (25), from [lib/performance-v22-mock/nav.ts](../lib/performance-v22-mock/nav.ts):

`dashboard` (Command Centre) · `strategy` · `themes` · `risks` · `scorecards` ·
`objectives` · `tasks` · `contracts` · `reviews` · `corrective` · `reports` · `vault` ·
`alerts` · `access` · `departments` · `integrations` · `kpiAnalytics` · `kpiManagement` ·
`bscPillars` · `performanceReports` · `adHocReports` · `scheduledReports` ·
`reportHistory` · `settings` · `timesheets`

---

## 2. Architecture

**Type: "-mock" client-faithful port**, and the least-wired one in the codebase.

```
app/performance/layout.tsx
  └── PerformanceV22Layout                        components/layout/performance-v22-layout.tsx
        └── ClientDesignModuleShell               (SharedTopbar + hideThemeToggle)
              └── PerformanceV22App               components/performance-v22-mock/performance-v22-app.tsx
                    └── startPerformanceV22Runtime(rootEl, { shellHtml, initialPage, onNavigate })
                          ← matanho-performance-runtime.js   2,177,552 bytes / 3,893 lines
                          ← shell.ts (PERFORMANCE_V22_SHELL_HTML)  195,847 bytes
                          ← performance-v22.css               635,668 bytes
                          ← performance-v22-overrides.css       9,142 bytes
```

`lib/performance-v22-mock/` contains **only `nav.ts`**. No `actions.ts`, no
`live-loaders.ts`, no `adapters.ts`, no `types.ts`.

---

## 3. Comparison against the wired `-mock` modules

| | portfolio-v11 | accounting-v52 | investee-portal-v8 | **performance-v22** |
|---|---|---|---|---|
| host intercepts `matanho:before-action` | yes | yes | yes | **no** |
| runtime *dispatches* `matanho:before-action` | 8× | 7× | yes | **0×** |
| `lib/<module>/actions.ts` | yes | yes | yes | **absent** |
| `lib/<module>/live-loaders.ts` | yes | yes | yes | **absent** |
| `fetch(` calls in runtime | — | — | — | **0** |
| `/api/` references in runtime | — | — | — | **0** |

Counts from `grep -c` against each runtime and host file.

---

## 4. The live module's data layer

### 4.1 There isn't one

```
$ grep -c "matanho:before-action" components/performance-v22-mock/matanho-performance-runtime.js
0
$ grep -c "fetch("                 components/performance-v22-mock/matanho-performance-runtime.js
0
$ grep -c "NEXT_PUBLIC_API_BASE_URL\|127.0.0.1:3009\|/api/"  …runtime.js
0
```

All displayed data comes from a single in-memory object declared at
[runtime.js:62](../components/performance-v22-mock/matanho-performance-runtime.js):

```js
const state={page:…,role:'HR/M&E Manager',entity:'Matanho Capital',year:'FY 2026',
  sidebar:false,selectedReview:'EMP-001',docFolder:'All documents',reportTab:'library',
  objectiveTab:'okrs',scorecardTab:'org',notifications:4, …}
```

### 4.2 The host wires navigation only

[performance-v22-app.tsx](../components/performance-v22-mock/performance-v22-app.tsx) passes
`initialPage` and `onNavigate`, and calls `setPage` on pathname change. There is no
`API_ACTIONS` allowlist and no event listener. Compare
[investee-portal-v8-app.tsx:22](../components/investee-portal-v8-mock/investee-portal-v8-app.tsx)
(`const API_ACTIONS = new Set([…])`) and its `matanho:before-action` handler at line 76.

**Consequence:** wiring cannot begin by adding an allowlist. The runtime must first be
hand-patched to emit the event at each write site — under the standing rule that the runtime
is **never** regenerated from `scripts/extract-performance-v22*.mjs`, only hand-patched.

---

## 5. Runtime structure — the scope model

3,893 lines, 567 `function` declarations, organised as:

- **Lines 9 – ~495:** `export function startPerformanceV22Runtime(rootEl, options = {})`.
  Contains the core `state`, the permission helpers, and the page renderers
  (`dashboard`, `strategy`, `scorecards`, `objectives`, `tasks`, `reviews` @271, `corrective`,
  `reports`, `vault`, `alerts`, `access`, …). Declarations inside are written flush-left
  despite being nested — indentation is **not** a reliable scope signal in this file.
- **Lines 497 – 3893:** ~30 sibling IIFEs (`(() => { 'use strict'; … })();`), each a patch
  layer applied after the core. Boundaries observed at 497/702, 706/843, 847/972, 976/1106,
  1110/1252, 1256/1377, 1381/1405, 1409/1542, 1546/1666, 1670/1881, 1885/1948, 1952/1993,
  1997/2031, 2035/2108, 2112/2299, 2303/2519, 2523/2571, 2575/2599, 2603/2754, 2758/2806,
  2810/2950, 2954/3000, 3004/3118, 3122/3168, 3172/3417, 3421/3449, 3453/3487, 3491/3525,
  3529/3561, 3571/…

**Cross-scope communication is via `window` globals** — the §8.6 pattern, already in use:
`window.__PERFORMANCE_V22_NAV__`, `window.MATANHO_CONFIG`, `window.handle`,
`window.openDrawer`, `window.openDocument`.

### 5.1 Duplicate function names — 43 groups

Because the IIFEs are separate scopes, most duplicates are **isolated, not shadowing**.
Examples: `data` ×5, `heatmap` ×5, `scorecard` ×5, `kpi` ×4 — the tail cluster at
L3421–3640 is five near-identical successive IIFEs, each redefining its own private
`data/spark/kpi/scorecard/heatmap/trendChart`. Each affects only its own layer.

The one group that needs empirical resolution before touching it:

- **`reviews`** — declared at L271 (inside `startPerformanceV22Runtime`, the page renderer)
  and L3148 (inside the IIFE at 3122, among risk-register functions
  `registerPage/overview/assessment/controls/monitoring/reviews/detailPage`). Different
  scopes by inspection, so L271 should be the live Reviews page. **Not yet confirmed
  in-browser** — will confirm in Phase 1 per §8.5 of the brief.

Method note: my first pass used indentation as a scope proxy and would have reported
`reviews`, `scorecard`, `kpi` and 24 others as same-scope shadowing. Checking the IIFE
boundaries reversed that conclusion. Indentation is unusable here.

---

## 6. Access control — four layers, all currently open

### 6.1 Route layer: bypassed entirely

`/performance` is listed in `STAFF_PUBLIC_PASS_THROUGH`
([lib/portal/config.ts:77](../lib/portal/config.ts)), matched with `startsWith`
(line 96). `middleware.ts:350`:

```ts
if (PORTAL_ID === 'staff' && isStaffPublicPassThrough(pathname)) {
  return NextResponse.next()
}
```

This returns **before** the token check (`middleware.ts:387`, `:415`) and **before** the
permission loop (`:458`). Every `/performance*` URL is therefore reachable with no session
at all.

### 6.2 `routePermissions` — present but unreachable

`middleware.ts:112-136` maps all 25 `/performance*` paths to `performance-v22` sub-modules.
Correct in content, never executed for these paths because of §6.1. Dead code today; becomes
live the moment the pass-through entry is removed.

### 6.3 Module resolution returns the wrong module

```ts
// lib/config/modules.ts:948
export const getModuleByPath = (path: string) => MODULE_CONFIG.find(module => …)
```

`find` returns the first match. `performance-management` (line 257) declares
`path: '/performance'` and sub-paths `/performance/goals`, `/performance/reviews`, … and
precedes `performance-v22` (line 301). So **every `/performance*` path resolves to the
superseded module**.

`ClientDesignModuleShell` sets `currentModule` from `getModuleByPath(pathname)`
([client-design-module-shell.tsx:43-46](../components/layout/client-design-module-shell.tsx)),
overwriting the `defaultModuleId="performance-v22"` it was constructed with. Any check keyed
by module id therefore evaluates `performance-management`, not `performance-v22`.

### 6.4 Role permissions: hard-coded open

[role-permissions.ts:2646](../lib/config/role-permissions.ts) and
[:2686](../lib/config/role-permissions.ts):

```ts
// Performance Management V22.1 client design — open during comparison/mock phase
if (moduleId === "performance-v22") return true;
```

in **both** `hasModuleAccess` and `hasSubModuleAccess`, before any role lookup. Meanwhile
`ROLE_PERMISSIONS_MAP` grants `performance-management` to ~35 roles and `performance-v22` to
none. This is a family-wide pattern (portfolio-v11, payroll-v6, accounting-v52,
procurement-v23, fundraising-kyc, investee-portal-v8, accounting-v2 all have the same
bypass), not specific to this module — but it must close here before real data lands.

### 6.5 Server-side guards

Not yet audited per-endpoint — deferred to Phase 0.5 alongside the role matrix, since the
frontend consumes none of these endpoints today. The backend inventory is §10.

---

## 7. The in-runtime role model (cosmetic)

Declared at [runtime.js:52-60](../components/performance-v22-mock/matanho-performance-runtime.js):

```js
const rolePerms={
  'SysAdmin': new Set(['*']),
  'Executive': …,
  'HR/M&E Manager': …,
  'Department Manager': new Set(['view_team','view_strategy','view_kpi','manage_team_kpi',
    'view_tasks','manage_team_tasks','view_reviews','manager_reviews','view_corrective',
    'create_corrective','view_reports','view_vault','edit_team_docs','view_alerts']),
  'Employee': new Set(['view_self','view_strategy','view_kpi','view_tasks','update_own_tasks',
    'view_reviews','self_reviews','peer_reviews','view_reports','view_vault','edit_own_docs',
    'view_alerts'])
};
const allowed = a => rolePerms[state.role]?.has('*') || rolePerms[state.role]?.has(a);
const pagePerm = {dashboard:null, strategy:'view_strategy', scorecards:'view_strategy',
  objectives:'view_kpi', tasks:'view_tasks', reviews:'view_reviews',
  corrective:'view_corrective', reports:'view_reports', vault:'view_vault',
  alerts:'view_alerts', access:'manage_roles_limited'};
const canPage = p => !pagePerm[p] || allowed(pagePerm[p]) || state.role==='SysAdmin';
```

Supporting functions: `roleScope()` (L111, per-role subtitle copy), `financialMask()`
(masks "external financial KPI data"), `noAccess(page)` (renders the restricted panel).

**This is entirely client-side.** `state.role` defaults to `'HR/M&E Manager'` and is changed
by a profile-menu toggle. The module's own copy is explicit:

> `noAccess()`: "Your current **demo role** …"
> `dashboard()`: "Role-aware workspace - ${state.role}" … "filtered by role, ownership, entity and approval authority"

The second string is a claim the implementation does not honour: there is no server, no
ownership check and no entity scoping — only `Set.has()` against a literal.

**Answering the brief's open question directly: the Performance role toggle is cosmetic.**
Everything gated behind it has zero enforcement.

Related, §8.11: the "Employee" scope is hard-coded to a fixture person —
`state.role==='Employee' ? state.tasks.filter(t=>t.owner==='Tariro Moyo') : state.tasks`
([runtime.js:263](../components/performance-v22-mock/matanho-performance-runtime.js)), and
the same literal at L272 for reviews.

---

## 8. `tsc --noEmit` — confirmed, but in the legacy module

997 errors repo-wide (pre-existing). All ten signals in the brief reproduce exactly:

| File | Errors | Note |
|---|---|---|
| `lib/api/performance-data.ts` | 13 | incl. `TS2304: Cannot find name 'apiClient'` ×2 (L382, L387) and four hardcoded `Department` fixtures |
| `lib/api/kpi-api.ts` | 2 | `TS18046 'response' is of type 'unknown'` (L240, L245) |
| `lib/api/goal-api.ts` | 1 | `TS2367` dead comparison (L101) |
| `lib/api/score-card-data.ts` | 2 | `DepartmentScorecard`, `UserScorecard` not exported (L1) |
| `lib/api/board-review-api.ts` | 1 | `TS7008 'investmentApproved' implicitly any` (L7) |

**Importers:** `performance-data.ts` → `components/performance/{activity-logs,tasks-management,tasks-management-new}.tsx`;
`kpi-api.ts` → `components/performance/kpi-management.tsx`, `lib/store/slices/performanceSlice.ts`;
`goal-api.ts` → `components/performance/kpi-view-drawer.tsx`, `performanceSlice.ts`;
`score-card-data.ts` → **nobody** (dead file);
`board-review-api.ts` → `components/applications/*`, `lib/portfolio-v11/*` (a different domain — deal board reviews, not performance reviews).

`components/performance/**` is the **legacy** module (`app/performance-legacy/**`).
The live `components/performance-v22-mock/**` produces **zero** TS errors.

These files remain useful as a **contract reference** — they document real request/response
shapes for `/api/kpis`, `/api/performance/goals`, `/api/departments` — but they are not the
thing being fixed.

---

## 9. Database reality (local `arcus_dev`)

### 9.1 Row counts

| Model | Rows | | Model | Rows |
|---|---:|---|---|---:|
| Department | **9** | | PerformanceScorecard | 0 |
| Task | **29** | | PerformanceStrategy | 0 |
| PerformanceMetricSnapshot | **4** | | PerformanceTheme | 0 |
| Timesheet | **3** | | ScorecardPillar | 0 |
| TimesheetEntry | **5** | | ScorecardPillarAlias | 0 |
| PerformanceSyncSettings | **1** | | PerformanceReview | 0 |
| KPI | 0 | | PerformanceReviewCycle | 0 |
| PerformanceGoal | 0 | | PerformanceReviewFeedback | 0 |
| PerformanceGoalProgressEvent | 0 | | Review | 0 |
| PerformanceContract | 0 | | RiskAssessment | 0 |
| | | | PerformanceSyncJob | 0 |

The schema is complete; the data is not there. Wiring the UI faithfully today produces a
module of empty states — which is the correct honest outcome, and a very different-looking
product from the current fabricated one.

### 9.2 Roles vs. reality (§8.17)

59 role rows exist. 25 users hold 14 distinct `roleCode`/`role.name` combinations:

| roleCode / role.name | users | example |
|---|---:|---|
| `admin` / admin | 3 | admin@nts.com |
| `(null)` / applicant | 5 | nyashakarata1@gmail.com |
| `(null)` / INVESTEE | 4 | company.nts@arcus.co.zw |
| `LIMITED_PARTNER` / Limited Partner | 2 | lp.test@arcus.co.zw |
| `BOARD_MEMBER` / Investment Analyst | 2 | board.member1@nts.com |
| `BOARD_CHAIR` / Investment Analyst | 1 | board.chair@nts.com |
| `CFO` / admin | 1 | accounting-audit@nts.local |
| `HR_MGR` / HR Manager | 1 | test.hr@nts.local |
| `FIN_OFF` / Finance Officer | 1 | test.finance@nts.local |
| `INV_ANALYST` / Investment Analyst | 1 | investments.analyst@nts.com |
| `IT_SUPPORT` / IT Support Specialist | 1 | test.it@nts.local |
| `LP_VIEWER` / Limited Partner | 1 | lp.viewer@example.com |
| `(null)` / admin | 1 | admin@nvccz.co.zw |
| `applicant` / applicant | 1 | investee.test@arcus.co.zw |

**None of the runtime's five demo roles exists as a real role.** The nearest real analogues:
`HR_MGR` (1 user) for "HR/M&E Manager"; `admin`/`CFO` for "SysAdmin"/"Executive". There is
**no real "Department Manager" and no real "Employee"** role, and no line-manager
relationship modelled on `User` that I have found yet (to confirm in Phase 0.5).

This is a hard blocker for §4 of the brief: a role matrix cannot be verified against roles
that no user holds. Resolving it is a prerequisite, and partly a business decision (§11).

---

## 10. Backend inventory — mounted and reachable

27 route groups relevant to this module, all confirmed **mounted** in
`../nvccz/src/app.ts` (import + `app.use` both present):

| Mount | Router | app.ts |
|---|---|---|
| `/api/performance/goals` | performanceGoalRoutes | 710 |
| `/api/performance/etl` | performanceETLRoutes | 711 |
| `/api/performance/enhanced-etl` | enhancedETLRoutes | 762 |
| `/api/performance/dashboard` | performanceDashboardRoutes | 712 |
| `/api/performance/workflow` | performanceWorkflowRoutes | 713 |
| `/api/performance/kpis` | **hardcodedKPIRoutes** | 717 |
| `/api/performance/kpis` | **performanceKpiCatalogRoutes** | 718 |
| `/api/performance/scorecard-pillars` | scorecardPillarRoutes | 719 |
| `/api/performance/rollup` | rollupCalculationRoutes | 721 |
| `/api/performance/scorecards` | performanceScorecardRoutes | 722 |
| `/api/performance/analytics` | performanceAnalyticsRoutes | 723 |
| `/api/performance/config` | performanceConfigRoutes | 724 |
| `/api/performance/integration` | performanceIntegrationRoutes | 725 |
| `/api/performance/bsc-entry` | performanceBscEntryRoutes | 726 |
| `/api/performance/bsc-workflow` | bscWorkflowRoutes | 727 |
| `/api/performance/contracts` | performanceContractRoutes | 728 |
| `/api/performance/goal-tracking` | enhancedGoalTrackingRoutes | 761 |
| `/api/performance/review-cycles` | performanceReviewCycleRoutes | 763 |
| `/api/performance/breakdown` | performanceBreakdownRoutes | 764 |
| `/api/performance/individual-goals` | individualGoalToTaskRoutes | 765 |
| `/api/performance-reviews` | performanceReviewRoutes | 737 |
| `/api/kpis` | kpiRoutes | 716 |
| `/api/tasks` | taskRoutes | 714 |
| `/api/departments` | departmentRoutes | 584 |
| `/api/ceo-dashboard` | ceoDashboardRoutes | 731 |
| `/api/risk-assessments` | riskAssessmentRoutes | 749 |
| `/api/accounting/timesheets` | timesheetRoutes | 655 |
| `/api/automated-reporting` | automatedReportingRoutes | 740 |

**Two flags:**

1. **Double mount at `/api/performance/kpis`** (717, 718). Express tries both in
   registration order; `hardcodedKPIRoutes` wins any path both define. Which endpoints each
   actually serves is **not yet established** — Phase 0.5.
2. **`hardcodedKPIRoutes` / `hardcodedRoleRoutes`** are backed by `src/config/hardcodedKPIs.ts`
   and `src/config/hardcodedRoles.ts`. The names suggest fixture data served over HTTP —
   i.e. the §8 "hardcoded values masquerading as live data" pattern possibly sitting on the
   *server* side. Must be read before any KPI wiring.

Relevant Prisma models (`../nvccz/prisma/schema.prisma`): `Department` 2409,
`PerformanceGoal` 2424, `PerformanceGoalProgressEvent` 2511, `PerformanceSyncSettings` 2532,
`PerformanceContract` 2585, `PerformanceScorecard` 2618, `PerformanceStrategy` 2654,
`PerformanceTheme` 2673, `PerformanceSyncJob` 2687, `KPI` 2738, `ScorecardPillar` 2775,
`ScorecardPillarAlias` 2791, `PerformanceMetricSnapshot` 3569, `PerformanceReview` 3774,
`PerformanceReviewCycle` 3841, `PerformanceReviewFeedback` 3875, `Task` 2199, `Review` 2132,
`RiskAssessment` 4773, `Timesheet` 11723, `TimesheetEntry` 11745.

---

## 11. Open questions for the user (blocking, or shaping, later phases)

These are business decisions I should not make silently. I will keep working around them and
will take the least-privilege / most-honest reading unless told otherwise.

1. **Where does performance *content* come from?** Objectives, KPIs, strategic themes and
   review cycles are organisational content, not defaults I can invent. Options: (a) build
   the CRUD and ship honest empty states until the business enters real data;
   (b) seed a starter set the business then edits; (c) import from an existing source.
   My default, absent direction: **(a)**, plus seeding only genuinely structural reference
   data (the four standard BSC pillars — Financial, Customer, Internal Process, Learning &
   Growth), clearly marked and editable.
2. **The role model.** The module needs Executive / HR / Department Manager / Employee
   distinctions, and none of the middle two exist as real roles with real users. Do we
   (a) map onto existing roles (`admin`, `CFO`, `HR_MGR`, …), (b) create real
   `DEPT_MGR`/`EMPLOYEE` roles and assign them, or (c) derive scope from
   `User.userDepartment` + a manager relationship rather than from `roleCode`? This
   determines the entire §4 matrix.
3. **Does the demo role toggle stay?** If it stays, it must become a display-only preview
   with server-side scoping unchanged (brief §4.8). If it goes, the profile-menu control it
   lives in needs a decision.
4. **`/performance` public pass-through** — I intend to remove it so the module requires
   auth. Confirming because it is a deliberate existing entry alongside `/portfolio`,
   `/accounting`, `/procurement-v23` etc., and removing it for performance only makes this
   module inconsistent with its siblings during the mock phase.

---

## 12. Phase 0.5 — remaining discovery before requirements

Small, bounded, and needed before the §3 requirements table can be written:

- [ ] Read `hardcodedKPIs.ts` / `hardcodedRoles.ts`; establish what the two
      `/api/performance/kpis` routers each serve and which wins.
- [ ] Per-endpoint server guards (`requirePermission`, `authorize`, `isModulePrivilegedUser`)
      for all 27 mounted groups → feeds `performance-role-matrix.md`.
- [ ] Confirm whether a manager↔report relationship exists on `User` / `Department`.
- [ ] Confirm empirically in-browser which `reviews` renderer executes (§5.1).
- [ ] Walk all 25 pages live and capture the per-element inventory (brief §3).

---

## 13. Phase 0.5 results (8 Sep, same day)

### 13.1 The two `/api/performance/kpis` routers — split-brain, confirmed

The double mount is **method-split**, so there is no routing collision:

- `hardcodedKPIRoutes` serves **GET only** — `/`, `/department/:d`, `/code/:c`, `/financial`,
  `/account-type/:t`, `/statistics`.
- `performanceKpiCatalogRoutes` serves **POST / PATCH / PUT / DELETE only**.

But the two address **different stores**:

| Verb | Path | Handler | Reads/writes |
|---|---|---|---|
| GET | `/api/performance/kpis` | `HardcodedKPIController.getAllKPIs` | **`src/config/hardcodedKPIs.ts`** — 34 static definitions in a source file |
| POST/PATCH/DELETE | `/api/performance/kpis` | `KPIController` | **`kpis` database table** (0 rows) |
| GET | `/api/kpis` | `KPIController.getAllKPIs` | **`kpis` database table** |

So creating a KPI at `POST /api/performance/kpis` then reading `GET /api/performance/kpis`
returns 34 fixtures and **not** the KPI you just created. Reads and writes at the same URL
address different stores. Any KPI wiring must read `/api/kpis`, not
`/api/performance/kpis`, or the page will never show user-created data.

### 13.2 Server-side guards across the 27 mounted route groups

242 endpoints parsed (`router.<verb>` with their middleware chains, swagger comments
stripped):

| Guard level | Endpoints | Share |
|---|---:|---:|
| Permission guard (`authorize(...)`, etc.) | 22 | 9% |
| `authenticate` only — any logged-in user | 213 | 88% |
| **No guard at all** | **7** | **3%** |

The 22 permissioned endpoints are confined to `ceoDashboardRoutes` and
`automatedReportingRoutes`. Everything else — all KPI, goal, scorecard, contract, review,
task and config writes — is `authenticate`-only, so **any authenticated user, including an
applicant or an LP, can create/update/delete performance records**. That is brief §8.18
(UI-only gating) across essentially the whole module.

### 13.3 Seven unauthenticated endpoints — verified live, present in production

Static parsing said `guards=[none]`; I verified by calling them with **no Authorization
header**.

Local backend (`127.0.0.1:3009`):

```
200  /api/performance/breakdown/departments/available          → full department list
200  /api/performance/breakdown/users/Finance                  → id, firstName, lastName, EMAIL
200  /api/performance/individual-goals/users/:id/performance-tasks
401  /api/kpis            ← control, correctly rejected
401  /api/departments     ← control, correctly rejected
```

Deployed, executed inside each container against its own `127.0.0.1:3009`:

```
arcus-dev-api-1    /api/performance/breakdown/departments/available   200
arcus-dev-api-1    /api/kpis                                          401
nvccz-prod-api-1   /api/performance/breakdown/departments/available   200
nvccz-prod-api-1   /api/kpis                                          401
```

The full set of 7 (`performanceBreakdownRoutes.ts`, `individualGoalToTaskRoutes.ts`):

| Verb | Path | Effect |
|---|---|---|
| GET | `/api/performance/breakdown/departments/available` | lists departments |
| GET | `/api/performance/breakdown/users/:departmentName` | **lists employees incl. email** |
| GET | `/api/performance/individual-goals/users/:userId/performance-tasks` | reads a user's tasks |
| GET | `/api/performance/individual-goals/departments/:departmentName/performance-tasks` | reads a department's tasks |
| POST | `/api/performance/individual-goals/individual-goals/:id/convert-to-tasks` | **mutates** |
| POST | `/api/performance/individual-goals/users/:userId/convert-goals-to-tasks` | **mutates** |
| POST | `/api/performance/individual-goals/departments/:departmentName/convert-goals-to-tasks` | **mutates** |

I did **not** fire the unauthenticated POSTs — the GET evidence plus identical
`guards=[none]` in the same routers is sufficient, and firing unauthenticated writes was not
necessary to establish the finding.

Scope of actual exposure: on dev and prod my probe of `/breakdown/users/Finance` returned
**200 with 0 records**, because no users are assigned to a department of that exact name in
those environments. Locally, where data exists, it returned real names and email addresses.
So the endpoints are open everywhere; whether they currently return personal data depends on
each environment's department naming. **No production personal data was retrieved.**

### 13.4 Scope model available in the data

| Scope | Signal | Usable today? |
|---|---|---|
| own | `User.id` | yes |
| team | `Employee.lineManagerUserId → User` | **structure only — `employee` table has 0 rows** |
| department | `User.departmentId` / `User.userDepartment` (+ `departmentRole` `HEAD`/`MEMBER`) | yes — 9 departments, users assigned |
| organisation | all | yes |

There is **no manager→report relation on `User`** and **no head/manager field on
`Department`**. So department-level scoping must key off `departmentRole === 'HEAD'`, not a
line-manager graph, until `employee` is populated.

### 13.5 Real test users created (one per audience tier)

`nvccz/scripts/seed-performance-test-users.ts`, wired as
`npm run db:seed:performance-test-users` (idempotent; `-- --remove` deletes). Logged in
`vps-pending-migrations.md` as `2026-09-08-performance-test-users`, local-only.

| Email | roleCode | roles row | Department / departmentRole | Replaces demo role | Login |
|---|---|---|---|---|---|
| `perf.sysadmin@nts.local` | `SYSADMIN` | System Administrator | — | SysAdmin | 200 ✓ |
| `perf.exec@nts.local` | `CEO` | CEO | — | Executive | 200 ✓ |
| `perf.hr@nts.local` | `HR_MGR` | HR Manager | Human Resources / HEAD | HR/M&E Manager | 200 ✓ |
| `perf.deptmgr@nts.local` | `OPS_MGR` | Operations Manager | Operations / HEAD | Department Manager | 200 ✓ |
| `perf.employee@nts.local` | `OPS_MEM` | Operations Member | Operations / MEMBER | Employee | 200 ✓ |

Password `admin123`. Each roleCode is in the frontend `RoleCode` union **and** already holds
a `performance-management` grant in `ROLE_PERMISSIONS_MAP`. All five verified against
`POST /api/auth/login` returning 200 with the correct `roleCode` and role name.

### 13.6 The runtime is a stack of ~37 patch layers, and the last one wins per page

`window` carries 37 `Matanho*` globals — the layer registry:

```
MatanhoPerformance, …V2, V3, V5, V6, V7, V7TextFloor, V8, ScorecardLayersV82,
FunctionalScorecardsV83, NormalizeCharts, SignatureV9, SignatureV10, StrategyV11,
V12 … V22, DashboardV224, V225, V226, V227, V228, V229, V230, V240, V242,
MatanhoDynamicRBAC
```

Ten distinct markup generations appear in the source (`v20 v21 v22 v224 v225 v226 v227
v230 v240 v245`). **Ownership is per page, and static reading of the core renderers is
misleading.** Confirmed in-browser:

| Page | Live heading | Owning layer(s) — from rendered class names |
|---|---|---|
| `/performance` (dashboard) | "**People** Performance Command Centre" | `v240-wrap` (V240/V242) — **not** the core `dashboard()` at L118, which renders "Performance Command Centre" |
| `/performance/reviews` | "Performance Reviews" | `v12-review-cycle-strip`, `v13-review-layout` (V12/V13) |
| `/performance/strategy` | "Company Strategy" | `v11-strategy-nav/hero/grid` + v3 |
| `/performance/scorecards` | "Performance Scorecards" | `scorecard-tabs-v73`, `sc83-*` (V7.3 + FunctionalScorecardsV83) |
| `/performance/objectives` | "Objectives & Key Results" | plain `card` — no versioned layer |

**This settles §5.1:** neither `reviews` declaration (L271 or L3148) is the live Reviews
renderer — a later layer replaced the output entirely. Had I trusted the static read, I would
have wired the wrong function. Every page must have its owning layer identified in-browser
before it is touched.

### 13.7 `MatanhoDynamicRBAC` — the module's own declared scope model

Version `24.5.0`, exposing `{ version, snapshot(), save(), selectRole() }`. Its registry
declares six roles with explicit scopes:

| Role | Declared scope | Permissions |
|---|---|---|
| CEO | organization | `*` |
| Executive | organization | 26 |
| HR/M&E Manager | organization | 23 |
| SysAdmin | organization | 4 |
| Department Manager | **department** | 17 |
| Employee | **self** | 12 |

This is the module's own intended audience model, and it maps cleanly onto the five users
seeded in §13.5 (organization → CEO/HR_MGR/SYSADMIN, department → OPS_MGR + `HEAD`,
self → OPS_MEM). `save()` persists to `localStorage` — a brief §8.8 candidate to re-check
during verification (edits surviving reloads and masking staleness).

### 13.8 Still outstanding from Phase 0.5

- [ ] Per-page element inventory for the remaining ~20 pages (5 of 25 captured so far).
- [ ] Identify the owning layer for each remaining page (§13.6 method).
- [ ] Trace the two visible sidebar badge counts (`Alerts & Audit 4`, `Approvals 6`) to source
      — brief §8.15 suspects.

---

## 13.9 Cross-check: the OLD module is mock too, and the API-wired code is orphaned

Requested check — "make sure the old performance module is fully functional". Result:

**1. `/performance-legacy` is also 100% mock.** Its route files render components explicitly
named `*MockScreen`:

```tsx
// app/performance-legacy/kpis/page.tsx
import { KpiManagementMockScreen } from "@/components/performance-mock/screens/kpi-management-screen"
```

All 37 legacy routes import from `components/performance-mock/screens/*`, fed by
`lib/performance-mock/fixtures/`. Verified in-browser as HR_MGR: the dashboard shows
`78%`, `18 of 24`, `42 of 56`, `164 of 212` against a database holding **0** KPIs, **0**
goals and **0** scorecards, and the KPI page lists `FIN-001 … CUS-001` — codes that exist
only in `lib/performance-mock/fixtures/`, and **nowhere in the backend**. The network panel
filtered to `kpis` shows the page chunk and no API request.

**2. `components/performance/` — 77 files — is orphaned.** This is the set that *does* import
the real clients (`kpi-api`, `goal-api`, `performance-data`) and that carries all ten `tsc`
errors quoted in the brief. No route renders any of it; `app/layout.tsx` imports exactly one
unrelated file from it (`collaboration/global-realtime-mount`). So those errors are in dead
code, and there is **no working reference implementation of this module anywhere** — neither
the old module nor the new one has ever displayed real data.

**3. Access to the legacy module was broken by Step 0, and is now fixed.** Removing
`/performance` from `STAFF_PUBLIC_PASS_THROUGH` also un-exempted `/performance-legacy`
(`startsWith`), so its `routePermissions` began to be enforced for the first time — against
sub-module ids that do not match what roles hold:

| Legacy route | Requires | HR_MGR | SYSADMIN | CEO | OPS_MGR |
|---|---|---|---|---|---|
| `/performance-legacy` | `performance-dashboard` | ❌ | ✅ | ❌ | ❌ |
| `/…/departments` | `departments-management` | ❌ | ❌ | ❌ | ❌ |
| `/…/kpis` | `kpi-management` | ❌ | ✅ | ❌ | ✅ |
| `/…/tasks` | `taskManagement` | ✅ | ❌ | ✅ | ❌ |

Two fixes in `role-permissions.ts`, both root-cause rather than per-route:

- **`subModuleMatches`** compares ids by normalised form (lowercased, separators stripped)
  plus an explicit synonym group, so `kpi-management` ≡ `kpiManagement`,
  `task-management` ≡ `taskManagement`, `departments` ≡ `departments-management`. A spelling
  fix, not a widening — it never grants a page the allowlist does not already name.
- **`LANDING_SUBMODULE_IDS`** lets a module's landing page inherit module access. OPS_MGR
  held every feature page of the legacy module but no dashboard entry, so it could reach
  every sub-page while being bounced off the module's own front door.

After both, all six tested roles reach `/performance-legacy` and its kpis/goals/tasks pages.
`/…/departments` remains denied to HR_MGR, CEO and OPS_MGR — that is a genuine grant
decision (only SYSADMIN's allowlist names `departments`), not a spelling mismatch, and is
left alone. V22 access and legacy semantics both re-verified unchanged.

---

## 14. What I have *not* done

- No frontend code changed, no schema touched, nothing committed, nothing deployed. The only
  write anywhere was the local-only test-user seed (§13.5), logged as a migration.
- Endpoint guards are audited by **static parse plus live probes of the unauthenticated
  ones** (§13.2, §13.3). I have not exercised all 242 endpoints individually, and I have not
  attempted a privileged call as an under-privileged user yet — that belongs to Phase 4.
- The per-element inventory covers **5 of 25 pages**. The remaining 20 are outstanding
  (§13.8), so no functional-requirements table exists yet.
- I have not looked at how any write action behaves, because none of them reach a backend
  (§4.1) — but I have not yet confirmed page-by-page that every button is inert.
- Claims marked "not yet confirmed" earlier in this document that have since been checked
  in-browser are resolved in §13.6; anything still marked as inferred remains inferred.

---

## 15. Implementation record — what was built (8 Sep 2026)

Phase 0 established that the module is a 2.2 MB vendored runtime rendering fixtures. This
section records what was actually built to make it show real data, and how each claim here
was checked. Nothing below is inferred: every endpoint was called, and every page was read
out of a real browser.

### 15.1 Three registers that had no model at all

Corrective Actions, Alerts & Audit, and the Document Vault rendered complete workspaces —
registers, KPI strips, trend charts, root-cause splits — with **no table, no service, no
controller and no route** behind any of it. Built end to end:

| Table | Migration | Routes | Round-tripped |
|---|---|---|---|
| `performance_corrective_actions` | `npm run db:migrate:performance-corrective-actions` | `/api/performance/corrective-actions` (+`/summary`) | create → read → update → list → delete → 404 ✅ |
| `performance_alerts` | `npm run db:migrate:performance-alerts` | `/api/performance/alerts` (+`/summary`, `/:id/{acknowledge,escalate,resolve}`) | full lifecycle, escalation level 0→1 ✅ |
| `performance_documents` | `npm run db:migrate:performance-documents` | `/api/performance/documents` (+`/folders`) | list + folders ✅ |

All three are hand-written idempotent raw-SQL scripts, never `prisma migrate` / `db push`.
Two design notes worth keeping:

- `PerformanceCorrectiveAction.trigger` maps to column **`trigger_source`** — `TRIGGER` is a
  MySQL reserved word.
- `PerformanceAlert` deliberately has **no `elapsed` column**. Elapsed time is derived from
  `raisedAt` on every read, so it cannot go stale. A stored duration would be wrong the
  moment it was written.

### 15.2 The registers shipped unguarded — fixed before any write was enabled

All three route files were `authenticate`-only, like 220 of the module's other 242 endpoints.
That meant any logged-in user of any portal could create and delete performance records. 21
routes across the three files now carry `requireAnyPermission`; six keys were added to the
role-permissions migration. Verified per role over HTTP — see
`performance-role-matrix.md` §4.2 for the full result table.

This is why the frontend's `API_ACTIONS` set stayed empty for so long: a write path against
an unguarded endpoint is worse than a button that does nothing.

### 15.3 The bridge — 27 live scopes

`lib/performance-v22-mock/live-loaders.ts` loads 27 scopes in one `Promise.all`, each wrapped
in `safe()` so one failing endpoint costs one section rather than the page. Every envelope
was verified by calling the endpoint; the full list is in the header of `types.ts`, because
the envelopes are genuinely inconsistent (`data` / `tasks` / `kpis` / `goals` /
`assessments` / `data.reviews` / `data.cycles` — no two alike).

Two endpoints are deliberately NOT used:

- `GET /api/performance/kpis` — `hardcodedKPIRoutes` is mounted on the same path *before*
  `performanceKpiCatalogRoutes`, so it serves `src/config/hardcodedKPIs.ts` fixtures while
  POST/PATCH write to the `kpis` table that only `GET /api/kpis` reads. Reading it would show
  fixtures and permanently hide anything a user creates.
- `GET /api/accounting/timesheets` — 404. Only `/mine` exists, so the Timesheets page is
  genuinely self-scoped. A manager cannot see a report's timesheet; that is a backend gap,
  recorded rather than papered over.

### 15.4 The patch architecture, and the trap it exists to catch

`scripts/patch-performance-runtime.mjs` plus `scripts/perf-patches/<page>.mjs` (one file per
page) is now the only way the runtime is modified. The runtime is regenerated from a clean
`git checkout` plus these files — proven by doing exactly that and getting a byte-identical
result, so a hand edit would be silently lost.

**The trap.** The runtime stacks four to five generations of every page, and later "layers"
reassign `window.render` or the page function to take over. The occurrence you find by
grepping is usually the *dead* one. `String.replace` takes the first match, which is normally
the oldest. The patch reports "apply", the diff looks correct, and the page does not change.

This happened three times before it was caught. Two defences now exist:

1. **`patch()` refuses an ambiguous anchor.** More than one match is an error, not a warning —
   the run refuses to write at all. Turning this on immediately exposed three existing
   patches that had been hitting dead layers, including `${d.reviews}%`, which matches **13
   times** and had been patching the oldest one; review completion had been rendering
   `null%` on screen the whole time while the patch log said success.
2. **`scripts/perf-page-dump.mjs`** renders each page in a real browser as a real logged-in
   user and dumps the visible text plus every number-like token on screen. The DOM is the
   oracle; the diff is not.

Ordering matters and is now documented at the call sites: `dashboard-reviews-pct` must run
*after* `dashboard-unitchart` and `dashboard-reviews-complete`, because their anchors contain
`${d.reviews}%` as a substring and replacing every occurrence of the shorter string first
destroys them.

The patcher takes an exclusive lock, so several people can run it concurrently while working
on different pages.

### 15.5 Write paths

`lib/performance-v22-mock/actions.ts` intercepts the runtime's cancelable
`matanho:before-action` and routes listed ids to the real API, calling `preventDefault()` so
the mock handler cannot also run. An action is added only when its endpoint has been
round-tripped, its route is permission-guarded, and its read path already shows real records.

After a successful write the module **re-reads from the server** through
`publishPerformanceLiveData()` — the same code path as the initial page load, so there is no
second, optimistic route for state to reach the UI.

First one wired and proven end-to-end in a browser: **Log Corrective Action**. The modal was
previously a form with no id, no field names, two hardcoded "owners" that were job titles
rather than people, a hardcoded target date, and a submit button wired to `toast-close` — it
reported success and saved nothing. Now:

```
owner picker   ["Unassigned","Admin NTS","Admin User","Audit Tester"]   (live /api/users)
dept  picker   ["No department","Finance","Human Resources","Investments"]  (live /api/departments)
POST           201  {"success":true,"data":{"reference":"CA-001", ...}}
on screen      new row visible after the server re-read
KPI card       "Open actions" moved 0 -> 1, computed from /corrective-actions/summary
read back      CA-001 severity=high department=set target=2026-12-31  (separate API request)
```

`reference` is allocated server-side, so two people creating at once cannot collide on a
client-generated code.

## 16. Second pass — remaining gaps closed (8 Sep, same day)

### 16.1 The other 118 write endpoints

See `performance-role-matrix.md` §4.3. `src/middleware/methodGuard.ts` applied router-wide
across 22 route files (goals, scorecards, bsc, reviews, contracts, config, kpi, integration,
etl, workflow, dashboard, analytics, rollup, risks, breakdown) — same unguarded-by-omission
defect as the pass-1 registers, at 20x the surface area. `board-reviews` excluded (Portfolio
deal-flow, not Performance); `risk-assessments` included after confirming no other consumer.

### 16.2 Timesheets — the manager gap, actually closed

The only prior endpoint (`/pending-approval`) showed org-wide SUBMITTED rows only — a
manager could approve a stranger's timesheet from another department but had no way to see
their own report's DRAFT or APPROVED weeks. Added:

- `TimesheetService.listForManager()` / `GET /accounting/timesheets/team` — department-scoped
  (via `User.userDepartment`, the only grouping the schema has), every status.
- A real "Team submissions" panel on the Timesheets page's Approval tab (previously nothing
  existed there for a manager at all), with working Approve/Return buttons.

Verified end to end in a real browser: employee logs time -> submits -> manager sees it in
their own department's list -> clicks Approve -> status flips to APPROVED, confirmed by an
independent API read-back. Full round trip, no shortcuts.

### 16.3 Three more write actions wired

Each following the same standard as `submit-corrective`: round-tripped against the live API,
route already permission-guarded, re-reads from the server after success rather than
optimistic local mutation.

- **Alert acknowledge / escalate / resolve** — the drawer's buttons were `toast-generic`
  (success toast, no request) regardless of which row was open. Now real, per-row, and only
  offered for a status the transition is actually valid from.
- **Document Vault upload** — the "New Performance Document" modal had no file input at all
  and generated a text-content mock document; the backend model stores an uploaded file
  (`fileUrl`/`mimeType`/`fileSizeBytes`), so the old form could never have produced a record
  the API would accept. Rebuilt as a real upload form (folder vocabulary matches the model's
  own note: Contracts / Reviews / Evidence / Policies) posting multipart via
  `apiClient.postFormData`.

`API_ACTIONS` now has 7 entries (was 1): `submit-corrective`, `team-timesheet-approve`,
`team-timesheet-return`, `alert-acknowledge`, `alert-escalate`, `alert-resolve`,
`submit-document-upload`.

### 16.4 Still open

- **No scoring model** — this is the one item from §15 that was not attempted in this pass.
  Every KPI/review/BSC score, trend and heatmap across the module remains an honest dash
  because nothing computes or stores one. This is a design task, not a wiring task, and is
  sized similarly to everything else in this section combined.
- The shared drawer-decorator fabrication (§15.5's closing note) — spun off separately.
- Goals, scorecards, reviews, contracts, config, kpi-catalogue, integration, etl, workflow
  writes are now guarded but still not wired to the UI — `API_ACTIONS` only covers the four
  domains above. Enabling them follows the exact same recipe now that every route is safe to
  point a real write at.

## 17. Third pass — the "no scoring model" gap, closed differently than expected (8 Sep)

§16.4 flagged this as the one open item and expected it to be a design/build task on the
scale of everything else combined. It was not. Investigating it changed the diagnosis
entirely.

### 17.1 What was actually true

`PerformanceScorecardService` is a large, real, already-built scoring engine —
`GET /performance/scorecards/{user,employee/:id,department/:dept,ceo,board,org-bsc}`, each
backed by genuine weighted-score computation (goal progress -> rating -> pillar weight ->
roll-up), not a stub. It was blocked by exactly one thing: `scorecard_pillars` had 0 rows, so
`ScorecardPillarService.assertCanonicalExists()` rejected every `scorecardPillar` value on
every goal-create call ("Invalid scorecardPillar…"). No goal could ever be created with a
pillar, so nothing could ever be scored — which is why every score/trend/heatmap across the
module was an honest dash. The fix already existed too:
`scripts/run-scorecard-pillars-migration.ts` was written, idempotent, and had simply never
been run. One `npm run db:migrate:scorecard-pillars` unblocked the entire chain.

**Verified, not assumed**: created a real `PerformanceContract` (`POST
/performance/contracts/employee`), linked a real `PerformanceGoal` at 92% progress to it, and
called `GET /performance/scorecards/user` — got back a genuinely computed
`weightedScore`/`progressPct: 80`/`rawRating`, not a fixture. Deleted the probe records after.

### 17.2 What was wired

- **`orgBsc` scope** (`GET /performance/scorecards/org-bsc`) — always callable, no contract
  required. Feeds the dashboard's "All departments" row (`__perfOrgBscRow()` in
  `patch-performance-runtime.mjs`): real weighted org score and four real per-pillar scores,
  replacing four permanently-null perspectives. Also feeds the Scorecards page's
  Organization BSC matrix (`scorecards-datafor`): real score/status/weighted-points per
  perspective, matched to `pillarConfig` rows by name.
- **`myScorecard` scope** (`GET /performance/scorecards/user`) — the signed-in user's own
  scorecard. Deliberately NOT routed through the ordinary error-catching `safe()`: a 404 here
  almost always means "no active performance contract" or "no goals linked to it", which is
  the backend correctly explaining an honest state, not failing. `loadMyScorecard()` catches
  it and returns `{available:false, blockedReason: <the backend's own sentence>}` instead of
  a generic "Unavailable".
- Org headcount now also prefers `analyticsDashboard.totalUsers` over the departments
  roll-up, absorbing a redundant patch from an earlier agent's pass that targeted the same
  anchor (`__perfOrgUsersOrRollup()`).

### 17.3 What is still not wired (a real remaining gap, correctly scoped this time)

Department, CEO, board and employee-drill-down scorecards each have their own real endpoint
(`/department/:dept`, `/ceo`, `/board`, `/employee/:id`) and are NOT read by the frontend
yet — only `org-bsc` and the signed-in user's own `/user` are. Wiring them follows the exact
same recipe (a loader + an adapter + a patch matching the page's existing tab structure) and
was not attempted here for time. `org-bsc` itself also only rolls up `type: 'company'` goals
linked to a catalogue KPI — a validation the backend correctly enforces (organisational goals
must be measurable against a governed KPI, not an arbitrary target), confirmed while trying
to seed a second proof case, not treated as a bug.

## 18. Fourth pass — department/board/CEO/employee scorecards wired (8 Sep, same day)

Closes §17.3's remaining item. All four now show real, computed data, each verified end to
end by seeding a real contract + goal, watching the number respond, then deleting the probe.

### 18.1 Response shapes — verified, not assumed to match org-bsc

- **Department** (`/scorecards/department/:name`) and **Employee**
  (`/scorecards/employee/:id`, and `/scorecards/user` for self): goal-based —
  `{department|employee, contract, goals:[{weightedScore,rawRatingLabel,...}], scores:
  {departmentScore|finalScore, performanceLabel}}`. NOT the four-pillar BSC shape.
- **Board** and **CEO** (`/scorecards/board`, `/scorecards/ceo`): a five-section government
  scorecard — `sections:{A1,A2,B,C,D}` each `{label,weight,sectionScore,performanceLabel}`,
  plus `scores.finalScore`. Also not the BSC shape, and different from department/employee.

Because these are genuinely three different shapes, `scorecards.mjs`'s `dataFor(t)` builds
`rows` differently per tab (goals for department/employee, sections for board/CEO, pillars
for org) rather than forcing everything through one borrowed structure — a goal row and a
governance-section row both reduce to the same `{name,weight,score,status}` shape
`rowMarkup()` already renders, so the matrix UI itself needed no changes.

### 18.2 New scopes

- `deptScorecards` — one call per real department (~9, cheap to preload fully).
- `boardScorecard`, `ceoScorecard` — single global calls, no per-entity selection.
- On-demand `fetchEmployeeScorecard(id)` (`bridge.ts`) — NOT preloaded for all ~24 users
  (most hold no contract; preloading would mean two dozen requests, mostly 404, on every
  page load regardless of whether this tab is ever opened). Cached per id in
  `bridge.data.employeeScorecards`, triggered from the runtime via
  `window.__PERF_FETCH_EMPLOYEE_SCORECARD__`, with in-flight de-duplication so a re-render
  never double-fires the same request.

### 18.3 The trap, again — worse than expected

Department/board/CEO wired cleanly into `scorecards.mjs`'s `dataFor()`/`matrixView()`.
Employee did not: `state.scorecardTab==='employees'` is intercepted by a render override
BEFORE `matrixView()` ever runs, and that override itself had **two dead layers on top of
each other**:

```
v16  renderShell(employeeScorecardPage())        <- dead
v17  render=...renderEmployee()...  (calls employeePage())   <- dead (renderEmployee redeclared)
v18  render=...renderEmployee()...  (calls scorecardPage())  <- LIVE
```

A first attempt patched v16's `employeeScorecardPage()` — a plausible, self-consistent 10-patch
diff that changed nothing on screen, caught only by reading the actual rendered DOM (`sc82-wrap`
+ `data-v18-action` attributes, not v16's `v16-employee-shell`) rather than trusting the diff.
That patch was removed; `scripts/perf-patches/employee-scorecard.mjs` now targets v18's real
`employeeList()` / `rowsFor()` / the matrix section / the toolbar chips instead.

v18's fixture was also the most elaborate found in this module: `employeePresets`/
`state.reviews` synthesised four perspective scores per employee from
`base=Number(r.kpi||80)` blended with a fake review rating and fake competency average via
hardcoded weights and offsets — not a lookup, a formula with no real input anywhere in it.

### 18.4 Verified end to end, in a real browser, with real seeded data

```
Department (Operations, 88% progress goal)     -> "Seeded dept scorecard goal" score=2, weight=100%
Board (contract created, no indicators seeded) -> 5 real sections, honestly 0 / "No Data"
CEO   (contract created, no indicators seeded)  -> 5 real sections, honestly 0 / "No Data"
Employee, self (no contract)                    -> "0 goals linked", "No active performance
                                                     contract found for this..." (the
                                                     backend's own sentence)
Employee, picking a colleague (76% progress)    -> real picker (24 real names), on-demand
                                                     fetch fires, "Seeded employee scorecard
                                                     goal" score=2, status="Requires
                                                     Improvement" - exact match to the seed
```

All probe contracts/goals deleted afterward; the database is back to 0 contracts / 0 goals.

### 18.5 Left deliberately untouched

The v18 employee page's local review-draft/update/publish/evidence/history apparatus
(`V.updates`, `V.notes`, `V.evidence`, `V.products`, the "Record update" / "Add note" / "Add
evidence" / "Publish" modals) is entirely `localStorage`-only and was never wired to a real
API by this or any earlier pass. It already degrades to an honest empty state with no local
data ("No manual updates have been recorded…") and doesn't misrepresent anything as fact, so
it was left as-is — wiring it would mean designing a whole review-write backend, out of scope
for making the READ side real.

### 18.6 Full regression sweep

22-page sweep as sysadmin and as a department manager: fabricated-number counts unchanged
from §17, zero new console errors beyond the expected honest 404s (12 per page now — 9
departments + user + board + ceo, all correctly `available:false` with no crash). Both repos
typecheck clean (backend 0, frontend 997 baseline). Runtime rebuilds byte-identical from a
clean checkout every time — 284 patches, zero missed, zero ambiguous.
