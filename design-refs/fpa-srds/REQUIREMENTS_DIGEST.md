# Arcus FP&A (Planning, Budgeting & Forecasting) — Requirements Digest

**Purpose:** Single reference digest of requirements extracted from the four FP&A SRD PDFs, for QA to use as the sole source of truth when testing the live `/forecasting` module against spec. This is a read-only extraction exercise — no gaps have been filled in or assumptions made; ambiguities and inconsistencies between the source documents are called out explicitly in Section 6 rather than resolved.

**Sources (all in `design-refs/fpa-srds/`):**

| Short name | File | Pages | Content focus |
|---|---|---|---|
| **SRD-1 (Core)** | `Arcus_FPA_Planning_Budgeting_Forecasting_SRD_with_Detailed_UI_Inspo (1).pdf` | 39 | High-level product SRD + 6 UI mockup screens |
| **SRD-2 (Technical)** | `Arcus_FPA_TechnicalPlanning_Budgeting_Forecasting_Scenario_Modelling_SRD_Detailed (1).pdf` | 53 | Detailed technical SRD, 20 modules, 12 UI mockup screens, API/DB/event design |
| **SRD-3 (Model Builder)** | `Arcus_FPA_Model_Planning_and_Model_Builder_SRD_with_UI_Inspiration.pdf` | 58 | Model Builder (admin/config) + Model Planning (operational), 4 UI mockup screens |
| **SRD-4 (Performance Integration)** | `Arcus_FPA_Performance_Management_Developer_Guidance.pdf` | 17 | System-boundary/integration guidance between FP&A and a separate Performance Management module |

All 167 pages were read in full (text extraction via PyMuPDF), and every page containing a diagram or high-fidelity UI mockup image (rather than a text-searchable description) was additionally rendered and visually inspected — this covers all flowchart figures and all 22 UI mockup screens across the three product SRDs.

**How to read this digest:** every requirement below cites its source SRD and, where identifiable, section/page number. Where two or more SRDs describe the same thing differently, both are shown and the conflict is flagged in Section 6 — do not treat one as automatically authoritative.

---

## 1. Screens, Features & Workflows

### 1.1 Master screen/workflow table

