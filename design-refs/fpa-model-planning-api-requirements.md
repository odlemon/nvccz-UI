# FP&A Model Planning — Backend API requirements

Backend contracts for **Model Planning**: Planning Workspace + Scenario Comparison.

| | |
|---|---|
| **Base** | `{host}/api/v1/fpa` |
| **Auth** | `Authorization: Bearer {token}` |
| **UI routes** | `/forecasting/models/{id}/worksheet` (Planning + `?view=compare`) · `/forecasting/scenarios` |
| **Related** | Model setup: [fpa-model-setup-api-requirements.md](./fpa-model-setup-api-requirements.md) · FE feedback: [fpa-api-frontend-feedback.md](./fpa-api-frontend-feedback.md) |

Envelope (all success responses):

```json
{ "success": true, "data": { } }
```

Error envelope:

```json
{
  "success": false,
  "code": "VALIDATION",
  "message": "Human-readable summary",
  "errors": [{ "code": "MISSING_FIELD", "field": "versionId", "message": "versionId is required" }]
}
```

| HTTP | When |
|------|------|
| **400** | Validation / bad body (`VALIDATION`) |
| **403** | Version locked / insufficient role (`LOCKED`, `FORBIDDEN`) |
| **404** | Model / scenario / version / driver not found |
| **409** | Concurrency conflict on cell update (`CONFLICT`) |

---

## Priority

| Priority | Deliverable | Why |
|----------|-------------|-----|
| **P0** | Enriched multi-scenario `POST …/compare` (metrics matrix + assumptions) | Both Compare UIs are blocked without it |
| **P0** | Scenario CRUD: create / copy / promote | Scenarios page + Compare actions |
| **P0** | Drivers list + update (+ optional bulk) scoped by scenario/version | Assumptions editor + Planning drivers panel |
| **P1** | Compare `waterfall` + `sensitivity` in same response (or dedicated endpoints below) | Waterfall bridge + sensitivity board |
| **P1** | `GET /models/{id}/planning-summary` | Planning KPI strip / trend / workflow without demo fallbacks |
| **P2** | Collab approvals / threaded replies | Sidebar currently toast-only |

Existing grid / cell / version endpoints stay as-is (already used by the worksheet).

---

## Canonical metric codes (SRD order)

Backend **must** map model line items / rollups to these codes for Compare. Margins are percent (0–100 or already scaled % — FE displays with one decimal). Headcount is FTE count (not currency).

| `code` | Label | `unit` | `higherIsFavourable` |
|--------|-------|--------|----------------------|
| `REVENUE` | Revenue | `CURRENCY` | `true` |
| `COGS` | COGS | `CURRENCY` | `false` |
| `GROSS_PROFIT` | Gross Profit | `CURRENCY` | `true` |
| `GROSS_MARGIN` | Gross Margin | `PERCENT` | `true` |
| `OPEX` | Opex | `CURRENCY` | `false` |
| `EBITDA` | EBITDA | `CURRENCY` | `true` |
| `EBITDA_MARGIN` | EBITDA Margin | `PERCENT` | `true` |
| `CAPEX` | Capex | `CURRENCY` | `false` |
| `HEADCOUNT` | Headcount (FTE) | `COUNT` | `true` |

If a code cannot be computed, return `null` for that scenario’s value (not omit the metric row).

Suggested SRD scenario names (seed / display only — IDs are authoritative):

`Base Case`, `Upside Case`, `Downside Case`, `FX Shock`, `Hiring Freeze`, `Cost Reduction`, `Fundraising Case`, `Expansion Case`

Plus planning tabs often used: `Budget 2026`, `Forecast Q3`, `Best Case`, etc. FE will **not** invent fake `__demo__` scenarios when the API returns a non-empty list.

---

# A. Planning Workspace (Planning tab)

## A1. Bootstrap (already exists — keep contracts stable)

### `GET /v1/fpa/models` → **200**

List models. FE picks latest published / user selection.

### `GET /v1/fpa/models/{modelId}` → **200**

Must include:

