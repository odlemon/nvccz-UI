# Decisions and actions register

Do not fill decisions on the client's behalf.

| ID | Question / decision | Current position | Owner | Due | Follow-up |
|---|---|---|---|---|---|
| D-01 | Which legal entities and fund vehicles are in scope for configuration? | Await client confirmation. | Client sponsor | Before configuration | Complete fund/entity request template. |
| D-02 | Who may approve fund setup, commitments, onboarding, and changes? | No approval authority confirmed. | Client sponsor / compliance | Before access provisioning | Confirm role, threshold, delegate, and effective dates. |
| D-03 | What are the intended access scopes for Tino, Sophia, Ropa, Brendon, Natsai, Vongai, Gilbert? | Names/permissions are task requirements only; actual identities, departments, fund/entity scope, and approval are not verified. | Client sponsor / HR | Before account provisioning | Approve one row per named user in access register. |
| D-04 | Are external investor records approved for dev/UAT? | Use synthetic records only until approval and data-handling controls are confirmed. | Client sponsor / data owner | Before import | Provide masked sample only if approved. |
| D-05 | What backup RPO/RTO and restore owner are required? | Dev backup/restore not evidenced. | IT / DevOps | Before training data entry | Approve encrypted backup schedule and isolated restore drill. |

| Action | Owner | Status | Due | Evidence to close |
|---|---|---|---|---|
| Resolve pending fund save and verify retrieval without duplicate POST | QA / API | CLOSED LOCALLY | Before training | Synthetic fund appeared once in refreshed list and detail; see P-04 tracker evidence. |
| Fresh ordinary-user login and role/action check | QA | CLOSED LOCALLY | Before training | Synthetic restricted allow/deny evidence; see P-03 tracker evidence. |
| Validate People Directory request and toast root cause | API / frontend | CLOSED LOCALLY | Before training | `/home/people` loaded authenticated directory data; no current toast reproduction. |
| Verify investor create-link-retrieve workflow | QA / IR | CLOSED LOCALLY | Before training | Synthetic investor appeared in refreshed directory and detail; see P-05 tracker evidence. |
| Agree and test dev backup/restore process | DevOps | OPEN | Before client data | Backup metadata and isolated restore result. |
