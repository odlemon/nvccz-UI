# FP&A Annual Budgeting — FE API (cycle create + owner workspace)

Base: `{host}/api/v1/fpa`  
Auth: `Authorization: Bearer {token}`  
Related: [fpa-budgeting-api-requirements.md](./fpa-budgeting-api-requirements.md) · [fpa-budgeting-backend-gaps.md](./fpa-budgeting-backend-gaps.md)

Envelope: `{ "success": true, "data": { } }`  
Errors: `{ "success": false, "code": "…", "message": "…", "errors": [...] }`

---

## Happy path (staged open)

```http
POST   /budget-cycles                         → DRAFT
PATCH  /budget-cycles/{id}                    → update setup
POST   /budget-cycles/{id}/validate-setup     → full error list
POST   /budget-cycles/{id}/open               → OPEN_FOR_INPUT + notify owners
GET    /budget-cycles/{id}/owner-workspace    → owner sheet shell
GET    /models/{modelId}/grid?cycleId=…       → scoped worksheet
POST   /tasks/{taskId}/submit                 → blocked until §3.3 gates pass
```

Legacy: `POST /budget-cycles` with `"openImmediately": true` still opens in one step (after setup validation).

---

## 1. Create cycle — `POST /budget-cycles` → **201** (DRAFT)

Body includes: `modelId`, `name`, `fiscalYear`, `planningType`, `versionId`, `scenarioId`, horizon dates, `actualsCutoffDate`, `forecastStartPeriod`, `submissionDeadline`, `baselineMode`, `workflowTemplateId`, `loadPriorActuals`, `loadBaseline`, `openImmediately`, `inputCategories`, `owners[]` with `departmentId`, `assigneeId`, `categories`, `dueDate`, `baselineMethod`.

**`planningType`:** `ANNUAL_BUDGET` · `QUARTERLY_FORECAST` · `ROLLING_FORECAST` · `REFORECAST` · `LONG_RANGE_PLAN` · `STRATEGIC_PLAN`

Response `data.status` is **`DRAFT`** unless `openImmediately: true`.

---

## 2–4. Update / validate-setup / open

- `PATCH|PUT /budget-cycles/{id}` — DRAFT | OPEN_FOR_INPUT | RETURNED_FOR_CORRECTION  
- `POST …/validate-setup` — full unmet list (`OWNER_UNASSIGNED`, `DRIVER_RATE_MISSING`, `CFO_STAGE_MISSING`, `COA_MISSING`, …)  
- `POST …/open` — optional `{ loadPriorActuals, loadBaseline }`; **400** `SETUP_INCOMPLETE` with full `errors[]`; success includes `actualsRowCount` / `actualsLoadReason`

---

## 5. Owner workspace — `GET /budget-cycles/{id}/owner-workspace`

Cycle progress, due, open tasks, validation issues, planning areas, department budget register (method / prior / current / changePct), `canSubmit`, `unmetRequirements`.

Also: `POST /budget-cycles/{id}/validate-owner-submit`.

---

## 6. Grid / cells

- `GET /models/{modelId}/grid?cycleId=&versionId=&scenarioId=` — dept scope; `cellStatus`; `recordVersion`  
- Writable: **INPUT** · **OVERRIDE** only → else **403** `CELL_NOT_EDITABLE`; locked → **403** `LOCKED_VERSION`  
- `POST …/cells/update` — returns `updatedCells[]`; **409 CONFLICT** with currentValue / changedBy / changedAt  
- `POST …/cells/bulk-operation` — FILL_RIGHT/DOWN, COPY_PRIOR_*, PERCENT_*, CLEAR_EDITABLE  
- `GET …/cells/{cellId}/detail` · `GET …/cells/{cellId}/trace`

---

## 7–9. Review / reopen / submit

- `GET /budget-cycles/{id}/review-workspace` — FP&A / CFO  
- `POST /versions/{id}/request-reopen` `{ reason }` → new DRAFT working copy  
- Submit gates: `MANDATORY_INPUT_INCOMPLETE` · `BLOCKING_VALIDATION` · `COMMENTARY_REQUIRED` · `TASKS_INCOMPLETE` · `OWNER_UNASSIGNED`  
- Maker-checker: **403** `MAKER_CHECKER`  
- Baseline methods: `ZERO_BASED` · `PRIOR_YEAR_ACTUAL` · `PRIOR_YEAR_BUDGET` · `LATEST_FORECAST` · `DRIVER_BASED` · `CUSTOM` · `NONE`

### Canonical surface

Keep **`/budget-cycles`** + `/models/{id}/grid?cycleId=` — do **not** dual-call `/planning-cycles`.
