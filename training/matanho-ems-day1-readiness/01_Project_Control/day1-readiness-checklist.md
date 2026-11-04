# Day 1 readiness checklist

Assessment date: 15 October 2026. The roadmap date 12 October 2026 has passed; this checklist records current evidence and is not a retrospective claim of delivery.

| Gate | Status | Evidence / next action |
|---|---|---|
| Client-accessible training URL | PARTIALLY READY | `https://dev.matanho.com/` returns the login page over HTTPS. Confirm attendee network access and final domain/build before session. |
| Admin login | PARTIALLY READY | Signed-in browser showed Admin NTS at dev. Record non-sensitive test evidence; repeat fresh login/logout before training. |
| Ordinary-user login | VERIFIED LOCALLY | Synthetic restricted persona loaded `/home` and received controlled denial on fundraising routes; no credentials recorded. |
| Core navigation / Home | PARTIALLY READY | Home rendered for admin. Cross-module return-to-Home not retested in this dev run. |
| Seven priority modules assessed | VERIFIED LOCALLY | Campaigns, pipeline, mandates/RFPs, commitments, approvals and reports loaded live synthetic records; role access is recorded separately. All eleven report cards were also run visibly with synthetic local schedules; DDQ and Documents index returned no preview rows, while Audit log returned timestamped rows. |
| Fund creation and retrieval | VERIFIED LOCALLY | Synthetic fund `LOCAL-P03-NEXT-FUND-20261017` appeared in the refreshed list and opened in detail. |
| Investor creation and retrieval | VERIFIED LOCALLY | Synthetic investor `LOCAL P05 Synthetic Investor 20261017` appeared in the refreshed directory and opened in detail. |
| Role permissions | VERIFIED LOCALLY | Synthetic restricted persona allow/deny evidence is recorded in the implementation tracker. |
| Upload workflow | VERIFIED LOCALLY | Day 4 synthetic evidence upload and fresh retrieval are recorded; no client files used. |
| Backup and restore | BLOCKED | No backup file/job found in bounded dev checks; no restore test. Obtain owner-approved backup plan and run a safe restore drill. |
| Synthetic demo data | READY FOR CONTROLLED UAT | Fund, investor, portfolio and evidence records have visible local retrieval evidence. |
| Trainer guide / exercises | PARTIALLY READY | Core routes and evidence are now recorded; client sign-off and backup/recovery acceptance remain required. |
| Client data templates / registers | READY AS TEMPLATES | Editable templates created; import compatibility still requires schema validation and client confirmation. |
| Defects / regression | PARTIALLY READY | Prior Saving and directory-toast findings were re-tested locally; no current reproduction. Backup/restore remains open; report scheduling is now evidenced locally, with empty DDQ/Documents previews recorded as limitations. |
| Day 2 preparation | PARTIALLY READY | Checklist prepared; do not schedule until data, investor workflow, roles, and environment recovery are confirmed. |

**Gate decision: BLOCKED.** Login, access control, fund persistence, investor registration, and recovery are material acceptance items. No participant should enter real client financial or investor data into this dev environment until data handling and restore controls are approved.

## 15 Oct 2026 local UAT addendum

- Local synthetic Payroll role/API and restricted-persona API checks are now evidenced in `EXECUTION_QUEUE.md`.
- Browser evidence confirms restricted My Pay access, Payroll administration denial, FP&A direct-route denial, Home return navigation, Events creation/persistence, and shared Procurement requisition records.
- This does not change the gate decision: client attendee identities, attendance, consent, provisioning, fund/investor persistence, upload controls, and backup/restore approval remain outstanding.