```json
{
  "id": "cmr…",
  "name": "FY2026 Operating Plan",
  "baseCurrency": "USD",
  "status": "PUBLISHED",
  "defaultVersionId": "ver…",
  "defaultScenarioId": "scn…",
  "scenarios": [
    {
      "id": "scn…",
      "modelId": "cmr…",
      "name": "Base Case",
      "scenarioType": "BASE",
      "description": null,
      "isOfficial": true,
      "status": "ACTIVE"
    }
  ],
  "versions": [
    {
      "id": "ver…",
      "modelId": "cmr…",
      "name": "Working",
      "status": "DRAFT"
    }
  ]
}
```

### `GET /v1/fpa/models/{modelId}/scenarios` → **200**

Same scenario objects as nested on the model (array in `data`).

### `GET /v1/fpa/models/{modelId}/versions` → **200**

Array of versions in `data`.

---

## A2. Grid / cells (already exists)

### `GET /v1/fpa/models/{modelId}/grid?versionId=&scenarioId=&cycleId=` → **200**

Query:

| Param | Required | Notes |
|-------|----------|-------|
| `versionId` | yes | |
| `scenarioId` | yes | |
| `cycleId` | no | Budget-cycle scoped owner view |

Response must include periods, rows/line items, cells with `id`, `value`, `isEditable`, `isLocked`, `cellStatus`, `recordVersion`, `periodRole`.

### `POST /v1/fpa/models/{modelId}/cells/update` → **200**

```json
{
  "cellId": "cell…",
  "value": 125000,
  "recordVersion": 3
}
```

### `POST /v1/fpa/models/{modelId}/cells/bulk-operation` → **200**

Spread / copy-forward style ops (existing client).

### `POST /v1/fpa/models/{modelId}/cells/apply-growth` → **200**

```json
{
  "versionId": "ver…",
  "scenarioId": "scn…",
  "ratePercent": 3.5,
  "lineItemIds": ["li…"],
  "periodFrom": "2026-04-01",
  "periodTo": "2026-12-01"
}
```

### `GET /v1/fpa/models/{modelId}/grid/validations?versionId=` → **200**

### Cell comments

- `GET /v1/fpa/models/{modelId}/cells/{cellId}/comments`
- `POST /v1/fpa/models/{modelId}/cells/{cellId}/comments` body `{ "body": "…" }`

### `POST /v1/fpa/versions/{versionId}/seed-cells` → **200**

```json
{
  "scenarioId": "scn…",
  "sourceVersionId": null,
  "fillMissing": true
}
```

Locked version → **403** on cell mutate endpoints.

---

## A3. Drivers (Planning panel + Compare assumptions)

### `GET /v1/fpa/models/{modelId}/drivers?scenarioId=&versionId=&category=` → **200**

```json
{
  "success": true,
  "data": [
    {
      "id": "drv…",
      "modelId": "cmr…",
      "code": "VOLUME_GROWTH",
      "name": "Volume Growth",
      "category": "Revenue",
      "value": 3.2,
      "unit": "%",
      "periodDate": "2026-01-01",
      "scenarioId": "scn…",
      "versionId": "ver…",
      "requiresApproval": false
    }
  ]
}
```

When `scenarioId` is omitted, return drivers for all scenarios of the model (FE filters), **or** prefer always requiring `scenarioId` + `versionId` for Planning tab.

### `POST /v1/fpa/models/{modelId}/drivers` → **201**

```json
{
  "code": "VOLUME_GROWTH",
  "name": "Volume Growth",
  "category": "Revenue",
  "value": 3.2,
  "unit": "%",
  "periodDate": "2026-01-01",
  "scenarioId": "scn…",
  "versionId": "ver…",
  "requiresApproval": false
}
```

### `PUT /v1/fpa/drivers/{driverId}` → **200**

```json
{
  "value": 4.1,
  "unit": "%",
  "name": "Volume Growth",
  "category": "Revenue",
  "requiresApproval": false
}
```

### `PUT /v1/fpa/models/{modelId}/drivers/bulk` → **200** (P0 recommended)

Used when Compare assumptions editor saves many cells at once.

