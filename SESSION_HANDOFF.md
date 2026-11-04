# Arcus / NVCCZ — Evidence-Based Session Handoff

Generated 2026-10-15; current News deployment evidence appended at the end. This document records verified evidence only. See `docs/ai-context/PROJECT_CONTEXT.md` for the full architecture reference.

## 1. Project and Task Overview

Arcus/NVCCZ is a Next.js multi-portal investment ERP with Staff, LP, Investee, Apply, Vendor, and Events frontends; a shared TypeScript/Node API; Prisma/MySQL; an upload service; Docker Compose; and Traefik. The current deployment follow-up publishes and deploys the News persistence, cover, pagination, and ingestion changes to Singapore dev and the requested NVCCZ production staff/API services.

## 2. Current Overall Status

| Area | Implementation | Deployment | Verification |
|---|---|---|---|
| Frontend News UI | IMPLEMENTED | DEPLOYED to Singapore dev and production staff (`0d9c113`) | Build/health/login verified; authenticated News grid not opened |
| Backend News | IMPLEMENTED | DEPLOYED to Singapore dev and production API (`9288f41`) | TypeScript builds, API pagination, ingestion and covers verified |
| Production News table | IMPLEMENTED | APPLIED: only `news_articles` DDL | Public feed returns 19 records; no seed/blanket migration |
| Singapore dev Compose | IMPLEMENTED | API/staff healthy; other services unchanged | Public `/login`, public News API and scheduled ingestion verified |
| Production Compose | IMPLEMENTED | API/staff healthy; other portals unchanged | Public `/login`, public News API and scheduled ingestion verified |
| News cron | IMPLEMENTED | INSTALLED on dev and production | Every 10 minutes; manual and scheduled ticks succeeded |

## 3. Completed Work

| Item | Files/components | Evidence | Status |
|---|---|---|---|
| CEO/admin RBAC | Backend permission middleware/routes; procurement runtime | CEO 200 vs analyst 403 API checks; BROWSER-009/010 | BROWSER VERIFIED |
| News aggregation | `C:\Users\lysp\Downloads\nvccz\src\routes\newsFeedRoutes.ts`; home news wiring | 60 articles; nine source statuses `ok` locally | LOCALLY VERIFIED |
| Frontend build fixes | Global CSS, FP&A components/sidebar, Employee Hub icon | `npm run build`, 407 pages | LOCALLY VERIFIED |
| Test fixes | backend test-mode app, performance URL isolation, LP RBAC import | `npx tsc --noEmit`; focused tests | LOCALLY VERIFIED |
| Synthetic personas | `scripts/seed-uat-role-personas.ts` | Local login checks recorded in UAT tracker | LOCALLY VERIFIED |
| Production inspection | Production SSH/container/API/domain checks | Healthy containers/API and HTTPS checks recorded; no writes | READ-ONLY VERIFIED |
| Git publication | UI `f7d3154`; API `a5321dc` | Both pushed to public GitHub remotes | IMPLEMENTED |
| Dev recovery | `/swapfile`, Docker cache cleanup | 8 GiB swap active; 57.76 GB cache reclaimed | VERIFIED |

News follow-up commits: UI `0d9c113` on `staging-accounting-payroll-sweep`; API `3408978` and final cover-scraping follow-up `9288f41` on `staging`. No unrelated untracked files were staged.

## 4. Changes Made to the Codebase

Frontend branch `staging-accounting-payroll-sweep`: commits `a436472` and `f7d3154`, pushed to `odlemon/nvccz-UI`. Changes cover RBAC navigation, news API consumption, Tailwind/build repairs, icon correction, package manifests, and sequential dev build configuration. Backend branch `staging`: commit `a5321dc`, pushed to `odlemon/nvccz`; changes cover RBAC guards, news aggregation, test infrastructure, and synthetic local personas.

Untracked files remain in both worktrees, including archive files and previous handoff/deployment artifacts. They were not included in the deployment commits and must not be deleted or committed without review. One dedicated News migration was added and explicitly applied on both databases; no seed or unrelated migration was run.

## 5. Local Environment Status

Last recorded local evidence: Staff frontend at `http://localhost:3001`; backend API on port 3009; verification API process on 3011; local MySQL on 3306. Staff browser smoke tests and partial module tests passed. LP, Investee, Apply, Vendor, and Events simultaneous runtime health was NOT TESTED. Upload runtime status was NOT VERIFIED.

## 6. Production Environment Findings

Earlier production inspection was read-only. The current user-authorized News deployment is recorded in section 17 below; no domains, certificates, or DNS were changed.

## 7. New Development Server Status

Development host `109.199.123.21` is an Ubuntu/Docker host with unrelated workloads that were not intentionally stopped. Target directory is `/opt/arcus-dev`. The UI and API Git branches were checked out from GitHub. The first Compose build was killed by memory pressure: about 11 GiB used, near-zero available memory, and load average above 50. After the user rebooted the host, checks showed about 8 GiB available; an 8 GiB swapfile was enabled and Docker builder cleanup reclaimed 57.76 GB. The dev services have not yet been confirmed started and healthy.

