# Test findings — LP Portal, Payroll, Fundraising

**Engagement:** three-module UAT / QAT / UI-UX · branch `qa/three-module-uat-20260910`

| Severity | Open | Fixed (pending verification) | Verified |
|---|---|---|---|
| CRITICAL | 0 | 6 | 0 |
| HIGH | 3 | 3 | 0 |
| MEDIUM | 2 | 2 | 0 |
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

### Fix applied

Three corrections in `PayrollService.createPayrollJournalEntry`:

1. **No double count.** The legs branch now ends in `continue`. Legs are the authoritative
   statutory record when present and the deduction rows mirror them; the deduction loop
   remains the path for employees with no legs.
2. **Currency conversion.** A `toRunCurrency` helper converts each leg by its own
   `currencyCode` using the run's `fxRateUsdZig`. A ZiG leg with no usable rate now throws
   rather than contributing a silently wrong number, and an unrecognised currency throws.
3. **Nothing is written unless it balances.** Lines are built into an array, debit and
   credit totals are summed **from that array**, and the entry and its lines are created
   only if they agree. The back-solving assignment is gone: net wages is derived from the
   components, a negative result throws, and a gap over 0.05 against the run's own net pay
   throws, because that means the breakdown and the payslips disagree.

**Correction to the diagnosis above:** the first write-up said the error was swallowed. It
was not. The caller does pass `rethrowOnError: true` and does mark the run FAILED. The
guard was wired correctly and simply could not fire, because net pay was reassigned to
`gross - PAYE - NSSA - SDL` before the check, making `totalCredit` equal `totalGrossPay`
by construction. The check validated variables, not the lines it had written.

### Verification

Full lifecycle for a fresh period, via `scripts/_uat/payroll-lifecycle-probe.mjs`:

```
Gross Pay Expense: 2026-11       dr  42209.00   cr        0.00
PAYE Payable: 2026-11            dr      0.00   cr     7820.74
NSSA/Pension Payable: 2026-11    dr      0.00   cr      474.24
SDL Payable: 2026-11             dr      0.00   cr      211.06
Net Wages Payable: 2026-11       dr      0.00   cr    33702.96
                                 ---------      ---------
                                  42209.00       42209.00      balanced
```

The arithmetic confirms the diagnosis to the cent. NSSA posts **474.24**, exactly
`378.00 + 2562.84 / 26.6291` - converted, with the doubling gone. SDL posts **211.06** =
`181.81 + 778.861 / 26.6291`.

The same run proved **P.2**: the Payroll Manager was refused 403 on approving its own run,
the CFO rejected it, the maker resubmitted, the CFO approved, the run processed. First time
this module's segregation of duties has actually functioned. The probe deletes the run and
its journal afterwards.

### Still open - the four journals already posted

The fix stops new ones; it does not touch what is already in the ledger.

```
2026-06  dr 42209.00  cr 67732.61  OUT BY 25523.61  net-pay line MISSING
2026-07  dr 42209.00  cr 67732.61  OUT BY 25523.61  net-pay line MISSING
2026-08  dr 42209.00  cr 67732.61  OUT BY 25523.61  net-pay line MISSING
2026-10  dr 42209.00  cr 67732.61  OUT BY 25523.61  net-pay line MISSING
                                   total misstatement 102,094.46 on the credit side
```

`scripts/_uat/report-unbalanced-payroll-journals.mjs` reports this and writes nothing.
Correcting posted GL is an accounting decision - a correcting journal and a void-and-repost
leave different audit trails - so its `--void` path exists but is not taken unilaterally.

### Still open - money precision on split contracts

Unchanged by this fix: it lives in the payslip calculation, not the posting. Six of twelve
payslips store a gross like `3705.9999857298969924`. The route is `splitGrossByContract`,
then rounding the ZiG leg to ZiG cents, then dividing back by the fx rate for the aggregate
with no re-rounding. The per-currency legs the employee is actually paid are clean, so
nobody is paid a wrong amount. The fix is to round the recombined aggregate while keeping
`gross - deductions = net` true after rounding, which is a change to the calculation path
and wants its own verification pass.

**Status:** FIXED (pending verification) — diagnosed, not yet fixed. The fix is three separate corrections in the
posting path plus a decision on the four journals already written, and it is not being
started at the tail of a long session.

---

## FINDING-005

**Title:** Role checks match role names as raw substrings, so every applicant is an Investment Committee member and the Board Chair has fundraising edit rights
**Module:** Fundraising (root cause is shared authorisation) · **Dimension:** UAT
**Category:** Permission
**Severity:** CRITICAL
**Persona affected:** every external applicant; Board Chair; Accountants; any Officer
**Surface:** backend

### Steps to reproduce

1. Read `hasAnySignal` in `src/services/performanceScorecardSupport.ts`.
2. Evaluate `DealExecutionPackAccessService.isIcMember` against a user whose role is
   `applicant`.
3. Evaluate `FundraisingAccessService.isInvestorRelations` against roleCode `BOARD_CHAIR`.
4. `POST /api/fundraising/campaigns` as `board.chair@nts.com`.

### Expected

A role check identifies the role it names.

### Actual

`hasAnySignal` matches each fragment as a **plain substring** across four fields — role
name, role code, department role and department:

```ts
return fragments.some((fragment) =>
  signals.some((signal) => signal.includes(fragment.toLowerCase()))
);
```

Several call sites pass two- and three-letter fragments, which collide with ordinary
words:

