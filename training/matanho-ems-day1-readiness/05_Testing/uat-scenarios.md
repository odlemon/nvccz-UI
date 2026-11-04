# UAT scenarios

| ID | Persona | Scenario | Expected | Evidence required | Status |
|---|---|---|---|---|---|
| UAT-01 | Admin | Login, verify environment identity, Home, module picker, return Home from modules | Stable session, no erroneous redirect/toast | Redacted screenshot + URL + observed labels | Partial |
| UAT-02 | Admin | Create synthetic fund using visible Details → Ownership → Review workflow | Success feedback; unique ID; refreshed row retrievable | Screenshot/trace, ID, post-refresh row | Blocked: pending save |
| UAT-03 | Admin / IR | Create synthetic investor and link to verified fund | Validated success; persists after refresh | Screenshot/trace, IDs and safe synthetic fields | Not run |
| UAT-04 | Ordinary role | Login, authorized navigation, return Home | Only assigned modules/actions available | Role-scoped browser evidence | Not run |
| UAT-05 | Restricted staff | Denied Payroll admin, allowed own My Pay, Procurement create-only, Accounting create-only, scoped Portfolio/Events | API denies outside scope; own-data only | UI plus API status/evidence, no real payroll data | Dev not run; prior local failures |
| UAT-06 | Admin | Upload a harmless synthetic document and retrieve it | File stored and linked to expected record | Redacted screenshot and file metadata | Not run |
| UAT-07 | Authorized FP&A | Open plans, scenario/report, save or export synthetic data | Valid permission, calculation and persistence | Browser values plus independent calculation check | Not run on dev |
| UAT-08 | Admin | Navigate to each priority module and monitor top-right errors | No unexplained toast; route-specific failures documented | Toast log and screenshot/trace | Partial |
| UAT-09 | DevOps | Backup dev test DB, restore to isolated non-client target, reconcile | Restore meets agreed RPO/RTO and row/control counts | Backup metadata, isolated restore log and sign-off | Blocked |

For every scenario start from login, use visible UI, save once, check success/error toast, refresh, retrieve, and test both allow/deny permissions. Do not repeat a pending write.
