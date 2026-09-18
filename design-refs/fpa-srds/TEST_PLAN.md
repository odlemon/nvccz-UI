# FP&A Module — Test Plan (Stage 2)

Derived from `REQUIREMENTS_DIGEST.md`. Executed live on dev (`dev.matanho.com/forecasting`), logged in as `admin@nts.com` unless a specific role/persona is named. Every item cites the digest section it comes from. Findings from this pass are logged separately in `TEST_FINDINGS.md` using the ID/Severity format specified.

Real app routes mapped to digest screens (# = digest table row):

| Route | Digest # | Nav-visible? |
|---|---|---|
| `/forecasting` | 1 Home | Yes |
| `/forecasting/models` | 5/21 Workflow & Approvals / Model Planning workspace (app calls this "Model Planning") | Yes |
| `/forecasting/model-builder`, `/model-builder/[modelId]` | 3/22 Model Builder | Yes |
| `/forecasting/budget`, `/budget/[cycleId]/workspace` | 7 Dept Budget Workspace | Yes |
| `/forecasting/rolling-forecast` | 8 Rolling Forecast | Yes (labelled "Forecasts") |
| `/forecasting/drivers` | 9 Assumptions & Driver Library | Yes (labelled "Assumptions") |
| `/forecasting/workforce` | 10 Workforce Planning | Yes |
| `/forecasting/revenue` | 11 Revenue Planning | Yes |
| `/forecasting/expenses` | 12 Expense Planning | Yes |
| `/forecasting/cash-flow` | 13 Cash Flow | Yes |
| `/forecasting/variance` | 6 Variance Analysis | Yes |
| `/forecasting/reports` | 18 Management Reporting / 19 Board Packs | Yes |
| `/forecasting/workflow` | 5 Workflow & Approvals | Yes |
| `/forecasting/audit` | Audit Logs (nav §1.2, all 3 SRDs) | **No — confirmed stub in recon** |
| `/forecasting/scenarios` | 4 Scenario Comparison | **No — not in `modules.ts`, URL-only** |
| `/forecasting/settings` | Settings | Yes |
| Capex, Working Capital, Portfolio Co. Forecasts, Data Hub, AI-Assisted, Model Migration (digest #14-17,20,23) | — | **No route found in `app/forecasting/` at all — check for existence first** |

---

## A. Per-screen functional + calculation test cases

### A1. Home (digest #1)
- Load `/forecasting`: all KPI cards resolve past skeleton state within a reasonable time (recon: confirmed loads). Check Cash Runway value here.
- Change Scenario/Version/Period selectors → dashboard KPIs must update, not stay frozen.
- **Cross-screen consistency (recon flagged):** record Closing Cash and Cash Runway here, then compare against the *same* metric on Rolling Forecast (#A8) and Cash Flow (#A13). Digest §4.1 defines one formula for each — there is exactly one correct answer per period; three different displayed values for "Closing Cash" is a calculation bug, not a display choice.
- Recent Activity / Open Tasks: confirm real records, not fixture text.

### A2. Model Planning (digest #5/#21, app route `/forecasting/models`)
- List renders real cycles with real statuses (confirmed in recon). Status label casing is inconsistent (`Locked`, `Approved` vs `UNDER_REVIEW`, `OPEN`) — note as UI-mismatch finding regardless of severity.
- Open each lifecycle stage's cycle (`Locked`, `Approved`, `Returned for correction`, `UNDER_REVIEW`, `SUBMITTED`, `OPEN`, `Draft`) and confirm the workspace shown matches that state's permitted actions per digest §3.3 workflow model (`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LOCKED`, alt `RETURNED/REOPENED/REJECTED/CANCELLED`).
- **Locked-version rule (§4.3):** attempt a write (edit a cell, change an owner) against the `Locked` cycle via the UI. Expected: rejected client-side AND — more importantly — via direct API call (`PUT .../grid/cells` or similar) against a locked cycle's model. Expected server response: `403`/`LOCKED_VERSION`, audit-logged. This must be verified at the API, not just "the button is disabled."
- **Maker-checker (§3.3):** as a single user with both submit and approve rights (e.g. admin), submit a cycle then attempt to approve the same submission. Digest states this is a "hard API-level rule" (`submitted_by != approved_by`) enforced server-side. Test by calling `POST .../submit-fpa` then `POST .../cfo-approve` as the same user id — expect a rejection, not a success.
- **Concurrency (§3.3):** open the same cycle/cell in two tabs, edit in tab A and save, then edit the same cell in tab B (stale) and save. Expected: `409 CONFLICT` with current value + who/when, not a silent overwrite.

### A3. Model Builder (digest #3/#22, `/forecasting/model-builder`, `[modelId]`)
- List renders 3 real models (confirmed). Click into each model.
- **Recon-confirmed bug:** clicking a model card navigated to `/forecasting/model-builder/[modelId]` and rendered a **completely blank page**, no console error. Re-verify and get exact repro (which model, does it happen for all 3).
- If the detail view loads: verify the component tree (Dimensions/Line Items/Versions/Scenarios/Drivers/Formulas/Workflows/Security), the line-item grid, Properties panel with formula editor + "Validate Formula", Dependency Map, Validate All / Publish Model buttons — per digest §1.1 row 3 and §3.2.
- **Formula engine (§3.2):** create/edit a formula using at least one required function (`IF`, `SUM`, `ROUND`, `GROWTH`, `NPV` — pick a few) and a cross-module reference (`[Workforce.Headcount] * [Workforce.Average Salary]`). Confirm it validates and the dependency graph updates.
- **Circular reference detection (§3.2, §4.3):** deliberately create `A = B`, `B = A` (or similar). Expected: blocked from publishing with the specific cycle path shown, not a generic error or a silent accept.
- **Publish gating (§3.2):** confirm publish is blocked while any `ERROR`-severity validation issue exists (formula/dependency/mapping/dimension/data-type/currency/time/security/performance categories per §3.2).
- **Model Migration (digest #23):** no UI mockup exists; check whether ANY migration mechanism exists at all when a new model version is published against an in-flight cycle. If none exists, this is a **Missing** finding (SRD requires diff/preview/approval/snapshot flow).

### A4. Scenarios (digest #4, `/forecasting/scenarios` — not nav-linked)
- Confirmed real data: 4 scenarios (Base/Upside/Downside/Custom) with correct `Inherits:` chains.
- **Discoverability gap:** confirm this screen is genuinely unreachable from the sidebar/Home — if so, log as a finding (a required screen per digest §1.1 row 4 exists but isn't in `lib/config/modules.ts`'s submodule list).
- **Calculation correctness (recon flagged):** COGS/Gross Profit/Opex show `$0`/`—` for every scenario while Revenue and EBITDA show real numbers. Per §4.1, Gross Profit = Net Revenue − COGS and EBITDA depends on Payroll/Marketing/Other Opex — if EBITDA is non-zero, COGS/Opex must be too, or EBITDA itself is wrong. Manually recompute EBITDA from the visible Revenue/COGS/Opex numbers and check it matches the displayed EBITDA.
- **Promote flow (§3.1, item 2 in ambiguity list):** run Duplicate → edit an override → Promote. Verify per §3.1's hard rule regardless of the diagram ambiguity: promoting must **never overwrite an approved forecast** — it must create a new working version. Confirm the pre-promotion version is untouched afterward.
- Sensitivity Analysis table, waterfall bridge, Cash Runway Comparison: confirm present and populated (§3.1).

### A5. Budgeting (digest #7, `/forecasting/budget`, `[cycleId]/workspace`)
- Confirmed real cycles across 4 workflow stages. Open the "Budget Input" (Open for input) cycle's workspace.
- **Recon-flagged bug:** Planning Areas list showed `OPEX · 144/144` and `CASH · 0/0` **twice each** in the same render. Re-verify and get exact repro.
- **Number formatting bug (recon):** department register showed `10,074,287.399` (3 decimal places on a currency figure). Check formatting convention elsewhere in the app (2 decimals / rounded) and flag as UI-mismatch if inconsistent.
- Validation & Tasks panel: confirm blocking vs comment vs done colour-coding (§1.1 row 7).
- **Submission gating (§3.3):** attempt to submit with an incomplete planning area. Expected: blocked with every unmet requirement listed explicitly, not a generic error.
- Test the full owner → Finance Manager → FP&A → CFO path (§3.3) end to end with real actions (submit, return, resubmit, approve, lock) — this is the module's core UAT journey.

### A6. Assumptions / Driver Library (digest #9, `/forecasting/drivers`)
- Confirmed real driver rows (Average Cost per FTE, monthly series). Filter by category (CAPEX/REVENUE/WORKFORCE) and confirm filtering actually filters.
- **Approval workflow (§1.1 row 9):** find a driver in "Pending Approval" state (if any exist) and test Approve/Reject. Confirm `Affected Calculations` list is populated and accurate — i.e. approving a driver should trigger recalculation of exactly those dependents (§4.3 recalculation-scope rule: only affected downstream cells, not the whole model).
- **Materiality threshold (§4.2, ambiguity #4):** confirm the threshold is admin-configurable somewhere (likely Settings), not hardcoded — check Settings screen for this.

### A7. Workforce (digest #10, `/forecasting/workforce`)
- **Recon-flagged CRITICAL calculation bug:** Headcount KPI shows `14674`; department rows show `38726.159999999996` for Finance alone. For context, this ERP models a mid-size fund/PE firm — these numbers are implausible by 2-3 orders of magnitude and carry spurious floating-point precision (14 decimal places), strongly suggesting a SUM-across-all-periods-instead-of-latest-period bug or a duplicate-join in the aggregation query. Root-cause this against §4.1's `Headcount = Opening Headcount + New Hires − Exits` formula and the `ActiveInPeriod` date-range logic.
- Cross-check: does Home's Headcount KPI match Workforce's? (Recon didn't capture Home's headcount number — re-check in Stage 3.)
- What-if Salary Inflation slider: confirm "Choose a returned driver; no driver code has been guessed" isn't a silent failure — check whether a driver selection actually recalculates the preview.

### A8. Revenue (digest #11, `/forecasting/revenue`)
- **Recon-flagged bug:** YoY Growth shows `324.9%` — verify against §4.1's `Revenue growth = Prior Period Revenue × (1 + Growth Rate)`; a value this large usually means the prior-period base is near-zero or the wrong period is being compared.
- **Data confusion (recon):** a revenue stream literally named "Revenue" shows `$11.5M` forecast inside a table meant to break revenue down BY stream (Client Mandates, Average Monthly Fee, Recurring Advisory, Project/Transaction) — check whether this is a real fifth stream or a mislabeled total row double-counted as a stream.
- Method tabs (Unit/Price, Subscription, Contract, Pipeline — §1.1 row 11): confirm each renders its own driver table, not a shared/static one.
- Revenue Bridge waterfall (Base/Volume/Price/Churn): confirm it reconciles — the sum of the bridge segments should equal the total revenue delta shown elsewhere.

### A9. Expenses (digest #12, `/forecasting/expenses`)
- Total Opex / Committed / Uncommitted / Commentary KPI cards: confirm real, and that Total Opex reconciles with what feeds EBITDA on Home/Scenarios (§4.1: `EBITDA = Gross Profit − Payroll − Marketing − Other Opex`).
- Expense Forecast Register: confirm Method column values are real (driver-based, per §3.3 encouraged pattern) and Variance column matches `Actual/Forecast − Plan` (§4.2).

### A10. Cash Flow (digest #13, `/forecasting/cash-flow`)
- **Ties directly into the A1/A8 cross-screen consistency check** — this is the "third answer" ($0.2M) in the 3-way Closing Cash discrepancy. Root-cause which of the three screens (Home $31.1M, Rolling Forecast $31.1M, Cash Flow $0.2M) is actually computing correctly per §4.1's formula, fix the other(s).
- **Cash Runway (§4.1):** "If burn ≤ 0, display 'Cash Generative' — never a negative runway." Confirm this guard exists; also confirms/contradicts the 3-way Runway discrepancy (Home 34.8mo, Rolling Forecast "—", Cash Flow 19.7mo).
- Cash alert thresholds (§4.1: buffer breach / runway watch <6mo / critical <3mo): find or create a scenario that should trigger each threshold and confirm the alert actually fires.
- Monthly Cash Curve chart with Minimum Buffer reference line (§1.1 row 13): confirm present.

### A11. Variance (digest #6, `/forecasting/variance`)
- Confirmed real per-department Actual/Budget/Forecast figures reconciling roughly sensibly.
- **Favourable/unfavourable logic (§4.2 — explicit "never use sign alone" rule):** find or construct one Revenue variance and one Expense variance, both with the same numeric sign, and confirm the UI's favourable/unfavourable indicator differs correctly per metric type (Revenue: actual≥budget=favourable; Expense: actual≤budget=favourable) rather than just colouring by positive/negative number.
- **Percentage variance zero-plan guard (§4.2):** find a line item with Plan=0 and confirm the UI shows "N/A", not an error or infinite value.
- Commentary column showed "Unavailable" for every row (recon) — determine if this is an honest empty state or a broken fetch; "Unavailable" phrasing itself reads like an error state bleeding into a data column.
- Root-cause categories (§4.2: PRICE/VOLUME/MIX/TIMING/FX/HEADCOUNT/INFLATION/ONE_OFF/OPERATIONAL/ACCOUNTING/OTHER) — confirm these are selectable when creating commentary, not a free-text field pretending to be categorical.

### A12. Reports (digest #18/#19, `/forecasting/reports`)
- Confirmed Board Pack / Management Report cards with Generate/Preview/Download and a real `READY` status.
- **Board Pack gating (§1.1 row 19):** confirm generation is only possible from an approved/locked version — attempt to generate against a DRAFT/UNDER_REVIEW cycle and confirm it's blocked or the UI prevents selecting one.
- Actually click Generate → Preview → Download on at least one report type; confirm a real file is produced (not a stub/mock download).

### A13. Rolling Forecast (digest #8, `/forecasting/rolling-forecast`)
- Part of the A1/A10 cross-screen Closing Cash/Runway consistency check.
- **Roll-forward rule (§4.3):** `Full-Year Forecast = Closed-Period Actuals + Open-Period Forecast`. Click "Roll Forward" and confirm: prior forecast version is preserved (not overwritten — §4.3 hard rule), a new period is added, actuals sync for the just-closed period, and dependent recalculation happens.
- "Sync Actuals" button: confirm it pulls real data and produces a visible reconciliation result, not a silent no-op.
- Actual/Forecast Cut-Over month strip: confirm actual-styled vs forecast-styled months visually differ (§2 grid convention) and align with the model's actual cut-off date.

### A14. Workflow & Approvals (digest #5, `/forecasting/workflow`)
- **Recon-flagged bug:** Setup stage showed `Completed Aug 20, 2026 – Aug 15, 2026` — end date before start date. Re-verify and check the underlying cycle record.
- **Recon-flagged bug:** Department Input stage showed `Completed Starts Aug 15, 2026` — two contradictory state labels concatenated. Likely a template bug combining a status label with a date-range label incorrectly.
- Review Queue / Pending Approvals / Returned Items counters: confirm they match the actual number of items in each state (cross-check against Model Planning's cycle list).
- Cycle actions (Approve/Return/Lock): exercise the full path with real state transitions, confirming server-side rejection of invalid transitions (e.g. approve from DRAFT without submission).

### A15. Settings (digest #1.1, Settings row)
- **Recon-flagged gap:** all 3 forecast entities show "No accounts mapped" — if the actuals/variance pipeline depends on Chart-of-Accounts mapping (digest §3.2 Data Mapping, mapping completion % / blocks publishing), this is a functional blocker, not cosmetic. Determine whether ANY entity in the system has a working mapping, and if not, whether that explains some of the A10/A11 data-quality issues.
- Variance Thresholds tab: confirm materiality threshold (§4.2 ambiguity #4) is actually configurable here.
- Sync Sources tab: test connect/disconnect/sync against a real source if one is configured.
- Workflow Defaults tab: confirm present and functional.

### A16. Audit Logs (confirmed stub)
- Confirmed: "Screen shell ready — connect `/v1/fpa` APIs to enable live data." Backend has `GET /models/:modelId/audit` and `/models/:modelId/audit-logs` (both exist in `fpaRoutes.ts`) plus a full `FpaAuditService`. This is a **Missing** finding — real backend exists, frontend was never wired. Confirm exactly which endpoint(s) should feed this screen before building the fix.

### A17. Screens with no discovered route at all
Check for existence of Capex Planning, Working Capital, Portfolio Company Forecasts, Actuals Integration/Data Hub, AI-Assisted Forecasting (digest #14-17, #20) under any path/tab before concluding they're missing outright — they may be nested inside another screen (e.g. Capex inside Budgeting or Model Builder modules) rather than absent. If genuinely absent anywhere in the UI despite backend services existing (`FpaModuleService`, `FpaDataMappingService`, `FpaAiService` all exist), that is a **Missing** (HIGH) finding each.

---

## B. Cross-cutting dimensions

### B1. Performance module integration (digest §5) — both directions
- **Direction 1 (FP&A → Performance, targets, §5.2):** find or create an FP&A→Performance Target Mapping (Settings, or Model Builder — locate where this is configured). Lock a version with a mapped line item. Confirm (a) a `PERFORMANCE_TARGET_SNAPSHOT_CREATED`-equivalent event/record appears, (b) the Performance module's KPI screen shows the mapped target, (c) re-locking a *lower* forecast version does **not** overwrite the original target (§5.2 critical control — this is the one explicit "must never" most worth adversarial-testing).
- **Direction 2 (Performance → FP&A, review trigger, §5.3):** find a KPI in Performance with a configured Driver Mapping to an FP&A driver. Force/simulate a threshold breach. Confirm a Forecast Review Trigger record is created in FP&A (not a direct driver mutation — §5.3 critical control, guardrail #2/#6). Confirm Performance Management genuinely cannot write to an FP&A driver value directly — try to find any code path that would let it, and if none, confirm by inspection that the two systems only communicate via the named trigger tables (§5.5).
- **Direction 3 (FP&A → Performance, forecast snapshot, §5.4):** approve a forecast version and confirm Performance shows Target / Forecast / Actual as three separate, simultaneously-visible values (not collapsed into one) — this directly tests guardrail #5.
- If Direction 1/2 mapping configuration UI doesn't exist anywhere in FP&A Settings or Model Builder, that itself is a **Missing (HIGH)** finding — the entire SRD-4 contract depends on Target Mappings and Driver Mappings being configurable somewhere.

### B2. Responsiveness — every screen, 375 / 768 / 1440
All 17 in-scope screens (A1-A16, excluding A17 pending existence check) at all three widths. Check: no horizontal page scroll at 375, tables scroll in their own container (per this codebase's established convention, already the standard checked elsewhere this engagement), KPI card grids reflow sanely, sidebar collapses/becomes a drawer below 768. Given `1440×900` / `1536×960` are the SRD's own stated validation viewports (§2), 1440 is not just "one of three" but the primary reference size — deviations there are more significant than at 375/768.

### B3. Security & permissions
- **Primary test, high-confidence-of-finding:** `fpaRoutes.ts` applies only `router.use(authenticate)` — no staff-only or role middleware at the route level. `FpaAccessService.canEdit()` defaults to `return true` for any authenticated user who isn't an unapproved board-viewer, isn't an approver, and has no assigned departments — i.e. fails **open**, not closed. Test adversarially exactly as done earlier in this engagement for Fundraising: obtain a valid LP portal token and an investee portal token (same test accounts used previously this session), and call FP&A write endpoints directly (e.g. `PUT /models/:modelId/grid/cells`, `POST /budget-cycles/:id/submit-fpa`, `POST /model-planning/cycles/:id/cfo-approve`) with those tokens. Expected per platform convention (matching the Fundraising fix already shipped this engagement): 403. If any of these succeed, this is a CRITICAL finding matching the exact pattern already fixed twice elsewhere in this codebase, and should be fixed the same way (`requireInternalStaffUser()`-equivalent gate at the router level, not just relying on the service-layer role check).
- **Secondary test:** with a genuine Department Head/Budget Owner staff account (not admin), confirm they can edit only their assigned department's budget lines, not others' — per §3.3's `assignedDepartmentIds` scoping logic. If no such persona exists yet, note as a test blocker requiring a persona to be provisioned (mirroring how this was handled for Payroll/Fundraising personas earlier this engagement) rather than skipping the test.
- Confirm restricted actions (approve, lock, publish model) are genuinely blocked for a non-privileged staff role at the API, not just hidden from the UI (mirrors B3's primary test but with an internal low-privilege account rather than an external one).

### B4. UAT — one real end-to-end journey
Run the full Annual Budget cycle as a human would: Department Head opens their budget workspace → enters/edits values via drivers → submits → Finance Manager reviews → FP&A consolidates/accepts → CFO approves → cycle locks → Board Pack generated from the locked version → Performance Management shows the mapped target. This single journey exercises A5, A14, A12, and B1 together and is the most valuable single test in the whole plan — if this breaks anywhere, everything downstream of that point is moot.

### B5. QAT — general
- No dead ends / infinite spinners: confirmed screens loaded correctly in recon, but re-check "What-if" preview panels ("Choose a returned driver; no driver code has been guessed" — confirm this isn't a stuck state) and any screen with a Refresh button under actual data-refresh conditions.
- Data persists after reload: for every edit made during A1-A17 testing, hard-reload the page and confirm the edit is still there (not just held in client state).
- Every submit/save action shows a loading state during its request (per this project's established convention, `CLAUDE.md`).
- Tabs (Method tabs on Revenue, category filters on Assumptions, cycle-stage stepper) switch content in place — this codebase has a documented recurring defect class of tabs navigating away; check explicitly per screen.

---

## Execution order for Stage 3

1. B3 security test first (cheap, high-value, and a finding here doesn't block anything else from being tested since it's about who can act, not what exists).
2. A1 → A16 in the order listed (data screens before workflow screens, since B4's UAT journey depends on understanding A5/A14/A12 individually first).
3. A17 existence check.
4. B1 Performance integration (depends on having a locked version from the A2/A5/A14 testing already done).
5. B4 UAT full journey (synthesises everything above).
6. B2 responsiveness pass across all confirmed-real screens.
7. B5 QAT sweep.

Findings logged in `design-refs/fpa-srds/TEST_FINDINGS.md` as testing proceeds, using the ID/Severity format from the brief.
