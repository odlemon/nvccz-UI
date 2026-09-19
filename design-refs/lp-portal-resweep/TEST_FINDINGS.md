# LP Portal — Full Re-Sweep Test Findings

Part of the whole-system full-sweep engagement (`FULL_SWEEP_2026-09_OVERVIEW.md`), started 19-20
September 2026 at the user's explicit request for a full re-sweep at the same depth as Procurement/
Portfolio/Investee Portal/Performance, not a lighter regression check.

**Baseline:** `design-refs/lp-portal-test-plan.md` (9 September 2026) — 24 defects fixed, 30/30 screen×role
combinations verified. This re-sweep re-verifies the 2 items marked "pending re-run", exercises the
guardrails/QA scenarios that baseline explicitly left unexercised, exercises the OPEN_ENDED fund path for
the first time, and re-checks the cross-module flow now that Portfolio's own live-testing sweep has landed.

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
  the time).
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

---