| Predicate | Fragment | Collides with | Grants |
|---|---|---|---|
| `isIcMember` | `"ic"` | **appl·ic·ant**, off·ic·er | Investment Committee access to deal execution packs |
| `isInvestorRelations` (fundraising) | `"ir"` | **cha·ir**, d·ir·ector | **edit** rights over all fundraising data |
| `isInvestorRelations` (quarterly statements) | `"ir"` | same | statement access |
| `isCompliance` (fundraising) | `"cco"` | **a·cco·untant** | view **and close** deals |
| `isCco` (deal packs) | `"cco"` | a·cco·untant | CCO authority |

Measured against the 36 real users in this database:

```
InvestmentCommittee      10 of 36 users matched — ALL unintended
                         6 of them external applicant accounts
IR -> fundraising EDIT    1 of 36 matched — board.chair@nts.com, via roleCode BOARD_CHAIR
```

Every external founder who applies for funding was classified as an Investment Committee
member. The Board Chair held edit rights over fundraising data through the letters in
"chair".

### Evidence

`POST /api/fundraising/campaigns` as `board.chair@nts.com` was admitted past
`requireFundraisingEdit` before the fix and returns **403** after it.

**Reproducibility:** Always
**Suspected area:** `FundraisingAccessService`, `DealExecutionPackAccessService`,
`QuarterlyStatementAccessService`, all via `hasAnySignal`
**Upstream dependency?** **Yes** — `hasAnySignal` is shared by 26 call sites.

### Fix applied

The tempting fix is to make `hasAnySignal` match on word boundaries. That would have
broken it: fragments like `"_mgr"` and `" manager"` are deliberately infix, and `` would
stop them matching `hr_mgr`. Changing shared matching semantics under 26 call sites to fix
five of them is the wrong trade.

Instead the five ambiguous fragments were removed at their call sites, and an exact
role-code check added where a code exists:

- `isIcMember` — dropped `"ic"`, added exact `INV_COMM_MEM` / `IC_MEMBER`. The real code
  existed in `hardcodedRoles.ts` and was never checked.
- `isInvestorRelations` ×2 — dropped `"ir"`, added exact `IR` / `INVESTOR_RELATIONS`.
- `isCompliance` and `isCco` — dropped `"cco"`. `isCco` already had an exact `CCO` check,
  so the fragment added nothing but the collision.

Nothing was weakened: the unambiguous fragments that identify the intended roles are
untouched.

### Verification

Against the 36 real users, and against synthetic users holding each intended role:

```
unintended matches   IC 10 -> 0     IR 1 -> 0
intended still match Investor Relations, roleCode IR, Compliance Officer, roleCode CCO,
                     Investment Committee Member, roleCode INV_COMM_MEM   — all YES
former collisions    applicant, Board Chairman, Accountant, deptRole Officer — all clean
Compliance Officer   still matches, still 1 user
```

At the endpoint:

```
board.chair@nts.com           POST /fundraising/campaigns -> 403  (was admitted)
payroll.compliance@nts.local  POST /fundraising/campaigns -> 403  (view+close, not edit)
perf.sysadmin@nts.local       POST /fundraising/campaigns -> 400  (past the guard)
```

**Status:** FIXED (pending verification) — re-asserted every cycle as roadmap item **X.5**.

---

## FINDING-006

**Title:** An external LP can read the whole fundraising module — commitments, KYC cases, DDQ evidence, data rooms
**Module:** Fundraising · **Dimension:** UAT · **Category:** Permission / Data Integrity
**Severity:** CRITICAL
**Persona affected:** every investor in the pipeline; every LP is a potential reader
**Surface:** backend

### Steps to reproduce

1. Sign in as `lp.test@arcus.co.zw` through the **LP portal** (`portal: "lp"`).
2. With that token, `GET /api/fundraising/commitments/frs-commit-001`.
3. Repeat against `/api/fundraising/kyc-cases`.

### Expected

Fundraising is an internal module. An external LP token reaches none of it.

### Actual

**200**, with another investor's full commitment record:

```
commitmentAmount     15000000          currency  USD
investor             {...}             investorId frs-inv-01
sideLetter           ...               complianceStatus CLEARED
capitalCallContact   capital.calls@arcus.example
signedAt / admissionDate / fundedAmount / status FUNDED
```

`fundraisingRoutes.ts` applied `router.use(authenticate)` and then guarded routes
individually. **67 of its 179 route declarations carried no fundraising guard at all** —
`/commitments`, `/closings`, `/mandates`, `/communications`, `/kyc-cases/:caseId`,
`/ddq/cases/:caseId/export`, `/ddq/cases/:caseId/items/:itemId/evidence/:evidenceId/download`,
`/data-rooms/:dataRoomId` among them. `authenticate` proves a token is valid; an LP portal
token is valid.

The irony is instructive: the LP Portal's own routes passed every isolation axis in this
engagement (X.1–X.3, 104 cross-tenant attempts, zero leaks) because
`LpPortalAccessService` derives scope from the token's user. The disclosure was in the
module the LP is not supposed to be able to reach at all.

**Reproducibility:** Always
**Suspected area:** `nvccz/src/routes/fundraisingRoutes.ts`
**Upstream dependency?** No — the fundraising router itself.

### Fix applied

`router.use(requireInternalStaffUser())` immediately after `authenticate`, refusing the
whole module to external portal accounts rather than route by route — so a route added
later cannot silently reopen it.

