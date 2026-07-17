# FP&A Model Planning — Stage 4 (Scenarios + Assumptions)

**Date:** 2026-07-16  
**Status:** Implemented (backend)  
**Related:** [fpa-model-planning-stage3-api.md](./fpa-model-planning-stage3-api.md), [fpa-model-planning-stage4-backend-asks.md](./fpa-model-planning-stage4-backend-asks.md)

Stage 4 product rules:

- Scenarios inherit from Base; store overrides only (`parentScenarioId` when copying with inheritance).
- Compare returns enriched multi-scenario `metrics[]`, `assumptions[]`, optional `waterfall` / `sensitivity`.
- Assumptions library drivers are scoped by `modelId` + `versionId` + `scenarioId`.
- Driver metadata includes `confidence` and `spreadingMethod`; DELETE is supported when unreferenced.

---

## 1. Enriched multi-scenario compare

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
  "includeSensitivity": true
}
```

Response includes `scenarios[]`, `metrics[]` (values + varianceAbs/Pct vs anchor), `assumptions[]`, `waterfall`, `sensitivity` (empty for now). Legacy `left` / `right` / `rows` still present for older FE.

| Error | When |
|-------|------|
| 400 | `<2` scenarios or missing `versionId` |
| 404 | Unknown scenario / version |

---

## 2. Fast copy-from-Base

```http
POST /api/v1/fpa/scenarios/{baseScenarioId}/copy
```

```json
{
  "versionId": "ver_…",
  "name": "Best Case",
  "scenarioType": "UPSIDE",
  "inheritFromSource": true
}
```

- Sets `parentScenarioId` when `inheritFromSource !== false`
- Copies **drivers + cells** via MySQL `INSERT…SELECT` (no per-row Node loop)
- Returns `{ scenario, cellsCopied, driversCopied }` with inheritance fields

---

## 3. Inheritance metadata

On list/create/copy/promote/update scenario objects:

| Field | Notes |
|-------|--------|
| `parentScenarioId` | null for root |
| `inheritsFromScenarioId` | alias of parent |
| `parentScenarioName` | display |

Also: `PUT/PATCH /scenarios/{id}`, `POST /scenarios/{id}/archive`.

---

## 4. Assumptions library (drivers)

| Method | Path |
|--------|------|
| GET | `/models/{id}/drivers?versionId=&scenarioId=` — **filters both when provided** |
| POST | `/models/{id}/drivers` — requires `code`, `name`, `scenarioId`, `versionId` |
| PUT | `/drivers/{id}` — value/period + optional `confidence`, `spreadingMethod`; returns `updatedCells` |
| DELETE | `/drivers/{id}` — 409 if referenced by formulas/cells |

| Field | Values |
|-------|--------|
| `confidence` | `HIGH` \| `MEDIUM` \| `LOW` |
| `spreadingMethod` | `EVEN` \| `SEASONAL` \| `PRIOR_YEAR` \| `MANUAL` \| … |

Archived versions → `403 LOCKED_VERSION`. Locked published versions stay editable for planning assumptions.

---

## Migration

```bash
npm run db:migrate:fpa-scenario-stage4
```

Adds `planning_scenarios.parent_scenario_id`, `planning_drivers.confidence`, `planning_drivers.spreading_method`.

## UAT

```bash
# clear any shell DATABASE_URL first — DEV nts only
npm run uat:fpa:model-planning-stage4
```

---

## FE consumers

| Area | Files |
|------|-------|
| API types / client | `lib/api/fpa-api.ts` |
| Scenarios page | `components/fpa/fpa-scenario-comparison.tsx` |
| Worksheet compare | `components/fpa/planning/planning-scenario-compare-view.tsx` |
| Assumptions library | `components/fpa/fpa-drivers-library.tsx` |
| Compare mapper | `lib/fpa/scenario-compare.ts` |
| Stages status | [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md) |

---

## Verify with FE (acceptance)

- [ ] `/forecasting/scenarios` → create Best/Downside from Base → inheritance label shows parent  
- [ ] Compare ≥3 scenarios fills metric columns from `metrics[]` (legacy banner only if BE falls back)  
- [ ] `/forecasting/drivers` list/create/update persists `confidence` + `spreadingMethod`  
- [ ] Delete driver succeeds when unreferenced; **409** when in use  
- [ ] Archive scenario removes it from active list (or marks archived)
