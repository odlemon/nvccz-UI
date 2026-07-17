# FP&A cross-tab backend gaps

**Date:** 2026-07-17
**Status:** Backend delivered on DEV `nts`; frontend wiring in progress
**Backend verification:** MPC workflow 18/18 · cross-tab 15/15 · domain tabs 7/7 · exports 5/5
**Scope:** Contracts identified by the Home → Settings frontend audit. Delivered contracts remain closed; the variance period-scope residual below remains open.

## Delivery summary

The original cross-tab asks in this document were delivered on 2026-07-17:

- MPC lifecycle and MPC-native collaboration
- Persisted settings and connector actions
- Forecast-entity archive on canonical `/api/v1/forecast-entities`
- Domain entity/period filters and non-persisted sensitivity
- Export capability discovery
- Preferred Apply Growth request, with temporary legacy-body compatibility

NetSuite server-side import is not configured. `sync` therefore honestly returns `502 SYNC_FAILED` with the updated source in `data.source`.

## Product rule

An FP&A screen must show server-backed values for its selected model, version, scenario, cycle, entity, and period. The frontend now treats missing contracts as unavailable/empty instead of substituting demo data, cross-entity fallbacks, local financial multipliers, or success toasts.

Common envelope:

```json
{ "success": true, "data": {}, "message": null }
```

Common errors: `401`, `403`, `404`, `409 INVALID_STATUS`, and structured `400` validation errors. Empty data should be `200` with null/empty fields, not `500`.

---

## P0 — Complete the Model Planning Cycle lifecycle — Delivered

Budget cycles and Model Planning Cycles (MPCs) are different entities. The frontend will not call `/budget-cycles/{id}/…` for an MPC id.

### Submit the consolidated cycle

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/submit
```

```json
{ "note": "All owner slices ready" }
```

```json
{
  "success": true,
  "data": {
    "id": "mpc_123",
    "status": "SUBMITTED",
    "currentStage": "FPA_REVIEW",
    "submittedAt": "2026-07-17T00:00:00.000Z"
  }
}
```

Expected errors: `409 CYCLE_NOT_READY` with `data.blockers[]`, `409 ALREADY_SUBMITTED`, `403`.

### FP&A review

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/review/accept
POST /api/v1/fpa/model-planning/cycles/{cycleId}/review/return
```

Accept body:

```json
{ "comment": "Ready for CFO review" }
```

Return body:

```json
{
  "departmentId": "dept_123",
  "taskId": "task_123",
  "comment": "Revise Q3 headcount"
}
```

Return must require `comment`. Expected errors: `409 INVALID_STATUS`, `403`, `404 TASK_NOT_FOUND`.

