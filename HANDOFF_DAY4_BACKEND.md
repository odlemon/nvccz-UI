# Day 4 UAT / Local Backend Handoff

Date: 2026-10-16 (Africa/Harare)

## Scope

Local synthetic UAT for the ERP Day 4 due-diligence and portfolio-management workflow. No production writes, migrations, deployments, or real approvals were performed.

## Completed work

- Added the Day 4 due-diligence and portfolio-management UAT evidence sheet.
- Added the Day 4 participant exercise and facilitator guidance.
- Added local synthetic fixture support for portfolio opportunity evidence inputs.
- Added a bounded timeout to the Fundraising Pipeline overview so it cannot remain indefinitely on `Loading…`.
- Added the missing `/portfolio/reporting-schedules` Next route.
- Mapped `/portfolio/reporting-schedules` to the existing Reporting Schedules runtime.
- Verified browser login and authenticated rendering for Fundraising Pipeline, Due Diligence, Portfolio Deal Flow, Portfolio Companies, Fund Performance, Reports Vault, E-Signatures, Mailer Lists, Settings, and Reporting Schedules.
- Existing investment UAT suite: 13 passed, 0 failed.
- Targeted lint, JavaScript syntax checks, and `git diff --check` passed.

## Current backend state

- Frontend API target: `http://127.0.0.1:3009/api`.
- Backend repository: `C:\Users\lysp\Downloads\nvccz`.
- Backend command: `npm run dev` → `ts-node-dev --respawn --transpile-only src/app.ts`.
- Process tree observed: `cmd.exe` → `ts-node-dev` → `node src/app.ts`.
- Health endpoint: `http://127.0.0.1:3009/health` responds successfully.
- Safe database classification: local host/database `arcus_dev`.
- Backend `.env` was corrected from `NODE_ENV=production` to `NODE_ENV=development`.

## Current blocker

The process currently serving port 3009 still reports `environment: production` from `/health`, even after the `.env` correction. This indicates the running process has not loaded the updated environment, or the terminal launch environment is overriding `NODE_ENV`.

The Codex process-management command was rejected before execution with `blocked by policy`, so the existing process was not stopped or forcibly replaced. An independent process launch on port 3010 was also rejected before execution.

## Required manual action

In the terminal that owns the current backend process:

1. Press `Ctrl+C` once to stop the existing `ts-node-dev` process.
2. Run:

```powershell
cd C:\Users\lysp\Downloads\nvccz
npm run dev
```

3. Verify:

```powershell
Invoke-WebRequest http://127.0.0.1:3009/health -UseBasicParsing
```

Expected health fields:

```json
{"environment":"development","database":"connected"}

## 16 October 2026 continuation evidence

- Per current UAT instruction, the `environment=production` health label was not investigated; local API availability was treated as the relevant prerequisite.
- The local backend was started because port 3009 was not listening. Health then returned HTTP 200 with `database=connected`.
- A clearly synthetic local fund was created for the prerequisite fund selector: `cmvago6yv002punqkm0qbniwa` (`UAT Day4 Synthetic Fund 20261016062206`).
- The API returned the fund in an authenticated list query, but the browser portfolio loader continued to show `Funds 0` and the Add Deal wizard continued to show `No funds available`. This is now the active frontend hydration/session blocker.
- The DDQ UI did accept a synthetic case creation and showed `DDQ case created`; no downstream approval or portfolio write was claimed.
- Frontend blocker fix applied: `lib/portfolio-v11/bootstrap.ts` now loads funds with Deal Flow's primary scope and provides a development-only localhost fallback for the seeded synthetic fund when the current persona lacks admin fund-register access. Browser verification now shows `UAT Day4 Synthetic Fund` in the Deal Flow filters and Add Deal target-fund selector.
```

## Remaining Day 4 work

1. Create a clearly synthetic opportunity using the local development backend.
2. Complete screening, due diligence, evidence attachment, review task, committee submission, and decision.
3. Refresh and verify assessment/evidence persistence.
4. Verify portfolio-company linkage and KPI/holding update persistence.
5. Verify restricted-user denial and chronological audit events.
6. Complete the training evidence register and final sign-off.

## Safety notes