Verified safe before applying: `lib/api/fundraising-api.ts` is the only client, and it is
imported solely by `components/fundraising`, `lib/fundraising`, `components/portfolio-v11-mock`
and `lib/portfolio-v11` — all staff surfaces. No LP or investee screen touches it, and the
router has no token-based public routes.

### Verification

```
                 commitment   kyc-cases
EXTERNAL LP         403          403      (was 200 / 200)
plain staff         200          200
fund manager        200          200
compliance          200          200
sysadmin            200          200
```

### Still open — internal least privilege

A plain Operations Member still reads commitments and KYC cases at 200. That is a
different question from external exposure: it is about which *staff* should see what, it
spans 67 routes, and over-tightening would break working staff screens. Recorded rather
than fixed, because choosing the internal audience for each of those routes is a product
decision, not a regression fix.

**Status:** FIXED (pending verification) for the external exposure; internal least
privilege above remains open.

---

## FINDING-007

**Title:** Fundraising approvals can be decided by the person who requested them
**Module:** Fundraising · **Dimension:** UAT · **Category:** Permission
**Severity:** HIGH
**Persona affected:** Fund Manager, and anyone relying on an approval as a control
**Surface:** backend · **Screen / Flow:** approvals, roadmap **F.3**

### Steps to reproduce

1. `POST /api/fundraising/approvals` as a Fund Manager.
2. `POST /api/fundraising/approvals/:approvalId/decide` as **the same user**.

### Expected

An approval is a second pair of eyes. The requester cannot decide their own request.

### Actual

Both routes are guarded by the same `requireFundraisingEdit`, and
`FundraisingSrdService.decideApproval` never compares the deciding `userId` with
`existing.requestedById`. It checks only that the request exists and is `PENDING`.

This is not hypothetical. **Every approval in the database was decided by the person who
raised it**, including a closing sign-off:

```
cmtucutvd0085unjok9dvb98e  APPROVED  req=oqfojl  dec=oqfojl  OPPORTUNITY STAGE_OVERRIDE
frs-appr-05                REJECTED  req=oqfojl  dec=oqfojl  OPPORTUNITY STAGE_OVERRIDE
frs-appr-04                APPROVED  req=oqfojl  dec=oqfojl  CLOSING     CLOSING_SIGN_OFF
```

5 of 5, same actor on both sides.

The data model anticipates two people: `fundraising_approval_requests` carries
`requested_by_id` and `decided_by_id` as separate columns, and the module already
distinguishes authority elsewhere with a separate `requireFundraisingClose` guard. Payroll
states the same principle explicitly — *"the maker and the checker are never granted to
the same non-admin role"* — and this module has no equivalent.

**Reproducibility:** Always
**Suspected area:** `nvccz/src/services/fundraising/FundraisingSrdService.ts` line ~1582,
`nvccz/src/routes/fundraisingRoutes.ts` line ~290

### Recommended fix — needs a policy decision first

`decideApproval` should refuse when `userId === existing.requestedById`, mirroring
payroll's maker-checker.

**Not applied unilaterally.** In a small firm the Fund Manager may be the only holder of
`requireFundraisingEdit`, in which case refusing self-decision blocks the approval
workflow entirely rather than strengthening it. The right shape is probably a distinct
approver capability — as payroll has with `runs.approve` — rather than a bare
requester-not-decider check. That is a product decision about who approves, and it is
raised rather than imposed, the same way the four already-posted journals were.

**Status:** OPEN — diagnosed and evidenced, fix recommended, awaiting a decision on who
should hold approval authority.

---

# Cycle 0 — Fundraising lifecycle (F.1, F.2, F.3, F.5)

Run as the Fund Manager via `nvccz/scripts/_uat/fundraising-lifecycle-probe.mjs`,
**two full cycles**, per the brief.

| Step | Result |
|---|---|
| campaign created | PASS |
| submitted for approval, decided, **activated** | PASS |
| opportunity created | PASS |
| pipeline stages seeded per campaign | PASS — 13 stages |
| opportunity advanced through stages | PASS — 2 transitions each |
| commitment recorded, amount stored as submitted | PASS — 11,000,000 / 12,000,000 USD |
| approval request raised and decided | PASS |
| closing created | PASS |
| **F.5** metrics report what was committed | PASS — matches the rows exactly |
| campaign target unchanged | PASS — 50,000,000 |
| row counts return to baseline | PASS — nothing left behind |

**2 for 2, no defects found in the lifecycle itself.**

Two things learned in the process rather than assumed:

**The lifecycle is longer than the brief describes.** A campaign starts DRAFT and refuses
opportunities — *"Campaign must be ACTIVE to create opportunities"* — and activation runs
through its own approval. So the real sequence begins `submit-for-approval → decide →
activate`, which the first version of the probe skipped entirely.

**A probe correction, made before its numbers were trusted.** F.5 initially read
`GET /campaigns/:id` and reported *"API says 0 while 11,000,000 is committed"* across both
cycles. That was the probe's mistake: the campaign record carries `targetCapital` and no
raised figure at all. The raised totals live on `/campaigns/:campaignId/metrics` under
`commitmentTotals`, and read there the assertion passes. This is the second time in this
engagement that a measurement error nearly produced a false finding, and the second time
checking the ground truth first prevented one.

**FINDING-007 reproduced in both cycles** — the requester decided its own approval and was
allowed. Logged by the probe as a NOTE rather than asserted either way, because the policy
decision on approver authority is still open.

---

## FINDING-008

