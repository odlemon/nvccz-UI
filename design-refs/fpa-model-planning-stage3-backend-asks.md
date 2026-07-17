# Backend asks — Model Planning Stage 3 (Enter drivers and plan)

**Date:** 2026-07-16
**FE status:** Wired to Stage 3 contract
**BE status:** Implemented — see [`fpa-model-planning-stage3-api.md`](./fpa-model-planning-stage3-api.md)
**Context:** SRD Stage 3 — *Enter drivers and plan* (SRD §32–35, §37; stages doc Stage 3)

---

## Resolution

All asks below were delivered by backend. Canonical contract:

**[`fpa-model-planning-stage3-api.md`](./fpa-model-planning-stage3-api.md)**

| Ask | Status |
|-----|--------|
| Driver `priorActual` / `priorValue` / `priorPeriodLabel` (+ `cycleId` on list) | Done |
| Driver PUT returns `updatedCells` | Done |
| Spread methods (`EVEN`, `CUSTOM_WEIGHT`, `PRIOR_YEAR_PATTERN`, …) | Done |
| Cell tools return `updatedCells` | Done |
| Live `planning-summary` (+ `cycleId`, flat KPIs, `materialVariancePct`) | Done |
| Cycle `materialVariancePct` | Done |
| Optional `POST …/recalculate` | Done |

---

## FE consumers

| Area | Files |
|------|-------|
| API types / client | `lib/api/fpa-api.ts` |
| Worksheet grid / tools / KPI refresh | `components/fpa/fpa-worksheet.tsx` |
| Driver Assumptions columns | `components/fpa/planning/planning-workspace-chrome.tsx` |
| Stages status | [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md) |

---

## Verify with FE (acceptance)

- [ ] Driver Assumptions Actual column populated when prior history exists
- [ ] Change % updates when Plan / driver value edits
- [ ] Spread `EVEN` / `CUSTOM_WEIGHT` / `PRIOR_YEAR_PATTERN` from toolbar
- [ ] Cell/driver writes merge dependents from `updatedCells`
- [ ] KPI strip updates after INPUT edit without full page reload
- [ ] Cycle exposes `materialVariancePct` (default 5)

---

*Superseded as open asks — kept for history / FE wiring map. July 2026.*
