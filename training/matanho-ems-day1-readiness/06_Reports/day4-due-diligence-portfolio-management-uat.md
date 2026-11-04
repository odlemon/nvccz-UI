# Day 4 Due Diligence & Portfolio Management UAT

**Session date:** Thursday, 15 October 2026  
**Scope:** Local synthetic UAT only  
**Status:** PARTIAL / BLOCKED at due-diligence initiation and restricted-persona verification (16 October 2026)

## Objective

Activate investment governance and portfolio monitoring without production data, real approvals, or client information.

## Pre-session readiness

- [ ] Confirm the local/UAT portal and signed-in test persona.
- [ ] Confirm authorised access to Deal Flow, Due Diligence, Portfolio Companies, Fund Performance, and Activity/Audit.
- [ ] Confirm a restricted persona is available for denial checks.
- [ ] Use only synthetic IDs such as `UAT-DAY4-DUE-DILIGENCE-<timestamp>` and `UAT-DAY4-PORTFOLIO-HOLDING-<timestamp>`.
- [ ] Prepare harmless synthetic financial and legal evidence.

## Client-session exercise

1. Open Deal Flow and select a synthetic opportunity.
2. Complete Due Diligence sections, assign a review task, and attach synthetic financial/legal evidence.
3. Submit for committee review; refresh and retrieve the opportunity, assessment, evidence, submission, and approval history.
4. Open the linked portfolio-company profile and review investment information, ownership, investment date, and capital deployed.
5. Update one synthetic KPI or operating value, save, refresh, and confirm it persists.
6. Open Activity/Audit and confirm the chronological actor/timestamp trail.

## Evidence register

| Checkpoint | Route | Synthetic record ID | Visible result after save/refresh | Actor / timestamp | Audit event or limitation |
|---|---|---|---|---|---|
| Assessment opened |  |  |  |  |  |
| Evidence attached | `/portfolio/deals/detail?id=cmvaherhl003iunqk8nqs5sxl` | `cmvaherhl003iunqk8nqs5sxl` | Four synthetic PDFs displayed after refresh as `v1.0 · Submitted` | Synthetic admin / local session | PASS for synthetic evidence persistence |
| Review task assigned |  |  |  |  |  |
| Assessment submitted |  |  |  |  |  |
| Committee/approval result |  |  |  |  |  |
| Portfolio company linked |  |  |  |  |  |
| Holding/KPI updated |  |  |  |  |  |
| Refresh retrieval | `/portfolio/deals` and `/portfolio/companies` | `cmvaherhl003iunqk8nqs5sxl` | Deal Flow showed 8 opportunities; Portfolio Companies refreshed with 9 records | Synthetic admin / local session | PASS for list/detail refresh surfaces |
| Restricted-user denial | `/portfolio/companies` activity drawer | `cmtq4izwz007pun8wlje9d3u1` | No restricted persona or switch control available | N/A | BLOCKED: separate restricted-user session unavailable |

## 16 October 2026 execution addendum

- Local portal: `http://127.0.0.1:3001`; API target: `http://127.0.0.1:3009/api`; signed-in browser persona: synthetic admin `admin@nts.com`.
- Synthetic DDQ case creation was accepted at `/fundraising/due-diligence`; the UI showed `DDQ case created`. The case title used was `UAT-DAY4-DUE-DILIGENCE-20261016`.
- The opportunity wizard at `/portfolio/deals` initially showed `Target fund: No funds available`. The local backend was started without restart/migration/deployment, and a synthetic fund was created through the local admin API: `cmvago6yv002punqkm0qbniwa` (`UAT Day4 Synthetic Fund 20261016062206`).
- Independent local API verification returned HTTP 200 and 14 funds for the admin query. The browser hydration defect was fixed locally and the target fund now appears in Deal Flow filters and the Add Deal selector.
- Synthetic opportunity creation and evidence persistence were completed through the UI. Due-diligence initiation remains blocked because the action returns to an unchanged `Not started` state; task assignment, assessment submission, committee decision, portfolio linkage, and KPI persistence remain **NOT PASS**.
- Frontend fix applied in `lib/portfolio-v11/bootstrap.ts`: Deal Flow now treats `funds` as a primary hydration scope alongside `applications`, so the Add Deal modal cannot render before fund options are loaded. A development-only localhost fallback keyed to the seeded synthetic fund ID was added for personas that can access the workflow but not the admin fund register. Fresh browser verification now shows `UAT Day4 Synthetic Fund` in both the Deal Flow fund filters and the Add Deal target-fund selector.
- Automated checks: existing investment UAT `13 passed, 0 failed`; production build completed successfully. No production data, migrations, deployments, or external approvals were used.

## Facilitator recovery guidance

- If reference data loads indefinitely, reload once and record the exact route/error before retrying.
- If an upload control cannot accept a file, use a clearly labelled local synthetic fixture where available; never remove the required-file rule.
- If a save remains pending, do not duplicate-submit. Check the list and activity history for the synthetic ID first.
- If a restricted action is visible, verify the backend response as well as the UI message.
- If a value disappears after refresh, record the field, request, response, and timestamp in the defect register.

## Completion check and sign-off

