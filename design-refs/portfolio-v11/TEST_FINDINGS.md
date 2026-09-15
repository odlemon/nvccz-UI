# Test findings — Portfolio V11

**Engagement:** Portfolio V11 end-to-end (UI to backend) full sweep, mirroring the completed Procurement
V23 engagement · branch `feature/portfolio-v11-live` (frontend; backend only if needed)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only
after it has been reproduced live. Static/code-only analysis (the September 2026 gap-analysis) is treated
as a hypothesis to verify, not a fact.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 4 | 0 | 1 |
| MEDIUM | 5 | 0 | 0 |
| LOW | 0 | 0 | 0 |

## FINDING-PV11-001

**Page / flow:** Funds → Create fund (and, by inspection, every other Fund Management route)
**Steps to reproduce:** Log in as `portfolio.mgr@nts.local` (PORTFOLIO_MGR, granted "full" access to
`portfolio-management` including all `PORTFOLIO_ACTIONS` in `lib/config/role-permissions.ts`). Portfolio →
Funds → Create fund → fill the form → Create fund.
**Expected:** Fund created — this role's frontend grant is "full" access to the whole module.
**Actual:** `POST /funds` returns 403 `{"success":false,"message":"Forbidden: insufficient permissions"}`.
Root cause confirmed by reading the backend route directly: `nvccz/src/routes/fundRoutes.ts` gates every
single route with the legacy `authorize(["admin"])` or `authorize(["admin","fund_manager"])` middleware —
a hardcoded role-name allowlist completely disconnected from `ROLE_PERMISSIONS_MAP`. `authorize()`
(`nvccz/src/middleware/authenticate.ts:89`) matches by normalized role name/roleCode via
`userMatchesAuthorizeRoleList` against that literal list; `PORTFOLIO_MGR`/`INV_ANALYST` match neither
`"admin"` nor `"fund_manager"`, so every Fund Management endpoint — create, update, close, get-by-id,
statistics, documents, industry/status/balance lookups — is unreachable to the actual intended day-to-day
role for this module, not just fund creation. Same root-cause class as the ACCT-1 fix earlier this
session, opposite direction: there the permission plumbing was too permissive; here it was simply never
extended to the newer role at all.
**Severity:** HIGH — blocks a legitimately-granted role from a core part of its own module, wholesale, not
an edge case.
**Suspected area:** `nvccz/src/routes/fundRoutes.ts`'s `authorize([...])` lists on every route.

**FIXED and verified live, 15 September 2026** (nvccz `1a19a18`, deployed to dev): added `portfolio_mgr`
to every route (matching the frontend's "full" grant) and `inv_analyst` to the read-oriented routes
(list, detail, statistics, documents, industry/status/balance) matching its narrower "write" grant;
left fund create/update/close as admin + portfolio_mgr only. Verified live: `portfolio.mgr@nts.local`
and `inv.analyst@nts.local` both now get `GET /funds` → 200 with all 7 real funds; `portfolio.mgr` can
now reach `POST /funds` (a follow-up 400 was an unrelated Prisma validation issue in the test payload,
not a permission refusal); a role with no Portfolio grant at all (`proc.mgr@nts.local`) is still
correctly refused with 403 — the fix is properly scoped, not a blanket opening.

**Same root cause found in a sibling file, fixed in the same pass:** LP Management showed "0 LPs" /
"$0 Total Commitments" for `portfolio.mgr` even though real LP records exist (visible via capital-call
allocations) — traced to `nvccz/src/routes/clientRoutes.ts`'s `GET /clients` (and statistics/detail/
investor-lookup/link-user/update) carrying the identical legacy `authorize(["admin","fund_manager"])`/
`authorize(["admin"])` gate. Fixed the same way: `portfolio_mgr`+`inv_analyst` added to the read routes,
`portfolio_mgr` added to create/update (delete left admin-only, matching how fund deletion isn't exposed
to portfolio_mgr either).

