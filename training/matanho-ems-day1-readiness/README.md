# Matanho EMS — Day 1 Readiness Workspace

**Assessment date:** 15 October 2026 (the roadmap's 12 October Day 1 date is in the past; this is a retrospective readiness assessment, not proof that the client session occurred.)  
**Environment under test:** Singapore development, [https://dev.matanho.com/](https://dev.matanho.com/)  
**Overall gate:** **BLOCKED / PARTIALLY READY** — local synthetic admin/restricted access, fund/investor persistence, seven-module loading, and evidence retrieval are now verified. Backup/restore governance and client-controlled sign-off remain outstanding. Do not use this workspace to claim unconditional training readiness.

This folder contains working implementation and training documents built from the task brief, onboarding roadmap, repository evidence, and observations in the live dev browser. Statements are marked **Verified**, **Documented**, **Inferred**, or **Not verified**. No credentials or client data are stored here. Use synthetic records only.

**Package readiness (15 Oct 2026):** The facilitator guide, participant exercises, quick reference, agenda, feedback form, access/data templates, UAT scenarios, evidence register, defect register, readiness checklist, delivery status, and handover materials are prepared for controlled review and delivery. Client-controlled attendance, account provisioning, consent, sign-off, and unresolved workflow evidence remain explicitly pending; this package must not be presented as unconditional Day 1 readiness until those gates are completed.

For the Day 2 handoff, start with [DAY_2_TRAINING_INDEX.md](DAY_2_TRAINING_INDEX.md) and review the [Day 3 opportunity pipeline preparation](06_Reports/day3-opportunity-pipeline-preparation.md).

## Document index

| Folder | Deliverables |
|---|---|
| [01_Project_Control](01_Project_Control/) | [Readiness checklist](01_Project_Control/day1-readiness-checklist.md), [progress tracker](01_Project_Control/implementation-progress-tracker.md), [decisions/actions](01_Project_Control/decisions-actions-register.md), [daily report template](01_Project_Control/daily-progress-report-template.md) |
| [02_Client_Data](02_Client_Data/) | [client information request register](02_Client_Data/client-information-request-register.md), [user access template](02_Client_Data/user-access-register.md), [fund/entity template](02_Client_Data/fund-entity-data-template.md), [investor/commitments template](02_Client_Data/investor-commitments-data-template.md), [data validation register](02_Client_Data/data-validation-register.md) |
| [03_Configuration](03_Configuration/) | [environment verification](03_Configuration/environment-verification-report.md), [role/permissions matrix](03_Configuration/role-permissions-matrix.md), [initial fund configuration record](03_Configuration/initial-fund-configuration-record.md) |
| [04_Training](04_Training/) | [Day 1 agenda](04_Training/day1-session-agenda.md), [facilitator guide](04_Training/facilitator-guide.md), [participant exercises](04_Training/participant-exercises.md), [quick reference](04_Training/quick-reference.md), [attendance register](04_Training/attendance-register.md), [feedback form](04_Training/training-feedback-form.md), [Day 2 preparation](04_Training/day2-preparation-checklist.md) |
| [05_Testing](05_Testing/) | [seven-module readiness matrix](05_Testing/module-readiness-matrix.md), [UAT scenarios](05_Testing/uat-scenarios.md), [browser execution evidence](05_Testing/browser-execution-evidence.md), [defect register](05_Testing/defect-register.md), [regression results](05_Testing/regression-test-results.md) |
| [06_Reports](06_Reports/) | [Day 1 status report](06_Reports/day1-delivery-status.md), [risks and blockers](06_Reports/risks-and-blockers.md) |
| [07_Handover](07_Handover/) | [environment access instructions](07_Handover/training-environment-access.md), [outstanding actions/support](07_Handover/outstanding-actions-and-support.md) |

## Readiness summary

- **Verified in the local browser:** synthetic admin and restricted access checks, fund create/list/detail persistence, investor create/list/detail persistence, seven fundraising module loads, People directory data, and synthetic evidence retrieval. News had previously been verified with source badges, cover images, and pagination.
- **Resolved local findings:** the earlier fund “Saving…” uncertainty was re-tested once with a unique synthetic name and the record appeared in the refreshed live list and detail view. The earlier People-directory toast was not reproduced locally; the authenticated `/home/people` directory loaded.
- **Confirmed infrastructure:** dev DNS/HTTPS endpoints for staff login and API health/feed returned HTTP 200. Read-only Compose inspection on the Singapore host showed API, MySQL, upload, and all six portal containers healthy. API health reported DB connected.
- **Still not confirmed:** approved backup/restore process, client-controlled attendance/consent/provisioning, and external environment acceptance. Local report execution and scheduling are now evidenced; DDQ and Documents index runs returned no preview rows and remain a data-population limitation. The existing frontend production build completed successfully locally; its ZSE API fallback warning remains an environment/data availability limitation, not a build failure.
- **Prior local-only UAT evidence:** [UAT_ACCESS_VERIFICATION.md](../../UAT_ACCESS_VERIFICATION.md) records synthetic-user failures and must not be represented as a current dev-server retest.

## Handling and safety

Keep client-sensitive responses in an approved access-controlled location, not this Git workspace. Never add passwords, tokens, private investor data, production extracts, or unredacted logs. Do not deploy or alter production for this assessment. Keep all remaining UAT records synthetic until backup/recovery controls and client sign-off are approved.