**Title:** A commitment recorded in Fundraising never becomes an LP capital account — the two modules use different commitment models and nothing bridges them
**Module:** Fundraising → LP Portal · **Dimension:** UAT · **Category:** Functional
**Severity:** HIGH
**Persona affected:** every LP who commits capital; IR reporting on what was raised
**Surface:** backend · **Screen / Flow:** roadmap **F.4**, the handoff

### Steps to reproduce

1. Run the fundraising lifecycle to a recorded commitment (F.1 does this).
2. Query `investment_commitments`, which is what the LP Portal reads.
3. Look for the commitment.

### Expected

Capital committed through Fundraising appears in the committing investor's LP portal.

### Actual

It does not, and cannot, because the two modules keep commitments in **different tables**:

| | Table | Keyed by | Written by |
|---|---|---|---|
| Fundraising writes | `fundraising_commitments` | opportunity / investor / campaign / fund | `POST /fundraising/commitments` |
| **LP Portal reads** | `investment_commitments` | `(clientId, fundId)` unique | `ClientService`, `FundraisingCloseService` |

Measured in this database:

```
fundraising_commitments   5     with a client_id populated: 0
investment_commitments    6     <- what the LP Portal reads
ORPHAN A: 5 of 5 fundraising commitments have no matching investment_commitment
   frs-commit-001   15,000,000 USD  FUNDED              client=NONE
   frs-commit-002   25,000,000 USD  PARTIALLY_FUNDED    client=NONE
   frs-commit-003   12,000,000 USD  SIGNED              client=NONE
   frs-commit-011   18,000,000 USD  FUNDED              client=NONE
   frs-commit-012    9,000,000 USD  ADMITTED_AT_CLOSE   client=NONE
```

**79,000,000 USD of committed capital, two of it marked FUNDED, none of it visible to any
LP.** The `client_id` column on `fundraising_commitments` is the intended link and is
never populated.

There **is** promotion code — `FundraisingCloseService.closeDeal` creates the `Client`, the
`InvestmentCommitment` and a portal user. It is unreachable from the product:

- it is invoked only from **deal** paths (`/deals/:dealId/close`, `FundraisingDealService`,
  `FundraisingAgreementService`)
- the frontend client states outright, in its own header, *"Mounts: /fundraising,
  /investors — never /v1 or /fundraising/deals"*, and calls only campaigns, opportunities,
  commitments and closings
- `fundraising_pipeline_deals` holds **0 rows** — the legacy path has never been used here
- the SRD `createClosing` writes a `fundraising_closings` row and promotes nothing

Orphan direction B is clean: all three LP portal users do have commitments behind them.
But those came from seeds — every `investment_commitments` row is labelled `LP-SRD-SEED`
or `Portfolio V11 full demo commitment`. **The promotion has never run in either
direction.**

### This qualifies an earlier result

X.1–X.3 verified that LP capital accounts reconcile to their allocation rows, and they do.
That reconciliation is against **seeded** commitments, not against anything Fundraising
produced. The LP Portal is internally consistent; it is simply not connected to the module
that is supposed to feed it.

**Reproducibility:** Always
**Suspected area:** `FundraisingSrdService.createClosing`, `FundraisingCloseService`
**Upstream dependency?** Cross-module by nature — the seam itself is the defect.

### Recommended fix — needs a product decision first

Wire the SRD closing path to the promotion that already exists, rather than writing a
second one. The open questions are genuinely product ones, and getting them wrong creates
client records and sends investor invitations:

1. **When does promotion fire?** On closing creation, on a closing reaching a terminal
   status, or on a commitment reaching `ADMITTED_AT_CLOSE`? The commitment statuses in the
   data (`SIGNED`, `ADMITTED_AT_CLOSE`, `PARTIALLY_FUNDED`, `FUNDED`) suggest
   `ADMITTED_AT_CLOSE` is the intended trigger.
2. **How does `investor_organisations` map to `Client`?** `closeDeal` creates a Client from
   a deal's prospect fields. The SRD path has an `investor_organisation`, which is a
   different record with different fields.
3. **Is portal access auto-provisioned?** `closeDeal` creates a portal user and sends an
   invitation. Doing that automatically on every close is a policy choice, not a bug fix —
   and with the mail guard off it emails real investors.

Not implemented unilaterally for the same reason the four unbalanced journals were not:
the mechanical part is small, and the decision it encodes is not mine to make.

**Status:** OPEN — diagnosed, quantified and evidenced; fix recommended, awaiting a
decision on trigger, mapping and auto-provisioning.

---

## FINDING-009

**Title:** Data room access control is dead code, and failed document access was never logged
**Module:** Fundraising · **Dimension:** UAT / QAT · **Category:** Permission / Functional
**Severity:** HIGH (access control) · MEDIUM (unhandled error)
**Persona affected:** every investor whose data room documents are held
**Surface:** backend · **Screen / Flow:** data rooms, roadmap **F.8**

### Steps to reproduce

1. `GET /api/fundraising/data-rooms/frs-dataroom-01` as any staff user holding no grant.
2. `GET .../documents/:documentId/download` for a document whose file is not stored.
3. Count rows in `fundraising_data_room_access_logs` before and after.

### Actual — three defects in one function

**1. The access check cannot fire.** `FundraisingSrdService.downloadDataRoomDocument`:

```ts
const access = await prisma.fundraisingDataRoomAccess.findFirst({
  where: { dataRoomId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
});
const isStaff = true; // route is authenticated staff; investor portal would check access.investorId
if (!isStaff && !access) {
  throw FundraisingIrError.forbidden("No data room access", "ACCESS_DENIED");
}
```

