# Deal Lifecycle E2E Fix Plan — Deal Detail → Disbursement + Investee Portal

**Date:** 6 September 2026 · **Phase:** 1 (plan) — Phase 2 (live execution) begins on confirmation of this doc

## Decisions locked in (from clarifying questions)

1. **Test record:** seed a brand-new disposable deal via the public `/funding-application` intake form, with a `.example` (reserved, non-routable) applicant email. Not reusing GreenOrbit Energy despite it checking out safe.
2. **Email:** let internal notification emails send normally to the real DB test accounts (`@nts.com`/`@nvccz.co.zw`) — no transport stubbing.
3. **Checkpoints:** a short status update after each stage below, not just a final report.
4. **Backend-in-scope:** confirmed reversed from earlier tasks — fix backend bugs found along the way, don't just flag them. Consistent with how the E-Signatures and Settings tasks already ended (both did real backend fixes).
5. **Concurrent work:** per the last two tasks, treating this session as sole owner of the shared tree going forward, not isolating into a worktree.

## Safety findings (verified, not assumed — see prior turn for method)

- **No real payment rail exists anywhere in the disbursement code path.** Searched `InvestmentImplementationService.ts` end-to-end — no external payment API calls. "Disbursement" is a recording/approval workflow (`approveFundDisbursement`, `markDisbursementAsDisbursed`), not a real funds movement.
- **No real e-signature provider.** The `FundraisingAgreement.provider` defaults to `"MANUAL"` — signing is fully internal (built in an earlier task this session).
- **Email is real and live** (hardcoded ZeptoMail SMTP, no dev stub) — mitigated by using a `.example` applicant address for the test deal; internal recipients are real but known test mailboxes (per decision 2).

## Stage sequence — Deal Detail → Disbursement

Source: `dd-term-investee-flow-report.md`, `portfolio-user-stories.md` (Epics 1–7), and this session's direct code tracing. Each row states what "working" means concretely — not just "renders."

| # | Stage | Trigger / UI | "Working" means |
|---|---|---|---|
| 0 | **Intake** | Public `/funding-application` form, no login | Submitting creates a real `Application` row, visible on staff Deal Flow without any staff action. This is how the test deal gets created. |
| 1 | **Deal Detail tabs** | `/portfolio/deals/detail?id=...` | Every tab (Overview, Application, Screening, Diligence, Term, IC, Disbursement, Documents) renders from the live `dealDetail` payload (`loadDealDetail` → 4 parallel real API calls) — no tab shows fixture/hardcoded content. Verify by comparing displayed values against `GET /applications/:id` response directly. |
| 2 | **Screening** | Screening tab → `Confirm shortlist` | Real backend call fires (confirmed unwired at last check — `confirm-shortlist` has no `actions.ts` branch; **first thing to fix if still broken**), UI reflects the decision, re-fetch confirms it persisted. |
| 3 | **Due diligence — start** | Diligence tab → `start-due-diligence` | Fires `api-initiate-due-diligence`, a real `dueDiligenceReview` row is created, tab re-renders with the workspace. |
| 4 | **DD — assign & complete workstreams** | `submit-dd-task`, `complete-dd-task` | Task rows created/updated for real via `taskApiService`. |
| 5 | **DD — assessment** | `submit-dd-assessment` | All 4 criteria + recommendation persist via `api-update-due-diligence`; re-fetch confirms. |
| 6 | **DD — complete** | `complete-due-diligence` | Gate (`canCompleteDueDiligence`) only enables once the assessment is genuinely complete; on success, deal advances stage and UI auto-switches to Term tab; DD reviewer + applicant emails fire. |
| 7 | **Term sheet — create** | Term tab → `submit-create-term-sheet` | Real `TermSheet` row created with required equity/valuation; portfolio company + investee user provisioned (idempotent, per `TermSheetService.createTermSheet`). |
| 8 | **Term sheet — e-signature** | E-Signatures → `New envelope` (built this session) or investee-side `sign-term-sheet` | A real `FundraisingAgreement` + signatory created; **or** the investee-portal path (`applicationPortalApi.signTermSheet`) marks `TermSheet.isSigned=true` directly. Both paths exist — this plan tests the investee-side path since that's the one actually gating deal progression (`TermSheet.isSigned`), and separately exercises the staff-side E-Signatures envelope as its own real flow. |
| 9 | **Board / IC** | Board tab → `submit-start-board-review`, then `vote-approve`/`final-vote` | Real `BoardReview` + vote rows; approval clears the way to implementation. |
| 10 | **Implementation — start** | Disbursement tab → `start-implementation` | Requires portfolio company to exist (from step 7); creates `InvestmentImplementation` row. |
| 11 | **Disbursement — tranche release** | `confirm-release-tranche` / the approve/reject disbursement flow | `createFundDisbursement` → `approveFundDisbursement`/CFO notification → `markDisbursementAsDisbursed`. This is the finish line for the staff-side lifecycle. |

