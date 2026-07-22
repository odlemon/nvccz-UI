# Performance Module — Current State Reference

> **Purpose:** Snapshot of the live `/performance` module (UI structure + API wiring) as of **2026-07-22**, before replacing the UI with a new design + hardcoded data. Use this file later to re-wire APIs the same way (or better).
>
> **Live URL:** https://dev.arcus.co.zw/performance
>
> **Module id:** `performance-management` (permission-gated via `ModuleGuard`)

---

## How to use this doc during redesign

1. **Replace UI** with the new design + hardcoded fixtures — keep routes/nav ids stable if possible so permissions still work.
2. When re-integrating APIs, use each section’s **API client**, **endpoints**, and **Redux slice** tables below as the contract map.
3. Prefer the **typed clients** under `lib/api/*` over ad-hoc `apiClient` calls (some screens still bypass the typed layer).
4. Do **not** port forward known bugs / dead files listed in [Known issues & cleanup](#known-issues--cleanup).

---

## Architecture overview

```
app/performance/**/page.tsx
  └─ ModuleGuard (moduleId="performance-management", subModuleId=…)
       └─ PerformanceLayout
            ├─ PerformanceSidebar          (from lib/config/modules.ts)
            ├─ SharedTopbar
            ├─ GlobalRealtimeMount         (socket → notifications/tasks)
            └─ Screen component            (components/performance/…)
                 └─ Redux thunks / typed API clients (lib/api/*)
```

| Layer | Location |
|---|---|
| Routes | `app/performance/**/page.tsx` |
| Layout / sidebar | `components/layout/performance-layout.tsx`, `performance-sidebar.tsx` |
| Nav config | `lib/config/modules.ts` → `performance-management` |
| Screen UI | `components/performance/**` |
| API clients | `lib/api/performance-*.ts`, `goal-api.ts`, `kpi-api.ts`, `department-api.ts`, `scorecard-service.ts` |
| State | Redux Toolkit slices under `lib/store/slices/` (no React Query in this module) |

---

## 1. Navigation / sidebar

**Config source:** `lib/config/modules.ts` (`id: "performance-management"`)  
**Sidebar:** `components/layout/performance-sidebar.tsx` — filters by `hasSubModuleAccess`, highlights by `pathname`.

### Top-level items

| Label | Path | Sub-module id |
|---|---|---|
| Dashboard | `/performance` | `performance-dashboard` |
| Company Strategy | `/performance/configuration/strategy` | `config-strategy` |
| Themes | `/performance/configuration/themes` | `config-themes` |
| Performance Contracts | `/performance/contracts` | `performance-contracts` |
| Goals | `/performance/goals` | `goals-management` |
| Tasks | `/performance/tasks` | `tasks-management` |
| Reviews | `/performance/reviews` | `performance-reviews` |

### Group: Scorecards

| Label | Path | Sub-module id |
|---|---|---|
| Org BSC | `/performance/org-bsc` | `org-bsc` |
| Department Scorecards | `/performance/department-scorecards` | `department-scorecards` |
| Board Scorecards | `/performance/board-scorecards` | `board-scorecards` |
| CEO Scorecards | `/performance/ceo-scorecards` | `ceo-scorecards` |
| Employee Scorecards | `/performance/user-scorecards` | `user-scorecards` |

### Group: Configuration

| Label | Path | Sub-module id |
|---|---|---|
| KPI Management | `/performance/kpis` | `kpi-management` |
| BSC Entry | `/performance/tasks?tab=bsc-entry` | `bsc-entry` |
| Workflow History | `/performance/tasks?tab=workflow` | `workflow-history` |
| Departments | `/performance/departments` | `departments-management` |
| BSC Pillars | `/performance/configuration/pillars` | `config-pillars` |

### Routes that exist but have **no sidebar entry**

| Path | Notes |
|---|---|
| `/performance/bsc-operations` | Duplicate hub (Contracts + BSC Entry + Workflow) — orphan |
| `/performance/cycles` | Cycles also live inside Reviews hub |
| `/performance/reports` | Reports also live inside Reviews hub |
| `/performance/notifications` | Feed page; bell lives in topbar via collaboration components |
| `/performance/configuration` | Shell; real tabs are strategy/themes/pillars |

---

## 2. Route map

| Path | Page file | Main component |
|---|---|---|
| `/performance` | `app/performance/page.tsx` | `PerfomanceDashboardV2` |
| `/performance/goals` | `app/performance/goals/page.tsx` | `GoalsManagement` |
| `/performance/kpis` | `app/performance/kpis/page.tsx` | `KPIManagement` |
| `/performance/tasks` | `app/performance/tasks/page.tsx` | `TaskManagement` (tabs via `?tab=`) |
| `/performance/reviews` | `app/performance/reviews/page.tsx` | `ReviewsManagement` |
| `/performance/reviews/[id]` | `app/performance/reviews/[id]/page.tsx` | `ReviewForm` |
| `/performance/contracts` | `app/performance/contracts/page.tsx` | `PerformanceContractsManagement` |
| `/performance/cycles` | `app/performance/cycles/page.tsx` | `ReviewCyclesManager` |
| `/performance/departments` | `app/performance/departments/page.tsx` | `DepartmentManagement` |
| `/performance/notifications` | `app/performance/notifications/page.tsx` | `NotificationsFeedPage` |
| `/performance/reports` | `app/performance/reports/page.tsx` | Rating distribution / analytics |
| `/performance/department-scorecards` | `app/performance/department-scorecards/page.tsx` | `DepartmentScorecardPage` |
| `/performance/board-scorecards` | `app/performance/board-scorecards/page.tsx` | `ContractScorecardPage` (`type="BOARD"`) |
| `/performance/ceo-scorecards` | `app/performance/ceo-scorecards/page.tsx` | `ContractScorecardPage` (`type="CEO"`) |
| `/performance/user-scorecards` | `app/performance/user-scorecards/page.tsx` | `UserScorecardPage` |
| `/performance/org-bsc` | `app/performance/org-bsc/page.tsx` | `OrgBscPage` |
| `/performance/bsc-operations` | `app/performance/bsc-operations/page.tsx` | `PerformanceBscOperations` (orphan) |
| `/performance/configuration` | `app/performance/configuration/page.tsx` | Config tabs shell |
| `/performance/configuration/strategy` | `…/strategy/page.tsx` | Strategy / vision |
| `/performance/configuration/themes` | `…/themes/page.tsx` | Strategic themes |
| `/performance/configuration/pillars` | `…/pillars/page.tsx` | Pillar + goal weights |

---

## 3. Screens — part by part

### 3.1 Dashboard — `/performance`

| | |
|---|---|
| **Page** | `app/performance/page.tsx` |
| **UI** | `components/performance/perfomance-dashboard-v2.tsx` |
| **Skeleton** | `performance-dashboard-skeleton.tsx` |
| **Related** | `configuration/vision-banner.tsx`, `kpi-performance-analysis-tab.tsx` |
| **Slice** | `performanceSlice` → `fetchPerformanceDashboard` |

**UI sections (current design)**

1. Month / year filter selects
2. View switch: **Dashboard** ↔ **KPI Analytics**
3. Summary cards (pending / in-progress / completed / completion rate — shape may be nested object with `value`, `changePercent`, `progressPercent`, `ratioText`)
4. Monthly productivity bar chart (Recharts)
5. Performance distribution pie chart
6. Worker performance insight list
7. Budget tracker (totals + line items)
8. Employee of the Month card
9. Vision banner (config vision statement)
10. KPI Analytics tab content

**API**

| Client method | Endpoint | Notes |
|---|---|---|
| `performanceApi.getDashboard({ month, year })` | `GET /performance/dashboard?month=&year=` | Via Redux thunk |
| `performanceApi.getKPIAnalytics(…)` / `kpiApiService.getKPIAnalytics` | `GET /performance/analytics/kpi?…` | KPI Analytics tab |

**Types:** `PerformanceDashboardData` and helpers in `lib/api/performance-api.ts`  
(`SummaryCard`, `MonthlyProductivityPoint`, `PerformanceDistribution`, `WorkerPerformance`, `BudgetTrackerItem`, `BudgetData`, `EmployeeOfMonth`)

**Re-wire tip:** Component already tolerates both flat and nested (`rawData.data`) responses. Match whatever BE returns, or normalize in the thunk.

---

### 3.2 Goals — `/performance/goals`

| | |
|---|---|
| **Page** | `app/performance/goals/page.tsx` (also prefetches `fetchAvailableDepartments`) |
| **UI** | `components/performance/goals-management.tsx` |
| **Forms / drawers** | `goal-form-modal.tsx`, `goal-view-drawer.tsx` (+ `goal-view-drawer/*`), `department-breakdown-modal.tsx`, `individual-breakdown-modal.tsx`, `goal-confirm-delete-modal.tsx`, `goal-pillar-theme-filters.tsx` |
| **Client** | `goalApiService` (`lib/api/goal-api.ts`) |
| **Slice** | `performanceSlice` (goals thunks) |

**UI sections**

- Filter bar: search, status, department, scorecard pillar, assigned-to, parent goal, pillar, strategic theme
- Collapsible goal groups by type (Company / Department / Individual)
- Goal cards with progress
- Detail drawer: rollup summary + department/individual breakdown
- Create / edit modal; delete confirm; breakdown wizards

**API**

| Method | Endpoint |
|---|---|
| `getGoals` | `GET /performance/goals` |
| `getGoal` | `GET /performance/goals/{goalId}` |
| `createGoal` | `POST /performance/goals` |
| `updateGoal` | `PATCH /performance/goals/{goalId}` |
| `deleteGoal` | `DELETE /performance/goals/{goalId}` |
| `getGoalsByKpi` | `GET /performance/goals/by-kpi/{kpiId}` |
| `breakdownToDepartments` | `POST /performance/breakdown/departments` |
| `getUsersForBreakdown` | `GET /performance/breakdown/users/{departmentName}` |
| `breakdownToIndividuals` | `POST /performance/breakdown/individuals` |
| `recalculateRollup` | `POST /performance/rollup/{goalId}/recalculate` |
| `getGoalRollup` | `GET /performance/rollup/{goalId}` |
| `getGoalActivities` | `GET /activities/goal/{goalId}` |

**Cleanup note:** `lib/api/goals-data.ts` hardcodes an IP base URL + JWT and exposes `goalsDataService` (only used by orphaned `activity-logs.tsx`). However the live `goal-view-drawer.tsx` (and a few dead drawer variants) still import the **`Goal` type** from that file. Before deleting `goals-data.ts`, move `Goal` (and any shared types) into `goal-api.ts`.

---

### 3.3 KPIs — `/performance/kpis`

| | |
|---|---|
| **UI** | `components/performance/kpi-management.tsx`, `kpi-form.tsx`, `kpi-card.tsx`, `kpi-view-modal.tsx`, `confirm-delete-modal.tsx` |
| **Client** | `kpiApiService` (`lib/api/kpi-api.ts`) |
| **Also** | `performanceConfigApi.getScorecardPillars()` for pillar linkage in form |

**UI sections**

- Statistics cards
- KPI overview table / list
- Financial KPIs area
- Filters: department, account type
- Create / edit / delete / view

**API**

| Method | Endpoint |
|---|---|
| CRUD | `GET/POST /kpis`, `GET/PUT/DELETE /kpis/{id}` |
| Available / list (perf) | `GET /performance/kpis` |
| By department | `GET /performance/kpis/department/{departmentName}` |
| By account type | `GET /performance/kpis/account-type/{accountType}` |
| Statistics | `GET /performance/kpis/statistics` |
| Financial | `GET /performance/kpis/financial` |
| Analytics | `GET /performance/analytics/kpi` |
| Dashboard analytics | `GET /performance/analytics/dashboard` |
| Dept comparison | `GET /performance/analytics/departments/comparison` |

**Note:** Display labels for KPI fields are hardcoded in the UI (not schema-driven).

---

### 3.4 Tasks (+ BSC Entry / Workflow tabs) — `/performance/tasks`

| | |
|---|---|
| **UI shell** | `components/performance/task-management.tsx` |
| **My / Dept views** | `task-board-view.tsx`, `task-board-view-enhanced.tsx`, `task-list-view.tsx`, `task-card.tsx`, `task-form-modal.tsx`, kanban/* |
| **BSC Entry** | `bsc-entry-tab.tsx` (`?tab=bsc-entry`) |
| **Workflow** | `workflow-tab.tsx` (`?tab=workflow`) |
| **Chat** | `collaboration/task-chat-panel.tsx`, mentions, chat message/bubble |
| **Clients** | `performanceTasksApi`, `performanceBscApiService` |
| **Slices** | `performanceTasksSlice`, BSC bits in `performanceSlice` |

**Sub-views**

| Tab / mode | Query | What it does |
|---|---|---|
| My Tasks | default | Personal kanban/list |
| Department Tasks | — | Dept kanban/list |
| BSC Entry | `?tab=bsc-entry` | Metric recording forms (sidebar deep-link) |
| Workflow History | `?tab=workflow` | Budget variance, statutory, training cert |

**Task actions:** create/edit/delete, drag stage change, bulk stage/status, attachments, comments/mentions.

#### Tasks API (`lib/api/performance-tasks-api.ts`)

| Method | Endpoint |
|---|---|
| `getMyTasks` | `GET /tasks/my` |
| `getDepartmentTasks` | `GET /tasks` |
| `getTask` | `GET /tasks/{id}` |
| `createTask` / `updateTask` / `deleteTask` | `POST/PUT/DELETE /tasks[/{id}]` |
| `updateStage` | `PUT /tasks/{id}/stage` |
| `bulkUpdateStage` | `PUT /tasks/bulk/stage` |
| `bulkStatusUpdate` | `POST /tasks/bulk/status-update` |
| Attachments | `POST /tasks/{id}/attachments`, `…/attachments/base64` |
| Mentions | `GET /tasks/{id}/mention-suggestions` |
| Comments | `GET/POST /tasks/{id}/comments`, `DELETE /tasks/{taskId}/comments/{commentId}` |

#### BSC Entry API (`lib/api/performance-bsc-api.ts`) — all `POST`

| Method | Endpoint |
|---|---|
| `recordFinancialOutcomeRoi` | `/performance/bsc-entry/financial-outcome-roi` |
| `recordInternalProcessFundingRate` | `/performance/bsc-entry/internal-process-funding-rate` |
| `recordStakeholderSurvey` | `/performance/bsc-entry/stakeholder-survey` |
| `recordPartnershipsSigned` | `/performance/bsc-entry/partnerships-signed` (FormData) |
| `recordServiceDeliveryCustomerCharter` | `/performance/bsc-entry/service-delivery-customer-charter` (FormData) |
| `recordJobsCreatedAggregate` | `/performance/bsc-entry/jobs-created-aggregate` |
| `recordResourceBudgetAlignment` | `/performance/bsc-entry/resource-budget-alignment` |
| `recordInclusionDiversityReporting` | `/performance/bsc-entry/inclusion-diversity-reporting` |
| `recordAccountingPeriodFromGl` | `/performance/bsc-entry/accounting-period-from-gl` |
| `recordStatutoryReportsOutput` | `/performance/bsc-entry/statutory-reports-output` (FormData) |
| `recordGovernanceChecklistScore` | `/performance/bsc-entry/governance-checklist-score` |
| `recordProcurementPlanCompliance` | `/performance/bsc-entry/procurement-plan-compliance` |
| `recordEaseOfDoingBusinessProgress` | `/performance/bsc-entry/ease-of-doing-business-progress` |
| `recordSkillsDevelopmentProgress` | `/performance/bsc-entry/skills-development-progress` |
| `recordCsrParticipationRate` | `/performance/bsc-entry/csr-participation-rate` |

#### Workflow API

| Method | Endpoint |
|---|---|
| `createBudgetVarianceReport` | `POST /performance/bsc-workflow/budget-variance-reports` |
| `getBudgetVarianceReportsByGoal` | `GET …/budget-variance-reports/by-goal/{goalId}` |
| `createStatutorySubmission` | `POST /performance/bsc-workflow/statutory-submissions` (FormData) |
| `managerSignOffStatutorySubmission` | `POST …/statutory-submissions/{id}/manager-sign-off` |
| `getStatutorySubmissionsByGoal` | `GET …/statutory-submissions/by-goal/{goalId}` |
| `recordTrainingCertificate` | `POST /performance/bsc-workflow/training-certificate-recorded` |

**Bugs to fix before / during re-wire (do not copy):**

1. `bsc-entry-tab.tsx` calls non-existent methods: `submitBscFundingResources`, `submitBscBudgetAlignment`, `submitBscCustomerSatisfaction` — use the `record*` methods above (or add BE aliases).
2. `workflow-tab.tsx` dispatches a raw API Promise instead of the `createBscBudgetVarianceReport` thunk.

---

### 3.5 Reviews — `/performance/reviews` (+ `[id]`, cycles, reports)

| | |
|---|---|
| **Hub** | `components/performance/reviews/reviews-management.tsx` (tabs: Reviews / Cycles / Reports) |
| **List / create** | `review-list.tsx`, `review-create-dialog.tsx` |
| **Cycles** | `review-cycles-manager.tsx` (also standalone `/performance/cycles`) |
| **Detail form** | `review-form.tsx` → `/performance/reviews/[id]` |
| **Chart** | `rating-distribution-chart.tsx` |
| **Client** | `performanceReviewsApi` |
| **Slice** | `performanceReviewsSlice` |

**Actions:** create review, create/initiate/delete cycle, submit stage, finalize, view rating distribution.

**API** (`lib/api/performance-reviews-api.ts`)

| Method | Endpoint |
|---|---|
| `getCycles` | `GET /performance/review-cycles?isActive=true&page=1&limit=100` |
| `createCycle` | `POST /performance/review-cycles` |
| List reviews / my / to-complete | `GET /performance-reviews?…` |
| `getReview` | `GET /performance-reviews/{id}` |
| `submitStage` | `POST /performance-reviews/{id}/complete-stage` |
| `finalizeReview` | `POST /performance-reviews/{id}/finalize` |
| `getRatingDistribution` | `GET /performance-reviews/reports/rating-distribution?…` |

**Extra direct `apiClient` calls (not on typed service):**

- Create review: `POST /performance-reviews`
- Initiate cycle: `POST /performance-reviews/cycles/{id}/initiate`
- Delete cycle: `DELETE /performance/review-cycles/{id}`

**Contract note:** mixed bases `/performance-reviews/*` vs `/performance/review-cycles/*` — normalize with BE when re-wiring.

**Types:** `ReviewCycle`, `ReviewSummary`, `ReviewDetail`, `ReviewPillarFeedback`, `ReviewStage`, `RatingDistribution`

---

### 3.6 Performance Contracts — `/performance/contracts`

| | |
|---|---|
| **UI** | `performance-contracts-management.tsx` |
| **PDF** | `performance-contract-pdf-document.tsx` |
| **Related** | `contract-qualitative-modal.tsx`, `scorecard-edit-drawer.tsx` |
| **Client** | `performanceBscApiService`, `scorecardApiService.getEmployeesForGeneration` |

**UI sections**

- Contract list + filters (type: Board / CEO / Department / Employee, status, department)
- Create forms per type
- PDF export
- Qualitative evaluation modal / scorecard edit drawer

**API**

| Method | Endpoint |
|---|---|
| `createBoardContract` | `POST /performance/contracts/board` |
| `createCeoContract` | `POST /performance/contracts/ceo` |
| `createDepartmentContract` | `POST /performance/contracts/department` |
| `createEmployeeContract` | `POST /performance/contracts/employee` |
| `fetchPerformanceContracts` | `GET /performance/contracts?…` |
| `getEmployeesForGeneration` | `GET /performance/scorecards/employees-for-generation?periodLabel=` |

---

### 3.7 Departments — `/performance/departments`

| | |
|---|---|
| **UI** | `department-management.tsx`, `department-view-drawer.tsx`, `department-form.tsx` |
| **Client** | `departmentApiService` |

**UI sections**

- Hardcoded category buckets: Executive / Core / Support (by literal department names)
- Search, department cards, view drawer
- Icon/color mapping hardcoded

**API used here**

| Method | Endpoint |
|---|---|
| `getAvailableDepartments` | `GET /performance/breakdown/departments/available` |

**Also on client (mostly other modules / unused here):** CRUD on `/departments`, plus convenience `POST /performance/goals` and `POST /tasks`.

---

### 3.8 Notifications — `/performance/notifications`

| | |
|---|---|
| **Feed page** | `collaboration/notifications-feed-page.tsx` |
| **Topbar bell** | `collaboration/notifications-bell.tsx` |
| **Realtime** | `collaboration/global-realtime-mount.tsx` (mounted in layout) |
| **Client** | `performanceNotificationsApi` |
| **Slice** | `notificationsSlice` |

**UI:** All / Unread tabs, mark one / mark all read, click-through to linked entity.

**API**

| Method | Endpoint | Verb (live) |
|---|---|---|
| `list` | `/homepage/notifications?…` | `GET` |
| `markRead` | `/homepage/notifications/{id}/read` | `PUT` |
| `markAllRead` | `/homepage/notifications/read-all` | `PUT` |

Socket events push into `pushNotificationFromSocket`.

---

### 3.9 Scorecards

Shared PDF letterhead: `pdf-letterhead.tsx`. Shared edit drawer: `scorecard-edit-drawer.tsx`. Client: `scorecardApiService` (`lib/api/scorecard-service.ts`). Slice: `scorecardSlice` for department + user fetches.

#### Org BSC — `/performance/org-bsc`

- **UI:** `org-bsc-page.tsx` — overall score, pillar cards, alerts, strategic alignment, PDF
- **API:** `getOrgBscScorecard({ periodLabel })` → `GET /performance/scorecards/org-bsc`
- **Types:** `OrgBscScorecard`, `OrgBscPillar`, `OrgBscGoal`

#### Department — `/performance/department-scorecards`

- **UI:** `department-scorecard-page.tsx`, drawer(s), qualitative modal, PDF
- **API:**

| Method | Endpoint |
|---|---|
| `getDepartmentScorecard` | `GET /performance/scorecards/department/{name}` |
| `generateDepartmentScorecard` | `POST …/department/{name}/generate` |
| `getDepartmentScorecardById` | `GET …/department/by-id/{id}` |
| `generateDepartmentScorecardById` | `POST …/department/byid/{id}/generate` *(note casing)* |
| Qualitative / persisted / edit | `PUT …/qualitative-evaluation`, `GET …/persisted`, `PUT …/edit` |

#### Board / CEO — `/performance/board-scorecards`, `/ceo-scorecards`

- **UI:** shared `contract-scorecard-page.tsx` (`type="BOARD" | "CEO"`), balanced scorecard view, heat-map legend, qualitative modal, PDF
- **API:** `get/generate` on `/performance/scorecards/board` and `/ceo`; qualitative + persisted + edit variants; contract create via BSC API

#### Employee — `/performance/user-scorecards`

- **UI:** `user-scorecard-page.tsx`, drawer(s), qualitative modal, PDF; goals/tasks lists + status charts; employee picker when permitted
- **API:** `getUserScorecard` → `GET /performance/scorecards/user`; `getEmployeeScorecard` / `generateEmployeeScorecard` → `/employee/{id}`; qualitative / persisted / edit; `getEmployeesForGeneration`

**Orphaned (do not use):** `department-scorecards.tsx` and `user-scorecards.tsx` call legacy `/performance-scorecards/…` paths.

---

### 3.10 Configuration

**Shell:** `configuration-tabs.tsx` — client-side tabs → strategy / themes / pillars.

#### Strategy — `/performance/configuration/strategy`

- **UI:** `strategy-uploader.tsx`, `vision-banner.tsx` / `vision-statement-card.tsx`
- **API** (`performanceConfigApi`):

| Method | Endpoint |
|---|---|
| `getVisionStatement` | `GET /performance/config/vision-statement` |
| `getStrategies` / `getStrategy` | `GET /performance/config/strategies[/{id}]` |
| `createStrategy` / `updateStrategy` | `POST/PUT …/strategies[/{id}]` |
| `archiveStrategy` | `POST …/strategies/{id}/archive` |
| `getArchives` | `GET …/strategies/archives` |
| `uploadStrategyDocument` | `POST …/strategies/{id}/document` |

#### Themes — `/performance/configuration/themes`

- **UI:** `strategic-themes-manager.tsx`
- **API:** `GET/POST /performance/config/themes`; `GET/POST /performance/config/themes/{id}/goals`

#### Pillars — `/performance/configuration/pillars`

- **UI:** `pillar-weights-editor.tsx`, `goal-weights-editor.tsx`, goal pickers
- **API:**

| Method | Endpoint |
|---|---|
| `getPillarConfig` | `GET /performance/config/pillars` |
| `getScorecardPillars` / one | `GET /performance/scorecard-pillars[/{id}]` |
| `setPillarWeights` | `PUT /performance/scorecard-pillars/weights` |
| Update / delete pillar | `PUT/DELETE /performance/scorecard-pillars/{id}` |
| Company goal (line) weights | `GET/POST …/{pillarId}/company-goal-line-weights` / `company-goal-weights` |
| `updateGoalScorecardMetadata` | `PUT /performance/config/goals/{goalId}` |

---

### 3.11 BSC Operations (orphan) — `/performance/bsc-operations`

- **UI:** `performance-bsc-operations.tsx` — consolidated Contracts / BSC Entry / Workflow
- **Same APIs** as §§3.4 and 3.6
- Not in sidebar; decide keep / merge / delete during redesign

---

## 4. API clients cheat-sheet

| File | Base areas | Export |
|---|---|---|
| `lib/api/performance-api.ts` | `/performance/dashboard`, `/performance/analytics/kpi` | `performanceApi` |
| `lib/api/goal-api.ts` | `/performance/goals`, breakdown, rollup, activities | `goalApiService` |
| `lib/api/kpi-api.ts` | `/kpis`, `/performance/kpis`, analytics | `kpiApiService` |
| `lib/api/department-api.ts` | `/departments`, available breakdown depts | `departmentApiService` |
| `lib/api/performance-tasks-api.ts` | `/tasks*` | `performanceTasksApi` |
| `lib/api/performance-bsc-api.ts` | bsc-entry, bsc-workflow, contracts | `performanceBscApiService` |
| `lib/api/performance-reviews-api.ts` | review-cycles, performance-reviews | `performanceReviewsApi` |
| `lib/api/performance-config-api.ts` | config + scorecard-pillars | `performanceConfigApi` |
| `lib/api/performance-notifications-api.ts` | `/homepage/notifications*` | `performanceNotificationsApi` |
| `lib/api/scorecard-service.ts` | `/performance/scorecards/*` | `scorecardApiService` |
| `lib/api/performance-data.ts` | mostly **mock** / delegated | Prefer not to use for new wires |
| `lib/api/goals-data.ts` | **dead + hardcoded credentials** | Delete; do not use |

---

## 5. Redux slices

| Slice | File | Owns |
|---|---|---|
| `performanceSlice` | `lib/store/slices/performanceSlice.ts` | Dashboard, KPIs, goals, departments-available, many BSC ops |
| `performanceTasksSlice` | `…/performanceTasksSlice.ts` | My + department kanban/list tasks |
| `performanceReviewsSlice` | `…/performanceReviewsSlice.ts` | Cycles, reviews, rating distribution |
| `scorecardSlice` | `…/scorecardSlice.ts` | Department + user scorecard fetch |
| `notificationsSlice` | `…/notificationsSlice.ts` | Feed + unread + socket push |

No dedicated Performance React Context — layout + Redux only.

---

## 6. Shared UI building blocks

| Kind | Files |
|---|---|
| Drawers | `goal-view-drawer.tsx`, `department-view-drawer.tsx`, `department-scorecard-drawer(-tabbed).tsx`, `user-scorecard-drawer(-tabbed).tsx`, `scorecard-edit-drawer.tsx`, `task-drawer-view.tsx` |
| Modals | Goal/KPI delete & forms, breakdown modals, qualitative modals (dept/employee/contract), review create, kanban create/edit/detail |
| PDFs | Contract, contract-scorecard, department-scorecard, user-scorecard, org-bsc + `pdf-letterhead.tsx` |
| Collaboration | `task-chat-panel`, chat bubble/message, mention dropdown, notifications bell/feed, `global-realtime-mount` |
| Selectors | `goal-select`, `currency-select`, `fund-select`, `searchable-user-selector`, config goal pickers |
| Skeletons | dashboard, goals, kpi, department, scorecard |
| Charts / viz | Recharts on dashboard; `balanced-scorecard-view`; rating distribution chart; KPI analysis tab |

**Design system note:** New UI should still follow Arcus control styles (pill `rounded-full` buttons, shared `Button` variants) even if mockups show sharper radii.

---

## 7. Known issues & cleanup

| Issue | Detail |
|---|---|
| Broken BSC Entry methods | `bsc-entry-tab.tsx` → missing `submitBsc*` on service; use `record*` |
| Bad Redux dispatch | `workflow-tab.tsx` dispatches raw Promise |
| Hardcoded JWT/IP | `lib/api/goals-data.ts` — move `Goal` type to `goal-api.ts` first (live drawer imports it), then delete |
| Dead components | `performance-dashboard.tsx` (v1), `tasks-management*.tsx`, `task-management-test.tsx`, `goal-view-drawer-{old,fixed,broken}.tsx`, `goal-details-dialog.tsx`, `activity-logs.tsx`, flat `department-scorecards.tsx` / `user-scorecards.tsx` |
| Legacy endpoints | `/performance-scorecards/…` vs live `/performance/scorecards/…` |
| Nav orphans | `bsc-operations`, `cycles`, `reports`, `notifications` |
| Reviews path inconsistency | `/performance-reviews` vs `/performance/review-cycles` |
| Typo in filename | `perfomance-dashboard-v2.tsx` (missing “r”) — keep stable import or rename carefully |

---

## 8. Suggested redesign sequence

1. Keep `app/performance/**` routes + `modules.ts` ids (permissions).
2. Swap screen bodies to new design + local fixtures (mirror the section shapes above).
3. Leave typed API clients + slices in place (or stub behind a feature flag).
4. Re-wire section-by-section using this doc’s endpoint tables.
5. Fix BSC Entry / Workflow bugs while re-wiring, not after.
6. Delete dead files + `goals-data.ts` in a cleanup PR.

---

## 9. Out of scope (similar name, different product)

| Path | Module |
|---|---|
| `/lp-portal/performance` | LP Portal investor performance |
| `/portfolio/companies/performance` | Portfolio company performance |
| `/portfolio/fund-performance-reporting/**` | Fund performance reporting |
| `lib/api/fund-performance-reporting-api.ts` | Not the HR/BSC Performance module |

---

*Generated from codebase inspection of `app/performance/**`, `components/performance/**`, `lib/api/performance-*` + related clients, and `lib/config/modules.ts`. Update this file when BE contracts change during re-integration.*