`isStaff` is the literal `true`, so `!isStaff` is always false and the `ACCESS_DENIED`
branch is unreachable. The `access` row is queried and then discarded — and the query does
not filter on `investorId` at all, so it would match *any* live grant on the room rather
than the caller's.

The consequence is that everything the access model expresses is unenforced:
`permission_level` (VIEW vs DOWNLOAD), `download_limit`, `expires_at` and `revoked_at`.
Two of the six grants in this database are **REVOKED** and that is not honoured.

Confirmed by measurement — three staff users, none holding any grant:

```
perf.employee@nts.local        10 docs, 5 folders
payroll.compliance@nts.local   10 docs, 5 folders
fr.fundmanager@nts.local       10 docs, 5 folders
grants are held by investors:  frs-inv-01, frs-inv-02, frs-inv-03
```

**2. Failed access was never logged.** The log write sat *after* the file fetch, so a
download that threw left no trace. The table carries `success` and `failureReason` columns
that nothing populated. An access log that records only successful reads is not an access
log — and for a data room it is the control that matters most.

**3. A missing stored file produced an unhandled 500.** `doc.fileUrl!` asserted non-null on
a nullable column, so a document row with neither `storagePath` nor `fileUrl` reached
`RemoteUploadService` and threw `Cannot read properties of null (reading 'split')`.

### Fix applied — defects 2 and 3

Every attempt is now logged, before the result is known and regardless of outcome, with
`success` and `failureReason` populated; a logging failure is caught so it can never mask
the download result. A document with no stored file returns a clean **404
`DOCUMENT_FILE_MISSING`** instead of a TypeError.

Verified:

```
download returns: 404 {"code":"DOCUMENT_FILE_MISSING","message":"This document has no stored file"}
access logs 18 -> 19
newest row: {"action":"DOWNLOAD","success":0,"failure_reason":"DOCUMENT_FILE_MISSING","user_id":"..."}
```

The probe's own log row is left in place. `fundraising_data_room_access_logs` is an
append-only audit table, and deleting rows to tidy a test run is exactly the wrong
instinct — the same position taken on the fundraising audit trail earlier.

### Not fixed — defect 1, the dead access check

Making the check live requires deciding what it should mean for a **staff** caller, and
the comment in the code shows the author knew: *"investor portal would check
access.investorId"*. There is no investor-facing route today, so there is no investor
context to check against, and simply deleting `isStaff` would refuse every staff user and
take the feature down.

The shape it probably wants: staff access scoped to the campaign that owns the data room
(which `requireFundraisingView` already provides on the campaign-scoped routes but not on
`/data-rooms/:dataRoomId`), and grant enforcement — `permission_level`, `expires_at`,
`revoked_at`, `download_limit` — applied when an investor context exists. That is the same
internal least-privilege decision recorded under FINDING-006, and it is raised rather than
guessed at.

**Status:** FIXED (pending verification) for the logging and error defects; the dead access
check is **OPEN** pending a decision on staff scoping.

---

## FINDING-010

**Title:** The payroll command centre reports the wrong USD figure and zero ZiG on every run
**Module:** Payroll · **Dimension:** UI-UX / UAT · **Category:** Calculation
**Severity:** HIGH
**Persona affected:** anyone reading the payroll landing screen — Payroll Manager, CFO, CEO
**Surface:** Internal App · **Screen:** Payroll Operations Command Centre, roadmap **P.3**
**Viewport:** All

### Steps to reproduce

1. Sign in to the staff portal and open `/payroll`.
2. Read the two "Gross payroll" cards.
3. Compare with `employee_payroll_legs` for the run they name.

### Expected

Cards labelled *"2026-10 USD component"* and *"2026-10 local component"* report that run's
USD and ZiG components.

### Actual

```
on screen        USD 42,209.00        ZiG 0
in the legs      USD 36,359.30        ZiG 155,772.24
```

The USD card overstated its component by **5,849.70** — it was showing the *combined*
total — and the ZiG card reported **nothing at all** against 155,772.24 ZiG of actual
local-currency payroll. Both wrong on **all four** completed runs.

Three causes, in `lib/payroll-v6/live-loaders.ts`:

```ts
grossUSD: gross,                                                    // the COMBINED total
grossZiG: num(r.fxRateUsdZig) > 0 && r.dualCurrency ? gross * num(r.fxRateUsdZig) : 0,
```

1. `grossUSD` was `totalGrossPay`, the combined figure, presented as the USD component.
2. `grossZiG` was the *whole run* re-expressed in ZiG, not the ZiG component — so even
   with the flag set it would have shown 1,123,982, which is also not the answer.
3. `dualCurrency` is **false on every run in this database** despite each carrying ZiG
   legs, so the expression short-circuited to `0`.

`GET /payroll/payroll-runs` exposed no per-currency data at all, so the UI had nothing true
to read.

This is the pattern the repo's own guidance warns about — *"Hardcoded values masquerading
as live data… don't trust a plausible-looking number"*. It also survived the earlier
number-tracing work, because `0` and `42209` both trace to real sources. They are simply
the wrong sources.

**Reproducibility:** Always, all four completed runs
**Suspected area:** `nvccz/src/controllers/PayrollController.ts` `getAllPayrollRuns`,
`nvccz-new/lib/payroll-v6/live-loaders.ts` `adaptRuns`

### Fix applied

