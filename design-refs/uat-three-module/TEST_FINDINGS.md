# Test findings — LP Portal, Payroll, Fundraising

**Engagement:** three-module UAT / QAT / UI-UX · branch `qa/three-module-uat-20260910`

| Severity | Open | Fixed (pending verification) | Verified |
|---|---|---|---|
| CRITICAL | 0 | 2 | 0 |
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
