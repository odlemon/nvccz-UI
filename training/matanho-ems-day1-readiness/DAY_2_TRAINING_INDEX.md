# Day 2 Matanho EMS Training Index

**Status:** Prepared for controlled review; not an unconditional readiness declaration.
**Evidence date:** 15 October 2026
**Environment:** Local synthetic development environment only.

## Session scope

Day 2 covers fund and entity records, investor records, commitments, supporting documents, data validation/import preparation, permissions, and preparation of the investment opportunity pipeline for Day 3.

## Materials

| Area | Material | Status |
|---|---|---|
| Session control | [Day 2 preparation checklist](04_Training/day2-preparation-checklist.md) | Prepared; execution evidence pending for unverified workflows |
| Facilitation | [Facilitator guide](04_Training/facilitator-guide.md) | Prepared; use only verified labels and paths |
| Practice | [Participant exercises](04_Training/participant-exercises.md) | Prepared; exercises carry completion/assessment fields |
| Quick reference | [Quick reference](04_Training/quick-reference.md) | Prepared |
| Data capture | [Fund/entity template](02_Client_Data/fund-entity-data-template.md) and [investor commitments template](02_Client_Data/investor-commitments-data-template.md) | Prepared; client data not supplied |
| Validation | [Data validation register](02_Client_Data/data-validation-register.md) | Prepared |
| Access | [User-access register](02_Client_Data/user-access-register.md) and [role matrix](03_Configuration/role-permissions-matrix.md) | Prepared; client provisioning pending |
| Testing | [UAT scenarios](05_Testing/uat-scenarios.md), [browser evidence](05_Testing/browser-execution-evidence.md), and [defect register](05_Testing/defect-register.md) | Prepared; historical blockers retained honestly |
| Attendance/feedback | [Attendance register](04_Training/attendance-register.md) and [feedback form](04_Training/training-feedback-form.md) | Templates ready; client session data pending |
| Handover | [Outstanding actions and support](07_Handover/outstanding-actions-and-support.md) | Prepared |

## Readiness rule

Do not mark a workflow PASS unless a real browser action, result, refresh/retrieval check, and permission result are recorded in the evidence register. Local synthetic evidence does not prove client provisioning or production readiness. No real investor data, financial transfer, capital call, or investor communication is permitted in this environment.

## Current mandatory exceptions

- Fund creation/retrieval, supporting-document upload, and imports remain unverified or blocked in the current evidence set; the existing document-library retrieval view is confirmed locally.
- Investor organisation creation/retrieval is now locally browser-verified with the authorized admin fixture: a synthetic organisation was created and was present after refresh. This does not prove client provisioning or production readiness.
- Commitment creation/retrieval is now locally browser-verified with the authorized admin fixture: a synthetic soft-circled commitment was recorded and was present after refresh. Funding, admission, and closing controls remain unverified.
- The opportunity pipeline is now locally browser-verified with the authorized admin fixture: a synthetic opportunity was created and was present after refresh. This does not prove client provisioning or production readiness.
- Attendance, client account provisioning, consent, and sponsor sign-off require client-controlled input.
- The Day 1 gate remains BLOCKED/PARTIALLY READY until these exceptions are resolved and re-tested.
