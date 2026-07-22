# Performance UI Mock — Deviations from PDF

Reference screenshots: `design-refs/performance-ui-pdf-pages/`  
PDF: `design-refs/Arcus_Performance_Management_UI_Inspirations_White_Purple.pdf`  
Live API map (for later re-wire): `design-refs/performance-module-current-state.md`

## Shell / navigation

| Item | Notes |
|---|---|
| Top bar | **Single** Arcus `SharedTopbar` only (logo, search, module switcher, notifications, profile) |
| Page chrome | Former second sticky bar removed; `PerformanceMockTopChrome` is now a **breadcrumb trail** under the main topbar (no search / bell / user duplicate) |
| Sidebar | White Performance mock sidebar; sticky under `SharedTopbar` (`top-20`) |

## Intentional product decisions

| Item | Deviation | Why |
|---|---|---|
| Module shell | White Performance Management sidebar (PDF pages 4–13) used for **all** routes | Client choice: shell option A |
| Secondary screens (p15–20) | Content layouts kept; **dark purple sidebar replaced** with white shell | Same shell decision |
| Page 3 Dashboard | Implemented **as-shown** (portfolio metrics: AUM, funds, capital calls, etc.) under `/performance` | Pending client confirm — domain may switch to BSC later |
| Missing PDF screens | Themes, Contracts, Tasks/BSC/Workflow, Departments, Org/Dept/Board/CEO scorecards, Pillars invented in same white/purple style | Plan: invent in same style |
| Button radius | ~8px `rounded-lg` (PDF) instead of Arcus `rounded-full` pills | Pixel-match PDF for this module only |
| Data | Hardcoded fixtures / local React state only | API re-integration deferred |

## Visual / asset approximations

| Item | Notes |
|---|---|
| Typeface | App sans / Inter-like stack; exact PDF font unknown |
| Avatar photos | Initials circles where face crops were unclear |
| Chart values | Approximate where labels were illegible at screenshot resolution |
| Logo marks | Lucide / gradient squares instead of proprietary brand SVGs |
| Calendar widgets | Simplified month grids vs pixel-identical calendar artwork |
| Notification badge counts | Static demo values (e.g. 3 / 6) |

## Interactivity notes

- Filters, tabs, drawers, pagination, create modals, toggles, weight editors mutate **local state** only.
- PDF export / Generate Report actions toast or append mock rows — no real files.
- `/performance/bsc-operations` redirects to `/performance/tasks?tab=bsc-entry`.
- `/performance/cycles` renders the Reviews mock hub.
- KPI Management rows navigate to `/performance/kpis/[id]` (KPI Detail + Override drawer).
- Dashboard has a shortcut to `/performance/kpi-analytics`.

## Responsive

- Desktop-first to ~1672×941 mock canvas.
- Below ~1280px: metric grids wrap, right rails stack or scroll, tables use `overflow-x-auto`.
- Exact mobile layouts were **not** in the PDF — stacking is a practical adaptation, not a screenshot match.

## Not ported from old live module

- Redux thunks / live `lib/api/performance-*` calls are unused on mock pages.
- Old `components/performance/**` left in place (orphaned) for later re-wire reference.
