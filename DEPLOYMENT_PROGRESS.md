# Deployment Progress

Last reviewed: 2026-10-15

| Task | Environment | Status | Evidence | Next action |
|---|---|---|---|---|
| Publish UI | GitHub | IMPLEMENTED | `f7d3154` pushed | None |
| Publish API | GitHub | IMPLEMENTED | `a5321dc` pushed | None |
| Checkout Git revisions | Dev VPS | IMPLEMENTED | Remote checkout output | Recheck after recovery |
| Add swap | Dev VPS | IMPLEMENTED | 8 GiB `/swapfile` active | Recheck |
| Reclaim build cache | Dev VPS | IMPLEMENTED | 57.76 GB reclaimed | Recheck disk |
| Build API/UI images | Dev VPS | IMPLEMENTED | API and all six UI images built successfully; API required 4 GiB Node heap | None |
| Start Compose stack | Dev VPS | IMPLEMENTED | All required containers started; MySQL, upload, API, and six UI healthchecks are healthy | Browser/domain verification |
| API/upload health | Dev VPS | VERIFIED | API internal `/health` 200; upload healthcheck healthy; staff/UI smoke 200 | Browser/domain verification |
| Dev demo/UAT data | Dev VPS | VERIFIED | Prisma schema bootstrapped; admin, LP/investee, FP&A (20,160 planning cells), portfolio, investments, stock-cash, fundraising, payroll baseline/history, procurement and performance personas seeded into `arcus_dev` | Browser/UAT checks |
| Domains/SSL/SSE | Dev | NOT STARTED | No current verification | Depends on stack/DNS |
| News source matrix | Local | LOCALLY VERIFIED | 60 articles; nine `ok` | Verify dev UI |
| RBAC | Local | BROWSER VERIFIED | API matrix and BROWSER-009/010 | Verify dev |
| Full UAT | Local | FAIL / PARTIAL | `UAT_ACCESS_VERIFICATION.md`; synthetic-role Playwright/API evidence under `test-artifacts/uat-access/`; FP&A API fix now verifies CFO 200 vs restricted analyst 403; access-denied route changed but browser retest outstanding; accounting requisition route absent; named users absent | Finish restricted-role menu/UI matrix, define user-specific access, accounting requisition scope, ownership fixtures |

Constraints: production is read-only; do not expose secrets; do not run production migrations/seeds; do not stop unrelated dev-host workloads.
