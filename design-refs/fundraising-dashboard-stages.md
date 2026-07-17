# Dashboard — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Executive dashboard KPIs, charts, activity, upcoming actions; adaptive PE/VC vs AM  
**Route:** `/fundraising`  
**Component:** `components/fundraising/fundraising-dashboard.tsx`  
**Mock:** `dashboard-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-dashboard-backend-asks.md` *(create on first BE gap)*

**Product rules**

- KPI set distinguishes Gross Pipeline, Weighted Pipeline, Signed, Admitted, Funded, Activated AUM, Coverage, Expected Revenue.
- Adaptive terminology by model (PE/VC vs Asset Management).
- Numbers come from live aggregates — never fake production truth.
- Build **after** upstream tabs produce real data (see index build order).

---

## Status diagram

```
[0 Open Dashboard → campaign + mode]
   → [1 Read KPI strip]
   → [2 Progress / coverage / funnel]
   → [3 Triage open opportunities]
   → [4 My Tasks + recent activity]
   → [5 Upcoming actions panel]
   → [6 Drill-through to child tabs]
```

---

## Stage 0 — Open and select cut

| | |
|---|---|
| **Who** | Head of Fundraising / Exec |
| **Goal** | Choose campaign and PE/VC vs AM mode |
| **Steps** | 1. Open `/fundraising`. 2. Select campaign filter. 3. Toggle operating model labels. |
| **Done when** | Labels and datasets match selected cut. |
| **FE now / BE blocked** | Campaign selector + mode toggle on mock slices. |

---

## Stage 1 — KPI strip

| | |
|---|---|
| **Who** | Exec |
| **Goal** | Read 6–8 summary cards with trend where available |
| **Steps** | Confirm Target, Pipeline, Weighted, Signed, Funded/Activated, Coverage/Revenue as applicable. |
| **Done when** | Values match BE summary for cut. |
| **FE now / BE blocked** | 6 mock KPI cards; not computed. |

---

## Stage 2 — Progress, coverage, funnel

| | |
|---|---|
| **Who** | Exec / Head of Fundraising |
| **Goal** | Visualise fundraising progress and stage mix |
| **Steps** | Campaign progress bars; coverage & forecast panel; stage funnel (click to filter). |
| **Done when** | Visuals reflect live pipeline. |
| **FE now / BE blocked** | Present on mock. Charts set incomplete vs SRD (sparklines, multiple chart types). |

---

## Stage 3 — Open opportunities table

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Act on open deals from the dashboard |
| **Steps** | Table: investor, campaign, stage, amounts, owner, next action, age. Open opportunity / go to Pipeline. |
| **Done when** | Drill-through works to live opportunity. |
| **FE now / BE blocked** | Table + funnel filter on mock. No detail drawer. |

---

## Stage 4 — My Tasks and activity

| | |
|---|---|
| **Who** | IR / Deal Manager |
| **Goal** | Personal execution queue + awareness feed |
| **Steps** | Toggle/complete tasks; scan recent activity (meetings, calls, KYC, docs signed). |
| **Done when** | Tasks sync with Meetings & Tasks module. |
| **FE now / BE blocked** | Sidebar mock; local task toggle; not persisted. |

---

## Stage 5 — Upcoming actions

| | |
|---|---|
| **Who** | IR / Exec |
| **Goal** | See today's meetings, overdue tasks, pending approvals, expiring docs, upcoming closings |
| **Steps** | Dedicated upcoming panel; navigate to source tab. |
| **Done when** | Panel fed by live modules. |
| **FE now / BE blocked** | Partially covered via meetings/tasks cards; full SRD panel incomplete. |

---

## Stage 6 — Create / deep links

| | |
|---|---|
| **Who** | BD |
| **Goal** | Start opportunity or jump to Commitments / Forecasts / Pipeline / Meetings |
| **Steps** | Use Add Opportunity wizard; follow deep links. |
| **Done when** | Navigation and create land on live records. |
| **FE now / BE blocked** | FrOpportunityWizard + links exist; create is mock. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open/cut | Mock | Mode toggle |
| 1 KPIs | Mock | Static |
| 2 Charts/funnel | Partial | Mock visuals |
| 3 Opportunities | Partial | No drawer |
| 4 Tasks/activity | Partial | Local |
| 5 Upcoming | Partial | Incomplete |
| 6 Create/links | Partial | Mock create |
