# Accounting module — final live sweep findings (2026-09-08)

Method: every `/accounting/*` page loaded cold in a real browser (localStorage cleared each
time, so nothing rendered from a sibling page's cache), checking what each page actually
fetches, what it renders, and what appears in the console and network panels. Verified as
`accounting-audit@nts.local` (role `admin`, roleCode `CFO`).

This document supersedes the first-pass sweep from earlier today. The user then asked directly
whether the module was "responsible, no bugs... nothing that is hardcoded" — the honest answer
was no, four items were still open, and this second pass closes them.

---

## Fixed and verified

### 1. Every page fetched each endpoint 6 times
`ensurePageData` in `components/accounting-v52-mock/accounting-v52-app.tsx` only added a scope
to `loadedScopesRef` **after** its `await` resolved. Three call sites reach it on one cold load
and all passed the "not loaded" filter before the first fetch returned.

- Before: **43 requests** on Command Centre, 6 per endpoint. After: **8**, exactly 1 each.

Fix: in-flight scopes tracked in `pendingScopesRef` and skipped; callers with nothing new await
the running request. Invalidation after a write clears the pending entry too, and cleanup only
evicts its own entry so a mid-fetch invalidation can't delete a newer registration.

### 2. CEO View was entirely fabricated
No scope entry existed, so it rendered its `ceoEntities` demo fixture end to end — $6.84m
liquidity (real $3.50m), $189,500 receivables (real $7,800), $94,596 payables (real $4,250), 4
entities (real 1), invented risks, a 4-point liquidity forecast, and a fabricated operating-health
panel (82/94/97/89%).

Fix: new `ceo` scope assembling the summary in `live-loaders.ts` from the same sources the
operational pages use (cash from posted journal lines, entities from the consolidation summary).
`ceoPage()` prefers this via `window.__ac52CeoSummary`. Panels with no backing data say so instead
of showing numbers. Fabricated deltas (`+6.4%`, `38 DSO`, etc.) drop on real data.

**This pass additionally fixed the five CEO drill-down pages** (`sectionPage()` — Liquidity,
Performance, Working Capital, Risk, Approvals), which were still 100% hardcoded after the first
pass (immediately-available cash $3.12m, coverage ratio 2.80x, EBITDA margin 28.9%, 4/7 risk
counts, etc. — all fixed strings). Now: cash/AR/AP/revenue/profit/margin are computed from the
same real sources as the landing page; everything with no backing model (30/60/90-day maturity
forecasts, coverage ratios, budget variance, the entire Risk drill-down — no risk register exists
anywhere in the backend) shows `—` with an honest reason instead of a number.

Verified live: every figure on the landing page and the Liquidity drill-down ties to Command
Centre; no fabricated string remains on any of the five drill-downs.

### 3. Immutable Audit Trail was fabricated
No scope, invented events dated 31 Jul 2026 attributed to people who don't exist, invented
internal IPs. A real `AuditLog` + `/api/audit-logs` endpoint existed and was never consumed.

Fix: `lib/api/audit-log-api.ts`, `adaptAc52AuditEvents`, `audit` scope, hydrate hook replacing the
`auditLog` fixture. Verified live: 100 real events, real users, real timestamps and IPs, zero
occurrences of the old fake names/IPs on a cold load.

### 4. Settings showed mock banks and contradicted itself
No scope; banks table listed CBZ/Stanbic/FBC on GL 1101–1103 (real: Matanho Capital - USD
Operating, GL 1100). Two separately-injected stat strips disagreed with each other and with the
table (3 banks vs 8 banks vs 1 real bank).

Fix: added the scope; both strips now count from the same live state. Verified: 1 bank, 1
currency, 1 legal entity, 1 open period — all three surfaces agree.

**This pass additionally fixed, in Settings:**
- **Periods & lock tab** — was four hardcoded months (Jul/Jun/May/Apr 2026) with invented lock
  dates and completion percentages. Now shows the real fiscal calendar (12 real periods), the
  real current period, and the real outstanding close-task count and names in the "gates remain"
  callout and the lock-policy checklist. This also **caught and fixed a UTC date-shift bug**: the
  first attempt formatted `startDate` client-side, which is stored as UTC midnight, so January
  2026 (`startDate: 2025-12-31T00:00:00Z`) rendered as December — every period was labelled one
  month early. Fixed by using the backend's own `name` field ("January 2026") instead of
  reformatting the date.
- **Security & RBAC tab** — named five people who don't exist and asserted per-user approval
  limits/MFA enrolment nothing tracks. Now shows the real user register (24 real users) with
  honest `—` for untracked fields, and the real access-request empty state (no request workflow
  exists in the backend).
- **Integrations tab** — six integrations with invented "Connected"/"Review"/"Sandbox" statuses.
  The modules are real; the connection-health claim was not, so it now reads "Connection status
  not tracked" rather than asserting a live/healthy connection nothing verifies.
- **Enterprise config-domain table** — invented owners ("Financial Controller"), fabricated "last
  change" dates (08 Aug 2026 etc.) and invented health statuses for 5 governance domains. Real
  domain names kept; the asserted facts (owner, date, status) now show `—`.

### 5. Dynamic RBAC / Access Control page was entirely fabricated
Static analysis first suggested `accessPageV4` was live; empirically `pages.access` is reassigned
a third time to `accessPage12`, which is the actual renderer (confirmed live, same "last
assignment wins" trap documented earlier this session for other pages). It listed 5 named users
who don't exist, 10 invented role titles, a fabricated permission matrix, and 3 invented pending
access requests — on a page titled "Dynamic Role-Based Access Control".

Fix: new scope reading real `usersApi`/`rolesApi`, `adaptAc52AccessData` in `adapters.ts`. First
attempt returned an empty permission matrix because the real `roles.permissions` column stores
`{name, value}` objects, not plain strings, and the adapter's string-only filter silently dropped
every real permission — caught by checking the rendered matrix rather than assuming the adapter
was correct once it compiled. Fixed to accept both shapes and exclude explicit `value:false`
revocations. Also reordered the matrix's displayed role columns by how many of the shown
permission keys each role actually holds — an arbitrary alphabetical slice of 59 roles first
selected seven that held none, making every toggle read as off.

Verified live: 24 real users, 59 real roles, 36 real permission toggles lit against
ADMIN/CEO/CFO/CIO/Finance Manager, honest `—` for MFA/approval-limit/access-review (none tracked
in the backend), and an honest empty state for access requests (no workflow exists).

### 6. Sidebar badge counts were hardcoded literals
`navGroups` carried a 4th literal per item — Approval Queue **11** against 1 real pending
approval, Bank Reconciliation **11**, Period Close **3**, Journal Entries **4**, Compliance & Tax
**2**, etc. — present on every page via the persistent sidebar, so this defect was live the
entire time regardless of which page was open.

Fix: new `navCount(id)` computing each badge from live state (open approvals, submitted journals,
open bills/invoices, unmatched reconciliation lines, incomplete close tasks) with no fallback
number — a badge is simply omitted when nothing backs it, rather than showing 0 or a stale value.
Verified live: Approval Queue **1** (matches Command Centre), Journal Entries **1** (the one
Submitted journal), Bank Reconciliation **4** (matches the real unmatched-line count); badges with
no real count (Period Close, Compliance & Tax, Payables, Receivables, Expenses) correctly show no
badge rather than a number.

---

## Found, not fixed

### 7. FX rate is scraped from a bank website in the browser
`refreshOfficialRateV5()` fetches `https://www.rbz.co.zw/` directly, with a public CORS proxy as
fallback. Both fail with CORS on every page load. Degrades gracefully (last stored rate, honest
toast), so nothing is broken today, but the design — scraping a live site through an anonymous
third-party proxy for a figure used in accounting — is a backend problem, not a frontend patch.
Flagged, not changed.

### 8. `/accounting/integrations` (standalone page) fetches nothing
Distinct from the Settings > Integrations tab fixed above — the standalone page still renders
static content and was not reached by this pass. Lower priority: the Settings tab covers the same
concept and is now honest.

---

## Observation, not a defect

Cash displays as **$3,501,180.00 CR** — a net credit balance on the bank control account,
consistent across Command Centre, CEO View, and the CEO Liquidity drill-down, all independently
derived. Faithful to the ledger (two large disbursements with no funding receipts posted against
them). Worth confirming the underlying postings are complete; not a display bug.

---

## Verification discipline used throughout this pass

Twice during this pass, a probe run immediately after a hot-reload caught the dev server mid
recompile and returned 0 API calls with the old fixture data still on screen (CEO View, then
Audit Trail) — indistinguishable at first glance from a real regression. Both were re-verified
after a longer wait and confirmed to be timing artifacts, not defects: the fix held once the
recompile finished. Recorded here because it is exactly the kind of false signal the verification
protocol warns about — every "regression" in this pass was re-confirmed before being reported as
real or dismissed as noise, not asserted from a single reading.

---

## Test-environment changes made across both passes

- Reset the password of the existing test user `accounting-audit@nts.local` (local dev DB only)
  to sign in. No real account touched.
- Cleared `matanho-*` localStorage keys repeatedly to force genuine cold loads.
- Two throwaway inspection scripts were written to `nvccz/scripts/` and deleted afterwards.
- No commits made in either repo. No migrations run. Nothing pushed or deployed.

---

## 9 Sep 2026 — cross-module sweep (Performance → Accounting), sidebar and typography

Run because the Performance module writes into Accounting (timesheets), so Accounting was swept
alongside it rather than in isolation. Method as before: `scripts/accounting-page-dump.mjs`
(new, sibling of `perf-page-dump.mjs`) across all 27 accounting pages × 5 real roles = 135 dumps.

**Sweep result:** 135/135 pages HTTP 200, zero mount failures, no `NaN` / `undefined` /
`[object Object]` reaching any screen.

### Fixed

1. **Timesheets hero was fabricated and self-contradicting.** `spotlight('timesheets')` rendered
   a hardcoded "84% billable utilisation / 12 submissions / 3 reviews", an invented 12-month
   billable-conversion chart, and four invented project bars (MFI Review 91%, Growth Fund I 86%,
   Workshop ERP 74%, Pension 69%) — directly above the page's own real KPI cards, which correctly
   read "0 submitted timesheets / Billable utilisation 0%". Now derived from the same live arrays
   `timesheets48()` already uses (`window.__ac52Timesheets` / `ac52LiveProjects()`). Verified both
   ways: with no data it reads "— / no timesheet hours captured yet / 0 submissions"; after a real
   employee submitted 8 billable hours it read "100% / 1 submission" against the real project name,
   agreeing with the KPI card below it.

2. **Sidebar could never collapse.** Two stale `v23`-generation rules pinned `--sidebar` to 282px
   via selectors that matched permanently (`#app.v23-expanded` is always on; `#app:not(.collapsed)`
   always matched because the live toggle flips `v25-expanded`, not `collapsed`). At `#id` +
   `!important` they beat the newer v31 model (68px rail / 216px expanded), so both toggle states
   rendered at 282px — the button changed its chevron and label but not the width, and the menu sat
   wider than every other module (performance 242px, portfolio ~210–220px). Removed the dead
   override, scoped the v23 presentation rules to the actually-expanded state, and added rail
   styling keyed on `#app:not(.v25-expanded)` — necessary because every existing collapsed rule
   keys on `.collapsed`, which `afterRenderV5()` and `sidebar23()` strip on every render. Rail
   rules are scoped to >760px so the mobile off-canvas drawer keeps its labels. Verified at
   1920/1600/1280/1100/900px: rail 68px, expanded 216px (206px ≤1100px), zero clipped nav items.

### Cross-module flow verified end to end

Employee logs 6h against a real project → `mine` 200 → submit → SUBMITTED → appears in the
manager's team queue → employee correctly **403** on approving their own → manager approves →
APPROVED, reflected back to the employee. All test data deleted afterwards.

### Not a defect

Per-page 403s for the Performance test users on `accounting/documents`, `consolidation/summary`,
`fiscal-calendar`, `audit-logs` and `roles` are correct RBAC: those users were granted only
`accounting.timesheets.*` (see `2026-09-08-performance-role-permissions`), not the other
accounting domains.

### Still fabricated (not fixed in this pass)

`spotlight(page)` renders a hardcoded hero for **every** other accounting page too — payables 92%,
receivables 42d DSO, expenses 96%, inventory 4.8×, assets 88%, and so on. Only the timesheets hero
was corrected here because it is the Performance↔Accounting touchpoint and it contradicted real
data on the same screen. The rest is a known, listed follow-up, not an oversight.

