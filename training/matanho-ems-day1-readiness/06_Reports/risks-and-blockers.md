# Risks and blockers summary

| Risk | Impact | Likelihood / evidence | Mitigation / owner |
|---|---|---|---|
| Fund write outcome unknown | Duplicate/inconsistent fund configuration; training cannot show core setup | High; UI stayed Saving… >30s | Do not retry; query persistence and API request outcome. API + QA. |
| No backup/restore evidence | Loss of training records; cannot safely recover | High; no backup artifact/job found in bounded dev inspection | Agree encrypted backups, retention, RPO/RTO and isolated restore. IT/DevOps. |
| People directory Unauthorized toast | Confusing user experience; directory/assignment features unavailable | Medium; toast observed; endpoint policy mismatch in source | Capture exact HTTP status and token presence safely; validate audience policy; retest roles. API + frontend. |
| Overbroad restricted roles / payroll ownership gaps | Confidential data or unauthorized functions may be accessible | High; prior local synthetic UAT report | Confirm actual identity/action policy; server-side allow/deny matrix. Client sponsor + security. |
| Accounting requisition workflow missing/unverified | Required create-only training cannot be demonstrated | High; local source search found no route; dev not validated | Define exact requisition process and build only approved scope; QA. |
| Stale/zero portfolio reporting | Misleading financial demo | High; 0 funds and July data refresh shown | Confirm correct data/source/as-of; label synthetic; reconcile independently. |
| Ordinary-user and uploads untested | Training could fail mid-session | Medium-high | Complete fresh browser login and upload/retrieve flows. |
| Evidence not persisted | Findings difficult to audit | Medium | Save redacted screenshots/traces in approved evidence folder and link in log. |

No production changes were made. No real client data was entered intentionally.
