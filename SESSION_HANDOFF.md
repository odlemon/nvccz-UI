# Arcus / NVCCZ — Evidence-Based Session Handoff

Generated 2026-10-15. This document records verified evidence only. See `docs/ai-context/PROJECT_CONTEXT.md` for the full architecture reference.

## 1. Project and Task Overview

Arcus/NVCCZ is a Next.js multi-portal investment ERP with Staff, LP, Investee, Apply, Vendor, and Events frontends; a shared TypeScript/Node API; Prisma/MySQL; an upload service; Docker Compose; and Traefik. The session objective was to publish the current local fixes and deploy an isolated development stack to `109.199.123.21`, while keeping production read-only.

## 2. Current Overall Status

| Area | Implementation | Deployment | Verification |
|---|---|---|---|
| Frontend fixes | IMPLEMENTED | NOT DEPLOYED to a confirmed running stack | LOCALLY VERIFIED |
| Backend RBAC/news | IMPLEMENTED | NOT DEPLOYED to a confirmed running stack | LOCALLY VERIFIED |
| Production inspection | N/A | N/A | READ-ONLY VERIFIED |
| Dev Git checkout | IMPLEMENTED | IN PROGRESS | Commit checkout evidenced |
| Dev Compose | IMPLEMENTED | BLOCKED | Build killed by VPS memory pressure |
| News aggregator | IMPLEMENTED | UNVERIFIED on dev | Local API verified |

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

## 4. Changes Made to the Codebase

Frontend branch `staging-accounting-payroll-sweep`: commits `a436472` and `f7d3154`, pushed to `odlemon/nvccz-UI`. Changes cover RBAC navigation, news API consumption, Tailwind/build repairs, icon correction, package manifests, and sequential dev build configuration. Backend branch `staging`: commit `a5321dc`, pushed to `odlemon/nvccz`; changes cover RBAC guards, news aggregation, test infrastructure, and synthetic local personas.

Untracked files remain in both worktrees, including archive files and previous handoff/deployment artifacts. They were not included in the deployment commits and must not be deleted or committed without review. No schema or migration was created. No production migration, seed, or database write was performed.

## 5. Local Environment Status

Last recorded local evidence: Staff frontend at `http://localhost:3001`; backend API on port 3009; verification API process on 3011; local MySQL on 3306. Staff browser smoke tests and partial module tests passed. LP, Investee, Apply, Vendor, and Events simultaneous runtime health was NOT TESTED. Upload runtime status was NOT VERIFIED.

## 6. Production Environment Findings

Production `102.217.49.126` was inspected read-only over SSH port 3131. Recorded evidence showed `/var/www/projects/nvccz`, healthy `nvccz-prod-*` UI/API/upload/MySQL containers, API health 200, and expected HTTPS responses for checked domains. Production roles were inspected without exporting secrets or permission payloads. No production service, domain, certificate, database, or deployment was changed.

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

Production is read-only. Do not expose secrets, overwrite uncommitted files, share production and development databases, stop unrelated VPS workloads, create a second Traefik instance, or treat Git publication/configuration as proof of deployment. Verify exact commits and health output.

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