## 8. Development Domain and SSL Status

| Application | Domain | DNS | SSL | Deployment | Browser |
|---|---|---|---|---|---|
| Staff | `dev.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| LP | `dev.lp.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| Investee | `dev.investee.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| Apply | `dev.apply.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| Vendor | `dev.vendor.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| Events | `dev.events.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |
| API | `dev-api.matanho.com` | UNVERIFIED | UNVERIFIED | Not confirmed | No |

These assignments come from the Compose host rules; configuration is not evidence of DNS or SSL.

## 9. Seed Data and Database Status

Canonical schema: `C:\Users\lysp\Downloads\nvccz\prisma\schema.prisma`. Prisma generation completed during an attempted API image build. Local synthetic role personas were created/tested according to the UAT tracker. No dev-VPS migration or seed is confirmed. Secrets and passwords are intentionally omitted.

## 10. Tests and Verification Results

- Frontend `npm run build`: passed locally, 407 pages; ZSE fallback warning only.
- Backend `npx tsc --noEmit`: passed locally.
- Focused CFO permission suite: 8 passed; LP RBAC suite: 2 passed.
- API RBAC: CEO protected endpoints 200; Investment Analyst 403.
- Browser BROWSER-001 through BROWSER-010: recorded for login/home, FP&A, payroll restriction, accounting, procurement RBAC, and direct route denial.
- News API: 60 normalized articles; all nine requested source statuses `ok` locally.
- Dev Compose build: failed/killed by memory pressure; no successful `docker compose ps` health evidence.
- Dev DNS, SSL, SSE, full portal matrix, requisitions, and personal payroll isolation: NOT TESTED.

## 11. Problems and Blockers

1. Dev build resource exhaustion is verified. Mitigations are swap, builder-cache cleanup, sequential service builds, and a 1536 MB API heap build argument. Post-mitigation Compose success is UNVERIFIED.
2. Dev DNS/SSL is UNVERIFIED; do not change DNS or request certificates casually.
3. Full browser regression remains unfinished.
4. Lint has legacy findings; performance tests have stale fixture/API assumptions.
5. Backend news is verified, but external article cards in the rendered `/home/news` UI are not independently confirmed.

## 12. Remaining Work Checklist

- [ ] Run the Git deployment helper after cleanup and capture complete Compose output.
- [ ] Confirm all six UI services, API, MySQL, and upload are healthy.
- [ ] Verify API/upload health, SSE/realtime, and direct diagnostic ports.
- [ ] Verify DNS/SSL only after intentional DNS pointing.
- [ ] Browser-test all dev portals with synthetic data.
- [ ] Verify external news cards in the actual dev News route.
- [ ] Complete procurement requisition, accounting requisition, personal payroll, and full portal regression.
- [ ] Update this handoff, tracker, and project context with deployment evidence.

## 13. Immediate Next Steps

1. Read-only SSH check for swap, memory, Docker cache, and `arcus-dev` containers.
2. Run `scripts/deploy-arcus-dev-git.py` and capture each sequential build result.
3. Record `docker compose ps`, API `/health`, upload `/health`, and UI responses.
4. Perform browser/domain/SSE checks only after service health is proven.

## 14. Commands and Operational References

```powershell
cd C:\Users\lysp\Downloads\nvccz-new
npm run dev:staff
npm run build
python scripts/deploy-arcus-dev-git.py

cd C:\Users\lysp\Downloads\nvccz
npm run dev
npx tsc --noEmit
npm test
```

Commands above are derived from repository scripts. Do not run migrations/seeds against production.

## 15. Critical Warnings for the Next Agent

Production remains read-only for discovery and unrelated work. For this News task only, the user explicitly authorized the documented deployment and one News table. Do not expand that scope, run seeds or unrelated migrations, expose secrets, overwrite uncommitted files, share databases, stop unrelated workloads, create a second Traefik instance, or treat Git publication as proof of deployment. Verify exact commits and health output.

## 16. Exact Resume Point

### News module follow-up — 2026-10-15

- Local-only News boundary fix completed: external RSS items are marked read-only in the Home runtime, preventing their RSS IDs from being submitted as internal post IDs and eliminating the `Post not found` reply path.
- Backend news feed now extracts enclosure/media thumbnails, filters items without HTTP thumbnails, and returns bounded pagination metadata. No scheduler was activated and no remote environment was changed.
- Frontend build and backend TypeScript checks completed without reported errors. Browser re-verification after this change remains outstanding.
- Follow-up browser verification completed with Playwright after removing duplicate local backend dev processes that were colliding on port 3009. Twenty News cards and thumbnails rendered; article open, publisher link, read-only external detail, and Back-to-news behavior passed. Evidence is recorded as NEWS-004 in `docs/uat/UAT_FIX_TRACKER.md`.

**LAST VERIFIED ACTION:** After reboot, the dev VPS had about 8 GiB available RAM; 8 GiB swap was active and 57.76 GB Docker build cache was reclaimed.

**CURRENT BLOCKER:** No build blocker remains. The full dev stack is running. The empty development database required Prisma schema bootstrap with `db push`; the API is healthy and its internal `/health` returned 200. Public DNS/SSL and browser verification remain unverified.

