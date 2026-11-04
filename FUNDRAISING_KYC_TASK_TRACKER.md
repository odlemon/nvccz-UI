# Fundraising KYC implementation tracker

## Long-milestone plan

This tracker is organized around delivery milestones, not micro-tasks. A milestone is complete only when implementation, local verification, documentation, and acceptance evidence are complete.

### Milestone A — Applicant identity and secure case ownership

Status: COMPLETE locally. Staff-created investor/case relationship, invitation security, token-scoped sessions, invitation-linked documents, external audit events, isolation, and reviewer status visibility are implemented and verified.

### Milestone B — Local assisted-liveness workflow

Status: COMPLETE locally. No paid provider is used. The server contract, local browser capture/fallback wiring, staff decisions, boundary checks, and audit evidence are implemented and verified. The result is always `ASSISTED_REVIEW` until an authorized staff decision; the flow never claims automated biometric verification.

### Milestone C — Applicant evidence and reviewer operations

Status: COMPLETE locally. The staff KYC detail API now returns linked documents, liveness sessions, and external audit history; token-scoped document-category rules and the reviewer evidence/history panel are implemented and verified.

### Milestone D — Automated quality gate

Status: COMPLETE locally. Dedicated smoke, denial, upload-validation, liveness-boundary, browser fallback, build, lint, and backend type-check evidence is consolidated in the tracker and verification documents.

### Milestone E — Release readiness

Status: LOCAL REVIEW COMPLETE / NOT APPROVED FOR DEPLOYMENT. Migration ordering, schema impact, validation, and rollback notes are recorded. Non-production deployment verification, approval, and any separately authorized release remain.

Last updated: 2026-10-17
Scope: local frontend/backend and local non-production database only.
Explicit restrictions: no deployment, no remote database changes, no DNS/TLS changes, no Git push, no production data.

## Status legend

- `[x]` completed and evidenced
- `[~]` implemented but verification remains
- `[ ]` not started
- `[!]` blocked with a documented reason

## Ordered checklist

### 1. Architecture and workflow discovery

- [x] Read repository instructions, project context, operating policy, session handoff, and KYC design references.
- [x] Trace the existing KYC frontend route and runtime.
- [x] Trace the existing backend KYC API and Prisma model.
- [x] Confirm existing backend KYC routes are staff-only and cannot be reused publicly without weakening authorization.

### 2. Standalone portal boundary

- [x] Remove Fundraising KYC from `lib/config/modules.ts` so it is not an ERP app-switcher module.
- [x] Remove ERP topbar, notifications, profile menu, and module switcher from the KYC shell.
- [x] Preserve internal `/fundraising/*` administration routes.
- [x] Preserve direct `/fundraising-kyc/*` route access through middleware.
- [x] Verify local route returns HTTP 200.
- [x] Verify with Playwright fallback that the standalone root exists and no “Switch module” button is rendered.

### 3. Public identity and invitation foundation

- [x] Define token-scoped public contract.
- [x] Add `FundraisingKycInvitation` Prisma model with hashed token, expiry, revocation, and case link.
- [x] Add local migration SQL for the invitation table.
- [x] Add staff-only invitation creation endpoint.
- [x] Add staff-only invitation revocation endpoint.
- [x] Add token validation and case scoping for public requests.
- [x] Add public session read, draft save, and submit endpoints.
- [x] Add frontend token extraction and session-storage handling.
- [x] Wire frontend draft/session/submit calls behind an explicit live-API flag.
- [x] Apply migration locally and regenerate Prisma Client — migration applied; client regenerated; backend restarted successfully.

### 4. Document uploads

