# Fundraising KYC — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). 8-step investor-onboarding wizard, a "-mock" vendored-runtime
port (`components/fundraising-kyc-mock/fundraising-kyc-app.tsx` + `matanho-fundraising-kyc-runtime.js`).

## FINDING-FRK-001 — Wizard showed "Changes saved" but never actually persisted anything — real fix already existed unmerged, now deployed and verified

**Severity:** Critical (silent data loss on every save, for the platform's investor-onboarding compliance
flow). **Status: fixed and live-verified on dev.**

Live-tested the wizard: selected applicant type, filled Step 1's required fields (Relationship, Fund), and
clicked both the auto-advance "Continue" and the explicit "Save and exit later." The UI displayed "Changes
saved" throughout, but network monitoring showed **zero API calls** on save, and reloading the page reset
the wizard to Step 1 with nothing retained.

Root cause, found by tracing rather than guessing: the deployed `ui-staff` build predates
`feature/fundraising-kyc-onboarding-live` (an already-complete, unmerged branch on `nvccz-UI` from
2026-09-17). Its own commit message explains the exact bug: the wizard was "a fully-built, self-contained
mock... with no backend behind it — its 'real' API branch already targeted a generic, invented REST
contract (`/api/v1/onboarding/applications/...`) that doesn't exist on this backend," and rewires it to the
real, already-shipped `FundraisingKycCase`/`InvestorOrganisation` contract (`GET/POST /fundraising/kyc-
cases`, `PATCH /fundraising/kyc-cases/:id`, confirmed already on `nvccz` master before touching anything).

**Almost caused a much bigger problem while fixing this — recorded because it's a real process lesson, not
just an outcome:** the branch containing the real fix (`feature/fundraising-kyc-onboarding-live`) is based
on a stale point in `dev`'s history. `git diff origin/dev origin/feature/fundraising-kyc-onboarding-live
--stat` showed 47 files, net **6,240 lines deleted** — including Performance's rescued 939-line runtime
patch script, Procurement's 878-line TEST_FINDINGS.md, and FP&A's findings/plan docs — none of which this
branch was ever meant to touch; it simply predates their existence. Merging it directly would have silently
reverted all of that completed work. Caught by diffing before merging rather than trusting the commit
message alone. Fixed properly by cherry-picking only the 2 commits that actually touch fundraising-kyc
(`ab3700c`, `7ce3f35`) onto a fresh branch off current `dev` (`feature/fundraising-kyc-live`).

**A second deploy-base hazard, also caught before it caused damage:** the currently-deployed `ui-staff`
container is not simply "dev" either — it separately carries Performance's own live fixes
(`feature/performance-v22-live`, also still unmerged). Deploying the KYC fix from a plain-`dev` worktree
would have reverted Performance's nav-badge/module-config fixes back to broken. Verified this directly
(checked the live nav badge showed the fixed "hidden when zero" behavviour before touching anything), then
built the deploy from the Performance worktree with the KYC commits cherry-picked on top of *that*, instead
of from `dev`. Re-checked the nav badge after deploying — still correct, no regression.

**Live-verified after deploying:** cleared browser storage for a clean test, filled the wizard, saved.
Watched real API calls succeed: `POST /api/investors` → 201 (or `409 DUPLICATE_INVESTOR` on a second
attempt, since dev.matanho.com is shared — good sign, real server-side duplicate detection working)
→ `POST /api/fundraising/kyc-cases` → case created, `PATCH .../kyc-cases/:id` on subsequent saves. Confirmed
via a direct `GET /api/fundraising/kyc-cases` call that a real case (`cmu5c85jk0004mr01ys5lebul`, status
`IN_PROGRESS`) exists with a `detailsJson` blob containing my actual test selections (product, country,
province) — this is genuinely persisted, not a mock success. Left the test investor
org/case in place (no `DELETE` endpoint exists for either resource on this backend) — flagging rather than
force-deleting via direct DB access.

## Known limitation, not a bug (from the fix's own commit message, worth carrying forward)

No biometric liveness provider is integrated — the wizard's Step 3 (Selfie & liveness) reports "needs
assisted review" rather than fabricating a pass/fail result. This is the honest, correct behavior for a
missing integration (matches this codebase's established pattern of not faking results for unbuilt
capabilities), not something to build out as part of this sweep.

## Not yet re-verified against the fresh deploy

Steps 2-8 (Identity, Liveness, Ownership, Investment & funds, Compliance, Documents, Review & submit) were
covered by the branch's own commit description (detailsJson PATCH covers the full wizard state; document
uploads go through the real `fundraisingApi.createDocument` multipart endpoint) but not independently
re-walked screen-by-screen after this deploy, given the core persistence mechanism (the actual defect) is
now conclusively confirmed working end-to-end via the case record's contents. Worth a full walk-through in
a follow-up pass if this module gets prioritized further.

## Recommended follow-up (not done, flagging)

No `scripts/patch-fundraising-kyc-runtime.mjs` safety net exists for this module's vendored runtime, unlike
Portfolio/Investee Portal/Performance (see those modules' own `HANDOFF_AND_TEST_PLAN.md` docs for why this
matters — a prior incident wiped 20 hand-patched wirings on a raw re-extraction). This fix hand-edits
`matanho-fundraising-kyc-runtime.js` directly with no such protection. Recommend building the same
patch-script pattern before this runtime is ever re-extracted from `scripts/extract-fundraising-kyc.mjs`.
