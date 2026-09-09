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

**These are the figures at the time of that check.** `targetTotal` later rose to 320,000,000
because `npm run uat:fundraising:srd` creates a fresh campaign on every run, and it was run
several times during this work. The relationship was re-verified against the higher total at
the end: remaining to target = 320,000,000 − 79,000,000 = **241,000,000**, which is what the
dashboard renders. The absolute totals move with the dataset; the derivations hold.

---

## 5. Per-screen results

Page dump as `sysadmin`, all 20 screens, after the fixes in 5.2. "rows" counts
`<table><tbody><tr>` - several screens render cards rather than a table and legitimately
report 0.

| # | Screen | API calls | Rows | Console errors | Failed requests | Verdict |
|---|---|---:|---:|---:|---:|---|
| 1 | Dashboard | 7 | 13 | 0 | 0 | Live |
| 2 | Campaigns | 12 | 0 (cards) | 0 | 0 | Live |
| 3 | Investor Organisations | 3 | 17 | 0 | 0 | Live |
| 4 | Contacts | 20 | 29 | 0 | 0 | Live |
| 5 | Pipeline | 8 | 6 | 0 | 0 | Live |
| 6 | Mandates & RFPs | 5 | 7 | 0 | 0 | Live |
| 7 | Due Diligence | 4 | 8 | 0 | 0 | Live - matrix populated after the auto-select fix |
| 8 | Data Rooms | 4 | 0 (cards) | 0 | 0 | Live - tiles fixed, see 5.2 |
| 9 | Communications | 3 | 18 | 0 | 0 | Live |
| 10 | Meetings & Tasks | 5 | 0 (calendar) | 0 | 0 | Live |
| 11 | Documents | 3 | 0 (tree) | 0 | 0 | Live - 400 on virtual docs fixed |
| 12 | Agreements & Signatures | 3 | 0 (cards) | 0 | 0 | Live |
| 13 | Commitments & Closings | 6 | 6 | 0 | 0 | Live - KPI buckets fixed |
| 14 | Client Onboarding | 6 | 7 | 0 | 0 | Live |
| 15 | Placement Agents | 6 | 4 | 0 | 0 | Live |
| 16 | Forecasts & Analytics | 10 | 9 | 0 | 0 | Live - analytics tables fixed |
| 17 | Reports | 5 | 0 (cards) | 0 | 0 | Live - catalogue now from the API |
| 18 | Approvals | 3 | 5 | 0 | 0 | Live - names resolved |
| 19 | Audit Logs | 3 | 7 | 0 | 0 | Live - actor resolved |
| 20 | Settings | 3 | 0 (cards) | 0 | 0 | Live |

**No screen renders an empty shell, and no screen logs a console error or a failed request.**

### 5.1 Number trace - every unmatched value accounted for

The trace flags any on-screen number absent from the payloads that screen fetched. Fourteen of
the twenty screens come back with nothing to explain. The rest are listed here in full; none is
a hardcoded value.

| Screen | Value | Explanation |
|---|---|---|
| Dashboard | `US$52.0M` | Soft Circled in PE/VC mode - sum of `softCircleAmount` over the PE campaign's opportunities: 15 + 25 + 12 = 52M |
| Dashboard | `US$241.0M` | Remaining to target, SRD 25.3 - `targetTotal` 320M minus `signedTotal` 79M = 241M |
| Dashboard, Pipeline, Audit | `38`, `36`, `35`, `50`, `58` | Minutes and seconds inside rendered timestamps (`12:38:15`) - the digit scan cannot distinguish these from figures |
| Pipeline | `US$83.0M` | Soft Circles across all campaigns - sum of `softCircleAmount` over all opportunities = 83,000,000, confirmed against the payload |
| Pipeline | `160`, `240` | Recharts Y-axis tick labels on "Capital Raised Over Time" (`US$0M / 80M / 160M / 240M`) - computed from the domain, not from data |
| Commitments | `US$79.00M` | Sum of `commitmentAmount` over the 5 commitments in the payload |
| Commitments | `US$53.00M` | Sum of `fundedAmount` over the same 5 |
| Commitments | `67` | 53 / 79 = 67% of total committed |
| Audit | `127.0`, `0.1` | Fragments of the IP address `127.0.0.1` in the IP column |

Where a value could not be explained it was treated as a defect and fixed - that is how the
pipeline stage bucketing, the data-room tiles, the commitment KPI buckets and the Forecasts
analytics tables below were found.

### 5.2 Defects found and fixed

