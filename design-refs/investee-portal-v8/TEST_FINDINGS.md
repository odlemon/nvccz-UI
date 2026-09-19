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

Deployed to dev (`ui-investee` only). *(Fill in exact re-check once the Phase 7 sweep resumes: reload
Signatures as `investee.test@arcus.co.zw` and confirm "Investee Test Term Sheet" now shows
**Completed**, not "Awaiting your signature", and that the Signatures summary's "Completed this
quarter" count reflects it.)*

**Status:** FIXED — deployed to dev (`ui-investee`), pushed to `origin/feature/investee-portal-v8-live`. Live re-verification pending (see above). Not merged to `dev`/`master`/prod.

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

Deployed to dev (`ui-investee` only). *(Fill in exact re-check once the Phase 7 sweep resumes: reload
KPI Centre and confirm all cards show numeric values — expect `NET_PROFIT`, `CASH_FLOW_NET`,
`TOTAL_REVENUE`, `WORKING_CAPITAL`, `CASH_OPERATING_NET_APPROX`, no `derived` card, no `[object
Object]` anywhere.)*

**Status:** FIXED — deployed to dev (`ui-investee`), pushed to `origin/feature/investee-portal-v8-live`. Live re-verification pending (see above). Not merged to `dev`/`master`/prod.

---

## FINDING-IP8-003

**Title:** Two unexplained 400 responses on every load of the Reporting Centre screen
**Module:** Investee Portal (frontend `nvccz-new` and/or backend `nvccz`) · **Dimension:** UAT · **Category:** Unresolved — needs further investigation
**Severity:** LOW (provisional) — the page's own visible content (reporting schedule, 3 real records) renders correctly despite the errors; severity may change once the actual failing call is identified
**Persona affected:** Unknown — reproduced only for `investee.test@arcus.co.zw` so far
**Surface:** Unknown — reproduced console-side only

### Steps to reproduce (live on dev, 19 September 2026)

Loaded `/investee-portal-v8/reports` as `investee.test@arcus.co.zw` (fresh navigation, not a client-
side transition). Browser console shows exactly two `Failed to load resource: the server responded
with a status of 400 ()` errors, consistently, on every fresh load of this specific route.

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

**Not yet covered:** Financial Reporting structured submit + upload, Settings (profile/company/
letterhead), the `application-portal/<suffix>` → `investee-portal-v8<suffix>` redirect audit, and
confirming Document Vault / Messages / Cap Table / Governance / Forecasts / Team & Access are in their
documented (mock/fixture/inert) state rather than regressed. Continuing Phase 7 from here.