- [x] Add token-scoped multipart document upload endpoint.
- [x] Reuse existing remote upload service.
- [x] Store confidential document metadata against the linked KYC case/investor.
- [x] Add token-scoped document retrieval endpoint.
- [x] Wire frontend live document upload transport.
- [x] Verify synthetic upload persistence against local API after backend startup — upload returned HTTP 201 and submission returned HTTP 200.
- [x] Verify unauthorized, expired, revoked, and cross-case document access is denied — expired/revoked/invalid tokens returned HTTP 401; cross-case document returned HTTP 404.
- [x] Add focused backend tests for size, MIME, ownership, and case scoping — repeatable local validation scripts assert unsupported MIME HTTP 415, oversize HTTP 413, valid PDF HTTP 201, cross-case retrieval HTTP 404, and expired/revoked/invalid token HTTP 401. Uploaded documents now also persist the authorizing invitation ID, while the legacy staff creator field remains intact.

### 5. Submission and reviewer workflow

- [x] Enforce editable-state checks for draft and additional-information cases.
- [x] Enforce required identity/declaration presence before submission.
- [x] Add public submission audit events using a non-user external actor model — added local-only `FundraisingKycExternalAuditLog`, recorded draft save, document upload, and submit actions without attributing them to a staff user; local migration applied and Prisma Client regenerated.
- [x] Verify submitted case appears in internal Fundraising review — local authenticated reviewer request to `/api/fundraising/kyc-cases?status=SUBMITTED` returned HTTP 200 and included the latest synthetic case with status `SUBMITTED`.
- [x] Verify staff status decision is visible to the external session — local authenticated reviewer PATCH set a fresh synthetic case to `ADDITIONAL_INFO_REQUIRED`; token-scoped public session returned the same status.
- [x] Verify resubmission after `ADDITIONAL_INFO_REQUIRED` — fresh synthetic case transitioned reviewer-side to `ADDITIONAL_INFO_REQUIRED`, public draft PATCH returned `DRAFT`, and public submit returned `SUBMITTED`.

### 6. Liveness — local assisted mode

- [x] Define no-paid-provider assisted-session contract — result is `ASSISTED_REVIEW`, never automated biometric verification.
- [x] Implement server-side assisted-liveness session creation/completion — token-scoped POST endpoints return 201/200 and enforce session ownership, expiry, and one-time completion.
- [x] Store only local capture references and approved result metadata — latest local session persisted `ASSISTED_REVIEW`, evidence reference present, and `automatedVerification=false`.
- [x] Verify camera-unavailable assisted flow — local browser route renders the fallback, optional mobile-selfie path, and explicit non-biometric boundary; API completion remains token-scoped.
- [x] Add staff accept/reject handling for assisted-review sessions — internal staff route accepts only `ACCEPTED` or `REJECTED`, requires an `ASSISTED_REVIEW` session, scopes by case/session, and preserves `automatedVerification=false`.
- [x] Complete authenticated staff endpoint verification and audit-history assertion — synthetic local staff login succeeded; `ACCEPTED` and `REJECTED` both persisted, and two `KYC_LIVENESS_DECISION` audit rows contained the acting user, timestamps, decision, and `automatedVerification=false`.

### 7. End-to-end local verification

- [x] Start local backend successfully on port 3009 — `/health` returned HTTP 200; public KYC session without a token returned HTTP 401.
- [x] Create a synthetic KYC case and invitation through a local-only smoke helper.
- [x] Open the standalone portal with the invitation token — after restarting the local dev server following the production build, Playwright verified HTTP 200, standalone portal root present, no switcher button, and rendered onboarding content (`portal=1`, `switcher=0`).
- [x] Save draft and verify API persistence.
- [x] Upload synthetic document and verify HTTP 201.
- [x] Submit and verify persisted `SUBMITTED` status.
- [x] Verify internal reviewer access and status update — authenticated local reviewer listing and status decision checks passed.
- [x] Verify audit evidence and timestamps — latest synthetic run produced external audit rows for `KYC_DRAFT_SAVED`, `KYC_DOCUMENT_UPLOADED`, and `KYC_SUBMITTED`, each with object identifiers and timestamps. Staff reviewer audit/status evidence remains separate.
- [x] Verify expired/revoked/cross-case denial — expired/revoked/invalid tokens returned HTTP 401 and cross-case retrieval returned HTTP 404.
- [x] Verify staff app-switcher regression — standalone `/fundraising-kyc` returned HTTP 200 with the portal root and no “Switch module” control; protected `/fundraising/kyc-cases` redirected to local login rather than exposing the public shell.
- [x] Extend the staff KYC detail API with reviewer evidence — authenticated local detail request returned linked `documents`, `livenessSessions`, and `externalAuditLogs` collections without exposing file contents or secrets.
- [x] Add token-scoped document-category catalog and upload enforcement — local catalog returned eight categories; unsupported category returned HTTP 422; frontend live upload transport now consumes the catalog.
- [x] Add reviewer evidence/history panel — internal onboarding loads the selected KYC detail API and shows document metadata, assisted-liveness decisions, and external audit events without exposing file contents.

