# Backend asks — FP&A Home dashboard (`/forecasting`)

**Date:** 2026-07-17  
**Status:** **Implemented by BE and wired in FE**  
**Audience:** Backend + Frontend + QA  
**Route:** `/forecasting`  
**Primary FE:** [`components/fpa/fpa-home-board.tsx`](../components/fpa/fpa-home-board.tsx) — live dashboard with honest section empties  
**Existing client:** `fpaApi.getDashboard` → `GET /api/v1/fpa/home/dashboard` (`FpaHomeDashboard` in [`lib/api/fpa-api.ts`](../lib/api/fpa-api.ts))  
**Also used by:** worksheet KPI fallback via `fetchFpaDashboard`  
**Pack index:** [`fpa-remaining-modules-backend-asks.md`](./fpa-remaining-modules-backend-asks.md) Part C.0 / Part D  
**Playbook:** [`arcus-feature-delivery-playbook.md`](./arcus-feature-delivery-playbook.md)

---

## Product rule / why

Home is the **executive board** (SRD FP&A Home). Users land here first. It now consumes the enriched dashboard payload and shows **honest empty / error** states — demo scenario multipliers are no longer the live data path.

**Scope:** one primary `GET` that returns everything the board needs for the selected model / version / scenario / period. Prefer enriching the existing endpoint over inventing many micro-endpoints.

---

## Endpoint

```http
GET /api/v1/fpa/home/dashboard
```

### Query params

| Param | Required | Notes |
|-------|----------|--------|
| `modelId` | Prefer yes | Default to user’s primary / last model if omitted |
| `versionId` | Prefer yes | Working / locked / published version |
| `scenarioId` | Optional | Defaults to model `defaultScenarioId` / Base |
| `period` | Optional | As-of month `YYYY-MM-01` (or `YYYY-MM`) for KPI “vs prior” and dept filter |
| `cycleId` | Optional | When Home is scoped to an open budget / MPC cycle for workflow + tasks |
| `trendRange` | Optional | `12M` \| `6M` \| `3M` \| `YTD` — server may ignore and always return 12M (FE slices) |

### Auth / errors

| Code | When |
|------|------|
| `401` | Unauthenticated |
| `403` | No access to model |
| `404` | Unknown `modelId` / `versionId` / `scenarioId` |
| `400` | Invalid period format |

Empty model / no cells → **200** with null/empty arrays + optional `message` (do **not** 500).

---

## Response contract (enriched)

Wrap in existing `{ success, data, message }` envelope. `data` shape:

```json
{
  "model": {
    "id": "mdl_…",
    "name": "FY26 Operating Plan",
    "baseCurrency": "USD",
    "defaultScenarioId": "scn_base",
    "defaultVersionId": "ver_…"
  },
  "versionId": "ver_…",
  "scenarioId": "scn_base",
  "period": "2025-05-01",
  "periodLabel": "May 2025",
  "comparePeriodLabel": "vs Apr 2025",
  "ownerName": "Jane Cooper",
  "ownerAvatarUrl": "https://…",
  "currency": "USD",
  "displayScale": "MILLIONS",

  "kpis": {
    "revenue": 125800000,
    "ebitda": 38400000,
    "closingCash": 42600000,
    "runwayMonths": 14.2,
    "forecastAccuracyPct": 94.2,
    "deltas": {
      "revenuePct": 4.2,
      "ebitdaPct": 6.1,
      "closingCashPct": -2.8,
      "runwayMonthsAbs": 0.4,
      "forecastAccuracyPct": 1.1
    },
    "higherIsFavourable": {
      "revenue": true,
      "ebitda": true,
      "closingCash": true,
      "runwayMonths": true,
      "forecastAccuracyPct": true
    },
    "sparklines": {
      "revenue": [102, 108, 105, 112, 110, 118, 116, 125.8],
      "ebitda": [28, 30, 29, 32, 33, 35, 34, 38.4],
      "closingCash": [52, 50, 51, 48, 47, 45, 44, 42.6],
      "runwayMonths": [12.2, 12.8, 12.5, 13.2, 13.0, 13.8, 13.6, 14.2],
      "forecastAccuracyPct": [88, 90, 89, 91, 92, 91.5, 93, 94.2]
    }
  },

  "revenueExpenseTrend": [
    { "period": "2024-06-01", "label": "Jun '24", "revenue": 72000000, "expenses": 54000000 },
    { "period": "2025-05-01", "label": "May '25", "revenue": 125800000, "expenses": 86400000 }
  ],

  "scenarioCompare": {
    "metrics": [
      {
        "code": "REVENUE",
        "label": "Revenue",
        "unit": "CURRENCY",
        "byScenario": {
          "scn_base": { "value": 125800000, "deltaPct": 4.2 },
          "scn_upside": { "value": 138300000, "deltaPct": 14.6 },
          "scn_downside": { "value": 113200000, "deltaPct": -6.3 }
        }
      },
      {
        "code": "EBITDA",
        "label": "EBITDA",
        "unit": "CURRENCY",
        "byScenario": {
          "scn_base": { "value": 23600000, "deltaPct": 6.1 },
          "scn_upside": { "value": 29100000, "deltaPct": 18.4 },
          "scn_downside": { "value": 17200000, "deltaPct": -20.5 }
        }
      },
      {
        "code": "RUNWAY_MONTHS",
        "label": "Cash Runway",
        "unit": "MONTHS",
        "byScenario": {
          "scn_base": { "value": 14.2, "deltaAbs": 1.1 },
          "scn_upside": { "value": 17.6, "deltaAbs": 4.5 },
          "scn_downside": { "value": 10.2, "deltaAbs": -3.9 }
        }
      }
    ],
    "scenarios": [
      { "id": "scn_base", "name": "Base Case", "subtitle": "Working" },
      { "id": "scn_upside", "name": "Upside", "subtitle": "+10% Growth" },
      { "id": "scn_downside", "name": "Downside", "subtitle": "-10% Growth" }
    ]
  },

  "workflowProgress": {
    "totalTasks": 32,
    "slices": [
      { "status": "SUBMITTED", "label": "Submitted", "count": 23, "percent": 72 },
      { "status": "IN_REVIEW", "label": "In Review", "count": 6, "percent": 18 },
      { "status": "APPROVED", "label": "Approved", "count": 3, "percent": 10 }
    ]
  },

  "overBudgetDepartments": [
    {
      "departmentId": "dept_mkt",
      "departmentName": "Marketing",
      "period": "2025-05-01",
      "plan": 8200000,
      "actual": 9450000,
      "overBy": 1250000,
      "variancePct": 15.2,
      "ownerName": "Jane Cooper",
      "ownerAvatarUrl": "https://…",
      "ownerUserId": "usr_…"
    }
  ],

  "cashRunway": {
    "scenarioId": "scn_base",
    "months": 14.2,
    "deltaMonths": 1.1,
    "targetMonths": 12,
    "bars": [
      { "period": "2025-05-01", "label": "May '25", "closingCash": 48000000, "quarterTick": true },
      { "period": "2026-02-01", "label": "Feb '26", "closingCash": 20000000, "quarterTick": true }
    ]
  },

  "cashByMonth": [
    {
      "period": "2025-05-01",
      "opening": 45000000,
      "inflows": 12000000,
      "outflows": 14400000,
      "closing": 42600000
    }
  ],

  "recentActivity": [
    {
      "id": "act_1",
      "title": "Marketing budget submitted for review",
      "body": "Marketing Q3 budget package submitted to FP&A for cycle review.",
      "actorName": "Jane Cooper",
      "actorAvatarUrl": null,
      "createdAt": "2025-05-16T14:00:00.000Z",
      "kind": "SUBMISSION",
      "href": "/forecasting/workflow?cycleId=…"
    }
  ],

  "openTasks": [
    {
      "id": "tsk_1",
      "title": "Review Q2 Marketing Budget",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2025-05-23",
      "module": "Budgeting",
      "assigneeId": "usr_…",
      "assigneeName": "Jane Cooper",
      "assigneeAvatarUrl": "https://…",
      "modelId": "mdl_…",
      "departmentId": "dept_mkt",
      "href": "/forecasting/workflow?cycleId=…&taskId=tsk_1"
    }
  ],

  "message": null
}
```

### Field notes (mapping to UI cards)

