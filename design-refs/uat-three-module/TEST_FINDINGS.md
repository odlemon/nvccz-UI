# Test findings — LP Portal, Payroll, Fundraising

**Engagement:** three-module UAT / QAT / UI-UX · branch `qa/three-module-uat-20260910`

| Severity | Open | Fixed (pending verification) | Verified |
|---|---|---|---|
| CRITICAL | 1 | 3 | 0 |
| HIGH | 0 | 0 | 0 |
| MEDIUM | 0 | 0 | 0 |
| LOW | 0 | 0 | 0 |

---

## FINDING-001

**Title:** Payroll's maker role does not exist, so segregation of duties is unenforceable
**Module:** Payroll · **Dimension:** UAT · **Category:** Permission
**Severity:** CRITICAL
**Persona affected:** Payroll Manager (the maker), and every approver downstream of one
**Surface:** Internal App · **Screen / Flow:** payroll run lifecycle — submit and approve

### Steps to reproduce

1. Query the `roles` table for `Payroll Manager`.
2. Run `npm run db:migrate:payroll-v6-permissions -- --check`.
3. Attempt to create a user holding the Payroll Manager role via `POST /api/users`.

### Expected

`payrollPermissions.ts` documents the design explicitly: *"Segregation of duties:
`payroll.runs.manage` (maker) and `payroll.runs.approve` (checker) are never granted to
the same non-admin role."* A user should be able to hold the maker role, prepare a run,
and be refused when approving it.

### Actual

Three coupled failures:

1. **The role does not exist.** `Payroll Manager` was absent from all 59 rows of the
   `roles` table. So was `Internal Auditor`. Both are named in `PAYROLL_ROLE_GRANTS` and
   neither was ever seeded.
2. **The verifier reported success anyway.** The permissions migration treated a missing
   role as a benign `SKIP`, printed **"All payroll grants are in place."** and exited
   **0** — while 30 of the maker's grants were unassignable.
3. **The role was unassignable through the product.** `POST /api/users` resolves a
   `roleCode` through `getRoleByCode` in `src/config/hardcodedRoles.ts`, and none of its
   58 codes maps to `Payroll Manager`. Even creating the role by hand would not let a
   user be given it through the platform's own API.

The consequence is not cosmetic. The only account that could prepare a payroll run was
**System Administrator, which holds both `runs.manage` and `runs.approve`** — so every
run in this deployment could be prepared and approved by the same person. Maker-checker
existed in the code and in the documentation, and nowhere in the data.

### Evidence

```
$ npm run db:migrate:payroll-v6-permissions -- --check
  SKIP  role not present in this database: "Payroll Manager"
  SKIP  role not present in this database: "Internal Auditor"
All payroll grants are in place.
EXIT=0
```

**Reproducibility:** Always
**Suspected area:** `nvccz/src/config/payrollPermissions.ts` (grant map) ·
`nvccz/scripts/run-payroll-v6-permissions-migration.ts` (verifier) ·
`nvccz/src/config/hardcodedRoles.ts` (role-code taxonomy)
**Upstream dependency?** **Yes** — `hardcodedRoles.ts` is platform-wide, consumed by user
creation and the role controller. See blast radius below.

### Fix applied

Root cause was the broken code-to-data coupling, in three places, so fixed in three:

1. **`run-payroll-v6-permissions-migration.ts`** — a role named in `PAYROLL_ROLE_GRANTS`
   but absent from the database is now **created** with its grants, rather than skipped.
   This script exists to enforce exactly this coupling; skipping past a missing role was
   the coupling only half-closed.
2. **Same script, `--check` mode** — now reports absent roles by name and exits **1**.
   Reporting "all grants are in place" while the maker role does not exist is how this
   went unnoticed.
3. **`hardcodedRoles.ts`** — added `PAYROLL_MGR` → *Payroll Manager* (Human Resources,
   level 5) and `INT_AUDITOR` → *Internal Auditor* (Finance, level 4), so both are
   assignable through `POST /api/users` like every other role.