**Update — broader than first written:** `GET /funds` carries the same `authorize(["admin","fund_manager"])`
gate, confirmed live: as `admin@nts.com` the Funds page correctly lists 7 real funds ($608M called,
$1.2B committed, 9 existing capital calls) — as `portfolio.mgr@nts.local` the exact same page's fund
picker was empty. This is not "no funds exist," it's "PORTFOLIO_MGR cannot list funds at all," which also
explains why the Capital Calls page's "New Capital Call" fund dropdown was empty for that persona. The
whole Funds workspace (list, detail, statistics, documents, industry/status/balance filters) is
unreachable to the intended role, not just creation.

---

## FINDING-PV11-002

**Page / flow:** Capital Calls → New Capital Call (Wave 1 — this is the September gap-analysis's T1.1,
which its own methodology marked "✅ Done" purely from confirming the action id fires; it never checked
whether the amount produced matches the amount requested)
**Steps to reproduce:** As any persona able to reach it (tested as `admin@nts.com`, since PORTFOLIO_MGR
is blocked by FINDING-PV11-001), Capital Calls → New Capital Call → Fund "Matanho Growth Fund I" → Total
amount (USD) `5000000` → complete the wizard → Review step confirms "Amount: $5M" → Create capital call.
**Expected:** A capital call totalling $5,000,000 is raised (or, at minimum, the Review step and the
resulting notice agree on the actual figure).
**Actual:** The call is created successfully (real journal entry, real per-LP allocations, real toast),
but its actual total is **$4.55M** ("$4.6M" as displayed), not $5M — a live look at the created record
confirms 3 LP allocations at exactly 10% of each LP's own commitment (Harare Pension Fund Trustees
$25M→$2.5M, NSSA Equity Sleeve $12.5M→$1.25M, Zambezi Institutional Investors $8M→$800K), stored as
`callPercent: "10"`. Root-caused precisely in `matanho-portfolio-runtime.js`'s `submitCapitalCall()`
(~line 3195): the "Total amount (USD)" field is never sent to the backend as a dollar figure at all —
it's converted client-side into a percentage via `Math.round((amount / commitment) * 100) / 10` using
the **fund's own aggregate commitment/totalAmount** as the denominator (here, $5M / $50M = 10%), and
that flat 10% is then applied to **each individual eligible LP's own commitment** on the backend
(`CapitalCallService.initiate`, which is correctly and intentionally a percent-of-commitment API, not a
target-dollar-total API — this part is by design). The conversion only reproduces the entered dollar
figure exactly if the sum of every *eligible* LP's commitment happens to equal the fund's own aggregate
commitment field — in this fund it doesn't (3 eligible LPs sum to $45.5M against a larger fund target),
so the real total silently comes out ~9% short of what the Review screen confirmed, with no reconciliation,
warning, or follow-up figure shown anywhere.
**Severity:** MEDIUM — no data corruption and the backend behaves exactly as its own (legitimate)
percent-of-commitment design intends, but a Portfolio Manager who explicitly types and confirms "$5M" has
no way to know the real capital raised was $4.55M unless they independently re-add the per-LP amounts.
For a financial instrument this is a real, if quiet, correctness gap.
**Suspected area:** `components/portfolio-v11-mock/matanho-portfolio-runtime.js`'s `submitCapitalCall()` —
either surface the computed percent (and the resulting real total) on the Review step before submission
instead of echoing the raw typed dollar figure as if it were final, or recompute and show the actual
resulting total immediately after creation rather than only the originally-typed target.

## FINDING-PV11-003

**Page / flow:** LP Management → Add LP → Fund selector
**Steps to reproduce:** As `portfolio.mgr@nts.local` (after PV11-001 is fixed, so `GET /funds` genuinely
works for this role), navigate directly to `/portfolio/lps` → Add LP → open the Fund dropdown.
**Expected:** Lists the 7 real funds, same as the Capital Calls page's fund selector.
**Actual:** "No funds available", every time, even on a hard reload with a fresh login. Root-caused in
`lib/portfolio-v11/bootstrap.ts`'s `scopesForPage()`: the `'lps'`/`'lp-detail'` case returns
`{ primary: ['lps'], secondary: [] }` — it never requests the `funds` scope at all, unlike
`'cash-accounts'`/`'cash-overview'` (`{ primary: ['cashAccounts'], secondary: ['funds'] }`), which
correctly does. Landing on LP Management directly (rather than arriving from a page that happened to
already load funds) leaves `funds` permanently empty for the whole page, including this modal. This
also silently disables the LP-commitment enrichment step at bootstrap.ts:522 (`if (needsEnrich &&
funds.length)`), which is gated on funds being loaded — a second, related symptom of the same missing
scope.
**Severity:** MEDIUM — blocks LP onboarding through its only entry point on this page.
**Suspected area:** `lib/portfolio-v11/bootstrap.ts`'s `scopesForPage()`, `'lps'`/`'lp-detail'` case.
**Fix applied (same pass):** added `'funds'` as a secondary scope, matching the `cash-accounts` pattern.
Not yet re-verified live post-deploy — pending.

