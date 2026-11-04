# Fundraising KYC public contract (local design)

This is the contract required to move the standalone portal from local mock transport to a real local/UAT workflow. It is not deployed and does not authorize production use.

## Access model

- Staff creates an invitation from the internal Fundraising onboarding workflow.
- The backend stores only a hash of the unpredictable invitation token, an expiry, revocation state, and the linked investor/entity.
- The raw token is returned once to the caller that creates the invitation and is never logged.
- Public requests use `Authorization: Bearer <invitation-token>` or the one-time invitation URL; they cannot use staff JWTs.
- Every public read/write is scoped to the invitation's linked case. Cross-case IDs return 404.

## Proposed endpoints

```text
POST  /api/public/fundraising-kyc/invitations              staff-only
DELETE /api/public/fundraising-kyc/invitations/:id         staff-only revoke
GET   /api/public/fundraising-kyc/session                 token-scoped
PATCH /api/public/fundraising-kyc/session                 token-scoped draft save
GET   /api/public/fundraising-kyc/session/document-categories token-scoped category catalog
POST  /api/public/fundraising-kyc/session/documents       token-scoped upload registration
GET   /api/public/fundraising-kyc/session/documents/:id   token-scoped metadata/download
POST  /api/public/fundraising-kyc/session/submit          token-scoped final submission
POST  /api/public/fundraising-kyc/session/liveness        token-scoped local assisted session
POST  /api/public/fundraising-kyc/session/liveness/:id/complete token-scoped assisted completion
GET   /api/fundraising/kyc-cases/:caseId                  existing staff reviewer API
PATCH /api/fundraising/kyc-cases/:caseId                  existing staff reviewer API
```

The standalone frontend accepts the invitation token as `?token=...` on first entry and retains it only in session storage for the active browser session. Live transport is opt-in with `NEXT_PUBLIC_FUNDRAISING_KYC_USE_LIVE_API=1`.

## State rules

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> (APPROVED | REJECTED | ADDITIONAL_INFO_REQUIRED)`.

Draft edits are allowed only in `DRAFT` and `ADDITIONAL_INFO_REQUIRED`. Submission must validate required fields, declarations, and required document categories server-side. Reviewer decisions remain staff-authorized and audit logged through the existing Fundraising service.

## Storage requirements

Use a dedicated invitation/session model or an explicitly approved extension of the existing KYC case model. Store applicant payload in the existing JSON field only if the backend owner confirms its retention and access semantics. Document binaries must use the existing upload service; do not store file contents in MySQL or browser local storage.

## Required local tests before enabling the live transport

- expired, revoked, malformed, and cross-case tokens are denied;
- draft save and refresh persist only to the linked case;
- submitted cases cannot be edited by the applicant;
- document type, size, MIME, ownership, and download authorization are enforced;
- document category is checked against the token-scoped catalog (`identity_document`, `address_proof`, `authority_to_act`, `bank_evidence`, `source_of_funds`, `ownership_structure`, `tax_evidence`, `supporting_document`);
- staff review status changes are audit logged;
- no production database, DNS, deployment, or migration is touched.

The frontend live transport is opt-in with `NEXT_PUBLIC_FUNDRAISING_KYC_USE_LIVE_API=1`. Liveness remains an explicitly local assisted-review API: it must never emit automated biometric verification or be enabled for production without separate approval.