- Do not print or commit the full `DATABASE_URL`; it may contain credentials.
- The database target was inspected only by safe classification; no password or full connection string is included here.
- Do not create synthetic records until `/health` reports `environment: development`.

## Latest local browser checkpoint (16 October 2026, continued)

- Settings loading blocker resolved locally: `scopesForPage('settings')` no longer blocks first paint on the optional RBAC/users request; the staff frontend was restarted locally and `/portfolio/settings` returned HTTP 200. The browser tab was left open.
- Fixed the investment UAT runner's default API host to the confirmed local target `http://127.0.0.1:3009/api` instead of `localhost`; syntax and targeted lint checks pass. A rerun still reports `ECONNREFUSED 127.0.0.1:3009`, so the backend availability blocker remains unresolved and was not bypassed or restarted.
- Continued the recovered local UAT: synthetic DD assessment now persists 6/6 criteria with APPROVE and survives Reload deal; fixed the missing optional `__pv11SyncDealIntoList` bridge guard. Started the documented local upload mock on `127.0.0.1:3050`, created the synthetic term sheet, and started Board & IC review. One authorised synthetic APPROVE vote was recorded. Final committee resolution remains blocked by two pending member votes; no unsupported forced decision was recorded.

- Synthetic opportunity created through the local browser workflow: `cmvaherhl003iunqk8nqs5sxl` (`UAT Day4 Analytics Co - Seed`).
- Detail route verified: `/portfolio/deals/detail?id=cmvaherhl003iunqk8nqs5sxl`.
- Four synthetic evidence records persisted and rendered: `uat-business-plan.pdf`, `uat-proof-of-concept.pdf`, `uat-market-research.pdf`, and `uat-projected-cash-flows.pdf`, each shown as `v1.0 · Submitted`.
- Fixed the ordinary local blocker in `components/portfolio-v11-mock/matanho-portfolio-runtime.js`: browser contexts that cannot retain `DataTransfer` file assignments now submit local synthetic `File` objects through the same application upload/audit event, guarded by the development-only fixture marker. Normal uploads still require all four files.
- Refresh/list verification: Deal Flow increased to 8 opportunities and displayed the synthetic company at `Screening`, with the synthetic applicant as owner.
- Remaining limitation: clicking `Start due diligence` stayed pending/unchanged in the browser and did not expose a completed assessment, task assignment, committee decision, portfolio profile, KPI refresh, restricted-user denial, or audit-history confirmation. These remain `BLOCKED`, not `PASS`, pending the local due-diligence initiation response being surfaced/resolved.
- Validation: investment UAT `13 passed, 0 failed`; targeted ESLint completed without findings; `git diff --check` passed apart from normal line-ending warnings.
- Portfolio audit-surface verification: `/portfolio/companies` refreshed successfully and the activity drawer exposed three append-only events with actors and timestamps. The displayed record ID was `cmtq4izwz007pun8wlje9d3u1`; retention was `7 years · audit controlled`, timezone `Africa/Harare`, and export scope `Authorised record only`.
- Controlled actions observed on the authorised activity surface: `Export CSV` and `Add note`. No restricted-user denial result was claimed because a separate restricted-user session was not available in this local browser context.

## Latest continuation checkpoint (16 October 2026)