## FINDING-PV11-004

**Page / flow:** LP Management → Add LP wizard (all three steps: Details, Ownership, Review)
**Steps to reproduce:** As `portfolio.mgr@nts.local`, `/portfolio/lps` → Add LP → Details: enter LP name +
email only, leave the Fund dropdown on "Select fund (optional)" → Next → Ownership: leave Commitment
blank → Next → Review → Start onboarding.
**Expected:** A bare LP/client record is created with no fund and no commitment (exactly what the Review
screen confirms: "Fund: -", "Commitment: -").
**Actual:** Every single submission through this wizard fails — with or without a commitment amount typed
in — with a red "Request failed — Amount and effective date are required when creating investment
commitment" toast. No LP record is created (confirmed via a direct authenticated `GET /clients` before and
after: count unchanged). The toast is real and correctly wired, but fades in well under 2 seconds, which
made this look like a silent no-op during quick manual testing — it is not; a MutationObserver on the toast
stack plus a full `window.fetch` trace proved the POST fires, gets HTTP 500, and the failure toast does
render, it is just very easy to miss.
**Root cause, traced end-to-end:**
1. `matanho-portfolio-runtime.js`'s `submitLP()` (~line 3376) builds the live-action dataset as
   `fundId: String(data.fundId || funds[0]?.id || '')`. When the user deliberately leaves "Select fund
   (optional)" blank, `data.fundId` is `''` (falsy), so this silently substitutes **the first fund in the
   whole funds list** — in this dev environment a leftover test fixture, "Wizard Smoke Fund
   1788642979953" — as if the user had explicitly chosen it. The Review step's own summary card reads
   `d.fundId` directly (not through this fallback) and correctly shows "Fund: -", so the screen the user
   confirms and the payload actually sent disagree. Confirmed live: the real `POST /clients` body carried
   `"fund_id":"cmtovuw00004gunmke3r8rp55"` (that fixture fund's id) even though nothing was ever selected.
2. Backend `nvccz/src/services/ClientService.ts:97-100` (`createClient`): `if (request.fundId) { if
   (!request.amount || !request.effectiveDate) { throw new Error("Amount and effective date are required
   when creating investment commitment") } ... }` — any truthy `fundId` unconditionally requires both
   `amount` and `effectiveDate`, regardless of caller intent. Because of bug #1, `fundId` is **always**
   truthy from this wizard (as long as at least one fund exists in the system), so this validation always
   fires for every "Add LP" submission, with or without a commitment.
3. Compounding gap: even if a user *does* want to attach a commitment, the wizard's Ownership step
   (`renderLPWizard()`, step 1) has only Commitment (USD), KYC status, and Onboarding notes — **no
   effective-date field at all** — and `lib/portfolio-v11/actions.ts`'s `submit-add-lp` handler doesn't
   forward an `effectiveDate` even if one existed. So today there is no combination of inputs in this
   wizard that can ever satisfy the backend's requirement — LP-with-commitment creation is unreachable
   from the UI, not just LP-without-commitment.
**Severity:** HIGH — LP onboarding, called out in the sweep plan as a priority (LP Portal's re-test
depends on it), fails 100% of the time through its only UI entry point, for every combination of inputs.
**Suspected area / fix shape:**
- Root fix (unblocks the common "no fund yet" case immediately): `matanho-portfolio-runtime.js`'s
  `submitLP()` — drop the `|| funds[0]?.id` fallback so a deliberately-blank fund selection is sent as
  blank, matching what the Review screen already promises. One-line change, mirrored into
  `scripts/patch-portfolio-runtime.mjs` so it survives a future re-extraction.
- Separate, smaller fix (unblocks the "add LP with a fund + commitment in one step" case): add an
  "Effective date" input to the Ownership step and forward `effectiveDate` through
  `lib/portfolio-v11/actions.ts`'s `submit-add-lp` handler into `clientsApi.create()`.
- Not proposing a backend change: `ClientService.ts`'s requirement that a commitment need an amount and
  effective date is reasonable on its own; the bug is the frontend forcing that code path to run when the
  user never asked for a commitment.
**Secondary defects found in the same pass (same page, worth fixing alongside):**
- Review step field-mapping bug: the "Geography" row renders the LP name and email concatenated with no
  separator (e.g. "Toast Visual Check LPtoast-visual-check@example.com") instead of the actual (blank)
  geography value — a row-building bug in the Review step's summary-card renderer, independent of the
  fund-default issue above.
- After any live "Add LP" submission (success or failure), the modal never closes or re-renders itself:
  `submitLP()`'s `if (state.liveData)` branch sets `state.modalWizard = null` and returns without calling
  `render()`/`closeOverlays()`, relying entirely on the React host's post-`await` callback to tear the
  modal down — which only happens today on a *successful* result. On failure the modal is left open with
  stale internal state (already-nulled `modalWizard` while the DOM still shows the old wizard), and
  reopening "Add LP" while that stale DOM is still present does not reliably start a fresh step-0 wizard.
  Worth a small robustness fix (always close/reset on either outcome) rather than depending on the host.

## FINDING-PV11-005

**Page / flow:** Fund detail / Fund Performance / LP Management — capital distribution creation (Wave 1's
third item: "distribution creation")
**Steps to reproduce:** As `portfolio.mgr@nts.local` and as `admin@nts.com`, searched every Portfolio V11
page and every runtime action id for any way to declare/create a capital distribution to LPs.
**Expected:** Some screen (Fund detail, LP Management, or a dedicated Distributions page) has a "New
distribution" / "Declare distribution" action, mirroring Capital Calls' "New Capital Call" wizard.
**Actual:** No such UI exists anywhere in Portfolio V11. "Distribution"/"Distributions" appears only as a
read-only line item inside charts (Activity Mix donut, Net Cash Flow bars, NAV bridge, analytics), never as
an actionable button, tab, or wizard. Confirmed by exhaustive search of
`components/portfolio-v11-mock/matanho-portfolio-runtime.js` (no `declare`/`payout`/distribution-wizard
strings outside chart labels) and of every `if (action === ...)` branch in `lib/portfolio-v11/actions.ts`
(none call any distribution API). This is not a broken flow — Wave 1's "distribution creation" checkpoint
found there is currently nothing to click.
**Root cause:** the backend capability is fully built —
`nvccz/src/routes/lpFeesAndDistributionsRoutes.ts` exposes `GET/POST /:fundId/distributions`,
`.../notices`, `.../payout` etc., and the frontend even has a matching typed API client,
`lib/api/lp-fees-distributions-api.ts`'s `lpFeesApi` (`declareDistribution`, `sendNotices`,
`recordPayout`, `listDistributions`...) — but a repo-wide search confirms `lpFeesApi` is imported and
called from **nowhere**: no page, component, or action handler in this frontend ever uses it. It is dead,
unreferenced code sitting next to a live, working backend. This is the same shape as the LP Portal's
already-known accounting-treatment gaps this sweep's plan calls out for Phase 10 ("every distribution
debits 4100 Dividend Income regardless of source", "RETURN_OF_CAPITAL/INCOME rejected by backend
ALLOWED_SOURCES") — those checks concern distributions that already exist in the system (presumably
seeded directly), not ones created through this UI, because staff currently have no way to create one at
all.
**Bonus finding, same file:** every route in `lpFeesAndDistributionsRoutes.ts` (fee policy, management
fees, distributions, notices, payouts) is gated with `authenticate` only — no `authorize([...])` role
check at all, unlike Funds/Clients' legacy over-restriction (FINDING-PV11-001). Today this is low-risk
since nothing in the UI links here, but it means **any authenticated user of any role** could call these
financial write endpoints directly (e.g. `POST /:fundId/distributions`) if they knew the URL. Worth closing
whenever this area is built out, not urgent while it stays unreachable from the UI.
**Severity:** HIGH (capability gap, not a defect) — a core PE-fund operation (returning capital to LPs) has
no staff-facing path to execute it at all, and the LP Portal's own distribution display/validation logic
already assumes this exists upstream.
**Suspected area / fix shape:** this is a net-new UI build (a "New distribution" wizard, likely on the Fund
detail page or a promoted LP Management action, following the Capital Calls wizard's shape), wired through
a new `submit-create-distribution`/`api-create-distribution` action in `lib/portfolio-v11/actions.ts`
calling the already-existing `lpFeesApi.declareDistribution()` — materially larger than the other findings
in this report, which are all fixes to existing flows. Flagging for a scoping decision rather than building
unilaterally.

**Decision (15 September 2026):** build it in this same sweep, in Phase 4 alongside the other fixes —
Portfolio → LP Portal capital flows should work end to end before LP Portal's re-sweep depends on them.

## FINDING-PV11-006

**Page / flow:** Deal Flow list vs. Deal Detail page (Wave 2 — deal-lifecycle testing; found while picking
a clean fixture to test `start-due-diligence`/`complete-due-diligence` on)
**Steps to reproduce:** Open Deal Flow (`/portfolio/deals`) as `admin@nts.com`, note "Mukuru Logistics" and
"GreenOrbit Energy" both list as stage **Due Diligence**. Open either deal's detail page.
**Expected:** The detail page's hero status agrees with the list's stage (or with the deal's own
`currentStage`, `ACTIVE_DD`).
**Actual:** The detail page's hero badge reads **"Disbursed"** for both, with every lifecycle step tracker
underneath (Due Diligence, Term Sheet, Board & IC) still showing "Not started" / "Pending" — internally
self-contradictory as well as disagreeing with the list.
**Root cause:** confirmed live via direct API reads — both applications carry `currentStage: "ACTIVE_DD"`
**and** a real, fully-populated `disbursements` record (Mukuru: $3.1M, "PV11 full demo disbursement", ref
`PV11-DISB-REG-MUKURU-2026-0004`, disbursed 15 Mar 2026; GreenOrbit: $1.8M) with no due-diligence, term
sheet, or board-review records at all — evidently demo/seed fixtures built to give Portfolio Companies /
Fund Performance something realistic to show, created by inserting a disbursement directly rather than
walking the deal through its real lifecycle. The frontend bug this exposes: `matanho-portfolio-runtime.js`
(~line 1793) computes the deal-detail hero status independently —
`disbursedAny ? 'Disbursed' : hasImpl ? 'Approved - Closing' : hasBoard ? ... : hasDD ? ... : 'Screening
Pending'`, purely from which sub-records exist — while the Deal Flow **list** derives its stage badge from
`currentStage` via `adapters.ts`'s `STAGE_MAP`. These two are never reconciled, so any application whose
`currentStage` and sub-records disagree (seed data today; potentially a real deal too, if any lifecycle
action ever advances one without the other — not yet confirmed either way) renders two contradictory
stories about the same deal on two screens one click apart, and the detail page's own step tracker
contradicts its own hero badge in the same view.
**Severity:** MEDIUM — confined to a handful of demo fixtures today (no clean Due Diligence-stage deal
currently exists to rule out this also happening to a real deal), but a materially confusing display bug
on a page a PM relies on to judge deal progress.
**Suspected area / fix shape:** derive the deal-detail hero status primarily from `currentStage` (reusing
`STAGE_MAP` or an equivalent detail-specific mapping) and use sub-record presence only to refine within a
stage (e.g. "Term Sheet — draft" vs "Term Sheet — sent"), not to override it outright; alternatively, once
Wave 2's lifecycle-action tests below confirm whether a normal action path can produce this same
divergence, the fix may need to also ensure the action that creates a disbursement/implementation record
also advances `currentStage` in the same transaction.
**Testing impact:** none of the three current Due Diligence-stage deals (Mukuru Logistics, GreenOrbit
Energy, NTS) is a "clean" mid-lifecycle fixture — the first two are contaminated as above; NTS has a real,
uncontaminated `dueDiligenceReview` (status `IN_PROGRESS`, no term sheet/board record yet) despite also
carrying a stray $1.25M disbursement, so it is the one used below to test `complete-due-diligence` live.
`start-due-diligence` has no pre-DD fixture available at all (the only two other deals are already at
Investment Committee); tested by advancing a fresh deal instead (see below).

## FINDING-PV11-007

**Page / flow:** Deal Detail → Term Sheet tab → Create term sheet; also Investment Implementation
`/initiate` (Wave 2 — deal-lifecycle actions)
**Steps to reproduce:** As `portfolio.mgr@nts.local`, open a deal at stage `TERM_SHEET` (e.g. "NTS", after
legitimately completing its due diligence live — see below) → Term Sheet tab → Create term sheet → fill
the form (amount, equity %, valuation, a PDF) → Create term sheet.
**Expected:** Succeeds — this role has "full" access to the whole Portfolio module, same grant class as
FINDING-PV11-001.
**Actual:** `POST /api/term-sheets/:applicationId` → 403 `{"success":false,"message":"Forbidden:
insufficient permissions"}`, surfaced correctly as a "Request failed" toast (not silent — the toast/error
pipeline itself is fine here). Same root cause as FINDING-PV11-001, confirmed by reading the route
directly: `nvccz/src/routes/termSheetRoutes.ts` gates `POST/PUT /:applicationId`, `POST
/:applicationId/finalize`, and `GET /` with the legacy `authorize(['admin', 'fund_manager'])` — the same
hardcoded, never-updated role-name list, in a **third** file beyond the two already fixed
(`fundRoutes.ts`, `clientRoutes.ts`). `nvccz/src/routes/investmentImplementationRoutes.ts`'s `POST
/initiate` (the `start-implementation` action) carries the identical gate — confirmed by reading the route,
not yet live-reproduced since no deal has reached board-approved in this pass. By contrast,
`applicationRoutes.ts` (due diligence) and `boardReviewRoutes.ts` (board review/voting) use `authenticate`
only, no role gate, so `complete-due-diligence`/board-review actions are unaffected — this is specific to
term sheets and implementation-initiation.
**Severity:** HIGH — same class and impact as FINDING-PV11-001: blocks the intended day-to-day role from
two more core deal-lifecycle steps, not an edge case. Also blocks live-testing the rest of Wave 2
(board review, implementation) as this persona — continuing that testing as `admin@nts.com` instead.
**Suspected area / fix shape:** identical to FINDING-PV11-001's already-applied, already-verified fix —
add `portfolio_mgr` (and `inv_analyst` where the action is read-oriented) to the affected `authorize([...])`
lists. Ran the repo-wide check this finding called for across every Portfolio-relevant route file
(`dealSourcingRoutes`, `portfolioValuationRoutes`, `investmentImplementationRoutes`,
`investmentMonitoringRoutes`, `portfolioCompanyRoutes`, `termSheetRoutes`, `applicationRoutes`,
`fundraisingRoutes`, `boardReviewRoutes`, plus the two already-fixed files) so Phase 4 can fix this bug
class once, not file by file. Confirmed still missing `portfolio_mgr`/`inv_analyst`:
- `termSheetRoutes.ts` — `POST/PUT /:applicationId`, `POST /:applicationId/finalize`, `GET /` (all
  `authorize(['admin','fund_manager'])`).
- `investmentImplementationRoutes.ts` — `POST /initiate`, `PUT /:portfolioCompanyId/checklist`, `POST
  /:portfolioCompanyId/milestones`, `POST /milestones/:milestoneId/complete`, and one of
  `/disbursements/:disbursementId/approve`|`/disburse` (all `authorize(['admin','fund_manager'])`); by
  contrast `POST /disbursements` and `/disbursements/:disbursementId/decision` have **no** role gate at
  all (`authenticate` only) — too permissive, mirrors FINDING-PV11-005's bonus finding, lower priority
  while this whole area is being touched anyway.
- `portfolioCompanyRoutes.ts` — `GET /with-investments` (`authorize(['admin','fund_manager'])`); its other
  `authorize` entries (`applicant`, `admin`) are Investee-Portal-facing, out of scope here.
Confirmed correctly out of this bug's scope (not part of Portfolio V11's own UI, no fix needed here):
`dealSourcingRoutes.ts`, `portfolioValuationRoutes.ts`, `investmentMonitoringRoutes.ts` — gated by
`ceo`/`cfo`/`fund_manager`, backing CEO/CFO dashboards this module's sidebar doesn't expose.
`applicationRoutes.ts`, `boardReviewRoutes.ts`, `fundraisingRoutes.ts`'s relevant routes already use
`authenticate` only (no gate to fix).

## FINDING-PV11-008

**Page / flow:** Deal Detail → Term Sheet tab → Start board review (Wave 2 — deal-lifecycle actions)
**Steps to reproduce:** As `admin@nts.com` (portfolio_mgr is blocked earlier in this exact flow by
FINDING-PV11-007, so this was tested as admin to isolate the mechanics), on a deal with a drafted term
sheet (`NTS`, walked live through Due Diligence → Term Sheet in this same session) → Start board review →
attach a PDF investment memorandum → Start review.
**Expected:** A board review record is created and the deal enters board review.
**Actual:** The deal's `currentStage` silently advances to `UNDER_BOARD_REVIEW` (confirmed via
`GET /applications/:id`), but the board review record itself is **never created** —
`GET /board-reviews/:id` returns 404 "Board review not found" both before and after. The deal is left in a
stuck, contradictory state: staged as "under board review" with nothing to review, no visible board-review
UI reachable from that stage (the only path found to retry was clicking "Start board review" again, which
re-runs the same broken flow).
**Root cause, traced to source:** `lib/portfolio-v11/actions.ts`'s `submit-start-board-review` handler
(~line 620) does two sequential calls by design (its own comment explains why: "BE only accepts
board-review create from UNDER_BOARD_REVIEW, not TERM_SHEET"): first `applicationsApi.changeStage(id,
{newStage: 'UNDER_BOARD_REVIEW'})` (succeeds, 200), then `boardReviewApi.create(id, document)` — this
second call is what actually fails, and there's no rollback of the stage change when it does.
`boardReviewApi.create()` (`lib/api/board-review-api.ts:102-111`) fails because it manually sets
`headers: {'Content-Type': 'multipart/form-data'}` on a `FormData` body passed through the generic
`apiClient.post()` — a `fetch` call is supposed to auto-generate `Content-Type: multipart/form-data;
boundary=...` itself when the body is a `FormData` instance, but only if the caller doesn't set
Content-Type manually; doing so here produces a boundary-less header, and the backend's multipart parser
correctly rejects it: `POST /board-reviews/:id` → 400 `{"success":false,"message":"Multipart: Boundary not
found"}`. Confirmed by contrast: `lib/api/term-sheet-api.ts`'s `create()` (tested working earlier in this
same session) builds an equivalent `FormData` with a file but calls `apiClient.postFormData(...)` — a
dedicated helper on `apiClient` that exists precisely to avoid this mistake — instead of `apiClient.post()`
with a hand-rolled header.
**Severity:** HIGH — the only UI path to start a board review is broken 100% of the time (any file
attached triggers the same boundary error), and worse, it's not a clean failure: every attempt leaves the
deal's stage permanently advanced with no way to undo it from the UI, compounding on retry.
**Suspected area / fix shape:** `lib/api/board-review-api.ts`'s `create()` — switch to
`apiClient.postFormData(`/board-reviews/${applicationId}`, formData)`, matching `term-sheet-api.ts`'s
working pattern exactly. Separately, `actions.ts`'s handler should not treat the stage change as
fire-and-forget ahead of the record creation that can fail — worth wrapping so a failed `create()` either
retries against the now-`UNDER_BOARD_REVIEW` stage cleanly (likely already possible once the Content-Type
fix lands, since the stage change is idempotent) or reports the partial state clearly instead of a generic
"Request failed" bubble that doesn't explain the deal is now stuck mid-transition.
**Related, out of this module's scope:** the identical `'Content-Type': 'multipart/form-data'` mistake
also exists in `lib/api/procurement-api.ts`'s `processInvoicePayment` (Procurement V23, already swept and
merged) — flagged separately as its own task rather than fixed here, since Procurement is a different,
already-closed sweep.
**Positive confirmation, same pass:** `start-implementation` (the last of Wave 2's five named actions)
correctly validates its precondition — tried live on "E2E Live Deal 1788589897" (board review in progress,
term sheet still Draft) and got a clear, persistent (not fast-fading) error banner: "Failed to initiate
investment implementation: Application must have a signed term sheet to initiate investment
implementation." Not a bug — this is the backend correctly refusing an out-of-order request, and the error
UI for this specific action is notably more durable/readable than the toast pattern used elsewhere.
**Coverage gap, documented rather than skipped:** `start-due-diligence` (structurally identical to the
already-verified-working `complete-due-diligence` — same `dueDiligenceApi` module, same simple
single-call handler shape in `actions.ts:551-558`) was not live-exercised this pass: all 5 existing deals
are already past the pre-DD stage (2 at Board Review, 3 at Due Diligence), so there is no current fixture
to start DD *from*. Confirmed wired correctly by reading the code; live verification needs either a fresh
deal walked through screening/shortlisting first, or a new fixture seeded directly at `SHORTLISTED`.

## FINDING-PV11-009

**Page / flow:** Settings & Access Control's role-switcher (`v11IsFullAuthority`) — Wave 3 item from the
plan: "whether `v11IsFullAuthority()`'s hardcoded `['ceo','admin','cio']` improperly blocks the new real
roleCodes."
**Steps to reproduce:** Log in as `portfolio.mgr@nts.local` (a real PORTFOLIO_MGR) and inspect
`window.MatanhoPortfolioUI.getSnapshot().state.currentRole`.
**Expected (per the plan's framing):** a real user's actual role should determine `currentRole`, and the
concern was that `portfolio_mgr`/`inv_analyst` might not be in the `['ceo','admin','cio']` full-authority
list and so get wrongly restricted.
**Actual — the opposite problem:** `currentRole` reads `"ceo"` (full mock-authority) for this real
PORTFOLIO_MGR, live-confirmed. Traced why: `currentRole` is **entirely disconnected from the real logged-in
user**. `matanho-portfolio-runtime.js:4831-4832` seeds it from `localStorage` only, defaulting to `'ceo'`;
it is only ever changed by `incoming.activeRole` (line 4888) or the internal "Roles & Access" demo
role-switcher dropdown (line 5178) — a repo-wide search confirms `activeRole` is never set anywhere in the
TypeScript host (`portfolio-v11-app.tsx` or any `lib/portfolio-v11/*`), so that code path is dead. This
whole 7-persona system (`ceo`/`admin`/`cio`/`analyst`/`monitoring`/`legal`/`accounting`,
`v11IsFullAuthority` gating on the first three) is a **self-contained client-side demo/preview toggle with
no binding to the real backend role at all** — confirmed by `lib/portfolio-v11/live-loaders.ts:183-211`'s
own header comment, which independently documents this as intentional ("not a 1:1 mirror of real backend
Role rows... do not inject new role entries here"). So: no real user is ever blocked by this hardcoded
list — everyone defaults to full mock-authority — but the toggle is fully real user-facing (switching it
changes visible nav items and disables write buttons in the UI) with no indication anywhere that it's a
detached preview rather than the user's actual access level.
**Severity:** MEDIUM — not a blocker (the plan's specific fear doesn't materialize; actual write access is
correctly enforced server-side, independent of this), but a real, confusing design smell: a
`portfolio.mgr@nts.local` user who opens Settings and experiments with "view as Legal" or "view as
Monitoring & Evaluation" will see write controls vanish/disable across the module with no explanation that
this is a demo preview rather than a real permission change, and switching back to any of the three
full-authority personas (not necessarily their own real role) fully restores every control — a false sense
of both restriction and permission, in either direction.
**Suspected area / fix shape:** either wire `currentRole` to the real user's role via `matchPersonaId()`
on load (matching intent, but the `live-loaders.ts` comment explicitly warns against widening this
mapping's blast radius) or, more conservatively, make the role-switcher's demo nature explicit in its own
UI (e.g. an "internal preview — does not change your real access" label) so it can't be mistaken for a
real permission control. Given the explicit warning already in the code against extending this system,
flagging for a product decision rather than picking a fix unilaterally.

## Format per finding
```
ID:
Page / flow:
Steps to reproduce:
Expected:
Actual:
Severity:
Suspected area:
```
