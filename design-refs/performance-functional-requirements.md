# Performance module — functional requirements derived from the UI

**Date:** 8 September 2026
**Companion to:** [`performance-module-map.md`](./performance-module-map.md) (architecture, access, backend inventory)
**Basis:** all 25 declared pages loaded in a browser at 1440×900 as `admin@nts.com`, on a
local dev build (`NEXT_PUBLIC_PORTAL=staff`, port 3130), against the local `arcus_dev`
database. Element counts, headings, table headers, row counts, action ids and owning layer
were captured programmatically per page; database row counts are from a read-only Prisma
probe the same day.

---

## 1. The one-line summary

**Every page in this module is fabricated.** Confirmed by three independent methods:

1. The runtime contains zero `fetch(` calls and zero `/api/` references
   (`performance-module-map.md` §4.1).
2. Clicking **Generate** on Performance Reports fired **zero** network requests
   (fetch + XHR both instrumented). §5.1 below.
3. The browser network panel, filtered to `/api/`, shows the module makes **no** API calls
   at all while in use — the only traffic is `GET /api/homepage/notifications` from the
   shared topbar's notification bell, which is not part of this module.

So there is no "PARTIALLY REAL" tier here. Every element is either
**MOCK / BACKEND EXISTS** (build the wiring) or **MOCK / NO BACKEND** (build the model, or
make it an honest empty state).

---

## 2. Page inventory

Owning layer is the patch generation whose class names actually render the page — established
in-browser, not by reading the source (see `performance-module-map.md` §13.6 for why that
distinction matters).

