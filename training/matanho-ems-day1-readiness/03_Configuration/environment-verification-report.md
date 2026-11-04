# Training environment verification report

**Checked:** 15 Oct 2026  
**Selected candidate:** Singapore dev / staff portal. Suitable for continued synthetic UAT; **not yet approved for client financial data or live training** because backup/recovery and business workflows are not accepted.  
**Production:** not accessed or changed in this assessment.

| Check | Result | Evidence / limitation |
|---|---|---|
| Staff URL / network | VERIFIED | `https://dev.matanho.com/login` HTTP 200; signed-in browser used `https://dev.matanho.com/`. |
| API / DB health | VERIFIED | `https://dev-api.matanho.com/health` HTTP 200; health payload reports status OK and database connected. |
| News endpoint | VERIFIED | Public feed endpoint returned HTTP 200; prior authenticated UI check showed covers, source badges and page controls. Not a proxy for business-module APIs. |
| Dev containers | VERIFIED, read-only | Compose status: API, MySQL, upload, and six UI portals all running/healthy on Singapore host at check time. |
| Admin authentication | PARTIAL | Existing browser session displayed Admin NTS. Fresh logout/login and an ordinary account were not tested in this pass. |
| Business workflows | BLOCKED / PARTIAL | Funds list loaded with 0 funds. Synthetic create request remained “Saving…” >30 seconds without outcome/ID. Other module workflows not yet accepted. |
| User-visible upload | NOT VERIFIED | Upload container health is not proof of a file upload/retrieval workflow. |
| Backup/restore | BLOCKED | Read-only check found the News ingestion cron only, no database backup cron, and no backup/dump file in the checked `/opt/arcus-dev` backup locations. Named MySQL volume exists but is not a backup. No restore test. |
| TLS | VERIFIED | Staff and API HTTPS health endpoints returned HTTP 200. |
| Build identity | DOCUMENTED | Dev staff UI/API last deployment commits are recorded in project context/handoff; no image digest/build marker re-checked in this pass. |
| Client accessibility | PARTIAL | Public domain resolved and loaded from this machine; attendee network/VPN/firewall access is untested. |

## Operational recommendation

Keep training data synthetic until the fund and investor workflows pass and an encrypted, access-controlled backup plus isolated restore drill is evidenced. Agree RPO/RTO and retention with the client/IT owner. Do not improvise a production copy or move production data into dev.
