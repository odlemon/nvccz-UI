# Fundraising KYC browser verification

Date: 2026-10-17

## Checks

- Route isolation: Playwright fallback verified HTTP 200 and one `[data-portal]` root.
- Local HTTP smoke check: `GET http://127.0.0.1:3001/fundraising-kyc` returned HTTP 200.
- Direct route entry: Playwright fallback verified.
- ERP app-switcher removal: Playwright fallback found zero `Switch module` buttons on the standalone route.
- Internal Fundraising route preservation: source route family remains present.
- Draft, upload, submit and refresh: browser-context live API verification passed with draft HTTP 200, upload HTTP 201, and submit HTTP 200; persisted status was `SUBMITTED`.
- Reviewer workflow: authenticated local reviewer listing returned the synthetic submitted case; a reviewer decision of `ADDITIONAL_INFO_REQUIRED` was visible through the external session, and resubmission returned `SUBMITTED`.
- Reviewer detail panel: authenticated local browser session loaded `http://127.0.0.1:3011/fundraising/onboarding` from the live API; selecting synthetic `UAT Investor 1788934927757` rendered the live checklist and `Evidence and review history` with `DOCUMENTS`, `ASSISTED LIVENESS`, and `AUDIT HISTORY` sections.
- Access denial: expired, revoked, and invalid invitations returned HTTP 401; cross-case document retrieval returned HTTP 404.
- Upload validation: unsupported MIME returned HTTP 415; oversize upload returned HTTP 413; valid PDF returned HTTP 201.
- Live transport wiring: draft/session, submit, document, and local assisted-liveness paths target the local public contract behind `NEXT_PUBLIC_FUNDRAISING_KYC_USE_LIVE_API=1`. The liveness page rendered the assisted-review consent, camera controls, fallback action, and explicit non-biometric boundary with a synthetic invitation. Public-submission audit actor evidence remains an open limitation because no external applicant actor model exists yet.
- Full local browser workflow: Playwright verified a synthetic invitation on `http://127.0.0.1:3011/fundraising-kyc` with draft HTTP 200, evidence upload HTTP 201, submit HTTP 200, liveness start HTTP 201, liveness completion HTTP 200 with `ASSISTED_REVIEW`, and a post-refresh rendered liveness page. Reviewer detail verification separately confirmed the live evidence/history panel and synthetic case persistence.
- Visible in-app browser pass: the local KYC form was opened and exercised visibly. This found and fixed two local issues: API-base normalization now prevents `/api/api/...`, and non-invitation failures now show the actionable `A valid KYC invitation is required.` message instead of `body stream already read`. The visible test tab is left open for continued inspection.
- Staff-to-applicant visible pass: logged in locally as the synthetic staff account, created and requested documents for `UAT Investor 1788968706685`, used a local synthetic invitation, completed the company KYC flow, requested assisted liveness, uploaded `synthetic-visible-evidence.pdf` as an identity document, and submitted successfully. The staff reviewer refreshed and showed `SUBMITTED`, `DOCUMENTS 1`, `ASSISTED LIVENESS 1`, and `AUDIT HISTORY 5`. Case ID was verified locally as `cmvc98pdm0019un1c8cnyy5tv`.
- Blocker fixed during this pass: public applicant-edit endpoints now allow `DOCUMENTS_REQUESTED` cases to continue. The public API now exposes token-scoped persisted KYC documents, and the applicant UI hydrates saved documents after refresh, preventing a valid uploaded document from appearing missing.

## Environment limitation

The Codex browser bridge was attempted but returned `privileged native pipe bridge is not available; browser-client is not trusted`. A local Playwright fallback verified the route, switcher isolation, and assisted-liveness UI against a synthetic invitation. The browser did not exercise a real camera device; the backend API path was verified separately with synthetic evidence.

The visible workflow passed. `git diff --check` passed. The full repository ESLint command still reports pre-existing unrelated errors outside this KYC scope; the backend TypeScript check was started and remains in progress in the local terminal. No production or remote environment was touched.
