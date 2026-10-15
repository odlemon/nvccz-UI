# ERP Access UAT Verification

**Run date:** 2026-10-15
**Environment:** Local development only (`http://localhost:3001`, API `http://127.0.0.1:3009`)
**Deployment status:** Not deployed; production and remote development were not modified.
**Overall:** NOT ACCEPTED — partial passes with verified authorization gaps.

## Test identity and scope

The local database has no accounts whose names match Tino, Sophia, Ropa, Brendon, Natsai, Vongai, or Gilbert. Seven synthetic UAT identities were used instead, mapped by role: `uat.tino@nts.local` (CEO), `uat.sophia@nts.local` (CFO), `uat.ropa@nts.local` (FIN_ASST), Brendon/Natsai/Vongai synthetic accounts (INV_ANALYST), and Gilbert synthetic account (PORTFOLIO_MGR). These are role-equivalent fixtures only; they do not establish the named employees' actual roles or access. Authentication and actual browser interactions were performed against the running local application. No production data or credentials were used.

Browser MCP could not attach because its privileged native pipe bridge was unavailable; executable Playwright was used as the documented fallback. Evidence screenshots are in [`test-artifacts/uat-access/`](test-artifacts/uat-access/). API tests used authenticated requests to the local API. Invalid/empty create requests were used where a valid create would persist data; consequently they establish routing/validation, not successful creation.

## Issue results

| Issue | Expected result | Actual observed result | Evidence | Status |
|---|---|---|---|---|
| Home navigation | Home reachable from every authorized module without session loss or bad redirects | Real browser click from Portfolio, FP&A, Payroll, Procurement, Accounting, and Events returned to `/home` for synthetic Tino; all passed with no page errors on those tested paths. Shared topbar Home affordance was added. | `home-navigation-after-fix.png`, `home-link-portfolio.png`; per-module Playwright result recorded in prior turn | **PASS (local, tested role only)** |
| FP&A routing/authorization | Authorized roles enter FP&A; unauthorized roles are denied in UI, direct route, and API | CFO direct `/forecasting` rendered FP&A. Added an explicit backend FP&A role gate and removed INV_ANALYST from the frontend FP&A grants. Post-fix authenticated API retest: CFO 200, INV_ANALYST 403. Middleware now routes unauthorized deep links to a visible `/access-denied` page instead of Home; post-fix browser confirmation is still blocked by local resource instability. | `sophia-fpa-switcher.png` (authorized baseline); API retest; source `../nvccz/src/routes/fpaRoutes.ts`, `../nvccz/src/middleware/permissionAuth.ts`, `middleware.ts`, `app/access-denied/page.tsx` | **PARTIAL — API verified; denial UI code changed but browser retest outstanding** |
| Full Payroll restrictions | Only Tino, Sophia, and Ropa fixtures get admin Payroll; other four denied in menu, direct URL, and API | Tino/Sophia/Ropa fixtures received 200 on admin employees/runs endpoints; four restricted fixtures received 403. Restricted-user direct `/payroll` rendered Access unavailable, and `/payroll/mypay` rendered the separate self-service page without admin navigation. Initial browser evidence captured the pre-fix overly broad module picker; post-fix direct route was tested, but a fresh post-fix restricted-role picker inspection is not yet evidenced. Payroll employee/self-service endpoints returned 404 because no matching Employee rows exist for these synthetic users. | `tino-switcher.png`…`gilbert-switcher.png` (pre-fix picker); `brendon-my-pay-isolated.png`; `brendon-my-pay.png`; API matrix | **PARTIAL / FAIL — admin API denial and direct route verified for tested fixture; full menu matrix and personal-data ownership blocked by absent Employee records** |
| Four restricted users | Exactly Home, authorized Portfolio, own My Pay, create-only Procurement requisition, Accounting requisition creation, authorized Events; no extras | Role grants permit additional module capabilities (analyst performance/application/FP&A; portfolio manager application/accounting read/performance). Procurement `GET /requisitions/my` returned 200, broad listing returned 403 for restricted fixtures; invalid POST returned 400 validation, not authorization, so creation was not proven. Accounting routes contain no requisition-creation endpoint in the inspected API; the existing accounting `me`/dashboard results do not prove a create-only workflow. Events and portfolio action/API boundaries were not fully exercised per user. | Per-user picker screenshots (pre-fix); procurement/accounting authenticated API checks; source search in backend routes/controllers | **FAIL — scope exceeds requested matrix; accounting requisition creation absent; actions incompletely tested** |

## User-by-user role-equivalent matrix

This matrix reports synthetic fixtures only, not the named employees. “Not verified” is not a pass.

