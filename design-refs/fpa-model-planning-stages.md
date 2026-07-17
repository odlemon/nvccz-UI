# Model Planning — Stage-by-stage flow (after create cycle)

**Source:** Arcus FP&A Model Planning and Model Builder SRD v1.0 (July 2026)  
**PDF:** [`docs/Arcus_FPA_Model_Planning_and_Model_Builder_SRD_with_UI_Inspiration.pdf`](../docs/Arcus_FPA_Model_Planning_and_Model_Builder_SRD_with_UI_Inspiration.pdf)  
**Repo digests:** [`fpa-model-planning-builder-srd.md`](./fpa-model-planning-builder-srd.md), [`fpa-model-planning-builder-frontend.md`](./fpa-model-planning-builder-frontend.md)

**Roles covered:** FP&A Analyst / Finance Manager **and** Department Budget Owner (end-to-end).

**Product rule:** Model Builder defines logic → published model → Model Planning operates the plan → **server** recalculates → review / compare / approve → lock.

---

## Where this starts

You already completed:

```
Publish model (Builder)
   → Create planning cycle
   → Open planning worksheet (cycle typically DRAFT)
```

You are in the **Planning Workspace** (SRD §27 / Appendix A.1): model version, planning cycle, scenario tabs, KPI strip, planning grid, driver assumptions, comments/tasks, workflow footer.

**Route today:** `/forecasting/models/[id]/worksheet` (often with `cycleId` / `versionId` / scenario query params).  
**Compare:** `…/worksheet?view=compare` or `/forecasting/scenarios`.

---

## Status diagram (whole journey)

```
[0 Create cycle → open worksheet]   ← YOU START HERE AFTER CREATE
        │
        v
[1 Orient] → [2 Seed / open depts] → [3 Enter drivers]
        → [4 Scenarios + Compare] → [5 Comments / Tasks]
        → [6 Submit] → [7 Review / Return]
        → [8 CFO Approve] → [9 Lock]
        → [10 Reports / next cycle]
```

**Workflow strip (footer):**

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
   (+ RETURNED | REOPENED | REJECTED)
   → LOCKED (after approve)