**NEXT ACTION:** Verify the configured dev portal domains/browser routes if DNS/Traefik is intentionally available; otherwise use the exposed diagnostic UI ports and record the limitation. Do not run production migrations or alter production services.

### Dev data update — 2026-10-15

- The empty `arcus_dev` database was bootstrapped with Prisma `db push`; no production database was touched.
- Seeded admin/base departments, LP and investee test records, FP&A presentation data, portfolio/investment/stock-cash demos, fundraising data, payroll baseline/history, and synthetic procurement/performance/UAT staff personas.
- The first persona seed pass was blocked by the base seed's single `admin` role; `npm run sync:roles` created the hardcoded role catalog, after which persona, procurement, performance, and payroll seeds succeeded.
- All six UI containers, API, upload, and MySQL were healthy after seeding; public DNS/SSL/browser verification remains unverified.

**EXPECTED RESULT:** Once access is restored, all required services build sequentially, start under `/opt/arcus-dev`, and respond on configured diagnostic ports.

### Independent ERP access UAT — 2026-10-15

- Read current project context, this handoff, deployment progress, both git statuses, and the user's full pasted verification task before testing. The current local stack responds at `http://localhost:3001` and API health at `http://127.0.0.1:3009/health` (HTTP 200). No remote or production operations were performed.
- Created `UAT_ACCESS_VERIFICATION.md` with evidence, scope distinctions, API results, screenshots, statuses, and acceptance blockers. Browser evidence resides in `test-artifacts/uat-access/`.
- Actual named accounts (Tino, Sophia, Ropa, Brendon, Natsai, Vongai, Gilbert) are absent from local DB. Seven synthetic UAT accounts were tested and are clearly described as role-equivalent only.
- Home click-navigation passed from Portfolio, FP&A, Payroll, Procurement, Accounting, Events for the tested synthetic session; this does not establish the complete seven-user matrix.
- Payroll admin APIs allowed CEO/CFO synthetic users and denied the other tested roles. Restricted direct `/payroll` was denied; separate `/payroll/mypay` UI displayed an unlinked state. Self-service ownership could not be verified because test users have no Employee rows. Fresh after-fix full module-picker matrix remains outstanding.
- Confirmed failures: FP&A API budget-cycles GET returns 200 for all authenticated internal test personas because `src/routes/fpaRoutes.ts` only applies internal-staff gating; restricted users' generic role definitions include extra module capabilities; accounting requisition creation route/controller is not present in inspected backend route/controller source. Procurement create POST with empty payload only produced 400 validation, so successful creation was not claimed.
- Focused ESLint passed on changed frontend files. Broad TypeScript check failed with extensive existing generated `.next-lp-uat/types` and legacy errors; see UAT report. Local fixes were not pushed/deployed. Existing News worktrees were preserved.

**LAST VERIFIED ACTION:** UAT report written; local UI :3001 and API `/health` :3009 returned successfully; focused frontend ESLint emitted no findings.

**CURRENT BLOCKER:** UAT acceptance is not met. The actual named accounts are unavailable locally, no self-service Employee rows exist, user-specific restricted policy is not represented by distinct identity grants, FP&A backend access is too broad, and accounting requisition creation is absent.

**NEXT ACTION:** Obtain/create authorized disposable local fixtures for the seven real test identities and employee ownership; confirm user-specific policy and the intended accounting requisition workflow. Then enforce server-side permission checks and retest all seven in browser and API. Do not deploy until acceptance matrix passes and deployment is separately requested.

### UAT follow-up fixes — 2026-10-15

- Based on the confirmed FP&A over-permission, removed the `INV_ANALYST` frontend FP&A grant, added a route-wide backend `requireFpaModuleAccess` gate, and added middleware that sends denied module/submodule deep links to a clear `/access-denied` page instead of redirecting to Home.
- Authenticated API retest after the backend watcher applied the change: synthetic CFO FP&A budget-cycles GET 200; synthetic INV_ANALYST GET 403. This is local API evidence. Browser MCP remained unavailable; standalone Playwright navigation/login hit resource-related timeouts/aborts, so the new denial page is not yet browser-verified.
- Added `src/tests/middleware/requireFpaModuleAccess.test.ts`; Jest did not complete because Node exhausted heap. Backend `tsc --noEmit` likewise exhausted heap while local dev runtime used substantial memory. Frontend focused ESLint passes; no backend test/build pass should be inferred.
- Current report was updated at `UAT_ACCESS_VERIFICATION.md`. Remaining substantive failures: shared INV_ANALYST/PORTFOLIO_MGR roles still provide broader permissions than the four-person matrix; actual named accounts and payroll Employee relations are absent; Accounting requisition create workflow/API is absent; complete restricted-user browser/API operation matrix remains unfinished. No push/deployment occurred.

**LAST VERIFIED ACTION:** Local authenticated API returns 200 to CFO and 403 to INV_ANALYST on FP&A; UI and API basic health endpoints respond 200.

