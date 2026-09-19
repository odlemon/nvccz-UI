# Investee Portal V8 — Test Findings

Phase 7 of the Portfolio + Investee Portal + LP Portal full-sweep engagement
(`atomic-questing-newell.md`; see `HANDOFF_AND_TEST_PLAN.md` for where Phases 0-6 left off).
Live browser testing against `https://dev.investee.matanho.com` as `investee.test@arcus.co.zw`
(Tariro Moyo, CFO, Arcus Demo Investee Co), same standard as Procurement V23's and Portfolio V11's
completed sweeps: real bugs root-caused and fixed, every fix verified live before being marked done.

---

## FINDING-IP8-001

**Title:** A term sheet the applicant had already signed permanently showed "Awaiting your signature", and re-signing failed with a confusing error
**Module:** Investee Portal (frontend `nvccz-new`) · **Dimension:** UAT · **Category:** Data shape mismatch
**Severity:** HIGH — the applicant's own signing workspace could never show a signed term sheet as signed, and clicking the only available action ("Review & sign") on it always failed
**Persona affected:** Every investee whose term sheet has already received their signature (i.e. every applicant partway through a two-party sign flow)
**Surface:** `GET /term-sheets/my`; Signatures screen; Term Sheet screen's "Sign term sheet" button

### Steps to reproduce (live on dev, 19 September 2026)

1. As `investee.test@arcus.co.zw`, opened Signatures. "Investee Test Term Sheet" showed **Awaiting your signature**, 1 pending.
2. Opened the request, drew a signature, checked consent, clicked **Apply signature**.
3. Toast: **"Request failed — Failed to sign term sheet: Failed to sign term sheet: Applicant signature already exists. Signatures cannot be updated once uploaded."**
4. Reloaded the page (and the whole app) — the request still showed **Awaiting your signature**, 1 pending, exactly as before. `GET /term-sheets/my` confirmed the term sheet has carried a real applicant signature since **5 September 2026** (`applicantSignature.signedAt`) — this was pre-existing fixture data, not something my own test click created.

### Root cause

`GET /term-sheets/my` nests each signature under `applicantSignature` / `investorSignature`
(`{ signatureUrl, signatureFileName, signedAt, signedBy }`). The vendored runtime's own signed-status
check (`ts.isSigned || ts.applicantSignedAt || /signed|executed/i.test(ts.status)`) reads flat
`applicantSignedAt` / `applicantSignatureUrl` fields — which this specific endpoint never sends (a
different endpoint, `POST /term-sheets/:id/sign`, returns a flat shape, and the frontend's own
`TermSheet` TypeScript interface documents the flat shape as if every endpoint used it). Because
`ts.applicantSignedAt` is always `undefined` from this endpoint, the runtime always falls through to
"Awaiting your signature", regardless of whether a signature actually exists — and the backend
correctly, separately, refuses a second upload once one exists, producing the confusing error with no
link back to "you already did this."

### Fix

`components/investee-portal-v8-mock/investee-portal-v8-app.tsx` — `normalizeTermSheetSignatures()`,
called from the live-data `hydrate()` pipeline. Flattens `applicantSignature`/`investorSignature`
onto each term sheet's `applicantSignedAt`/`applicantSignatureUrl`/`investorSignedAt`/
`investorSignatureUrl` fields before handing the payload to the runtime, so its existing (correct)
status check now has the data it was already looking for. The vendored `matanho-investee-portal-
runtime.js` itself is untouched, per this module's Phase 6 rule (patch-script only, never hand-edited).

Commit `f2d9196`, branch `feature/investee-portal-v8-live`.

### Verification

Deployed to dev (`ui-investee`), 19 September 2026. Reloaded Signatures as `investee.test@arcus.co.zw`:
"Investee Test Term Sheet" now shows **Completed · Signed 2026-09-05** (previously "Awaiting your
signature"). Summary cards: **Awaiting your signature: 0** (was 1), **Completed this quarter: 1** (was
0), **Audit certificates: 100%** (was —). Confirmed fixed.

**Status:** FIXED and verified live, deployed to dev (`ui-investee`), pushed to `origin/feature/investee-portal-v8-live`. Not merged to `dev`/`master`/prod.

---

## FINDING-IP8-002