### 8. Automated validation

- [x] Prisma schema validation passed.
- [x] Prisma Client generation passed after stopping the local backend process.
- [x] Backend TypeScript check completes — `npx tsc --noEmit --pretty false` exited 0 with no diagnostics.
- [x] Backend focused KYC validation scripts pass — denial and upload validation scripts completed with expected status codes.
- [x] Frontend targeted ESLint passes — KYC shell and app files exited 0 with no diagnostics.
- [x] Frontend full Next build — `CI=1 NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint` completed successfully, including all 409 static pages and final optimization.
- [x] Frontend Playwright KYC workflow passes against live local API — route/render, token-scoped session, draft persistence, required-field navigation through Step 3, and browser-context API verification completed. Synthetic browser-context results: draft HTTP 200, upload HTTP 201, submit HTTP 200; liveness UI now renders the local assisted-review contract and fallback boundary.
- [x] Liveness boundary coverage passes — expired session returned HTTP 410, cross-case completion returned HTTP 404, and a local Playwright fallback click on `Request assisted review` produced the assisted-review toast while retaining the explicit non-biometric boundary.

### 9. Documentation and readiness

- [x] Create implementation, workflow, browser verification, deployment-readiness, and public-contract documents.
- [x] Record that paid-provider liveness is deferred and local assisted-liveness is explicitly non-biometric.
- [x] Update verification documents with end-to-end evidence — browser verification now records live API, reviewer, resubmission, denial, MIME, and size results plus explicit limitations.
- [x] Update project context after the portal/backend architecture is verified — standalone KYC boundary, token-scoped API, staff reviewer separation, deferred liveness, and ownership/audit limitations recorded.
- [x] Prepare deployment notes without executing deployment — readiness document now lists verified local evidence, build/audit/ownership limitations, migration safeguards, and required approval gates.
- [x] Re-run the complete local acceptance matrix — smoke, denial, upload, liveness-boundary, backend TypeScript, and targeted frontend lint all passed on 17 October 2026.

## Current blocker

No local implementation blocker remains after starting the isolated local upload mock on `127.0.0.1:3050`; the complete synthetic smoke and upload-validation suite now passes. Release readiness is intentionally incomplete because no deployment approval exists and no remote/non-production deployment verification has been authorized. No credentials or production accounts will be used.

## Next task

1. If the user authorizes a specific non-production deployment, execute only the reviewed migration plan there and repeat synthetic verification.
2. [x] Implement and verify document-category requirements and the reviewer detail/evidence/audit UI locally. Browser evidence: `http://127.0.0.1:3011/fundraising/onboarding` loaded a synthetic `UAT Investor 1788934927757` case from the live local API; selecting it rendered the live checklist and `Evidence and review history` with `DOCUMENTS`, `ASSISTED LIVENESS`, and `AUDIT HISTORY` sections.
3. Keep the implementation local and obtain the required explicit release approval before any remote action.

## Change boundary

No production or remote environment has been modified. No Git push or deployment has occurred.