**Request:**

```json
{
  "versionId": "ver…",
  "updates": [
    {
      "driverId": "drv…",
      "value": 4.1
    },
    {
      "code": "PRICE_CHANGE",
      "scenarioId": "scn…",
      "value": 2.0,
      "unit": "%",
      "name": "Price Change"
    }
  ]
}
```

- Prefer `driverId` when known.
- If only `code` + `scenarioId` (+ optional `versionId` from body root), upsert that driver’s value.
- Locked version → **403**.

**Response:**

```json
{
  "success": true,
  "data": {
    "updated": 2,
    "drivers": [ { "id": "drv…", "code": "VOLUME_GROWTH", "value": 4.1, "scenarioId": "scn…" } ]
  }
}
```

---

## A4. Planning summary (P1 — new)

Removes KPI / trend / workflow demo fallbacks on the Planning chrome.

### `GET /v1/fpa/models/{modelId}/planning-summary?versionId=&scenarioId=` → **200**

**Query:** `versionId` (required), `scenarioId` (required).

**Response:**

```json
{
  "success": true,
  "data": {
    "modelId": "cmr…",
    "versionId": "ver…",
    "scenarioId": "scn…",
    "currency": "USD",
    "kpis": [
      {
        "code": "REVENUE",
        "label": "Revenue Forecast",
        "value": 125800000,
        "displayValue": "$125.8M",
        "deltaPct": 4.2,
        "deltaLabel": "vs prior month",
        "up": true,
        "sparkline": [118, 120, 121, 123, 124, 125.8]
      },
      {
        "code": "EBITDA",
        "label": "EBITDA",
        "value": 28400000,
        "displayValue": "$28.4M",
        "deltaPct": 2.1,
        "up": true,
        "sparkline": [24, 25, 26, 27, 28, 28.4]
      },
      {
        "code": "CLOSING_CASH",
        "label": "Closing Cash",
        "value": 41200000,
        "displayValue": "$41.2M",
        "deltaPct": -1.4,
        "up": false,
        "sparkline": [45, 44, 43, 42, 41.5, 41.2]
      },
      {
        "code": "CASH_RUNWAY",
        "label": "Cash Runway",
        "value": 14.2,
        "displayValue": "14.2 months",
        "unit": "MONTHS",
        "deltaPct": 0.5,
        "up": true,
        "sparkline": [12, 12.5, 13, 13.5, 14, 14.2]
      },
      {
        "code": "FORECAST_ACCURACY",
        "label": "Forecast Accuracy",
        "value": 94.2,
        "displayValue": "94.2%",
        "unit": "PERCENT",
        "deltaPct": 1.1,
        "up": true,
        "sparkline": [90, 91, 92, 93, 94, 94.2]
      }
    ],
    "trend": [
      { "period": "2025-12-01", "label": "Dec", "actual": 110, "plan": 108 },
      { "period": "2026-01-01", "label": "Jan", "actual": 115, "plan": 114 },
      { "period": "2026-02-01", "label": "Feb", "actual": null, "plan": 120 }
    ],
    "workflowSteps": [
      {
        "id": "ws1",
        "name": "Dept input",
        "stage": "INPUT",
        "status": "COMPLETE",
        "completedTasks": 12,
        "totalTasks": 12,
        "percent": 100
      },
      {
        "id": "ws2",
        "name": "FP&A review",
        "stage": "REVIEW",
        "status": "IN_PROGRESS",
        "completedTasks": 4,
        "totalTasks": 10,
        "percent": 40
      }
    ]
  }
}
```

**Fallback until this ships:** FE may keep using `GET /v1/fpa/home/dashboard` KPIs, but prefer this scoped summary once available.

---

# B. Scenario Comparison

Used by:

1. Worksheet Compare mode — `PlanningScenarioCompareView`
2. Standalone page — `/forecasting/scenarios`

## B1. Enriched compare (P0 — extend existing)

### `POST /v1/fpa/scenarios/{anchorScenarioId}/compare` → **200**

Path `anchorScenarioId` is the **default variance anchor** (baseline for Δ $ / Δ %). Body may override.

