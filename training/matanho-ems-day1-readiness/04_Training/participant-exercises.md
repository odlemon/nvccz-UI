# Participant exercises

Use only approved test accounts and synthetic data. Exercises 2–3 are **facilitated dry-runs** until create/save/retrieve workflows are confirmed; do not leave duplicate records.

## Exercise 1 — Sign in and navigate (ready for supervised retest)

- **Objective:** authenticate, identify Home, open a permitted module, and return Home.
- **Prerequisites:** named test account with access approved; attendee has dev URL reachability.
- **Starting point:** `https://dev.matanho.com/login`.
- **Steps:** sign in; confirm display name/environment; open **Modules**; choose an authorized app; use the visible **Home** link to return.
- **Expected:** session remains signed in; correct module and Home render; no unexplained error toast.
- **Pass:** all steps succeed and role boundaries remain enforced. **Fail:** redirect loop, persistent loading, unauthorized toast, or Home unavailable.
- **Facilitator observation:** record role, route and toast text without capturing credentials.

## Exercise 2 — Fund record (blocked at persistence)

- **Objective:** understand fund setup and retrieve a saved record.
- **Prerequisite:** Portfolio create privilege, approved synthetic environment, no pending duplicate save, backup/restore accepted.
- **Observed sample:** `TRAINING DEMO — Matanho Growth Fund I`, Growth Equity, vintage 2026, USD, target USD 5,000,000, Zimbabwe. Synthetic, not a real mandate.
- **Steps:** Portfolio Management → Funds → **Create fund** → **Details** → **Ownership** → **Review**; verify summary; submit once; wait for definitive toast/result; record ID; return to Funds; refresh and retrieve.
- **Pass:** one saved row and stable record ID after refresh. **Current result:** blocked; earlier submission remained Saving… with no definitive result. Do not resubmit.

## Exercise 3 — Investor registration (not verified)

- **Objective:** create/retrieve an approved synthetic investor and link to a verified fund if supported.
- **Prerequisite:** investor create form, required field policy, and correct fund record verified; no actual client data.
- **Steps:** not written as click-by-click until actual live form is inspected. Facilitator records labels and fields before issuing this exercise.
- **Pass:** one synthetic investor persists and is retrievable after refresh; linkage and permissions are correct. **Current status:** blocked/not tested.

## Exercise 4 — Understand permissions

- **Objective:** identify permitted modules/actions and an action that should be denied.
- **Prerequisites:** separately approved admin and restricted test accounts; agreed user access matrix.
- **Steps:** compare module navigation; attempt an approved allowed action; verify a protected disallowed route/API is denied; return Home.
- **Pass:** UI and backend agree; no confidential data is exposed. **Current status:** dev matrix not completed; use report only as a test script, not as proof of pass.

## Exercise 5 — Investment pipeline to committee decision (local UAT)

- **Objective:** move one synthetic opportunity from initial screening through due diligence and an investment committee decision, with an auditable record.
- **Synthetic scenario:** `UAT Opportunity Analytics`; use a synthetic investor/company profile and four harmless documents: business plan, proof of concept, market research, and projected cash flows.
- **Steps:** Portfolio Management → Deal Flow → Add Deal; complete Details and Ownership; upload all four documents; create the application; refresh and record the application ID; run/confirm screening; assign the investment officer; open Due Diligence; complete assessment criteria and attach evidence; create the term sheet with a synthetic PDF; submit/open Board & IC Decision; record the supported committee outcome; refresh; open Activity/Audit Logs and verify the complete event chain.
- **Expected:** the opportunity is discoverable in the list and detail views at each stage, DD evidence persists after reload, the committee decision is visible, and the audit trail contains creation, screening, DD, term-sheet/committee, and final decision events with user and timestamps.
- **Pass condition:** every step above succeeds and the evidence register contains the route, record IDs, screenshots or visible labels, refresh checks, and audit-event confirmation.
- **Current status:** **Blocked at required native file upload** in the 15 October 2026 browser run. The existing synthetic `NTS - Seed` record confirms screening and DD read-path behavior, but no new application or committee decision is claimed from this exercise.
- **Participant sign-off:** Record participant, role, date, synthetic opportunity ID, final decision, audit verification, and any recovery action. Do not use client data or real approvals.

## Exercise 6 — Day 4 due diligence to portfolio monitoring

- **Objective:** complete a synthetic investment assessment, retrieve its approval history, and persist a portfolio holding/KPI update.
- **Scenario:** use `UAT-DAY4-DUE-DILIGENCE-<timestamp>` and `UAT-DAY4-PORTFOLIO-HOLDING-<timestamp>` only.
- **Steps:** open the opportunity; complete Due Diligence; assign a review task; attach synthetic financial/legal evidence; submit for committee review; refresh and retrieve the submission and approval history; open the linked portfolio-company profile; review investment information, ownership, investment date, and capital deployed; update one KPI or operating value; save; refresh; retrieve the company profile again; inspect Activity/Audit; repeat protected actions with the restricted persona.
- **Pass:** authorised actions persist after refresh; the restricted persona is denied by both UI/API; the evidence register contains routes, IDs, actor/timestamps, and audit events.
- **Current status:** prepared for local UAT; no completion claim until the evidence register is populated.
- **Participant sign-off:** Participant __________ Role __________ Date __________ Holding ID __________ KPI updated __________ Facilitator __________
