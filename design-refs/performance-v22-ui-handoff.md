# Performance Version 22 — UI handoff

> **Status:** Integrated — client Matanho Performance Management V22.1 under `/performance-v22`.  
> **Source:** `C:\Users\lysp\Downloads\Matanho_Performance_Management_v22_1_Deployment_Developer_Package-20260815T160741Z-1-001\Matanho_Performance_Management_v22_1_Deployment_Developer_Package`  
> **Mode:** Interactive mock (Mode A runtime host) — no live API.  
> **Live / previous UI left alone:** `/performance` (Performance Management)

## What shipped

Full client V22.1 suite hosted in Next.js (vanilla SPA extract):

- Shell (sidebar, topbar, search, drawers, modals, toasts)
- Command Centre
- Company Strategy, Scorecards, Objectives & KPIs
- Tasks & Projects, Performance Reviews
- Corrective Actions, Reports & Compliance, Document Vault, Alerts & Audit
- Access & Settings
- Internal/upgrade routes: Departments, Integrations, KPI Analytics, Timesheets

## Routes

| Client page id | Next path |
|----------------|-----------|
| `dashboard` | `/performance-v22` |
| `strategy` | `/performance-v22/strategy` |
| `scorecards` | `/performance-v22/scorecards` |
| `objectives` | `/performance-v22/objectives` |
| `tasks` | `/performance-v22/tasks` |
| `reviews` | `/performance-v22/reviews` |
| `corrective` | `/performance-v22/corrective` |
| `reports` | `/performance-v22/reports` |
| `vault` | `/performance-v22/vault` |
| `alerts` | `/performance-v22/alerts` |
| `access` | `/performance-v22/access` |
| `departments` | `/performance-v22/departments` |
| `integrations` | `/performance-v22/integrations` |
| `kpiAnalytics` | `/performance-v22/kpi-analytics` |
| `timesheets` | `/performance-v22/timesheets` |

## Deviations accepted

- Client button radii kept (not Arcus pills) for comparison
- Mock data / localStorage only; backend bridge hydration is off (`enableBackendHydration: false`)
- App Switcher is wired from the client header launcher (no SharedTopbar)
- Hash routing replaced with Next paths

## Verify

- [ ] `/performance` still loads the previous Performance Management UI
- [ ] `/performance-v22` loads the V22.1 client Command Centre
- [ ] Sidebar stays put while workspace content scrolls
- [ ] Primary nav routes above return 200
- [ ] App Switcher lists Performance Version 22 alongside Performance Management