**Request:**

```json
{
  "versionId": "ver…",
  "scenarioIds": ["scn-a", "scn-b", "scn-c"],
  "anchorScenarioId": "scn-a",
  "metrics": [
    "REVENUE",
    "COGS",
    "GROSS_PROFIT",
    "GROSS_MARGIN",
    "OPEX",
    "EBITDA",
    "EBITDA_MARGIN",
    "CAPEX",
    "HEADCOUNT"
  ],
  "includeAssumptions": true,
  "includeWaterfall": true,
  "includeSensitivity": true,
  "waterfallMetric": "EBITDA",
  "waterfallFromScenarioId": "scn-a",
  "waterfallToScenarioId": "scn-b"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `versionId` | **yes** | |
| `scenarioIds` | **yes** | 1–N scenarios to include as columns. Must include or FE will union with path id |
| `anchorScenarioId` | no | Defaults to path `{anchorScenarioId}` |
| `metrics` | no | Default = full canonical list above |
| `includeAssumptions` | no | Default `true` |
| `includeWaterfall` | no | Default `true` (P1 if thin) |
| `includeSensitivity` | no | Default `true` (P1 if thin) |
| `waterfallMetric` | no | Default `EBITDA` |
| `waterfallFromScenarioId` / `waterfallToScenarioId` | no | Bridge endpoints; default anchor → first non-anchor selected |

**Backward compatibility:** FE still accepts legacy pair payload:

```json
{
  "left": { "id": "…", "name": "…" },
  "right": { "id": "…", "name": "…" },
  "versionId": "…",
  "rows": [{ "code": "REVENUE", "left": 1, "right": 2, "delta": 1 }]
}
```

…but **backend should return the enriched shape below**. FE will map enriched → UI; if only legacy `rows` are present, FE builds a 2-column matrix.

**Enriched response (required for full UI):**

```json
{
  "success": true,
  "data": {
    "versionId": "ver…",
    "anchorScenarioId": "scn-a",
    "scenarios": [
      { "id": "scn-a", "name": "Base Case", "scenarioType": "BASE" },
      { "id": "scn-b", "name": "Upside Case", "scenarioType": "UPSIDE" },
      { "id": "scn-c", "name": "Downside Case", "scenarioType": "DOWNSIDE" }
    ],
    "metrics": [
      {
        "code": "REVENUE",
        "label": "Revenue",
        "unit": "CURRENCY",
        "higherIsFavourable": true,
        "values": {
          "scn-a": 125800000,
          "scn-b": 132000000,
          "scn-c": 118500000
        },
        "varianceAbs": {
          "scn-b": 6200000,
          "scn-c": -7300000
        },
        "variancePct": {
          "scn-b": 4.93,
          "scn-c": -5.8
        }
      },
      {
        "code": "GROSS_MARGIN",
        "label": "Gross Margin",
        "unit": "PERCENT",
        "higherIsFavourable": true,
        "values": { "scn-a": 62.1, "scn-b": 63.4, "scn-c": 60.8 },
        "varianceAbs": { "scn-b": 1.3, "scn-c": -1.3 },
        "variancePct": { "scn-b": 2.09, "scn-c": -2.09 }
      }
    ],
    "assumptions": [
      {
        "driverId": "drv-1",
        "driverCode": "VOLUME_GROWTH",
        "driverName": "Volume Growth",
        "unit": "%",
        "category": "Revenue",
        "byScenario": {
          "scn-a": { "driverId": "drv-1a", "value": 3.2 },
          "scn-b": { "driverId": "drv-1b", "value": 5.0 },
          "scn-c": { "driverId": "drv-1c", "value": 1.5 }
        }
      },
      {
        "driverCode": "PRICE_CHANGE",
        "driverName": "Price Change",
        "unit": "%",
        "byScenario": {
          "scn-a": { "driverId": "drv-2a", "value": 1.0 },
          "scn-b": { "driverId": "drv-2b", "value": 2.5 },
          "scn-c": { "driverId": "drv-2c", "value": 0.0 }
        }
      }
    ],
    "waterfall": {
      "metricCode": "EBITDA",
      "fromScenarioId": "scn-a",
      "toScenarioId": "scn-b",
      "steps": [
        { "key": "anchor", "label": "Base Case", "value": 42000000, "delta": null },
        { "key": "volume", "label": "Volume", "value": null, "delta": 2100000 },
        { "key": "price", "label": "Price", "value": null, "delta": 1800000 },
        { "key": "opex", "label": "Opex", "value": null, "delta": -900000 },
        { "key": "result", "label": "Upside Case", "value": 45000000, "delta": null }
      ]
    },
    "sensitivity": [
      {
        "driverCode": "PRICE",
        "driverName": "Price Change",
        "low": -2.5,
        "base": 0,
        "high": 3.1,
        "impactMetric": "EBITDA",
        "unit": "%"
      },
      {
        "driverCode": "VOLUME",
        "driverName": "Volume Growth",
        "low": -4.0,
        "base": 0,
        "high": 5.5,
        "impactMetric": "EBITDA",
        "unit": "%"
      }
    ]
  }
}
```

Rules:

- `varianceAbs` / `variancePct` keys = non-anchor scenario ids (`value_scenario − value_anchor`).
- Percent metrics: store as percent points (e.g. `62.1` means 62.1%).
- If waterfall/sensitivity not ready, return `waterfall: null` / `sensitivity: []` (do not invent fake numbers). FE shows empty state.

---

## B2. Scenario create / copy / promote (P0)

### `POST /v1/fpa/scenarios` → **201**

```json
{
  "modelId": "cmr…",
  "name": "FX Shock",
  "scenarioType": "WHAT_IF",
  "description": "USD/ZAR -10%"
}
```

`scenarioType`: `BASE` | `UPSIDE` | `DOWNSIDE` | `WHAT_IF` | `CUSTOM` | …

**Response `data`:** full `FpaScenario` object.

### `POST /v1/fpa/scenarios/{scenarioId}/copy` → **201**

Duplicate scenario (cells + drivers) under the same model.

```json
{
  "versionId": "ver…",
  "name": "Base Case (copy)",
  "scenarioType": "CUSTOM"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "scenario": {
      "id": "scn-new",
      "modelId": "cmr…",
      "name": "Base Case (copy)",
      "scenarioType": "CUSTOM"
    },
    "cellsCopied": 1240,
    "driversCopied": 18
  }
}
```

### `POST /v1/fpa/scenarios/{scenarioId}/promote` → **200**

Mark scenario as official / active forecast (or create/promote working forecast version — document chosen behaviour in response).

```json
{
  "versionId": "ver…",
  "name": "Active Forecast"
}
```

Body may be `{}`.

**Response:** promoted `FpaScenario` or `{ "scenario": { … } }`.

---

## B3. Standalone sensitivity run (P1)

When Compare does not embed sensitivity, FE can call:

### `POST /v1/fpa/models/{modelId}/sensitivity-analysis` → **200**

```json
{
  "versionId": "ver…",
  "scenarioId": "scn…",
  "driverLineItemId": "li-or-drv-ref…",
  "shock": { "type": "PERCENT", "value": 10 },
  "targetLineItemIds": ["li-ebitda"],
  "periodRange": { "from": "2026-01-01", "to": "2026-12-01" }
}
```

**Response** (existing FE type `FpaSensitivityAnalysis`):

```json
{
  "success": true,
  "data": {
    "driver": {
      "lineItemId": "…",
      "code": "PRICE",
      "name": "Price Change",
      "shock": { "type": "PERCENT", "value": 10 },
      "shockLabel": "+10%"
    },
    "impacts": [
      {
        "lineItemId": "…",
        "name": "EBITDA",
        "code": "EBITDA",
        "baseTotal": 42e6,
        "shockedTotal": 45e6,
        "deltaTotal": 3e6,
        "deltaPct": 7.1
      }
    ],
    "series": {
      "periods": ["2026-01", "2026-02"],
      "baseCase": [3.5e6, 3.6e6],
      "shocked": [3.7e6, 3.8e6],
      "unit": "CURRENCY"
    },
    "versionId": "ver…",
    "scenarioId": "scn…"
  }
}
```

For the **Low / Base / High** matrix on the Scenarios page, prefer returning `sensitivity[]` on compare (B1). Optional dedicated endpoint:

### `GET /v1/fpa/models/{modelId}/sensitivity-matrix?versionId=&scenarioId=` → **200**

```json
{
  "success": true,
  "data": {
    "impactMetric": "EBITDA",
    "unit": "%",
    "rows": [
      { "driverCode": "PRICE", "driverName": "Price Change", "low": -2.5, "base": 0, "high": 3.1 }
    ]
  }
}
```

---

# C. Collab / actions (P2 — document only)

| UI action | Current FE | Backend needed |
|-----------|------------|----------------|
| Cell comments | Live `GET/POST …/comments` | Done |
| Sidebar threaded replies / likes / attachments | Toast / local | Thread reply API TBD |
| Approve / Return in sidebar | Toast | Use existing task `approve` / `return` when task id available |
| Export CSV | Worksheet export job | Done |
| Copy link | Client-only | N/A |
| Refresh calc | Re-fetch grid / summary | Optional `POST /models/{id}/recalculate` |

---

# D. Frontend consumption map

| UI | Endpoints |
|----|-----------|
| Worksheet Planning grid | `GET grid`, cell update/bulk/growth, validations, comments, seed-cells |
| Scenario / version tabs | `GET models/{id}`, scenarios, versions — **no demo padding when `data.length > 0`** |
| Drivers panel | `GET drivers`, `PUT drivers/{id}`, `PUT …/drivers/bulk` |
| KPI / trend / workflow strip | Prefer `GET planning-summary`; else dashboard |
| Compare metric table | `POST scenarios/{id}/compare` enriched `metrics` |
| Compare assumptions edit | Compare `assumptions` + `PUT drivers` / bulk |
| Waterfall / sensitivity boards | Compare `waterfall` / `sensitivity` (empty ok if null) |
| Scenarios page list | `GET scenarios?modelId=` |
| Duplicate | `POST scenarios/{id}/copy` |
| Promote | `POST scenarios/{id}/promote` |
| Create scenario | `POST scenarios` |

---

# E. Acceptance checklist (backend)

- [ ] `POST …/compare` with `scenarioIds` (≥2) returns matrix `metrics[].values` keyed by scenario id
- [ ] Anchor variances present for every non-anchor scenario
- [ ] Canonical metric codes covered (nulls allowed)
- [ ] `assumptions[].byScenario` includes `driverId` + `value` for editable cells
- [ ] `PUT /drivers/{id}` and/or `PUT …/drivers/bulk` persist and round-trip on next compare
- [ ] Create / copy / promote return new scenario objects usable immediately in list + compare
- [ ] Locked version → **403** on mutate (cells, drivers, copy if policy requires)
- [ ] Missing scenario/version → **404**
- [ ] Waterfall / sensitivity either populated or explicitly null/empty (no fake data)
- [ ] `GET planning-summary` (P1) returns 5 KPIs + trend for selected version/scenario

---

# F. Example happy-path sequence

1. `GET /models` → pick model  
2. `GET /models/{id}` → `defaultVersionId`, `defaultScenarioId`, scenario list  
3. `GET /models/{id}/grid?versionId=&scenarioId=` → Planning tab  
4. `GET /models/{id}/drivers?scenarioId=&versionId=` → drivers panel  
5. `GET /models/{id}/planning-summary?versionId=&scenarioId=` → KPI strip  
6. User opens Compare → `POST /scenarios/{anchor}/compare` with `scenarioIds`  
7. User edits assumption → `PUT /drivers/{id}` or bulk → re-compare  
8. User duplicates → `POST /scenarios/{id}/copy` → refresh list + compare  
9. User promotes → `POST /scenarios/{id}/promote` → refresh list / official flag  

---

*Contract owner: Frontend (Model Planning). Backend should implement shapes exactly as specified so FE can drop mock/demo primary data paths.*
