# Fundraising & Investor Relations — test plan and results

**Branch:** `feature/fundraising-live` (both repos)
**Frontend:** staff portal, `http://localhost:3001`
**API:** `http://127.0.0.1:3009/api`, database `arcus_dev` (local MySQL)
**Specification:** `Arcus_Fundraising_Investor_Relations_Mandate_Origination_SRD_with_UI_Inspiration.pdf`
(26pp, extract with PyMuPDF) and `design-refs/fundraising-srd.md`

Nothing in this document is deployed. All observations are from local dev servers.

---

## 1. Method

The shipped UI is the specification: every KPI, column, chart, tab and control is a claim
about what the system does, and the job is to make that claim true against real data.

Three instruments, in order of strength:

| Instrument | What it proves | What it does not prove |
|---|---|---|
| `scripts/fundraising-page-dump.mjs` | The screen renders, calls the API, and has no console errors | That the numbers came from those calls |
| `scripts/fundraising-trace-numbers.mjs` | Every on-screen number appears in a payload the screen actually fetched | Nothing about controls or writes |
| Browser-pane interaction | A control reaches an endpoint and the UI reflects the result | Coverage — it is per-control |

Both scripts authenticate by API and seed the same cookies the login page sets, rather than
driving the login form: `page.fill` succeeds on a not-yet-hydrated input, so filling the form
proves nothing about whether React is listening.

**An untraced number is not automatically a defect.** Percentages, sums, page indices and
rounded money are legitimately derived. The trace produces a short list that must be explained
arithmetically or fixed — it replaces eyeballing a dense screen and hoping.

### Environment caveat that shaped the runs

The staff dev server on port 3001 is **shared with another agent working on Payroll**, and
Next compiles routes on demand. A page can therefore land mid-compile and fail with
`ChunkLoadError: Loading chunk app/layout failed` and a stuck `Loading…`, which is an artifact
of the dev server, not of the screen. Both scripts retry once on exactly those two signals; a
screen that is genuinely broken fails the same way twice and is still reported.

This was diagnosed, not assumed: the browser console showed the missing
`/_next/static/chunks/app/layout.js`, and the same screens rendered correctly on reload.

---

## 2. Starting state (verified, not inherited)

| Claim | Verified how | Result |
|---|---|---|
| Fundraising tables hold no transactional data | Row count over all 66 `fundraising_*` / `investor_*` tables | **Confirmed** — 4 of 66 non-empty, and those 4 were reference data only (templates, settings, audit) |
| `lib/api/fundraising-api.ts` exists and is broad | Export count | 131 methods |
| 14 components import `*-mock-data` | grep | Confirmed, but see below |
| `fundraisingIrRoutes.ts` / `investorIrRoutes.ts` may be unmounted | `grep` over `src/app.ts` and all of `src/`, `scripts/` | **Dead code** — mounted nowhere, imported by nothing, a strict subset of the mounted routers. Deleted. |

### The mock-import finding is more nuanced than the inventory suggested

Of the 20 fixture files, **8 were already orphaned** (zero importers, 2,485 lines of fabricated
data). Of the 13 that were imported, every import resolved to **presentation helpers and types**
— chip classes, label maps, option lists — not to rendered data. Two files additionally held
KPI card arrays with invented money (`US$33.21M`) and counts, but both screens overwrite
`amount`/`value` from live totals for every id in the array, so **no fabricated value reached
the screen**.

That was verified rather than assumed: the id list in each constant was diffed against the
`switch` that overwrites it, and all ids were covered.

The fixtures were still deleted. A file named `*-mock-data.ts` containing fake money next to a
live screen is a standing trap for the next edit, which is the failure mode this module was
audited for in the first place.

**One real defect of this class was found** — see Reports in §5.

---

## 3. Test data

`nvccz/scripts/seed-fundraising-demo-dataset.ts` (`npm run db:seed:fundraising-demo`).
Idempotent: deterministic `frs-*` ids written with `upsert`; re-running converges. Verified by
running it twice and confirming stable row counts.

| Entity | Rows | Notes |
|---|---:|---|
| Campaigns | 3 | PE_FUNDRAISE, INSTITUTIONAL_MANDATE, VC_FUNDRAISE (draft) |
| Pipeline stages | 39 | 13 per campaign, copied from the active templates per the `campaignType → pipelineKey` rule |
| Investor organisations | 10 | Varied type, country, KYC and sanctions state, incl. one BLOCKED with a compliance hold |
| Investor contacts | 24 | 2–3 per organisation, one primary each |
| Opportunities | 16 | Spread across the full stage range of both pipelines, incl. one LOST |
| Stage history | 126 | Every opportunity walked from stage 1 to current, spaced so days-in-stage is a real interval |
| Amount history | 27 | One row per amount the opportunity actually reached |
| Commitments | 5 | SIGNED / ADMITTED / FUNDED |
| Closings | 3 | COMPLETED, SCHEDULED, PLANNED |
| Mandates / RFPs / KYC cases | 3 / 4 / 4 | |
| DDQ | 1 template, 8 library entries, 3 cases, 24 items | |
| Data rooms / communications / meetings | 2 / 18 / 12 | |
| Documents / agreements / placement agents | 16 / 4 / 4 | |
| Approvals / forecast scenarios | 5 / 4 | |

Stage and amount history exist because SRD acceptance criterion 15 requires them and §7
requires that an amount is never overwritten without preserving the former value, reason and
author.

---

## 4. Arithmetic verification of the dashboard aggregates

The SRD gives the formulas explicitly (§25). The live `GET /fundraising/dashboard` response
was checked against them by hand rather than eyeballed:

| Value | API returned | Derivation | Agrees |
|---|---:|---|:--:|
| `signedTotal` | 79,000,000 | 15 + 25 + 12 + 18 + 9 M seeded signed amounts | ✅ |
| `admittedTotal` | 58,000,000 | 15 + 25 + 18 M | ✅ |
| `fundedTotal` | 53,000,000 | 15 + 20 + 18 M | ✅ |
| `targetTotal` | 270,000,000 | 120 + 75 + 25 M seeded + 50 M from the pre-existing UAT campaign | ✅ |
| `coverageRatio` | 0.6730366492146597 | SRD §25.3 — weighted open pipeline / remaining target = 128,550,000 / (270,000,000 − 79,000,000) | ✅ |

The coverage ratio matching to 16 significant figures confirms the backend implements the SRD
formula rather than an approximation.

---

## 5. Per-screen results

_(populated from the runs below — see §7 for the raw artefacts)_

---

## 6. Role matrix

_(populated after the per-role runs)_

---

## 7. Artefacts

| Artefact | Location |
|---|---|
| Page dumps | `.fr-dump/<role>__<screen>.txt` |
| Number traces | `.fr-trace/<role>__<screen>.txt` |
| Seed script | `nvccz/scripts/seed-fundraising-demo-dataset.ts` |
| tsc baseline | 997 errors repo-wide, **4 within fundraising**, all pre-existing |