**CURRENT BLOCKER:** Role-level scope and identity mapping need owner confirmation/fixtures; Accounting requisition workflow has no established implementation contract. Local resource pressure blocked full automated and browser retesting.

**NEXT ACTION:** Resume by verifying `/access-denied` in browser after reducing local resource load, running the focused backend test/typecheck, then implement remaining per-user scope only after mapping authorized real identities and defining Accounting requisition actions. Keep production read-only and do not deploy.

## 17. Current Exact Resume Point — News Deployment — 2026-10-15

This latest deployment update supersedes earlier “do not deploy” statements for this user-authorized News task only. It does not change the separate outstanding ERP access UAT findings.

- UI branch `staging-accounting-payroll-sweep` is pushed at `0d9c113`. Backend branch `staging` is pushed at `9288f41` (includes persistence migration commit `3408978`). Only intended News UI/API files were staged; unrelated untracked files remain untouched.
- Singapore dev (`/opt/arcus-dev`) runs UI `0d9c113` and API `9288f41`. API/staff UI are healthy. News API page 1 returns 10 of 16 records, `hasMore=true`, from three publishers; covers are verified. A scheduled 11:40 +0200 cron tick succeeded, inserting one newly eligible story; no source failures. Root cron runs every ten minutes under `flock`; its log is `/opt/arcus-dev/logs/news-ingest.log`.
- Production (`/var/www/projects/nvccz`) runs UI `0d9c113` and API `9288f41`. API, staff UI, MySQL remain healthy. The News-only DDL created `news_articles`; production reported no Prisma migration history, so no blanket migration/history baseline was applied. `RUN_SEED` was changed from `1` to `0` before API recreation, preventing admin reseeding. No seed ran.
- Production News API returns page 1 of 19 records, `hasMore=true`, from Yahoo Finance, Bloomberg, Sky News, and SABC News; all ten page-one records have verified cover URLs. Public staff `/login` and the News endpoint were checked in a real browser. No authenticated application login was attempted because no user account was supplied, so the signed-in visual News grid remains unverified.
- Production user cron is `*/10`, protected with `/usr/bin/flock`, and logs to `/var/www/projects/nvccz/logs/news-ingest.log`. Both a manual repeat (0 new inserts, 14 existing skipped) and the scheduled 09:40 UTC tick completed with no source failures. The dev scheduled tick also completed successfully.
- Production marker is `0d9c113 9288f41`; dev marker was updated to the same pair. Production rollback copies are retained: `src/api.pre-news-20261015`, `src/ui.pre-news-20261015`, `compose/docker-compose.client-vps.yml.pre-news-20261015`, `DEPLOYED_SHAS.pre-news-20261015`, and API/staff rollback image tags. Only API and staff UI were recreated; other portals, upload, MySQL service, Traefik, domains and unrelated workloads were not restarted or changed.
- Verification: Prisma schema validation passed; focused frontend ESLint and backend `tsc --noEmit` passed locally; both remote API Docker builds passed Prisma generation and TypeScript; both staff UI Docker builds completed Next.js compilation/static generation. Local Jest exhausted the machine's 4 GB Node heap and did not complete. Dev and production public staff `/login` endpoints returned HTTP 200; public News API returned HTTP 200 and pagination/image/source metadata.

**LAST VERIFIED ACTION:** Production scheduled ingestion completed at 2026-10-15 09:40 UTC; production News API returned 19 records and the deployed staff/API/MySQL containers were healthy.

**REMAINING LIMITATION:** Only publishers with accessible, verified large cover images contribute stories; not all nine configured feeds currently produce eligible articles. The authenticated News card grid and clicking through pagination inside the signed-in staff portal still require an application test account/browser session.

**NEXT ACTION:** No deployment action remains for this News task. If the user supplies an application test account, verify the signed-in News card layout and page navigation in browser; otherwise continue the independent access UAT from its explicit fixture/authorization requirements.

## 18. Dev News UI Follow-up — 2026-10-15

- User supplied a dev application test login and asked for sign-in. Authenticated browser verification at `https://dev.matanho.com/home/news` initially showed only the internal regression-test post; the publisher articles were missing. Direct dev API checks returned paginated articles, and the dev API CORS preflight allowed the staff origin and Authorization header.
- Diagnosis confirmed in the running staff image: its compiled Next.js chunks referenced the local fallback `127.0.0.1:3009/api` and did not contain the dev API host. Compose configuration resolves `PUBLIC_API_BASE_URL` to `https://dev-api.matanho.com/api`, so the prior image had been built without the correct build environment.
- Fixed by tagging the prior image `arcus-dev-ui-staff:rollback-news-api-base-20261015`, then rebuilding with `docker compose --env-file /opt/arcus-dev/secrets/dev.env -f /opt/arcus-dev/compose/docker-compose.yml build ui-staff` and recreating only `ui-staff`. No source commit changed; production and other dev containers were untouched.
- Verified the rebuilt chunks now include `dev-api.matanho.com/api`. Signed-in browser shows publisher articles with covers/source badges and pagination (`Page 1 of 2`); clicking Next showed page 2 of 2. This is the dev-only resolution for the blank News page.

