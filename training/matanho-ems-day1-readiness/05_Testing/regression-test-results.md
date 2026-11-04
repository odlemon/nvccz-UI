# Navigation and access regression results

| Test | Environment | Result | Evidence / limitation |
|---|---|---|---|
| Home visible from News | Singapore dev | PARTIAL PASS | Clicked visible Home; Home rendered in the signed-in session. Repeat from each priority module. |
| Home from Portfolio/Funds | Singapore dev | NOT RUN | Home link observed in header, but post-module click not yet completed in current run. |
| FP&A route / denial | Singapore dev | NOT VERIFIED | Local-only API fix is not proof for current dev deployment. |
| Full Payroll admin restriction | Singapore dev | NOT VERIFIED | No user-specific dev matrix run. Prior local synthetic API report only. |
| Personal Payroll ownership | Singapore dev | NOT VERIFIED | No ordinary user linked to Employee record verified. |
| Restricted users’ exact seven boundaries | Singapore dev | NOT VERIFIED | Actual named accounts and their grants not confirmed. Prior local report has open scope defects. |
| Procurement create-only / Accounting requisition-only | Singapore dev | NOT VERIFIED | Procurement create not validly submitted; Accounting workflow/API unverified in dev. |
| Error toast monitoring | Singapore dev | OPEN DEFECT | Prior “People directory — Unauthorized” toast; fund submission currently has Saving indicator with no outcome. |

**Overall:** FAIL / PARTIAL. Do not assert RBAC acceptance from navigation visibility, direct-route behavior alone, or local synthetic results.
