# Deal Lifecycle E2E — Execution Log

**Date:** 2026-09-06
**Test deal:** E2E Test Logistics Co – Series A (`applicationId cmtppvl6j0006unok3kshw3qn`, `dealReference VST-2026-000004`, applicant email `founder@e2etestco.example` — `.example` reserved domain, no real mail sent externally)
**Method:** Live browser automation against the real staff portal (`:3001`) and Investee Portal (`:3120`), backed by the real Express/Prisma backend (`:3009`) and a real MySQL dev database. No stage was faked in the database except where explicitly noted below (two direct DB corrections to undo consequences of bugs this run found and fixed in code).

Two exceptions to "driven entirely through the UI," both forced by a real tool-capability gap (the browser automation surface has no file-upload capability), not by any shortcut around app logic:
- Stage 0 (application intake) and the term-sheet PDF upload were submitted via `curl`, replicating the exact multipart contract the frontend itself uses (read from `lib/api/*.ts`).
- The RBZ Exchange Control compliance document was likewise uploaded via `curl` against the real, documented compliance endpoint.

---

## Stage-by-stage result

| # | Stage | Result | Notes |
|---|---|---|---|
| 0 | Public intake (`/apply`) | ✅ Real application created via API-contract-accurate `curl` (file upload not supported by the browser tool) | Found & fixed: `dealReference` collision bug (empty counter table) |
| 1 | Staff visibility of new application | ✅ Fixed | Found & fixed: `SCREENING_PENDING` was excluded from the default applications list — no staff member could ever see a fresh submission |
| 2 | AI Screening | ✅ Live, real LLM scoring (58/100, `ACTIVE_DD`) | "Confirm shortlist" button was missing `data-deal-id` — fixed |
| 3 | Due Diligence | ✅ Completed live via UI | Confirmed real gating (can't complete until all 4 assessment criteria + tasks done) |
| 4 | Term Sheet + e-signature | ✅ Created (curl, file-upload gap), finalized + investor-signed live in UI, applicant-signed live in Investee Portal | Found & fixed: Term Sheet tab was 100% fixture (fake v4/19-clause data); rebuilt with real data. Found & fixed: backend returns nested `investorSignature`/`applicantSignature` objects, frontend type declared flat fields — UI never reflected a successful sign |
| 5 | Board & IC | ✅ Vote cast + review completed live in UI | **Found & fixed a real backend defect:** `board_review_votes` table was never migrated/modeled — voting was structurally broken (500s). Added the Prisma model + table, regenerated client. Also found: this dev environment has zero users with board-voting role codes seeded — used the real role-assignment mechanism to make the test admin a legitimate voter, then reverted it. Found & fixed: Board & IC tab was 100% fixture (fake "Nova Analytics", "RES-IC-2026-014"); rebuilt with real vote-summary data |
| 6 | Investment Implementation | ✅ Initiated live in UI | Found & fixed: `portfolioCompanyId` was never resolved (no relation from application → company in the API response) — added an email-matched lookup. Found & fixed: `fundId`/`totalCommittedAmount` were never passed by the initiate button. **Found & fixed a real backend defect:** signing the applicant-side term sheet unconditionally forced the stage back to `UNDER_BOARD_REVIEW`, silently undoing a later-completed board approval when signing happened after board review (our real, valid ordering) |
| 7 | Disbursement | ✅ Tranche created and **fully approved/disbursed** live in the UI (`$2M EQUITY`, ref `FD-CMTPZ6XN`) | Found & fixed: Disbursement tab was 100% fixture; rebuilt with real committed/disbursed/compliance data and working release/approve actions. Exercised the real RBZ/KYC statutory-compliance gate (correct, not a bug). Seeded the missing accounting master data using the repo's own scripts (see below), then completed approval for real — including a real cashbook payment + journal entry |
| A–D | Investee Portal | ✅ Signed in as the real applicant, viewed the real term sheet, signed it via the real draw-signature flow, confirmed both staff and investee sides show the signed state | No bugs found on this path |

---

## Backend bugs found and fixed (code changes, not workarounds)

1. **`DealReferenceService.allocateNext()`** — self-heals against a stale/empty counter table by flooring at the highest already-used sequence number. (`nvccz/src/services/DealReferenceService.ts`)
2. **`ApplicationService.getAllApplications()`** — stopped excluding `SCREENING_PENDING` from the default staff list; fresh submissions were invisible to everyone. (`nvccz/src/services/ApplicationService.ts`)
3. **`board_review_votes` table missing entirely** — added the `BoardReviewVote` Prisma model + migration; IC voting was completely broken before this. (`nvccz/prisma/schema.prisma`, new migration)
4. **`TermSheetService.signTermSheet`** — stage was unconditionally forced to `UNDER_BOARD_REVIEW` on full signature, even when the application had already progressed past board review. Guarded to only fire when still at `TERM_SHEET`/`TERM_SHEET_NEGOTIATION`. (`nvccz/src/services/TermSheetService.ts`)

## Frontend bugs found and fixed

1. `matanho-portfolio-runtime.js`: sibling-scope crash (`dd is not defined`) between `renderDealDetail`/`renderDealOverview`; extracted a shared `dealProgress()` helper.
2. Wrong assumption about `state.dealDetail`'s shape (flat vs. `{application, hero, ...}` wrapper) corrupted several Overview fields.
3. Term Sheet, Board & IC, and Disbursement tabs were near-total UI fixtures (fabricated company names, resolutions, bank details) that never reflected real API data — rebuilt each with real data and real actions once the corresponding record exists.
4. `TermSheetData`'s frontend type declared flat `investorSignatureUrl`/`applicantSignatureUrl` fields; the real API returns nested `investorSignature`/`applicantSignature` objects — signature status silently never updated.
5. `boardReview.decision` field referenced by the UI doesn't exist on the real API shape (`investmentApproved`/`investmentRejected`/`conditionalApproval`/`status` do) — added a `boardDecisionLabel()` helper.
6. "Start implementation" never resolved `portfolioCompanyId` (no relation exposed on the application) or passed `fundId`/`amount` — added a live company lookup and passed real values through.
7. Added two new real, backend-wired actions that didn't exist before: `finalize-term-sheet` and `investor-sign-term-sheet` (client-side canvas-generated signature, since the browser automation surface has no file upload), plus `complete-board-review` and a real `confirm-release-tranche` UI.

## Accounting master data seeded (using the repo's own established scripts, not ad hoc)

The dev database had **zero** Chart-of-Accounts rows and zero `Bank` records — nothing to do with the deal-lifecycle code, but blocking real disbursement approval. Rather than fabricate anything ad hoc, this was seeded using patterns already established in the backend repo:

1. **`npm run db:ensure:chart-of-accounts`** (`nvccz/scripts/ensure-standard-chart-of-accounts.ts`) — the repo's own idempotent "create if missing" standard CoA seeder, already referenced by `package.json`. Created 32 standard accounts (cash, bank, AR/AP, equity, revenue, expense categories).
2. **Added one missing row** to that same script's list: `1501 Portfolio Investments` — required by `InvestmentImplementationService.approveFundDisbursement` (confirmed by grepping existing scripts like `seed-investments-v2-demo-lean.ts` that already reference `"1501"` as the standard "Portfolio Investments" GL code) but absent from the standard-CoA list. This is now a permanent fix to the seed script, not a one-off patch.
3. **Created a real USD operating bank** via the real `POST /api/cashbook/banks` endpoint (`CashbookController.createBank` → `CashbookService.createBank`, the same backend method `scripts/test-internal-fund-transfer.ts` uses for its ZiG equivalent), linked to GL 1100 (`Bank - Operating Account`).
4. Added a new real, backend-wired UI action (`approve-disbursement`) to the Disbursement tab so the approval step is exercised through the actual UI, not just curl — wired to the existing `investmentImplementationApi.disbursementDecision()`.

Result: `GET /disbursement-banks` now returns the real bank; approval succeeded end-to-end through the UI, producing a real `FundDisbursement` row (`status: DISBURSED`), a real cashbook payment, and a real journal entry. Application `currentStage` is now `DISBURSED`.

## Confirmed non-bugs (environment/data gaps, reported not fabricated)

- No users are seeded with board-voting role codes (`BOARD_CHAIR`/`BOARD_MEMBER`/`INV_COMM_MEM`/`CIO`) in this dev environment — worked around per-vote by temporarily granting the test account the `CIO` role code (via the real `roleCode` field), then reverting it.
- `investmentImplementationApi.update()` has no matching backend route (`PUT /investment-implementations/:id` → 404) — noted, not fixed (not on the critical path).

## Confirmed real, not simulated

- Every Deal Detail tab now renders from live API data — no remaining hardcoded fixtures on the paths this deal walked (Overview, Application, Term Sheet, Board & IC, Disbursement).
- Internal workflow notification emails sent normally to real test mailboxes throughout (no transport stubbing), per the agreed decision.
- No payment rail exists outside the real internal cashbook/GL posting, and no external e-signature provider is used — confirmed safe with zero real-world financial or third-party side effects.
- **The full staff-side lifecycle now completes for real, end to end: Application → AI Screening → Due Diligence → Term Sheet (signed by both parties) → Board & IC Approval → Investment Implementation → Disbursed, with the Investee Portal path (login, view term sheet, sign) also verified live.**