| # | Defect | Evidence it was real | Fix |
|---|---|---|---|
| 1 | Reports rendered a hardcoded 7-report catalogue with invented owners ("Tariro Moyo") and cadences, while `GET /fundraising/reports` served the real one | `useState(FR_REPORTS)` at `fundraising-reports.tsx:38` | Loads catalogue + schedules from the API; says "Not scheduled" rather than inventing a cadence; hides Owner when there is no schedule |
| 2 | The Configure dialog collected a cadence and recipients and discarded them - its own text admitted "aren't persisted yet" | Read of `runReport` | Persists via `POST /fundraising/reports/schedules` |
| 3 | Pipeline by Stage put all 17 opportunities in one "Unspecified" bucket worth 100% | Screen showed `Unspecified 17 US$175.5M 100%` | Two stacked bugs: `rowsFromAnalytics` required an array but `/analytics/funnel` returns an object keyed by stage code; the fallback read `row.stageName`, but the API nests it under `row.currentStage`. Both fixed, ordered by `sortOrder` |
| 4 | Data-room "Documents", "Views (7d)" and "Downloads (7d)" were structurally zero forever | API returned `_count.documents: 10` while the tile read 0; no `views7d` field existed at all | Backend now aggregates a rolling 7-day window from the access log; mapper reads `_count` as well as the nested arrays |
| 5 | Every activity feed and the audit screen showed "Name unavailable" for the actor | `audit-logs` returned `userId` only | Backend resolves actors in one batched lookup, returning `userName`/`userRole` |
| 6 | Approvals showed "Name unavailable" for Campaign, Investor and Requester | Approval rows store only `objectType`/`objectId`/`requestedById` | Backend resolves per object type in batched lookups |
| 7 | Due Diligence matrix was empty on arrival even though every case carried its 8 items | `selectedId` initialised to `null` and only set on click | Selects the first case once the list loads |
| 8 | Documents 400'd on every visit | `GET /documents/dr-...` - the index merges virtual data-room/agreement rows that the detail endpoint rejects by design | Frontend no longer requests detail for `dr-`/`agr-` ids |
| 9 | Commitments reported US$54M committed / US$33M funded against a payload summing to 79M / 53M | Trace flagged `54.00`; the admitted row was absent from every bucket | The seeder wrote a non-canonical status `ADMITTED`; the service writes `ADMITTED_AT_CLOSE`. Seed corrected |
| 10 | Forecasts' Funnel / Source / Owner tables each showed one row reading `Name unavailable / Campaignid / cmttz...` | Trace flagged `54`, which came from a campaign id string | `toRowsArray` now converts the keyed-object analytics shapes; backend returns owner names |
| 11 | 20 `*-mock-data.ts` fixtures, two carrying fabricated KPI money and counts | Read of the fixtures | Deleted; genuine helpers moved to `*-presentation.ts` |

### 5.3 Control inventory - every wizard, dialog and export

Definition-of-done item 4 asks that every control is live, honestly view-state-only, or
honestly disabled, and names `fundraising-create-wizards.tsx` and `fundraising-modals.tsx`
specifically. A scan for empty handlers is not enough to show that, so every control in those
two files was enumerated and traced to the call it makes.

**Wizards (`fundraising-create-wizards.tsx`)** - 4 concrete wizards, all reaching a create
endpoint:

| Wizard | Submit label | Reaches |
|---|---|---|
| `FrOpportunityWizard` | Create opportunity | `createOpportunity` |
| `FrCampaignWizard` | Create campaign | `createCampaign`, `activateCampaign` |
| `FrMandateWizard` | Create mandate | `createMandate` |
| `FrCommitmentWizard` | Record commitment | `createCommitment` |

`FrSimpleWizard` is a generic host - it does nothing itself and delegates to the caller's
`onFinish`. All ten callers pass a handler that reaches the API:

| Screen | Handler | Reaches |
|---|---|---|
| Agreements | `submitCreate` | `createAgreement`, `addSignatory` |
| Communications | inline | `createCommunication` |
| Contacts | `handleCreate` | `createContact` |
| Data Rooms | `submitCreateRoom` | `createDataRoom`, `createDataRoomFolder`, `grantDataRoomAccess` |
| Investors | `handleCreate` | `createInvestor` |
| Onboarding | `startCase` | `createKycCase`, `patchKycCase`, `activateMandate` |
| Placement Agents | `addAppointment` | `createPlacementAgent` |
| Settings | `submitAddStage` | `createPipelineStage`, `patchPipelineStage` |
| Settings | `saveGate` | `patchStageGates`, `patchNotificationSettings` |

**Dialogs (`fundraising-modals.tsx`)** - `FrDialogShell`, `FrFormFooter`, `FrField`,
`FrTableSkeleton`, `FrWizardShell`, `FrRequirementsDialog` and `FrViewAllDialog` are
presentational shells with no behaviour of their own. The two that carry an action both have
live handlers at every call site:

