# Test findings — Portfolio V11

**Engagement:** Portfolio V11 end-to-end (UI to backend) full sweep, mirroring the completed Procurement
V23 engagement · branch `feature/portfolio-v11-live` (frontend; backend only if needed)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only
after it has been reproduced live. Static/code-only analysis (the September 2026 gap-analysis) is treated
as a hypothesis to verify, not a fact.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 0 | 0 | 1 |
| MEDIUM | 1 | 0 | 0 |
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