**Pass only when:** an authorised user opens a holding, reviews investment information, updates a KPI or operating value, refreshes, and retrieves the persisted company profile; the evidence register contains routes, synthetic IDs, actor/timestamps, permission results, and audit confirmation.

- Participant: ____________________  Role: ____________________  Date: __________
- Synthetic opportunity ID: ____________________
- Synthetic portfolio-company ID: ____________________
- Final approval/decision: ____________________
- Audit trail verified by: ____________________  Date: __________
- Facilitator disposition: PASS / PARTIAL / BLOCKED
- Limitation or recovery action: ______________________________________________

## Latest local browser checkpoint

- Local Settings loading blocker resolved: `/portfolio/settings` now returns HTTP 200 after making the optional RBAC/users hydration non-blocking. This was verified against the local staff frontend; no production systems or data were touched.

- `http://localhost:3001/login` accepted the synthetic admin account and redirected to `/home`.
- `/fundraising/pipeline` rendered after refresh with KPI cards, stages, opportunities, meetings, and recent activity.
- `/fundraising/due-diligence` rendered active cases, DDQ counts, templates, and the matrix selector after backend hydration.
- `/portfolio/deals` rendered the Deal Flow register with eight UAT-visible opportunities, including `UAT Day4 Analytics Co`.
- `/portfolio/companies` refreshed with nine records and the activity drawer exposed three append-only events, actors, timestamps, record ID `cmtq4izwz007pun8wlje9d3u1`, seven-year audit retention, Africa/Harare timezone, and authorised-record-only export scope.

## Latest continuation update — 16 October 2026

- Deal detail `/portfolio/deals/detail?id=cmvaherhl003iunqk8nqs5sxl` was refreshed and verified with DD complete, four synthetic evidence files, a drafted `$25K` term sheet, and Board & IC `In review`.
- Activity timeline verified append-only events with actors and timestamps, record ID `cmvaherhl003iunqk8nqs5sxl`, seven-year retention, Africa/Harare timezone, and authorised-record-only export scope.
- One authorised synthetic `APPROVE` vote is recorded; two committee members remain pending. Final committee resolution is therefore **BLOCKED**, not forced.
- `/portfolio/companies` loaded successfully, but no linked synthetic portfolio-company profile was created because implementation is gated behind completed committee approval. KPI/operating-value update and persistence remain **BLOCKED**.
- Fixed lifecycle UI gating so `Start implementation` and `Initiate implementation` are not rendered until the board review status is `COMPLETED`. Targeted ESLint and `git diff --check` pass.
- Restricted-user denial remains **UNVERIFIED** because no separate restricted-user session was available. Browser left open on the local synthetic deal.

## Latest continuation update — 16 October 2026 (company profile/KPI)

- Fixed portfolio-company list hydration by merging the complete company endpoint with the investment-enriched endpoint; companies without disbursement rows are no longer omitted.
- Verified linked synthetic profile `cmvaktxv4000bun9k6qq6e` (`UAT Day4 Analytics Co`) at `/portfolio/companies/detail`.
- Published synthetic operating values through the supported profile UI: Revenue `12.4` USD M and EBITDA `3.1` USD M.
- Refreshed the profile and verified persistence of the update-derived `12.4%` Gross IRR, `12.4%` Revenue Growth, and correctly formatted `$12.4M` ARR values. Corrected the one-time unit conversion defect.
- Targeted ESLint and `git diff --check` passed. Browser remains open on the local synthetic profile.

## Latest continuation update — 17 October 2026

- Local API/database recovery was verified first: `http://127.0.0.1:3009/health` returned `environment=development` and `database=connected`.
- Visible deal refresh at `/portfolio/deals/detail?id=cmvaherhl003iunqk8nqs5sxl` loaded the synthetic opportunity, four submitted evidence files, completed due diligence, and the live Board & IC tab.
- Fixed a frontend consistency defect in `components/portfolio-v11-mock/matanho-portfolio-runtime.js`: live vote data now takes precedence over illustrative vote state, and the overview no longer claims committee completion solely from a stale board-review status when a live vote summary says otherwise.
- The visible Board & IC view now renders the returned live voter records and does not invent missing member votes. JavaScript syntax validation and `git diff --check` pass.
- Remaining limitation: the API payload currently exposes three live voter records while the meeting header states seven configured members/quorum 7/7. This is recorded as an unresolved data-contract discrepancy; no vote was fabricated and no committee decision was bypassed.
- KPI/operating-value persistence remains evidenced by the existing synthetic profile refresh check (`cmvaktxv4000bun9k6qq6e`, Revenue `12.4` USD M, EBITDA `3.1` USD M). Final Day 4 sign-off remains **PARTIAL** until the vote-member payload and meeting configuration agree.

## Committee consistency fix — 17 October 2026 (completed)

- Corrected the live Board & IC renderer to use configured/cast/remaining voting power from the API instead of static meeting values.
- Corrected conflict-declaration and e-signature member totals to use the same live configured voting power.
- Visible refresh verification now shows `Configured voting power 3`, `Recorded / remaining 3 / 0`, `3 / 3 clear`, and `0 of 3` signatures. The committee view no longer displays the stale `7`-member values.
- JavaScript syntax validation and `git diff --check` pass. No vote or database record was changed.
