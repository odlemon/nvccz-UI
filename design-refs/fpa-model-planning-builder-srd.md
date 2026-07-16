# ARCUS — FP&A Model Planning and Model Builder System

**Developer Software Requirements Document**  
Financial Planning, Budgeting, Forecasting and Enterprise Model Management  
**Version 1.0 | July 2026**  
*CONFIDENTIAL — Developer Specification*

> Captured in-repo for FE/BE continuity (July 2026).  
> **Frontend digest (what FE must build):** [`fpa-model-planning-builder-frontend.md`](./fpa-model-planning-builder-frontend.md)

---

## Document Control

| Field | Requirement |
|---|---|
| Document name | Arcus FP&A Model Planning and Model Builder System - SRD |
| Document type | Developer Software Requirements Document |
| Product area | Financial Planning, Analysis, Budgeting, Forecasting and Enterprise Modelling |
| Primary users | FP&A administrators, finance managers, analysts, budget owners, CFOs, executives and auditors |
| Version | 1.0 |
| Status | Functional specification for design and development |
| Design direction | Modern institutional white interface optimised for 13.5-inch laptop screens, compact high-density planning tables, clear model state, blue and purple Arcus accents |

**Development principle:** Users plan using business assumptions. The modelling engine translates those assumptions into financial outcomes. **Model Builder defines the logic; Model Planning operates the plan.**

---

## 1. Purpose

Developers must build Model Planning and Model Builder as two tightly connected components of the Arcus FP&A Forecasting System.

**Model Planning** is the business-facing planning workspace. Finance teams, departmental budget owners and executives use it to prepare budgets, update forecasts, compare scenarios, amend assumptions, review variances and move plans through approval workflows.

**Model Builder** is the technical modelling workspace. FP&A administrators and authorised power users use it to define the structure, calculations, dimensions, modules, line items, data mappings and dependencies that make Model Planning work.

### Required operating relationship

```
Model Builder
Defines how the financial model works
   |
   v
Published Model Structure
   |
   v
Model Planning
Users enter assumptions and prepare plans
   |
   v
Calculation Engine
Recalculates the model
   |
   v
Planning Results
   |
   v
Review, Compare and Approve
   |
   v
Approved Forecast / Budget Version
   |
   v
Reporting, Dashboards and Financial Statements
```

The system must not treat Model Planning as a spreadsheet uploaded into Arcus.  
The system must not treat Model Builder as a code editor.

Together, the two components must provide a controlled financial modelling engine that allows organisations to create, operate and govern complex budgets and forecasts without requiring normal planning users to understand the underlying technical architecture.

---

## 2. Plain-English Explanation for Developers

An FP&A team builds financial models to answer questions such as:

- What revenue do we expect next year?
- How many employees can we afford?
- What happens if sales fall by 15% / salaries rise by 8% / FX changes?
- Cash runway; department overspend; EBITDA miss drivers
- Compare Budget, Forecast and Downside
- Which numbers were manual vs calculated; who changed an assumption; is the dept plan approved?

Example calculation chain:

```
Units Sold × Average Selling Price = Gross Revenue
Gross Revenue − Discounts = Net Revenue
Net Revenue − COGS = Gross Profit
Gross Profit − Payroll − Marketing − Operating Expenses = EBITDA
```

A normal planning user should not rebuild these formulas. Model Builder defines the calculations once. Model Planning lets users change authorised drivers (Units, Price, Headcount, Inflation, FX, Capex, etc.). The system recalculates dependent financial values automatically.

---

## 3. Product Architecture

Six logical layers:

1. Data Source Layer  
2. Dimensional Model Layer  
3. Calculation and Dependency Engine  
4. Model Builder  
5. Model Planning  
6. Workflow, Reporting and Audit Layer  

### 3.1 Data Source Layer

Accounting GL, Payroll, Procurement, Fixed Assets, CRM, sales, inventory, loans, portfolio, banking, CSV/Excel, APIs, manual assumptions.

### 3.2 Dimensional Model Layer

Example dimensions: Time, Department, Entity, Product, Region, Customer Segment, Account, Cost Centre, Employee, Project, Currency, Version, Scenario.

Values exist at intersections (e.g. Revenue × Jan 2026 × Harare × Product A × Budget 2026 × Base × USD). Must not store planning values as unstructured spreadsheet coordinates.

### 3.3 Calculation and Dependency Engine

Parse formulas, resolve references, calculate line items, detect circular dependencies, maintain dependency graphs, calculate summaries and dimensional intersections, scenario/version calculations, allocations, downstream recalculation, record calculation errors.