### CFO decision and lock

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/cfo-approve
POST /api/v1/fpa/model-planning/cycles/{cycleId}/cfo-return
POST /api/v1/fpa/model-planning/cycles/{cycleId}/lock
POST /api/v1/fpa/model-planning/cycles/{cycleId}/request-reopen
```

```json
{ "comment": "Approved FY2026 Base", "scenarioId": "scn_base" }
```

Lock/reopen body:

```json
{ "reason": "Board pack freeze" }
```

Expected errors: `409 MAKER_CHECKER`, `409 INVALID_STATUS`, `423 LOCKED_VERSION`, `403`.

`GET /api/v1/fpa/model-planning/cycles` and `GET /{cycleId}` must include:

```json
{
  "status": "UNDER_REVIEW",
  "currentStage": "FPA_REVIEW",
  "submittedAt": "2026-07-17T00:00:00.000Z",
  "approvedAt": null,
  "lockedAt": null
}
```

**FE verification:** submit all owner tasks in the worksheet; consolidate; accept/return; CFO approve/return; lock; confirm cell writes return `LOCKED_VERSION` and the workflow strip advances after refresh.

**FE consumers:** `components/fpa/fpa-worksheet.tsx`, `components/fpa/planning/planning-collab-sidebar.tsx`.

---

## P0 — MPC collaboration must be MPC-native — Delivered

```http
GET  /api/v1/fpa/model-planning/cycles/{cycleId}/tasks
POST /api/v1/fpa/model-planning/cycles/{cycleId}/tasks
GET  /api/v1/fpa/model-planning/cycles/{cycleId}/comments
POST /api/v1/fpa/model-planning/cycles/{cycleId}/comments
GET  /api/v1/fpa/model-planning/cycles/{cycleId}/activity
POST /api/v1/fpa/tasks/{taskId}/approve
POST /api/v1/fpa/tasks/{taskId}/return
```

Create task:

```json
{
  "title": "Confirm Q3 hiring",
  "description": "Validate approved requisitions",
  "assigneeId": "usr_123",
  "departmentId": "dept_123",
  "dueDate": "2026-07-24"
}
```

Comment:

```json
{ "body": "Headcount updated", "parentCommentId": null }
```

Return:

```json
{ "comment": "Please attach the approved requisitions" }
```

Task/comment/activity records must include stable `id`, `cycleId`, actor/assignee identity, status/type, and ISO timestamps. Expected errors: `403`, `404`, `409 INVALID_STATUS`, `400 COMMENT_REQUIRED`.

**FE verification:** direct and compare worksheet modes show only persisted records; refresh preserves creates and decisions; no request touches `/budget-cycles/{cycleId}`.

**FE consumers:** `components/fpa/fpa-worksheet.tsx`, `components/fpa/planning/planning-collab-sidebar.tsx`.

---

## P1 — Persisted Settings and connector actions — Delivered

```http
GET /api/v1/fpa/settings
PUT /api/v1/fpa/settings
POST /api/v1/fpa/settings/sync-sources/{sourceId}/connect
POST /api/v1/fpa/settings/sync-sources/{sourceId}/disconnect
POST /api/v1/fpa/settings/sync-sources/{sourceId}/sync
```

GET/PUT data:

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
      "lastSyncAt": null,
      "lastError": null
    }
  ]
}
```

Sync response must return the updated source, including `status`, `lastSyncAt`, and `lastError`. Expected errors: `403`, `404 SOURCE_NOT_FOUND`, `409 SYNC_IN_PROGRESS`, `502 SYNC_FAILED`.

**FE verification:** edit settings, reload, and observe persisted values; connector status changes only after a successful response.

**FE consumer:** `components/fpa/fpa-settings.tsx`.

---

## P1 — Entity archive/delete and canonical route — Delivered

Canonical contract is:

```http
GET  /api/v1/forecast-entities
POST /api/v1/forecast-entities
GET  /api/v1/forecast-entities/{entityId}
GET  /api/v1/forecast-entities/{entityId}/chart-of-accounts
```

Please confirm this as canonical (some older docs place it under `/api/v1/fpa`). Add one guarded mutation:

```http
DELETE /api/v1/forecast-entities/{entityId}
```

```json
{ "archive": true, "reason": "Entity merged into Group" }
```

```json
{ "success": true, "data": { "id": "ent_123", "status": "ARCHIVED" } }
```

Expected errors: `403`, `404`, `409 ENTITY_IN_USE` with `data.references[]`. Archive is preferred over destructive deletion when referenced.

**FE verification:** archive disappears from the active entity list after reload; referenced entities return a useful `409`.

**FE consumers:** `components/fpa/fpa-settings.tsx`, `lib/api/fpa-api.ts`.

---

## P1 — Domain filters and server-calculated what-if — Delivered

Workforce, Revenue, Expenses, and Cash Flow now support server-scoped entity/period filters and non-persisted sensitivity:

```http
GET /api/v1/fpa/domain/{workforce|revenue|expense|cash}
  ?modelId={id}
  &versionId={id}
  &scenarioId={id}
  &entityId={id}
  &periodFrom=2026-01-01
  &periodTo=2026-12-01
```

Each response should include the applied scope and available filter values:

