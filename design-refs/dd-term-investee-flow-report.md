# DD Completion → Term Sheet → Investee Portal — Implementation Report

Date: 2026-08-28

## Summary

End-to-end flow wiring for Portfolio V11 due diligence completion, term sheet handoff, portfolio company / investee access, and Investee Portal V8 live data (terms page + loader). Backend guards verified via API on port 3009.

---

## Report Table

| Area | Item | Root Cause / Finding | Fix Applied | Evidence It Works |
|---|---|---|---|---|
| Due Diligence | Complete button disabled state | Button always clickable; FE only checked score/rec/comments, not 4 required booleans or task completion | Added `canCompleteDueDiligence()` matching BE rules; button renders `disabled` + tooltip when gate fails | Logic in `matanho-portfolio-runtime.js`; disabled when assessment incomplete |
| Due Diligence | Loading state on click | `setActionBusy` targeted `api-complete-due-diligence` but button is `complete-due-diligence` | Map `uiAction` in `portfolio-v11-app.tsx`; emit `uiAction` from handler | Button gets `is-loading` class + label change during API call |
| Due Diligence | Lock workstreams after completion | `assignDueDiligenceTask` had no COMPLETED check; FE still showed Add workstream | BE throws if DD `COMPLETED`; `TaskService.updateTaskStage` blocks DD tasks; FE hides Add workstream + blocks handler | `POST .../assign-task` → `"Cannot assign workstreams after due diligence is completed"` (verified on NTS deal) |
| Due Diligence | Navigate to Term Sheet tab | No post-success tab switch | `setDealTab('term')` on `api-complete-due-diligence` success in `portfolio-v11-app.tsx` | Runs only after successful `handlePortfolioV11Action` |
| Due Diligence | Email deal owner | Only applicant email sent | Added `sendDueDiligenceCompletedReviewerEmail` to DD reviewer | `DueDiligenceController` + `EmailNotificationService.ts` |
| Due Diligence | Task approval vs complete | System TASK_CREATED activities blocked completion even when task stage=completed | Skip activity approval check when task already `completed` | `DueDiligenceService.completeDueDiligence` |
| Term Sheet | Portfolio company on create | Creation only on DD complete, not term sheet | Idempotent `BoardReviewService.createUserAndPortfolioCompany` after term sheet create | `TermSheetService.createTermSheet` |
| Term Sheet | FE equity/valuation optional | BE requires both → 400 | Create modal fields marked required | `matanho-portfolio-runtime.js` create-term-sheet form |
| Term Sheet | Credentials email | Only sent when user newly created on DD complete | Unchanged (existing secure flow); term sheet create ensures company exists | `BoardReviewService.createUserAndPortfolioCompany` |
| Portal links | Wrong portal URL | "Launch applicant portal" opened apply/funding URL | `__INVESTEE_PORTAL_URL__` + `open-investee-portal` → `/investee-portal-v8` | `portfolio-v11-app.tsx`, `lib/portal/config.ts` |
| Investee Portal | Hardcoded mock data | `useMockData: true` + fixture company | `liveOnly: true`; `loadInvesteePortalLiveData()`; terms page from `GET /term-sheets/my` | `investee-portal-v8-app.tsx`, `live-loaders.ts`, `termsPage()` live branch |
| Investee Portal | Other screens | Still prototype fixtures when live | Live mode: **Terms** wired; dashboard/company name hydrated; other pages remain mock until wired | Documented below |

---

## Investee Portal Screen Audit (live mode)

| Screen | Data Source | Verified? | Evidence | Issue Found | Fix Applied |
|---|---|---|---|---|---|
| Term Sheet (`/terms`) | `GET /term-sheets/my` via `applicationPortalApi` | Yes (code + loader) | `termsPage()` live branch | Hardcoded Zambezi Pay terms | Live branch renders API fields |
| Overview (`/`) | Loader calls dashboard/company APIs | Partial | Company name from `GET /applicant/company` | Full dashboard still mock metrics | Hydrate company name only; full dashboard TBD |
| KPI Centre | Inline `kpis[]` fixture | No | — | Hardcoded | Not wired (shows mock if navigated) |
| Reporting | Inline `reports[]` | No | — | Hardcoded | Not wired |
| Forecasts | `forecastWorkbook` fixture | No | — | Hardcoded | Not wired |
| Cap table / Governance / etc. | Inline fixtures | No | — | Hardcoded | Not wired |

**Note:** Full live parity for all Investee V8 screens is a follow-up. Applicant term sheet viewing also works via legacy **`/application-portal/term-sheets`** (fully wired React page).

---

## Key Files Changed

### Frontend (`nvccz-new`)
- `components/portfolio-v11-mock/matanho-portfolio-runtime.js` — DD gate, portal link, term sheet form, workstream lock UI
- `components/portfolio-v11-mock/portfolio-v11-app.tsx` — loading action map, term tab navigation, investee URL
- `components/investee-portal-v8-mock/investee-portal-v8-app.tsx` — live loader
- `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js` — live terms page, hydrate API
- `lib/investee-portal-v8/live-loaders.ts` — new

### Backend (`nvccz`)
- `src/services/DueDiligenceService.ts` — assign lock, completed-task validation
- `src/services/TaskService.ts` — stage update lock when DD complete
- `src/services/TermSheetService.ts` — ensure portfolio company on create
- `src/services/EmailNotificationService.ts` — reviewer completion email
- `src/controllers/DueDiligenceController.ts` — send reviewer email

---

## Manual Verification Checklist

1. **DD complete button** — With incomplete assessment → disabled; fill all 4 required criteria + save → enabled.
2. **Complete DD** — Click → spinner on button → success toast → **Term Sheet** tab active.
3. **Add workstream** — Hidden after completion; direct API returns 400 (verified).
4. **Create term sheet** — Equity + valuation required; creates TS; portfolio company ensured.
5. **Investee portal** — Login as applicant → `/investee-portal-v8/terms` shows live term sheet (after TS created).
6. **Portal link** — Portfolio V11 "Launch investee portal" opens `/investee-portal-v8` (or `NEXT_PUBLIC_INVESTEE_PORTAL_URL`).

---

## Blockers / Follow-ups

- **Email delivery:** Reviewer/applicant emails depend on SMTP/env; verify in mail logs for your environment.
- **Investee V8 non-terms screens:** Still prototype data in live mode — wire to `/applicant/*` APIs per screen.
- **NTS deal DD already COMPLETED:** Use a fresh application or reset script to test full complete-DD UX from scratch.