### 3.4–3.6 Builder / Planning / Workflow

- **Builder:** what exists + structure + how calculated + where data comes from  
- **Planning:** what users assume/change + scenario + version + who reviews  
- **Workflow/Reporting/Audit:** submit/review/approve, commentary, tasks, variance, dashboards, statements, audit logs  

---

## 4. Application Navigation

```
FP&A
|-- Home
|-- Dashboards
|-- Reports
|-- Driver Library
|-- Model Planning
|   |-- Planning Workspace
|   |-- Scenario Comparison
|   |-- Department Plans
|   |-- Assumptions
|   |-- Variance Analysis
|   |-- Planning Commentary
|   `-- Planning History
|-- Model Builder
|   |-- Models
|   |-- Modules
|   |-- Line Items
|   |-- Dimensions
|   |-- Formula Editor
|   |-- Dependency Map
|   |-- Data Mapping
|   |-- Validations
|   `-- Publishing History
|-- Scenarios
|-- Data Hub
|-- Integrations
|-- Workflows
|-- Tasks
|-- Alerts
`-- Administration
```

---

## 5. Core Terminology

| Term | Definition |
|---|---|
| **Model** | Complete logical financial-planning structure (e.g. FY2026 Corporate Financial Model) |
| **Module** | Logical calculation area inside a model (Revenue, Workforce, Opex, Capex, Cash Flow, FS) |
| **Line Item** | One business/financial measure (Units Sold, Revenue, Headcount, EBITDA, …) |
| **Dimension** | How a value is segmented |
| **Driver** | Input/assumption that influences another calculation |
| **Version** | Distinct planning dataset (FY2026 Budget, Forecast Q3, Board Approved, …) |
| **Scenario** | Assumption set applied to a version (Base, Best, Downside, …) |
| **Actual** | Occurred source data — normally read-only in Planning |
| **Forecast** | Expected future performance |
| **Plan** | Complete dataset being prepared or approved |

**Version ≠ Scenario.**  
`Forecast Q3 + Downside` is different from `FY2026 Budget + Downside`.

---

## 6. User Roles

| Role | Works mainly in | May | Must not |
|---|---|---|---|
| FP&A Administrator | Builder | Create/structure models, formulas, mappings, validate, publish, permissions | — |
| FP&A Analyst | Planning | Drivers, forecasts, variance, scenarios, commentary, compare | — |
| Finance Manager | Planning | Coordinate cycle, assign tasks, review, reopen, consolidate, approve stages | — |
| Department Budget Owner | Planning (assigned) | Edit authorised inputs, commentary, submit | Formulas, dims, mappings, publish |
| CFO | Planning | Consolidated view, compare, material variance, approve final | — |
| Executive / Board | Read / limited | Dashboards, compare, approved assumptions | — |
| Auditor | Read-only | Versions, formulas, history, approvals, sources, calc/audit logs | Write |

---

# PART A — MODEL BUILDER

## 7. Purpose

Technical modelling environment:

```
Dimensions → Modules → Line Items → Formulas → Data Sources → Dependencies → Validations → Published Model
```

Governed: validated, versioned, tested, audited, published. A Builder change must not silently alter an approved financial plan.

## 8. Main Workflow

Create model → configure calendar/currency → dimensions → modules → module dimensionality → line items → input vs calculated → formulas → map sources → dependency graph → validate → test calculations → resolve errors/warnings → **Publish** → available in Model Planning.

## 9. Model Creation

Required: name, description, FY start month, base currency, planning frequency, planning horizon, historical horizon, default scenario, default version, owner, workspace, access group.

Frequencies: Daily, Weekly, **Monthly (default)**, Quarterly, Annual.

## 10. Dimension Management

**System dimensions:** Time, Version, Scenario, Currency.  
**User dimensions:** Department, Cost Centre, Product, Region, Entity, Branch, Customer Segment, Employee, Project, Channel, Account, Asset Class.

Support parent-child hierarchies and aggregation methods: SUM, AVERAGE, MIN, MAX, FIRST, LAST, COUNT, WEIGHTED_AVERAGE, NONE, FORMULA.

Member fields: ID, code, name, parent, display order, start/end dates, active, attributes, source system, external key. Inactive members remain for historical calcs.

## 11–12. Modules & Dimensionality

Each module stores: name, description, model, owner, dimensions, time scale, version/scenario applicability, calculation order, status (`DRAFT | VALID | INVALID | PUBLISHED | ARCHIVED`).

Every module explicitly defines its dimensions (e.g. Revenue: Time×Product×Region×Version×Scenario; Workforce: Time×Department×Employee×Version×Scenario). Cross-module references with different dimensionality must be supported.

## 13–14. Line Item Builder

**Types:** INPUT, CALCULATED, IMPORTED, SYSTEM, REFERENCE, ALLOCATION, BOOLEAN, TEXT, DATE, LIST.

**Fields:** ID, module, name, description, type, data type, format, currency, decimals, formula, summary method, dimensionality, input permissions, source mapping, validation rule, display order, active.

- **INPUT** — user enters planning data (e.g. Units Sold)  
- **CALCULATED** — formula (e.g. Revenue = Units × Price); not directly overwritten  
- **IMPORTED** — from external source  
- **REFERENCE** — from another module  
- **ALLOCATION** — by allocation rule  

## 15–19. Formula Engine

Readable refs: `[Units Sold] * [Price]`; cross-module `[Workforce.Headcount] * [Workforce.Average Salary]`.

Operators: `+ - * / ^`, comparisons, `AND OR NOT`.

Required functions (min): IF, SUM, AVERAGE, MIN, MAX, ABS, ROUND/ROUNDUP/ROUNDDOWN, COUNT, COUNTIF, SUMIF, IFERROR, ISBLANK, PREVIOUS, NEXT, OPENING, CLOSING, GROWTH, LAG, LEAD, MOVINGAVERAGE, YTD, QTD, MTD, CAGR, NPV, IRR, XIRR.

Time examples: `[Opening Cash] = PREVIOUS([Closing Cash])`; `GROWTH([Revenue])`; `YTD([Revenue])`; `MOVINGAVERAGE([Revenue], 3)`.

## 20–21. Dependency Engine & Map UI

Build a DAG. On driver change, recalculate only affected downstream nodes. Detect circular refs and **block publish**.

Dependency map UI: select module/line item; precedents/dependents; zoom; filter external inputs; highlight errors; navigate to related line item.

| Line style | Meaning |
|---|---|
| Blue | Direct reference |
| Dotted | Indirect reference |
| Purple | External input |
| Red | Invalid dependency |

## 22–24. Data Mapping & Allocations

Map source system/object/field/account → target model/module/line item (+ dimension map, transform, currency, aggregation, effective date, status).

Statuses: `MAPPED | PARTIALLY_MAPPED | UNMAPPED | INVALID | DISABLED`. Show mapping completion % (e.g. 96% Mapped). Critical unmapped blocks publish.

Allocation: `Allocation_i = Pool × (Driver_i / SUM(Driver))`. Drivers: headcount, revenue, floor area, units, asset value, transaction count, manual weight, custom calculated line item.

## 25–26. Validation & Publishing

Validation categories: FORMULA, DEPENDENCY, MAPPING, DIMENSION, DATA_TYPE, CURRENCY, TIME, SECURITY, PERFORMANCE. Severities: ERROR, WARNING, INFO.

Publish flow: Edit → draft version → validate → (errors? block) → test calculation → (fail? block) → Publish → Model Planning.

Publish record: model version, published by/date, validation result, checksum, modules/line items/formulas/mappings changed.

---

# PART B — MODEL PLANNING

## 27. Purpose

Operational planning for FP&A and budget owners: select cycle/version/scenario; enter authorised assumptions; view calculated outputs; compare; variance; comment; tasks; submit/review/approve.

Hide technical complexity. A department manager sees Marketing Spend / Headcount / Campaign Volume — not DAG / dimension intersection jargon.

## 28. Planning Cycle Setup

Fields: cycle name, FY, planning type, source model + version, actuals cut-off, forecast start, horizon, base scenario, submission deadline, approval workflow, planning owner.

Types: `ANNUAL_BUDGET | ROLLING_FORECAST | QUARTERLY_FORECAST | LONG_RANGE_PLAN | STRATEGIC_PLAN | REFORECAST`.

## 29–31. Budget, Rolling Forecast, Cut-over

**Budget workflow:** create cycle → published model → import actuals → copy prior → open dept plans → enter drivers → recalc → submit → finance review → amendments → consolidate → CFO scenarios → approve → lock.

**Rolling forecast:** import latest actual → replace that forecast period → move forecast start forward → copy assumptions → amend future → recalc → submit → lock.

**Cut-over rule:**

```
If Period <= Actuals Cut-Off: Value = Actual (read-only unless exceptional permission)
If Period > Actuals Cut-Off:  Value = Planning Value
```

## 32–35. Planning Grid & Cells

Rows: departments, products, accounts, drivers, line items. Columns: months, quarters, years, scenarios, versions.

Cell statuses: `ACTUAL | INPUT | CALCULATED | IMPORTED | LOCKED | OVERRIDE | ERROR` — colour **and** icons/tooltips.

Cell audit: show formula breakdown with precedent values, or for inputs show previous/new/who/when/reason.

Input controls: numeric, %, currency, date, boolean, dropdown, dimension, text + validation (e.g. Headcount ≥ 0, Discount % 0–100, FX > 0).

## 36–37. Spreading & Driver-based Planning

Spread methods: EVEN, PRIOR_YEAR_PATTERN, CUSTOM_WEIGHT, WORKING_DAYS, SEASONAL_PROFILE, HISTORICAL_PATTERN, MANUAL.

Prefer planning through drivers (Customers × ARPU; reps × deals × AOV; Opening + Hires − Exits). Driver Library holds reusable drivers.

## 38–40. Scenarios

Scenarios normally inherit from base; only changed assumptions stored.  
`EffectiveValue = Override if exists else BaseValue`.

Side-by-side compare columns: Budget, Forecast, Best, Base, Downside, Variance to Budget ($ and %). Metrics include Revenue, COGS, Gross Profit/Margin, Opex, EBITDA/Margin, Capex, Headcount, Cash.

## 41–42. Variance & Waterfall

Absolute and % variance (`N/A` if plan = 0). Configurable `variance_direction`: HIGHER_IS_FAVOURABLE / LOWER_IS_FAVOURABLE / NEUTRAL.

Waterfall/bridge from Budget → Price/Volume/Mix/Other/Opex impacts → Forecast.

## 43–48. Assumptions, Commentary, Tasks, Workflow

Assumptions panel: driver, FY actual, plan, change; plus owner, source, period, scenario, version, confidence, commentary, approval status.

Comments at model/module/line/dim/cell/variance/scenario; mentions, replies, attachments, resolution.

Tasks: `NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED | CANCELLED | OVERDUE`.

Workflow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED` (+ RETURNED, REOPENED, REJECTED, LOCKED).

