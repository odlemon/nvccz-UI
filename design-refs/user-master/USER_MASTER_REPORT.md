# User Master: gap check, build and verification (`/users` + `/procurement`)

Everything below was built and tested **locally** (local MySQL 8.4 `arcus_dev`, API :3009, staff portal :3120). Nothing was deployed.
Backend repo: `../nvccz` (branch `feature/portfolio-v11-live`). Frontend: this repo (`feature/investee-portal-v8-live`). Nothing is committed.

## 1. Migration log (apply to dev in this order)

| # | Command (backend repo) | What it does | Status locally |
|---|---|---|---|
| 1 | `npm run db:migrate:user-status` | `users.status` (ACTIVE / SUSPENDED / LOCKED / DEACTIVATED) + index. Already existed (commit 1fb9fd9). | already applied |
| 2 | `npm run db:migrate:nts-remaining` | Earlier, uncommitted script that created `users.approval_limit_amount`, `delegated_approver_id`, `branch`, `business_unit`, `cost_centre`. | already applied |
| 3 | `npm run db:migrate:user-master` | **New.** Adds to `users`: `employee_code` (unique), `mobile_number`, `location`, `job_title`, `reporting_manager_id`, `procurement_function`, `access_profile`, `approval_level`, `sod_restrictions` (JSON), `sso_username` (unique), `uat_role`, `effective_date`, `end_date`, `last_login_at`, `created_by_id`, `updated_by_id`, `deactivated_at`; indexes; back-fills `employee_code` (`EMP-00001`...) for every existing user. Adds `procurement_approval_stages.min_approval_level` and `purchase_requisitions.cost_centre`. It also repeats the columns from #1 and #2 (skipping any that exist), so it alone is enough on a database missing them. | applied, run twice: second run skips all 30 steps |

Then `npx prisma generate`. No `prisma migrate` / `db push` was used. Raw-SQL scripts only, per the repo rule.
Note: `db:migrate:all` does not include `user-master` yet; run it explicitly (or add it to `scripts/run-all-db-migrations.ts`).

## 2. Audit: what was missing / stored but inert

| Requirement | Before | Now |
|---|---|---|
| Employee ID, mobile, location, job title, reporting manager, SSO username, UAT role | not in the model | stored, validated (unique ID and SSO username, phone format, no reporting loops) |
| Full name | not present | derived from first name + surname; a contradicting value is refused |
| Business unit, branch, cost centre | stored on the user, never used | default onto every requisition the user raises; cost centre added to requisitions and fed to the approval matrix's `matchRules` |
| Procurement function, access profile | not present | **enforced** in the central permission check and on procurement writes |
| Approval level | not present | per-step minimum level in the approval matrix; routing and approval honour it |
| Approval limit | stored, never read | **enforced** (routing, approve, direct invoice approve) with escalation |
| Delegated approver | stored, never read | work is **routed to the delegate**; hand-off recorded on the approval row and in the audit trail |
| SoD restrictions | not present; no requester != approver check anywhere | standing rule (nobody approves what they raised, admins included) + five per-user restrictions |
| Effective / end date | not present | enforced at login and on every request |
| Status | enforced at login only | also enforced on every request, in routing (never asked to approve) and in the service layer |
| Last login, created/modified by + date | last login not recorded | populated automatically; shown in list, form and drawer |
| No permanent delete with history | **hard delete, reassigning history to an admin** | user with transaction history is deactivated and kept; only a history-free user is deleted; own account and last admin protected; `DELETE /users/:id` now needs `manage_users` (it had no permission check) |

## 3. What was built

