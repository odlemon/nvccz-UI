# Funding Request / Deal Detail bug fixes (Portfolio V11)

Report for bugs **1.1–1.9**, plus Overview alignment and Board & IC vote-button cleanup.

## Summary

| Bug # | Issue | Root Cause Found | Fix Applied | Evidence It's Fixed |
|---|---|---|---|---|
| 1.1 | Use-of-funds breakdown not showing | Funding form collected `useOfFunds` client-side only; `Application` had no persistence field; FE always showed `liveEmptyCard` | Added `applications.application_form_data` (JSON); create path accepts `applicationFormData`; funding form submits UoF; Application tab renders breakdown from `app.applicationFormData.useOfFunds` | `GET /api/applications/cmt9uba2w0000unz4pqn9otg8` returns `applicationFormData.useOfFunds` with Product 40 / Sales 35 / Ops 25. FE maps that array into legend + progress + rows. |
| 1.2 | Declarations not showing | Same as 1.1 — declarations never left the browser | Stored under `applicationFormData.declarations`; FE Declarations card + Declarations section render Accepted/Not accepted | Same GET shows `declarations: { accurate: true, consent: true }`. |
| 1.3 | Raw ISO date strings | No shared display formatter in portfolio runtime | Added `formatDate()`; applied to Founded, Submitted, Last amended, screening timestamps, DD due dates (overview + diligence tab) | Unit check: `2026-08-05T12:00:00.000Z` → `5 Aug 2026`; `2026-09-09T12:46:38.175Z` → `9 Sept 2026`. |
| 1.4 | Application section tabs not working | Left nav used `data-action="application-section"` with no handler; body always rendered Company + Funding only | `state.applicationSection` + handler; each section renders its own body (Company, Ownership, Business, Financial, Funding, Impact & ESG, Declarations) from API / form data | Code: `case 'application-section'` sets `state.applicationSection` and `render()`; section buttons pass `data-section`. |
| 1.5 | Download application stub | Toast-only sample | Builds PDF via `createSimplePdf` from live deal/application/form fields and downloads | `case 'download-application'` calls `downloadBlob(..., createSimplePdf(...))` with applicant, amount, UoF, declarations, impact. |
| 1.6 | Request clarification | Modal submit was toast-only; no API/email | `POST /api/applications/:id/request-clarification` → `EmailNotificationService.sendClarificationRequest`; FE `api-request-clarification` action + named form fields | **Live send 200:** `Clarification request sent` to `nyashakarata1@gmail.com` for NTS (`cmt9uba2w0000unz4pqn9otg8`), `sentAt: 2026-08-26T18:52:02.476Z`. Earlier attempt failed on SMTP (`Connection closed unexpectedly`) then succeeded after TLS/retry + tunnel restore. |
| 1.7 | AI Screening Decision actions | Stage mapping wrong: shortlist → `Initial Review`→`SCREENING` (often no-op); human review → `Screening`→`SCREENING` | Shortlist sends `beStage: ACTIVE_DD`; human review `BELOW_THRESHOLD`; reject `REJECTED_SCREENING`; `UI_STAGE_TO_BE` updated | Code + `ApplicationService.validTransitions` (`SCREENING`→`ACTIVE_DD`/`BELOW_THRESHOLD`/`REJECTED_SCREENING`). No SCREENING-stage deal in current DB (both ACTIVE_DD) to live-mutate without harming demo data. |
| 1.8 | Assign DD Task modal “tabs” | Modal is a **single form** (no tabs). Assign already live-wired | Confirmed single-form UX; `submit-dd-task` → `api-assign-dd-task`. No tab switcher to fix. | `showDDTaskModal` / `submitDDTask` emit `api-assign-dd-task` when `state.liveData`. |
| 1.9 | DD workstreams look hardcoded | Live path already used `dd.tasks` from API; generic names come from BE seed pack (`ActiveDdPmsTaskPackService`), not FE fixtures. Dates were ISO | Format due dates; keep live task mapping | `GET .../due-diligence` for NTS (`cmt9uba2w0000unz4pqn9otg8`) → **4 API tasks** (Market & commercial, Management & operations, Legal & regulatory, …). Second ACTIVE_DD deal had **no DD review yet (404)** — empty list when no DD record (not a static mock). |

## UX extras (from screenshot)

| Item | Action |
|---|---|
| Application Snapshot email/phone overlap | `min-width:0`, `word-break` / `overflow-wrap` on snapshot grid cells |
| DD workstreams table alignment | Fixed column widths + `table-layout:fixed` + horizontal overflow wrap |
| Board & IC Approve / Conditions / Defer / Reject on Overview | **Removed** — decorative and not the real IC vote path. Status/reviewer/recommendation kept; link to **Investment Committee** tab for real votes (`final-vote` / `api-cast-ic-vote`) |

## Backend contract

- Column: `applications.application_form_data` JSON NULL  
- Create: optional `applicationFormData` on `POST /api/applications`  
- Clarification: `POST /api/applications/:id/request-clarification` body `{ subject, message, recipientEmail? }`  

## FE files touched

- `components/portfolio-v11-mock/matanho-portfolio-runtime.js`
- `components/funding-application/funding-application-app.tsx`
- `lib/api/applications-api.ts`
- `lib/portfolio-v11/actions.ts`
- `lib/portfolio-v11/live-loaders.ts`

## BE files touched

- `prisma/schema.prisma` (`applicationFormData`)
- `src/services/ApplicationService.ts`
- `src/controllers/ApplicationController.ts`
- `src/routes/applicationRoutes.ts`
- `src/services/EmailNotificationService.ts`
- `src/config/email.config.ts` (TLS/timeouts + retry)

## Blockers / residual

1. **Historical applications** without `applicationFormData` still show empty UoF/declarations until resubmit or backfill (NTS was backfilled for verification).  
2. **Screening live stage mutation** not re-run on a SCREENING deal (none present in current DB — both ACTIVE_DD); mapping verified against `validTransitions` + code.  
3. **SMTP** can flake (`Connection closed unexpectedly`); clarification endpoint returns error when mail fails (no silent success). Successful send verified after restore.
