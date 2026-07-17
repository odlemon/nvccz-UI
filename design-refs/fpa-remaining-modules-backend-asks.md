# FP&A — Remaining modules backend asks (implementation pack)

**Date:** 2026-07-16  
**Audience:** Backend + Frontend agents  
**Status:** Living pack — P1 Home/domain/variance/reports/rolling contracts implemented and FE-wired; P0 MPC residuals + P2 Settings remain  
**Playbook:** [`arcus-feature-delivery-playbook.md`](./arcus-feature-delivery-playbook.md)  
**Planning journey:** [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md)

This document is the **single pack** for everything still needed to make Model Planning (remainder) + Compare + the major FP&A sidebar tabs **dynamic** (live API, no mock-as-truth). After BE lands contracts, FE wires stage-by-stage / tab-by-tab per the playbook.

---

## How to use

| Who | Action |
|-----|--------|
| **BE** | Ticket from each section’s endpoints + JSON + error codes |
| **FE** | Do **not** invent success data; empty states until contracts ship |
| **QA** | Use “Verify with FE” checklists |

**Status legend**

| Tag | Meaning |
|-----|---------|
| **Done** | Contract + FE path working (don’t re-ask) |
| **Partial** | UI exists; API thin or wrong entity |
| **Missing** | No usable contract for the UI job |
| **Mock-only** | FE shows fabricated / local data as if live |

---

## Executive snapshot

| Area | FE today | BE ask priority |
|------|----------|-----------------|
| **Home** `/forecasting` | **Live enriched dashboard** | Done — [`fpa-home-dashboard-backend-asks.md`](./fpa-home-dashboard-backend-asks.md) |
| Model Planning Stages 0–3 | Done | — (contracts exist) |
| Stage 4 Compare / scenarios | Done | — [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md) |
| Stage 5 Collab residuals | Done (MPC-native tasks/comments/activity) | — |
| Stages 6–9 MPC workflow | Done (all lifecycle verbs delivered) | — |
| Forecasts | Live summary + mutators | Done |
| Workforce / Revenue / Expenses / Cash | Live enriched domain payloads | Done |
| Variance | Live results + summary + recalculate | Done |
| Reports | Live export jobs | Done |
| Settings | Backend delivered; FE wiring in progress | — |

---

# Part A — Model Planning worksheet (what’s left)

**Route:** `/forecasting/models/[id]/worksheet`  
**Primary FE:** [`components/fpa/fpa-worksheet.tsx`](../components/fpa/fpa-worksheet.tsx)

## A.0 Stages 0–3 — Done (do not re-ask)

| Stage | Contract |
|-------|----------|
| 0 Create / open | Model planning cycles create + workspace |
| 1 Orient | Chrome: version / cycle / scenario / cutoff |
| 2 Owners / scoped grid / slice submit | [`fpa-model-planning-owners-api.md`](./fpa-model-planning-owners-api.md) |
| 2 Ad-hoc tasks (FE ready) | Still open BE → [`fpa-model-planning-tasks-backend-asks.md`](./fpa-model-planning-tasks-backend-asks.md) |
| 3 Drivers / INPUT / spread / live summary | [`fpa-model-planning-stage3-api.md`](./fpa-model-planning-stage3-api.md) |
| 4 Scenarios / compare / assumptions library | [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md) |
| Actuals cutoff write guard | [`fpa-actuals-cutoff-backend-asks.md`](./fpa-actuals-cutoff-backend-asks.md) (Done) |

---

## A.1 Stage 4 — Scenarios + Compare (**Done**)

**Canonical contract:** [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md)  
**Asks closed:** [`fpa-model-planning-stage4-backend-asks.md`](./fpa-model-planning-stage4-backend-asks.md)  
**Product:** SRD §38–40 — scenarios inherit from Base; Compare tells the story.

### Delivered

| # | Item | Status |
|---|-----|--------|
| A | Enriched multi-scenario compare | Done |
| B | Fast copy-from-Base (`INSERT…SELECT`) | Done |
| C | Inheritance metadata | Done |
| D | Drivers scoped by version+scenario | Done |
| E | `confidence` / `spreadingMethod` + DELETE | Done |
| F | `PUT/PATCH` scenario + archive | Done |

**Verify with FE:** Select ≥3 scenarios → one column each metric; copy from Base succeeds; inheritance label shows parent; Assumptions library persists metadata + delete.

---

## A.2 Stage 5 — Collaborate residuals (**P0**)

**Canonical ask:** [`fpa-model-planning-tasks-backend-asks.md`](./fpa-model-planning-tasks-backend-asks.md)

