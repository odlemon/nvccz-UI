# Arcus FP&A — Model Planning + Model Builder (Frontend Digest)

**Source SRD:** [pa-model-planning-builder-srd.md](./fpa-model-planning-builder-srd.md) (full Version 1.0, July 2026)  
**Purpose:** What the FE must implement and how the two surfaces connect. Backend owns calc/DAG/publish guardrails; FE must not fake server truth.

**Related (existing):**  
- [pa-model-planning-handoff.md](./fpa-model-planning-handoff.md)  
- [pa-model-planning-api-requirements.md](./fpa-model-planning-api-requirements.md)  
- [pa-model-setup-api-requirements.md](./fpa-model-setup-api-requirements.md)

---

## One-line product rule

> **Model Builder** defines how the financial model works.  
> **Model Planning** is where users enter assumptions and operate the plan.  
> The **calculation engine (server)** produces results. The browser must never be treated as the source of truth for calculated values.

`
Model Builder → Published model structure → Model Planning
  → (server) Calculation Engine → Results → Review / Compare / Approve
  → Reporting
`

---

## Routes today (FE map)

| SRD concept | Current route / surface |
|---|---|
| Model Builder | /forecasting/model-builder, /forecasting/models/[id]/builder |
| Model list / setup | /forecasting/models, /forecasting/models/new, /forecasting/models/[id]/setup |
| Model Planning workspace | /forecasting/models/[id]/worksheet |
| Scenario comparison | …/worksheet?view=compare + /forecasting/scenarios |
| Assumptions / drivers | Driver panels in worksheet + /forecasting/drivers |
| Variance / workflow | /forecasting/variance, /forecasting/workflow |