Backend (`../nvccz`):
- `src/config/userMasterAccess.ts`: pure rules (availability window, function/profile gating, SoD codes).
- `src/services/UserMasterPolicyService.ts`: routing (availability, delegate, level, limit, requester exclusion), approve guard (SoD, level, limit + escalation to the reporting line), direct invoice/GRN/payment guards. Every refusal is a 403 with a code and an audit entry.
- `UserService` / `UserController` / `userRoutes`: all fields on create, update, list, detail; `GET /users/master-options` (statuses, functions, profiles, SoD list); audit of master changes (`USER_MASTER_UPDATE`), creates and deletes; `GET /users/:id` restricted to internal staff.
- `AuthController` / `authenticate`: validity window on login and every request; Last Login; login by SSO username.
- `ProcurementRequisitionApprovalService` (matrix): `minApprovalLevel` per step; route view shows delegation/escalation notes.
- `ProcurementAccessController`: `/me/access` returns the user's authority (function, profile, level, limit, delegate, cost centre, SoD).
- `procurementRoutes`: READ_ONLY profile refuses every write, including routes with no permission of their own.

Frontend (this repo):
- `/admin/users`: table gains Employee ID, Procurement Function, Approval Limit, Status, Last Login, a status filter and Employee ID search; the form has all 25 master fields in Identity / Organisation / Role & Authority / Access / Validity / Audit sections with option lists from the API; the drawer shows the whole record; removal explains deactivate-vs-delete and toasts the real outcome.
- Procurement > Configuration: "Your authority" card; approval matrix shows the minimum approval level and the editor has a "Min. approval level" input; route view shows delegate/escalation notes (bridge changed, runtime re-patched with `patch-procurement-runtime.mjs`, verified 228 in place / 0 missed).

## 4. Fixed along the way
- **Shared `Input` did not forward refs**, so any react-hook-form `register` field looked empty and failed validation. Fixed once in `components/ui/input.tsx`.
- Hard delete silently reassigned a user's approvals to an admin, rewriting who approved what.
- `DELETE /users/:id` and `GET /users/:id` had no role/permission check.
- A department head could be routed their own requisition; any admin could approve their own.
- Requisition approval matched on `costCentre`/`branch` that were never put into the approval data, so those `matchRules` could never match.

## 5. Verification (all re-run to green)
- `scripts/_uat/user-master-e2e.ts` (backend): **69/69**. Creates real users through the API, then: status (suspended/locked/deactivated: login and live session refused), validity window (expired, not yet effective, expiring mid-session), function and profile gating, over-limit block + escalation + audit, routing by value, approval level, delegation (routed, noted, audited, delegate suspended falls back), SoD (head not routed to self, admin cannot approve own), cost-centre routing, soft-delete vs hard-delete, permission on delete.
- `scripts/_uat/user-master-guards.ts` (backend): **13/13** direct invoice, payment and goods-receipt guards on real records.
- `scripts/_uat/user-master-ui.mjs`: **41/41** in a visible browser: list columns, status filter, form fields, edit saved and persisted after reload, drawer.
- `scripts/_uat/user-master-procurement-ui.mjs`: **11/11** in a visible browser: suspended login refused with reason, authority card, read-only writes refused, matrix level column and editor.
- Screenshots: `design-refs/user-master/screens/`.

## 6. Decisions and limits to confirm
- **No limit set = unlimited.** A limit of 0 blocks all approvals. Confirm this is the intended default.
- **Delegation is always-on while a delegate is set** (no date range). Clear it to end it.
- The five per-user SoD restrictions cover the duty pairs the schema can prove (receive/approve invoice, PO/approve invoice, approve/pay, request/receive, raise/approve). Others need new record-level actor columns.
- Requisition approval has no permission of its own by design (approved per record by the engine), so function/profile gating applies to the permission-guarded areas and READ_ONLY blocks all writes.
- Local test users (tags `umtest*`, `umui*`) are left DEACTIVATED, not deleted, because they have history.
- `procurement_approval_stages.min_approval_level` can only be set through the matrix editor for the requisition route; other stage types (PO, invoice, GRN) honour it if set but have no editor.
- Pre-existing, unrelated TypeScript errors remain in the FE (`admin-api.ts` unknown response types, voting dialogs); untouched.