**Blast radius (flagged per the agreed upstream rule):** `hardcodedRoles.ts` is consumed
by user creation and `HardcodedRoleController`. Both changes are **additive** — two new
entries, no existing code, name, level or department altered — so no existing role
assignment can change behaviour. This is the lowest-risk shape a change to that file can
take, but it is a platform-wide file and is called out rather than buried.

Nothing was weakened, hidden or disabled: the maker still cannot approve.

### Verification

```
$ npm run db:migrate:payroll-v6-permissions
  CREATE  Payroll Manager  — role did not exist; created with 30 grants
  CREATE  Internal Auditor — role did not exist; created with 17 grants
Done. 0 role(s) updated, 2 role(s) created.

$ npm run db:migrate:payroll-v6-permissions -- --check
All payroll grants are in place.          EXIT=0     (idempotent)
```

Effective permissions, read back through `GET /api/payroll/me/access` after logging in as
each account:

| Account | `runs.manage` | `runs.approve` | `runs.release` |
|---|---|---|---|
| `payroll.manager@nts.local` | **YES** | **no** | YES |
| `payroll.cfo@nts.local` | no | **YES** | YES |
| `payroll.finmgr@nts.local` | no | **YES** | no |
| `payroll.compliance@nts.local` | no | no | no |
| `payroll.extaudit@nts.local` | no | no | no |
| `payroll.intaudit@nts.local` | no | no | no |
| `perf.sysadmin@nts.local` | YES | YES | YES *(admin, by design)* |
| `perf.employee@nts.local` | no | no | no |

**Status:** FIXED (pending verification) — the end-to-end refusal, a Payroll Manager being
denied approval of its own run, is roadmap item **P.2** and is proven in Stage 2, not here.

---

## FINDING-002

**Title:** Outbound email is live and ungated in every environment
**Module:** Cross-cutting (blocks LP Portal and Payroll testing) · **Dimension:** QAT
**Category:** Data Integrity / Safety
**Severity:** CRITICAL
**Persona affected:** every LP and employee holding a record in any environment
**Surface:** backend

### Steps to reproduce

1. Open `nvccz/src/config/email.config.ts`.
2. Search `src/` for a dry-run flag, `MAIL_ENABLED`, or any environment gate.
3. Create a user through `POST /api/users`, which sends a credentials email.

### Expected

A test environment cannot deliver mail to real people, or delivery is explicitly opt-in.

### Actual

The file creates the codebase's only nodemailer transport with **hardcoded SMTP
credentials**, and there is no dry-run flag, no `MAIL_ENABLED` gate and no environment
check anywhere in `src/`. 52 `sendMail` call sites across 9 services use that transport,
including `LpPortalInviteService` and `FundraisingMailerService`. Any LP invitation,
payslip notice or credentials email fired during testing is delivered for real, in every
environment, to whatever address the record holds.

**Reproducibility:** Always
**Suspected area:** `nvccz/src/config/email.config.ts`
**Upstream dependency?** No — this is the shared transport itself.

### Fix applied

Intercepts at the transport rather than at 52 call sites, so it also covers services that
do not exist yet. **Off by default**: with `MAIL_REDIRECT_ENFORCE` unset, `sendMail` is
untouched and production behaviour is unchanged. With it on, `MAIL_REDIRECT_TO` redirects
every `to`/`cc`/`bcc` to a single inbox — real recipients preserved in the subject and an
`X-Original-To` header, so a test can still assert who a message was addressed to — and if
that address is **not** set, nothing is sent at all.

Fail-closed is deliberate: a half-configured guard that quietly delivers is worse than no
guard, because it gets trusted.

`scripts/_uat/verify-mail-guard.ts` proves it rather than assuming it.

### Verification

```
$ npx ts-node --transpile-only scripts/_uat/verify-mail-guard.ts
[mail:BLOCKED] to="lp-should-never-receive@example.invalid; second-should-never-receive@example.invalid"
  accepted : []
  VERDICT  : PASS — nothing sent
```

Then proven in a real product workflow rather than a harness — creating the six persona
accounts fired six credentials emails, all intercepted:

```
[mail:BLOCKED] to=""Payroll Manager" <payroll.manager@nts.local>"
               subject="Your Niakazi Account Credentials - Welcome!" — nothing was sent.
```

**Status:** FIXED (pending verification) — re-asserted every cycle as roadmap item **X.7**.

### Related, not fixed — needs a decision

The SMTP credentials in `email.config.ts` are **hardcoded and committed to the
repository**. They should be rotated and moved to environment variables. Not actioned
here because rotating a live credential is the owner's call, and doing it silently during
a test engagement would be the wrong way to make that change. Raised in the Stage 1
report.

---

## FINDING-003

**Title:** An investee account can sign in to the staff portal, read the whole staff directory, and create an IT Manager account
**Module:** Cross-cutting (Auth / Users) — reached while testing LP Portal isolation
**Dimension:** UAT · **Category:** Permission / Data Integrity
**Severity:** CRITICAL
**Persona affected:** every staff member and every portfolio company in the system
**Surface:** Internal App (staff API) · **Screen / Flow:** login, then `GET`/`POST /api/users`

### Steps to reproduce

1. `POST /api/auth/login` with `{ email: "company.nts@arcus.co.zw", password, portal: "staff" }` —
   an INVESTEE account, i.e. an external portfolio company.
2. With the returned token, `GET /api/users`.
3. With the same token, `POST /api/users` creating `{ roleCode: "IT_MGR" }`.

### Expected

An external portfolio-company account is refused at the staff portal, and the staff
user directory and account-creation endpoint are unreachable to it.

### Actual

All three succeeded.

1. **Login admitted.** `assertPortalLoginAllowed` ends its staff branch in a default
   `return { ok: true }`. The INVESTEE account matched none of the earlier cases — its
   role *name* is `INVESTEE` and its `roleCode` is `null`, so the applicant check missed
   it — and fell through to the default.
2. **`GET /api/users` returned 200 with 30 full user records** — names, emails, roles,
   departments and voting power, including admins, board members and **other portfolio
   companies**. One investee could enumerate every other investee and all staff.
3. **`POST /api/users` returned 201** and created an `IT_MGR` account, **returning its
   temporary password in the response body**.

`userRoutes.ts` applied `router.use(authenticate)` and nothing else. `authenticate`
proves a token is valid, not that its holder is staff. Neither the list nor the create
route carried any permission guard.

This is a complete privilege-escalation path from an external tenant to a staff account.

### Evidence

```
POST /api/users  (as company.nts@arcus.co.zw)
HTTP 201
{"success":true,"data":{"user":{"email":"escalation.probe@nts.local","roleCode":"IT_MGR"},
 "temporaryPassword":"<redacted>"}}
```

The account created by this probe was deleted immediately; user count returned to its
prior value.

**Viewport:** n/a (API) · **Reproducibility:** Always
**Suspected area:** `nvccz/src/utils/portalAuth.ts` · `nvccz/src/routes/userRoutes.ts`
**Upstream dependency?** **Yes** — Auth, which every portal depends on.

### Fix applied

Two independent layers, because either alone leaves a hole. A token minted before the
login fix stays valid until it expires, so the route guard has to hold on its own.

**Layer 1 — portal admission** (`portalAuth.ts`). Added `isExternalPortalUser()` and a
final check in the staff branch, so investee, applicant and LP role tokens are refused
regardless of whether the earlier checks recognise them.

Narrowing the staff portal to `isGpStaff()` instead would have been the obvious move and
would have taken the platform down: `GP_ROLE_CODES` is only
`{admin, fund_manager, cfo}`, so HR, Payroll, Operations and Analyst roles are not "GP
staff". Classifying the external types closes the hole without locking out staff.

**Layer 2 — route authorisation** (`userRoutes.ts`, `permissionAuth.ts`). Added
`requireInternalStaffUser()`:

- `GET /` — staff check, not a specific permission. Every staff role legitimately needs
  the directory (assignment pickers, reviewer selection), so a permission here would
  break working features.
- `POST /` — `requireInternalStaffUser()` **and** `requirePermission("manage_users")`.
  Creating an account is privilege granting.