Pre-submit checks: mandatory assumptions, no blocking errors, required commentary, tasks complete, material variances explained, owner identified. Material variance commentary when `ABS(Variance %) ≥ threshold`.

## 49–51. Dashboard / Cash / Headcount

Header: model version, planning cycle, scenario tabs, Compare, Actions.  
KPI cards: Revenue, Gross Margin/Opex, EBITDA, Cash Runway, Headcount/Variance.  
Main grid; lower panels (trend, drivers, waterfall, scenario assumptions); right panel (comments/tasks/approvals/activity); workflow footer.

Cash Runway = Current Cash / Average Monthly Net Cash Burn (or “Cash Generative”).  
Closing Headcount = Opening + New Hires − Exits; payroll from average headcount × burdened cost (or employee-level).

## 52–54. Integrated, Change, Migration Flows

```
DATA HUB → MODEL BUILDER → PUBLISHED MODEL → MODEL PLANNING
  → CALCULATION ENGINE → PLANNING OUTPUT → WORKFLOW → APPROVED VERSION → REPORTING
```

Model change: draft revision → edit → dependency update → validate → test → impact analysis → publish. **Approved plans must not auto-recalculate** on new publish without authorised migration.

Migration: select cycle → new published version → structure diff → preview impact → approve → snapshot → apply → recalculate.