`getAllPayrollRuns` now aggregates `employee_payroll_legs` by currency for the runs it
returns and attaches `grossUsdComponent`, `grossZigComponent`, `currencyComponents` and
`isDualCurrency`. Components are **null**, not `0`, when a run has no legs in that
currency — so a run with nothing recorded cannot assert a zero.

`adaptRuns` reads those, falling back to the combined total only for runs with no legs at
all, where the USD component genuinely is the total.

`dualCurrency` was left alone. It is wrong, but nothing now depends on it, and correcting
a stored flag across historical runs is a data migration rather than part of this fix.

### Verification

In the browser, at `/payroll`:

```
before   Gross payroll USD 42,209.00 · 2026-10 USD component
         Gross payroll ZiG 0         · 2026-10 local component
after    Gross payroll USD 36,359.30 · 2026-10 USD component
         Gross payroll ZiG 155,772   · 2026-10 local component
```

API, showing the empty draft run correctly reporting null rather than zero:

```
2026-10  total 42208.99995  USD comp 36359.3  ZiG comp 155772.245  dual=True
2026-09  total 0            USD comp None     ZiG comp None        dual=False
```

**Status:** FIXED (pending verification).

---

# Cycle 0 — X.8 tab navigation

The roadmap flags this as a **C-tier** item because the codebase has a documented history of
it: *"tabbed pages navigate to a different route instead of switching content in place —
found on Reviews, Reports, Enterprise Risk Register in Performance; Application tab in Deal
Detail."*

Tested in a real browser. For each control: record URL and a content hash, click, wait,
record again. A defect is any of — the URL changed, the active state did not move, or the
content did not change.

| Module | Group | Controls | Result |
|---|---|---|---|
| Payroll | chart range 6M / 12M / 24M | 3 | in place |
| Payroll | chart series Both / USD / ZiG | 3 | in place |
| Payroll | department mode | 3 | in place |
| Payroll | Earnings & Deductions filters | 4 | in place — rows 18 → 13 → 10 → 11 → 8 |
| Fundraising | dashboard PE/VC ↔ Asset Mgmt | 2 | in place |
| Fundraising | DDQ case selector (master-detail) | 4 | in place |
| LP Portal | period Since Inception / 3Y / 1Y / YTD | 5 | in place |

**24 controls across 7 groups in all three modules. None navigated away. None failed to
switch.** The historical defect does not reproduce on the surfaces tested.

### Three measurement corrections, all made before reporting

Each of these would have produced a false finding:

1. **Chart toggles measured on `innerText`.** Series and department toggles reported "no
   content change" because they redraw an **SVG** — the text is identical. Re-measured
   against the chart markup and all six pass.
2. **The already-selected item.** The DDQ sweep clicked cases in list order, so the first
   was the one already open and correctly did nothing. Re-run in an order that enters every
   case from a different one: all pass.
3. **`form_input` on React forms.** It sets a value without triggering React state, so the
   login silently never submitted and looked like a broken button. Real keystrokes work.
   All UI testing uses typing.

### Coverage — what this does and does not cover

Seven tab groups on five screens, out of **59 screens**. These are the tabbed surfaces
found on the screens visited so far, not an exhaustive sweep of the module. The remaining
screens' tabbed surfaces are still to be walked, and X.8 is not complete until they are.

---

## FINDING-011

**Title:** Four of the six KPI labels on the LP dashboard are cut off — at every viewport
**Module:** LP Portal · **Dimension:** UI-UX · **Category:** UI Inconsistency
**Severity:** MEDIUM
**Persona affected:** every LP, on their primary screen
**Surface:** LP Portal (external) · **Screen:** `/lp-portal` dashboard
**Viewport:** All — 375, 768 **and 1440**

### Steps to reproduce

1. Sign in to the LP portal as `lp.test@arcus.co.zw`.
2. Read the six KPI cards at any viewport.

### Expected

An LP can tell which figure is which.

### Actual

```
Total Com…    $25.00M          Paid-In Ca…   $1.35M
Unfunded …    $23.50M          Current NAV   $237.9K
Distributio…  $318.8K          Net IRR       1.0%
```

Four of six labels truncated. The two that matter most — **Total Commitment $25.00M** and
**Unfunded Commitment $23.50M** — both render as "…Com…" and sit next to each other, so the
LP cannot tell committed capital from uncalled capital. The helper lines underneath
("1 Commitment", "94.0% of Commitment") disambiguate them only if you already know what you
are looking at.

Measured, not eyeballed:

```
1440   "Total Commitment"     needs 125px, has 84
       "Unfunded Commitment"  needs 160px, has 84
 768   "Unfunded Commitment"  needs 160px, has 124
 375   all five money labels  need 83-160px, have 58
```

Notably this is **not** a mobile-only problem. It was worst at 375 but present at full
desktop width, which is where an LP is most likely to be reading it.

**Reproducibility:** Always
**Suspected area:** `nvccz-new/components/lp-portal/screens/lp-portal-dashboard-screen.tsx`

### Fix applied

The label was a single `truncate` line sharing a flex row with a 36px icon and the info
button, leaving it 84px inside a card a sixth of the row wide.

Wrapping to two lines was tried first and was **not enough** — "Commitment" on its own
needs 90px against 84 available, so the word still clipped. The icon and the info button
now share the top row and the label takes the card's full width beneath them, which gives
it 154px.

### Verification

At all three viewports, on the real page:

```
1440   no label clipped   no horizontal page scroll
 768   no label clipped   no horizontal page scroll
 375   no label clipped   no horizontal page scroll
```

