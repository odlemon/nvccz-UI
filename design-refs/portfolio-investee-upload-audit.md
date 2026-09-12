# Portfolio + Investee upload / lifecycle live audit (local)

**Date:** 5 September 2026  
**API:** `http://127.0.0.1:3009` (NTS `arcus_dev` via SSH tunnel `:3307`)  
**Upload service:** `http://127.0.0.1:3050` (`nvccz/scripts/local-upload-mock-server.ts`)  
**Staff FE:** `:3001` · **Investee FE:** `:3120`  
**Auth:** Arcus Dev staff + investee from `nvccz-portal-credentials.xlsx` (portal=`investee` for applicant login)  
**Not committed. Not deployed.**

## Before the network cut (prior session)
- Tunnel/API/staff/investee servers brought up
- Seed deals were `ACTIVE_DD` **without** DD rows → initiate blocked
- Upload `:3050` was down → term-sheet create failed
- Lifecycle create script was interrupted mid-run

## After resume — staff lifecycle (non-fixture)
| Step | Deal / evidence | Result |
|------|-----------------|--------|
| Create application + docs | `cmto08vnf000hunmkl41hmtqv` | PASS |
| `change-stage` → SCREENING | same | PASS |
| `POST .../due-diligence/initiate` | same | PASS |
| `PUT .../due-diligence` assessment | same | PASS |
| `POST .../due-diligence/complete` → `TERM_SHEET` | same | PASS |
| `POST /term-sheets/:applicationId` (PDF via :3050) | same | PASS |
| Board review | needs `UNDER_BOARD_REVIEW` first | PASS after FE/API stage move |
| Demo deal board IM | `cmsyqfuno000aovi8e7zl0g19` | PASS `POST /board-reviews/:id` 201 |

**FE fix:** `lib/portfolio-v11/actions.ts` — before board-review create, `changeStage(... UNDER_BOARD_REVIEW)` (BE rejects create from `TERM_SHEET`).

## Investee writes (real auth `investee.test@arcus.co.zw`)
| Step | Endpoint | Result | Notes |
|------|----------|--------|-------|
| Login | `POST /auth/login` + `portal:investee` | PASS | Staff portal login returns 403 for applicants |
| Relink PC | DB `portfolio_companies.userId` → investee user | DONE | Was linked to `company.arcusdemo@…` |
| Sign | `POST /term-sheets/:applicationId/sign` | PASS | Must finalize first; route uses **applicationId** not term-sheet row id |
| KPIs | `POST /applicant/financial-reports/period-kpis` | PASS | Required open `REQUEST` in `reporting_notification_logs` |
| Financial report upload | `POST /applicant/financial-reports` | PASS | Needed `financial_reports` table + `.xlsx` for income statement |
| Letterhead logo | `POST /portfolio-companies/:id/letterhead/logo` | PASS | |
| Document vault UI | — | FAIL / blocked | Still fixture; see asks below |

**FE fixes:**
- `application-portal-api.signTermSheet` + investee actions/runtime pass **applicationId**
- Live signature list includes `applicationId` on `complete-signature` dataset

## Upload surface checklist

| Upload surface | Live API path | Pass/Fail | Fix applied | Evidence |
|----------------|---------------|-----------|-------------|----------|
| Local upload microservice | `POST :3050/upload` | PASS | Started `local-upload-mock-server.ts` | health 200; term sheet storage log |
| Staff application / deal docs | `POST /applications/upload-documents` | PASS | — | HTTP 201 |
| Staff create application (4 docs) | upload-documents + `POST /applications` | PASS | — | deal `cmto08vnf…` |
| Staff term sheet PDF | `POST /term-sheets/:applicationId` | PASS | Needs :3050 | HTTP 201 |
| Staff board IM / memorandum | `POST /board-reviews/:applicationId` | PASS | FE auto stage → `UNDER_BOARD_REVIEW` | HTTP 201 |
| Staff Documents Vault file input | `POST /investment-ops/files/upload-sessions` → `/files` → `/documents` | PASS (API) | FE vault now uses `uploadBinaryFile` + `fileId` (was fixture/`fileRef`) | session/file/doc 201 |
| Staff bank statement UI | fixture / `api-upload-statement` metadata | FAIL / partial | No file→API bridge on bank statement inputs | runtime local toast |
| Staff e-sign studio UI | fixture | FAIL | Local signature envelopes only | runtime |
| Staff capital call create | `POST /funds/:id/capital-calls` | PASS (FE shape) | FE already sends `paymentDueDate`/`transactionDate`/`bankInstructions` | probe with FE fields |
| Investee term sheet signature image | `POST /term-sheets/:applicationId/sign` | PASS | applicationId wire + finalize | HTTP 200 |
| Investee financial report file | `POST /applicant/financial-reports` | PASS | Created missing `financial_reports` (+ draft/reportingPeriod cols) on local DB | HTTP 201 |
| Investee report evidence file | `POST /applicant/financial-reports/:id/file` | not re-hit after create | — | create path succeeded with file |
| Investee letterhead logo | `POST /portfolio-companies/:id/letterhead/logo` | PASS | PC relink | HTTP 200 |
| Investee Document Vault | no `/applicant/documents` | FAIL | Ask already filed | fixture `simulate-upload` / `complete-upload` |

## Local DB repairs applied (arcus_dev via tunnel — not prod deploy)
1. `CREATE TABLE reporting_notification_logs` + seed `REQUEST` rows for demo PC  
2. Applied `scripts/sql/add_financial_reports_table.sql` + draft alter + `reportingPeriod` column  
3. Relinked Arcus Demo `portfolio_companies.userId` to `investee.test` user

## Remaining blockers → ask docs
- Investee general vault: [`design-refs/investee-portal-v8-backend-asks.md`](./investee-portal-v8-backend-asks.md) §1 (unchanged product ask)
- Ensure NTS/dev DB migrations include `financial_reports` + `reporting_notification_logs` (local-only repair above)
- Staff bank-statement / e-sign UIs remain fixture unless product prioritizes wiring

## Files changed (FE)
- `lib/portfolio-v11/actions.ts` — board-review stage gate; vault upload session path
- `components/portfolio-v11-mock/matanho-portfolio-runtime.js` — vault upload emits live API
- `lib/api/application-portal-api.ts` — sign uses applicationId
- `lib/investee-portal-v8/actions.ts` — prefer applicationId for sign
- `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js` — applicationId on signature UI
- `design-refs/portfolio-investee-upload-audit.md` — this file