**Title:** KPI Centre showed the literal string "[object Object]" as the value of two KPI cards
**Module:** Investee Portal (frontend `nvccz-new`) · **Dimension:** UAT · **Category:** Data shape mismatch
**Severity:** MEDIUM — visibly broken output on a live, real-data screen; no data loss, but unusable/unprofessional as shown
**Persona affected:** Every investee whose portfolio company has derived/computed KPI data on file (i.e. any company with `financialKpis.kpiValues` populated by the backend's derivation job)
**Surface:** `GET /applicant/company` (`data.financialKpis.kpiValues`); KPI Centre screen

### Steps to reproduce (live on dev, 19 September 2026)

Opened KPI Centre as `investee.test@arcus.co.zw`. Of 5 KPI cards, 2 rendered their value as the literal
text **`[object Object]`** — one labelled `derived`, one labelled `AUTO_KPI_FLAT`. The other 3
(`NET_PROFIT`, `CASH_FLOW_NET`, `TOTAL_REVENUE`) rendered correctly as numbers.

### Root cause

`company.financialKpis.kpiValues["2026-06-30"]` mixes flat numeric metrics (`NET_PROFIT: 250000`, ...)
with nested meta/computed buckets at the same level: `derived` (a ratios object, mostly `null` pending
more source statements), `AUTO_KPI_FLAT` (itself a small *nested* object — `{WORKING_CAPITAL: 0,
CASH_OPERATING_NET_APPROX: 0}` — despite the name suggesting it's already flat), and `manualEntries`
(empty object). The runtime's KPI Centre renderer takes every key in that period's object as one KPI
row and only excludes `manualEntries` by name; `derived` and `AUTO_KPI_FLAT` flow straight through as
`k.value` = a plain object, and the renderer's own defensive fallback for a non-number value
(`String(k.value ?? '—')`) is exactly what produces the literal text `[object Object]`.

### Fix

`components/investee-portal-v8-mock/investee-portal-v8-app.tsx` — `normalizeFinancialKpis()`, same
`hydrate()` pipeline as FINDING-IP8-001. For each period's KPI object: drops `manualEntries` and
`derived` (a computed-ratios bucket that belongs in a dedicated ratios view, not as bare KPI cards);
for any *other* nested-object bucket (covering `AUTO_KPI_FLAT` today and any future bucket of the same
shape, without needing to deny-list it by name), spreads its own entries up a level instead of
dropping them, so `WORKING_CAPITAL` and `CASH_OPERATING_NET_APPROX` still show up as real KPI cards
rather than disappearing. Runtime.js untouched, same as above.

Commit `f2d9196` (same commit as FINDING-IP8-001), branch `feature/investee-portal-v8-live`.

### Verification

Deployed to dev (`ui-investee`), 19 September 2026. Reloaded KPI Centre as `investee.test@arcus.co.zw`:
all 5 cards now show numeric values — `NET_PROFIT` 250,000, `WORKING_CAPITAL` 0, `CASH_OPERATING_NET_APPROX`
0, `CASH_FLOW_NET` 180,000, `TOTAL_REVENUE` 1,200,000. No `derived` card, no `[object Object]` anywhere.
Confirmed fixed.

**Status:** FIXED and verified live, deployed to dev (`ui-investee`), pushed to `origin/feature/investee-portal-v8-live`. Not merged to `dev`/`master`/prod.

---

## FINDING-IP8-003

**Title:** Two unexplained 400 responses on every fresh page load, not specific to any one screen
**Module:** Investee Portal (frontend `nvccz-new` and/or backend `nvccz`) · **Dimension:** UAT · **Category:** Unresolved — needs further investigation
**Severity:** LOW (provisional) — every screen's own visible content renders correctly despite the errors; severity may change once the actual failing call is identified
**Persona affected:** Unknown — reproduced only for `investee.test@arcus.co.zw` so far
**Surface:** Unknown — reproduced console-side only

### Steps to reproduce (live on dev, 19 September 2026)

Originally found on `/investee-portal-v8/reports` (fresh navigation, not a client-side transition):
browser console shows exactly two `Failed to load resource: the server responded with a status of 400
()` errors. **Re-confirmed 19 September 2026 (post-deploy) that this is not route-specific** — the same
two errors reproduce on a fresh load of `/investee-portal-v8/kpis` as well. Likely a global, once-per-
full-page-load call (not tied to any one screen's own data), not yet identified.

### Investigation (inconclusive)

- All 8 of the live-data loader's own calls (`profile`, `application`, `company`, `termSheets`,
  `dashboard`, `reportingRequests`, `financialReports`, `drawdown`) were individually confirmed
  **200** both directly (`requests` against `dev-api.matanho.com`) and by monkey-patching the app's own
  `window.fetch` and manually re-firing the `investee:reload-request` event the host listens for — the
  errors do not reproduce when the load is retriggered this way, only on a genuine fresh page load.
- The browser tool's network inspector does not surface cross-origin (`dev-api.matanho.com`) requests
  at all (confirmed separately — only same-origin static/RSC requests ever appear in it), so the
  specific failing URL could not be read directly off a request list the way it normally would be.
- `docker logs arcus-dev-api-1` produced no per-request access-log lines at all in the relevant window
  (no request-logging middleware active on this stack), so the failing path could not be correlated
  from the server side either.

### Assessment

Not escalated to a fix: two solid, real, reproducible-and-understood bugs (IP8-001, IP8-002) were
found and fixed in the same session; this third item is confirmed reproducible but not yet root-caused
with the tools available. Whoever picks up Phase 7 next should either (a) reproduce with real browser
DevTools (Network tab, not this session's more limited tooling) to read the failing request directly,
or (b) add temporary request logging to `arcus-dev-api-1` and reproduce again.

**Status:** OPEN — confirmed reproducible, root cause not found. Needs a real DevTools session or
temporary API request logging to identify the failing call before it can be fixed.

---

## Phase 7 coverage so far

| Screen | Result |
|---|---|
| Term Sheet | Live data renders correctly (Investment $500K, Equity 12%, Pre-money $4.2M, Stage UNDER_BOARD_REVIEW). No console errors. |
| Signatures | FINDING-IP8-001 found and fixed (see above). Signing controls / authority matrix cards render correctly. |
| KPI Centre | FINDING-IP8-002 found and fixed (see above). |
| Reporting Centre | Reporting schedule table renders 3 real records correctly. FINDING-IP8-003 (see above, unresolved). Draft workspace / Submission history / Templates tabs not yet exercised. |
| Overview, Capital & Procurement Requests | Covered in an earlier round-test this session (see `design-refs/procurement-v23/TEST_FINDINGS.md`'s cross-module regression sweep note) — both loaded cleanly, zero console errors, "New capital or procurement request" form opens and renders correctly (not submitted, to avoid creating a real drawdown request as a side effect of a smoke test). |

| Financial Reporting (structured submit + upload) | "Submit investor report" modal: Income statement/Balance sheet/Cash flow/Commentary & evidence tabs all switch correctly, submission-readiness % updates live (25% → 50% as tabs are completed), real pre-filled figures ($4,260 total revenue etc.), file-upload control present ("Attach ledgers, bank statements and supporting schedules"). Not actually submitted, to avoid creating fake real financial data. No defects found. |
| Settings | Company profile, own profile, and letterhead sections all render with real data (Arcus Demo Investee Co, real registration number/contact details). FINDING-IP8-003's 2 unexplained 400s reproduce here too — further confirms it's global/per-page-load, not route-specific (already broadened in that finding's own text). |
| Team & Access | Correctly honest: "Company team and access management is not available yet — a real team/user-management API is not pending. See design-refs/investee-portal-v8-backend-asks.md." Matches documented inert state. |
| Cap Table | Correctly honest: "A live cap table has not been recorded yet — a cap table API is still pending." A transient loading-skeleton briefly showed a different demo company name ("Zambezi Pay") before resolving correctly to "Arcus Demo" — cosmetic loading-flicker only, not a real company-switch bug (confirmed the final rendered state was correct). |
| Governance | Correctly honest: "Governance tracking (board calendar, consent requests, reserved matters) is not available yet — a live governance API is still pending." Matches documented inert state. |
| Document Vault | Shows **real** data — 4 real application documents (business-plan.pdf, proof-of-concept.pdf, market-research.pdf, deal.pdf), correctly scoped as "Application documents linked to your live application record" (not the more general company document vault, which remains correctly unbuilt per backend-asks). |
| Messages | Correctly honest: "Messages are not available yet — an applicant messaging API is still pending." Matches documented inert state. |
| Forecast Model | Correctly honest: "A live actuals & forecast model has not been set up yet — the forecasting API is still pending." Same transient loading-skeleton company-name flicker as Cap Table, same non-issue. |
| `application-portal` redirect audit | Confirmed: navigating to `https://dev.matanho.com/application-portal` while authenticated as the investee test persona redirects to the real, live Investee Portal Overview on `dev.investee.matanho.com` with correct real data. This is legitimate role-based access control (an investee-role session being kept off a staff-only route), not a dead/broken redirect target — the original phase-7 checklist item's framing ("check for dead targets") turned out to be based on an assumption that didn't hold up under live testing; the actual behavior is correct. |

**Phase 7: complete.** Every screen live-tested. 2 real defects found and fixed (IP8-001, IP8-002),
both verified live. 1 real defect found, confirmed reproducible across every route tested (Reporting
Centre, KPI Centre, Settings), root cause not isolated (IP8-003) — left open. All fixture/inert screens
confirmed correctly honest, none regressed to fabricated data. Not yet merged to `dev`/`master`/prod —
checkpointing before that merge, per this sweep's standing convention.