**Grant shipped with the guard.** Only the `admin` role held `manage_users`, so the guard
alone would have 403'd System Administrator, which legitimately creates users and did so
minutes earlier. `scripts/run-user-management-permission-migration.ts` grants it to
System Administrator, idempotently. HR Manager is a plausible future holder and was
deliberately **not** added — that is a product decision, not a regression fix.

**Blast radius (flagged):** `portalAuth.ts` and `permissionAuth.ts` are Auth, the highest
blast radius after Portfolio. Both changes are additive — a new exported helper and a new
middleware — and no existing check was altered or relaxed.

### Verification

```
LAYER 1 — staff portal admission
  investee         refused — "This account is not authorized for the staff portal."
  applicant        refused — "Applicant accounts must use the investee portal."
  LP               refused — "LP accounts must use the LP portal."
  SysAdmin / HR Manager / Payroll Manager / plain staff   all admitted

LAYER 2 — /api/users with a VALID non-staff token (LP, via its own portal)
  GET  /users -> 403        POST /users -> 403

NO LOCKOUT
  SysAdmin, HR Manager, Payroll Manager, plain staff   GET /users -> 200
  SysAdmin POST /users -> 201
```

Layer 2 is proven with a *valid* token rather than a rejected login, so it holds
independently of layer 1.

**Status:** FIXED (pending verification) — re-asserted every cycle as roadmap item **X.5**.

---

# Cycle 0 — isolation block result

Roadmap items **X.1, X.2** and the cross-portal login matrix, run as
`nvccz/scripts/_uat/lp-isolation-probe.mjs`.

| Axis | Result |
|---|---|
| Cross-portal admission (7 combinations) | **PASS** — 3 external types refused, 4 staff roles admitted |
| **X.1** cross-organisation, LP A vs B/C | **PASS** — 104 replayed ids, **0** returned 200 |
| **X.2** intra-organisation role, SIGNATORY vs VIEWER | **PASS** — 4/4 signatory-only writes refused 403 |

The LP Portal's own scoping is sound: `LpPortalAccessService` derives the LP context from
the token's `userId` via `lpUserRelation`, never from a client id in the request, so there
is no id to tamper with. Every cross-tenant detail and download route refused.

**The leak was not in the LP Portal.** It was in shared Auth, found because the probe
tested which portal accepts which account rather than assuming the boundary held.

### Probe correction

The phase-2 summary initially printed `leaks.length`, which already carried the phase-0
login leak, so it reported "1 returned 200" when phase 2 had found none. Fixed to report
only its own leaks before any conclusion was drawn from it. The applicant row was also
passing for the wrong reason — `"Invalid credentials."` rather than a portal refusal,
because that account's password was not aligned — and now proves the control it claims to.

---

## FINDING-004

**Title:** Every payroll run posts an unbalanced journal to the general ledger, and the error is swallowed
**Module:** Payroll → Accounting · **Dimension:** UAT · **Category:** Calculation / Data Integrity
**Severity:** CRITICAL
**Persona affected:** Accounting, CFO, auditors — and anyone relying on the GL
**Surface:** backend · **Screen / Flow:** payroll run processing, roadmap **P.5**

### Steps to reproduce

1. Process any payroll run containing at least one employee on a split-currency
   contract (`salarySplitUsdPct` < 1).
2. Read the journal entry referenced by `payroll_runs.journal_entry_id`.
3. Sum its debit and credit lines.

### Expected

Double entry: `DR Gross Pay Expense = CR (PAYE + NSSA/Pension + SDL + Net Wages Payable)`.
The entry balances, or nothing is posted.

### Actual

**4 of 4 completed runs posted an unbalanced entry**, each identically wrong:

| Period | Lines | Debit | Credit | Balanced | Net-pay line |
|---|---|---|---|---|---|
| 2026-06 | 4 | 42,209.00 | 67,732.61 | **NO** — out by 25,523.61 | **MISSING** |
| 2026-07 | 4 | 42,209.00 | 67,732.61 | **NO** — out by 25,523.61 | **MISSING** |
| 2026-08 | 4 | 42,209.00 | 67,732.61 | **NO** — out by 25,523.61 | **MISSING** |
| 2026-10 | 4 | 42,209.00 | 67,732.61 | **NO** — out by 25,523.61 | **MISSING** |