| # | Page | Route | Owning layer | What it claims | DB reality | Class |
|---|---|---|---|---|---|---|
| 1 | Command Centre | `/performance` | **v240/v242** | 4 KPI tiles, 4 charts, 8 panels ("Enterprise performance trajectory", "Balanced scorecard health", "Business unit comparison", "Rating distribution", "Review cycle", "Heatmap", "Work execution portfolio", "Management action queue") | every source table is empty | MOCK / BACKEND EXISTS |
| 2 | Company Strategy | `/performance/strategy` | v11 + v3 | strategy hero, cascade grid, 25 metric elements | `PerformanceStrategy` **0** | MOCK / BACKEND EXISTS |
| 3 | Strategic Themes | `/performance/themes` | v8 + v10 | "Active themes **4** · All approved for FY2026", "Linked objectives **16** · 4 per theme average" | `PerformanceTheme` **0** | MOCK / BACKEND EXISTS |
| 4 | Enterprise Risk Register | `/performance/risks` | v21 + v22 | "Active risks **5**, 2 high severity", "Above appetite **2**"; table Risk/Category/Owner/Inherent/Residual/Appetite/Trend, **5 rows**; 3 tabs | `RiskAssessment` **0** | MOCK / BACKEND EXISTS (`/api/risk-assessments`) |
| 5 | Performance Scorecards | `/performance/scorecards` | v7.3 + sc8.3 | 16 metric elements, function bar, status line, bulk bar | `PerformanceScorecard` **0** | MOCK / BACKEND EXISTS |
| 6 | Objectives & Key Results | `/performance/objectives` | *(plain `card`)* | OKR list, 3 actions | `PerformanceGoal` **0** | MOCK / BACKEND EXISTS |
| 7 | Tasks & Projects | `/performance/tasks` | v3,v5,v13,v15,v16,v17 | work tabs, task cards; actions `new-task`, `task-detail`, `timesheet` | **`Task` 29 rows — real data exists** | MOCK / BACKEND EXISTS ⚠️ |
| 8 | Performance Contracts | `/performance/contracts` | v10,v11,v13 | "Contract coverage **96%** · **193 of 200 employees**"; table Contract/Employee/Department/Manager/Review period/Weight total/Evidence, **5 rows** | `PerformanceContract` **0**; `Employee` **0**; `User` **30** | MOCK / BACKEND EXISTS |
| 9 | Performance Reviews | `/performance/reviews` | **v12 + v13** | review cycle strip, review layout; tabs Review form / Activity log / Attachments / Audit trail | `PerformanceReview` 0, `PerformanceReviewCycle` 0, `Review` 0 | MOCK / BACKEND EXISTS |
| 10 | Corrective Actions | `/performance/corrective` | v3,v5,v11,v18 | "Open actions **68** (+8%)", "Overdue **14** (+16.7%)"; table ID/Action/Trigger/Owner/Severity/Progress/Target, **5 rows** | **no model anywhere** | MOCK / NO BACKEND |
| 11 | Reports & Compliance | `/performance/reports` | v10 | table Report/Preview/Schedule/Format/Owner/Last run/Status, **6 rows**; tabs Report Library / Compliance Centre / Scheduled Reports | partial — `/api/automated-reporting` exists | MOCK / BACKEND EXISTS (partial) |
| 12 | Document Vault | `/performance/vault` | v3 + v10 | table Document/Folder/Version/Owner/Status/Updated/Retention, **10 rows**; actions `upload-doc`, `new-doc`, `open-doc`, `edit-doc`, `folder` | **no performance-document model** | MOCK / NO BACKEND |
| 13 | Alerts & Escalations | `/performance/alerts` | v3,v10,v11 | "Critical alerts **18** (-12% vs June)", "Escalated items **27** (+8%)"; table Alert/Source/Severity/Owner/Escalation/Elapsed/Status, **6 rows** | **no model** | MOCK / NO BACKEND |
| 14 | Access & Settings | `/performance/access` | v10 | RBAC banner, permission grid; actions `assign-access`, `edit-rbac` | roles exist; no per-module ACL model | MOCK / NO BACKEND |
| 15 | Departments & Business Units | `/performance/departments` | v8 + v10 | "Departments **12** · All active", "Employees **200** · Across 12 units" | **`Department` 9**, `Employee` **0**, `User` 30 | MOCK / BACKEND EXISTS ⚠️ |
| 16 | Integration Mapping | `/performance/integrations` | v8 + v10 | "Connected sources **8** · All core systems online" | `PerformanceSyncSettings` 1, `PerformanceSyncJob` 0 | MOCK / BACKEND EXISTS |
| 17 | KPI Analytics | `/performance/kpi-analytics` | v8,v10,v12,v18,v20 | "Overall completion **76.4%** (+8.7pp)", "Total KPIs **48**" | `KPI` **0** | MOCK / BACKEND EXISTS |
| 18 | KPI Management | `/performance/kpi-management` | v10 + v20 | table Code/KPI/Perspective/Company goal/Owner/Source/Frequency, **4 rows** | `KPI` **0**; hardcoded config **34** — neither is 4 | MOCK / BACKEND EXISTS ⚠️ |
| 19 | BSC Pillars | `/performance/bsc-pillars` | v8 + v10 | pillar split view | `ScorecardPillar` **0** | MOCK / BACKEND EXISTS |
| 20 | Performance Reports | `/performance/performance-reports` | v8,v10,v12 | table Report/Category/Owner/Frequency/Last run/Format, **6 rows**; actions `report-builder`, `preview-report`, `generate-report` | partial | MOCK / BACKEND EXISTS (partial) |
| 21 | Settings | `/performance/settings` | v8,v10,**v245** | `v245-rbac-studio`; rating-scale table Scale/Range/Status, **4 rows** | no settings model | MOCK / NO BACKEND |
| 22 | Timesheets | `/performance/timesheets` | v8,v10,v11,v12,v14 | "Weekly Timesheet — 10–16 Aug 2026", "Logged **36.5h** / Expected **40h** / 91% capture"; grid Project/Task/Mon–Fri, **5 rows** | `Timesheet` 3, `TimesheetEntry` 5 | MOCK / BACKEND EXISTS |
| 23 | Ad-hoc Reports | `/performance/ad-hoc-reports` | — | **dead route** | — | DEAD |
| 24 | Scheduled Reports | `/performance/scheduled-reports` | — | **dead route** | — | DEAD |
| 25 | Report History | `/performance/report-history` | — | **dead route** | — | DEAD |

### 2.1 Three dead routes

`/performance/ad-hoc-reports`, `/performance/scheduled-reports` and
`/performance/report-history` all load and then **client-side redirect to
`/performance/performance-reports`** at ~800 ms. Measured:

```
   0 ms  /performance/report-history
 400 ms  /performance/report-history
 800 ms  /performance/performance-reports     ← bounce
1200 ms  /performance/performance-reports
```

