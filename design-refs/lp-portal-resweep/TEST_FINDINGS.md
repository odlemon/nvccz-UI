# LP Portal — Full Re-Sweep Test Findings

Part of the whole-system full-sweep engagement (`FULL_SWEEP_2026-09_OVERVIEW.md`), started 19-20
September 2026 at the user's explicit request for a full re-sweep at the same depth as Procurement/
Portfolio/Investee Portal/Performance, not a lighter regression check.

**Baseline:** `design-refs/lp-portal-test-plan.md` (9 September 2026) — 24 defects fixed, 30/30 screen×role
combinations verified. This re-sweep re-verifies the 2 items marked "pending re-run", exercises the
guardrails/QA scenarios that baseline explicitly left unexercised, exercises the OPEN_ENDED fund path for
the first time, and re-checks the cross-module flow now that Portfolio's own live-testing sweep has landed.

## Pending re-run defects: re-verified, both root-caused and fixed

Re-tested against `lp.signatory@example.com` on the live Performance page, selecting a specific fund
(Arcus Growth Fund V) rather than "All Funds" — that's where both baseline items live.

**Defect 9 (RVPI missing) — superseded by a bigger, related bug, both now fixed.** RVPI is present as its
own KPI card today (not missing), but selecting a specific fund showed Current NAV $0.00, Paid-In Capital
$0.00 and TVPI/DPI 0.00x, while the *same* response's `netIrr`/`tvpi`/`dpi`/`rvpi` were correct non-zero
values (18.7% / 1.27x / 0.50x / 0.77x) — and the "Performance by Fund" table (a separate query) showed the
correct NAV. Root cause, confirmed by reading `lpPortalMetricSnapshot` directly in the dev DB: this fund's
cached snapshot row (created 2026-08-18, updated 2026-09-04) stores dollar fields under the pre-rename keys
`paidIn`/`currentNav`/`distributions`, but `LpPortalPerformanceService.metricsForFund()` reads the
post-rename keys `totalPaidIn`/`nav`/`totalDistributions` — a silent `?? 0` on every mismatch. The ratio
fields share the same key name in both shapes, so they alone stayed correct, which is exactly why this
looked like "RVPI is fine, something else is off" rather than an obvious blank page. Fixed on `nvccz`
branch `feature/lp-portal-resweep-live` (commit `e82113f`): read both the current and legacy key names.
Deployed to dev, live-verified: Current NAV now reads $198.76M, Paid-In Capital $156.42M, matching the
by-fund table.

**Defect 8 (capital-flow chart axis) — the chart was not just mis-labelled, it was fully invisible; found
and fixed while re-verifying.** After the metrics fix above, the KPI cards were correct but the "Capital
Activity (Cash Flow)" chart — and the "Performance History" NAV chart above it — stayed completely blank:
no bars, no axis, no gridlines, just the section header and legend. `getBoundingClientRect()` on both
charts' `.recharts-responsive-container` elements showed real width but **`height: 0`**. Root cause: both
containers are `<div className="h-[Npx] min-h-0 flex-1 ...">` inside a `flex flex-col` `<section>` that has
no definite height of its own (`overflow-hidden`, height driven by content) — `flex-1` compiles to
`flex: 1 1 0%`, and `flex-basis: 0%` wins over the element's own `h-[Npx]` for sizing purposes when the
flex container's cross size isn't resolved yet, so Recharts' `ResponsiveContainer` (which sizes off its
parent via `ResizeObserver`) measures 0 height and never recovers. Confirmed live by toggling the class in
devtools (`flex-1` → `grow`) and watching both charts render immediately with real data. Fixed at the
source in `components/lp-portal/screens/lp-performance-screen.tsx` (both chart-container divs, lines ~644
and ~849): swapped `flex-1` (`flex: 1 1 0%`) for `grow` (`flex-grow: 1`, default `flex-basis: auto`), which
lets the element's own height act as the basis while still allowing it to grow — same fix validated live
before touching source. Not yet redeployed to dev (frontend UI deploy queued, since the backend deploy for
the metrics fix already went out); no other chart in this codebase shares the exact
`h-[Npx] min-h-0 flex-1` combination (checked via grep across `components/lp-portal/screens/*.tsx`), so
this looks isolated to these two charts, not a systemic pattern elsewhere.

### Q11 — OPEN_ENDED fund path, exercised for the first time — real G3 violation found and fixed

`lp.signatory@example.com` now has a real OPEN_ENDED fund on their account ("Arcus Equity Opportunities").
Selecting it from the Fund/Account dropdown on Performance reproduced exactly the failure mode this
codebase's own comment (in `LpPortalPerformanceService.ts`'s `byFund` construction) already describes and
had fixed for the all-funds table row: **Net IRR -2.0%, TVPI/DPI/RVPI 0.00x were shown as real KPI cards**
for an open-ended fund, directly against SRD section 37 (G3: "never show DPI/RVPI/TVPI... regardless of
operating model") — confirmed via a direct API call
(`GET /lp-portal/performance?fundId=<equity-opps-id>`) returning `netIrr: "-2.0000"`, `tvpi/dpi/rvpi:
"0.0000"` in the top-level `metrics` object.

Root cause: the `byFund` array's per-row `privateCapitalMultiples` gate (added for exactly this SRD
requirement) was never applied to the single-fund **summary** `metrics` object returned by the same
`getPerformance()` call — so requesting the aggregate-by-fund table got it right, but selecting that one
fund directly on the Performance screen (the normal way an LP would look at their own open-ended holding)
did not.

