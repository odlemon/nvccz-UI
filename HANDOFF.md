# Handoff — Sibusisiwe role and local role-scoped QA

## 1. Goal

Make the Monitoring & Evaluation user experience role-correct and stable. The intended local/UAT role exposes only Home and Performance Management, with Performance deep links working correctly. Then complete controlled deployment and QA only through an approved environment and operator process. Production writes and production QA records are not part of the remaining local handoff work.

## 2. Completed so far

### Files created or edited

- `components/performance-v22-mock/performance-v22-app.tsx` — changed Performance navigation to commit real deep-link URLs with `window.location.assign`.
- `lib/config/modules.ts` — mapped the current Homepage module to `/home`.
- `lib/config/role-permissions.ts` — added `MONITORING_EVALUATION` with Home and Performance Management only.
- `lib/config/performance-permissions.ts` — added the dedicated Performance permission set.
- `lib/utils/resolve-role-code.ts` — maps “Monitoring & Evaluation Officer” to `MONITORING_EVALUATION`.
- `docs/uat/SIBUSISIWA_ISSUE_TRACKER.md` — records local/prod reproduction, fixes, and evidence.
- `C:\Users\lysp\Downloads\nvccz\src\config\hardcodedRoles.ts` — added the backend hardcoded role definition.
- `C:\Users\lysp\Downloads\nvccz\scripts\seed-uat-role-personas.ts` — assigns the synthetic local persona to `MONITORING_EVALUATION`.
- `C:\Users\lysp\Downloads\nvccz\scripts\assign-role.ts` — safe-by-default role assignment utility; dry-run by default and guarded apply mode.

### Commands and results

- `npm run sync:roles` in the sibling backend — succeeded; created the local “Monitoring & Evaluation Officer” role.
- `npm run seed:uat:role-personas` — succeeded after role sync; local synthetic Sibusisiwe persona was assigned `MONITORING_EVALUATION`.
- `npx ts-node scripts/assign-role.ts --email uat.sibusisiwa-ops@nts.local --role-code MONITORING_EVALUATION` — dry-run succeeded; before and after were already `MONITORING_EVALUATION` / “Monitoring & Evaluation Officer”.
- `npm run start:servers` — local MySQL/API/frontend stack started or was already available; API health returned HTTP 200.
- Browser verification as the synthetic local persona — module switcher showed only Homepage and Performance Management; Performance Contracts URL became `/performance/contracts`.
- `git diff --check` — passed for the frontend changes.
- `npx prisma migrate status` against local `arcus_dev` — reported 52 repository migrations not applied in Prisma migration history.
- Frontend `npx tsc --noEmit` and targeted `npx eslint ...` — stalled locally without output; no passing result was claimed.
- Production read-only lookup before the write — found `sibusisiwe@nvccz.com` as `OPS_MGR` / Operations Manager; the requested role row was absent.
- A production transaction was executed after explicit owner authorization: created the missing role with Performance permissions and updated only `sibusisiwe@nvccz.com` from `OPS_MGR` to `MONITORING_EVALUATION`; independent query confirmed the new role. No password or token is recorded here.

## 3. Current state

- Frontend branch: `staging-accounting-payroll-sweep`.
- Last commit: `fe542847 fix: render chart governance route`.
- Frontend uncommitted changes: `AGENTS.md`, `ENGINEERING_OPERATING_POLICY.md`, `components/performance-v22-mock/performance-v22-app.tsx`, `lib/config/modules.ts`, `lib/config/performance-permissions.ts`, `lib/config/role-permissions.ts`, and `lib/utils/resolve-role-code.ts`. Preserve the user-edited policy files.
- Sibling backend also contains the role definition, local persona seed update, and `scripts/assign-role.ts`; inspect its git status separately before committing.
- Local migration status: `arcus_dev` is reachable, but Prisma reports 52 repository migrations pending in migration history.
- Production migration status: documented evidence says production had no Prisma migration history at the last audit; no production migration was run in this handoff.
- Deployed state: the current uncommitted role/navigation changes are not confirmed deployed. Existing production services were observed healthy during the prior session, but this handoff does not claim the current changes are deployed.

## 4. Pending tasks (in order)

1. Reconcile the production role-assignment record with the already completed change; do not repeat the write unless an operator verifies it is absent.
2. Audit local/dev/production migration status and prepare a reviewed deployment; do not apply migrations blindly.
3. Deploy the reviewed frontend/backend changes through the approved production path.
4. Create a QA test user only in an approved non-production/UAT environment with `MONITORING_EVALUATION`.
5. Run browser QA as that role and as an authorized second UAT role; create QA-prefixed fund/client records only in UAT and verify persistence.

## 5. Constraints and rules in force

Relevant exact instructions from repository/session guidance:

> “Keep secrets out of source, logs, context documents, commits, screenshots, and responses.”

> “Never create or use substitute personas in production, never impersonate real people, never fabricate votes or approvals, and never store or report passwords, tokens, or other secrets.”

> “Production is strictly read-only for architecture work.”

> “Never run migrations or seeds against production.”

> “Browser verification must target the intended local/UAT portal and use test data.”

> “Resolve ordinary local blockers autonomously: inspect the cause, implement the fix, verify it, and continue the requested task without waiting for the user.”

This session declined production QA-account creation, production fund/client test records, and a production deployment plan because they would create substitute/test data in production and expose or handle credentials outside the approved path. The production role assignment itself was executed earlier under explicit owner authorization; it must not be repeated without verification.

The owner/operator must manually run any approved production deployment, migration, backup, or production QA-data operation through the organization’s controlled change process.

## 6. Exact commands

Run from the sibling backend repository, with the intended non-production `.env` selected:

```powershell
cd C:\Users\lysp\Downloads\nvccz
npm run sync:roles
npm run seed:uat:role-personas
npx ts-node scripts/assign-role.ts --email uat.sibusisiwa-ops@nts.local --role-code MONITORING_EVALUATION
```

The assignment command is dry-run by default. If an approved non-production operator needs to apply it:

```powershell
$env:ALLOW_ROLE_ASSIGNMENT_WRITE="true"
npx ts-node scripts/assign-role.ts --email uat.sibusisiwa-ops@nts.local --role-code MONITORING_EVALUATION --apply
```

For an approved operator-run production change, use a separately supplied production environment and the real target email; do not copy credentials into this file:

```powershell
$env:DATABASE_URL="<approved-production-database-url>"
$env:ALLOW_ROLE_ASSIGNMENT_WRITE="true"
npx ts-node scripts/assign-role.ts --email "<target-user-email>" --role-code MONITORING_EVALUATION
npx ts-node scripts/assign-role.ts --email "<target-user-email>" --role-code MONITORING_EVALUATION --apply
```

Do not run the production commands from this handoff automatically. Run the dry-run, inspect the single-user before/after, and stop if anything differs.

## 7. Open questions and risks

- Local Prisma migration history is out of sync: 52 repository migrations are pending according to `prisma migrate status`.
- Production’s migration history was previously documented as absent; dev migration status was not independently verified in this session.
- The frontend production build and lint remain unconfirmed because local checks stalled without output.
- The current role/navigation changes are uncommitted and not deployment-verified.
- The exact production migration set and SQL must be reviewed before any deployment; destructive or data-rewriting migrations require a stop and explicit review.
- Production backup/restore evidence for a future deployment is not recorded in this file.
- No credentials, tokens, passwords, or production database URLs are stored here.