They nevertheless have real `app/performance/**/page.tsx` files, `nav.ts` entries and
`middleware.ts` `routePermissions` entries. The redirect comes from the runtime's
"remove accidental duplicate routes" layer (IIFE at runtime L497). **Decision needed:**
either delete the three routes and their nav/permission entries, or give them real distinct
pages. Until then they are three permission entries guarding nothing.

---

## 3. Numbers that contradict the database *today*

These are the cheapest possible proof that nothing is wired, and the clearest thing to show
anyone who believes the module works. Every figure on the left is on screen right now; every
figure on the right is a `SELECT COUNT(*)` on the same machine.

| Page | On screen | In the database |
|---|---|---|
| Departments | "Departments **12** · All active" | `departments` = **9** |
| Departments | "Employees **200** · Across 12 units" | `employees` = **0** (`users` = 30) |
| Contracts | "**193 of 200 employees**" | `performance_contracts` = **0**, `employees` = **0** |
| KPI Analytics | "Total KPIs **48**" | `kpis` = **0** |
| KPI Management | table shows **4** KPIs | `kpis` = **0**; hardcoded config has **34** |
| Themes | "Active themes **4**" | `performance_themes` = **0** |
| Risk Register | "Active risks **5**" | `risk_assessments` = **0** |
| Alerts | "Critical alerts **18**", "Escalated **27**" | sidebar badge for the same page says **4** |
| Corrective | "Open actions **68**", "Overdue **14**" | no model exists at all |

The Alerts row is also a §8.4 self-contradiction: the sidebar badge (**4**) and the page's own
KPI (**18**) disagree with each other, independent of any database.

---

## 4. Elements that already have a real backing table

Only four, and none is wired:

| UI surface | Real table | Rows | Note |
|---|---|---|---|
| Tasks & Projects | `Task` | **29** | The single best first wiring target — real rows exist today. |
| Departments | `Department` | **9** | Page currently claims 12. |
| Timesheets | `Timesheet` / `TimesheetEntry` | 3 / 5 | Backend already at `/api/accounting/timesheets`. |
| Integrations | `PerformanceSyncSettings` | 1 | Page claims 8 connected sources. |

---

## 5. Write paths

### 5.1 All write buttons are decorative — measured

Instrumented `window.fetch` **and** `XMLHttpRequest.prototype.open`, then clicked
**Generate** on `/performance/reports`:

```
clicked:       "Generate"
networkCalls:  []            ← zero fetch, zero XHR
```