Three defects compound, in `PayrollService.ts` around lines 854-919 and 1060-1070.

**1 — Deductions are counted twice.** The aggregation loop reads a leg loop *and*
a deductions loop for the same employee, and the second is not in an `else`:

```ts
if (employeePayroll.legs?.length) {
  for (const leg of employeePayroll.legs) {
    totalPAYE = totalPAYE.add(leg.payeAmount).add(leg.aidsLevyAmount);   // legs
    totalNSSA = totalNSSA.add(leg.nssaAmount);
  }
}
for (const deduction of employeePayroll.deductions) {                     // and again
  if (bucket === 'PAYE') totalPAYE = totalPAYE.add(deduction.amount);
```

NSSA proves it exactly: legs sum to 2,940.84 and the journal credits **5,881.68**,
precisely double. PAYE: legs 29,995.206 + deductions 30,895.057 = **60,890.263**, the
exact figure posted.

**2 — ZiG amounts are added to USD without conversion.** The leg loop sums
`leg.payeAmount` regardless of `leg.currencyCode`. For 2026-10 the ZiG legs carry
23,276.346 ZiG of PAYE, added directly to 6,718.860 USD. At the run's own rate of
26.6291 the ZiG portion is worth 874.09 USD, so the correct total PAYE is **7,592.95**,
not 29,995.21 — and not the 60,890.26 actually posted.

**3 — The failure is swallowed and the corrupt entry is left posted.** The lines are
written *before* the balance check. Because inflated deductions make the recomputed net
pay negative (42,209 − 60,890 − 5,882 − 961 = **−25,524**), `if (totalNetPay.gt(0))`
is false, so the Net Wages Payable line is never created. The balance check then
throws — and the surrounding `catch` logs it and returns unless `rethrowOnError` is
set. The run is marked **COMPLETED**, `journal_entry_id` is populated, and an
unbalanced entry sits in the ledger with nothing surfaced to the user.

The third is the most serious: an invalid journal is *persisted* and the error hidden.
A transaction that cannot balance must roll back, not report success.

### Evidence

Journal for 2026-10, as stored:

```
Gross Pay Expense: 2026-10       dr 42209.00   cr 0
PAYE Payable: 2026-10            dr 0          cr 60890.263
NSSA/Pension Payable: 2026-10    dr 0          cr 5881.680
SDL Payable: 2026-10             dr 0          cr 960.671
                                 ----------    -----------
                                 42209.00      67732.614     out by 25523.614
```

Leg sums for the same run (fx 26.6291):

```
USD  n=12  paye 6718.860  nssa 378.00   sdl 181.810
ZIG  n=6   paye 23276.346 nssa 2562.84  sdl 778.861
```

**Viewport:** n/a · **Reproducibility:** Always — 4 of 4 runs
**Suspected area:** `nvccz/src/services/PayrollService.ts`
**Upstream dependency?** **Yes** — the defect is in payroll, but the damage lands in
Accounting's ledger. In scope to fix under the agreed rule, and the GL data already
written will need correcting separately.

### Related — money precision

Six of twelve payslips in each run store a gross that is not a representable currency
amount, e.g. `3705.9999857298969924` instead of `3706.00`. Exactly the six employees on
split contracts. The mechanism is a round trip: `splitGrossByContract` multiplies out to
ZiG, the ZiG leg is rounded to two ZiG cents, and the aggregate USD figure is obtained by
dividing back by the fx rate without re-rounding. The per-currency legs the employee is
actually paid are clean — only the combined figure carries the residue — so nobody is
paid a wrong amount, but the stored payslip totals are not money. Recorded here rather
than as its own finding because it shares a root with the above and should be fixed in
the same pass.

**Status:** OPEN — diagnosed, not yet fixed. The fix is three separate corrections in the
posting path plus a decision on the four journals already written, and it is not being
started at the tail of a long session.