```json
{
  "scope": {
    "modelId": "mdl_123",
    "versionId": "ver_123",
    "scenarioId": "scn_123",
    "entityId": "ent_123",
    "periodFrom": "2026-01-01",
    "periodTo": "2026-12-01"
  },
  "availableFilters": {
    "entities": [{ "id": "ent_123", "name": "Group" }],
    "periods": ["2026-01-01", "2026-02-01"]
  }
}
```

For non-persisted sensitivity preview:

```http
POST /api/v1/fpa/domain/{workforce|revenue|expense|cash}/sensitivity
```

```json
{
  "modelId": "mdl_123",
  "versionId": "ver_123",
  "scenarioId": "scn_123",
  "overrides": [{ "driverCode": "COLLECTION_DAYS", "value": 45 }]
}
```

Response must return explicit `base` and `preview` datasets plus `persisted: false`. Expected errors: `400 UNKNOWN_DRIVER`, `400 INVALID_PERIOD_RANGE`, `403`, `404`.

**FE verification:** changing a filter causes a scoped request; changing a what-if control displays only the returned preview and never changes official values.

**FE consumers:** `components/fpa/fpa-{workforce,revenue,expenses,cash-flow}.tsx` and their analysis views.

---

## P1 — Export capability discovery — Delivered

All four UI export types are enabled:

```json
["BOARD_PACK", "MANAGEMENT_REPORT", "FINANCIAL_STATEMENTS", "DEPT_EXPENSES"]
```

Add capability discovery or confirm all four:

```http
GET /api/v1/fpa/exports/capabilities
```

```json
{
  "success": true,
  "data": {
    "exportTypes": [
      { "code": "BOARD_PACK", "enabled": true },
      { "code": "MANAGEMENT_REPORT", "enabled": true },
      { "code": "FINANCIAL_STATEMENTS", "enabled": false, "reason": "Not configured" },
      { "code": "DEPT_EXPENSES", "enabled": true }
    ]
  }
}
```

Generation of a disabled/unknown type should return `400 UNSUPPORTED_EXPORT_TYPE`; download before completion should return `409 EXPORT_NOT_READY`.

**FE verification:** unsupported cards are disabled from capabilities; ready jobs download authenticated bytes.

**FE consumer:** `components/fpa/fpa-reports.tsx`.

---

## P1 — Reconcile the Apply Growth request contract — Delivered

The preferred request is:

```http
POST /api/v1/fpa/models/{modelId}/cells/apply-growth
```

Preferred multi-row/range body:

```json
{
  "versionId": "ver_123",
  "scenarioId": "scn_123",
  "lineItemIds": ["li_123"],
  "periodFrom": "2026-04-01",
  "periodTo": "2026-12-01",
  "ratePercent": 3.5,
  "mode": "COMPOUND",
  "cycleId": "mpc_123"
}
```

The current client still sends singular `lineItemId`, `fromPeriodDate`, and `ratePct`. During migration, either accept both forms or return a versioned validation message. Expected errors: `400 INVALID_PERIOD_RANGE`, `400 LINE_ITEM_REQUIRED`, `423 LOCKED_VERSION`, `403`.

**FE verification:** apply growth updates exactly the selected line items/range and returns the updated cells; locked versions remain unchanged.

**FE consumers:** `lib/api/fpa-api.ts`, `components/fpa/fpa-worksheet.tsx`.

---

## Residual / open — Variance period scope

### Product rule / why

Variance row and summary data must share the same model, version, and selected period scope. The delivered list and summary endpoints accept `modelId` and `versionId`, but currently have no period query. The FE can filter row-level results by each row's `period` / `periodDate`; it will not relabel unscoped summary KPIs, department totals, trend, or tornado data as though the server had calculated them for that period.

This is a query-scope extension to the delivered variance contracts. It does not reopen or re-request any delivered cross-tab endpoint.

### Endpoints and query

Add the same optional canonical `period` query to both endpoints:

