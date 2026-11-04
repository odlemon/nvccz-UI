# Day 1 delivery status report

**Prepared:** 15 October 2026  
**Reference session date:** Monday 12 October 2026 (past)  
**Decision:** **BLOCKED — no unconditional Day 1 readiness declaration.**

## What is ready

- Singapore development staff portal and API are reachable over HTTPS; health reports DB connected. Current read-only Compose status showed all nine app/service containers healthy.
- Admin identity is visible in an authenticated browser session; Home and the module picker rendered.
- News route previously showed external article images, publisher badges, and pagination.
- Editable agenda, access/data request templates, exercises, test scenarios, defect register, and handover notes are prepared.

## What blocks a client-ready demonstration

1. A real synthetic fund submission stayed in “Saving…” for more than 30 seconds with no definitive outcome/ID; fund retrieval and investor registration are not proven.
2. Ordinary-user dev login and exact role boundaries have not been freshly tested. Prior local-only UAT found overbroad restricted-role access and missing/blocked flows.
3. Six of seven priority workflows are unverified or only partially assessed; no module meets full end-to-end WORKING acceptance in this assessment.
4. A People Directory Unauthorized toast has been observed in dev. Root cause is not confirmed; backend route source currently shows CEO/admin guard where its comment says all internal staff should use it.
5. User-visible file upload and document retrieval are not tested.
6. No dev DB backup schedule/artifact or restore test was found in bounded inspection. Healthy named volume is not recoverability evidence.
7. Local-first browser retest exposed and locally fixed a Home runtime crash caused by a null role-permission entry; fresh Home and Funds routes rendered. Local API port 3009 is not listening, so directory API and create/save actions could not be completed. This is not deployment or client-ready proof.
8. A local People route redirected to a Reset Password screen. No password was entered or changed; a clean ordinary-staff directory retest is blocked until a usable local test identity/session is available.
9. The pending backend directory guard change has not passed a focused test or lint; ESLint could not run because the repo currently uses legacy configuration unsupported by installed ESLint 9.

## Decision needed

Keep training as a guided readiness review only, or reschedule hands-on client training after the P1 items are closed. Confirm client sponsor, account/role mapping, fund/investor sample values, approval authorities, backup RPO/RTO, and secure data channel.