Independently, the browser's own network panel filtered to `/api/` for the whole session on
this module shows only `GET /api/homepage/notifications` (the shared topbar's bell). This is
brief §8.1 in its purest form — except that here it is not one or two surfaces, it is all of
them.

### 5.2 The full action-id surface

Every `data-action` observed across the 25 pages. These are the write paths that will need
real handlers, and they are the allowlist that `lib/performance-v22-mock/actions.ts` will
need once the runtime is patched to emit `matanho:before-action` (which it currently never
does — `performance-module-map.md` F2):

| Page | Action ids |
|---|---|
| dashboard | `quick-report`, `start-review` |
| strategy | *(1, unnamed in capture)* |
| themes / bsc-pillars / departments / integrations / kpi-analytics | `toast-generic`, `v8noop` |
| risks | `v22-managed-row` |
| tasks | `new-task`, `task-detail`, `timesheet` |
| objectives | *(3)* |
| corrective | `new-corrective`, `v5-corrective-row`, `toast-generic` |
| reports | `quick-report`, `report-tab`, `preview-report`, `generate-report`, `v22-managed-row` |
| performance-reports | `report-builder`, `preview-report`, `generate-report` |
| vault | `upload-doc`, `new-doc`, `open-doc`, `edit-doc`, `folder` |
| access | `assign-access`, `edit-rbac`, `toast-generic` |
| kpi-management | `v22-managed-row` |
| settings | `toast-generic`, `v8noop` |

`v8noop` is self-describing: a control wired to a no-op.

---

## 6. Defects found, and defects that did *not* reproduce

### 6.1 Did not reproduce — the documented tab bug

`CLAUDE.md` records a tab-switching bug on **Reviews, Reports and Enterprise Risk Register**
in Performance ("tabbed pages navigate to a different route instead of switching content in
place"). I tested all three by clicking a non-active tab and comparing `location.pathname`
before and after:

| Page | Tabs | Clicked | URL changed? | Result |
|---|---|---|---|---|
| Risk Register | Risk Register / Risk Matrix / Treatment Actions | "Risk Matrix" | **no** | switches in place; active state moved correctly |
| Reviews | Review form / Activity log / Attachments / Audit trail | "Activity log" | **no** | switches in place |
| Reports | Report Library / Compliance Centre / Scheduled Reports | "Compliance Centre" | **no** | switches in place |

**The documented defect does not reproduce on any of the three surfaces in the current
build.** Either it was fixed, or a later patch layer replaced the implementation. `CLAUDE.md`
should be updated. (Separately, the *route-level* redirect in §2.1 is a different thing and
is real.)

### 6.2 Confirmed defects

| # | Defect | Evidence | Brief ref |
|---|---|---|---|
| D1 | Every write button is decorative | §5.1, measured | §8.1 |
| D2 | Every displayed figure is fabricated | §3 | §8.15 |
| D3 | Sidebar badge (4) contradicts the page it links to (18 critical alerts) | §3 | §8.4 / §8.15 |
| D4 | Three routes are dead, but hold permission entries | §2.1, measured redirect | — |
| D5 | KPI read/write split-brain server-side | map §13.1 | §8.12-adjacent |
| D6 | 7 unauthenticated endpoints, live in prod | map §13.3, verified in-container | §8.18 |
| D7 | 213 of 242 endpoints are `authenticate`-only | map §13.2 | §8.18 |
| D8 | Role toggle is cosmetic; its 5 roles match no real user | map §7, §9.2 | §8.17 |
| D9 | `/performance*` bypasses auth entirely | map §6.1 | §8.18 |
| D10 | `getModuleByPath('/performance')` returns the superseded module | map §6.3 | — |
| D11 | "Employee" scope hardcoded to `owner === 'Tariro Moyo'` | map §7 | §8.11 |

---

## 7. Ordered implementation plan

Dependency-ordered. Each step is independently verifiable, and nothing later depends on a
fabricated value from something earlier.

### Step 0 — Make the module safe to put real data in *(blocking; do first)*

Wiring real data into a module that anyone can read without logging in would turn a cosmetic
problem into a disclosure problem. Not optional, and not deployable until done.

1. Add `authenticate` + a permission guard to `performanceBreakdownRoutes.ts` and
   `individualGoalToTaskRoutes.ts` (**D6** — 7 endpoints, live in prod today).
2. Remove `/performance` from `STAFF_PUBLIC_PASS_THROUGH` (**D9**). Note this makes the
   module inconsistent with its siblings, which all still pass through — flagged as an open
   question in the map §11.4.
3. Fix module identity: order `performance-v22` before `performance-management` in
   `MODULE_CONFIG`, or make `getModuleByPath` prefer non-superseded entries (**D10**).
4. Remove the `if (moduleId === "performance-v22") return true;` bypasses and grant
   `performance-v22` properly in `ROLE_PERMISSIONS_MAP` (map §6.4).
5. Decide the fate of the three dead routes (**D4**).

### Step 1 — Make the runtime capable of live data — **DONE 8 Sep 2026, with one caveat**

Applied via `scripts/patch-performance-runtime.mjs` (idempotent, `--check` mode, refuses to
write if an anchor moved). **Never hand-edit the runtime; re-run this after any extract.**

Three patches, +1611 bytes, no markup/styling/copy touched:

| Patch | What |
|---|---|
| `bridge-globals` | `window.__PERF_LIVE__` (`{ready, data, errors}`) + `emitPerfEvent`, injected next to the runtime's own `state` so all ~30 scope-isolated IIFE layers can reach it |
| `handle-before-action` | Cancelable `matanho:before-action` from the single central `handle(action, el)` dispatcher; `preventDefault()` skips the mock handler |
| `after-render` | `matanho:after-render` via `queueMicrotask` so listeners see finished DOM |

New `lib/performance-v22-mock/`: `types.ts`, `adapters.ts`, `live-loaders.ts`, `actions.ts`.
Host wired in `performance-v22-app.tsx` (before-action listener + one-shot live load).

**Verified in-browser as `perf.hr@nts.local` (HR_MGR):**

```
window.__PERF_LIVE__.ready            true
  .data.departments  n=9  error=null  ← real names: Finance, Human Resources, Investments,
                                        IT, Legal, Marketing, Operations, Procurement, Sales
  .data.tasks        n=29 error=null  ← first: "Due diligence — Market & commercial"
window.__PERF_EMIT__                  function

before-action fires:   { action:'quick-report', page:'dashboard', role:'HR/M&E Manager', cancelable:true }
handle() not cancelled: 1 toast   (mock ran)
handle() cancelled:     0 toasts  (mock suppressed)   → suppressionWorks: true
```

Note the loaded department count is **9**, matching the database, against the **12** the page
still displays — the bridge carries correct data; projecting it onto the render layers is
Step 2.

#### ⚠️ Caveat — `handle()` is not the only action path

The runtime registers **32 independent click listeners** (one per patch layer). `handle()`'s
map covers 58 action ids and only 3 markup ids bypass it entirely (`v5-corrective-row`,
`v6-back`, `v6-wizard-next`) — but a layer can *also* listen on the same element, so
cancelling `handle()` does not necessarily suppress every effect of a click. Measured on
`toast-generic`:

```
window.handle('toast-generic') with blocker  ->  0 toasts   (hook works)
clicking the element      with blocker  ->  1 toast    (a layer listener also fired)
```

Consequence for Step 2+: for each write action wired, check whether a layer duplicates it and
patch that layer too. This causes no incorrect behaviour today because `API_ACTIONS` is
empty — nothing is intercepted yet.

<details><summary>Original Step 1 plan (superseded by the above)</summary>

The runtime currently has no hook to attach anything to.

1. Hand-patch (never regenerate) `matanho-performance-runtime.js` to dispatch
   `matanho:before-action` at each write site — mirroring
   `matanho-portfolio-runtime.js` (8 dispatch points) and the accounting runtime (7).
2. Add `API_ACTIONS` interception to `performance-v22-app.tsx`, mirroring
   `investee-portal-v8-app.tsx:22`/`:76`.
3. Create `lib/performance-v22-mock/{types,adapters,live-loaders,actions}.ts` following the
   established convention.
4. Publish loaded data on a `window.__PERF*` global, because the render layers are
   scope-isolated IIFEs and cannot see each other (map §5, §13.6).
5. **For every page, identify its owning layer in-browser before patching it** — the table in
   §2 is that map. Patching the core `dashboard()` or `reviews()` would change nothing.

</details>

### Step 2 — Reference data — **Departments DONE 8 Sep 2026**

Verified live as `perf.hr@nts.local` (HR_MGR) against the local `arcus_dev` database.

| Slot | Before | After | Database |
|---|---|---|---|
| Departments | `12` · All active | **`9`** · All active | 9, all active |
| Employees | `200` · Across 12 units | **`10`** · Assigned across 5 of 9 units | 10 users assigned, 5 units |
| Avg performance | `79.1%` · +3.4pp | `—` · Not yet tracked | no data |
| Capacity used | `78%` · 5 overloaded | `—` · Not yet tracked | no data |
| Scorecards submitted | `12 / 12` · 100% coverage | `—` · Not yet tracked | `performance_scorecards` = 0 |
| Exceptions | `6` · Across 3 units | `—` · Not yet tracked | no model |
| Record grid | 6 invented units + invented leaders | **9 real units** (Finance, Human Resources, Investments, IT, Legal, Marketing, Operations, Procurement, Sales) | 9 |
| Card: Score / Capacity / Active KPIs / projects | `83%` / `78%` / `12` / `8 active` | `—` in every slot | no data |

Layout, class names, copy and iconography unchanged — only values differ.

**Error state is distinct from empty state.** With the API unreachable the same page reads
`—` · *Unavailable*, not `0` · *None yet*. A failed lookup must never be presentable as a
confirmed zero; both were verified by taking the backend down and bringing it back.

**Two defects found in my own work while verifying, both fixed:**

1. *Data loaded but never displayed.* The module renders once immediately; the host's fetch
   resolves a few hundred ms later into a bridge nothing re-reads. The page showed
   "Unavailable" while `__PERF_LIVE__` held all 9 departments. Fixed by the
   `live-data-rerender` patch — a one-time listener on `matanho:live-data` calling the
   runtime's own `render()`.
2. *Real data in a slot labelled for something else.* Member counts were written into the
   card's 5th column, which the markup labels **"Active KPIs"** — so Finance displayed
   "Active KPIs 1" when that 1 was a person. Real data under the wrong label is still a
   fabrication. Headcount now appears only in the Employees KPI card, which is the one slot
   actually labelled for it; the card column is a dash until a KPI read path exists.

Remaining in Step 2: BSC Pillars, KPI Management / Analytics, Strategy / Themes.

### Step 2 continued — Themes and KPI Analytics — **DONE 8 Sep 2026**

Both are headline-number pages over domains that are completely empty (0 themes, 0 KPIs,
0 goals), so every figure on them was a literal. Now wired to real endpoints; they show an
honest empty state today and fill in as users create records.

**Strategic Themes** (`/performance/themes`, v8 layer)

| Slot | Before | After |
|---|---|---|
| Active themes | `4` · All approved for FY2026 | **`0`** · None created yet |
| Linked objectives | `16` · 4 per theme average | **`0`** · None created yet |
| Alignment | `86.4%` · +4.7pp vs FY2025 | `—` · Not yet tracked |
| At-risk themes | `1` · Operational Excellence | `—` · Not yet tracked |
| Evidence coverage | `94%` · Across theme KPIs | `—` · Not yet tracked |
| Executive reviews | `4 / 4` · Quarterly owners assigned | `—` · Not yet tracked |
| Theme cards | 4 invented themes + invented owners | 0 records |

**KPI Analytics** (`/performance/kpi-analytics`, v8/v20 layers)

| Slot | Before | After |
|---|---|---|
| Overall completion | `76.4%` · +8.7pp (with a fake sparkline) | `—` · Not yet tracked |
| Total KPIs | `48` · No net change | **`0`** · None created yet |
| On track / At risk / Off track | `32` / `10` / `6` | `—` each · Not yet tracked |
| Evidence current | `94%` · 3 require approval | `—` · Not yet tracked |

**Loader now covers 7 scopes**: departments, tasks, kpis, pillars, themes, strategies, goals
— all verified returning 200 with the envelopes measured on the day
(`/api/kpis` → `{success,count,kpis}`; pillars → `{success,data}`;
strategies/themes → `{success,message,data,timestamp}`; goals → `{success,count,goals}`).

**KPI reads use `/api/kpis`, never `/api/performance/kpis`** — the latter serves 34 rows from
`src/config/hardcodedKPIs.ts` while writes to the same path land in the `kpis` table, so
reading it would show fixtures and permanently hide anything a user creates (map §13.1).

#### Not done in this pass, and why

**KPI Management** (`/performance/kpi-management`) is still on fixtures. Its live renderer is
the v20 layer's `kpiPage()`, backed by a `V` store that is **rehydrated from `localStorage`**
and seeded with `seedKpis`:

```js
let V={...defaults};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');
  if(s)V=Object.assign({},defaults,s,{kpis:Array.isArray(s.kpis)?s.kpis:seedKpis,...})
```

That is brief §8.8 exactly — stale state surviving reloads and new tabs. Projecting live data
into `V` without also handling persistence would create a cache that silently diverges from
the database, which is a worse defect than the fixture it replaces. It needs the write path
designed alongside, so it is queued with Step 4 rather than half-done here.

**BSC Pillars** and **Company Strategy** are loaded into the bridge (`pillars`, `strategies`)
but their renderers are not yet patched — the data is available, the projection is not
written.

### Step 2 (original plan) — Reference data (read paths, no dependencies)

| Order | Surface | Endpoint | Note |
|---|---|---|---|
| 2.1 | Departments | `GET /api/departments` | 9 real rows; fixes "12" → 9 |
| 2.2 | BSC Pillars | `GET /api/performance/scorecard-pillars` | 0 rows — seed the 4 standard pillars as the only structural default |
| 2.3 | KPI Management / Analytics | `GET /api/kpis` **not** `/api/performance/kpis` | avoids **D5** |
| 2.4 | Strategy / Themes | `/api/performance/config` | 0 rows → honest empty states |

### Step 3 — Tasks & Projects — **DONE 8 Sep 2026**

Verified live as `perf.hr@nts.local` against `arcus_dev` (29 tasks: 25 `completed`, 4 `todo`,
0 overdue).

| Element | Before | After | Database |
|---|---|---|---|
| Kanban lanes | 6 invented tasks (T-101…) | **To Do 4 · In Progress 0 · In Review 0 · Complete 25** | exactly matches |
| Task cards | 6 fixtures | **29 real tasks** ("Due diligence — Market & commercial", …) | 29 |
| Active tasks | `26` | **4** | 29 − 25 complete |
| Due this week | `8` | `—` | see note |
| Overdue | `3` | **0** | `isOverdue` = false on all 29 |
| Completion rate | `68%` | **86%** | 25/29 |
| Card project / goal / owner / progress | invented | `—` where unbacked | no source |

**Approach:** the projection replaces `state.tasks` itself rather than any one renderer, so
all 8+ consumers (lanes, counts, detail drawer, employee filter) get real rows from a single
patch. In Progress and In Review render empty because no task holds those stages — that is
the truth, not a gap.

**"Due this week" is deliberately left as `—`.** The API returns `date` as a UTC ISO string
and every real user here is UTC+2, so bucketing it into a local week is exactly the
date-shift trap that files entries under the wrong day. It gets wired when there is a tested
date helper. **Overdue is real**, because `isOverdue` is computed server-side — no client
date maths involved.

**Two defects found while verifying, both fixed:**

1. **`null%` on every card.** The v5 layer *reassigns* `taskCard` at runtime L2487 (the
   earlier `function taskCard` declaration is dead code), and it prints `${t.progress}%`.
   The API has no progress field, so a live task carried null and the card rendered a
   literal "null%".
2. **A green bar for an unknown value.** The same card sizes its progress bar with
   `t.progress<45?'red':t.progress<70?'amber':'emerald'`. For null both comparisons are
   false, so it picked **emerald** — a green zero-length bar, i.e. an "all good" signal for
   a number we do not have.

Both now render as unknown. Page-wide check: **0 occurrences of null/undefined/NaN** in the
rendered text on Tasks, Departments and the Command Centre.

### Step 3 (original plan) — Records with real data today

| Order | Surface | Endpoint | Note |
|---|---|---|---|
| 3.1 | **Tasks & Projects** | `GET /api/tasks` | 29 real rows — the first page that can show something true |
| 3.2 | Timesheets | `GET /api/accounting/timesheets` | 3 + 5 real rows |

### Step 4 — Empty-but-real domains (CRUD, honest empty states)

Objectives/Goals · Scorecards · Contracts · Reviews & Cycles · Risk Register. All have
models, tables and mounted routes; all have zero rows. Per your direction, these are **CRUD
for users to populate** — so the deliverable is working create/edit/list against real
endpoints plus a real empty state, **not** seeded content.

### Step 5 — Domains with no model at all

Corrective Actions · Alerts & Escalations · Document Vault · Settings (rating scales) ·
per-module Access ACL. Each needs a decision: build the model (Prisma + idempotent raw-SQL
migration + service + controller + mounted route + permission keys), or replace with an
honest empty state. My default recommendation, given "it's just CRUD": build Corrective
Actions and Document Vault (both have clear analogues already in the codebase —
`accounting_documents`, `fund_documents`); make Alerts derived rather than stored; defer
Settings and the ACL until the role model in §8 is settled.

### Step 6 — Rollups last

Command Centre, KPI Analytics and the scorecard heatmaps are aggregates. They can only be
correct once Steps 2–5 supply their components, and they are the ones most likely to show
`NaN%` on division by zero when the real data is sparse (brief §8.10) — every ratio needs a
guard.

---

## 8. What still needs your decision

1. **The three dead routes** (§2.1) — delete, or build out?
2. **The public pass-through** (Step 0.2) — remove for this module alone, or leave until the
   whole client-design family is done together?
3. **Corrective Actions / Alerts / Vault** (Step 5) — build the models, or honest empty
   states for now?
4. **The demo role toggle** — keep as a display-only preview with real server-side scoping,
   or remove it now that real users exist per tier?

None of these blocks Step 0 or Step 1, so I can proceed with those regardless.