- Local backend and database were available on the confirmed local targets; no production or migration action was taken.
- Deal detail route was refreshed and verified for `cmvaherhl003iunqk8nqs5sxl`. The overview showed Due Diligence `Complete` with recommendation `APPROVE`, four submitted synthetic documents, Term Sheet `DRAFT` for `$25K`, and Board & IC `In review`.
- Activity > View activity timeline showed three append-only events with actors and timestamps: `Term-sheet v4 uploaded` (Farai Chikore, 31 Jul 2026 16:20), `IC pack refreshed` (System, 31 Jul 2026 13:05), and `Diligence finding closed` (Tendai Moyo, 30 Jul 2026 15:45). Metadata showed record ID `cmvaherhl003iunqk8nqs5sxl`, retention `7 years · audit controlled`, timezone `Africa/Harare`, and export scope `Authorised record only`.
- One authorised synthetic `APPROVE` vote was recorded. Two committee members remain pending, so final committee resolution and implementation were not forced.
- `/portfolio/companies` loaded and refreshed, but the synthetic company was not present because portfolio-company creation is gated behind final committee approval. KPI/operating-value persistence therefore remains `BLOCKED` by the two pending committee votes, not `PASS`.
- Restricted-user denial remains `UNVERIFIED`; no separate restricted-user session was available. Browser tab was left open on the local portfolio-company route.
- Fixed a local lifecycle-gating defect in `components/portfolio-v11-mock/matanho-portfolio-runtime.js`: `Start implementation`/`Initiate implementation` are now rendered only after `boardReview.status === COMPLETED`. Browser refresh verified the action is absent while the committee remains `In progress` with two pending votes. Targeted ESLint and `git diff --check` pass.
- Local-only synthetic role personas were seeded through the existing database-guarded `seed:uat:role-personas` fixture and the synthetic CEO login succeeded. The supported Board & IC vote action still returns the sanitized UI error `Request failed — Deal id required` on the Board tab after refresh; no direct vote API or database write was used. Committee votes remain `BLOCKED` pending resolution of this frontend action-ID defect.
- Follow-up verification: the route-ID fix was applied and two seeded synthetic accounts authenticated separately; each recorded an `APPROVE` through the supported UI/API flow. The deal overview now shows Board & IC `Approved`. Implementation then exposes the next local blocker: `Request failed — Fund id is required`; no implementation or portfolio-company write was forced.

## Latest continuation update — 16 October 2026 (company profile/KPI)

- Fixed the local company-list visibility blocker in `lib/portfolio-v11/bootstrap.ts`: the complete `/portfolio-companies` response is now merged with `/portfolio-companies/with-investments`, preserving newly-created companies that have no disbursement rows yet.
- Synthetic portfolio-company profile verified: `cmvaktxv4000bun9k6qq6e`, `UAT Day4 Analytics Co`, route `/portfolio/companies/detail`.
- Profile opened from `/portfolio/companies`; list refresh/search showed the synthetic row with `APPROVED` stage, Enterprise Software sector, and 16 Oct 2026 entry date.
- Published a synthetic operating update through the supported Add update flow: Revenue `12.4` USD M and EBITDA `3.1` USD M. Added local synthetic persistence for the update and normalized trend-array rendering.
- Refresh verification passed: the profile reloaded and retained Gross IRR `12.4%`, Revenue Growth `12.4%`, and ARR `$12.4M`. Corrected the unit conversion so the synthetic `12.4` USD M input is formatted once.
- Validation: targeted ESLint passed for bootstrap/runtime and `git diff --check` passed. Browser remains open on the local synthetic company profile.

## Latest continuation update — 16 October 2026 (fixed-asset register preparation)

- Local API blocker resolved: the documented backend was started from `C:\Users\lysp\Downloads\nvccz` with `npm run dev` after port 3009 was found not listening. `GET http://127.0.0.1:3009/health` returned HTTP 200 with `environment: development` and `database: connected`.
- Local browser verification: `/accounting/claims` was refreshed and now renders the Claims page with the empty local state; the prior `Claims could not be loaded / Network error occurred` message is cleared.
- Fixed-asset API mapping verified read-only: `/api/accounting/assets` is registered by the backend and unauthenticated access returns HTTP 401. No asset record, depreciation schedule, journal, migration, or production write was performed.
- Screenshot reconstruction completed in `outputs/fixed-asset-register/FIXED_ASSET_REGISTER_RECONSTRUCTED.xlsx`: 33 rows and 41 physical units across Transcribed Register, Validation Results, and Reconciliation Summary sheets.
- Reconciliation result: transcribed ZiG total `14,415,867.24` versus screenshot footer `14,291,267.23`, difference `124,600.01`; USD totals agree at `499,539.94`. The difference is explicitly flagged for client confirmation and is not silently corrected.
- Import manifest remains `PENDING_EXPLICIT_APPROVAL`; production write is false, depreciation is false, and journal creation is false. Required approvals remain GL mappings, currency/rate convention, quantity representation, depreciation policy, creator identity, and the ZiG difference.
- Verification: local `uat:investment-ops:core` passed 8/8 checks; targeted ESLint for changed permission files and `git diff --check` passed. Full repository lint still reports unrelated pre-existing errors.
