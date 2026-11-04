# Local assisted-liveness milestone

## Scope

This is a local development/UAT flow only. It does not provide automated biometric liveness verification and must not be represented as such.

## Contract

- A token-scoped applicant session requests a liveness session.
- The server creates a short-lived session with a random challenge phrase and status `PENDING`.
- The browser requests camera access and captures a short local evidence clip or still sequence.
- If the camera is unavailable, the applicant may choose `ASSISTED_REVIEW` and continue with a staff-review flag.
- The applicant submits the evidence reference and challenge completion metadata.
- The server stores only the local evidence reference, challenge metadata, and review status; it does not issue `VERIFIED`.
- Authorized Fundraising staff may mark the session `ACCEPTED` or `REJECTED` after manual review.
- Every transition is recorded in the external KYC audit log.

## Explicit safety boundary

The local flow is an assisted review aid. It is not a replacement for a paid or independently validated identity/liveness provider and must remain disabled for production release until separately approved.

## Acceptance evidence

The milestone is complete only after camera-available, camera-denied, expired-session, token-scope, staff-decision, and audit-history tests pass locally.

## Implemented local API slice

- `POST /api/public/fundraising-kyc/session/liveness` creates a token-scoped 15-minute `PENDING` session and random challenge.
- `POST /api/public/fundraising-kyc/session/liveness/:sessionId/complete` requires the matching challenge and a local evidence reference, then records `ASSISTED_REVIEW`.
- Completion is idempotency-protected by the session status and scoped to both invitation and case; expired sessions return 410 and mismatched sessions return 404.
- Local verification on 17 October 2026: create HTTP 201, complete HTTP 200, stored status `ASSISTED_REVIEW`, evidence reference present, `automatedVerification=false`, and both liveness audit actions persisted with timestamps.
- Internal staff routes are now available at `GET /api/fundraising/kyc-cases/:caseId/liveness` and `PATCH /api/fundraising/kyc-cases/:caseId/liveness/:sessionId/decision`; decisions are restricted to `ACCEPTED` or `REJECTED`, only apply to `ASSISTED_REVIEW`, and write a staff `AuditLog` entry. Local verification used a synthetic staff account: both decisions persisted, and the two audit rows included the acting user, timestamps, decision, and `automatedVerification=false`.

The browser camera/fallback transport and staff accept/reject workflow are implemented locally. Boundary verification returned expired HTTP 410 and cross-case HTTP 404; the Playwright fallback click produced the assisted-review toast while preserving the explicit non-biometric boundary. This flow does not claim biometric verification.