| Dialog | Screen | Handler | Reaches |
|---|---|---|---|
| `FrConfirmDialog` | Campaigns | `runAction` | `patchCampaign`, `pauseCampaign`, `submitCampaignForApproval` |
| `FrConfirmDialog` | Contacts | `archiveSelected` | `archiveContact` |
| `FrConfirmDialog` | Investors | `archiveSelected` | `patchInvestor` |
| `FrConfirmDialog` | Settings | `confirmDeleteStage` | `deletePipelineStage` |
| `FrPromptDialog` | Campaigns (x2) | `runAction` | as above |
| `FrPromptDialog` | Meetings | `handleCancelMeeting` | `cancelMeeting` |
| `FrPromptDialog` | Pipeline board | `markLost` | `markOpportunityLost`, `setOpportunityStatus` |

**Other action dialogs**: Record Funding (`fundCommitment`), Save scenario
(`createForecastScenario`), Send invite (`grantDataRoomAccess`), Create folder
(`createDataRoomFolder`), Save Appointment (`patchPlacementAgent`), Run now (`getReport` +
`createReportSchedule`).

**Export controls** - all 18, across every screen that offers one, produce a real file. Most
build a CSV client-side through `exportFundraisingCsv`; Documents, Due Diligence and Audit go
through the server export endpoints (`exportDocuments`, `exportDdqCase`, `exportAuditLogs`) and
stream the payload back through `downloadCsvPayload`. None is a no-op.

**The two controls that are deliberately not live**, both of which say so rather than failing
silently:

| Control | Screen | Behaviour |
|---|---|---|
| "Advanced filters" | Commitments | Shows a toast reading "Advanced filters coming soon". Honest, though it would be better as a disabled control - left as-is because removing a documented affordance is a product decision, not a bug fix |
| DDQ export fallback | Due Diligence | When the server export is unavailable it exports the loaded data instead and says so: "Server export unavailable; exported the loaded data instead" |

---

## 6. Role matrix

Measured against the running API with `scripts/fundraising-role-matrix.mjs`, and the UI half
with `fundraising-e2e-roundtrips.mjs --trip=c`.

| Role | roleCode | Read | Create investor | Create opportunity | What the user sees |
|---|---|---|---|---|---|
| `perf.sysadmin` | SYSADMIN | allowed | allowed | allowed | Full module |
| `perf.exec` | CEO | allowed | **403** | **403** | Screens load; submitting shows "You do not have permission to edit fundraising data" |
| `perf.deptmgr` | OPS_MGR | allowed | **403** | **403** | Same as above - refusal toast observed |
| `perf.hr` | HR_MGR | allowed (API) | **403** | **403** | **"Access denied"** - the module guard blocks the screen before any control is offered |
| `perf.employee` | OPS_MEM | allowed (API) | **403** | **403** | Redirected away from the module entirely |

Every refusal is honest: either the module is blocked at the guard, the control is not offered,
or the write is refused with a message the user can see. **No silent no-ops were found.**

One caveat worth recording: the first measurement reported the refusal as invisible. That was a
measurement error, not a defect - sonner clears a toast after about four seconds and the check
ran at exactly four seconds. Polling from the click shows the message every time, and the check
now polls.

### 6.1 End-to-end round trips

`scripts/fundraising-e2e-roundtrips.mjs` - every step performed by clicking and typing in the
real UI, and verified by reading the screen afterwards rather than trusting a 2xx.

**Trip A - 14 steps, 0 failures.** Investor organisation -> contact linked to that investor ->
opportunity on an active campaign for that investor -> commitment against that opportunity ->
closings surface. Writes observed:

```
201 POST /investors
201 POST /investors/:id/contacts
201 POST /fundraising/opportunities
201 POST /fundraising/commitments
```

Each record was confirmed visible on screen before the next step, and each step selected the
record created by the previous one - so this is one chain, not four unrelated inserts.

**Trip B - 10 steps, 0 failures.** DDQ case -> matrix items grouped by answer-library category
(all six present: Organisation, Performance, ESG, Operations, Compliance, Commercial) -> export
-> approvals -> decide. The decision was observed reaching
`POST /fundraising/approvals/:id/decide`, and the row moving out of Pending on screen (2 -> 1).

Records created by these runs are removed afterwards by
`npm run db:cleanup:fundraising-test-artefacts`, so they do not accumulate in the demo dataset.

---

## 7. Artefacts

| Artefact | Location |
|---|---|
| Page dumps | `.fr-dump/<role>__<screen>.txt` |
| Number traces | `.fr-trace/<role>__<screen>.txt` |
| Seed script | `nvccz/scripts/seed-fundraising-demo-dataset.ts` |
| tsc baseline | 997 errors repo-wide, **4 within fundraising**, all pre-existing |
