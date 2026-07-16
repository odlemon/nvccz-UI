# Backend asks — Model Planning Stage 3 (Enter drivers and plan)

**Date:** 2026-07-16  
**FE status:** Worksheet Stage 3 path largely wired (INPUT-only edit, EVEN spread, copy/growth/bulk, Driver Assumptions panel, Cell Details, post-edit KPI/validation refresh)  
**Context:** SRD Stage 3 — *Enter drivers and plan* (SRD §32–35, §37; stages doc Stage 3)  
**Related:** [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md), [`fpa-model-planning-builder-srd.md`](./fpa-model-planning-builder-srd.md)

---

## Product rules

| Rule | Why |
|------|-----|
| Users edit **INPUT** / authorised drivers only | CALCULATED lines come from server formulas |
| Server recalculates dependents on write | FE must never treat browser CALCULATED values as source of truth |
| Driver Assumptions shows **prior actual vs plan vs change** | Owners plan through assumptions, not raw P&L formulas |
| Spread supports phasing methods beyond even | Annual → periods (SRD §331) |
| Blocking validations surface after edits | “Done when: no blocking validation errors” |

---

## What FE already does

| Step | FE today | Files |
|------|----------|-------|
| Scenario tabs | Wired | `planning-workspace-chrome.tsx`, `fpa-worksheet.tsx` |
| Edit INPUT only / lock CALCULATED | `isReadOnly` + cell state | `fpa-worksheet.tsx` |
| Spread EVEN | `POST …/cells/spread` (no method) | `fpa-api.ts` → `spreadCells` |
| Copy / growth / bulk | Live | `copyForward`, `applyGrowth`, `bulkCellOperation` |
| Driver panel UI | Actual / Plan / Change columns | `DriverAssumptionsCard` |
| Cell Details + comments | Live | `getCellDetail`, collab rail |
| Post-edit refresh | `refreshAfterPlanEdit` → planning-summary + validations + dashboard | `fpa-worksheet.tsx` |
| Cell write merge | Uses `updatedCells` when returned | `saveCell` |

---

## Asks (needs BE)

### 1. Driver prior actual on list/get (critical for Stage 3 panel)

```http
GET /api/v1/fpa/models/{modelId}/drivers?versionId=&scenarioId=
```

**Add on each driver (or document existing aliases):**