**LAST VERIFIED ACTION:** Dev staff UI rebuilt with the explicit dev API build argument; authenticated News page displayed external articles and pagination in browser.

**NEXT ACTION:** None for the dev News display issue. Production was not changed.

## 19. Local-first Day 1 readiness continuation — 2026-10-15

- User asked to do work locally and fix issues as we encounter them. This applies to the ongoing Day 1 readiness/UAT task; it does not authorize deployment. Production remains read-only; no push, commit, deploy, migration, or seed occurred during this follow-up.
- Local staff frontend `http://localhost:3001` responds HTTP 200. Local API `http://127.0.0.1:3009/health` is not listening; Docker CLI is unavailable here. The browser used a synthetic Investment Analyst session. Home initially crashed in `getAccessibleModules` when a role-permission array contained a null item. Updated frontend `lib/config/role-permissions.ts` to ignore null entries in all three module lookups and in the accessible-module filter. Browser reload then rendered Home and Portfolio → Funds without the runtime overlay. Automated test/build validation remains outstanding.
- Local Home → People first showed an empty directory without a top-right Unauthorized toast. Direct `/people` navigation reached a Reset Password screen. No password was entered or changed. Therefore this does not close the directory defect or prove the API guard.
- Existing sibling backend local edit remains: `src/routes/userRoutes.ts` changes `GET /users` from CEO/admin-only guard to `requireInternalStaffUser()`, matching the route comment. There is no focused test; ESLint 9 failed to start because no flat config exists; full typecheck was stopped after prolonged no-output execution. Preserve this unvalidated change.
- Local Portfolio → Funds showed 0 records and opened the Create fund modal. No local record was submitted because API was unavailable. The previously submitted dev-only synthetic fund operation stayed unresolved; still do not retry until read-only persistence is checked.
- Updated `UAT_ACCESS_VERIFICATION.md`, `training/matanho-ems-day1-readiness/05_Testing/{defect-register,browser-execution-evidence,module-readiness-matrix}.md`, `06_Reports/day1-delivery-status.md`, and `DEPLOYMENT_PROGRESS.md` with the local evidence and limits.

**LAST VERIFIED ACTION:** Local browser Home and Funds pages rendered after defensive null handling; no top-right toast was visible on the observed local People/Funds paths. Local API remains unavailable.

**CURRENT BLOCKER:** No local API/test identity session for reliable ordinary-staff directory testing or fund/investor persistence. The direct People route prompts for a password reset. Overall Day 1 readiness remains blocked, and automated validation of new local changes is pending.

**NEXT ACTION:** Resume locally by restoring an approved disposable API/test environment and a usable synthetic staff session without resetting credentials. Then add/run targeted tests for null role-module entries, the `GET /users` internal-staff policy, denied external users, and fund create/retrieve; inspect the uncertain dev fund record read-only before any retry. Keep prod read-only and do not deploy unless separately requested.

## 20. Local fund creation role and browser verification — 2026-10-15

- The local API was restored at `http://127.0.0.1:3009/health` (200). The local staff UI at `http://localhost:3001/portfolio/funds` also returned 200. Earlier section 19's local API outage is superseded for this check.
- Backend `POST /api/funds` permits `admin` and `portfolio_mgr`; synthetic `uat.brendon@nts.local` authenticated as `INV_ANALYST` and received 403 on the create request. Synthetic `uat.gilbert@nts.local` authenticated as `PORTFOLIO_MGR` and received a successful create and readback. No real named account or production data was used.
- The frontend Funds action now renders Create fund only for the same allowed roles. A second UI event guard denies a forced create action for other roles. The backend controller now forwards vintage year, currency code, and geography to the service; all three were confirmed in a local API readback.
- Real local browser: the signed-in Investment Analyst's account menu showed `INV_ANALYST`, and the Funds page had no Create fund button. The browser signed out, signed in as the synthetic Portfolio Manager, and the home page showed `Portfolio Manager`. The manager Funds page had Create fund. A synthetic $3.5M fund was submitted through all three wizard steps; the list rose from 12 to 13 and showed the new row. Reload preserved the row; no error toast appeared. The browser remains on the manager's Funds page. The synthetic browser record is `LOCAL-BROWSER-UAT-FUND-1792067231459` in the local database.
- Focused frontend ESLint, `npm run build` (408 static pages), backend `npx tsc --noEmit`, and `git diff --check` passed. Existing unrelated dirty/untracked files were preserved. These changes are local and uncommitted; no remote deployment occurred.

**NEXT ACTION:** Continue the broader Day 1 UAT. For the fund issue, compare the local diff and deploy only under the applicable user authorization. The separate, earlier dev fund attempt remains unresolved and should be checked read-only before any repeat.

## 21. Local LP creation and invitation — 2026-10-15

**CURRENT EMAIL RECIPIENT RESTRICTION (user update):** Do not send any further messages to the prior Tariro address. The only permitted recipient for further test mail is `nyashakarata1@gmail.com`. Routine tests must keep outbound mail blocked; use a narrowly scoped process override only when a message is actually needed. This instruction does not request a new message by itself.

