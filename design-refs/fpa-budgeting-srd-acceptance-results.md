# FP&A Annual Budgeting — SRD acceptance test results

**Date:** 2026-07-12  
**Tester:** logged-in session `admin@nts.com` (UI + API)  
**Model:** `dd` (`cmrgm59xg00i3kt4malx3fx46`) · BASE · Working  
**Cycle under test:** `SRD E2E 132523` (`cmrhpirjd0018kt9p0328uqxc`)  
**Canonical API:** `/v1/fpa/budget-cycles` (not `/planning-cycles`)

---

## Verdict

**Core Annual Budgeting flow works end-to-end on the shipped `/budget-cycles` surface.**  
Create → validate (full unmet list) → open → owner workspace → worksheet edit → submit → FP&A review → maker-checker → return with comment all verified with live actions.

**Not fully satisfied vs full SRD text:** no `CALCULATED` cells on this UAT model (grid is all `INPUT`), no second CFO/FP&A login to complete CFO→lock in this session, async calculate jobs / cycle-scoped driver approve still deferred.

---

## Live actions performed

| Action | Evidence |
|--------|----------|
| Login | API + existing browser session |
| Create DRAFT with Ops unassigned | `OWNER_UNASSIGNED` on validate-setup |
| Assign Finance owner + open | `OPEN_FOR_INPUT`, `actualsRowCount=0` + reason |
| Owner workspace | progress / due / areas / register |
| Review workspace | submission register + task queue |
| Edit INPUT cell (API + UI) | value saved, `updatedCells`, history |
| Stale `recordVersion` | **409 CONFLICT** with payload |
| Bulk FILL_RIGHT + Spread | updated 11 / spread 12 |
| Trace / detail | endpoints succeed |
| Submit task | `SUBMITTED` |
| Submit to FP&A | `PENDING_FPA_REVIEW` |
| Same user fpa-accept | **403 `MAKER_CHECKER`** |
| fpa-return with comment | `RETURNED_FOR_CORRECTION` |
| UI: worksheet + budgeting detail | cycle chrome, Bulk, Formula Trace, review block |

---

## Acceptance criteria (§12) — pass / fail / skip

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Create annual budget cycles | **PASS** | Staged DRAFT → open |
| 2 | Valid published models | **PASS** | Model validate passed |
| 3 | Dimensional intersection storage | **PASS** | Cells keyed by line/period/dept/version/scenario |
| 4 | Actual vs forecast distinguishable | **PASS** | `periods[].periodRole` on 12 periods |
| 5 | Source actuals separate | **PASS** | Open reports actuals load reason; planning cells separate |
| 6 | Dept users only authorised areas | **PASS** | `assignedDepartmentIds` + cycle-scoped grid |
| 7 | Editable vs calculated clear | **PARTIAL** | Legend/status badges present; this model has only `INPUT` cells |
| 8 | Calculated not editable | **SKIP/UNVERIFIED** | No `CALCULATED` cells in model `dd` grid |
| 9 | Server-side cell validation | **PASS** | Update API |
| 10 | Audit history | **PASS** | History entries after edit |
| 11 | Dependent recalc | **PASS** | `updatedCells` returned |
| 12 | Bulk spreadsheet actions | **PASS** | `bulk-operation` + FE Bulk menu |
| 13 | Spread annual values | **PASS** | spreadAcross=12 |
| 14 | Owners submit departmental plans | **PASS** | Task `SUBMITTED` |
| 15 | Submission blocks incomplete | **PASS** | Full unmet list on other cycles; this cycle passed gates |
| 16 | Return with comments | **PASS** | `RETURNED_FOR_CORRECTION` |
| 17 | Lock approved budgets | **BLOCKED** | Need second user for FPA accept (maker-checker) |
| 18 | Locked rejects API writes | **BLOCKED** | Depends on #17 |
| 44 | Draft→Submitted→Review→Approved→Locked | **PARTIAL** | Through Review + Return; Approve/Lock needs 2nd actor |
| 45 | Maker-checker API | **PASS** | `MAKER_CHECKER` on self fpa-accept |
| 49 | No silent concurrent overwrite | **PASS** | 409 CONFLICT |
| 50 | Material events auditable | **PASS** | Cell history + workflow transitions |

---

## Deferred (not FE inventable)

- Async `POST …/calculate` + job polling  
- Cycle-scoped driver submit/approve  
- Per-line-item baseline override  
- Full `/planning-cycles` dual path (canonical remains `/budget-cycles`)

---

## Gaps to close for 100% SRD on UAT data

1. Seed at least one **CALCULATED** formula line on model `dd` (or use a model that has them) to prove `CELL_NOT_EDITABLE`.  
2. Provide a second FP&A/CFO test user so maker-checker accept → CFO approve → lock → reopen can be completed in one pass.  
3. Load real GL prior actuals if non-zero `actualsRowCount` is required for demo.
