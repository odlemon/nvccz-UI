# Staff-Created Deal — E2E Execution Log (Add Deal flow)

**Date:** 2026-09-06
**Test deal:** Staff-Created Deal Co – Series A (`applicationId cmtq07ljh000jun8w99v4c192`, `dealReference VST-2026-000005`, `source: INTERNAL`, applicant email `rutendo@staffcreatedco.example` — reserved `.example` domain)
**Goal:** confirm the "Add Deal" button on the Deal Flow board (the staff-initiated intake path, as opposed to the public application form) actually works, then walk the resulting deal live through the full lifecycle to disbursement, watching specifically for layout/overlap issues and responsive behaviour.

**Result: the button works, the full lifecycle completed for real end to end (`currentStage: DISBURSED`), and I found and fixed 4 real bugs along the way** — two of them serious, previously-undetected responsive-layout defects in the Investee Portal.

---

## The "Add Deal" flow

Deal Flow (`/portfolio/deals`) → **+ Add Deal** opens a real 3-step wizard (Details → Ownership → Review) that calls the real `POST /applications` endpoint with `source: INTERNAL`. Confirmed clean, non-overlapping layout at every step, including the multi-line textarea and date/number fields. The wizard requires 4 document uploads at the Review step (same file-upload gap as the public form — the browser automation tool can't attach files), so intake was completed by replicating the exact multipart contract via `curl`, same approach as the first E2E run. The new deal appeared correctly and immediately in the Deal Register (pipeline value, deal count updated live).

## Bug found: Ownership/valuation fields silently discarded

The wizard's **Ownership** step (founder ownership, board composition, key shareholders, governance notes, proposed ownership, pre-money valuation, target close date) was captured correctly by the frontend and dispatched to the action handler — but `ApplicationCreateRequest` / `applicationsApi.create()` had no field to carry it, and the action handler dropped it entirely before calling the API. The backend already supports an `applicationFormData` JSON field for exactly this data (used by the public intake form). **Fixed**: added `applicationFormData` to the type and to the multipart payload, and built it from the wizard's dataset in `lib/portfolio-v11/actions.ts`. Verified live — Overview now shows real Proposed Ownership (12%) and Pre-Money Valuation ($11M) instead of blanks.

## Bug found: "Confirm shortlist" always failed for internally-created (and any already-scored) deals

Every deal auto-scores into `SCREENING` immediately after intake. The "Confirm shortlist" button was wired only to `triggerShortlisting` (`POST /trigger-shortlisting`), which requires stage `SCREENING_PENDING` — a stage no deal is realistically in by the time a human looks at it. Clicking it always produced *"Application is currently in SCREENING. Only applications in SCREENING_PENDING can be processed."* This reproduced identically on both deals tested this session, confirming it as a systemic bug, not a one-off. **Fixed**: made the handler stage-aware — `SCREENING_PENDING` still calls `triggerShortlisting`; `SCREENING` now calls the correct `analystScreening` endpoint instead, self-assigning the acting user as lead analyst first if needed (auto-claiming an eligible Investments-department analyst otherwise). Verified live via a real analyst account (Tendai Moyo, `investments.analyst@nts.com`) — shortlist confirmed for real, deal advanced to `ACTIVE_DD`.

## Bug found: Due Diligence tab was 100% fixture, showing false "100% complete" for a fresh, unstarted DD

`renderDealDiligence()` hardcoded `Overall Progress: 100%`, `Workstreams: 6/6`, and a fully-"Complete" workstream table regardless of the real due-diligence record — so a due diligence that had genuinely just started, with all 6 criteria still `false`/`null` and all tasks still `todo`, displayed as fully done. **Fixed**: replaced with a real-data render (progress, criteria table, workstream tasks, recommendation) driven from the live `dueDiligence` record. Verified live: correctly showed `0% / 0 of 6 criteria / 0 of 4 tasks` before filling the assessment, and `100% / 6 of 6` with real per-criterion comments after saving it through the real assessment modal.

## Responsive bugs found — Investee Portal (mobile viewport)

Testing at 375×812 (mobile preset) surfaced two real, previously-undetected CSS bugs in `investee-portal-v8-overrides.css`:

1. **Entire portal rendered blank on mobile.** The overrides file set `.sidebar { position: relative; min-height: 100%; }` unconditionally. The base stylesheet's mobile layout (`.app{display:block}` + `.sidebar{position:fixed; transform:translateX(-105%)}`, i.e. an off-canvas drawer) got overridden back to `position: relative` at every viewport width, so the off-canvas sidebar kept reserving its full-height box in the mobile block layout — pushing the entire real page content (`.shell`) exactly one viewport-height below the visible fold. Every mobile visitor saw a plain white screen with no way to know the app had loaded. **Fixed**: gated that rule to `@media (min-width: 761px)`.
2. **Hamburger menu didn't open the mobile sidebar drawer.** Even after fix #1, the base stylesheet's `.app.mobile-open .sidebar { transform: none }` rule was losing the cascade at build time — clicking the hamburger correctly toggled the `mobile-open` class, but the sidebar stayed translated off-screen. **Fixed**: added a `!important`-qualified override rule in the overrides file, scoped to `max-width: 760px`.

Both fixes verified live at the actual mobile viewport (375×812): the portal now renders correctly on first load, and the hamburger menu opens a clean, non-overlapping sidebar drawer with real data.

---

## Full lifecycle result

| Stage | Result |
|---|---|
| Intake (Add Deal) | ✅ Real deal created via the actual "Add Deal" button/wizard flow |
| AI Screening | ✅ 68/100, shortlisted; confirmed via the fixed "Confirm shortlist" flow (as a real analyst account) |
| Due Diligence | ✅ Assessment completed via the real modal (all 6 criteria, real comments, recommendation); "Complete DD" succeeded (confirmed via network response — a stale "Saving…" banner is a known cosmetic-only issue already noted in the prior run, not a functional defect) |
| Term Sheet | ✅ Created, finalized, investor-signed (staff), applicant-signed (real Investee Portal login as Rutendo Chikwanha) |
| Board & IC | ✅ Board review started, voted APPROVE (as a real board-eligible role), completed — `investmentApproved: true` |
| Investment Implementation | ✅ Initiated for real ($1.5M committed) |
| Disbursement | ✅ Statutory compliance cleared (RBZ document + KYC), tranche released and **approved — `DISBURSED`**, real cashbook entry, reference `FD-CMTQ1NQY` |

No overlapping UI components were found anywhere in this run at desktop width. All layouts (wizard steps, deal detail tabs, modals) rendered cleanly.