- Synthetic `PORTFOLIO_MGR` browser session created one disposable LP with a $100,000 commitment in the verified synthetic fund. The first submission failed because a duplicate runtime `submitLP` override discarded the effective date. A read-only DB check confirmed that failed attempt wrote nothing. Removed the override; the next browser submission created the LP, raised the directory count 7→8, and remained visible after reload. The frontend action now forwards date, currency, and notes.
- User confirmed `tarirokwangware5@gmail.com` and specified individual investor `Tariro Kwangware`. Browser created that local client record with no fund/commitment; count 8→9. Read-only Prisma check found zero commitments and no pre-existing portal user before inviting.
- The user explicitly approved one local test invitation. An isolated backend process set the mail redirect to that same confirmed address and `LP_PORTAL_URL=http://localhost:3110`, then called the GP-admin membership service once. It created a VIEWER membership and portal user; SMTP reported an accepted recipient. Inbox delivery is not verifiable here. The email contains a temporary credential and localhost activation/sign-in links, usable only on this computer. The local LP portal `/login` returned 200 and was opened in the browser; no sign-in as the recipient occurred.
- Fixed `LpPortalInviteService` to report mail sent only when the transport accepted a recipient (the local mail guard can resolve blocked messages). Client list now includes `mustChangePassword`, and the staff LP directory shows newly invited accounts as `Invited`, not `Active`; browser reload confirmed Tariro's row displays `Invited`.
- Frontend focused ESLint, JS syntax check, `npm run build` (408 pages), backend `npx tsc --noEmit`, and `git diff --check` passed. Changes are local and uncommitted; no deployment, push, migration, or seed. Production remained untouched.

**EXACT RESUME POINT:** Continue the Day 1 local workflows. Read-only DB verification found one active VIEWER membership for Tariro, `mustChangePassword=true`, and zero investment commitments; browser showed `Invited` and no error toast. This invite is a local-only delivery test; do not describe it as publicly usable or inbox-delivered until the recipient confirms receipt and a reachable environment is configured. The staff LP `Invite user` control still opens placeholder metadata rather than the membership API, so UI-driven invitations remain unfinished. Review the local diff and obtain deployment authorization before pushing/deploying.

## 22. Recovery rehearsal and DD verification — 2026-10-15

- The local disposable recovery rehearsal completed successfully. It produced a private 1,030,329,981-byte backup at `C:\Users\lysp\AppData\Local\MatanhoTrainingRecovery\2026-10-15T13-48-14-767Z\training-backup.sql`, restored all 575 source tables into a separate MySQL instance, and matched critical counts: users 2,251, funds 13, clients 9, investment commitments 12, journal entries 2,129. The isolated instance used a Windows named pipe with TCP disabled and was shut down; the active local database was not changed.
- After the network interruption, the real browser was recovered on the existing local deal detail. Due Diligence now displays the API-backed saved assessment: 0/6 criteria met, 0/4 recorded tasks completed, score 70, reviewer Admin NTS, and the Complete DD action disabled with the market-research gate. This confirms the previous fabricated full-completion summary is no longer shown.
- Day 1 remains partial: backup/recovery evidence and representative fund, LP, and DD checks are confirmed, but full module exercise coverage, actual named-user mapping, exact restricted-user scope, and the Accounting requisition contract are still outstanding. No push or deployment occurred in this continuation.

**LAST VERIFIED ACTION:** Recovery rehearsal and browser DD retest completed successfully after the interrupted session.

**NEXT ACTION:** Continue the local Day 1 module matrix and permission checks from the existing browser/API environment; keep mail blocked except for the user-authorized Nyasha address if a test message is explicitly needed. Keep production read-only and do not deploy without separate authorization.

## 23. Role permission bypass correction — 2026-10-15

- Removed the unconditional `fundraising-kyc` and `investee-portal-v8` grants from both `hasModuleAccess` and `hasSubModuleAccess`. These legacy/comparison IDs now resolve through the role’s configured grants, preventing restricted users from receiving modules outside their assigned scope.
- `node --check scripts/_uat/day1-training-readiness.mjs` and `git diff --check` passed. Focused ESLint was started but stopped after prolonged no-output execution under current local resource pressure; no lint pass is claimed.
- No deployment or push occurred. Browser/API retest of the restricted module picker remains the next verification step.

## 24. Restricted-role browser retest — 2026-10-15

- Real local browser login and module-picker verification completed for synthetic equivalents of Brendon, Natsai, Vongai, and Gilbert. All four identities loaded Home successfully. Their module pickers showed Portfolio Management, Payroll, Procurement, Accounting, and Events; Home remained the landing page. No extra Performance, FP&A, DD/application, fundraising, or investee modules were shown.
- Direct `/forecasting` navigation as Brendon and Gilbert returned the application’s `/access-denied?module=forecasting...` page. Brendon’s direct Funds page did not show Create fund. This confirms both picker visibility and a direct-route denial for the tested restricted scope.
- Corrected `INV_ANALYST` and `PORTFOLIO_MGR` role definitions to remove extra performance/application/FP&A grants and include the required personal Payroll, Accounting requisition, and Events module entries. The change is local only and uncommitted.
- Natsai and Vongai module-picker checks are browser-confirmed. API status checks and the Tino/Sophia/Ropa payroll-administration regression checks remain to be completed; no overall readiness pass is claimed.
- Local authenticated API matrix then completed for all seven synthetic identities. Brendon/Natsai/Vongai/Gilbert each received `/payroll/employees` 403, `/procurement/requisitions/my` 200, broad `/procurement/requisitions` 403, and `/accounting/me` 200. Tino and Sophia received 200 for payroll employees and broad procurement requisitions. Ropa's FIN_ASST role received payroll employees 403 and broad procurement 403, so Ropa is not currently a payroll administrator; this is recorded as a role-policy mismatch to resolve rather than being silently widened.