```

---

## Stage 0 — Create cycle and open worksheet (done)

| | |
|---|---|
| **Who** | FP&A |
| **Goal** | Bind a published model + version to a planning cycle and land in the workspace |
| **Actions** | Create cycle (name, FY, type, source model/version, horizon, optional scenario/owner/dates) → open worksheet |
| **Done when** | Worksheet loads for that cycle/version; workflow near **Draft** |

---

## Stage 1 — Orient the cycle (FP&A)

| | |
|---|---|
| **Who** | FP&A Analyst / Finance Manager |
| **Goal** | Confirm the correct plan cut before anyone enters numbers |

**Steps**

1. Confirm **Model Version** is the published version chosen at create.
2. Confirm **Planning Cycle** is the cycle just created.
3. Confirm active **scenario tab** (usually Base / Budget).
4. Confirm **Actuals cutoff** / **Forecast start** (if set): periods ≤ cutoff behave as Actual (read-only).
5. Glance at **KPI strip** — may be thin if summary API is sparse; grid is the main work surface.

**Done when:** Header, cycle, version, and scenario look correct; ready for drivers.

---

## Stage 2 — Seed / open department plans (FP&A)

| | |
|---|---|
| **Who** | FP&A |
| **Goal** | Make the cycle usable for budget owners (SRD §29 budget workflow) |

**Steps (product intent)**

1. Import / load **actuals** where applicable.
2. Copy prior plan / baseline if required.
3. Ensure **department rows / owner scopes** are visible (create cycle assigns owners; worksheet View by + scoped grid).
4. Optionally assign **tasks** (e.g. “Review Marketing Plan”) — worksheet **Tasks** tab → **Assign task** (FP&A). BE: `POST/GET …/model-planning/cycles/{id}/tasks` — see [`fpa-model-planning-tasks-backend-asks.md`](./fpa-model-planning-tasks-backend-asks.md).

**Done when:** Owners can open their slice and editable **INPUT** cells exist.  
**FE now / BE blocked:** UI for owners + View by + slice submit is in place — see [`fpa-model-planning-owner-scope-backend-asks.md`](./fpa-model-planning-owner-scope-backend-asks.md).

---

## Stage 3 — Enter drivers and plan (Owner + Analyst)

| | |
|---|---|
| **Who** | Department Budget Owner (assigned sections) + FP&A Analyst (broader) |
| **Goal** | Plan through **assumptions / drivers**, not formulas (SRD §32–35, §37) |

**Steps**

1. Stay on a scenario tab (usually Base / Budget).
2. Edit only **INPUT** cells (units, price, headcount, spend, …).
3. Do **not** edit **CALCULATED** cells (Revenue, EBITDA, …) as if they were inputs.
4. Use **Spread / phasing** for annual → periods when needed (EVEN, weights, patterns, etc.).
5. Maintain the **Driver Assumptions** panel (actual vs plan vs change).
6. Add **commentary** on material moves; use **Cell Details** for formula / history audit.
7. After edits, **recalculate on the server** and refresh grid / KPIs.

**Done when:** Authorised inputs are in; calculated lines update; no blocking validation errors.

**FE now:** Wired to Stage 3 BE contract — `priorActual` drivers (+ `cycleId`), spread methods (EVEN / weights / prior-year), `updatedCells` merge, live planning-summary KPIs, `materialVariancePct`. Contract: [`fpa-model-planning-stage3-api.md`](./fpa-model-planning-stage3-api.md).

---

## Stage 4 — Scenario variants and compare (Analyst → CFO prep)

| | |
|---|---|
| **Who** | FP&A Analyst (CFO consumes in Stage 8) |
| **Goal** | Base / Best / Downside story (SRD §38–40, Appendix A.2) |

**Steps**

1. Create or select **Best Case / Downside** (store overrides only; inherit from base where unchanged).
2. Switch scenario tabs and confirm overrides don’t wipe Base.
3. Open **Compare** (`?view=compare` or `/forecasting/scenarios`).
4. Review side-by-side metrics (Revenue, Gross Margin, EBITDA, Cash, Headcount, …) and variance to Budget ($ / %).
5. Review **waterfall / bridge** and **scenario assumptions** panels.

**Done when:** You can explain each case from Compare + assumptions.

**FE now:** Wired to Stage 4 BE contract — [`fpa-model-planning-stage4-api.md`](./fpa-model-planning-stage4-api.md). Live list/create/copy/promote/archive; enriched compare when BE returns `metrics[]`; Assumptions library persists `confidence` / `spreadingMethod` + DELETE. Legacy pair responses still map with banner if BE falls back.

**BE status:** Implemented (sensitivity may be empty array). Asks closed: [`fpa-model-planning-stage4-backend-asks.md`](./fpa-model-planning-stage4-backend-asks.md).

---

## Stage 5 — Collaborate (both roles)

| | |
|---|---|
| **Who** | Owners + FP&A |
| **Goal** | Commentary and tasks (SRD §44–45 / A.1 right rail) |

**Steps**

1. Comment at cell / line / department / scenario level (`@mentions`, replies).
2. Track **tasks** to owners and due dates.
3. Satisfy **material variance commentary** when `ABS(Variance %) ≥ threshold`.

**Done when:** Open questions are not blocking submit.

---

## Stage 6 — Submit (Owner → Analyst)

| | |
|---|---|
| **Who** | Budget Owner submits; Finance may consolidate |
| **Goal** | `DRAFT → SUBMITTED` (SRD §46–48) |

**Pre-submit checks**

- Mandatory assumptions completed  
- No blocking validation errors  
- Required commentary provided  
- Assigned tasks completed  
- Material variances explained  
- Plan owner identified  

**Steps**

1. Resolve any submit blockers in UI.
2. **Submit** (department slice or whole cycle, per cycle design).

**Done when:** Workflow footer shows **Submitted**; that scope is no longer freely editable unless returned.

---

## Stage 7 — Review (Finance Manager / FP&A)

| | |
|---|---|
| **Who** | Finance Manager / FP&A |
| **Goal** | `SUBMITTED → UNDER_REVIEW` (SRD §29, §46) |

**Steps**

1. Open Approvals / activity.
2. Challenge drivers, variances, and scenario edges.
3. **Return** with comments **or** accept toward consolidation.
4. If returned: owners amend → resubmit (back through Stage 3–6 as needed).

**Done when:** No outstanding returns; consolidated view is coherent.

---

## Stage 8 — Executive compare and approve (CFO)

| | |
|---|---|
| **Who** | CFO |
| **Goal** | Scenario decision + `UNDER_REVIEW → APPROVED` (SRD §55.3, §46) |

**Steps**

1. Compare Budget / Forecast / Best / Base / Downside.
2. Sign off material assumptions.
3. **Approve** the final plan for the cycle.

**Done when:** Workflow footer = **Approved**.

---

## Stage 9 — Lock (FP&A / CFO)

| | |
|---|---|
| **Who** | Authorised finance role |
| **Goal** | Freeze the approved cut (SRD §29 end, §64.4) |

**Steps**

1. **Lock** the approved version / cycle.
2. Keep values reproducible: later Builder publishes must **not** silently rewrite this plan (migration is a separate controlled flow — SRD §53–54).

**Done when:** Cycle / plan version is **LOCKED** — this planning cycle is complete.

---

## Stage 10 — Downstream (after this cycle is done)

Not worksheet entry work anymore (SRD §52 / §71):

- Dashboards / Reports / Variance packs  
- Board packs / statements  
- Next cycle (e.g. rolling forecast cut-over) **or** a new annual cycle  

That starts a **new Stage 0**, not part of finishing the current cycle.

---

## Role cheat-sheet

| Stage | Owner | Analyst | Finance Mgr | CFO |
|---|---|---|---|---|
| 0 Create / open | — | ● | ● | — |
| 1 Orient | — | ● | ● | — |
| 2 Seed / open depts | — | ● | ● | — |
| 3 Enter drivers | ● (assigned) | ● | ○ | — |
| 4 Scenarios / compare | ○ | ● | ○ | ○ (reads) |
| 5 Comments / tasks | ● | ● | ● | ○ |
| 6 Submit | ● | ○ / consolidate | ○ | — |
| 7 Review / return | ○ amend | ● | ● | — |
| 8 Approve | — | ○ | ○ | ● |
| 9 Lock | — | ● | ● | ● |
| 10 Reporting | — | ● | ● | ● |

● = primary · ○ = secondary / consume

---

## Map to current FE (honest status)

| Stage | UI today | Notes |
|---|---|---|
| 0 Create / open | Create modal → worksheet | Working path |
| 1 Orient | `PlanningWorkspaceChrome` | Largely there |
| 2 Seed / open depts | Partial | Still mixed with budgeting; not full A.1 “open dept plans” |
| 3 Grid / drivers | `fpa-worksheet` + Cell Details + spread methods + live KPIs | Implemented vs [`stage3-api`](./fpa-model-planning-stage3-api.md) — ready for UAT |
| 4 Compare | `/forecasting/scenarios` + `?view=compare` + `/forecasting/drivers` | Implemented vs [`stage4-api`](./fpa-model-planning-stage4-api.md) — ready for UAT |
| 5 Collab | Comments / Tasks / Activity | There; MPC tasks/comments still BE — see remaining pack Part A.2 + [`tasks-backend-asks`](./fpa-model-planning-tasks-backend-asks.md) |
| 6–9 Workflow | Footer stepper + slice submit | Partial; **MPC** submit/review/CFO/lock asks in remaining pack Part A.3 |
| 10 Reports | Separate FP&A report routes | Outside worksheet journey — Reports tab asks in remaining pack Part C.7 |

---

## Suggested next action on a live cycle

1. **Stage 1** — confirm header (version / cycle / scenario).
2. **Stage 3** — edit a few INPUT drivers on Base → recalc.
3. **Stage 4** — open Compare (≥3 scenarios); confirm enriched columns; create Best/Downside from Base on Scenarios.
4. **Stage 6–9** — wait on MPC workflow endpoints in [`fpa-remaining-modules-backend-asks.md`](./fpa-remaining-modules-backend-asks.md).

**For BE / FE implement-at-once (Planning remainder + other FP&A tabs):**
→ [`fpa-remaining-modules-backend-asks.md`](./fpa-remaining-modules-backend-asks.md)

---

*Saved for FE/product continuity — July 2026.*