| Board section | Source fields | If thin / missing |
|---------------|---------------|-------------------|
| KPI strip (5 cards) | `kpis.*` + `deltas` + `sparklines` + `comparePeriodLabel` | Show `—` / empty spark; **no** fabricated $125.8M |
| Revenue vs Expense Trend | `revenueExpenseTrend[]` | Empty chart + “No trend data” |
| Scenario Comparison | `scenarioCompare.metrics` + `scenarios` | Empty matrix (do **not** keep mock FX Shock / Hiring Freeze as live) |
| Budget Workflow Progress | `workflowProgress.slices` | Empty donut |
| Departments Over Budget | `overBudgetDepartments` | Empty table |
| Cash Runway | `cashRunway` (fallback: `kpis.runwayMonths` only) | Empty bars |
| Cash statement strip (modal) | `cashByMonth` | Empty |
| Recent Activity | `recentActivity` | Empty feed |
| Open Tasks | `openTasks` | Empty table |

### Back-compat with current thin payload

Today FE types already accept:

- `kpis.revenue` / `ebitda` / `closingCash` / `runwayMonths` / `sparklines`
- `cashByMonth[]`
- `workflowProgress` as **array of department progress** (name/stage/percent) — **change to status slices** above; if you must keep the old array, also return `workflowStatusSummary` with the donut shape so FE can prefer the new field
- `scenarioCompare.left` / `right` — keep as optional legacy; FE will prefer `scenarioCompare.metrics`
- `overBudgetDepartments` — extend with `variancePct`, `period`, avatars
- `openTasks` — enrich with `assigneeName`, `assigneeAvatarUrl`, `module`, `href` / deep-link fields

---

## Optional: activity / tasks as separate reads

Only if bundling is too heavy. Prefer single GET for first paint.

```http
GET /api/v1/fpa/home/activity?modelId=&versionId=&limit=20
GET /api/v1/fpa/tasks/my-tasks?modelId=&versionId=&status=OPEN
```

Home should still work with only the dashboard GET.

---

## Filters (header)

Header today uses **demo** scenario / version / period names (`demoScenarios` on `FpaPageHeader`).

BE does **not** need a special “home filters” API if:

1. Dashboard accepts `modelId`, `versionId`, `scenarioId`, `period`
2. FE loads scenarios/versions from existing `GET /models/{id}` / list scenarios / list versions

When filters change → FE re-calls `GET …/home/dashboard` with new params. Response KPIs/charts must reflect the selection (not client-side fake multipliers).

---

## How to verify with FE

1. Open `/forecasting`; the page calls `getDashboard` for the selected model/version/scenario.
2. With a seeded model + cells: KPI cards show API numbers; sparklines match `sparklines.*`.
3. Change scenario in header → network call with `scenarioId` → numbers change from **server**, not local FX table.
4. Trend chart uses `revenueExpenseTrend` only — empty when `[]`.
5. Scenario comparison columns = `scenarioCompare.scenarios` (not hardcoded Base/Upside/Downside/FX/Hiring).
6. Workflow donut sums ≈ 100% of `totalTasks`.
7. Over-budget rows use `plan` / `actual` / `overBy` / `variancePct` + owner avatar when present.
8. Open Tasks links navigate via `href` or constructed worksheet/workflow URL from ids.
9. No demo toast “refreshed” numbers without a network round-trip.

**FE consumers (after wire):**

| File | Role |
|------|------|
| `components/fpa/fpa-home-board.tsx` | Primary board |
| `app/forecasting/page.tsx` | Route |
| `lib/api/fpa-api.ts` | `FpaHomeDashboard` + `getDashboard` |
| `lib/store/slices/fpaSlice.ts` | `fetchFpaDashboard` |
| `components/fpa/fpa-worksheet.tsx` | KPI fallback (already) |

---

## Out of scope (do not block Home)

- Pin-to-board / export CSV from KPI kebab (can stay client toast until exports exist)
- MPC Stages 6–9 verbs (separate pack Part A.3)
- Full Variance / Reports tabs (Part C)

---

## Priority

**Done** — BE contract and FE landing-page wiring are both in place. Run `npm run uat:fpa:home-dashboard` in the backend repository plus the manual route checks above.

---

*Ask authored 2026-07-17; closed after BE contract + FE wiring.*