| Named user | Local fixture / role | Home navigation | Full Payroll admin | Personal My Pay | Procurement PR-only | Accounting requisition-only | Portfolio / Events exact scope | Result |
|---|---|---|---|---|---|---|---|---|
| Tino | synthetic CEO | PASS from tested modules | API 200; UI picker shown pre-fix | BLOCKED: no Employee row | Not applicable to restricted group; API general routes 200 | No create route found | Not fully verified | Partial |
| Sophia | synthetic CFO | Home affordance present; not all module paths individually tested | API 200 | BLOCKED: no Employee row | API general list 200; empty create request 400 validation | No create route found | FP&A direct route rendered; other exact scope not fully verified | Partial |
| Ropa | synthetic FIN_ASST | Not all module paths individually tested | API 200 | BLOCKED: no Employee row | API general list 200; empty create request 400 validation | No create route found | Not fully verified | Partial |
| Brendon | synthetic INV_ANALYST | PASS across six modules with synthetic Tino; own click matrix not repeated | Direct `/payroll` denied; payroll admin API 403 | Page isolated; says account not linked; ownership data unavailable | Own-list 200; broad-list 403; POST empty 400 validation | No create route found | Role grants include extra Performance, application, and FP&A capabilities; Events not fully tested | FAIL |
| Natsai | synthetic INV_ANALYST | Not individually repeated for all modules | Payroll admin API 403 | Employee row absent; ownership not testable | Own-list 200; broad-list 403; POST empty 400 validation | No create route found | Same role-level overgrant; not individually action-tested | FAIL |
| Vongai | synthetic INV_ANALYST | Not individually repeated for all modules | Payroll admin API 403 | Employee row absent; ownership not testable | Own-list 200; broad-list 403; POST empty 400 validation | No create route found | Same role-level overgrant; not individually action-tested | FAIL |
| Gilbert | synthetic PORTFOLIO_MGR | Not individually repeated for all modules | Payroll admin API 403 | Employee row absent; ownership not testable | Own-list 200; broad-list 403; POST empty 400 validation | No create route found | Role grants include extra application, accounting read, and performance capabilities; not individually action-tested | FAIL |

## API observations

- **Payroll:** `/api/payroll/me/access` returned 200 for all synthetic users. `/api/payroll/employees` and `/api/payroll/payroll-runs` returned 200 for Tino/Sophia and 403 for the other five. `/api/payroll/employee/portal` and `/employee/payslips` returned 404 for all because the synthetic users have no related Employee row. Therefore owner-isolation is not established by these fixtures.
- **Procurement:** `/api/procurement/requisitions/my` returned 200 for each. General `/requisitions` returned 200 for Tino/Sophia and 403 for Ropa and the four restricted fixtures. `/settings` returned 200 for Tino and 403 for others. `POST /requisitions` with `{}` returned 400 for every role due to payload validation; it did not create data and does not prove valid creation authorization. Procurement source documents that any employee may create and list own requisitions; elevated listing/approval routes have role/department checks, but not every restricted action was attempted.
- **Accounting:** authenticated `/api/accounting/me` returned 200 for all; dashboard returned 403 for restricted analysts and portfolio manager, 200 for Tino/Sophia/Ropa. Source inspection found no accounting requisition-creation API route/controller. A UI/API create operation cannot be verified until one exists.
- **FP&A:** authenticated `/api/v1/fpa/budget-cycles` returned 200 for all seven; route-wide middleware only excludes external/non-internal staff. This contradicts the requested four-user module boundary.

## Implemented local fixes and validation

Local changes in these working trees include resolving active module IDs to existing role permissions instead of unconditional mock-shell access, a direct-route module access gate, a visible Home link, a separate personal-payroll page, an explicit non-Home access-denied route, and an FP&A server-side role gate. The frontend FP&A role map no longer grants FP&A to INV_ANALYST. The personal page uses the existing self-service API and shows an unlinked-account state rather than admin navigation when no Employee relation exists. These changes are local and have not been pushed or deployed.

Focused ESLint on the changed frontend files completed without reported findings. The backend guard test and backend full typecheck could not complete because their Node processes exhausted the local heap while the long-running frontend dev server was using substantial memory; do not treat these as passing. The authenticated API check directly verified CFO 200 and INV_ANALYST 403. A prior broad frontend `npx tsc --noEmit` reported extensive pre-existing errors across generated `.next-lp-uat/types` and legacy files; this is not evidence of a clean project typecheck. Existing News-module changes and backend News changes were left intact.

## Required next work before acceptance

1. Provide/create authorized local fixtures for the actual seven named employees, with employee rows for self-service ownership checks; do not infer identities from role names.
2. Define user-specific access policy/overrides (or confirm the intended role policy) so Brendon/Natsai/Vongai/Gilbert cannot use extra module actions. The current roles are shared by users, so a role-wide reduction could affect other staff.
3. Browser-verify the new explicit FP&A denial route with a restricted fixture and test all relevant FP&A role families; current UI verification after this change is outstanding.
4. Implement an explicitly scoped accounting requisition creation workflow/API, if intended, then test allowed creation and denied approve/process/read-confidential actions without leaving persistent UAT data.
5. Complete fresh post-fix menu and per-user browser matrices, and test valid Procurement create in isolated disposable data or with cleanup.
6. Run relevant focused backend tests, then retest locally. Only separately authorized work may push/deploy; production remains read-only.
