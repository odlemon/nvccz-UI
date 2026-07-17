# Backend asks — Model Planning Stage 4 (Scenarios + Assumptions)

**Date:** 2026-07-17
**FE status:** Wired to Stage 4 contract; sensitivity and Cash Runway remain unavailable when omitted
**BE status:** Core contracts implemented; compare enrichment residual open
**Context:** SRD Stage 4 — *Scenarios + Compare* (§38–40) + Assumptions library (§43+)

---

## Resolution

The original Stage 4 asks were delivered by backend. Canonical contract:

**[`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md)**

| Ask | Status |
|-----|--------|
| Enriched `POST …/compare` response shape (`metrics[]`, `assumptions[]`, waterfall/sensitivity) | Done |
| Fast `POST …/copy` with `parentScenarioId` + cells/drivers counts | Done |
| Inheritance fields on scenario objects | Done |
| `PUT/PATCH /scenarios/{id}`, `POST …/archive` | Done |
| Drivers list filters `versionId` + `scenarioId` | Done |
| Driver PUT `confidence` / `spreadingMethod` + `updatedCells` | Done |
| `DELETE /drivers/{id}` (409 if referenced) | Done |
| Populate requested sensitivity and all compare top-card metrics | **Residual / open** |

---

## Residual / open — Populate Stage 4 compare sensitivity and top cards

### Product rule / why

The current compare request already sends `includeSensitivity: true`, but the confirmed response may contain `sensitivity: []`. The FE therefore renders an empty sensitivity matrix. The worksheet compare also requires five server-backed top cards: Revenue, Gross Margin, EBITDA, Cash Runway, and Headcount. Cash Runway currently remains `—`; the FE must not invent it from local assumptions.

This residual only completes the delivered compare response. It does not reopen scenario copy, inheritance, assumptions, driver mutations, archive, or other delivered Stage 4 contracts.

### Endpoint and request

```http
POST /api/v1/fpa/scenarios/{anchorScenarioId}/compare
Content-Type: application/json
```

```json
{
  "versionId": "ver_123",
  "scenarioIds": ["scn_base", "scn_best", "scn_down"],
  "anchorScenarioId": "scn_base",
  "includeAssumptions": true,
  "includeWaterfall": true,
  "includeSensitivity": true,
  "waterfallMetric": "EBITDA",
  "waterfallFromScenarioId": "scn_base",
  "waterfallToScenarioId": "scn_best"
}
```

When `includeSensitivity` is `true`, return calculated rows when applicable. An empty array is valid only when no eligible drivers exist; in that case include a machine-readable reason such as `sensitivityUnavailableReason`.

### Required response

```json
{
  "success": true,
  "data": {
    "versionId": "ver_123",
    "anchorScenarioId": "scn_base",
    "scenarios": [
      { "id": "scn_base", "name": "Base Case", "scenarioType": "BASE" },
      { "id": "scn_best", "name": "Best Case", "scenarioType": "UPSIDE" },
      { "id": "scn_down", "name": "Downside", "scenarioType": "DOWNSIDE" }
    ],
    "metrics": [
      {
        "code": "REVENUE",
        "label": "Revenue",
        "unit": "CURRENCY",
        "higherIsFavourable": true,
        "values": {
          "scn_base": 12000000,
          "scn_best": 13200000,
          "scn_down": 10800000
        },
        "varianceAbs": {
          "scn_best": 1200000,
          "scn_down": -1200000
        },
        "variancePct": {
          "scn_best": 10,
          "scn_down": -10
        }
      },
      {
        "code": "GROSS_MARGIN",
        "label": "Gross Margin",
        "unit": "PERCENT",
        "higherIsFavourable": true,
        "values": {
          "scn_base": 42,
          "scn_best": 45,
          "scn_down": 38
        },
        "varianceAbs": {
          "scn_best": 3,
          "scn_down": -4
        },
        "variancePct": {
          "scn_best": 7.14,
          "scn_down": -9.52
        }
      },
      {
        "code": "EBITDA",
        "label": "EBITDA",
        "unit": "CURRENCY",
        "higherIsFavourable": true,
        "values": {
          "scn_base": 1800000,
          "scn_best": 2400000,
          "scn_down": 900000
        },
        "varianceAbs": {
          "scn_best": 600000,
          "scn_down": -900000
        },
        "variancePct": {
          "scn_best": 33.33,
          "scn_down": -50
        }
      },
      {
        "code": "CASH_RUNWAY",
        "label": "Cash Runway",
        "unit": "MONTHS",
        "higherIsFavourable": true,
        "values": {
          "scn_base": 8.4,
          "scn_best": 11.2,
          "scn_down": 5.7
        },
        "varianceAbs": {
          "scn_best": 2.8,
          "scn_down": -2.7
        },
        "variancePct": {
          "scn_best": 33.33,
          "scn_down": -32.14
        }
      },
      {
        "code": "HEADCOUNT",
        "label": "Headcount",
        "unit": "COUNT",
        "higherIsFavourable": true,
        "values": {
          "scn_base": 120,
          "scn_best": 128,
          "scn_down": 112
        },
        "varianceAbs": {
          "scn_best": 8,
          "scn_down": -8
        },
        "variancePct": {
          "scn_best": 6.67,
          "scn_down": -6.67
        }
      }
    ],
    "sensitivity": [
      {
        "driverCode": "REVENUE_GROWTH",
        "driverName": "Revenue Growth",
        "low": 1250000,
        "base": 1800000,
        "high": 2380000,
        "impactMetric": "EBITDA",
        "unit": "CURRENCY"
      },
      {
        "driverCode": "GROSS_MARGIN",
        "driverName": "Gross Margin",
        "low": 1420000,
        "base": 1800000,
        "high": 2190000,
        "impactMetric": "EBITDA",
        "unit": "CURRENCY"
      }
    ],
    "sensitivityUnavailableReason": null
  },
  "message": null
}
```

Each `sensitivity[]` row requires:

- `driverCode`: stable driver code used as the row key
- `driverName`: display label
- `low`, `base`, `high`: calculated output values for the named `impactMetric`, not the input shock percentages
- `impactMetric`: output metric code, currently `EBITDA`
- `unit`: output unit such as `CURRENCY`, `PERCENT`, or `COUNT`

The `metrics[]` array must contain `REVENUE`, `GROSS_MARGIN`, `EBITDA`, `CASH_RUNWAY`, and `HEADCOUNT` for the compare top cards when those metrics apply to the model. Every metric requires `code`, `label`, `unit`, `higherIsFavourable`, `values` keyed by every requested scenario ID, and `varianceAbs` / `variancePct` keyed by each non-anchor scenario ID. Use explicit `null` for a genuinely unavailable value; do not omit a requested scenario key.

### Expected errors

- `400 INVALID_COMPARE_REQUEST` when fewer than two scenario IDs are supplied, the anchor is not included, or `versionId` is missing
- `400 INVALID_SENSITIVITY_CONFIGURATION` when sensitivity was requested but configured shocks or impact metrics are invalid
- `403` when the caller cannot view the model/version
- `404 SCENARIO_NOT_FOUND` or `404 VERSION_NOT_FOUND`
- `409 SCENARIO_VERSION_MISMATCH` when a requested scenario does not belong to the supplied version/model scope

### Verify with FE

- Open `/forecasting/scenarios`, select Base plus at least two comparison scenarios, and confirm the request sends `includeSensitivity: true`.
- Confirm the sensitivity table renders one row per returned driver with Low/Base/High values and no empty-state message.
- Open the Model Planning worksheet compare view and confirm Revenue, Gross Margin, EBITDA, Cash Runway, and Headcount top cards use returned values and anchor-relative deltas.
- Compare response values to the same version/scenario worksheet totals; change the selected scenarios and confirm all metric keys and sensitivity calculations change to the requested scope.
- For a model with no eligible sensitivity drivers, confirm `sensitivity: []` is paired with a non-null `sensitivityUnavailableReason`.

### FE consumers

- `lib/api/fpa-api.ts`
- `lib/fpa/scenario-compare.ts`
- `components/fpa/fpa-scenario-comparison.tsx`
- `components/fpa/planning/planning-scenario-compare-view.tsx`

---

## FE consumers

| Area | Files |
|------|-------|
| API types / client | `lib/api/fpa-api.ts` |
| Scenarios page | `components/fpa/fpa-scenario-comparison.tsx` |
| Assumptions library | `components/fpa/fpa-drivers-library.tsx` |
| Worksheet compare | `components/fpa/planning/planning-scenario-compare-view.tsx` |
| Stages status | [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md) |

---

## Verify with FE (acceptance)

- [ ] Create Best/Downside via copy-from-Base; inheritance label shows parent  
- [ ] Compare ≥3 scenarios uses enriched `metrics[]`  
- [ ] Assumptions library persists confidence + spreadingMethod  
- [ ] Delete driver works / shows 409 when referenced  
- [ ] Archive scenario available from Scenarios UI  

---

*Original asks are retained for history and the FE wiring map; the compare enrichment residual above remains open. July 2026.*
