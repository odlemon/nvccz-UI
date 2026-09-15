# Test findings — Portfolio V11

**Engagement:** Portfolio V11 end-to-end (UI to backend) full sweep, mirroring the completed Procurement
V23 engagement · branch `feature/portfolio-v11-live` (frontend; backend only if needed)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only
after it has been reproduced live. Static/code-only analysis (the September 2026 gap-analysis) is treated
as a hypothesis to verify, not a fact.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 2 | 0 | 1 |
| MEDIUM | 3 | 0 | 0 |
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