```json
{
  "id": "drv_…",
  "code": "PRICE",
  "name": "Average selling price",
  "value": 12.5,
  "unit": "USD",
  "priorActual": 11.8,
  "priorPeriodLabel": "FY2025 Actual"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `priorActual` | `number \| null` | Preferred. FE also accepts `priorValue` |
| `priorPeriodLabel` | `string \| null` | Optional column header hint |

**Why:** Driver Assumptions table has “FY2025 Actual” / “FY2026 Plan” / “Change”. Without prior, Actual column is always “—” and Change is meaningless.

**Errors:** none new — omit fields as `null` if unknown.

**Verify with FE:** Open worksheet → Driver Assumptions → Actual column populated for drivers that have history; Change % updates when Plan edits.

**FE consumers:** `FpaDriver.priorActual` / `priorValue` in `lib/api/fpa-api.ts`; mapped in `fpa-worksheet.tsx` → `driverRows`.

---

### 2. Spread methods beyond EVEN (important)

```http
POST /api/v1/fpa/models/{modelId}/cells/spread
```

**Body FE will send when methods exist:**

```json
{
  "versionId": "ver_…",
  "scenarioId": "scn_…",
  "lineItemId": "li_…",
  "value": 1200000,
  "method": "EVEN",
  "cycleId": "mpc_…",
  "weights": [0.05, 0.05, 0.08, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.08, 0.07, 0.07],
  "periodDates": ["2026-01-01", "2026-02-01"]
}
```

| `method` | Behaviour (SRD) |
|----------|-----------------|
| `EVEN` | Equal split (current FE default) |
| `CUSTOM_WEIGHT` | Use `weights[]` (sum ≈ 1) |
| `PRIOR_YEAR_PATTERN` / `HISTORICAL_PATTERN` | Shape from prior actuals |
| `WORKING_DAYS` / `SEASONAL_PROFILE` | Optional later |

**Response (unchanged shape OK):**

```json
{
  "success": true,
  "data": {
    "spreadAcross": 12,
    "cells": [/* updated INPUT cells + ideally dependent CALCULATED */]
  }
}
```

**Errors:**

| Code | When |
|------|------|
| `INVALID_WEIGHTS` | weights length ≠ periods or sum invalid |
| `CELL_NOT_EDITABLE` / `ACTUAL_PERIOD_LOCKED` | Same as other cell writes |
| `UNSUPPORTED_SPREAD_METHOD` | Unknown method |

**Why:** Stage 3 step 4 explicitly calls out weights / patterns, not only EVEN.

**Verify with FE:** Once BE accepts `method`, FE will add a method picker; until then FE stays on EVEN-only.

**FE consumers:** `fpaApi.spreadCells` in `lib/api/fpa-api.ts`; `runTool("spread")` in `fpa-worksheet.tsx`.

---

### 3. Cell update / tools always return dependents (confirm contract)

```http
POST /api/v1/fpa/models/{modelId}/cells/update
POST /api/v1/fpa/models/{modelId}/cells/spread
POST /api/v1/fpa/models/{modelId}/cells/copy-forward
POST /api/v1/fpa/models/{modelId}/cells/apply-growth
POST /api/v1/fpa/models/{modelId}/cells/bulk-operation
PUT  /api/v1/fpa/drivers/{driverId}
```

**Product rule:** After any authorised INPUT/driver write, server recalculates affected CALCULATED cells and returns them (or FE must re-`GET` grid).

**Preferred on cell update:**

```json
{
  "success": true,
  "data": {
    "id": "cell_…",
    "value": 100,
    "updatedCells": [
      { "id": "cell_rev_…", "lineItemId": "…", "value": 5000, "cellStatus": "CALCULATED" }
    ]
  }
}
```

**On driver update:** either return `{ driver, updatedCells }` **or** document that FE must `GET …/grid` after save (FE already reloads grid after driver save).

**Optional explicit recalc (nice-to-have):**

```http
POST /api/v1/fpa/models/{modelId}/recalculate
```

```json
{ "versionId": "ver_…", "scenarioId": "scn_…", "cycleId": "mpc_…" }
```

---

### 4. Planning summary freshness after edits (important for KPIs)

```http
GET /api/v1/fpa/models/{modelId}/planning-summary?versionId=&scenarioId=
```

**Rule:** Values (Revenue, Gross Margin, EBITDA, variance, trend) must reflect the latest committed cell/driver values for that version/scenario — not a stale cache from cycle open.

**Why:** FE calls this after every successful plan edit (`refreshAfterPlanEdit`). If summary lags, KPI strip lies until full page refresh.

**Verify with FE:** Edit an INPUT that feeds Revenue → KPI Revenue updates without clicking Refresh.

---

### 5. Materiality threshold for commentary (Stage 3 step 6 / Stage 5 gate)

Optional for pure Stage 3 entry; needed before hard submit gates.

Expose on cycle or settings:

```json
{
  "materialVariancePct": 5
}
```

Or on validation / submit-check payload: lines where `|variancePct| >= threshold` require commentary.

**FE today:** Comments + Cell Details exist; no automatic “explain this move” gate yet.

---

## Error codes FE already handles on cell writes

`ACTUAL_PERIOD_LOCKED` · `DEPARTMENT_SCOPE_LOCKED` · `CONFLICT` (409) · `LOCKED_VERSION` · `CELL_NOT_EDITABLE`

---

## How to verify end-to-end (manual)

1. Open MPC worksheet on Base / Budget scenario.  
2. Confirm CALCULATED cells are not editable; INPUT cells accept values.  
3. Edit INPUT → dependent CALCULATED cells change (via `updatedCells` or grid reload).  
4. KPI strip updates without manual Refresh.  
5. Driver Assumptions Actual column shows prior when BE sends `priorActual`.  
6. Spread EVEN still works; weights methods when BE ships.  
7. Validations refresh; blocking errors appear in submit banner area.

---

*Source of truth for BE Stage 3 gaps — July 2026.*