# Session Closeout Handoff — 2026-10-15

## A. Original Objective

Complete the Matanho EMS Day 1 training-readiness and UAT work across the seven ERP areas, using real browser interactions and local/API evidence. Completion requires representative workflows, correct role visibility and backend authorization, navigation/regression checks, coherent training data, recovery evidence, and accurate documentation. Production is read-only for this work. Source requirements are in the Day 1 readiness attachment and `training/matanho-ems-day1-readiness/`.

## B. Current Overall Status

PARTIAL. Local fund creation, LP creation/linkage, DD display/gating, recovery rehearsal, restricted-role browser module visibility, direct FP&A denial, and the restricted API matrix were verified. The full Day 1 readiness gate is not passed. Ropa Payroll administration is unresolved, Accounting requisition creation has not been exercised end-to-end, named identities are synthetic equivalents, and several module workflows remain incomplete.

## C. Completed and Verified Work

- Local synthetic Portfolio Manager created and reloaded a disposable fund; analyst UI hid Create fund and backend creation returned 403. Evidence is recorded in sections 20 and `DEPLOYMENT_PROGRESS.md`.
- Local synthetic LP creation and fund commitment persisted after reload. The prior local invitation test was approved only for the previously confirmed address; no further mail may be sent there. Future test mail is restricted to `nyashakarata1@gmail.com`, with routine mail blocked.
- Real browser DD view shows saved API-backed state (0/6 criteria, 0/4 tasks, score 70, reviewer, disabled completion gate), not fabricated completion.
- Disposable local recovery rehearsal restored all 575 tables with matching critical counts over an isolated named pipe; see section 22 and the private recovery path recorded there.
- Real browser logged in as Brendon, Natsai, Vongai, and Gilbert synthetic identities. Each module picker showed Portfolio Management, Payroll, Procurement, Accounting, and Events, with Home as landing page. Direct FP&A access for Brendon and Gilbert returned the application access-denied page. Brendon’s Funds page hid Create fund.
- Local API checks verified restricted payroll administration denial, own procurement requisitions access, broad procurement denial, and personal accounting endpoint access. Tino and Sophia payroll employee endpoints returned 200. Ropa returned 403.

## D. Code Changes

Frontend repository: `C:\Users\lysp\Downloads\nvccz-new`; backend repository: `C:\Users\lysp\Downloads\nvccz`. Changes are uncommitted and preserve pre-existing unrelated dirty/untracked files. Relevant files include `lib/config/role-permissions.ts`, `scripts/_uat/day1-training-readiness.mjs`, portfolio runtime/action/adapter files, LP admin API/types, and the policy/tracker documents. `INV_ANALYST` and `PORTFOLIO_MGR` were narrowed to the stated restricted module scope. No commit or push was made.

## E. Browser and API Verification

Browser environment: local staff UI `http://localhost:3001`; evidence was observed in the Codex in-app browser session, current tab ended at `/access-denied?module=forecasting&from=%2Fforecasting`. API environment: `http://127.0.0.1:3009/api`.

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| Brendon/Natsai/Vongai/Gilbert login and picker | Restricted modules only | All four logged in; picker showed Portfolio, Payroll, Procurement, Accounting, Events; Home landing | PASS |
| Restricted direct FP&A | Deny | Brendon and Gilbert reached `/access-denied` | PASS |
| Restricted Funds create | Hidden/denied | Brendon had no Create fund | PASS |
| Restricted API payroll admin | Deny | 403 for all four | PASS |
| Restricted own requisitions | Allow own only | `/procurement/requisitions/my` 200; broad list 403 | PASS |
| Tino/Sophia payroll admin | Allow | `/payroll/employees` 200 | PASS |
| Ropa payroll admin | Allow per client requirement | `/payroll/employees` 403 | FAIL |
| DD saved state/gate | Real state and disabled incomplete gate | 0/6, 0/4, score 70, Complete DD disabled | PASS |
| Playwright batch runner | Complete automated matrix | Login response timed out under local resource pressure; CUA browser fallback supplied the verified restricted-role evidence | BLOCKED |

The API command used for the seven-role matrix logged only usernames and status codes; credentials/tokens were not written to files or reports. No browser artifact path is claimed for CUA screenshots because they were inspected in-session rather than saved as files.

## F. Unresolved Defects