---

## 55. User Stories (summary)

1. Admin defines Revenue = Units × Price; planning cannot edit Revenue; map shows both inputs.  
2. Dept manager enters headcount/expense assumptions and submits.  
3. CFO compares Base/Best/Downside with assumptions and variance.  
4. Analyst traces EBITDA formula + precedents + graph.  
5. Circular formulas detected; publish blocked.  
6. Rolling cut-over replaces periods with actuals; history kept; forecast start advances.

---

## 56–62. Database Design (core tables)

`fpa_models`, `fpa_model_versions`, `fpa_modules`, `fpa_line_items`, `fpa_dimensions`, `fpa_dimension_members`, `fpa_module_dimensions`, `fpa_line_item_formulas`, `fpa_formula_dependencies`, `fpa_data_mappings`, `fpa_allocation_rules`, `fpa_planning_cycles`, `fpa_plan_versions`, `fpa_scenarios`, `fpa_scenario_overrides`, `fpa_planning_values`, `fpa_actual_values`, `fpa_cell_comments`, `fpa_planning_tasks`, `fpa_workflow_instances`, `fpa_workflow_actions`, `fpa_validation_results`, `fpa_model_publish_logs`, `fpa_model_migrations`, `fpa_calculation_jobs`, `fpa_audit_logs`.