```http
GET /api/v1/fpa/variance/results?modelId=mdl_123&versionId=ver_123&period=2026-06-01&limit=200
GET /api/v1/fpa/variance/summary?modelId=mdl_123&versionId=ver_123&period=2026-06-01
```

`period` is an ISO month-start date (`YYYY-MM-01`). When omitted, preserve the current all-period behavior for backward compatibility. When present:

- `results` returns only rows whose `period` / `periodDate` is the requested month.
- `summary.kpis`, `summary.tornado`, and `summary.departments` are recalculated from that same period.
- `summary.trend` may contain only the selected period or a product-defined historical series, but the response `scope.period` must make the KPI/table scope explicit.
- Both endpoints use the same timezone and inclusive month boundary.

If the variance service's canonical design is a range rather than a single month, support `periodFrom` and `periodTo` on both endpoints with the same ISO month-start format and return both in `scope`. Do not implement different period query shapes between results and summary.

### Results response example

```json
{
  "success": true,
  "data": [
    {
      "id": "var_123",
      "modelId": "mdl_123",
      "versionId": "ver_123",
      "lineItemId": "li_revenue",
      "lineItemName": "Revenue",
      "departmentId": "dept_sales",
      "departmentName": "Sales",
      "period": "2026-06-01",
      "periodDate": "2026-06-01",
      "actual": 980000,
      "plan": 1000000,
      "forecast": 1010000,
      "varianceAbs": -20000,
      "variancePct": -2,
      "direction": "UNFAVOURABLE",
      "commentaryRequired": false,
      "commentary": null
    }
  ],
  "meta": {
    "scope": {
      "modelId": "mdl_123",
      "versionId": "ver_123",
      "period": "2026-06-01"
    },
    "count": 1,
    "limit": 200
  },
  "message": null
}
```

The existing array in `data` may remain unchanged for compatibility; `meta.scope` is the required applied-scope confirmation.

### Summary response example

```json
{
  "success": true,
  "data": {
    "scope": {
      "modelId": "mdl_123",
      "versionId": "ver_123",
      "period": "2026-06-01"
    },
    "kpis": {
      "revenueVar": -20000,
      "opexVar": 15000,
      "ebitdaVar": -5000
    },
    "trend": [
      {
        "period": "2026-06-01",
        "variance": -5000
      }
    ],
    "tornado": [
      {
        "departmentId": "dept_sales",
        "departmentName": "Sales",
        "varianceAbs": -20000
      }
    ],
    "departments": [
      {
        "departmentId": "dept_sales",
        "departmentName": "Sales",
        "actual": 980000,
        "plan": 1000000,
        "forecast": 1010000,
        "varianceAbs": -20000,
        "variancePct": -2
      }
    ]
  },
  "message": null
}
```

### Expected errors

- `400 INVALID_PERIOD` when `period` is not a valid ISO month-start date
- `400 INVALID_PERIOD_RANGE` when range form is canonical and `periodFrom` is after `periodTo`
- `400 PERIOD_QUERY_CONFLICT` if callers send both `period` and range parameters
- `403` when the caller cannot view the model/version
- `404 MODEL_NOT_FOUND` or `404 VERSION_NOT_FOUND`
- `409 VERSION_MODEL_MISMATCH` when the version does not belong to the requested model

A valid period with no variance data returns `200` with `data: []` for results and zero/null KPI values plus empty arrays for summary, not `404` or `500`.

### Verify with FE

- Open `/forecasting/variance` for a model/version with at least two months of calculated variance data.
- Select one period and confirm both requests send the identical `period`.
- Confirm every result row is in that period and `meta.scope.period` matches it.
- Confirm the KPI cards, department table, tornado chart, and summary scope all change when the period changes; no summary card is relabelled from client-filtered rows.
- Clear the period and confirm the endpoints preserve their current all-period behavior.
- Select a valid empty period and confirm the FE receives successful empty responses.

### FE consumers

- `lib/api/fpa-api.ts`
- `components/fpa/fpa-variance-analysis.tsx`
- `components/fpa/variance/variance-analysis-view.tsx`

