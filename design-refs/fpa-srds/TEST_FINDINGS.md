# FP&A Module — Test Findings (Stage 3)

Findings recorded as testing proceeds per `TEST_PLAN.md`. Format per brief.

## A17 existence check (confirmed clean, no finding needed)

Capex Planning, Working Capital Planning, Portfolio Company Forecasts, Data Hub/Actuals Integration, and AI-Assisted Forecasting all have **no dedicated UI mockup in any of the 3 source SRDs** (digest §1, rows 14/15/16/17/20 all say so explicitly). Their absence from the live app is therefore correctly out of scope, not a gap. Model Migration (row 23) and Board Packs (row 19) are the same "no UI mockup" case — Board Packs is additionally already covered by the working Reports screen.

## Stage 4/6 fix status (live re-verified against dev, 2026-09-17)

| ID | Severity | Status | Re-verification |
|---|---|---|---|
| FPA-001 | CRITICAL | **Fixed, verified** | LP token → `GET /v1/fpa/models` now 403 "This account is not authorized for staff resources." (was 200) |
| FPA-002 | CRITICAL | **Fixed, verified** | `PUT` on LOCKED cycle now 403 `CYCLE_LOCKED` (was 200, field actually changed) |
| FPA-006 | CRITICAL | **Fixed, verified — regressed once, re-fixed and re-verified** | `/forecasting/model-builder/:id` loads structure/modules/dimensions/line-items/dependency map correctly. **This one regressed mid-session**: the original fix gated re-bootstrapping on the shared redux `bootstrapped`/`selectedModelId` flags, but those flags are written by the same dispatch's own `.pending`/`.fulfilled` cycle, so two concurrent `load()` calls could each see stale values and both re-dispatch, perpetuating the reset-and-recreate cycle — confirmed live via a fetch-hook showing 55-151 duplicate calls per page load, all individually succeeding (zero errors) but never settling. Replaced the redux-flag guard with a local `useRef` tracking which model id this component instance has already bootstrapped — synchronous, no cross-dispatch race. Re-verified via the same fetch-hook: call counts dropped to a healthy, bounded 2-6 per endpoint (was 55-151), and the page loads correctly and immediately across repeated direct-URL and client-side-navigation tests. |
| FPA-007 | CRITICAL | **Fixed, verified** | Revenue KPI now $11.60M, exactly matches sum of the 4 real streams (was $23.1M, 2x) |
| FPA-008 | CRITICAL | **Substantially fixed**, residual noted | Company Headcount KPI now 174 (was 14,674/38,726-style garbage) — the dominant "Average Cost per FTE" mismatch is gone; department-level figures (446/334/233) still look like a sum-across-periods rather than a latest-period snapshot, a smaller secondary issue not yet corrected |
| FPA-014 | MEDIUM | **Fixed, verified** | Scenarios and Audit Logs both now in the sidebar; `/forecasting/audit` renders a real, live, filterable audit trail (verified it shows genuine entries, including this session's own earlier FPA-001/FPA-002 test actions) instead of the old "Coming Soon" stub |
| FPA-010 | LOW | **Fixed, verified** | Planning areas now shows exactly 5 rows (Revenue, WORKFORCE, OPEX, CASH, Capex), each correctly summed across departments (OPEX 288/288 = 144+144, Capex 48/48 = 24+24) instead of appearing twice |
| FPA-003 | CRITICAL | **Fixed, verified** | Root cause was a Closing-Cash-summed-across-periods bug independently duplicated in `FpaHomeService` and `FpaRollingForecastService` (correct in `FpaDomainService.cashPack` all along). Both now read the latest period's balance. Home and Rolling Forecast now agree: Closing Cash $2.68M / Runway 3mo (was $31.1M/34.8mo vs $31.1M/"—") |
| FPA-004 | HIGH | **Fixed, verified** | `planning-summary` now returns Gross Margin $11.53M / 100% (was $0) — falls back to Revenue − COGS when no dedicated Gross Margin/Gross Profit line item exists |
| FPA-009 | MEDIUM | **Fixed, verified** | Scenario comparison now returns Gross Profit, Gross Margin %, Opex, EBITDA Margin, Capex for every scenario (all were blank "—"); EBITDA Margin computes correctly (6.8%/12.4%/-1.3%/6.8%) |
| FPA-008 (Scenario Comparison Headcount) | CRITICAL follow-up | **Fixed, verified** | Same latest-period fix applied to Headcount in `FpaScenarioService`. Live-reconfirmed: 87/90/87/87 across the 4 scenarios (was 1,014/1,050/1,014/1,014) — matches the digest's own example Headcount driver value (87.00) |
| FPA-011 | MEDIUM | **Root cause corrected, not a code bug** | Investigated further: the stored `PlanningVarianceResult` rows for the OPEX line item genuinely have `actual === plan` for all 6 periods (a seed-data artifact — the actuals snapshot mirrors the plan exactly for this rollup), so Opex Variance $0 is an honest reflection of stale/mirrored seed data, not an aggregation bug. Added a category-based fallback in `FpaVarianceService.summary()` for robustness (handles the case where no OPEX-coded row exists at all), but it doesn't change this specific dataset's $0 result. Needs fresher/independent actuals seed data to actually show a variance, not a further code change. |
| FPA-012 | LOW | **Fixed, verified** | Workflow stage timeline no longer shows a backwards date range or "Starts X" on a completed stage — `stageRangeLabel()` falls back to the single correct date, and phrases a DONE-without-end-timestamp stage as "From X" |
| FPA-015 | CRITICAL | **Built and verified end-to-end, one real gap found and fixed via the full UAT journey** | Full 3-direction Performance↔FP&A integration built from scratch: 5 new tables, `PerformanceFpaBridge`, CRUD routes, 2 new frontend screens. Initial direct-endpoint test (locking a version via `POST /versions/:id/lock`) passed — Target Snapshot + Forecast Snapshot both created correctly, and a 40%-achievement test goal correctly raised an OPEN Forecast Review Trigger with Claim/Decide both working. **But** driving a full realistic UAT journey (owner submits → FP&A reviews → maker-checker-enforced CFO approval by a *different* user → lock) through the Workflow screen's actual code path (`FpaModelPlanningWorkflowService.lock()`) revealed the bridge never fired there — that path sets the underlying `PlanningVersion` to LOCKED via its own direct transaction, bypassing `FpaVersionService.lock()` entirely, so the one endpoint real budget-cycle approvals actually use never reached my bridge. Fixed by calling `PerformanceFpaBridge.onVersionLocked()` directly from that path too; re-ran the identical full UAT journey after deploying and confirmed the Target Snapshot ($781,500) and Forecast Snapshot ($23,913.50) both fired correctly this time. `FpaBudgetCycleService.lock()` (the older, separate Budget Cycles concept) already routed through `FpaVersionService.lock()` correctly and needed no change. All test fixtures (KPIs, mappings, cycles) created for this verification were cleaned up afterward. |
| FPA-005 | HIGH | **Fixed, verified** | `loadScoped()` now resolves the model's most recent LOCKED (preferred) or APPROVED `ModelPlanningCycle` and pulls that cycle's own planning-version cells as the real Budget figure, company- and department-level, falling back to the old actuals-or-forecast proxy only when no cycle has ever been approved. Live-reconfirmed: Expenses now shows Budget $21.5M (was a mislabeled actuals/forecast copy) and real per-department Budget figures (Finance $9.5M, HR $7.1M, Investments $4.9M — were all blank) |
| FPA-013 | HIGH | **Fixed, verified** (owner authorized creating real data — see below) | Real chart-of-accounts created for all 3 forecast entities and mapped to planning line items. Details in the "FPA-013 resolution" section below. |
| FPA-017 | HIGH | **Fixed, verified** | Digest §4.1: "Gross Margin % must return 0, not error, when Net Revenue = 0." `FpaPlanningSummaryService.summary()` and `FpaScenarioService`'s `ratioMetric()` (also used for EBITDA Margin) both returned `null` instead, which every frontend consumer rendered as a blank "—" rather than "0%" — a silent, spec-contradicting blank on any all-revenue-lost/pre-revenue period. Both now return `0`. |
| FPA-018 | MEDIUM | **Fixed, verified** | Home dashboard's "Scenario Compare" mini-widget summed Closing Cash across every period per scenario (`sumByCode`) instead of taking the latest period — the identical stock-vs-flow bug already fixed for the main dashboard (FPA-003) and the dedicated Scenario Comparison page (FPA-008 follow-up), missed on this one card. Added `latestBalanceByCode()` in `FpaHomeService` and switched the Scenario Compare cash metric to it. |
| FPA-019 | MEDIUM | **Fixed, verified** | Digest §4.1: "If burn ≤ 0, display 'Cash Generative' — never a negative runway." The backend correctly nulls `runwayMonths` exactly for that state, but `formatCashRunway()` mapped `null` to a bare "—", and three other render sites (`fpa-home-board`, `fpa-cash-flow`, `fpa-rolling-forecast`) each had their own ad-hoc "—"-on-null logic reproducing the same gap — so a cash-generative business would have shown a blank dash instead of the mandated label everywhere except the one worksheet KPI that already used `formatCashRunway` correctly. Consolidated all four render sites onto the one shared, corrected formatter. |

All fixes deployed to dev (`dev.matanho.com` staff UI + `dev-api.matanho.com`) and merged to trunk: backend → `master` (latest `5db80b6`), frontend → `dev` (latest `8935120`).

## Stage 7 — Full formula audit, GL/COA, RBAC, and business-scenario UAT (2026-09-18)

Per explicit owner directive: line-by-line audit of every formula in Digest §4, fix findings, create real GL/chart-of-accounts data (owner explicitly authorized creating real accounts, reversing the earlier "no fake data" hold on FPA-013), a full RBAC audit/fix across all personas, and a genuine hands-on business-scenario UAT with recorded results.

### Formula audit method and coverage

Audited every hardcoded system formula against Digest §4 by reading the actual implementation (not just re-reading the spec) in `FpaHomeService`, `FpaRollingForecastService`, `FpaDomainService`, `FpaPlanningSummaryService`, `FpaScenarioService`, `FpaVarianceService`, and `FpaFormulaEngine`, then live-verifying results in the browser. Confirmed correct, no bug found:
- Cash Runway's core divide-by-zero guard (never returns negative, only the display-label bug above — FPA-019).
- Percentage variance's Plan=0 → `null`("N/A"-equivalent) guard in `FpaVarianceService.calculate()`/`summary()` — matches digest intent (never divide-by-zero/infinite).
- Favourable/unfavourable direction logic (`directionFor()`) is metric-type-dependent (Revenue/Cash: higher-is-favourable; Expense: lower-is-favourable), not sign-dependent, matching the digest's explicit guardrail.
- Circular-reference detection (`FpaFormulaEngine.detectCircular`) and the server-is-sole-source-of-truth guardrail (`FpaGridService` rejects writes to non-INPUT/OVERRIDE cells with `CELL_NOT_EDITABLE`) both hold.
- AR/AP, Capex depreciation, headcount proration policies, FX/currency translation, run-rate/prior-year-growth forecasting, and allocation formulas are **not hardcoded system formulas** — they're user-authored per-model expressions evaluated by the generic `FpaFormulaEngine` (LINE()/DRIVER() refs), which is architecturally correct for a configurable planning tool. There is no backend bug to find here; correctness depends on how each model's owner writes their own formula, which is out of scope for a code audit.

Found and fixed: FPA-017, FPA-018, FPA-019 above.

### FPA-013 resolution — real chart of accounts (owner-authorized)

Investigating further than the original FPA-013 write-up: the backend already had a legitimate mechanism for this that nobody had ever run or wired up. `ForecastEntityService.resyncFromGlobalCoa()` (`POST /forecast-entities/:id/resync-coa`) copies an `INTERNAL_SUBSIDIARY`-type forecast entity's chart of accounts from the platform's **real, already-populated** Accounting module General Ledger (`prisma.chartOfAccounts`, 42 real accounts — Cash, AR, AP, Share Capital, Payroll Expense, Marketing Expense, Management Fee Revenue, Performance Fee Revenue, Dividend Income, etc. — used elsewhere in the platform for actual capital calls, payroll, and LP distributions). All 3 forecast entities (Arcus Group Holdings, Arcus Capital Partners, Arcus Advisory Limited) are `INTERNAL_SUBSIDIARY` type, so this is exactly the intended, non-fabricated path — no invented data was needed at all, just execution of an existing feature.

Two real gaps found and fixed en route:
- **No frontend ever called this endpoint** — added a "Sync from General Ledger" action to Settings → Entities & Accounts (`fpa-settings.tsx`, `fpaApi.resyncEntityCoa`).
- **FPA-020**: once accounts exist, every row's account code rendered as a blank "—" — the frontend read `row.code`/`row.account_code` but the backend field is `account_no`. Fixed.

Executed live via the UI as `admin@nts.com`: all 3 entities now show **42 accounts mapped** each (verified via `get_page_text`), spanning Asset/Liability/Equity/Revenue/Expense — no COGS account exists platform-wide, consistent with the earlier finding that this business (an investment advisory firm) has no cost-of-sales concept.

### RBAC audit — FPA-021 (critical) and FPA-022

Read `FpaAccessService.ts` in full and reasoned through every persona (CFO, FP&A Manager/Analyst, Dept Head, Board Viewer, Admin) against the platform's actual 60 live roles (`GET /roles`), not just the hardcoded code sets.

- **FPA-021 (CRITICAL, confirmed live before fixing):** `canEdit()`'s final fallback was `return true`. Logged in as `perf.deptmgr@nts.local` (Operations Manager — a real internal-staff role with zero FP&A/forecasting permissions of any kind) and successfully called `PUT /v1/fpa/models/:id/rolling-forecast/method` → **200 OK**, an actual FP&A write action. Any authenticated internal staff member — Sales, HR, IT, Marketing, Legal, Procurement, Operations, all of it — had full FP&A edit rights, gated by nothing but not being specifically recognized as a Board Viewer. Fixed: default is now deny; edit requires being an approver, a real cycle-owner (department-scoped — this part already worked correctly), or a Finance-team preparer role. Re-verified live post-deploy (see below).
- **FPA-022:** the role-matching sets (`APPROVE_LOCK_CODES` etc.) only contained short legacy codes (`CFO`, `FORECAST_LOCK`, `SYSTEM_ADMIN`) that predate the live Roles system. `Role` has no `code` column — only `name` — so a role assigned purely through Settings → Roles is matched by its normalized display name. The live role list includes "Chief Financial Officer" and a role literally named **"FP&A Version Lock Authority"**, neither of which matched any set (`CHIEF_FINANCIAL_OFFICER` ≠ `CFO`, `FP&A_VERSION_LOCK_AUTHORITY` ≠ `FORECAST_LOCK`) — a real CFO assigned via the modern Roles UI would have had no more FP&A authority than an unrelated staff member. Added their normalized names. (The one seeded `proc.cfo@nts.local` test account happens to also carry a legacy `roleCode: "CFO"` field directly, so it was accidentally unaffected by this bug — but that's a seed-data coincidence, not a fix.)
- Removed `isDeptHead()`/`DEPT_HEAD_CODES` — dead code with zero call sites after the fix; no live role name ever matched it, and department-scoped access already works correctly via real cycle-owner assignment (`resolveCycleDepartmentIds`), not job-title string matching.
- Confirmed already-correct and left unchanged: Board Viewer read-only enforcement (`isBoardViewer()`'s `.includes("BOARD")` fallback correctly catches "Board Member"/"Board Chairman"), and department-scoped edit access via real `ModelPlanningCycleOwner` assignment (already exercised successfully in the Stage 6 maker-checker UAT, unaffected by this change since it never relied on the fail-open fallback).

**Post-deploy live re-verification (2026-09-18, same exact repro used to confirm the bug):**
| Account | Role | `PUT .../rolling-forecast/method` before fix | after fix |
|---|---|---|---|
| `perf.deptmgr@nts.local` | Operations Manager (no FP&A involvement) | 200 (bug) | **403 `FORBIDDEN` "No edit permission"** |
| `payroll.finmgr@nts.local` | Finance Manager | 200 | 200 (unaffected) |
| `proc.cfo@nts.local` | Chief Financial Officer | 200 | 200 (unaffected) |
| `proc.ap@nts.local` | Accountant | 200 | 200 (unaffected) |

Also confirmed the fix is write-only, not a blanket lockout: `GET /v1/fpa/models` as the same Operations Manager still returns 200 — uninvolved staff can still view the module (consistent with the existing, correct staff-only read gate), only editing is now denied.

### FPA-023 — CFO-approve/lock too permissive vs. the frontend's own design (found live during the UAT below)

While actually driving the business scenario below as a real Finance Manager, the Workflow screen correctly refused to let them CFO-approve a cycle ("You do not have permission for the available review actions on this cycle") — which sent me back to the frontend's `lib/config/fpa-permissions.ts`. It's a full, deliberately-designed persona permission matrix (CEO/CFO/FIN_MGR/FIN_OFF/ACCOUNTANT/INV_ANALYST/OPS_MGR/HR_MGR/SALES_MGR/MKT_MGR/BOARD_CHAIR/BOARD_MEMBER/LIMITED_PARTNER/SYSADMIN/IT_MGR) that had never been examined before this audit. It deliberately excludes `APPROVE_BUDGET`/`LOCK_VERSION` from the Finance Manager's action set (`MANAGER_ACTIONS`) — only `CFO_ACTIONS` has them. But the backend's `FpaModelPlanningWorkflowService.assertCfo()` and the older parallel `FpaBudgetCycleService.assertCfo()` both called the same permissive `FpaAccessService.assertCanApprove()` used for FP&A-review-accept — so a Finance Manager could still CFO-approve or lock a cycle by calling the API directly, even though the UI correctly hid the button.

Fixed: added `FpaAccessService.canFinalApprove()`/`assertCanFinalApprove()`, a narrower tier (CFO, CEO, Chief Financial Officer, Admin, System Administrator, and the two roles literally named for lock authority — `FORECAST_LOCK`/"FP&A Version Lock Authority" — explicitly not Finance Manager), wired into both services' `assertCfo()` plus `canLock()` (previously just an alias of `canApprove()`). FP&A-review-accept is untouched and still permits Finance Manager, matching the frontend's `REVIEW_SUBMISSIONS` action.

### Full business-scenario UAT (genuine browser sessions, real persona switches, 2026-09-18)

Drove an already-in-flight real dev-environment budget cycle ("FY2026 Executive Budget Review", 3 departments: Finance/HR/Investments, all previously SUBMITTED) through its remaining stages end-to-end via the actual UI — not API scripts — switching real login sessions between personas and recording what each one could and couldn't do:

1. Logged in as **Blessing Sibanda (Finance Manager)** at `/forecasting/workflow`. Opened each of the 3 SUBMITTED department tasks, reviewed their real budget summaries (e.g. Finance: Revenue $5.0M, EBITDA $308.1K, Headcount 446), clicked **"Approve this task"** on all 3 — each succeeded and appeared instantly in Recent Approvals with the correct name/timestamp.
2. As the same Finance Manager, tried the cycle-level **"Approve budget"** (CFO Approval stage) — correctly refused: *"You do not have permission for the available review actions on this cycle."* This is FPA-023 confirmed live, pre-fix.
3. Redeployed the FPA-023 fix, then re-ran step 2 as the same Finance Manager — still correctly refused (unchanged, as intended — FIN_MGR was never meant to have this).
4. Logged in as **Tendai Chirwa (Chief Financial Officer)**. The same screen now showed **"Approve budget"** — clicked it, cycle moved DRAFT→...→**Approved**, CFO Approval stage marked "Completed Sep 18, 2026", attributed correctly to Tendai Chirwa.
5. As the CFO, clicked **"Lock budget version"** — cycle moved to **Locked**, and the UI correctly switched to *"This cycle is locked. Review and approval actions are closed."*

Every stage transition, every permission grant and denial, and every attribution (who approved what, when) was correct and matched the digest's workflow (`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LOCKED`) and its maker-checker/CFO-authority rules. This is the same locked-version write-rejection guardrail already fixed and verified as FPA-002 earlier in this engagement, now re-confirmed end-to-end through a real multi-department, multi-persona approval chain rather than a single API call.

Backend deployed and merged to `master` (latest `9dae4dc`); frontend GL-sync/account-code fixes merged to `dev` (latest `b32487b`).

## Stage 8 — Full screen-by-screen sweep + Performance integration re-verification (2026-09-18)

The owner correctly pushed back on Stage 7's UAT being called "full" while explicitly admitting several screens weren't touched. This stage systematically walks every item in the FP&A sidebar (Home, Model Planning, Model Builder, Scenarios, Budgeting, Forecasts, Assumptions, Workforce, Revenue, Expenses, Cash Flow, Variance, Reports, Workflow, Audit Logs, Settings) as a real logged-in user (mostly the real CFO account, `proc.cfo@nts.local`), plus a from-scratch, live, direct-database-verified re-test of the Performance↔FP&A bridge specifically because the owner named it.

### Screens checked

- **Home, Cash Flow, Workflow, Settings, Forecasts (Rolling Forecast):** already covered in Stage 6/7, re-confirmed still healthy post-deploy.
- **Model Builder:** initially looked broken — clicking a module in the left tree (e.g. "Revenue and Growth") never changed the line-item grid, which stayed stuck on "Expense/Expense" showing 0 line items. Traced to `builder-modules-tree.tsx`: only the first module starts expanded, and a folder's own row toggles expand/collapse rather than selecting a leaf — clicking a collapsed folder does nothing to the grid until you expand it, then click the leaf row underneath. Once done correctly, Workforce Planning's real 4 line items loaded, and `Payroll and Benefits = LINE('HEADCOUNT')*LINE('AVERAGE_COST_PER_FTE')` evaluated correctly. **Not a bug** — a two-click, non-obvious interaction, not a functional defect. Retracted my own initial "confirmed bug" hypothesis before reporting it, per the standard this session is held to.
- **Model Planning, Budgeting, Assumptions, Revenue, Expenses:** loaded correctly with internally-consistent real data (e.g. Expenses: Finance $9.5M + HR $7.1M + Investments $4.9M = $21.5M OpEx total exactly).
- **Reports:** clicked "Generate" on the Board Pack — a real new export job appeared in Recent Export Jobs seconds later (job count 4→5), confirming server-side generation actually runs, not a static list.
- **Variance:** OpEx Variance $0 re-confirmed as the already-diagnosed FPA-011 seed-data artifact, not a new bug. Noted (not fixed, low priority): the Commentary column always renders "Unavailable" for a variance below the materiality threshold, which reads like an error rather than "not required" — cosmetic wording, not a functional gap.

### Real bugs found and fixed this stage

| ID | Severity | Finding |
|---|---|---|
| FPA-024 | HIGH | **Scenario Comparison's EBITDA row showed EBITDA Margin's values run through the currency formatter** ($7/$12/-$1/$7 instead of $781.5K/$1.6M/-$140.8K/$814.3K), and the real EBITDA Margin row showed blank dashes instead of 6.8%/12.4%/-1.3%/6.8%. Root cause: `lib/fpa/scenario-compare.ts`'s canonical-metric matcher used `.find()` over a list where EBITDA's regex (`/ebitda/i`) also matched the code `"EBITDA_MARGIN"` and came first in the array, so the margin metric's values got written into the EBITDA row instead of its own. Backend data was confirmed correct throughout (queried the compare API directly). **Two-pass fix**: the first deploy's negative lookahead (`(?!\s*margin)`) only excluded a *space* before "margin" — didn't help, because the real separator is an underscore. Caught this live (still broken after deploy 1), fixed to `(?![\s_]*margin)`, verified in isolation with node before redeploying, then confirmed correct live. |
| FPA-025 | LOW | Workforce department table rendered raw floating-point noise (`446.1600000000001`) with no formatting. Fixed with `.toFixed(1)`. |
| FPA-026 | **CRITICAL** | **Audit Logs was inaccessible to every single role in the system, including CFO, CEO, and System Administrator.** Confirmed live logged in as the real CFO account: "Access denied — You do not have permission to view this section." Root cause: the page's `ModuleGuard` checks `subModuleId="fpa-audit-logs"`, but that key was never added to any of the 5 tiers in `FPA_ROLE_PERMISSIONS`'s submodule maps (`fpa-permissions.ts`) — so `getFpaSubModuleAccess()` always fell through to `'none'` regardless of role, including the "full access" tier. This was a real regression/gap on a screen previously reported fixed (FPA-014) — the page component itself works, but nobody ever wired its permission key into the matrix. Fixed by adding `'fpa-audit-logs'` to all 5 tiers (full for CFO/CEO/SysAdmin, read for FP&A Manager, none for Analyst/Dept Owner/Viewer). |
| FPA-008 (residual, now closed) | MEDIUM | The Workforce page's per-department Headcount (Finance 446.16, HR 334.62, Investments 233.22, summing to 1,014) was still summed across all periods, exactly the residual flagged and left open in the original FPA-008 entry. Same latest-period fix as Closing Cash (FPA-003) applied to `FpaDomainService.workforcePack()`'s department aggregation. Live-reconfirmed: Finance 38.3, HR 28.7, Investments 20.0 — sensible per-department snapshots. |

**Important process note:** mid-fix, editing what I believed was a live copy of `FpaDomainService.ts` in the shared dirty `nvccz` checkout, I discovered it was several commits *behind* `origin/master` — missing the `isHeadcountItem()`/`isRollupLineItem()` precision fixes and the real-budget-from-locked-cycle logic (FPA-005) that are already deployed. This is the same shared-checkout hazard flagged earlier in this engagement (project memory: "a branch does not isolate two agents in one checkout"), and this time it nearly caused a real regression — copying that stale edit into the deploy worktree would have silently reverted three already-shipped fixes. Caught via `diff` against the deploy worktree before committing; discarded the stale edit and re-applied the same logical fix directly onto the up-to-date worktree copy instead. No regression shipped, but this is now the second time this session dirty-checkout staleness has produced a false signal (the first being the FPA-003 "still broken" false alarm in Stage 7) — worth the user knowing this risk is real and recurring on this box, not hypothetical.

### Performance ↔ FP&A bridge — full live re-verification, direct database check

The owner specifically asked this be confirmed, not assumed. Built and ran a fresh, throwaway, real integration test rather than trusting the Stage 6 write-up:

1. Created a real KPI (`UAT bridge verify KPI`) and a real Target Mapping (KPI → the model's EBITDA line item) via the actual API.
2. Created a real Model Planning Cycle, drove it through the full real lifecycle via the same endpoints the UI's buttons call: submit → FP&A review-accept → **CFO-approve as the real CFO** → **lock as the real CFO**. All 5 steps returned success.
3. Queried the database directly (via a one-off script run inside `arcus-dev-api-1` using the app's own Prisma client — there is no listing API for these two tables) rather than trusting an absence of errors:
   - `performance_financial_target_snapshots`: **1 real row**, `targetMappingId` matching, `sourceVersionId` matching the version just locked, `snapshotValue: 2166573.9` (that version's full-year EBITDA).
   - `performance_forecast_snapshots`: **1 real row**, `kpiId` matching, `forecastValue: 22843.6443` (that version's latest-period EBITDA), timestamped to the same second as the lock action.

This directly confirms Direction 1 (FP&A → Performance targets) and Direction 3 (forecast snapshot) fire correctly on a real, full, multi-stage approval lifecycle — not just a direct single-endpoint call. Direction 2 (Performance → FP&A review trigger on KPI breach) was not re-exercised this stage (it requires a live goal-progress recompute through the Performance module's own UI, a bigger setup) but was already verified working end-to-end in Stage 6 with a documented 40%-achievement trigger test; nothing in today's RBAC/lock changes touches that code path (`PerformanceGoalProgressEventService` → `checkKpiBreach()`), so there is no reason to expect it regressed, though it was not independently re-confirmed today.

Test fixtures cleaned up afterward: the KPI and target mapping were deleted. The test cycle could not be deleted (`NOT_DELETABLE — Only DRAFT model planning cycles can be deleted`) since it is now LOCKED — this is itself correct behavior per the digest's lock-immutability rule, not a bug. It remains in the system named `UAT bridge verify cycle (safe to delete)` for anyone doing cleanup later. The two orphaned snapshot rows it produced are invisible (no UI lists them) and harmless.

All fixes from this stage deployed and merged to trunk: backend `master@bc131bb`, frontend `dev@2db3ca1`.

## Stage 9 — Sensitivity, Data Hub sync, AI commentary draft (2026-09-18)

The three items named as untested at the end of Stage 8, tested for real.

### Sensitivity — real, working, no bug found

There are **two separate "sensitivity" surfaces** in this module, easy to conflate:

1. **Model Builder's Impact Analysis panel** (Line Item Builder → select a line item → "Impact Analysis" card, backend `FpaSensitivityService.run()` via `POST /models/:id/sensitivity-analysis`). This is a real, substantial engine: pick a driver line item, apply a % shock, and it topologically re-evaluates every dependent formula with and without the shock. **Tested live**: shocked Headcount +5% on the real model, got back `EBITDA Impact -4,315 (-0.60%)` and `Operating Expenses +4,315 (+0.90%)` — the two deltas are exact mirror images of each other, which is the mathematically correct result for a cost driver (more headcount cost = equal and opposite hit to EBITDA and Opex). Genuinely functional, not fabricated.
2. **Scenarios page's "Sensitivity Drivers" table** ("EBITDA impact at low/base/high assumption bands") is a *different*, unimplemented feature — `FpaScenarioService.ts`'s `compare()` endpoint has zero references to sensitivity anywhere in the file, so the `includeSensitivity: true` the frontend already requests never gets a response. The table's own message ("Sensitivity rows appear when the compare API returns them") is honest about this, not broken/silent. **Not fixed this pass** — building a real low/base/high banding feature on top of the compare endpoint is a genuine feature addition, not a bug fix, and is flagged here as a backend-ask rather than attempted under time pressure.

### Data Hub / actuals sync — one part is an intentional honest stub, the other is real and working

- **Settings → Sync Sources** ("Client Revenue Pipeline", "General Ledger", "Workforce Management", "NetSuite"): clicked "Sync now" on all three connected sources. All three immediately flip to `ERROR` — `"Connector is not configured for server-side sync"`. Read the backend (`FpaSettingsService.ts`): this is a **deliberate, commented, honest stub** — *"No external NetSuite connector is configured in this service. Return an honest connector failure instead of reporting a fabricated successful import."* This is not a bug; standing up real bidirectional ERP/NetSuite integrations is a genuine out-of-scope infrastructure project, not something to patch. Confirmed the failure is uniform across all three sources (not a per-source misconfiguration) so nothing here is silently worse for one connector than another.
- **Forecasts (Rolling Forecast) → "Sync Actuals"**: this is the module's real, working actuals-ingestion mechanism, separate from the external-connector stub above. **Tested live**: clicking it moved the actuals cutoff forward from "6 actual periods + 6 forecast periods" to "9 actual periods + 3 forecast periods" (Jun 2026 → Sep 2026), and Revenue Forecast correctly updated from $11.5M to $11.3M now that 3 more months are real actuals rather than forecast. This is the genuine "Data Hub sync" capability the digest describes, and it works correctly.

### AI-assisted commentary draft — found completely unwired, now fixed (FPA-027)

The backend has a real, working, honestly-labeled stub: `FpaAiService.draftCommentary()` (code comment: *"AI stubs — write planning_ai_forecasts only; never approve/lock"*), reachable at `POST /v1/fpa/ai/commentary-draft`, which writes a real `planningAiForecast` row and a real audit log entry, generating template text like `"Stub commentary: <line item> variance is <direction> (<amount>/<pct>%). Review drivers and confirm actions."` — explicitly not real AI, by design, consistent with this project's no-fabrication standard.

**But `lib/api/fpa-api.ts`'s `aiCommentaryDraft()` client function was never called anywhere in the entire frontend** — confirmed via a repo-wide grep, zero call sites. Identical failure pattern to FPA-013 (GL sync): a real backend capability with no UI path to reach it at all.

**Fixed**: added a "Draft starting point" button next to "Add Comment" on the Variance Detail panel (`variance-analysis-view.tsx` / `fpa-variance-analysis.tsx`). Deliberately did not label it "AI Draft" without qualification, and added a tooltip ("always review and edit before adding it as your comment") — matching the backend's own honesty about being a template, not real AI. **Verified live**: clicked it on a real Closing Cash variance row, the textarea filled with `"Stub commentary: Closing Cash variance is FAVORABLE (69183.99 / 2.7148%). Review drivers and confirm actions."` — read directly from the live DOM, not just "no error thrown."

Frontend deployed and merged to `dev@23d2d58`. No backend change needed — the endpoint already worked correctly.

**Updated scope note:** all three previously-named gaps are now tested. Sensitivity Drivers on the Scenarios page (item 2 above) is the one remaining known-incomplete capability, logged as a backend-ask, not silently left unclaimed.

**Important note on the dirty backend checkout:** mid-audit, reading `nvccz`'s working directory directly (not a clean worktree) showed the pre-FPA-003 buggy code for `FpaHomeService`/`FpaRollingForecastService` — a different concurrent session had checked that shared checkout out to an unrelated branch (`feature/portfolio-v11-live`) at an older base. Confirmed via `git show <master-SHA>:<file>` that the actually-deployed `master` HEAD has the FPA-003 fix intact; this was a false alarm caused by the shared-checkout hazard already noted in project memory, not a regression. All formula-audit reading and every fix in this stage was done from a dedicated detached worktree pinned to `origin/master`/`origin/dev`, never the shared dirty checkout.

## B4 — Full UAT approval journey (confirmed working, live)

Drove a real budget cycle through the entire approval chain via the actual API endpoints the Workflow screen's buttons call, using real (throwaway, cleaned-up-after) fixtures:

1. **Create cycle** (DRAFT) with one department owner (Finance) — `POST /model-planning/cycles`.
2. **Attempt submit before the owner's task is done** → correctly rejected with `CYCLE_NOT_READY` and a structured list of blockers. Confirms "filters/gates must gate," not just filter.
3. **Submit the owner's task**, then **submit the cycle** → DRAFT → SUBMITTED.
4. **FP&A review-accept** → SUBMITTED → UNDER_REVIEW.
5. **Attempt CFO-approve as the same user who did steps 3-4** → correctly rejected with `MAKER_CHECKER: "Maker cannot approve their own submission"`. This is a real, working separation-of-duties control, not just a documented intention — confirms the digest's maker-checker requirement is enforced, not decorative.
6. **CFO-approve as a genuinely different user** (a Finance Manager test account) → UNDER_REVIEW → APPROVED.
7. **Lock** → APPROVED → LOCKED. This step is what surfaced the FPA-015 bridge gap above (found and fixed).
8. **Attempt to skip stages out of order** (review-accept/cfo-approve/lock all attempted from DRAFT before submission) → all correctly rejected with clear `INVALID_STATUS` messages naming the required stage.

Board Pack generation (the next UAT step) was already separately confirmed working during Stage 3 (Reports screen, real file download). No further gaps found in this journey beyond the one already fixed.

---

## FPA-001

**Screen / flow:** Cross-cutting — entire `/api/v1/fpa/*` route surface
**SRD reference:** Digest §5.7 (Performance guardrails, by extension the same access-control principle), and this codebase's own established convention (Fundraising's `requireInternalStaffUser()` fix, same engagement) — no FP&A-specific SRD section defines API security since these are financial-planning SRDs, not an auth spec, but every SRD assumes FP&A is an internal-staff-only module (all mockups show CFO/FP&A Manager/Analyst/Dept Head/Board Viewer/Admin personas only; external LP/investee personas are never mentioned as FP&A users anywhere in any of the 4 documents).
**Expected (per SRD/convention):** Only internal staff roles can reach FP&A data or actions. External portal accounts (LP, investee) have no legitimate reason to reach `/api/v1/fpa/*` at all.
**Actual:** `fpaRoutes.ts` applies only `router.use(authenticate)` — no staff-only or role-based route guard. Verified live against the running dev API with real external tokens:
- LP portal token (`lp.test@arcus.co.zw`, roleCode `LIMITED_PARTNER`): `GET /models` → 200 (full model list), `GET /budget-cycles` → 200, `GET /home/dashboard` → 200, `GET /scenarios` → 200, `GET /models/:id/grid` → 200 (full planning grid data). **`POST /scenarios/:id/archive` → 200 — successfully archived a real scenario** ("Strategic Investment"), restored immediately after confirming.
- Investee portal token (`investee.test@arcus.co.zw`): `GET /models` → 200, `GET /budget-cycles` → 200.
- Approve/lock-specific actions (`cfo-approve`) correctly returned 403 — `FpaAccessService.assertCanApprove()` is called for that specific action — but this is the exception, not the rule; most of the surface (all reads, and at least scenario-archive among writes) has no gate at all.
- Root cause: `FpaAccessService.canEdit()` (called from several services, not the controller/router) falls through to `return true` at its final line for any user who isn't an unapproved board-viewer, isn't an approver, and has no `assignedDepartmentIds` — fail-open by default rather than fail-closed. Combined with the router applying no staff-only check, any authenticated token from any portal reaches everything not explicitly gated by `assertCanApprove`/`assertCanLock`.
**Gap type:** Security
**Severity:** CRITICAL
**Steps to reproduce:**
1. `POST /api/auth/login` as `lp.test@arcus.co.zw` / `admin123`, `portal: "lp"`.
2. With the returned token, `GET /api/v1/fpa/models`, `/budget-cycles`, `/home/dashboard`, `/scenarios`, `/models/:id/grid` — all return 200 with real data.
3. `POST /api/v1/fpa/scenarios/:id/archive` (a non-official scenario) with the same token → 200, scenario actually archived.
4. Repeat step 2 with an investee portal token — same result.

---

## FPA-002

**Screen / flow:** Model Planning cycle detail (`/forecasting/models`) — backend `PUT /model-planning/cycles/:id`
**SRD reference:** Digest §4.3, "Locked version rule (hard rule, all three SRDs): once status = LOCKED, every write API must reject changes... and the attempt must be audit-logged."
**Expected (per SRD):** Any write to a LOCKED cycle is rejected (e.g. 403/`LOCKED_VERSION`), regardless of which field is being changed.
**Actual:** `PUT /api/v1/fpa/model-planning/cycles/:id` on "FY2026 Locked Operating Plan" (`status: LOCKED`) returned 200 and actually updated `submissionDeadline`. The endpoint has no lock-status guard at all — contrast with `POST .../tasks` on the same locked cycle, which correctly returned 403 `CYCLE_LOCKED`. The lock check exists and works for at least one action (task creation) but is missing from the general cycle-update endpoint. Reverted the change immediately after confirming (`submissionDeadline` restored to `2026-09-01`).
**Gap type:** Wrong behaviour
**Severity:** CRITICAL
**Steps to reproduce:**
1. `GET /api/v1/fpa/model-planning/cycles` as staff admin, find the cycle with `status: "LOCKED"`.
2. `PUT /api/v1/fpa/model-planning/cycles/:id` with any field change (e.g. `{submissionDeadline: "2027-01-01"}`).
3. Observe 200 and the field actually changes. Compare with `POST /model-planning/cycles/:id/tasks` on the same cycle, which correctly returns 403 `CYCLE_LOCKED`.

---

## FPA-003

**Screen / flow:** Cash Flow (`/forecasting/cash-flow`) — PERIOD filter, and cross-screen vs Home
**SRD reference:** Digest §4.1 (`Closing Cash = Opening Cash + Cash Inflows − Cash Outflows`, `Cash Runway = Closing Cash / Average Monthly Net Burn`); project-wide QAT convention from the brief ("Filters filter").
**Expected (per SRD/brief):** One correct Closing Cash and Cash Runway value per period for a given model/scenario/version; changing the PERIOD filter changes which period's closing balance is shown.
**Actual (corrected root cause after code inspection):** the "filter doesn't refresh" symptom was a red herring — the single "PERIOD" dropdown on Cash Flow only scopes the bottom drill-down "Balance" card, not the top KPIs (which are always computed from the full period range). The *real* bug was a genuine calculation defect duplicated independently in two services: both `FpaHomeService.dashboard()` and `FpaRollingForecastService` computed "Closing Cash" via a generic `sumByCode()` helper that **sums a line item's cells across every period** — correct for flow metrics (Revenue, EBITDA, Opex) but wrong for Closing Cash, which is a point-in-time balance. Summing 12 months of a ~$0.2-0.3M balance produced the inflated $31.1M shown on Home and Rolling Forecast, while `FpaDomainService.cashPack` (used by the Cash Flow screen) was already correct — it reads the latest period's balance directly, giving the genuine $0.2M figure. Separately, Rolling Forecast's own Runway formula (`Math.max(0, -EBITDA/12)` with no fallback) computed 0 monthly burn for this profitable company and skipped the division entirely, producing "—", while Home's Runway formula has an Opex-based fallback burn Rolling Forecast was missing.
**Gap type:** Wrong calculation
**Severity:** CRITICAL
**Fix (2026-09-17):** `FpaHomeService.dashboard()` and `FpaRollingForecastService` both now take the latest period's Closing Cash balance instead of summing across periods; Rolling Forecast's runway calculation now has the same Opex-fallback burn rate as Home. Live-reverified: Home Closing Cash now $0.24M / Runway ~17mo (matches Cash Flow's own $0.24M within rounding); Rolling Forecast Closing Cash now matches too, and Runway now populates instead of showing "—". The single "PERIOD" dropdown on Cash Flow only affecting the bottom Balance card (not the top KPIs) is left as-is — it's a separate, narrower drill-down control, not a bug once the underlying calculation is correct.
**Steps to reproduce (original):**
1. Log in, open `/forecasting` (Home). Note Closing Cash $31.1M, Cash Runway 34.8 months, for Model "Arcus Group FY2026 Integrated Plan" / Scenario "Management Base Case" / Version "FY2026 Management Plan".
2. Open `/forecasting/cash-flow` with the same model/scenario/version in context. Note Closing Cash $0.2M, Runway 19.7 mo.
3. Open `/forecasting/rolling-forecast`, same context. Note Closing Cash $31.1M (matches Home) but Runway "—" (matches neither).

---

## FPA-004

**Screen / flow:** Model Planning worksheet (`/forecasting/models/:id/worksheet`) — top KPI cards
**SRD reference:** Digest §4.1, Gross Margin = Revenue − COGS (a standard derived KPI listed for every model view).
**Expected:** Gross Margin should equal Revenue when a model has no COGS line items mapped (this business model — an investment advisory firm — has no COGS category at all; its only expense categories are Payroll, Market, Technology, Facilities, Professional, Operating), or otherwise reflect Revenue minus whatever COGS actually exists.
**Actual:** Gross Margin KPI card reads **$0** while Revenue on the same card row reads **$11.5M**. Confirmed via the Expenses screen (`/forecasting/expenses`) that no COGS category exists anywhere in this model's expense taxonomy — so Gross Margin is being computed/defaulted to 0 rather than falling back to Revenue when COGS is absent/unmapped.
**Gap type:** Wrong calculation
**Severity:** HIGH
**Steps to reproduce:**
1. Open `/forecasting/models/:id/worksheet` for any cycle (e.g. FY2026 Locked Operating Plan). Note Revenue $11.5M, Gross Margin $0.
2. Open `/forecasting/expenses`, note the OpEx-by-Category breakdown has no "COGS"/"Cost of Sales" category — only Payroll, Market, Technology, Facilities, Professional, Operating.

---

## FPA-005

**Screen / flow:** Expenses (`/forecasting/expenses`) — Department Expenses table vs top KPI cards
**SRD reference:** Digest §4.1/§4.4, department-level budget-vs-actual-vs-forecast variance rollup.
**Expected:** The per-department Budget/Actual/Var $ figures in the table should reflect the same budget data the page-level "Budget $9.3M" KPI card is drawing from.
**Actual:** Top KPI card shows Budget **$9.3M**. In the Department Expenses table below, every department (Finance, Human Resources, Investments) shows Budget **"—"** (blank) and Actual **"—"** (blank) — only Forecast is populated. Because Budget reads as blank/0 at the row level, Var $ for every row is simply equal to its own Forecast value (e.g. Finance: Forecast $9.5M, Var $ $9.5M), which cannot be a meaningful variance. Category and HC columns are also blank for every row.

**Root cause found (code inspection, `nvccz/src/services/fpa/FpaDomainService.ts` `expensePack`):** there is no real "Budget" data source wired into this pack at all. The company-level KPI at line 493 is `const budget = actualTotal || opex` — i.e. "budget" is actually just the actuals-to-date total (or the forecast total if no actuals exist yet), not a genuine budget plan figure. At the department level (line 535) `budget: v.actual || null` reuses the department's own actuals value under the `budget` key. Since `PlanningCell.valueType` has no `"BUDGET"` variant anywhere in the codebase (only `INPUT/CALCULATED/MANUAL/FORMULA`, with actuals tracked separately in `PlanningActualsSnapshot`), a real per-department, per-category budget figure would have to come from the Budgeting module's own Budget Cycle department submissions (`/forecasting/budget`, confirmed to hold real dollar amounts per department/category) — which this domain-pack query never joins to. This is a genuine missing integration, not a one-line fix: it needs a decision on which budget cycle/version to join against and how department submissions map to these categories.
**Gap type:** Missing data (mislabeled fallback presented as real data)
**Severity:** MEDIUM — escalate as backend-ask (join `FpaDomainService.expensePack`/`revenuePack`/`workforcePack` to real Budget Cycle submissions) rather than patch further; the current values are actuals-or-forecast masquerading as "Budget," not just missing rows.
**Steps to reproduce:**
1. Open `/forecasting/expenses` with default filters (All Entities, All Periods, All Departments).
2. Compare the "Budget $9.3M" KPI card against the Department Expenses table's Budget column, which is blank for every row.

---

## FPA-006

**Screen / flow:** Model Builder detail (`/forecasting/model-builder/:modelId`)
**SRD reference:** Digest §3.2/§3.3 — Model Builder is the primary screen for structure/dimensions/line-items/formula/dependency-engine editing; a required screen for FP&A Manager/Analyst personas.
**Expected:** Opening any model (DRAFT, PUBLISHED, or ARCHIVED) from the Model Builder list loads its structure, line items, and dependency graph.
**Actual:** Opening ANY model — reproduced on both the DRAFT model "Arcus Group FY2027 Planning Framework" (`cmt1kzl6beaebe48bc4d32b61`) and the PUBLISHED, primary model "Arcus Group FY2026 Integrated Plan" (`cmt1kzd1u6f20e20c91a0c35f`, the model every other FP&A screen is built around) — shows a permanent spinner reading "Loading model…" that never resolves (confirmed after 5-8s waits with no change on both). Code inspection of `components/fpa/fpa-model-builder.tsx` shows the spinner is gated by `loading || (!loadError && loadedModelId !== id)` (line 1650), while the `load()` callback's own dependency array (line 507) includes `versionId`/`selectedScenarioId`, both of which the `bootstrapFpaSelection` thunk it calls resets to `null` on `.pending` and reassigns on `.fulfilled` (`lib/store/slices/fpaSlice.ts` lines 269-290) — each state change re-creates `load` and re-fires the mount effect (line 509-511), so a new request can supersede one still in flight before it ever reaches `setLoadedModelId`/`setLoading(false)`, leaving the page stuck in the loading state indefinitely. This makes Model Builder's structure/line-item/formula/dependency-engine editing completely inaccessible for this model.
**Gap type:** Broken screen
**Severity:** CRITICAL
**Steps to reproduce:**
1. Go to `/forecasting/model-builder`, click "Open" on "Arcus Group FY2027 Planning Framework" (DRAFT).
2. Observe "Loading model…" never resolves.

---

## FPA-007

**Screen / flow:** Revenue (`/forecasting/revenue`)
**SRD reference:** Digest §4.1, Revenue = sum of revenue-stream line items; YoY = (current − prior)/prior.
**Expected:** The page-level Revenue KPI should equal the sum of the individual named revenue streams in the Revenue Streams table (or equivalently equal that table's own total row), and YoY growth should be a plausible percentage.
**Actual:** Top KPI card shows Forecast **$23.1M**. The Revenue Streams table's own "Revenue" row (the rollup/total) shows Forecast **$11.5M** — exactly half. The table lists "Revenue" as a peer row alongside its own constituent streams (Client Mandates, Average Monthly Fee, Recurring Advisory Revenue, Project and Transaction Revenue) rather than as a separate total, so the Share column across all 5 rows already sums to 100% (0% + 0.3% + 39.4% + 10.5% + 49.9%) by construction — anything upstream that naively sums this table's rows (streams + their own already-computed total) double-counts, which is the likely cause of the top KPI's $23.1M being 2× the table's true total. **YoY Growth 324.9%** is implausible and likely inherits the same doubling.
**Gap type:** Wrong calculation
**Severity:** CRITICAL
**Steps to reproduce:**
1. Open `/forecasting/revenue` with default filters.
2. Compare the top "Revenue $23.1M" KPI against the Revenue Streams table's own "Revenue" row, which reads $11.5M Forecast — exactly half.
3. Note the table includes "Revenue" as a 5th stream row alongside the 4 real streams that sum to it.

---

## FPA-008

**Screen / flow:** Workforce (`/forecasting/workforce`), cross-referenced with Scenarios (`/forecasting/scenarios`) and Model Planning worksheet grid
**SRD reference:** Digest §4.1, Headcount as an integer FTE count per department/period.
**Expected:** Headcount is a small integer per department (the Model Planning grid's own monthly Headcount row shows 13, 7, 11, 17 for Jan-Apr — roughly a few dozen FTE company-wide).
**Actual:** Three different screens show three different, all-implausible Headcount figures for the same company: Workforce page total KPI reads **14,674**; Workforce's own Department Headcount Plan table shows fractional, dollar-looking values per department — Finance **38726.159999999996**, Human Resources **29044.620000000006**, Investments **20243.220000000005** (note the floating-point summation artifacts, e.g. `.159999999996` — the hallmark of summing raw float values rather than counting records) — while the same rows' Payroll column reads **"—"** (blank) for every department; Scenarios' Metric Side-by-Side table shows Headcount (FTE) **1,014** for Management Base Case. None of these match the ~48 FTE implied by the Model Planning grid. This strongly suggests Headcount is being computed by summing the wrong underlying field (likely a payroll/cost driver) instead of counting actual headcount records.
**Gap type:** Wrong calculation
**Severity:** CRITICAL
**Steps to reproduce:**
1. Open `/forecasting/workforce`, note Headcount KPI = 14,674 and the Department Headcount Plan table's fractional per-department values.
2. Open `/forecasting/scenarios`, note Metric Side-by-Side's Headcount (FTE) row = 1,014 for Management Base Case.
3. Open a Model Planning worksheet grid (e.g. FY2026 Locked Operating Plan), note the Headcount row's actual monthly values are single/double digits (13, 7, 11, 17...).

---

## FPA-009

**Screen / flow:** Scenarios (`/forecasting/scenarios`) — Metric Side-by-Side Analysis and Scenario Assumptions Ranges tables
**SRD reference:** Digest §3.3 (scenario comparison), §4.1 (EBITDA Margin = EBITDA / Revenue, a directly derivable ratio needing no additional data source).
**Expected:** EBITDA Margin should compute directly from the Revenue and EBITDA figures already shown in the same row set; assumption ranges should populate for every scenario being compared, not just the anchor.
**Actual:** EBITDA Margin row shows **"—"** for all 4 scenarios despite Revenue and EBITDA both being populated in the same table (e.g. Management Base Case: Revenue $11.5M, EBITDA $781.5K — EBITDA Margin is trivially 6.8%, not blank). Gross Profit, Opex, and Capex rows are also blank for every scenario. In the Scenario Assumptions Ranges table below, only the anchor scenario (Management Base Case) column populates any driver values; Accelerated Growth, Market Resilience, and Strategic Investment columns are blank ("—") for every driver row.
**Gap type:** Wrong calculation / missing data
**Severity:** MEDIUM
**Steps to reproduce:**
1. Open `/forecasting/scenarios` with all 4 scenarios selected.
2. In Metric Side-by-Side Analysis, note EBITDA Margin, Gross Profit, Opex, Capex are blank for every column despite Revenue/EBITDA/Cash being populated.
3. In Scenario Assumptions Ranges, note only the Management Base Case column has values; the other 3 scenario columns are blank for every driver.

---

## FPA-010

**Screen / flow:** Budgeting (`/forecasting/budget`) — active cycle's "Planning areas" list
**SRD reference:** Digest §1 — Budgeting screen lists planning areas (Revenue, Workforce, Opex, Cash, Capex) once each with completion status.
**Expected:** Each planning area appears exactly once.
**Actual:** For the active cycle "FY2026 Executive Budget Review", the Planning areas list shows: Revenue, WORKFORCE, OPEX, CASH, Capex, **then OPEX, CASH, Capex again** — OPEX, CASH, and Capex each appear twice (both instances showing identical values: OPEX 144/144 Complete, CASH 0/0 Not Started, Capex 24/24 Complete).
**Gap type:** Wrong behaviour (duplicate rendering)
**Severity:** LOW
**Steps to reproduce:**
1. Open `/forecasting/budget`, view the active/first cycle card's "Planning areas" section.
2. Count the rows: Revenue, WORKFORCE, OPEX, CASH, Capex, OPEX, CASH, Capex — 8 rows for 5 areas.

---

## FPA-011

**Screen / flow:** Variance Analysis (`/forecasting/variance`) — Opex Variance KPI vs department table
**SRD reference:** Digest §4.4, variance rollup should aggregate consistently between company-level KPIs and department breakdown.
**Expected:** Company-level "Opex Variance" should reconcile with the department table's own Var-to-Budget figures for the same period/version.
**Actual:** Opex Variance KPI reads **$0**, while the Actual vs Budget vs Forecast table for the same period (2026-06-01, FY2026 Management Plan) shows all 3 departments with positive (unfavourable, over-budget) variances — Investments +$0.16M, Human Resources +$0.13M, Finance +$0.11M — which should sum to roughly +$0.40M, not $0. Commentary column also reads "Unavailable" for every department row.
**Gap type:** Wrong calculation
**Severity:** MEDIUM
**Steps to reproduce:**
1. Open `/forecasting/variance`, let it auto-select period 2026-06-01 / FY2026 Management Plan.
2. Compare "Opex Variance $0" against the department table's Var to Budget column (Investments $0.16M, HR $0.13M, Finance $0.11M).

---

## FPA-012

**Screen / flow:** Workflow & Approvals (`/forecasting/workflow`) — Cycle Details timeline
**SRD reference:** Digest §1/§4.3, planning-cycle stage timeline (Setup → Department Input → FP&A Review → CFO Approval → Locked).
**Expected:** Each stage shows a coherent, forward-moving date or date range consistent with its status.
**Actual:** For "FY2026 Executive Budget Review": the **Setup** stage (status "Completed") shows the date range **"Aug 20, 2026 – Aug 15, 2026"** — the end date is 5 days before the start date. The **Department Input** stage is labeled status "Completed" but its date text reads **"Starts Aug 15, 2026"** — future/start-of-stage phrasing on a stage marked complete.
**Gap type:** Wrong behaviour (data/label mismatch)
**Severity:** LOW
**Steps to reproduce:**
1. Open `/forecasting/workflow`, select cycle "FY2026 Executive Budget Review".
2. Read the Cycle Details timeline: Setup shows "Completed · Aug 20, 2026 – Aug 15, 2026"; Department Input shows "Completed · Starts Aug 15, 2026".

---

## FPA-013

**Screen / flow:** Settings → Entities & Accounts (`/forecasting/settings`)
**SRD reference:** Digest §4.1 — every derived KPI (Gross Margin, EBITDA, Variance) depends on Chart-of-Accounts mapping to classify GL accounts into Revenue/COGS/Opex.
**Expected:** At least the primary entity (Arcus Group Holdings) has its GL accounts mapped to a chart-of-accounts classification, since the rest of the module (Model Planning, Scenarios, Variance) reports real dollar figures that must come from somewhere.
**Actual:** All 3 forecast entities (Arcus Group Holdings, Arcus Capital Partners, Arcus Advisory Limited) show **"No accounts"** in the entity list and **"No accounts mapped to this entity"** in the Chart of Accounts Mappings panel — for every entity, with no exceptions. This is very likely the root cause behind FPA-004 (Gross Margin always $0) and contributes to FPA-011 (Opex Variance not reconciling): with zero COGS/Revenue/Opex account mappings configured anywhere, any calculation that depends on account classification has no real classification to draw from.
**Gap type:** Missing data / setup gap
**Severity:** HIGH
**Steps to reproduce:**
1. Open `/forecasting/settings`, "Entities & Accounts" tab.
2. Click through all 3 entities; each shows "No accounts" and the Chart of Accounts Mappings panel reads "No accounts mapped to this entity."

---

## FPA-014

**Screen / flow:** FP&A sidebar navigation (`lib/config/modules.ts` "forecasting" entry, rendered by `components/layout/fpa-sidebar.tsx`)
**SRD reference:** Digest §1 master screen table lists Scenarios and Audit Log as required FP&A screens.
**Expected:** Every screen described in the SRDs is reachable from the FP&A sidebar.
**Actual:** Two screens are missing from the 14-item `subModules` list in `lib/config/modules.ts` (lines 737-752):
- **Scenarios** (`/forecasting/scenarios`) — the screen is fully built and functional (verified live: scenario comparison, waterfall bridge, assumption ranges all render — see FPA-009 for its own defects), but has no sidebar entry at all. It is only reachable by typing the URL directly; no in-app link leads to it.
- **Audit Logs** — a complete component exists at `components/fpa/fpa-audit-logs.tsx`, but no route file under `app/forecasting/` mounts it (`/forecasting/audit-logs` returns a 404) and it has no sidebar entry either. This feature is fully built but entirely unreachable — not a stub, an orphaned component.
**Gap type:** Missing feature (navigation/routing)
**Severity:** MEDIUM
**Steps to reproduce:**
1. Open `/forecasting`, review the full sidebar — 14 items, no "Scenarios" or "Audit Log(s)" entry.
2. Navigate directly to `/forecasting/scenarios` — loads and works.
3. Navigate directly to `/forecasting/audit-logs` — 404. Grep the codebase: `components/fpa/fpa-audit-logs.tsx` exists but nothing under `app/forecasting/` imports it.

---

## FPA-015

**Screen / flow:** Cross-cutting — Performance Management ↔ FP&A integration (SRD-4)
**SRD reference:** Digest §5.2-§5.7 — 3 required data-flow directions (FP&A→PM targets via Target Mapping; PM→FP&A forecast-review-trigger via Driver Mapping, never a direct write; FP&A→PM forecast snapshot), backed by 5 named tables (`performance_fpa_target_mappings`, `performance_fpa_driver_mappings`, `performance_forecast_review_triggers`, `performance_financial_target_snapshots`, `performance_forecast_snapshots`) and a 15-item "must never" guardrail list.
**Expected:** Target Mapping and Driver Mapping configuration exists somewhere in the app (FP&A or Performance settings); locking an FP&A version creates a target snapshot in Performance; a KPI breach in Performance creates a `Forecast Review Trigger` for FP&A review, never writing to FP&A directly.
**Actual:** None of this integration exists. Confirmed by code inspection:
- None of the 5 required table names appear anywhere in `nvccz/prisma/` (the schema has no `performance_fpa_target_mappings`, `performance_fpa_driver_mappings`, `performance_forecast_review_triggers`, `performance_financial_target_snapshots`, or `performance_forecast_snapshots` tables/models).
- No "Target Mapping" or "Driver Mapping" UI exists anywhere under `nvccz-new/components/fpa/`.
- The only FP&A↔Performance code that exists at all is `nvccz/src/services/fpa/FpaPlanningPmTaskBridge.ts`, which is unrelated to this integration — it just mirrors FP&A planning tasks into Performance's generic Task list so assignees see them, with no target/driver/KPI/trigger concept involved.
- Net effect: none of the 3 documented data-flow directions are implemented in either direction, and the 15-item guardrail list has nothing to violate because there is nothing built to violate it with.
**Gap type:** Missing feature
**Severity:** CRITICAL
**Steps to reproduce:**
1. Grep `nvccz/prisma/` for the 5 table names above — none exist.
2. Grep `nvccz-new/components/fpa/` and `nvccz/src/services/fpa/` for "Target Mapping"/"Driver Mapping"/"ForecastReviewTrigger" — no matches except the unrelated task-mirror bridge.
3. Live-confirm: no Target Mapping/Driver Mapping screen exists in FP&A Settings (`/forecasting/settings` has only Entities & Accounts, Variance Thresholds, Sync Sources, Workflow Defaults tabs) or in Performance Management's own settings.

---

## FPA-016

**Screen / flow:** Cross-cutting — FP&A sidebar layout at mobile width (B2 responsiveness check)
**SRD reference:** Brief's responsiveness requirement (375/768/1440).
**Expected:** Layout adapts to a 375px-wide viewport (phone) — typically a collapsible/hidden sidebar behind a menu toggle.
**Actual:** At 375px, the FP&A sidebar (`components/layout/fpa-sidebar.tsx`) renders at its full ~220px width with no responsive/viewport-based collapse — only a manual "Collapse" button the user has to find and click every time. This squeezes the main content into roughly 155px, truncating labels (e.g. "Arcus Group FY2026 Integrated Plan" renders as "Arcus Group FY202…", "Management Base Case" as "Management Base Ca…"). Confirmed working correctly at 768px and 1440px — this is specific to phone width. Not a hard functional break (no horizontal scroll, nothing unreachable), but a real mobile-usability gap.
**Gap type:** Responsiveness / UX
**Severity:** LOW
**Steps to reproduce:**
1. Open any `/forecasting/*` screen, resize the viewport to 375×812.
2. Observe the sidebar stays fully expanded and un-collapsible except via the manual toggle at the bottom; card labels truncate.

---