Representative schemas (from SRD): `fpa_models`, `fpa_modules`, `fpa_line_items`, `fpa_line_item_formulas`, `fpa_planning_values` (with `dimension_intersection` JSONB), `fpa_formula_dependencies`.

---

## 63. API Requirements

Prefix: `/api/v1/fpa`

**Models:** `POST/GET/PATCH /models`, `…/create-version`, `…/validate`, `…/publish`  
**Builder:** modules, line-items, formula, formula validate, dependencies, impact  
**Dimensions:** CRUD + members + hierarchy  
**Planning:** planning-cycles, grid, values, spread, calculate, submit, approve, return  
**Scenarios:** create/list, override, compare, calculate  

Align with live FE client `lib/api/fpa-api.ts` and [`fpa-model-planning-api-requirements.md`](./fpa-model-planning-api-requirements.md).

---

## 64. Calculation Engine Guardrails

1. Never use UI values as source of truth for calculated cells — server recalculates.  
2. Never store calculated cells as manual inputs (overrides are separate).  
3. Prevent circular dependencies before publish.  
4. Preserve historical/approved plans — no silent formula apply.  
5. Never overwrite actuals with forecast.  
6. Do not publish/approve invalid models (`Critical Validation Errors = 0`).  
7. Recalculate on the server (formulas, overlays, summaries, allocations).

---

## 65–67. Security, Performance, Audit

Permissions at: model, model version, module, line item, dimension, dimension member, planning cycle, scenario, department, entity. API checks mandatory.

Targets: grid load &lt; 3s; cell ack &lt; 1s; small recalc &lt; 2s; large calc async; validation async; filtered dependency graph &lt; 3s. Use sparse storage, directed recalc, caching, batch writes, indexes, async jobs.

Audit: user, action, model, module, line item, cycle, scenario, version, old/new value, formula change, timestamp, reason, IP, session. Material events include MODEL_*, FORMULA_CHANGED, MAPPING_CHANGED, MODEL_PUBLISHED, PLANNING_VALUE_CHANGED, SCENARIO_OVERRIDE_CREATED, PLAN_SUBMITTED/RETURNED/APPROVED/REOPENED.

---

## 68–69. UI Requirements

**Planning (§68):** white institutional Arcus UI; compact left nav; blue/purple accents; high-density readable tables; KPI cards; scenario tabs; Compare/Actions; comments/tasks panels; designed for ~13.5" laptop. (Also follow workspace **pill `rounded-full` buttons**.)

**Builder (§69):** looks like system configuration. Left: Modules + Dimensions. Centre: Line Item Builder / formula grid / Dependency Map. Right: Properties / Formula Editor / References. Detailed: Formula Trace, Data Mapping, Audit, Exceptions, Validation Summary, Impact Analysis.

---

## 70. Acceptance Criteria

The system is accepted when the 50 criteria in the source SRD §70 are met, including: configurable models/dims/modules/line items/formulas; dependency + circular detection; mapping + validation + publish; planning cycles on published models; actual vs forecast separation; authorised inputs only; server-side recalc; spreading; scenarios with inheritance; compare + variance fav/unfav; waterfall; comments/tasks/workflow; submission gates; locked approved versions; controlled migration; audit + dimensional security; Planning and Builder UIs; reproducible outputs.

---

## 71. Final Product Definition

```
MODEL BUILDER — Build the financial logic
        |
        v
MODEL PLANNING — Operate the financial plan
```

Governed enterprise financial modelling engine — not a collection of independent spreadsheets. Users must understand what changed, why, who, how it was calculated, and what happens under alternative assumptions.

---

## Appendix A — UI Inspiration (index)

Full visual transcriptions were provided with the source SRD. FE layout targets are summarised in [`fpa-model-planning-builder-frontend.md`](./fpa-model-planning-builder-frontend.md).

| Screen | Content |
|---|---|
| **A.1** Planning Workspace | Version/cycle, scenario tabs, KPI cards, dept grid, trend, drivers, comments/tasks, workflow footer |
| **A.2** Scenario Comparison | Multi-scenario metrics + variance $, waterfall, scenario assumptions, comments/approvals |
| **A.3** Builder — Modules / Line Items / Map | Module tree, formula grid, dependency map legend, properties inspector |
| **A.4** Builder — Trace / Mapping / Validation | Formula trace, data mapping %, audit log, exceptions, validation donut, impact analysis |

---

*End of document capture — Arcus FP&A Model Planning and Model Builder System SRD, Version 1.0 (July 2026).*
