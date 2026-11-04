# Fundraising KYC workflow

## Supported local flow

1. Open `/fundraising-kyc` directly.
2. Complete applicant profile, identity/contact, liveness, ownership, investment, compliance, documents/signature, and review steps.
3. Save draft; draft data is stored locally with selfie data removed from browser draft storage.
4. Upload synthetic document files and verify their displayed status.
5. Submit from the review step and verify the confirmation state.
6. Refresh and resume the local draft/receipt behavior.

## Internal workflow

Internal staff continue to use `/fundraising` and its due-diligence, onboarding, documents, approvals, and audit screens. The KYC preview is no longer exposed in the ERP app switcher.

## Existing internal API boundary

The sibling backend does expose `/api/fundraising/kyc-cases` for authenticated Fundraising staff. Those routes create and update `FundraisingKycCase` records and write audit events, but they require internal Fundraising permissions and operate on an existing `investorId`. They are not an external applicant submission API and must not be exposed through the public portal.

## Known contract gap

The frontend runtime contains a documented live transport shape (`/api/v1/onboarding/applications`, draft PATCH, liveness session, presign/register documents, submit), but the sibling backend route tree does not currently expose those endpoints. The local route therefore remains on the existing mock transport until the established backend API contract is implemented or mapped. This is intentionally not hidden as a PASS.
