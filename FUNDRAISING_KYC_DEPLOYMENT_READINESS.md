# Fundraising KYC deployment readiness

Status: LOCAL ACCEPTANCE COMPLETE; NOT APPROVED FOR DEPLOYMENT.

## Local migration review

Reviewed on 17 October 2026. The four migrations are ordered correctly: invitations first, external audit second, invitation-linked document ownership third, and liveness sessions last. They add two new tables, one nullable document ownership column/index/foreign key, and supporting indexes. No existing rows are rewritten and no accounting or depreciation tables are touched.

The foreign keys intentionally use cascade cleanup for invitation-owned audit/liveness rows and `SET NULL` for the optional document invitation link. That behavior must be explicitly approved before any non-local rollout.

## Rollback plan

1. Stop the application release and preserve a database backup/snapshot before any rollback.
2. Confirm no newly created KYC invitations, external audit rows, liveness sessions, or invitation-linked documents need retention; export them if required by the retention policy.
3. Reverse in dependency order only through a reviewed migration: remove the document foreign key/index/column, drop liveness sessions, drop external audit logs, then drop invitations. Never hand-edit a remote database or use a blanket reset.
4. Restore the application version and run read-only schema/health checks. Reconcile the backed-up KYC counts and audit history before reopening access.

This is a planning record only. No rollback or remote schema operation was executed.

The standalone shell and switcher removal are local code changes only. No deployment, remote service restart, database migration, DNS change, or Git push was performed.

## Local evidence completed

- Local invitation migration applied only to the local development database; no production migration was run.
- Backend TypeScript check passed and targeted KYC frontend lint passed.
- Live local browser/API checks passed for draft save (200), document upload (201), submission (200), reviewer status visibility, resubmission, expired/revoked/invalid token denial (401), cross-case document denial (404), unsupported MIME denial (415), and oversized upload denial (413).
- Local route isolation passed: standalone `/fundraising-kyc` renders without the ERP switcher; protected `/fundraising/*` routes remain staff-authenticated.
- Final local validation rerun passed after restarting the dev server: backend health HTTP 200, smoke/denial/upload validation scripts returned expected statuses, and Playwright route isolation returned HTTP 200 with `portal=1` and `switcher=0`.
- Local assisted-liveness acceptance passed: session create/complete, expired-session HTTP 410, cross-case HTTP 404, camera-unavailable fallback, authenticated staff `ACCEPTED`/`REJECTED` decisions, and audit rows with acting user/timestamps and `automatedVerification=false`.
- Frontend production build completed successfully with `CI=1 NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint`; backend `npx tsc --noEmit --pretty false` completed successfully.
- The local upload mock was started on `127.0.0.1:3050` for the isolated UAT run; the smoke suite then passed upload HTTP 201, unsupported MIME HTTP 415, oversize HTTP 413, and cross-case retrieval HTTP 404. This mock is local-only and is not a production upload service.
- Final acceptance rerun on 17 October 2026 passed the smoke, denial, upload-validation, and liveness-boundary scripts; backend TypeScript and targeted frontend ESLint also passed. The frontend production build had already completed successfully after the liveness UI changes.
- Migration review and rollback planning are complete locally. The release remains a no-go until an authorized non-production target, explicit approval, backup, reviewed migration execution, and post-migration synthetic verification are provided.

## Required before any deployment

1. The full Next production build now passes locally with CI/telemetry-disabled settings; preserve the same build command in the deployment verification record.
2. Review the four local migrations added for invitations, external audit, invitation-linked document ownership, and assisted-liveness sessions; apply them only through the approved migration process in a separately authorized environment.
3. Run the focused KYC test suite in CI or a stable test runner, including Multer error handling and document retrieval.
4. Obtain explicit deployment approval, review the local migration, prepare a rollback plan, and apply any schema change only through the approved non-production/production migration process.
5. Re-verify with synthetic non-production records after deployment; do not use the local synthetic database or tokens in production.

No deployment, remote service restart, database migration, DNS change, or Git push was performed.
