# Deployment Progress

Last reviewed: 2026-10-15

## UAT continuation — local only

- Added dedicated `PAYROLL_ADMIN` / `Payroll Administrator` role and mapped only the synthetic Ropa persona to it; Finance Assistant remains unchanged.
- API verified: Ropa payroll employee roster 200; restricted Brendon payroll roster 403.
- Procurement own-requisition workflow verified end-to-end: Brendon created and reloaded a disposable Finance requisition in `DRAFT` state.
- Accounting requisition creation remains unresolved: no corresponding accounting requisition route/controller was found.
- Repository trace completed: Accounting's existing `PurchaseRequisition` integration is the intended Finance requisition workflow; `lib/accounting-v52` links purchase orders back to Procurement requisitions and `ProcurementRequisitionAssistService` consumes Accounting project/cost-centre data. No duplicate Accounting requisition subsystem was created.
- All four restricted personas created and retrieved owned Finance requisitions through the shared Procurement API; records persisted as `DRAFT`. Personal Payroll Portal returned 200 after local Employee fixtures were added for each persona.
- The executable Playwright UAT runner was started against the local stack but did not produce results under current local resource pressure; it was stopped without claiming browser verification.
- Browser fallback blocker diagnosed: generic `input[type=email]` interaction could be cleared by the login form rerender; placeholder-based locators authenticate reliably. Browser verified Brendon reaches `/home`, `/portfolio/funds`, `/payroll/employee/portal`, `/procurement/requisitions`, `/accounting`, and `/events`; Sophia reaches `/forecasting`; Brendon is redirected to `/access-denied` for `/forecasting`.
- Browser login attempts for the full seven-user loop remain resource-sensitive when repeatedly opening fresh contexts; no full seven-user browser PASS is claimed from the partial run.