- Ropa account `uat.ropa@nts.local` is assigned `FIN_ASST`; `/payroll/employees` returned 403. The failure is backend role/permission configuration, not a frontend-only visibility issue. Investigate the named-user-to-role mapping and existing payroll grant model, then apply a narrowly scoped named-user or intended-role grant only after confirming the business mapping. Do not grant every `FIN_ASST` user automatically.
- Accounting requisition creation has not been submitted and persisted end-to-end; `accounting/me` 200 is not proof of that workflow.
- Procurement own-requisition create was not submitted end-to-end in this closeout; 200 on the read endpoint is not proof of creation.
- Personal Payroll UI and Events workflow actions remain insufficiently exercised.
- Home navigation from every authorized module, FP&A authorized-user rendering, named real accounts, and complete seven-module training exercises remain incomplete.
- Automated Playwright runner still fails before login response capture under local resource pressure; do not treat its failed run as browser readiness evidence.

## G. Environment State

Local staff UI and API were running and browser-tested on 2026-10-15. Local MySQL `arcus_dev` was used for disposable data and was not reset. Singapore development and production News deployment/cron evidence remains documented in `PROJECT_CONTEXT.md`, `DEPLOYMENT_PROGRESS.md`, and earlier handoff sections. No deployment was performed in this session closeout.

## H. Remaining Task Checklist

1. Resolve Ropa’s intended payroll authorization narrowly and retest API plus browser.
2. Exercise and persist one procurement own-requisition creation.
3. Exercise and persist the required Accounting requisition workflow, or document the missing implementation contract.
4. Test personal Payroll access versus payroll administration for all four restricted identities.
5. Test Events access and Home return navigation from authorized modules.
6. Test FP&A authorized user rendering and direct-route behavior.
7. Complete remaining Day 1 module workflows, evidence, facilitator guide, and training register updates.
8. Re-run focused frontend/backend validation after local resource cleanup.

## I. Immediate Resume Instructions

Start the next session by reading `PROJECT_CONTEXT.md`, `DEPLOYMENT_PROGRESS.md`, and this handoff. Then query the local database read-only for `uat.ropa@nts.local` role relations and compare them with `PAYROLL_ROLE_GRANTS` in `C:\Users\lysp\Downloads\nvccz\src\config\payrollPermissions.ts` and payroll route guards. Do not change grants until the mapping is understood. Retest Ropa’s `/payroll/employees` endpoint and browser Payroll route, then proceed to the requisition create workflows.

## J. Commands and Paths

- Frontend: `C:\Users\lysp\Downloads\nvccz-new`
- Backend: `C:\Users\lysp\Downloads\nvccz`
- Browser runner syntax check: `node --check scripts/_uat/day1-training-readiness.mjs`
- Local API health: `http://127.0.0.1:3009/health`
- Local staff login: `http://localhost:3001/login`
- Training evidence: `test-artifacts/`, `training/matanho-ems-day1-readiness/`, `UAT_ACCESS_VERIFICATION.md`
- Private recovery evidence: `C:\Users\lysp\AppData\Local\MatanhoTrainingRecovery\2026-10-15T13-48-14-767Z`

## K. Safety Constraints

Keep production read-only. Do not deploy, push, commit, seed, migrate, reset, or destructively alter databases without separate authorization. Preserve unrelated dirty/untracked files. Keep outbound mail blocked for routine tests; only `nyashakarata1@gmail.com` is permitted for any explicitly needed test message. Never expose credentials, tokens, secrets, or private production data.

## L. Last Verified Execution Point

The final verified execution was a real browser login as synthetic Gilbert, module-picker confirmation showing only Portfolio, Payroll, Procurement, Accounting, and Events, followed by direct navigation to `/forecasting`, which rendered the access-denied page. The local API matrix for all seven synthetic identities was then recorded, showing Ropa’s payroll 403 mismatch. No implementation or deployment occurred after those checks.

LAST VERIFIED ACTION:
Gilbert browser role/module verification and direct FP&A denial, followed by the seven-identity local API status matrix.

CURRENT VERIFIED STATE:
Restricted module visibility and direct FP&A denial work locally; fund-create hiding and DD state/gating work; Tino and Sophia payroll administration API access works; Ropa does not yet have the required payroll administration access.

UNRESOLVED ISSUES:
Ropa payroll authorization, requisition create/persistence workflows, personal Payroll/Events actions, Home/FP&A navigation coverage, remaining Day 1 training exercises, and automated Playwright resource failure.

IMMEDIATE NEXT ACTION:
Read-only inspect Ropa’s role relations and compare them with the backend payroll grant model, then implement the narrowest correct authorization and retest Ropa in API and browser.

NEXT ACTION SUCCESS CRITERIA:
Ropa’s intended account has the correct narrowly scoped payroll administration grant, `/payroll/employees` returns 200 only for the intended authorized identity, the browser Payroll administration controls are visible to Ropa, restricted identities remain denied, and no unrelated role gains access.

REMAINING WORK AFTER THAT:
Complete procurement/accounting requisition create workflows, personal Payroll and Events tests, authorized FP&A/Home navigation, remaining module training evidence, focused validation, and final Day 1 readiness decision.