Fixed on `nvccz` branch `feature/lp-portal-resweep-live` (commit pending push): when `opts.fundId` scopes
the request to a single fund and that fund's `operatingModel` is `OPEN_ENDED`, `metrics.netIrr/tvpi/dpi/
rvpi` are now `null` rather than a computed (and meaningless) number, mirroring the existing per-row gate
exactly. Frontend (`components/lp-portal/screens/lp-performance-screen.tsx`) updated to render "—" for
these four KPI cards when null, matching the convention the "Performance by Fund" table already uses,
rather than defaulting through `formatMultiple`/`formatPercent` to a fabricated "0.00x"/"0.0%". The
existing "Open-Ended Account Metrics" card (Account Value/Units Held/NAV Per Unit/YTD Return) is
unaffected and continues to be the correct place these investors see their own performance. Not yet
deployed/live-verified — do that before merging (deploy the API fix together with the two chart-height
fixes above, since both touch this same file/service).

## Carried over from the baseline, still to verify or exercise

- **Pending re-run (baseline defects 8, 9):** third Performance chart axis (capital flow) fixed-50M-step
  bug + float-tail formatter; RVPI missing from the dashboard's Current NAV card helper text.
- **Guardrails never exercised:** G5 (historic FX rate immutability), G6 (published statement snapshot
  immutability), G9 (no edit control on posted transactions), G10 (bank instruction status/MFA on edit).
- **QA scenarios never exercised:** Q3 (session revocation ≤60s), Q4 (historic FX, same as G5), Q6
  (capital-call acknowledgement doesn't mark paid), Q7 (provisional/restated labelling), Q8 (restatement
  doesn't delete original), Q9 (audit records for downloads/bank changes), Q10 (org admin can't expand
  entitlements).
- **Q11 caveat:** OPEN_ENDED fund path was never exercised (no such fund existed on the test account at
  the time). Now exercised — see "Q11" below, real defect found and fixed.
- **Accounting-treatment issues, referred not fixed (need chart-of-accounts sign-off, not a frontend/
  backend guess):** every distribution debits `4100 Dividend Income` regardless of actual source;
  `RETURN_OF_CAPITAL`/`INCOME` distribution types are rejected by the backend's `ALLOWED_SOURCES` despite
  the LP portal already displaying them as valid options. Re-confirm these still exist; do not attempt to
  fix without sign-off.

---

## Re-sweep results

### Q6 — capital-call acknowledgement doesn't mark the call as paid — PASS

Live-tested as `lp.signatory@example.com` against Call 818 (Arcus Growth Fund V, $6,250,000). After
acknowledging: Status stayed "Issued", Paid stayed "$0", Outstanding stayed "$6,250,000". The timeline
correctly added a separate "ACKNOWLEDGED: Sep 19, 2026" step and an "Acknowledgment Status: Acknowledged"
field, tracked independently of payment status. No regression.

### G9 — no write control on posted transactions (capital calls / distributions) — PASS

Checked at the backend route level, not just the frontend's typed client (the frontend already showed no
`PUT`/`PATCH`/update method for capital calls or distributions in `lib/api/lp-portal-api.ts`, which is
suggestive but not proof against a hand-crafted request). Grepped `nvccz/src/routes/*.ts` for every
`router.put`/`router.patch` touching `capitalCall`/`CapitalCall`/`distribution`/`Distribution` — zero
matches anywhere in the codebase, staff-side included. There is no route registered at all for editing a
capital call or a distribution once created, so a direct API call has nothing to hit (confirmed live:
`PUT /api/lp-portal/capital-calls/818` and `PATCH /api/capital-calls/818` both return a bare Express 404
"Cannot PUT/PATCH ..." — unrouted, not merely permission-denied). Capital calls and distributions are
create-and-read-only for every persona once posted.

### G10 — bank-instruction change requires signatory role + MFA, never edits live in place — PASS

`nvccz/src/routes/lpPortalRoutes.ts:343-349`: `POST /bank-instructions/changes` is gated by
`requireLpSignatory` (SIGNATORY/MANAGER only — a VIEWER-role LP is rejected 403 before reaching the
handler) plus `requireLpIdempotencyKey`. `LpPortalServiceDeskService.createBankInstructionChange`
(`nvccz/src/services/lpPortal/LpPortalServiceDeskService.ts:187-209`) additionally checks
`getMfa(ctx, userId)` and throws `LP_MFA_REQUIRED` (403) if the client's policy requires MFA and the
requesting user hasn't enabled it. The action never mutates a real bank account record directly — it only
inserts an `lpBankInstructionChange` row with `status: "SUBMITTED"`, i.e. a change *request* that still
needs GP-side approval through a separate flow. No regression from baseline.

### G5 — historic FX-rate immutability — PASS (no write surface exists)

`nvccz/src/routes/lpPortalRoutes.ts` has zero routes matching `fx`/`FX`/`exchangeRate`/`zimrate` in any
case — the LP portal doesn't expose FX rates for reading OR writing at all; whatever FX conversion backs
LP-visible figures happens server-side and isn't a route surface an LP session can reach, so there's
nothing to attempt to edit.

### G6 — published statement/snapshot immutability — PASS, with a quality note (not a guardrail failure)

Only one statement-shaped route exists: `GET /distributions/statement/download`
(`LpPortalController.downloadDistributionStatement` →
`LpPortalCapitalActivityService.downloadDistributionStatement`,
`nvccz/src/services/lpPortal/LpPortalCapitalActivityService.ts:464-489`) — a GET, no publish/edit/
regenerate-with-different-inputs route exists. It does accept an `asOfDate` query param, so I checked
whether that could be used to re-price historic distributions with a different FX rate (which would be a
real G6 violation) — it isn't: `asOfDate` is used only as a label string in the output ("As of: <date>"),
and each line echoes the distribution's own already-stored `grossAmount`/`shareAmount` field, never
recomputed from a rate looked up at the requested date. Historic amounts can't be altered by varying the
query param.

**Quality note, logged as FINDING-LP-R01 (Low, not a guardrail defect):** the "statement" this endpoint
returns is a plain UTF-8 tab-separated `.txt` file (`contentType: "text/plain"`, filename
`distribution-statement-<date>.txt`), not a formatted PDF, despite the controller's fallback header
(`res.setHeader("Content-Type", contentType || "application/pdf")`) implying a PDF was intended. Every
other document-download surface in this codebase (reports, term sheets) returns real PDFs. Recommend
building this out as a proper formatted statement — a backend/frontend-doc-generation gap, not a security
or correctness issue, so not fixed here without a decision on desired layout/branding.

### Q10 — org (LP) manager can't expand entitlements beyond what the GP granted — PASS

`nvccz/src/services/lpPortal/LpPortalColleagueService.ts`: `inviteColleague` (line 55) and `patchColleague`
(line 131) both explicitly reject promoting a colleague to `MANAGER` unless the caller `ctx.isStaff`
("Cannot invite/promote another MANAGER via portal", 403) — an LP-side MANAGER can create/edit VIEWER or
SIGNATORY colleagues only, never another MANAGER. Separately, both methods intersect any `fundIds` passed
in the request against `ctx.fundScope` (the inviting manager's own granted funds) before writing, so a
colleague can never be given access to a fund the inviting manager doesn't themselves have. `revokeViewer`
also refuses to revoke a MANAGER through the colleague API. No regression from baseline; this is a solid,
narrowly-scoped guard against horizontal/vertical entitlement escalation.

### Q9 — audit records exist for downloads and for bank-instruction changes — PARTIAL, gap fixed

Split into two halves per the guardrail's own wording:

- **Downloads (document vault):** already implemented and working. `LpPortalDocumentsService.get/download/
  preview` (`nvccz/src/services/lpPortal/LpPortalDocumentsService.ts`) all call a private `audit()` helper
  that writes VIEW/DOWNLOAD/PREVIEW rows to `lpDocumentAccessAudit` (backing the dedicated
  `LpDocumentAccessAudit` Prisma model — documentId/clientId/userId/action/ip/userAgent), and `get()` even
  returns the last 20 access-history rows back to the caller. No gap here; my first grep pass missed this
  because it searched for the Prisma **model** name (`LpDocumentAccessAudit`, PascalCase) instead of the
  **client accessor** name (`lpDocumentAccessAudit`, camelCase) actually used in the code — corrected.
- **Bank-instruction changes: real gap, now fixed.** `LpPortalServiceDeskService.createBankInstructionChange`
  had no audit call anywhere — confirmed via a repo-wide grep for `audit` (any case) across every
  `lpPortal/*.ts` service file, which matched only `LpPortalDocumentsService.ts`. Fixed on
  `nvccz` branch `feature/lp-portal-resweep-live` (commit `e4ef20a`): the method now calls the existing
  generic `AuditService.log()` (already used by ~10 other domains in this codebase for exactly this
  action/entityType/entityId/oldValues/newValues/ip/userAgent shape) with `action: "CREATE"`,
  `entityType: "LpBankInstructionChange"`, recording the requesting user, IP, user agent, and the
  submitted payload. Controller (`LpPortalController.createBankInstructionChange`) updated to pass
  `req.ip`/`req.get("user-agent")` through. Deployed to dev (`arcus-dev-api-1`, rebuilt from the clean
  `feature/lp-portal-resweep-live` worktree) and live-verified: submitted a real
  `POST /lp-portal/bank-instructions/changes` as `lp.signatory@example.com`, then queried the dev DB
  directly and confirmed the `audit_logs` row — correct `userId`, `action: "CREATE"`,
  `entityType: "LpBankInstructionChange"`, `entityId` matching the created change, the submitted payload
  in `newValues`, real `ipAddress`/`userAgent`. Fixed and confirmed.

---