| # | Screen / Workflow | Purpose | Key UI elements / controls (per SRD) | Source |
|---|---|---|---|---|
| 1 | **FP&A Home / Executive Dashboard** | CFO/FP&A Manager landing page: forecast health, workflow status, material risks, without opening a grid | KPI cards (Revenue Forecast, EBITDA, EBITDA Margin, Closing Cash, Cash Runway, Headcount, Variance to Budget, Variance Risk); Revenue vs Expense trend chart; Scenario Comparison mini-table; Budget Workflow Progress donut; Departments Over Budget table; Cash Runway bar chart; Recent Activity feed; Open Tasks table; global Scenario/Version/Period selectors | SRD-1 §7.1, p.6, p.34; SRD-2 §10, p.9-10, p.45 |
| 2 | **Planning Worksheet / Planning Grid** | Primary day-to-day spreadsheet-style planning workspace | Model/Version/Scenario/Currency selectors; Actuals vs Forecast column split with visual cut-off; editable vs calculated vs actual vs locked cell states; toolbar (Import, Export, Copy Forward, Spread, Apply Growth, Submit); Cell Details drawer (formula, drivers, history, comments, validation); Validation Messages panel (warning/error rows) | SRD-1 §7.2, p.6, p.35; SRD-2 §12, p.12-14, p.46; SRD-3 §32-34, p.31-32 |
| 3 | **Model Builder** | No-code configuration of dimensions, line items, formulas, validation, dependencies | Left: Dimensions/Line Items/Versions/Scenarios/Drivers/Formulas/Workflows/Security component tree; Centre: line-item grid (Line Item, Data Type, Applies To, Summary Method, Formula, Status); Properties panel (General/Format/Security/Workflow/History tabs, formula editor with live "Validate Formula", Applies-To dimension multiselect); Dependency Map (mini + "View Full Map"); Recent Model Changes feed; Model Overview stats; Validate All / Publish Model buttons | SRD-1 §7.3, p.7, p.36; SRD-3 Part A (§7-26), Appendix A.3/A.4, p.57-58 |
| 4 | **Scenario Comparison** | Compare Base/Upside/Downside (or more) scenarios side by side before promoting | Per-scenario summary cards (Revenue, EBITDA, Net Margin, Closing Cash, Runway, Headcount) with vs-Forecast deltas; Scenario Comparison Table (metric x scenario matrix incl. Budget column); Budget-to-Forecast Bridge (waterfall chart); Sensitivity Analysis table (driver x low/mid/high impact on EBITDA); Cash Runway Comparison bar chart; Notes & Recommendations panel; Duplicate Scenario / Promote to Forecast / Export Comparison actions | SRD-1 §7.4, p.7, p.37; SRD-2 §15.6, p.20, p.47; SRD-3 §40, Appendix A.2, p.56 |
| 5 | **Workflow & Approvals** | Coordinate planning cycle tasks, submissions, review, approval, lock | Planning Cycle stepper (Setup → Department Input → FP&A Review → CFO Approval → Locked) with dates; Review Queue / Pending Approvals counters; Recent Approvals feed; Workflow Tasks table (All/My Tasks/Pending Review/Returned tabs, filters); Submission Progress by Department (stacked bar per dept: Submitted/In Review/In Progress/Not Submitted); selected-submission drawer (Budget Summary, Change Notes, Attachments, History, Approve/Return/Reassign) | SRD-1 §7.5, p.7, p.38; SRD-2 §26, p.34-35, p.50 |
| 6 | **Variance Analysis** | Actual vs Budget vs Forecast variance investigation and commentary | KPI cards (Actual/Budget Revenue, Revenue/Opex/EBITDA Variance with up/down icon); Actual vs Budget vs Forecast table (by department, $ and % variance, commentary count dot); Variance Trend chart (bar+line by month); Variance Breakdown by Department (horizontal bars, colour by favourable/unfavourable); Commentary Requests table (Overdue/In Progress/Submitted status); Variance Detail drawer (Explanation, Corrective Action, Supporting Details, Owner, Due Date, Status) | SRD-1 §7.6, p.6-7, p.39; SRD-2 §25, p.32-34, p.51 |
| 7 | **Annual Budget / Department Budget Workspace** | Department Head prepares & submits their department's budget only | Budget Progress / Submission Due / Open Tasks / Validation Issues KPI cards; Planning Areas checklist (Headcount, Salaries, Campaigns, Travel, Software, Other Opex — status: Complete/In Progress/Not Started); Department Budget register (Account, Method, FY Actual, FY Budget, Change%); Validation & Tasks panel (blocking vs comment vs done, colour-coded); Submit Budget button | SRD-2 §13, p.15-16, p.46 |
| 8 | **Rolling Forecast Workspace** | Manage rolling forecast with actual/forecast cut-over | Actual/Forecast Cut-Over month strip (chips per month, actual vs forecast styling); Full-Year Forecast / Forecast Change / EBITDA / Closing Cash / Runway KPI cards; Forecast by Month grid (A/F suffix per cell); Forecast Change Waterfall (Price/Volume/FX/Opex/Net); Driver Changes table (Prior/Current/Change) | SRD-2 §14, p.17-18, p.47 |
| 9 | **Assumptions & Driver Library** | Central, explicit register of planning assumptions with approval control | Active Drivers / Pending Approval / Material Changes / Forecast Impact KPI cards; Driver Register table (Driver, Category, Prior, Current, Owner, Status); Selected Driver panel (current value, materiality threshold, Affected Calculations list, Reject/Approve buttons) | SRD-1 §17 (text only, no dedicated mockup); SRD-2 §16, p.20-21, p.48; SRD-3 §37, §43 |
| 10 | **Workforce Planning** | Connect hiring decisions to headcount, payroll, EBITDA, cash | Opening HC / New Hires / Planned Exits / Closing HC / Payroll KPI cards; Employee and Position Plan register (Employee/Position, Department, Status incl. Vacancy, Start Date, Annual Salary, Probability); Selected Hire detail panel (Department, Start Date, Salary, Benefits %, Hiring Probability, Expected FY Cost, View Financial Impact button) | SRD-1 §18 (text only); SRD-2 §17, p.22-23, p.48 |
| 11 | **Revenue Planning** | Model operational drivers of revenue by method | Method tabs (Unit/Price, Subscription, Contract, Pipeline); Revenue/Growth/Customers/Churn/Avg Price KPI cards; Subscription Revenue Drivers table (Opening/New/Churned/Ending Customers, Monthly Fee, MRR); Revenue Trend line chart; Revenue Bridge waterfall (Base/Volume/Price/Churn/FY27) | SRD-1 §19 (text only); SRD-2 §18, p.23-25, p.49 |
| 12 | **Expense Planning** | Plan expenses by department/account/owner with multiple methods | Total Opex / Committed / Uncommitted / Commentary KPI cards; Expense Forecast Register (Account, Department, Method, Budget, Forecast, Variance); Selected Expense detail panel (Forecast Method, Driver, Driver Value, Cost/Employee, Forecast, Variance, Commentary) | SRD-1 §20 (text only); SRD-2 §19, p.25-26, p.49 |
| 13 | **Cash Flow / Cash & Runway** | Show liquidity position, buffer breaches, funding gaps | Opening Cash / Inflows / Outflows / Closing Cash / Runway KPI cards; Monthly Cash Curve line chart with Minimum Buffer reference line; Cash Alerts list (buffer headroom, FX downside, collections delay); Cash Flow Table; Funding Requirement panel (Base Case vs Downside Case funding need + date) | SRD-1 §21 (text only); SRD-2 §22, p.28-29, p.50 |
| 14 | **Capital Expenditure Planning** | Connect asset purchases to cash, depreciation, P&L, balance sheet | Capex record fields only (Project, Asset Category, Purchase Month, Cost, Useful Life, Depreciation Method, Approval Status, Scenario) — **no dedicated UI mockup screen exists in any SRD** | SRD-2 §20, p.26-27 |
| 15 | **Working Capital Planning** | Convert commercial activity into expected cash timing (AR/AP) | Formula/field definitions only — **no dedicated UI mockup screen exists in any SRD** | SRD-2 §21, p.27-28 |
| 16 | **Portfolio Company Forecasts** | Separate fund-level vs portfolio-company forecasts for PE/VC use of Arcus | Submission flow only (template generated → company enters → submits → portfolio manager reviews → finance validates → approved snapshot → FP&A imports → dashboard updates) — **no dedicated UI mockup** | SRD-2 §23, p.29-30 |
| 17 | **Actuals Integration / Data Hub** | Pull GL, payroll, procurement, cashbook, fixed-asset, portfolio, NAV data as read-only closed-period actuals | Import Reconciliation summary (Source/Mapped/Unmapped/Difference); Actuals Snapshot metadata; "Data Hub" nav item (Data Sources, Import Jobs, Mapping, Exceptions) referenced but **not detailed/mocked in any SRD** | SRD-1 §22; SRD-2 §24, p.30-32; SRD-3 §22-23 |
| 18 | **Management Reporting** | Produce identified-version reports (P&L, Balance Sheet, Cash Flow, Budget/Forecast Summary, Dept Budget, Headcount, Revenue/Opex/Capex Plan, Cash Runway, Scenario Comparison, Variance, Commentary) | List of report types only — **no UI mockup** | SRD-2 §27, p.35 |
| 19 | **Board Packs** | Generate board-ready packs from approved/locked data only | Generation flow (select approved version → validate lock → template → snapshot → calc metrics → pull commentary → draft → finance review → CFO approval → final PDF → archive) — **no UI mockup** | SRD-1 §5; SRD-2 §28, p.35-36 |
| 20 | **AI-Assisted Forecasting** | AI suggests, never decides | Forecast suggestion flow (request → historical data selection → AI/model analysis → suggestion w/ confidence+method+basis → accept/modify/reject → manual input event `source=AI_ASSISTED` → server recalculates) — **no UI mockup** | SRD-1 §25; SRD-2 §29, p.36-37 |
| 21 | **Model Planning workspace** (SRD-3's version of Planning Worksheet) | Business-facing operational planning (distinct emphasis from Model Builder) | Model Version/Planning Cycle selectors, Scenario tabs, KPI cards (Revenue/Opex/EBITDA/Cash Runway/Variance to Plan), Planning Grid, Revenue vs Expense Trend, Driver Assumptions panel, right-rail Comments/Tasks/Activity, Workflow Status stepper (Draft→Submitted→Under Review→Approved) | SRD-3 §27-51, Appendix A.1, p.55 |
| 22 | **Model Builder — Formula Trace / Mapping / Validation** (detailed sub-view) | Deep-dive builder view for a single module's calculation chain | Line Item Builder grid; Formula Trace panel (Summary/Precedents/Dependents/Calculation Chain tabs, visual dependency chain); Data Mapping panel (source field → target line item, % mapped, status icons); Model Audit Log; Exceptions list (Errors/Warnings/Info counts); Validation Summary donut; Impact Analysis mini-chart | SRD-3 Appendix A.4, p.58 |
| 23 | **Model Migration** | Apply a newly published model version to an existing (in-flight) planning cycle in a controlled way | Flow only: select cycle → select new published version → system diffs structures (new/deleted line items, changed formulas/dimensions/mappings) → migration preview → expected financial impact → authorised approval → snapshot → apply → recalculate — **no UI mockup** | SRD-3 §54, p.42 |

### 1.2 Application navigation trees (as specified — note structural differences)

SRD-1 nav (flat list under FP&A): Home, Planning Models, Annual Budgeting, Rolling Forecasts, Scenario Planning, Assumptions and Drivers, Workforce Planning, Revenue Planning, Expense Planning, Cash Flow Planning, Capex Planning, Portfolio Company Forecasts, Actuals Integration, Actuals vs Budget, Actuals vs Forecast, Variance Commentary, Management Reporting, Board Packs, Workflow and Approvals, Model Builder, Data Imports, Audit Logs, Settings. (p.5)

SRD-2 nav (nested): Home; Planning Models; Annual Budgeting; Rolling Forecasts; Scenario Planning; Assumptions & Drivers; Workforce Planning; Revenue Planning; Expense Planning; Capex Planning; Working Capital; Cash Flow Planning; Portfolio Company Forecasts; Actuals Integration; Variance Analysis (sub: Actual vs Budget, Actual vs Forecast, Forecast vs Budget, Forecast vs Prior Forecast, Variance Commentary); Management Reporting; Board Packs; Workflow & Approvals; Model Builder; Data Hub (sub: Data Sources, Import Jobs, Mapping, Exceptions); Tasks; Alerts; Audit Logs; Settings. (p.6)

SRD-3 nav (nested, different top grouping): Home; Dashboards; Reports; Driver Library; Model Planning (sub: Planning Workspace, Scenario Comparison, Department Plans, Assumptions, Variance Analysis, Planning Commentary, Planning History); Model Builder (sub: Models, Modules, Line Items, Dimensions, Formula Editor, Dependency Map, Data Mapping, Validations, Publishing History); Scenarios; Data Hub; Integrations; Workflows; Tasks; Alerts; Administration. (p.7)

These three navigation trees are **not identical** — see Section 6.

---

## 2. UI Design System Specified

- **Overall style (SRD-2 §41, p.45):** white main canvas, soft cool-grey page background, deep navy text, vibrant cobalt blue / electric indigo / violet / teal / emerald accents, fine grey borders, subtle shadows. Should feel like "a high-end financial application designed for a modern macOS workstation," not a generic admin dashboard.
- **SRD-3's stated palette** (Document Control table, p.2) is described independently as "modern institutional white interface... blue and purple Arcus accents" — broadly consistent with SRD-2 but phrased/scoped separately (see Section 6).
- **Validation viewport (SRD-2 §41):** 1440×900 minimum, 1536×960 preferred, 1920×1200 for high-res reference generation; primary workflows must be validated on a 13.5" laptop at normal browser scale. SRD-3's Document Control table also specifies "13.5-inch laptop screens, compact high-density planning tables."
- **Layout pattern (all three product SRDs):** persistent left sidebar nav with module icons; top bar with global Scenario/Version/Period (or Model Version/Planning Cycle/Scenario) selectors, global search (⌘K), notification bell, user avatar menu; main content area of KPI cards row + grid/table + supporting charts; right-hand contextual drawer/rail for Cell Details, Comments, Tasks, Activity, Approvals.
- **Grid/table conventions:**
  - Planning grids always visually separate **Actuals** columns from **Forecast** columns (distinct header banding, e.g. "ACTUALS" vs "FORECAST" column groups in SRD-1 mockup; month-chip strip with actual/forecast styling in SRD-2's Rolling Forecast).
  - Cell status must be conveyed through more than colour alone — SRD-2 §12.3 and SRD-3 §33 explicitly require icons/borders/badges/tooltips in addition to colour, because status must not rely on colour alone (accessibility requirement).
  - Defined cell states: SRD-2 lists 8 (`ACTUAL, INPUT, CALCULATED, IMPORTED, LOCKED, OVERRIDE, ERROR, PENDING_CALCULATION`); SRD-3 lists 7 (same set minus `PENDING_CALCULATION`) — see Section 6.
- **Chart types called out:** line trend charts (revenue/expense, cash curve), donut/ring charts (workflow completion %, validation summary), horizontal/vertical bar charts (departments over budget, variance breakdown, cash runway comparison), **waterfall/bridge charts** (Budget-to-Forecast Bridge, Forecast Change Waterfall, Revenue Bridge, Variance-to-Plan Waterfall) — waterfall bridges recur across almost every comparison/variance screen and should be treated as a first-class required chart type, not a one-off.
- **Colour-coding convention:** favourable variance = green/teal, unfavourable = red/pink, warning/watch = amber/orange — consistently used for KPI deltas, variance tables, and cash alerts across all mockups.
- **Wizard/step patterns:**
  - Planning Cycle progress stepper: `Setup → Department Input → FP&A Review → CFO Approval → Locked` (SRD-1 mockup) / `Draft → Submitted → Under Review → Approved (→ Locked)` (SRD-2 §26.1, SRD-3 §46) — two slightly different stage vocabularies for what appears to be the same underlying workflow (see Section 6).
  - Model setup is a strict linear wizard (SRD-1 Fig.7 / SRD-2 §11.4): Create Planning Cycle → Select Type & Published Model → Set Horizon & Actuals Cut-off → Select Entities/Departments → Assign Budget Owners → Configure Drivers & Workflow → Validate Setup → (pass) → Open Planning Cycle.
  - Model Builder publish pipeline is a similar linear gate: Create model → Configure dimensions/modules/line items → Configure formulas → Map source data → Generate dependency graph → Run validation → Test calculations → Resolve errors → Publish (SRD-3 §8, §26).
- **Dependency map legend (SRD-1 §21 / SRD-3 §21):** blue line = direct reference, dotted = indirect reference, purple = external input, red = invalid dependency.
- **No-caption rule relevant to this module:** none of the SRDs specify instructional captions under controls; QA should treat any such captions found in the live app as a deviation per the project's own UI convention (`CLAUDE.md`), not as a spec requirement.

---

## 3. Scenario Modelling, Model Builder & Model Planning

### 3.1 Scenario modelling behaviour

- **Scenario types (consistent set across SRD-1 §16, SRD-2 §15.2, SRD-3 §38):** Base Case, Upside/Best Case, Downside, Severe Downside, FX Shock, Hiring Freeze, Cost Reduction, Fundraising, Expansion. (Naming varies slightly: "Upside" vs "Best Case" — see Section 6.)
- **Scenario vs Version are explicitly distinct concepts** (SRD-2 §6.6, SRD-3 §5.7): a Scenario is a set of assumption overrides; a Version is a saved planning dataset. `Forecast Q3 / Downside` ≠ `FY2027 Budget / Downside` — the same scenario name means different things depending on which version it's applied to.
- **Scenario inheritance (SRD-2 §15.3, SRD-3 §38-39):** a scenario normally has a parent scenario. Effective value = scenario's own override if one exists, else the parent's value. This avoids duplicating every planning value per scenario. Example given: Downside overrides Revenue Growth and Inflation but inherits Salary Increase from Base Case.
- **Scenario creation/comparison/promotion flow (SRD-1 Fig.4, SRD-2 Fig.6 §15.4):**
  1. Select/Create scenario → Select parent → Edit driver overrides → Calculate → Review financial impact → Compare against base → Management review → Promote? 
  2. If **No** → Keep as draft / for analysis (scenario remains available but not official).
  3. If **Yes** → SRD-1: "Submit for approval" → "CFO approves" → "Promote to approved forecast version". SRD-2's own flow diagram: "Promote?" Yes → directly "Create new working forecast version" (no explicit CFO-approval node drawn in the diagram, though CFO approval is described elsewhere as required for locking). **This is a diagram-level inconsistency — see Section 6.**
- **Promotion control (SRD-2 §15.5):** "Promoting a scenario must never overwrite an approved forecast. Promotion creates a new working forecast version." This is a hard rule regardless of the exact intermediate steps.
- **Scenario comparison UI requirement:** must show Budget, Forecast, Best/Upside, Base, Downside (and more) side by side with: Revenue, COGS, Gross Profit, Gross Margin, Opex, EBITDA, EBITDA Margin, Capex, Headcount (FTE), Cash Balance/Closing Cash, Cash Runway, and Variance to Budget in both $ and %. A waterfall bridge from Budget to Forecast (or between scenarios) is required, decomposed into named drivers (e.g. Price, Volume, Mix, FX/Other, Churn/Attrition, Opex).
- **Sensitivity analysis (SRD-1 mockup):** driver x Low/Mid(Base)/High impact-on-EBITDA table (e.g. Revenue Growth −5%/+5%, FX Rate ±10%, Salary Increase 0–10%, Collection Days ±10 days).

### 3.2 Model Builder (SRD-3 Part A, primary source; cross-referenced in SRD-1 §7.3 and SRD-2's Model Builder mentions)

- **Layered architecture (SRD-3 §3):** Data Source Layer → Dimensional Model Layer → Calculation/Dependency Engine → Model Builder → Model Planning → Workflow/Reporting/Audit Layer. Model Builder "defines how the model works"; Model Planning "operates the plan."
- **What Model Builder configures, in order (SRD-3 §8):** Model → calendar & base currency → Dimensions → Modules → Module dimensionality → Line Items → Input-vs-Calculated typing → Formulas → Source data mapping → Dependency graph (auto-generated) → Validation → Test calculation → Publish.
- **Model creation fields (SRD-3 §9):** Model name, description, financial year start month, base currency, planning frequency (Daily/Weekly/Monthly/Quarterly/Annual — Monthly is the FP&A default), planning horizon, historical data horizon, default scenario, default version, model owner, workspace, access group.
- **Dimensions (SRD-3 §10):** System dimensions (fixed): Time, Version, Scenario, Currency. User-configurable dimensions: Department, Cost Centre, Product, Region, Entity, Branch, Customer Segment, Employee, Project, Channel, Account, Asset Class. Dimensions support parent-child hierarchy (e.g. Zimbabwe → Harare → Borrowdale/CBD) with aggregation methods: `SUM, AVERAGE, MIN, MAX, FIRST, LAST, COUNT, WEIGHTED_AVERAGE, NONE, FORMULA`. Each dimension member stores ID, code, name, parent, display order, start/end date, active status, attributes, source system, external key — and **inactive members must remain available for historical calculations** (do not hard-delete).
- **Modules (SRD-3 §11-12):** a model contains multiple modules (Revenue Planning, Workforce, Opex, Capex, Working Capital, Cash Flow, Financial Statements). Each module explicitly declares its own applicable dimensions (e.g. Revenue Planning: Time/Product/Region/Version/Scenario; Workforce: Time/Department/Employee/Version/Scenario) — **modules can have different dimensionality from each other**, and the engine must support cross-module references between differently-dimensioned modules. Module statuses: `DRAFT, VALID, INVALID, PUBLISHED, ARCHIVED`.
- **Line item types (SRD-3 §13):** `INPUT, CALCULATED, IMPORTED, SYSTEM, REFERENCE, ALLOCATION, BOOLEAN, TEXT, DATE, LIST`. Calculated line items cannot be directly overwritten by users; Imported line items are populated from external sources; Reference line items pull from another module (e.g. `Headcount = Workforce.Headcount`); Allocation line items are computed by an allocation rule.
- **Formula engine (SRD-3 §15-19, mirrored in SRD-2 §30.1):** business-readable bracketed references, e.g. `[Units Sold] * [Price]`, cross-module `[Workforce.Headcount] * [Workforce.Average Salary]`. Operators: `+ - * / ^ = != > < >= <=`, `AND OR NOT`. Required functions: `IF, SUM, AVERAGE, MIN, MAX, ABS, ROUND, ROUNDUP, ROUNDDOWN, COUNT, COUNTIF, SUMIF, IFERROR, ISBLANK, PREVIOUS, NEXT, OPENING, CLOSING, GROWTH, LAG, LEAD, MOVINGAVERAGE, YTD, QTD, MTD, CAGR, NPV, IRR, XIRR`.
- **Dependency engine (SRD-3 §20, SRD-2 §30.2-30.3):** builds a Directed Acyclic Graph (DAG) of line-item dependencies; only affected downstream cells are recalculated (not the whole model) when an input changes. Circular references (e.g. `Revenue = Price × Units`, `Units = Revenue / Price`) must be detected and **block publishing** with an explicit error identifying the cycle path.
- **Dependency Map UI (SRD-3 §21):** select module/line item, view precedents and dependents, zoom, filter external inputs, highlight errors, navigate to related line items. Legend: blue = direct reference, dotted = indirect, purple = external input, red = invalid.
- **Data mapping (SRD-3 §22-23):** maps external source fields (e.g. `GL_ACCOUNT_4000` from NetSuite GL) to target line items, with dimension mapping, transformation, currency rule, aggregation, effective date. Mapping statuses: `MAPPED, PARTIALLY_MAPPED, UNMAPPED, INVALID, DISABLED`. Dashboard shows a mapping completion % (e.g. "96% Mapped"); critical unmapped values block publishing, non-critical ones may be published with warnings.
- **Allocation engine (SRD-3 §24):** `Allocation_i = Pool × (Driver_i / SUM(Driver))`. Supported drivers: headcount, revenue, floor area, units sold, asset value, transaction count, manual weight, or a custom calculated line item.
- **Model validation categories (SRD-3 §25):** `FORMULA, DEPENDENCY, MAPPING, DIMENSION, DATA_TYPE, CURRENCY, TIME, SECURITY, PERFORMANCE`, each with severity `ERROR / WARNING / INFO`. Publishing is blocked while `ERROR`-severity issues exist.
- **Publishing must never silently mutate an approved plan** (SRD-3 §26, §64.4/64.6): a change in Model Builder must not automatically alter an already-approved/locked financial plan; new model versions apply to *new* planning cycles unless an explicit, approved **Model Migration** is run against an existing cycle (§54 — diff of new/deleted line items, changed formulas/dimensions/mappings, migration preview with financial impact, requires approval, snapshot before applying).

### 3.3 Model Planning (operational side — SRD-3 Part B, cross-referenced with SRD-1/SRD-2's Budgeting/Forecast modules)

- **Purpose:** hide Model Builder's technical complexity from ordinary planning users — a department manager should see "Marketing Spend, Headcount Plan, Campaign Volume, Customer Acquisition," not "Calculation DAG, Dimension Intersection, Line Item Dependency, Module Dimensionality" (SRD-3 §27).
- **Planning cycle fields (SRD-2 §11.3, SRD-3 §28 — consistent):** cycle name, planning type, financial year, source model, published model version, actuals cut-off date, forecast start period, planning horizon, base version, base scenario, base currency, submission deadline, workflow, cycle owner, participating entities/departments.
- **Planning cycle types (consistent across SRD-2 §11.2 and SRD-3 §28):** `ANNUAL_BUDGET, QUARTERLY_FORECAST, ROLLING_FORECAST, REFORECAST, LONG_RANGE_PLAN, STRATEGIC_PLAN`. (`LONG_RANGE_PLAN` and `STRATEGIC_PLAN` are named but never given their own workflow/behaviour spec anywhere — see Section 6.)
- **Actual/forecast cut-over rule (SRD-3 §31, consistent with SRD-1/2's rolling forecast logic):** `If Period <= Actuals Cut-Off: Value = Actual Source Data; else Value = Planning Value`. Users must not edit actual periods without an explicit exceptional-adjustment permission.
- **Cycle validation before opening (SRD-2 §11.5):** cycle cannot open unless: published model is valid, model period covers the planning horizon, required dimensions/source mappings exist, department owners assigned, required drivers/workflow stages exist, submission dates valid, permissions present. Blocking example shown: missing budget owner for a department, missing FX forecast rate beyond a period, invalid payroll source mapping, unconfigured CFO approval stage.
- **Bulk editing operations required (SRD-2 §12.5):** Copy, Paste, Fill right, Fill down, Copy prior period, Copy prior year, Spread annual total, Percentage increase/decrease, Clear editable values — all validated server-side.
- **Spreading/phasing methods (SRD-3 §36):** `EVEN, PRIOR_YEAR_PATTERN, CUSTOM_WEIGHT, WORKING_DAYS, SEASONAL_PROFILE, HISTORICAL_PATTERN, MANUAL`.
- **Driver-based planning** is the encouraged pattern throughout (e.g. Customers × Avg Revenue/Customer = Revenue; Reps × Deals/Rep × Avg Deal Value = New Bookings; Opening HC + New Hires − Exits = Closing HC).
- **Submission controls / gating (SRD-2 §13.5, SRD-3 §47 — consistent):** a plan cannot be submitted unless: mandatory inputs complete, zero blocking validation errors, required commentary complete, mandatory tasks complete, budget owner assigned. Failed submission must list every unmet requirement explicitly (example message format given in both SRDs).
- **Material variance commentary rule (SRD-2 §16.4/§25, SRD-3 §48):** commentary becomes mandatory when `ABS(Variance %) >= Threshold` (example threshold used throughout: 10%). This is described as a **configurable** rule, not a fixed system constant.
- **Workflow/approval model (consistent across SRD-1 §24, SRD-2 §26, SRD-3 §46):** default linear workflow `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LOCKED`, with alternate states `RETURNED / REOPENED / REJECTED / CANCELLED`. Hierarchical path: Department Owner submits → Finance Manager reviews → FP&A consolidates → CFO approves → System locks version. **Maker-checker is a hard API-level rule**: `submitted_by != approved_by`, and this must be enforced server-side, not just hidden in the UI (SRD-2 §26.3, SRD-3 developer guardrails).
- **Concurrency control (SRD-2 §32):** optimistic concurrency via a `record_version` field; a stale save must return `409 CONFLICT` with the current value, who changed it, and when — never silently overwrite.

---

## 4. Calculation & Business Rules

### 4.1 Core financial formulas (consistent across SRD-1 §11 and SRD-2/SRD-3 formula sections)

| Metric | Formula | Notes |
|---|---|---|
| Revenue | `Units Sold × Average Selling Price` | |
| MRR / ARR (subscription) | `MRR = Active Customers × Monthly Subscription Price`; `ARR = MRR × 12` | |
| Ending customers | `Opening + New − Churned`; `Churned = Opening × Churn Rate` | |
| Revenue growth | `Prior Period Revenue × (1 + Growth Rate)` | |
| Cost of Sales / COGS | `Revenue × Cost of Sales %` or `Units Sold × COGS per Unit` | |
| Gross Profit | `Net Revenue − COGS` | |
| Gross Margin % | `Gross Profit / Net Revenue`; **must return 0, not error, when Net Revenue = 0** | Explicit divide-by-zero guard required |
| Discounts / Net Revenue | `Discounts = Revenue × Discount %`; `Net Revenue = Revenue − Discounts` | |
| Salary / Payroll cost | `Monthly Salary = Annual Salary / 12`; `Payroll Expense = Headcount × Average Fully Burdened Cost` | Part-month proration policies: `FULL_MONTH, DAILY_PRORATION, WORKING_DAY_PRORATION` |
| New hire cost | `Monthly Cost × Active Months × Hiring Probability` | |
| Headcount | `Opening Headcount + New Hires − Exits`; `ActiveInPeriod = StartDate <= PeriodEnd AND (EndDate is null OR EndDate >= PeriodStart)` | |
| Rent escalation | `Prior Period Rent × (1 + Escalation Rate)` | |
| Total Opex | `Salaries + Rent + Utilities + Marketing + Travel + Professional Fees + Other Expenses` | |
| EBITDA | `Gross Profit − Payroll Expense − Marketing Spend − Other Operating Expenses` | |
| Net Profit | `EBITDA − Depreciation − Interest − Tax` | |
| Closing Cash | `Opening Cash + Cash Inflows − Cash Outflows` (or `+ Operating/Financing/Investing Cash Flow` per SRD-3); `Opening Cash(t+1) = Closing Cash(t)` | |
| Cash Runway | `Current/Closing Cash / Average Monthly Net Burn` | **If burn ≤ 0, display "Cash Generative" — never a negative runway** |
| Cash alert thresholds | Cash < Minimum Operating Buffer → `CASH BUFFER BREACH`; Runway < 6 months → `RUNWAY WATCH`; Runway < 3 months → `CRITICAL CASH RISK` | (SRD-2 §22.5) |
| FX / Currency translation | `Base Currency Value = Transaction Currency Value × Exchange Rate` | |
| Currency variance | `Transaction Amount × (Actual FX Rate − Forecast FX Rate)` | Must be isolated from operational variance (see below) |
| Operational variance (FX-adjusted) | `Actual Value at Forecast FX Rate − Forecast Value at Forecast FX Rate` | Prevents blaming a department for a pure FX movement |
| Run-rate forecast | `Average of Actual(t-1), Actual(t-2), Actual(t-3)` (default N=3, configurable); weighted variants must also be supported (e.g. 50/30/20) | |
| Prior-year growth forecast | `Prior-Year Expense(m) × (1 + Growth Rate)` | |
| Headcount-linked expense | `Headcount × Licence Cost per Employee` | |
| Accounts Receivable | `Revenue × Collection Days / Days in Period` | |
| Cash Collections | `Opening Receivables + Revenue − Closing Receivables` | |
| Accounts Payable | `Eligible Expenses × Payment Days / Days in Period` | |
| Supplier Payments | `Opening Payables + Expenses − Closing Payables` | |
| Capex depreciation | `(Asset Cost − Residual Value) / Useful Life in Months`; depreciation start policy: `PURCHASE_MONTH, NEXT_MONTH, IN_SERVICE_DATE` | |
| Pipeline-weighted revenue | `Expected Deal Value × Probability` | Source probability/date must be retained, not overwritten |
| Allocation | `Allocation_i = Pool × (Driver_i / SUM(Driver))` | |

### 4.2 Variance & favourable/unfavourable logic

- **Variance types (consistent across all three SRDs):** Actual vs Budget, Actual vs Forecast, Forecast vs Budget, Current vs Prior Forecast, YTD Actual vs Budget, Full-Year Forecast vs Budget.
- **Absolute variance:** `Actual/Forecast − Plan`.
- **Percentage variance:** `(Actual − Plan) / ABS(Plan) × 100`. **Where Plan = 0, the UI must show "N/A"** (SRD-2/SRD-3), optionally annotated "NEW SPEND" or "NEW REVENUE" (SRD-2 §25.3) — never an infinite or divide-by-zero result.
- **Favourable/unfavourable logic is metric-type-dependent, not sign-dependent** — this is called out as a critical rule in all three SRDs and repeated in the SRD-2 developer guardrails ("never calculate favourable/unfavourable using numeric sign alone"):
  - Revenue: Actual ≥ Budget → favourable; Actual < Budget → unfavourable.
  - Expense: Actual ≤ Budget → favourable; Actual > Budget → unfavourable.
  - Cash: Actual ≥ Forecast → favourable; Actual < Forecast → unfavourable.
  - Formally, each line item carries a `variance_direction` of `HIGHER_IS_FAVOURABLE`, `LOWER_IS_FAVOURABLE`, or `NEUTRAL`.
- **Root-cause categories for variance commentary (SRD-2 §25.7):** `PRICE, VOLUME, MIX, TIMING, FX, HEADCOUNT, INFLATION, ONE_OFF, OPERATIONAL, ACCOUNTING, OTHER`.
- **Waterfall/bridge decomposition:** `Revenue Variance = Price Impact + Volume Impact + Mix Impact + Other Impact` (± FX/Opex as applicable) — the calculation engine must support configurable variance bridges, not just a single total variance number.
- **Commentary record fields (SRD-2 §25.7, SRD-3 §44):** variance, line item, department, owner, explanation, root cause category, corrective action, forecast impact, due date, reviewer, status.

### 4.3 Versioning, locking & roll-forward rules

- **Version lifecycle states (broadly consistent):** `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LOCKED`, plus `ARCHIVED`/`WORKING` in some SRDs, and alternate paths `RETURNED, REOPENED, REJECTED, CANCELLED`.
- **Locked version rule (hard rule, all three SRDs):** once `status = LOCKED`, every write API must reject changes (attempted writes return an error, e.g. `403`/`LOCKED_VERSION`) and the attempt must be audit-logged. A locked version may be **copied** into a new working version but never mutated in place.
- **Reopening a locked/approved version is not silent** (SRD-2 §31.3): a reopen request must capture a reason and require approval; creating a *new* working copy is the default behaviour, and reopening the existing version should only happen where policy explicitly permits it.
- **Rolling forecast roll-forward (consistent across SRD-1 Fig.3, SRD-2 §14.2/Fig.5, SRD-3 §30):** `Full-Year Forecast = Closed-Period Actuals + Open-Period Forecast`. On period close: actuals sync → retain closed forecast in history → actual replaces displayed forecast → lock closed period → move forecast start forward → add new future period → extend drivers → recalculate dependencies → generate variances → open new forecast cycle. **The prior forecast version must never be overwritten** — when Forecast Q3 is approved and locked, creating Forecast Q4 copies Q3 into a new version.
- **Circular reference control (all three SRDs):** must be detected and must block saving/publishing, with the specific cycle path shown (e.g. `Revenue → Units → Revenue`).
- **Calculation flow / recalculation scope (SRD-1 Fig.5, SRD-2 §30.3, SRD-3 §20.1):** edit → validate → check editability/permission/version-lock → identify dependent cells → recalculate *only* affected downstream cells and summaries → record audit log → return updated grid. Explicitly: an unrelated model/module that doesn't depend on the changed value must **not** be recalculated.
- **Server is the sole source of calculated truth (SRD-2 §39 guardrails, SRD-3 §64.1):** the browser must never submit a calculated value directly (e.g. must send `Units Sold` and `Price`, not a pre-computed `Revenue`); the server always recalculates.
- **Actuals are immutable inputs, not editable forecasts (all SRDs):** closed/locked actual periods must be read-only in planning; counting a locked actual period as an editable forecast is explicitly listed as a prohibited developer action.

### 4.4 Aggregation / roll-up rules

- Parent dimension members aggregate child values, default `Parent = SUM(Children)` (e.g. Total Zimbabwe Revenue = Harare + Bulawayo Revenue), but the summary method is configurable per line item: `SUM, AVERAGE, MIN, MAX, FIRST, LAST, COUNT, WEIGHTED_AVERAGE, NONE, FORMULA` (SRD-3 §10.5).
- Sparse value storage is required — the system must **not** materialise every theoretical dimensional intersection (SRD-2 §7.3 gives an example of 120,000,000 theoretical cells from realistic dimension counts); only inputs, imports, overrides, and required materialised/cached calculated values should be stored.

---

## 5. Performance Management Integration (SRD-4)

SRD-4 is explicitly a *developer boundary/education* document, not a build spec for the Performance module itself (which has no SRD in this set). It defines the **contract** between FP&A and a separate Performance Management module. Direction and trigger points below are as precisely stated in the source.

### 5.1 System boundary (hard rule)

- FP&A = "the Financial Future Engine" (what do we expect financially). Performance Management = "the Strategy Execution and Accountability Engine" (are we delivering). **They must remain separate systems** with controlled, auditable integrations — never one combined workflow, and never one shared generic values table for Budget/Forecast/KPI Target/Actual (SRD-4 §6, §25 guardrail #1 and #5).

### 5.2 Data flow direction 1: FP&A → Performance Management (targets)

- **Trigger:** an FP&A plan version is **approved and locked** (event named in SRD-4's own flow: `FP&A_VERSION_LOCKED`).
- **What flows:** only *selected* FP&A line items, via an explicit, configured **Target Mapping** (not every line item automatically becomes a KPI — SRD-4 §25 guardrail #13). Example mappings given: Closing AUM → AUM Growth KPI; Management Fee Revenue → Fee Revenue Achievement; Revenue → Revenue Achievement; EBITDA → EBITDA Achievement; Operating Expenses → Cost Control; Headcount → Approved Headcount Compliance; Closing Cash → Minimum Cash Buffer.
- **Mapping fields required:** KPI, FP&A Model, FP&A Line Item, Target Source Version, Target Mapping Method (e.g. `FULL_YEAR_VALUE`).
- **Resulting event:** Performance Management reads mapped target values → `PERFORMANCE_TARGET_SNAPSHOT_CREATED`.
- **Critical control:** the **original target must never be overwritten** by a later, lower forecast — "management may hide poor performance by continuously lowering the target" is explicitly the failure mode being prevented (SRD-4 §14). Target, Forecast, and Actual must always be displayed as three separate, simultaneously-visible values, never collapsed into one.

### 5.3 Data flow direction 2: Performance Management → FP&A (forecast review trigger, not a direct write)

- **Trigger:** a KPI's actual result is updated and its performance is recalculated against target; if a configured threshold is breached (e.g. "KPI Achievement < 70% for 2 consecutive months" per the Driver Mapping example), Performance Management checks whether that KPI has a configured **Driver Mapping** to an FP&A driver.
- **Event chain (SRD-4 §23):** `KPI_ACTUAL_UPDATED → KPI_PERFORMANCE_RECALCULATED → KPI_THRESHOLD_BREACHED → (check FP&A driver mapping) → IF MATERIAL: CREATE FORECAST REVIEW TRIGGER → FPA_FORECAST_REVIEW_REQUESTED`.
- **Critical control:** Performance Management **must not directly alter an FP&A driver or forecast value** (SRD-4 §25 guardrail #2 and #6). It only creates a `Forecast Review Trigger` record (fields: KPI, KPI owner, performance period, target, actual, achievement, status, linked FP&A driver, current FP&A driver value, trigger reason, trigger date, FP&A reviewer, review status, review decision, resulting forecast version). A human FP&A reviewer decides whether and how to change the forecast. Trigger statuses: `OPEN, UNDER_REVIEW, NO_FORECAST_CHANGE, FORECAST_CHANGE_PROPOSED, FORECAST_UPDATED, CLOSED`.
- **No automatic reforecast approval** — guardrail #12 explicitly prohibits automatically approving a reforecast just because a KPI is underperforming.

### 5.4 Data flow direction 3: FP&A → Performance Management (forecast snapshot, informational only)

- **Trigger:** an FP&A forecast version is approved (SRD-4's own diagram names this event `FPA_FORECAST_VERSION_APPROVED` — see Section 6 for a naming mismatch against SRD-2's canonical event list).
- **What flows:** Performance Management imports the current forecast values for display **alongside**, not instead of, the original target and actual — resulting event `PERFORMANCE_FORECAST_SNAPSHOT_UPDATED`. Example shown: Original Target $120m / Current Forecast $102m / Actual YTD $38m, all three shown together with Target Achievement 31.7% and Forecast Attainment 37.3%.

### 5.5 Required integration-object tables named in SRD-4 (§22)

`performance_fpa_target_mappings`, `performance_fpa_driver_mappings`, `performance_forecast_review_triggers`, `performance_financial_target_snapshots`, `performance_forecast_snapshots`.

### 5.6 Division of analytical ownership

- **FP&A owns financial variance analysis** (Actual vs Budget, Actual vs Forecast, Forecast vs Budget, Current vs Prior Forecast) — "why is revenue $7m below budget?"
- **Performance Management owns KPI/operational underperformance analysis** (e.g. mandate conversion, pipeline conversion, client retention) — "why is the business behind?"
- The two are meant to be read together by a human (e.g. "revenue is below plan *because* the mandate acquisition process is underperforming") — the SRDs do **not** specify that the system itself computes this combined causal narrative; that synthesis is manual/managerial, not automated.

### 5.7 Explicit "must never" list for the integration (SRD-4 §25, all 15 items)

1. Treat FP&A and Performance Management as the same module.
2. Allow Performance Management to directly alter FP&A calculations.
3. Allow FP&A forecast changes to overwrite original KPI targets.
4. Treat forecasts as performance targets automatically.
5. Store budget, forecast and KPI targets as one interchangeable value.
6. Let KPI underperformance automatically change an FP&A driver.
7. Remove historical targets after a reforecast.
8. Calculate KPI achievement without a defined target basis.
9. Use financial variance commentary as a replacement for corrective actions.
10. Store corrective actions inside FP&A planning cells.
11. Expose individual performance scorecards through FP&A permissions.
12. Automatically approve a reforecast because a KPI is underperforming.
13. Assume every FP&A line item should become a KPI.
14. Assume every KPI should link to an FP&A driver.
15. Delete the relationship between an approved target and its source FP&A version.

---

## 6. Ambiguities, Inconsistencies & Gaps Across the Source SRDs

These are called out explicitly rather than resolved, per the brief — QA should be aware the specs themselves are not a single unified document and should decide case-by-case which behaviour to test against, or flag the conflict itself as a finding.

1. **Three independently-written SRDs, not one canonical spec.** SRD-1, SRD-2, and SRD-3 each define their own (overlapping but not identical) navigation trees, database table names/columns, API route namespaces, user-role lists, and workflow-diagram step names for what is presented as the same module. None of the four documents states a precedence order if they conflict. Notable concrete divergences:
   - **User roles:** SRD-1/SRD-2 list 6 roles (CFO/Finance Director, FP&A Manager, Financial Analyst, Department Head/Budget Owner, Executive/Board Viewer, System Administrator). SRD-3 lists 7, renaming "FP&A Manager" context into a separate **"FP&A Administrator"** (Model Builder-focused) role plus a distinct **"FP&A Analyst"**, and adds an **"Auditor"** role with read-only access to models/formulas/history/audit logs — a role never mentioned in SRD-1 or SRD-2.
   - **Cell status enums:** SRD-2 defines 8 states including `PENDING_CALCULATION`; SRD-3 defines 7 states (same set, minus `PENDING_CALCULATION`).
   - **Scenario naming:** "Upside" (SRD-1/SRD-2) vs "Best Case" (SRD-3) appear to refer to the same scenario type.
   - **Database schemas:** all three SRDs propose a `planning_values`/`fpa_planning_values`-equivalent core table, but with different column sets (e.g. SRD-2's version has an explicit `record_version BIGINT` for optimistic concurrency; SRD-1's and SRD-3's representative table DDLs do not show this column even though optimistic concurrency is described in prose elsewhere). API route prefixes also differ in small ways between SRD-1 (`/api/v1/fpa/models/{model_id}/...`) and SRD-2/SRD-3 (`/api/v1/fpa/planning-cycles/...`, `/api/v1/fpa/planning/{cycle_id}/...`).
   - **Navigation trees** differ in grouping and item names (see §1.2 above) — e.g. SRD-1 has flat "Actuals vs Budget"/"Actuals vs Forecast" as top-level items, SRD-2 nests them under "Variance Analysis," and SRD-3 doesn't mention them at all in its own nav tree (folds them into "Model Planning → Variance Analysis").
2. **Scenario promotion approval step is drawn inconsistently.** SRD-1's Scenario Planning Workflow diagram (Fig.4) shows an explicit `Submit for approval → CFO approves` step before `Promote to approved forecast version`. SRD-2's own Scenario Creation Flow diagram (Fig.6, §15.4) shows `Management Review → Promote? → (Yes) → Create new working forecast version` with no explicit CFO-approval node in the diagram itself (CFO approval authority is stated elsewhere as a role permission, but not drawn into this specific flow). QA should verify against actual product behaviour rather than assuming either diagram is authoritative.
3. **Rolling forecast horizon length is only ever given as an example, never as a fixed rule.** SRD-2 repeats "18-month rolling forecast" in two places (dashboard KPI example and a user story) as if it might be a standard, but no SRD states the horizon length as a configurable-with-a-default value vs. a hard requirement. Treat 18 months as illustrative only.
4. **Materiality/variance thresholds are illustrative, not fixed constants.** The commentary-required threshold (commonly shown as 10%) and the driver-approval materiality threshold (also shown as 10% in one example, 26.3% in another where a threshold was exceeded) are described as configurable business rules. Do not test for a hardcoded "10%" as if it were a spec requirement — check whether the live app exposes this as an admin-configurable setting.
5. **`LONG_RANGE_PLAN` and `STRATEGIC_PLAN` cycle types are named but never specified.** Both SRD-2 §11.2 and SRD-3 §28 list these alongside Annual Budget/Rolling Forecast/Quarterly Forecast/Reforecast, but no SRD describes what distinguishes their workflow, horizon handling, or UI from the other cycle types. This is a genuine spec gap, not just a documentation split.
6. **Several modules have field/formula specs but no UI mockup anywhere in the three product SRDs:** Capital Expenditure Planning, Working Capital Planning, Portfolio Company Forecasts, Actuals Integration/Data Hub (Data Sources/Import Jobs/Mapping/Exceptions screens), Management Reporting, Board Packs, AI-Assisted Forecasting, and Model Migration. QA has no visual reference to test these screens' layout against — only the textual field lists, formulas, and process flows documented in Sections 1 and 3-4 above. Do not assume a specific layout for these; test functional behaviour only.
7. **AI-Assisted Forecasting is specified in SRD-1 and SRD-2 (with matching permitted/prohibited-actions lists) but is entirely absent from SRD-3.** It's unclear whether Model Planning (SRD-3's operational workspace) is meant to surface AI suggestions at all, or whether AI assistance is scoped only to the modules described in SRD-1/SRD-2.
8. **SRD-4's integration event names do not all match SRD-2's canonical FP&A event list.** SRD-2 §36 defines the full authoritative FP&A event catalogue: `FPA_PLANNING_CYCLE_OPENED, FPA_VALUE_CHANGED, FPA_DRIVER_CHANGED, FPA_DRIVER_APPROVED, FPA_CALCULATION_COMPLETED, FPA_CALCULATION_FAILED, FPA_ACTUALS_IMPORTED, FPA_ACTUALS_LOCKED, FPA_FORECAST_ROLLED, FPA_VARIANCE_MATERIAL, FPA_COMMENTARY_REQUESTED, FPA_PLAN_SUBMITTED, FPA_PLAN_RETURNED, FPA_PLAN_APPROVED, FPA_VERSION_LOCKED, FPA_SCENARIO_PROMOTED, FPA_BOARD_PACK_APPROVED`. SRD-4's own integration flow (§23) references `FP&A_VERSION_LOCKED` (matches `FPA_VERSION_LOCKED` — OK) but also references **`FPA_FORECAST_VERSION_APPROVED`**, which does not appear anywhere in SRD-2's event list (the closest analogues are `FPA_PLAN_APPROVED` or `FPA_VERSION_LOCKED`). QA/dev should treat this as an unresolved naming gap between the FP&A technical spec and the Performance integration guidance — it is not clear which real event (if any) is meant to fire the forecast-snapshot flow into Performance Management.
9. **The Performance Management module itself has no SRD in this set.** SRD-4 is guidance for the *boundary and integration contract* only; none of the KPI scorecard screens, corrective-action workflow UI, or Performance-side data model are specified anywhere in these four documents. Any testing of the Performance side of the integration (e.g. verifying a KPI card actually shows the mapped FP&A target) can only be validated from the FP&A side of the contract (are target mappings configurable, does locking a version emit the expected event) — the receiving behaviour is out of scope of these SRDs.
10. **SRD-3's Document Control table states "Version 1.0 | July 2026"** while SRD-4 states "Version 1.0, Date 12 July 2026" and SRD-1/SRD-2 carry no explicit version/date metadata at all — there's no reliable way to determine which SRD was authored last (and is therefore likely to reflect the most current thinking) purely from internal metadata.
11. **UI palette description differs slightly in emphasis** between SRD-2 (white canvas, cool-grey background, navy text, cobalt/indigo/violet/teal/emerald accents) and SRD-3 (white institutional interface, blue and purple accents only, no mention of teal/emerald) — the rendered mockups in both are visually consistent with each other (blue/purple/teal/green all appear in both sets of screenshots), so this is likely just an incomplete prose description in SRD-3 rather than a real design conflict, but is noted for completeness.