Key components: components/fpa/fpa-model-builder.tsx, pa-worksheet.tsx, planning/*, uilder/*, lib/api/fpa-api.ts.

---

## Shared domain (FE must get these right)

| Term | Meaning | FE implication |
|---|---|---|
| **Model** | Logical structure (modules, line items, formulas) | Builder edits; Planning consumes published version |
| **Module** | Area inside a model (Revenue, Workforce, Opex…) | Builder tree; Planning scopes by module/dept access |
| **Line item** | INPUT / CALCULATED / IMPORTED / REFERENCE / … | INPUT editable in Planning; CALCULATED read-only |
| **Dimension** | Time, Version, Scenario, Currency + user dims | Values keyed by intersection, not spreadsheet coords |
| **Driver** | Assumption that feeds calcs | Primary Planning input UX |
| **Version** | Dataset cut (FY2026 Budget, Forecast Q3) | Selector in Planning header |
| **Scenario** | Assumption set on a version (Base, Downside…) | Tabs + overlay UI; not interchangeable with Version |
| **Actual vs Forecast** | Cut-off lock | Actual periods read-only unless exceptional permission |

**Version ≠ Scenario.** Example: Forecast Q3 + Downside ≠ FY2026 Budget + Downside.

---

## Frontend obligations — Model Builder

Must support (UI + API wiring):

1. Create/configure model (name, FY start, currency, frequency, horizon, owner).
2. Manage **modules** (tree, status DRAFT/VALID/INVALID/PUBLISHED/ARCHIVED).
3. Manage **dimensions** + hierarchy (FE for CRUD/browse; aggregation is BE).
4. **Line item builder** with types: INPUT, CALCULATED, IMPORTED, SYSTEM, REFERENCE, ALLOCATION, BOOLEAN, TEXT, DATE, LIST.
5. **Formula editor** with readable refs ([Units Sold] * [Price], cross-module [Workforce.Headcount] * …).
6. **Dependency map** (React Flow today) — precedents/dependents; blue/dotted/purple/red legend.
7. **Data mapping** UI + mapping % / statuses (MAPPED / PARTIAL / UNMAPPED / INVALID / DISABLED).
8. **Validation** surface — errors block publish; warnings allowed if non-critical.
9. **Test calculation** + **Publish** flow; show who/when published.
10. Properties / formula / references inspector (right panel per SRD layout).
11. Formula trace, exceptions, validation summary, impact analysis (detailed builder screen).
12. Permissions: only FP&A Admin / power users can structure/publish; dept owners cannot.

**Guardrails in UI:**

- Do not allow planning-style free edit of published approved plan structure via silent draft apply.
- Show circular-ref / validation failures before Publish; disable Publish on critical errors.
- After publish, communicate that Planning uses the **published** version (migration is explicit, not automatic).

**UI layout target (SRD §69 + Appendix A.3/A.4):**

- Left: Modules + Dimensions  
- Centre: Line items / formula grid + dependency map  
- Right: Properties / Formula Editor / References  
- Detailed: Formula Trace, Data Mapping, Audit, Exceptions, Validation, Impact

---

## Frontend obligations — Model Planning

Must support:

1. Select **model version** + **planning cycle** + **scenario** tabs.
2. **Planning grid** — high density, months + FY total; rows by dept/line item/driver.
3. **Cell states** with more than colour: ACTUAL, INPUT, CALCULATED, IMPORTED, LOCKED, OVERRIDE, ERROR (+ icons/tooltips).
4. Edit **authorised inputs only**; reject invalid client-side before submit; server still recalculates.
5. **Cell inspector** — formula breakdown or input history (who/when/reason).
6. **Driver / assumptions** panel (FY actual vs plan vs change).
7. **Spreading / phasing** actions (EVEN, prior-year, weights, etc.) via API.
8. **Scenario** create / inherit / override display; compare mode with metrics + variance $/%.
9. **Waterfall / bridge** for variance.
10. **Comments**, **tasks**, **activity**, **approvals** side panel.
11. **Workflow footer**: Draft → Submitted → Under Review → Approved (+ Returned/Reopened/Rejected/Locked).
12. Submission blockers UX when mandatory assumptions / commentary / tasks incomplete.
13. KPI cards: Revenue, Gross Margin / Opex, EBITDA, Cash Runway, Headcount / Variance (per screens).
14. Hide Builder complexity from budget owners (no DAG/dimensional jargon in main path).

**Guardrails in UI:**

- Never treat browser-sent calculated values as truth — POST drivers/inputs; refresh grid from recalculate/API.
- Never let users edit CALCULATED as if INPUT (override path must be explicit if/when supported).
- Never allow editing ACTUAL periods without exceptional permission.
- Material variance commentary threshold when configured.

**UI layout target (SRD §68 + Appendix A.1/A.2):**

- Header: version, cycle, scenario tabs, Compare, Actions  
- KPI row + sparklines  
- Main grid or scenario comparison table  
- Lower: trend + drivers / waterfall + scenario assumptions  
- Right: Comments / Tasks / Approvals / Activity  
- Footer: workflow stepper  
- Design: Arcus white institutional, compact for ~13.5" laptop, blue/purple accents, **pill buttons** (workspace rule)

---

## Builder ↔ Planning handoff (FE behaviour)

| Event | FE behaviour |
|---|---|
| Builder **Publish** succeeds | Model becomes selectable in Planning cycles; show publish metadata |
| Planning cycle created | Bind to **published** model version; load grid/drivers for cycle+scenario |
| Builder formula change on draft | Must **not** silently change active approved Planning versions |
| Model migration | Explicit preview → approve → snapshot → recalculate flow (dedicated UI when BE ready) |
| Driver edit in Planning | Call values/spread APIs → trigger calculate → refresh dependent cells/KPIs |

---

## Roles (permission UI)

| Role | Builder | Planning |
|---|---|---|
| FP&A Admin | Full structure + publish | Full |
| Analyst | Limited / none on structure | Drivers, scenarios, commentary, compare |
| Finance Manager | — | Coordinate cycle, review, reopen, submit consolidate |
| Dept Budget Owner | **None** on formulas/dims/mappings | Assigned sections only, submit |
| CFO | — | Compare, approve, material assumptions |
| Exec / Board | — | Read / limited approve |
| Auditor | Read structure + history | Read plans + audit |

Use existing pa-permissions.ts / ModuleGuard; extend as SRD modules appear.

---

## Acceptance criteria that are primarily FE-visible

From SRD §70 (subset): users can navigate Builder vs Planning correctly; INPUT vs CALCULATED UX; scenario tabs/compare; variance display with fav/unfav; comments/tasks/workflow stepper; blocked submission messaging; dependency map + validation/publish UI; cell audit drawer; actual vs forecast lock affordances; no demo data presented as live when API empty (logFpaGap pattern).

---

## Explicit non-goals for FE

- Owning formula evaluation, allocations, DAG resolution, or currency conversion (server).
- Replacing Model Planning with an uploaded spreadsheet.
- Treating Model Builder as a code editor.
- Auto-applying new published models onto locked/approved plans without migration UX.

---

## When continuing work

1. Read full SRD: [pa-model-planning-builder-srd.md](./fpa-model-planning-builder-srd.md)  
2. Diff current UI vs Appendix A.1–A.4 transcriptions.  
3. Prefer live paApi contracts; align gaps with [pa-model-planning-api-requirements.md](./fpa-model-planning-api-requirements.md).  
4. Keep Arcus pill buttons and existing FP&A layout patterns.

*Saved for frontend continuity — July 2026.*
