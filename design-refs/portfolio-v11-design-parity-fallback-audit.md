# Portfolio V11 — Design Parity & Mock Fallback Audit

**Date:** 2026-08-26  
**Scope:** Entire Portfolio Management module (`portfolio-v11` / Matanho runtime)  
**Primary files:** `components/portfolio-v11-mock/matanho-portfolio-runtime.js`, `components/portfolio-v11-mock/portfolio-v11-app.tsx`

## Summary

| Metric | Count |
|---|---|
| Screens / components checked | 28 |
| Design-parity issues found | 8 |
| Design-parity issues fixed | 8 |
| Hardcoded fallback-on-failure / live-demo leaks found | 18 |
| Hardcoded fallback-on-failure / live-demo leaks fixed | 18 |
| Blocked / partial | 2 (see below) |

### Already correct before this pass

- Hard API failure: `failLiveLoad` clears fixtures and shows error shell (does **not** re-seed Matanho demo data).
- Dashboard Performance / J-Curve / value trend: live empty → “No data” charts (not demo series).
- LP side panels: live → empty states when APIs missing.

### Blockers (not fully closable in FE alone)

1. **Company detail** (milestones / team / quarterly KPI tables) still use prototype arrays when collections are empty while `liveData` — needs company-detail series APIs. Live list KPIs and side panels are gated; deep company tabs remain partially prototype until BE returns structured history.
2. **Recon line-level matching** and **term-sheet clause workspace** correctly show empty/summary live states; full mock clause UI only when `!liveData`.

---

## Evidence table

| Menu Item | Screen/Component | Design Parity Issue? | Hardcoded Fallback on Failure? | Evidence (file/line) | Fix Applied |
|---|---|---|---|---|---|
| Portfolio Companies | Deal Detail — tab router | Yes — `renderLiveDeal*` vs `renderDeal*` dual markup | No (router) | `matanho-portfolio-runtime.js` `renderDealTab` (~1838) | Single path: always `renderDeal*(deal, detail)`; skeleton while stub/loading |
| Portfolio Companies | Deal Detail — Overview | Yes (was live-only cards) | Live used different layout | `renderDealOverview` (~1921+) | Unified mock layout; live binds `hero`/`app`/DD/term/board or `-` |
| Portfolio Companies | Deal Detail — Application | Yes — Nova hardcoded form on live | Yes — always Nova Analytics fields | `renderDealApplication` | Same form chrome; live fills from application or `-` / empty cards |
| Portfolio Companies | Deal Detail — Screening | Yes — alternate live strip UI | Yes — criteria / “85 apps” / reasons always demo | `renderDealScreening` | Same screening layout; `demoOnly` for pipeline stats; live score/summary from API |
| Portfolio Companies | Deal Detail — Diligence | Yes — dead `renderLiveDealDiligence` | Yes — 6/6 workstreams always complete | `renderDealDiligence` | Mock layout + DD tasks from API; empty CTAs when no DD |
| Portfolio Companies | Deal Detail — Term / IC / Disbursement / Documents | Yes — dual designs | Yes — RES-IC / $62.7M / data room roster | `renderDealTermSheet` / `IC` / `Disbursement` / `Documents` | Live: same shells + API summary or empty+action; mock path unchanged for demo mode |
| Portfolio Companies | Deal Detail — dead live renderers | Yes (debt) | N/A | Removed `renderLiveDeal*` block | Deleted unused alternate markup |
| Dashboard | Performance charts | No (already fixed) | Was falling through to mock years | ~1367–1452 | Live → empty series (kept) |
| Funds | Geographic Allocation | No (same donut) | Yes — always 52.7/19.8/… | ~1547–1569 | Derived from `fund.geography`; demo % only if `!liveData && empty` |
| Capital Calls | KPI / timeline / payments | No | Yes — `overdue*7`, `$12.6M`, `96.3%`, Jul–Dec bars, fake LP payments | ~1588–1615 | `demoOnly` + live empty/derived charts |
| Portfolio Companies | List KPIs / side panels | No | Yes — follow-on `$462.5M`, milestones, alerts | ~1620–1650 | `demoOnly` feet; live empty cards for milestones/VC/alerts |
| Reporting Schedules | Metric strip | No | Yes — `complete+46`, due `28`, board `12` | ~1639–1665 | No +46/+4 when live; fake KPIs → `—` |
| Fund Performance | Charts / waterfall / validation | No | Yes — IRR series, PME, `$168.4M` bridge, “All validations passed” | ~1680–1720 | Live empty cards; feet via `demoOnly` |
| Fund Detail | Overview tab | No | Yes — NAV bars, J-curve, `$18M` obligations | `renderFundOverviewTab` | Live empty for series/obligations; holdings from API only |
| LP Management | Contact / docs / onboarding | No (already) | Was demo timelines | ~1710+ | Live empty (kept) |
| Cash Accounts | Metric feet / context | No | Yes — “5 funds…”, crash if no accounts | `cashContextBar`, ~1152 | Empty-safe context; `demoOnly` feet |
| Cash Overview | Waterfall | No | Yes — Reusable proceeds `8500000` | waterfall row | Live → `0` for reusable proceeds |
| Cash Ledger / Reservations | GL / expiring | No | Yes — `4/5`, expiring `3` | summary / metrics | `demoOnly` |
| Reconciliations | Missing stmts / ageing | No | Yes — `1`, `4`, ageing 5/6/2/1 | recon dashboard | `demoOnly` + exception-derived ageing |
| Reconciliation Workspace | Line panes / inflows | No | Yes — hardcoded JRN/EXT lines, `$23.5M` | `renderReconciliationWorkspace` | Live empty panes; proof inflows/outflows `—` |
| Exceptions / Period Close / Settings | — | No | Fail path clears data | `failLiveLoad` ~598; settings live shell | Kept |
| (Host) | Live load error | N/A | Soft catch skipped fail UI | `portfolio-v11-app.tsx` | Error shell + **Retry** → `pv11:retry-live-load` hard reload |
| Analytics drill-down | Lineage copy | No | Said “prototype data” always | analytics lineage | Live copy clarifies empty vs demo |

---

## Verification

### Pass 1 — Static

- `renderDealTab` only calls unified `renderDeal*` (no `renderLiveDeal*` references remaining).
- `demoOnly` / `liveEmptyCard` used for live-vs-demo metric/panel splits.
- `failLiveLoad` still clears collections and sets `liveLoadError` (no fixture re-seed).

### Pass 2 — Evidence

- Grep: `renderLiveDeal` → **0** matches.
- Grep: `demoOnly(` / `liveEmptyCard(` present on capital/companies/reporting/cash/recon/deal paths.
- `node --check` on `matanho-portfolio-runtime.js` → OK.
- Deal tab functions (`Application`…`Documents`) individually `node --check` → OK.
- Retry: runtime dispatches `pv11:retry-live-load`; host clears scopes and `ensurePageData(..., { hard: true })`.

---

## Definition of Done checklist

- [x] Module screens checked for both issue classes (table above).
- [x] Deal Detail single visual implementation for mock vs live data source.
- [x] Hardcoded live leaks replaced with empty/`—`/derived values (major list/ops screens).
- [x] API hard-failure shows error + retry (not silent demo data).
- [ ] Company-detail deep tabs + some cash projection synthetic series still need BE fields for full parity of *content* (layout parity kept; no fake numbers painted as live).