| Task | Environment | Status | Evidence | Next action |
|---|---|---|---|---|
| Publish UI | GitHub | IMPLEMENTED | `0d9c113` pushed on `staging-accounting-payroll-sweep` | None |
| Publish API | GitHub | IMPLEMENTED | `9288f41` pushed on `staging`; News persistence commit `3408978` included | None |
| Checkout Git revisions | Singapore Dev VPS | VERIFIED | UI `0d9c113`; API `9288f41` | None |
| Add swap | Dev VPS | IMPLEMENTED | 8 GiB `/swapfile` active | Recheck |
| Reclaim build cache | Dev VPS | IMPLEMENTED | 57.76 GB reclaimed | Recheck disk |
| Build API/UI images | Singapore Dev VPS | VERIFIED | News API and staff UI images built; staff UI rebuilt with `https://dev-api.matanho.com/api`; Prisma generation, TypeScript, Next build passed | None |
| Start Compose stack | Singapore Dev VPS | VERIFIED | Only API and staff UI recreated during News deployment; later only staff UI recreated with explicit dev API build arg | None |
| API/upload health | Singapore Dev VPS | VERIFIED | API `/health` 200; API and staff UI containers healthy; staff `/login` HTTP 200; authenticated News UI verified | None |
| Dev demo/UAT data | Dev VPS | VERIFIED | Prisma schema bootstrapped; admin, LP/investee, FP&A (20,160 planning cells), portfolio, investments, stock-cash, fundraising, payroll baseline/history, procurement and performance personas seeded into `arcus_dev` | Browser/UAT checks |
| Domains/SSL/SSE | Singapore Dev | PARTIAL | `https://dev.matanho.com/home/news` and `https://dev-api.matanho.com/api/news-feed` verified in signed-in browser; SSE not tested | Verify SSE separately if in scope |
| News persistence/pagination | Singapore Dev VPS | VERIFIED | 16 rows across three publishers; 10-item API page, `hasMore=true`, all ten page-one items have verified cover URLs | Grow source coverage |
| News ingestion | Singapore Dev VPS | VERIFIED | Ingest repeat was idempotent; scheduled 11:40 +0200 run stored one new article; no source failures | None |
| News cron | Singapore Dev VPS | VERIFIED | Root crontab every 10 minutes with `flock`; manual and scheduled runs logged at `/opt/arcus-dev/logs/news-ingest.log` | None |
| Production source preparation | Production `102.217.49.126` | VERIFIED | Backups retained; source revisions API `9288f41`, UI `0d9c113`; production Compose `RUN_SEED=0` | None |
| Production News migration | Production | VERIFIED | Only `news_articles` table DDL applied; existing DB has no Prisma migration history; no seed or blanket migration | None |
| Production News feed | Production | VERIFIED | 19 rows across Yahoo Finance, Bloomberg, Sky News, and SABC; page one 10 items, `hasMore=true`, ten verified covers | Grow source coverage |
| Production cron | Production | VERIFIED | User crontab every 10 minutes with `flock`; manual repeat and scheduled 09:40 UTC run succeeded without source failures | None |
| Production public checks | Production | VERIFIED | Staff `/login`, API health, and public News API returned HTTP 200; API/staff/MySQL healthy | Authenticated News card UI needs user test account |
| RBAC | Local | BROWSER VERIFIED | API matrix and BROWSER-009/010 | Verify dev |
| Fund creation and role visibility | Local only | BROWSER VERIFIED | Signed-in synthetic `INV_ANALYST` had no Create fund action and POST returned 403; signed-in synthetic `PORTFOLIO_MGR` completed the wizard, fund count rose 12→13, and the new $3.5M fund remained visible after reload. API readback confirmed vintage, currency, and geography. Frontend build, focused lint, and backend typecheck passed. | Review local diff before any separately requested deployment |
| LP creation and test invitation | Local only | BROWSER + SMTP ACCEPTED | Fixed LP wizard effective-date drop; synthetic commitment LP created in browser; Tariro Kwangware individual LP created with no fund commitment; one approved VIEWER invitation accepted by SMTP to the confirmed address. Directory now shows `Invited`, and local LP portal `/login` is available. Inbox receipt and investor sign-in remain unverified. | Recipient to confirm email; staff-side Invite user control still needs API wiring; public portal link requires reachable environment |
| Full UAT | Local | FAIL / PARTIAL | `UAT_ACCESS_VERIFICATION.md`; synthetic-role Playwright/API evidence under `test-artifacts/uat-access/`; FP&A API fix verifies CFO 200 vs restricted analyst 403; Home null-permission crash fixed locally; local API restored and fund creation/browser role checks passed. Accounting requisition route remains absent and named real users remain unverified. | Validate remaining directory and role matrix checks; resolve the separate dev fund attempt read-only; define accounting requisition workflow |
| Day 1 recovery rehearsal | Local disposable copy | VERIFIED | Private recovery workspace `MatanhoTrainingRecovery\\2026-10-15T13-48-14-767Z`; 1,030,329,981-byte backup restored all 575 tables; critical counts matched (users 2,251, funds 13, clients 9, commitments 12, journal entries 2,129); isolated named-pipe transport with TCP disabled | Retain private recovery workspace; no production action |
| Day 1 DD browser evidence | Local | VERIFIED / PARTIAL | Real browser shows API-backed assessment 0/6 criteria, 0/4 tasks, saved score 70, reviewer Admin NTS, and disabled Complete DD gate; no fabricated 100% summary remains | Complete remaining module exercises and named-user permission mapping |
| Restricted-role module picker | Local | BROWSER VERIFIED / PARTIAL | Brendon, Natsai, Vongai, and Gilbert logged in through the real browser; each saw Portfolio, Payroll, Procurement, Accounting, Events and Home landing; Brendon/Gilbert direct FP&A routes returned Access denied; Brendon Funds hid Create fund | Resolve Ropa payroll mapping; exercise remaining create workflows |
| Restricted-role API matrix | Local | VERIFIED / MISMATCH | Four restricted identities: payroll employees 403, own requisitions 200, broad requisitions 403, accounting/me 200. Tino and Sophia payroll employees 200. Ropa FIN_ASST payroll employees 403, contrary to the named-user requirement | Read-only inspect Ropa role relations and payroll grants; implement narrow fix only after mapping |

Constraints: production changes were limited to the explicitly authorized deployment and single News table migration. No seeds or unrelated migrations ran. Secrets and unrelated VPS workloads were untouched. Existing user changes and rollback backups are preserved. Dev staff UI rollback image retained as `arcus-dev-ui-staff:rollback-news-api-base-20261015`.