| Job | FE today | BE need |
|-----|----------|---------|
| List / create ad-hoc planning tasks | UI + client methods | `GET/POST /model-planning/cycles/{id}/tasks` |
| Complete ad-hoc task | `PATCH /tasks/{id}` | Confirm status transitions |
| Cycle comments / activity | Prefers MPC, falls back to budget-cycle | `GET/POST …/comments`, `GET …/activity` for **MPC ids** |
| Cell comments | Live | Done |
| Sidebar Approve / Return | **Toast only** | Wire to task `approve` / `return` when task id known; optional thread replies later |

**Verify with FE:** Assign task on MPC worksheet → appears in Tasks; complete works; Comments/Activity load without budget-cycle 404.

---

## A.3 Stages 6–9 — Model Planning Cycle workflow (**Delivered 2026-07-17**)

### Product rules

```
Owner slice submit → (optional) consolidate cycle
  → FP&A review / return
  → CFO approve / return
  → Lock cycle (freeze approved cut)
```

**Critical:** Today FE uses **legacy** budget-cycle / version endpoints for CFO approve and lock. Model Planning must expose the same **verbs on MPC**:

`/api/v1/fpa/model-planning/cycles/{cycleId}/…`

**FE today**

- Owner slice: `POST /tasks/{taskId}/submit` (works with owners API)
- Workflow footer: **read-only** map from cycle status
- No whole-cycle submit, no MPC review/return UI actions, no MPC CFO approve, no MPC lock button

### A.3.1 Submit department slice (already Done)

```http
POST /api/v1/fpa/tasks/{taskId}/submit
```

Keep as-is. Errors: `SUBMISSION_BLOCKED` with unmet list.

### A.3.2 Consolidate / submit cycle (Delivered)

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/submit
```

**Body (optional):**

```json
{ "note": "All owner slices ready" }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mpc_…",
    "status": "SUBMITTED",
    "currentStage": "FPA_REVIEW",
    "submittedAt": "2026-07-16T20:00:00.000Z"
  }
}
```

| Code | When |
|------|------|
| `CYCLE_NOT_READY` | Open owner slices / blockers |
| `ALREADY_SUBMITTED` | Idempotent / conflict |
| `403` | Not FP&A / admin |

**Why:** Stage 6 “whole cycle” path after dept slices.

### A.3.3 FP&A review — accept toward consolidation / return (Delivered)

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/review/accept
POST /api/v1/fpa/model-planning/cycles/{cycleId}/review/return
```

**Return body:**

```json
{
  "departmentId": "dept_…",
  "taskId": "task_…",
  "comment": "Revise headcount for Q3"
}
```

**Response cycle status examples:** `UNDER_REVIEW` | `RETURNED_FOR_CORRECTION`

| Code | When |
|------|------|
| `INVALID_STATUS` | Not in reviewable state |
| `403` | Not reviewer |

### A.3.4 CFO approve / return (Delivered on MPC)

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/cfo-approve
POST /api/v1/fpa/model-planning/cycles/{cycleId}/cfo-return
```

**Body:**

```json
{ "comment": "Approved Base for FY2026", "scenarioId": "scn_base" }
```

**Response:** `status: APPROVED` (or `RETURNED_FOR_CORRECTION`)

| Code | When |
|------|------|
| `MAKER_CHECKER` | Same user cannot approve own submit |
| `INVALID_STATUS` | Not pending CFO |
| `403` | Not CFO / admin |

**Do not** require FE to call `/budget-cycles/{id}/cfo-approve` for MPC ids.

### A.3.5 Lock planning cycle (Delivered)

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/lock
```

```json
{ "reason": "Board pack freeze" }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mpc_…",
    "status": "LOCKED",
    "lockedAt": "…",
    "lockedById": "…",
    "versionId": "ver_…"
  }
}
```

**Side effect:** Planning cell writes for this cycle/version return `LOCKED_VERSION` / `403`.