**Known from prior sessions, expected to need fixing along the way** (not guessed — traced in the earlier gap-analysis, unless already fixed since): screening actions (`confirm-shortlist`, `rerun-screening`, `screen-reject`) had no `actions.ts` branch as of the last check; individual IC votes (`vote-approve` etc., as opposed to `final-vote`) likewise. These will be verified live at stage 2 and 9 respectively, fixed on the spot if still broken.

## Investee Portal — equivalent flow

Re-verified this session (state has moved since the last full audit — the other agent's Phase 3 work wired a real action channel):

| # | Stage | "Working" means |
|---|---|---|
| A | **Sign-in** | Investee logs in with the test deal's provisioned credentials (created at stage 7 above), lands on `/investee-portal-v8`. |
| B | **View term sheet** | `/investee-portal-v8/terms` renders the real term sheet created at stage 7 (confirmed live-wired in the last gap analysis). |
| C | **Sign term sheet** | `sign-term-sheet` / `api-sign-term-sheet` now has a real handler (confirmed present in `lib/investee-portal-v8/actions.ts` this session) calling `applicationPortalApi.signTermSheet()`. This is the investee-side half of stage 8 above — test it as the same event, not twice. |
| D | **Post-signature state** | Portal reflects `isSigned=true` after reload; staff-side Term tab shows the same. |

**Deliberately narrower than "every investee screen"**: per the existing gap-analysis, most other investee screens (KPI Centre, Reporting, Forecasts, Cap Table, Governance, Requests, Messages) are independent prototype surfaces unrelated to the deal-lifecycle handoff this task is about. Per the task's own out-of-scope note ("modules outside the deal lifecycle... unless a flow step hands off to one"), this plan scopes the Investee Portal pass to the term-sheet handoff (A–D) — the part the deal lifecycle actually hands off to — and will note but not chase unrelated investee screens unless the live run surfaces something that blocks A–D.

## Sequencing & dependencies

Strictly linear 0→11 on the staff side; A–D can only start once stage 7 (term sheet + investee provisioning) is real. No stage will be attempted out of order — if stage N fails and can't be fixed quickly, the plan stops there and reports rather than skipping ahead with a manual workaround (per acceptance criteria: no skipped steps).

## Progress reporting

A checkpoint message after each stage in the tables above (not each individual sub-step), stating: what was tested, pass/fail, what was fixed if anything, and confirmation the fix was re-verified by continuing rather than testing in isolation.

## What I will not do

- Touch the payment/disbursement path in a way that assumes a real payment rail exists (it doesn't — confirmed above).
- Modify email transport/credentials (decision 2).
- Chase investee screens outside the term-sheet handoff unless they block it.
- Skip a broken stage and continue past it manually to reach disbursement faster — if something can't be fixed live, the run stops and reports honestly rather than faking completion.

---

Ready to begin Phase 2 on confirmation.