At 375 "Unfunded Commitment" wraps to two lines and reads in full.

### Also observed, not fixed

At 375 the **"Switch module" control is positioned entirely outside the viewport**
(left edge at 414px against a 375px viewport). It is clipped rather than hidden, so it
cannot be reached on a phone. It sits in shared top-bar chrome used by the staff portal
too, so changing it reaches beyond the LP portal; recorded rather than adjusted. For an LP
specifically the module switcher has nothing to switch to, so the practical impact is low.

---

## FINDING-012

**Title:** Every fundraising screen scrolls sideways on a phone — the sidebar never collapses
**Module:** Fundraising · **Dimension:** UI-UX · **Category:** Responsiveness
**Severity:** HIGH
**Persona affected:** anyone opening fundraising on a phone or small tablet
**Surface:** Internal App · **Screen:** all 19 fundraising screens
**Viewport:** 375 and 768

### Steps to reproduce

1. Open any `/fundraising` screen at a 375px viewport.
2. Measure `document.documentElement.scrollWidth` against `clientWidth`.

### Actual

```
viewport            375
document width      457      <- 82px of horizontal page scroll
sidebar <aside>     240      still full width at 375
usable content      135px
```

The sidebar is `useState(false)` with **no responsive behaviour of any kind**. At 375 it
holds its full 240px, leaving 135px for the entire page — so the shared top bar's
right-hand cluster (187px intrinsic: module switcher, notifications, avatar) cannot fit and
extends to 457px, dragging the document 82px wider than the screen. A second "My Tasks"
rail renders at 101px alongside it.

Payroll does not have this problem: its vendored shell handles its own mobile layout and
measures a clean 375 at every screen tested. The fundraising module uses the shared chrome,
which has no mobile story.

There is already a comment in `shared-topbar.tsx` recording that someone hit a related
375px problem — the search field overlapping the right-hand controls — and fixed the centre
section's margins. The right section's ability to push the document wider was left.

**Reproducibility:** Always, every fundraising screen
**Suspected area:** `nvccz-new/components/layout/fundraising-sidebar.tsx`

### Fix applied

The sidebar already had a working `collapsed` state at 68px; it was only ever driven by the
user's own toggle. It now also tracks a `(max-width: 1023px)` media query, so it starts
collapsed on small screens and expands again when the window grows. A manual toggle holds
until the breakpoint itself changes.

Chosen over hiding the sidebar behind a hamburger, which would have meant designing a
mobile navigation pattern for a 19-screen module — design work, not a defect fix. Collapsed
to icons keeps every destination reachable.

### Verification

```
375   /fundraising              sidebar 68px   document 375   no page scroll
375   /fundraising/investors    sidebar 68px   document 375   no page scroll
                                table 960px wide, inside its own scroll container — correct
1440  /fundraising/investors    sidebar 240px  document 1425  no page scroll
```

Desktop is unchanged.

### A measurement correction that mattered

The first pass over these screens used `window.innerWidth` as the viewport and reported
them **clean**. In the emulated pane `innerWidth` reads 457 while the real layout viewport
(`documentElement.clientWidth`) is 375 — so the overflow threshold was 82px too lenient,
which is exactly the size of the overflow. Re-measured against `clientWidth`, the defect
appeared immediately. The payroll results were gathered while `innerWidth` happened to read
375 correctly and were re-confirmed against `clientWidth` afterwards.

This is the fourth measurement error caught before reporting in this engagement, and the
first that was hiding a real defect rather than inventing one.

---

# Cycle 0 — X.10 responsive sweep, all 59 screens

`nvccz/../nvccz-new/scripts/_uat/responsive-sweep.mjs` — every screen in the three modules
at 375, 768 and 1440. **174 screen/viewport checks.** Scripted rather than hand-driven
because the brief requires this re-run on every verification cycle.

| Module | Screens | Checks | Failing |
|---|---|---|---|
| Payroll | 20 | 60 | **0** |
| Fundraising | 20 | 60 | **0** |
| LP Portal | 18 | 54 | 0 after the module-switcher fix (dedicated run) |

**No screen in any module forces horizontal page scroll at any viewport** — the roadmap's
actual X.10 criterion — after FINDING-011 and FINDING-012 were fixed. Every wide table sits
in its own `overflow-x` container, which is the pattern the roadmap asks for.

### The module switcher, fixed

The LP top bar rendered `ModuleSwitcherButton` unconditionally with `shrink-0`, so it could
not compress and sat outside the viewport on **all 18 LP screens at 375 and 768** — the
sweep failed every one of them on that single control. It is now hidden below `lg`,
matching the pattern the same file already uses (`lg:hidden` on the menu, `md:block` on
search). Safe to hide rather than relocate: an LP holds one module and `modules.ts` marks
`lp-portal` `hiddenFromSwitcher`, and small-screen navigation lives in the sheet menu.

### Still open

- **`/lp-portal/subscriptions-redemptions` renders thin** at 375 (83 chars) and 768 (142),
  but not at 1440. Content that only appears at desktop width.
- **A control reading "1 portal items need …" sits off-screen at 768** on most LP screens.
  A freshly loaded page at the same viewport has no such element and no offscreen control
  at all, so it is transient; removing toast containers before measuring did not clear it,
  and the cause is not yet established. It causes no page scroll.

### Six measurement corrections, all made before reporting

This sweep produced more false results than real ones until it was corrected. Recorded
because the corrections are the reason the numbers can be trusted:

1. **`innerWidth` vs `clientWidth`.** Under emulation `innerWidth` read 457 against a real
   375 layout, making the overflow threshold 82px too lenient — exactly the size of the
   fundraising overflow it was meant to catch. **This one was hiding a real defect.**
2. **Fixed waits.** 3500ms on the first viewport and 1200ms on the rest reported 20 screens
   as "renders empty" that were still compiling. The giveaway: the same route passed at one
   viewport and failed at another. Now waits for content.
3. **Controls inside horizontal scrollers.** Payroll's row actions live in `.table-wrap`
   (`clientWidth` 349, `scrollWidth` 704) and are reached by scrolling the table — the
   pattern the roadmap requires. Seven false failures.
4. **Toasts caught mid-animation.** A toast raised on the previous route was still sliding
   in when the next was measured, reported as an unreachable control on 16 screens.
5. **No route-integrity check.** The sweep measured whatever it landed on: an aliased route
   scored "ok" against the screen it had been redirected to.
6. **Deliberate aliases treated as failures.** Eight LP routes redirect to merged screens by
   design — `dealing/page.tsx` is a bare `redirect(...)`. Now recorded as expected, and only
   an unintended destination fails.

### A correction to something reported earlier in this session

I said `/lp-portal/performance` redirects to a blank dashboard. **It does not.** That
reading came from a browser session left stale by the dev-server restart. With the route
check in place, `/performance` loads its own screen at all three viewports.

### Known limitation

A full three-module run takes ~20 minutes and the LP session expired partway through the
last one, turning the tail into `redirected to /login`. Per-module runs
(`--module=lp`) avoid it. Worth re-seeding auth per module before the Stage 4 cycles.

---

## FINDING-013

**Title:** When the payroll permission call fails, every screen tells the user their role lacks access
**Module:** Payroll · **Dimension:** UI-UX / QAT · **Category:** Missing State
**Severity:** MEDIUM
**Persona affected:** every payroll user, during any backend disruption
**Surface:** Internal App · **Screen:** all 20 payroll screens · roadmap **X.9**

### Steps to reproduce

1. Sign in as System Administrator, who holds all 34 payroll grants.
2. Make `GET /api/payroll/me/access` return 500. Nothing else.
3. Open any payroll screen.

### Expected

A screen that cannot determine the user's access says so, and offers a retry.

### Actual

> **You do not have access to this page**
> Your role does not hold the payroll permission this screen requires.

Shown to an account holding **every** payroll permission. Isolated to the single call:

| Failing call | Result |
|---|---|
| `/payroll/me/access` | **"You do not have access to this page"** on every screen |
| `/payroll/employees` | screen renders normally — a data failure does not cause it |

The cause is in `lib/payroll-v6/live-loaders.ts`:

```ts
const access = await safe<PayrollAccess | null>("me/access", getMyPayrollAccess, null)
const permissions = new Set(access?.permissions ?? [])
```

`safe()` swallows the failure and yields `null`, which collapses to an **empty permission
set**. Every `has()` returns false, so `permittedPage()` refuses each screen and the runtime
renders `__pr6DeniedPageHtml`. "Could not determine access" and "has no access" are
indistinguishable by the time the UI sees them.

Failing closed is the right posture and is not in question. The **message** is: during an
outage every payroll user is told their access has been revoked, which invites support
escalations and can mask a real incident. It is also the opposite of actionable — the user
retries nothing, because they have been told it is a permissions problem.

Two screens behave differently and are worth noting: `/payroll` and `/payroll/mypay` render
their normal content with no indication anything failed at all.

**Reproducibility:** Always
**Suspected area:** `nvccz-new/lib/payroll-v6/live-loaders.ts` line ~349, and the runtime's
`__pr6DeniedPageHtml` path

### Recommended fix — not applied

Carry the distinction rather than collapsing it: have the loader report
`accessUnavailable` when the call fails, and give the runtime a second panel for that case —
"We could not verify your access. Retry." — separate from the permission refusal.

Not applied here because the second half is a runtime change and must go through
`scripts/patch-payroll-runtime.mjs`. This project has a recorded incident where a rushed
runtime patch matched `[^
]*` across a minified line and ate the entire page registry;
that happened at the tail of a long session, which is exactly where this sits. The
diagnosis is complete and the change is small — it should be made deliberately, at the
start of a session, with the patch re-run and verified.

**Status:** OPEN — diagnosed and isolated to a single call; fix designed, deliberately not
made late in a session.

---

# Cycle 0 — X.9 instrument

`scripts/_uat/state-sweep.mjs` induces each state deterministically by intercepting the
API, rather than waiting for the backend to misbehave:

| State | Induced by | A screen fails when |
|---|---|---|
| error | every `/api/**` returns 500 | it goes blank, or says nothing about the failure |
| empty | every `/api/**` returns `{success:true,data:[]}` | it goes blank, or shows no empty state |
| loading | every `/api/**` held 4s | nothing is on screen — no skeleton, no text |

Only the data API is intercepted; Next's own assets load normally, or every screen would
fail for the wrong reason.

**First run — payroll, error state: 20 of 20 screens.** 18 report the permission denial
above; `/payroll` and `/payroll/mypay` render as though nothing is wrong. The remaining
states and the other two modules have not been run yet.

`scripts/_uat/_routes.mjs` now holds the screen list, the deliberate LP aliases and the
auth seeding, shared by both sweeps so they cannot drift apart.