Optional reopen:

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/request-reopen
```

```json
{ "reason": "Material error after lock" }
```

### A.3.6 Cycle GET must expose workflow fields

On `GET /model-planning/cycles/{id}` (and list items):

| Field | Type | Notes |
|-------|------|-------|
| `status` | string | `DRAFT` \| `OPEN` \| `SUBMITTED` \| `UNDER_REVIEW` \| `APPROVED` \| `LOCKED` \| `RETURNED_FOR_CORRECTION` \| … |
| `currentStage` | string \| null | Optional stage enum |
| `submittedAt` / `approvedAt` / `lockedAt` | ISO \| null | Footer timestamps |
| `materialVariancePct` | number | Stage 3 (Done) |

**FE consumers:** `fpa-worksheet.tsx` workflow strip, submit banner, future Approvals actions.

**Verify with FE:** Owner submits slice → FP&A consolidates → CFO approves → Lock → cell edit blocked; footer steps advance without page hacks.

---

# Part B — Compare deep-dive

## Surfaces

| Surface | Path | Component |
|---------|------|-----------|
| In-worksheet Compare | `…/worksheet?view=compare` | `planning-scenario-compare-view.tsx` |
| Standalone Scenarios page | `/forecasting/scenarios` | `fpa-scenario-comparison.tsx` |
| Mapper | — | `lib/fpa/scenario-compare.ts` |

Sidebar nav no longer lists Scenarios; both surfaces above remain for product until deprecation decided.

## UI jobs (what Compare must do)

| Step | User action | System behaviour |
|------|-------------|------------------|
| B1 | Multi-select Base / Best / Downside | Compare request with `scenarioIds[]` + `anchorScenarioId` |
| B2 | View metric table | `metrics[]` with values + varianceAbs/Pct vs anchor |
| B3 | View / edit assumptions matrix | `assumptions[]` → save via drivers PUT / bulk |
| B4 | Waterfall / bridge | `waterfall.steps[]` or honest empty |
| B5 | Sensitivity board | `sensitivity[]` or honest empty |
| B6 | Create Best/Downside from Base | Reliable `copy` with inheritance |
| B7 | Promote scenario | Existing `POST …/promote` |

## Primary endpoint (repeat for ticket clarity)

```http
POST /api/v1/fpa/scenarios/{anchorScenarioId}/compare
```

```json
{
  "versionId": "ver_…",
  "scenarioIds": ["scn_base", "scn_best", "scn_down"],
  "anchorScenarioId": "scn_base",
  "includeAssumptions": true,
  "includeWaterfall": true,
  "includeSensitivity": true,
  "cycleId": "mpc_…"
}
```

See Stage 4 doc for full response shape.

**Verify with FE**

- [ ] ≥3 scenario columns in metric table  
- [ ] Assumptions edit persists and reloads  
- [ ] Waterfall non-empty when BE provides steps  
- [ ] Copy from Base < reasonable latency / async UX documented  

---

# Part C — Remaining FP&A sidebar tabs

Each section: goal → FE today → UI jobs → endpoints → errors → verify → FE files.

Shared query context for most tabs: `modelId`, `versionId`, optional `scenarioId`, optional `cycleId`.

---

## C.0 Home dashboard (**P1** — landing page)

**Route:** `/forecasting`  
**FE:** [`components/fpa/fpa-home-board.tsx`](../components/fpa/fpa-home-board.tsx)  
**Status:** **Done** — enriched dashboard wired; thin sections render honest empties  
**Canonical ask:** [`fpa-home-dashboard-backend-asks.md`](./fpa-home-dashboard-backend-asks.md)

### Goal

Executive board from live model data — no demo FX multipliers.

### Delivered contract

Enrich existing:

```http
GET /api/v1/fpa/home/dashboard?modelId=&versionId=&scenarioId=&period=&cycleId=
```

Return full board payload: `kpis` (+ deltas, forecastAccuracy, sparklines), `revenueExpenseTrend`, multi-scenario `scenarioCompare.metrics`, workflow **status** slices, `overBudgetDepartments`, `cashRunway`, `recentActivity`, enriched `openTasks`. See home ask doc for example JSON.

**FE now:** Home calls this endpoint for the selected model/version/scenario/period and maps all board sections without demo fallbacks.

**Verify with FE:** After FE wire — change header scenario → server numbers change; empty arrays show empty UI (no $125.8M demo).

---

## C.1 Forecasts (Rolling forecast)

**Route:** `/forecasting/rolling-forecast`  
**FE:** [`components/fpa/fpa-rolling-forecast.tsx`](../components/fpa/fpa-rolling-forecast.tsx)  
**Status:** **Done** — summary, cutoff, method, roll-forward, and actuals sync wired

### Goal

Operate a rolling forecast cut: actuals cutoff, horizon, method comparison, sync actuals, roll forward.

### UI jobs

| | Action |
|---|--------|
| C1.A | Show KPI strip (Revenue, EBITDA, Cash, Runway, Accuracy) |
| C1.B | Actual vs Forecast trend with cutoff line |
| C1.C | Method comparison (driver / run-rate / growth / …) |
| C1.D | Adjust rolling horizon / cutoff |
| C1.E | Sync actuals |
| C1.F | Roll forward |

### Backend asks

#### 1. Rolling forecast summary (Missing)

```http
GET /api/v1/fpa/models/{modelId}/rolling-forecast?versionId=&scenarioId=&cycleId=
```

```json
{
  "success": true,
  "data": {
    "modelId": "…",
    "versionId": "…",
    "actualsCutoff": "2026-03-01",
    "forecastStart": "2026-04-01",
    "horizonMonths": 12,
    "activeMethod": "DRIVER",
    "kpis": {
      "revenue": 1200000,
      "ebitda": 210000,
      "cash": 500000,
      "runwayMonths": 8.5,
      "accuracyPct": 92.1
    },
    "trend": [
      { "period": "2026-01-01", "actual": 100000, "forecast": null },
      { "period": "2026-04-01", "actual": null, "forecast": 110000 }
    ],
    "methods": [
      {
        "code": "DRIVER",
        "label": "Driver-based",
        "revenue": 1200000,
        "ebitda": 210000,
        "cash": 500000
      }
    ]
  }
}
```

#### 2. Set cutoff / horizon (Missing)

```http
PUT /api/v1/fpa/models/{modelId}/rolling-forecast/cutoff
```

```json
{
  "versionId": "ver_…",
  "cycleId": "mpc_…",
  "actualsCutoff": "2026-03-01",
  "horizonMonths": 12
}
```

#### 3. Select method (Missing)

```http
PUT /api/v1/fpa/models/{modelId}/rolling-forecast/method
```

```json
{ "versionId": "ver_…", "method": "DRIVER" }
```

#### 4. Sync actuals (exists)

```http
POST /api/v1/fpa/actuals/sync
```

Already in client as `syncActuals` — wire FE; return `rowCount`.

#### 5. Roll forward (Missing)

```http
POST /api/v1/fpa/models/{modelId}/rolling-forecast/roll-forward
```

```json
{ "versionId": "ver_…", "months": 1 }
```

| Code | When |
|------|------|
| `LOCKED_VERSION` | Version locked |
| `INVALID_CUTOFF` | Cutoff after horizon |
| `403` | No edit permission |

**Verify with FE:** Page shows API KPIs/trend (not `FORECAST_METHODS` hardcodes); cutoff change persists; Sync/Roll call live endpoints.

---

## C.2 Workforce

**Route:** `/forecasting/workforce`  
**FE:** [`fpa-workforce.tsx`](../components/fpa/fpa-workforce.tsx) → `workforce/workforce-analysis-view.tsx`  
**Status:** **Done** — enriched KPIs, hire plan, attrition, and departments wired

### Goal

Headcount plan vs budget, hire plan, attrition, dept table, salary what-if.

### UI jobs

| | Action |
|---|--------|
| C2.A | KPIs (HC, hires, attrition, cost) |
| C2.B | Hire plan vs actual chart |
| C2.C | Headcount vs budget |
| C2.D | Attrition trend |
| C2.E | Department headcount plan table |
| C2.F | What-if salary inflation (client ok; optional server preview) |
| C2.G | Dept detail drawer |

### Backend ask — enriched workforce domain (or dedicated)

```http
GET /api/v1/fpa/domain/workforce?modelId=&versionId=&scenarioId=
```

**Required `data` (replace generic-only payload):**

```json
{
  "kpis": {
    "headcount": 420,
    "budgetHeadcount": 400,
    "openRoles": 18,
    "hiresYtd": 32,
    "attritionPct": 8.2,
    "avgSalary": 65000,
    "sparklines": { "headcount": [400, 405, 412, 420] }
  },
  "hirePlan": [
    { "period": "2026-04-01", "planned": 10, "actual": 8 }
  ],
  "attritionTrend": [
    { "period": "2026-01-01", "pct": 7.5 }
  ],
  "departments": [
    {
      "departmentId": "dept_…",
      "departmentName": "Engineering",
      "headcount": 120,
      "budgetHeadcount": 115,
      "hires": 8,
      "attritionPct": 6.1,
      "avgSalary": 78000,
      "openRoles": 5
    }
  ]
}
```

| Code | When |
|------|------|
| `404` | Unknown model |
| Empty `departments: []` | OK — FE shows empty, **not** mock |

**Verify with FE:** With real payload, no `mapMockWfDepts`; gap logger silent for workforce.

---

## C.3 Revenue

**Route:** `/forecasting/revenue`  
**FE:** [`fpa-revenue.tsx`](../components/fpa/fpa-revenue.tsx)  
**Status:** **Done** — enriched KPIs, waterfall, monthly series, and streams wired

### Goal

Revenue waterfall, monthly trend, by-stream table, growth what-if.

### UI jobs

| | Action |
|---|--------|
| C3.A | KPIs |
| C3.B | Waterfall bridge |
| C3.C | Monthly trend |
| C3.D | Stream table (actual/budget/forecast/YoY/share) |
| C3.E | Growth what-if |
| C3.F | Stream detail |

### Backend ask

```http
GET /api/v1/fpa/domain/revenue?modelId=&versionId=&scenarioId=
```

```json
{
  "kpis": {
    "revenue": 1200000,
    "budget": 1150000,
    "forecast": 1220000,
    "yoyPct": 4.3
  },
  "waterfall": [
    { "key": "prior", "label": "Prior year", "value": 1100000 },
    { "key": "volume", "label": "Volume", "delta": 50000 },
    { "key": "price", "label": "Price", "delta": 50000 },
    { "key": "result", "label": "Current", "value": 1200000 }
  ],
  "monthly": [
    { "period": "2026-01-01", "actual": 90000, "budget": 88000, "forecast": 92000 }
  ],
  "streams": [
    {
      "id": "li_…",
      "name": "Product A",
      "region": "ZW",
      "method": "DRIVER",
      "actual": 400000,
      "budget": 380000,
      "forecast": 410000,
      "yoyPct": 5.2,
      "sharePct": 34.1
    }
  ]
}
```

**Verify with FE:** Waterfall + streams from API; no synthetic `base = 10+i*5`.

---

## C.4 Expenses

**Route:** `/forecasting/expenses`  
**FE:** [`fpa-expenses.tsx`](../components/fpa/fpa-expenses.tsx)  
**Status:** **Done** — enriched KPIs, alerts, category/monthly/bridge, and departments wired

### Goal

OpEx by category, monthly burn, budget→forecast bridge, over-budget alerts, dept table.

### UI jobs

| | Action |
|---|--------|
| C4.A | KPIs + over-budget alerts |
| C4.B | Category mix (pie) |
| C4.C | Monthly burn |
| C4.D | Budget → forecast bridge |
| C4.E | Department table + status |
| C4.F | Dept detail |

### Backend ask

```http
GET /api/v1/fpa/domain/expense?modelId=&versionId=&scenarioId=
```

```json
{
  "kpis": {
    "opex": 800000,
    "budget": 750000,
    "forecast": 820000,
    "variancePct": 6.7
  },
  "alerts": [
    {
      "departmentId": "dept_…",
      "departmentName": "Marketing",
      "severityPct": 12.5,
      "severityAmount": 40000,
      "severity": "OVER_BUDGET"
    }
  ],
  "byCategory": [
    { "category": "People", "amount": 400000, "sharePct": 50 }
  ],
  "monthlyBurn": [
    { "period": "2026-01-01", "actual": 60000, "budget": 58000, "forecast": 62000 }
  ],
  "bridge": [
    { "key": "budget", "label": "Budget", "value": 750000 },
    { "key": "volume", "label": "Volume", "delta": 30000 },
    { "key": "forecast", "label": "Forecast", "value": 820000 }
  ],
  "departments": [
    {
      "departmentId": "dept_…",
      "departmentName": "Marketing",
      "budget": 320000,
      "actual": 300000,
      "runRate": 310000,
      "forecast": 360000,
      "headcount": 24,
      "status": "OVER_BUDGET"
    }
  ]
}
```

**Verify with FE:** Alerts + dept table from API; no `mapMockExpDepts`.

---

## C.5 Cash Flow

**Route:** `/forecasting/cash-flow`  
**FE:** [`fpa-cash-flow.tsx`](../components/fpa/fpa-cash-flow.tsx)  
**Status:** **Done** — enriched KPIs, dynamic periods, and typed cash rows wired

### Goal

Cash statement by month, runway, net cash, closing balance, collection-days what-if.

### UI jobs

| | Action |
|---|--------|
| C5.A | KPIs (runway, net cash, closing) |
| C5.B | Runway by scenario (optional) |
| C5.C | Net cash / closing charts |
| C5.D | Full statement table (inflow/outflow/total × periods) |
| C5.E | Collection days what-if |
| C5.F | Line detail |

### Backend ask

```http
GET /api/v1/fpa/domain/cash?modelId=&versionId=&scenarioId=
```

```json
{
  "kpis": {
    "closingCash": 500000,
    "netCashFlow": 40000,
    "runwayMonths": 8.5
  },
  "periods": ["2026-01-01", "2026-02-01"],
  "rows": [
    {
      "id": "opening",
      "label": "Opening cash",
      "rowType": "TOTAL",
      "values": { "2026-01-01": 450000, "2026-02-01": 470000 }
    },
    {
      "id": "collections",
      "label": "Collections",
      "rowType": "INFLOW",
      "values": { "2026-01-01": 120000, "2026-02-01": 125000 }
    },
    {
      "id": "payroll",
      "label": "Payroll",
      "rowType": "OUTFLOW",
      "values": { "2026-01-01": -80000, "2026-02-01": -82000 }
    },
    {
      "id": "closing",
      "label": "Closing cash",
      "rowType": "TOTAL",
      "values": { "2026-01-01": 470000, "2026-02-01": 500000 }
    }
  ]
}
```

**Verify with FE:** Statement rows classified INFLOW/OUTFLOW/TOTAL from API; no regex invent.

---

## C.6 Variance

**Route:** `/forecasting/variance`  
**FE:** [`fpa-variance-analysis.tsx`](../components/fpa/fpa-variance-analysis.tsx)  
**Status:** **Done** — enriched results + summary + commentary + recalculate wired

### Goal

Actual vs plan vs forecast, dept breakdown, commentary queue, recalculate.

### UI jobs

| | Action |
|---|--------|
| C6.A | KPI strip from real results |
| C6.B | Variance detail drawer |
| C6.C | Commentary requests + submit |
| C6.D | Trend chart |
| C6.E | Tornado / dept breakdown |
| C6.F | Dept table (entity/version) |
| C6.G | Recalculate |

### Backend asks

#### 1. Enrich list results (Partial → complete)

```http
GET /api/v1/fpa/variance/results?modelId=&versionId=&limit=
```

Each row should support:

| Field | Notes |
|-------|-------|
| `departmentId` / `departmentName` | Dept rollup |
| `actual`, `plan`, `forecast` | Forecast column required for UI |
| `varianceAbs`, `variancePct` | |
| `lineItemId`, `lineItemName` | Detail drawer |
| `commentaryRequired` | Materiality gate |
| `commentary` / status | Queue |

#### 2. Summary companion (Missing or embed)

Either embed on list response or:

```http
GET /api/v1/fpa/variance/summary?modelId=&versionId=
```

```json
{
  "kpis": { "revenueVar": -20000, "opexVar": 15000, "ebitdaVar": -5000 },
  "trend": [{ "period": "2026-01-01", "variance": -5000 }],
  "tornado": [
    { "departmentName": "Marketing", "varianceAbs": -40000 }
  ],
  "departments": [
    {
      "departmentId": "dept_…",
      "departmentName": "Marketing",
      "actual": 300000,
      "plan": 280000,
      "forecast": 310000,
      "varianceAbs": -20000,
      "variancePct": -7.1
    }
  ]
}
```

#### 3. Commentary (exists)

```http
POST /api/v1/fpa/variance/{varianceId}/commentary
```

Keep; ensure works with real ids from results.

#### 4. Recalculate (exists, unused in UI)

```http
POST /api/v1/fpa/variance/calculate
```

```json
{ "modelId": "…", "versionId": "…", "scenarioId": "…" }
```

FE will add Recalculate button once response is reliable.

**Verify with FE:** Dept table + tornado from API; no `mapMockDeptRows` / `mockVarTornado` when data present.

---

## C.7 Reports

**Route:** `/forecasting/reports`  
**FE:** [`fpa-reports.tsx`](../components/fpa/fpa-reports.tsx)  
**Status:** **Done** — create/list/poll/download export jobs wired

### Goal

Generate / preview / download board pack and management reports; list recent jobs.

### UI jobs

| | Action |
|---|--------|
| C7.A | List templates (Board Pack, Management, Financial Statements, Dept Expenses) |
| C7.B | Generate job |
| C7.C | Poll / list recent jobs |
| C7.D | Download |
| C7.E | Preview metadata |

### Backend asks

#### 1. Wire existing board-pack export (exists — FE unused)

```http
POST /api/v1/fpa/exports/board-pack
```

```json
{
  "modelId": "mdl_…",
  "versionId": "ver_…",
  "exportType": "BOARD_PACK",
  "period": "2026-Q2"
}
```

```http
GET /api/v1/fpa/exports/{exportId}/download
```

**Ask:** Confirm supported `exportType` values. Today FE offers four templates; client types typically `BOARD_PACK` | `MANAGEMENT_REPORT`.

#### 2. Additional export types (Missing if product requires)

| UI template | Suggested `exportType` |
|------------|------------------------|
| Board Pack | `BOARD_PACK` |
| Management Report | `MANAGEMENT_REPORT` |
| Financial Statements | `FINANCIAL_STATEMENTS` |
| Departmental Expenses | `DEPT_EXPENSES` |

If BE will not support the last two soon, document **403/400** `UNSUPPORTED_EXPORT_TYPE` so FE can disable cards.

#### 3. List recent jobs (Missing or confirm)

```http
GET /api/v1/fpa/exports?modelId=&limit=20
```

```json
{
  "success": true,
  "data": [
    {
      "id": "exp_…",
      "exportType": "BOARD_PACK",
      "status": "READY",
      "createdAt": "…",
      "downloadUrl": "/api/v1/fpa/exports/exp_…/download"
    }
  ]
}
```

| Code | When |
|------|------|
| `UNSUPPORTED_EXPORT_TYPE` | Unknown type |
| `EXPORT_NOT_READY` | Still processing |
| `404` | Unknown job |

**Verify with FE:** Generate → real job id → download bytes; Recent Jobs from API (not fake progress bar only).

---

## C.8 Settings

**Route:** `/forecasting/settings`  
**FE:** [`fpa-settings.tsx`](../components/fpa/fpa-settings.tsx)  
**Status:** **Backend delivered; FE wiring in progress** — entities/CoA, persisted settings, sync actions, and guarded entity archive

### Goal

Entities & CoA, variance thresholds, sync sources, workflow defaults — persisted.

### UI jobs

| | Action |
|---|--------|
| C8.A | List / create / delete entities |
| C8.B | View CoA per entity |
| C8.C | Variance commentary threshold + enforce toggles |
| C8.D | Sync sources connect/disconnect/sync |
| C8.E | Workflow defaults (linear path, CFO signature, allow rerun) |

### Backend asks

#### 1. Entities & CoA (implemented and FE-wired)

```http
GET  /api/v1/forecast-entities
POST /api/v1/forecast-entities
GET  /api/v1/forecast-entities/{id}
GET  /api/v1/forecast-entities/{id}/chart-of-accounts
```

**Wired:** FE lists/creates entities and loads CoA without mock fallback.  
**Delivered:** Canonical base is `/api/v1/forecast-entities`; `DELETE /{id}` performs guarded archive and returns `409 ENTITY_IN_USE` for referenced/default entities.

#### 2. FP&A settings blob (Delivered)

```http
GET /api/v1/fpa/settings
PUT /api/v1/fpa/settings
```

```json
{
  "variance": {
    "commentaryThresholdPct": 5,
    "enforceCommentary": true,
    "blockSubmitWithoutCommentary": false
  },
  "workflow": {
    "path": "LINEAR",
    "requireCfoSignature": true,
    "allowRerunAfterReturn": true
  },
  "syncSources": [
    {
      "id": "netsuite",
      "label": "NetSuite",
      "status": "DISCONNECTED",
      "lastSyncAt": null
    }
  ]
}
```

#### 3. Sync source actions (Delivered)

```http
POST /api/v1/fpa/settings/sync-sources/{sourceId}/connect
POST /api/v1/fpa/settings/sync-sources/{sourceId}/disconnect
POST /api/v1/fpa/settings/sync-sources/{sourceId}/sync
```

| Code | When |
|------|------|
| `403` | Not `canManageSettings` / admin |
| `SYNC_FAILED` | Connector error |

**Note:** Cycle-level `materialVariancePct` (Stage 3) should stay aligned with settings default when creating new MPC cycles.

**Verify with FE:** Entities load from API; threshold save survives reload; sync buttons hit real endpoints (or honest “not configured” errors).

---

# Part D — Short residuals (not deep re-asks)

| Area | Status | Doc / note |
|------|--------|------------|
| **Home** `/forecasting` | **Done** — enriched dashboard wired | [`fpa-home-dashboard-backend-asks.md`](./fpa-home-dashboard-backend-asks.md) |
| **Budgeting** `/forecasting/budget` | Mostly Done | [`fpa-budgeting-backend-gaps.md`](./fpa-budgeting-backend-gaps.md), owner workspace API |
| **Workflow** `/forecasting/workflow` | Mostly Done | [`fpa-workflow-approvals-backend-gaps.md`](./fpa-workflow-approvals-backend-gaps.md) — **distinct** from MPC Stages 6–9 |
| **Drivers / Assumptions** `/forecasting/drivers` | Done | [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md) |
| **Model Builder** | Separate journey | Builder digests — out of this pack |

---

# Part E — Priority matrix (implement-at-once order for BE)

### P0 — Blocks Model Planning finish

1. ~~Stage 4 enriched compare + reliable copy + `parentScenarioId`~~ → **Done** ([`stage4-api`](./fpa-model-planning-stage4-api.md))  
2. ~~MPC-native tasks/comments/activity~~ → **Done**
3. ~~MPC workflow verbs: cycle submit, review accept/return, CFO approve/return, lock (+ GET status fields)~~ → **Done**

### P1 — Remaining tabs / Home dynamic (**Done**)

4. ~~**Home dashboard enrich**~~ → **Done** — [`fpa-home-dashboard-backend-asks.md`](./fpa-home-dashboard-backend-asks.md)  
5. ~~Enrich `domain/workforce|revenue|expense|cash`~~ → **Done**  
6. ~~Variance summary / dept / forecast column + calculate UX~~ → **Done**  
7. ~~Reports export jobs + four declared export types~~ → **Done**  
8. ~~Rolling forecast summary + cutoff/method/roll-forward~~ → **Done**  

### P2 — Settings & polish

9. Settings GET/PUT + sync-source actions; wire entities/CoA  
10. ~~Stage 4 P1 driver confidence / spreading / DELETE~~ → **Done**  
11. Compare waterfall / sensitivity population (sensitivity may still be `[]`)  

---

# Part F — Index of design-refs (asks vs contracts)

| File | Role |
|------|------|
| **This file** | Remaining pack (Stages 4–9 + tabs + Home pointer) |
| [`fpa-home-dashboard-backend-asks.md`](./fpa-home-dashboard-backend-asks.md) | **Contract + FE Done** — Home `/forecasting` |
| [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md) | **Contract Done** |
| [`fpa-model-planning-stage4-backend-asks.md`](./fpa-model-planning-stage4-backend-asks.md) | Superseded |
| [`fpa-model-planning-tasks-backend-asks.md`](./fpa-model-planning-tasks-backend-asks.md) | **Open** — Ad-hoc tasks / MPC comments |
| [`fpa-model-planning-stage3-api.md`](./fpa-model-planning-stage3-api.md) | **Contract Done** |
| [`fpa-model-planning-stage3-backend-asks.md`](./fpa-model-planning-stage3-backend-asks.md) | Superseded |
| [`fpa-model-planning-owners-api.md`](./fpa-model-planning-owners-api.md) | **Contract Done** |
| [`fpa-model-planning-owner-scope-backend-asks.md`](./fpa-model-planning-owner-scope-backend-asks.md) | Superseded |
| [`fpa-actuals-cutoff-backend-asks.md`](./fpa-actuals-cutoff-backend-asks.md) | **Done** |
| [`fpa-model-planning-api-requirements.md`](./fpa-model-planning-api-requirements.md) | Broader compare/API pack |
| [`fpa-api-frontend-feedback.md`](./fpa-api-frontend-feedback.md) | Historical thin areas |
| [`fpa-workflow-backend-asks.md`](./fpa-workflow-backend-asks.md) / gaps | Review **cockpit** page (not MPC footer) |
| [`fpa-budgeting-*`](./fpa-budgeting-backend-gaps.md) | Budgeting module |

---

## FE file map (quick)

| Area | Files |
|------|-------|
| **Home** | `components/fpa/fpa-home-board.tsx`, `app/forecasting/page.tsx` |
| Worksheet + workflow | `components/fpa/fpa-worksheet.tsx` |
| Compare in-worksheet | `components/fpa/planning/planning-scenario-compare-view.tsx` |
| Scenarios page | `components/fpa/fpa-scenario-comparison.tsx` |
| Compare mapper | `lib/fpa/scenario-compare.ts` |
| Collab rail | `components/fpa/planning/planning-collab-sidebar.tsx` |
| API client | `lib/api/fpa-api.ts` |
| Forecasts | `components/fpa/fpa-rolling-forecast.tsx` |
| Workforce / Revenue / Expenses / Cash | `fpa-workforce.tsx`, `fpa-revenue.tsx`, `fpa-expenses.tsx`, `fpa-cash-flow.tsx` + `*/…-analysis-view.tsx` |
| Variance | `fpa-variance-analysis.tsx` |
| Reports | `fpa-reports.tsx` |
| Settings | `fpa-settings.tsx` |
| Gap logger | `lib/fpa/fpa-api-gaps.ts` |

---

*Living BE/FE implementation pack — updated after P1 API + FE wiring, July 2026.*
