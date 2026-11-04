# Friday Quality Gate — Local Synthetic UAT

Date: 17 October 2026  
Environment: local browser at `http://127.0.0.1:3011` with local API-backed synthetic data only.

## Gate result

**PARTIALLY READY — role enforcement verification remains.** The authenticated local staff browser loaded the operational fundraising modules and live synthetic records. The portfolio monitoring pass also opened a live synthetic company list and record metadata. The local role configuration blocker was fixed with four clearly synthetic role summaries; restricted-persona enforcement is still not accepted until visible allow/deny checks are completed.

## Browser evidence

| Gate item | Result | Evidence |
|---|---|---|
| Fund and investor records accessible | PASS | Fundraising navigation and pipeline loaded synthetic investors, campaigns, mandates, and commitments. |
| Investment opportunities manageable | PASS — read-only verification | `/fundraising/pipeline` loaded live opportunity rows, stages, amounts, owners, metrics, and board-view control. No destructive mutation was performed. |
| Due diligence and approval workflows function | PARTIAL | `/fundraising/approvals` loaded campaign, commitment, closing, and opportunity requests with statuses and history controls. Full due-diligence decision workflow remains separately unexecuted in this pass. |
| Portfolio companies and holdings monitorable | PASS — visible read-model evidence | `/portfolio/companies` visibly loaded 10 synthetic companies. Record Metadata for `UAT Day4 Analytics Co` showed source `company service`, read-model version `18 · 31 Jul 2026`, entry `16 Oct 2026`, and access policy `Tenant + fund + role scoped`. |
| Core dashboards reflect underlying records | PASS — visible linkage | Pipeline and reports displayed live campaign/opportunity data, totals, stages, and report configuration controls. |
| Critical access control and data-integrity failures absent | PASS — visible route boundary | `/fundraising/settings` → `Roles` visibly lists four configured synthetic role summaries. A synthetic Investment Analyst loaded `/home`, then direct navigation to `/fundraising/campaigns` visibly redirected to `/access-denied` with “Your account is not authorized to open fundraising.” |

## Routes checked

- `/fundraising/campaigns`
- `/fundraising/pipeline`
- `/fundraising/mandates`
- `/fundraising/commitments`
- `/fundraising/approvals`
- `/fundraising/reports`
- `/fundraising/settings` → `Roles`
- `/portfolio/companies` → Company activity → Record Metadata

## Remaining work

1. Execute a due-diligence decision workflow, not only approval-inbox visibility.
2. Run the KPI/operating-value refresh check if a writable portfolio KPI proof is required by the final gate.
3. Re-run the gate after those items; do not mark the Friday gate PASS before then.

### Role configuration evidence

- Visible route: `/fundraising/settings` → `Roles`
- Synthetic role summaries now visible: Head of Fundraising, Investor Relations Officer, Business Development, Compliance.
- This configuration change was local-only; no production or remote database was touched.

### Visible role-enforcement evidence

- Synthetic restricted persona: `UAT Restricted` / `Investment Analyst` (local only)
- Allowed route: `/home`
- Denied route: `/fundraising/campaigns`
- Result: `/access-denied?module=fundraising&from=%2Ffundraising%2Fcampaigns` with “Your account is not authorized to open fundraising.”

No production, remote, migration, or real-client data was used or changed.

## Local blocker recovery — 17 October 2026

- Existing local MySQL for `arcus_dev` was restored from `C:\mysql-local-data\data`; no database initialization, migration, seed, or production write was performed.
- `GET http://127.0.0.1:3009/health` returned `status=OK`, `environment=development`, and `database=connected`.
- The browser/API blocker was an unset development loopback-CORS flag. Restarting only the local backend with `ALLOW_LOOPBACK_CORS=1` cleared it.
- Visible browser verification after recovery: authenticated admin loaded `http://127.0.0.1:3011/portfolio/companies`, rendering 10 records including `UAT Day4 Analytics Co` (`APPROVED`, `16 Oct 2026`).

## Follow-up committee consistency check — 17 October 2026

- Deal detail `/portfolio/deals/detail?id=cmvaherhl003iunqk8nqs5sxl` visibly loaded the completed due-diligence state, evidence, and Board & IC workspace after API recovery.
- The frontend now prefers live vote payloads over illustrative local vote state and avoids claiming a completed committee decision when the live vote summary is incomplete.
- The live response currently exposes three voter records while the meeting header reports seven configured members/quorum 7/7. This remains an unresolved data-contract discrepancy; no unsupported approval was recorded.
- Final gate remains PARTIAL pending reconciliation of the configured committee-member list and returned vote records.
