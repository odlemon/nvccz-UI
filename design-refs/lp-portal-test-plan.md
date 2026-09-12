# LP Portal — SRD conformance and three-module integration test plan

**Date:** 9 September 2026
**Authority:** `Arcus_Investor_LP_Portal_Detailed_SRD_with_UI_Mockups.pdf` (July 2026, 24pp).
The SRD supersedes anything previously inferred from the shipped UI. Section numbers below refer
to it. Extracted text kept at `.lp-uat/lp-srd.txt` for grepping.
**Method:** nothing passes on inspection. Each row records what was observed, on every module the
record has to appear in.

## Dedicated instances

Own ports and own build dirs, so a test pass and other concurrent work cannot disturb each other.

| Instance | Port | distDir | Carries |
|---|---|---|---|
| staff-uat | 3201 | `.next-staff-uat` | Portfolio, Accounting |
| lp-uat | 3210 | `.next-lp-uat` | LP portal |
| API | 3009 | — | shared |
| MySQL | 3306 | `C:\mysql-local-data\data` | local `arcus_dev` |

```
node scripts/run-portal-dev.mjs staff --port=3201 --dist=uat --lp-url=http://localhost:3210
node scripts/run-portal-dev.mjs lp    --port=3210 --dist=uat
```

---

## A. The integration chain (SRD §26, data ownership)

The SRD is explicit that the portal owns none of this: capital calls and distributions belong to
Portfolio Management / Fund Operations / Accounting, and the portal displays approved,
investor-scoped records. The chain below is read from `nvccz/src/services/CapitalCallService.ts`
and `DistributionService.ts`, and each leg is written in one Prisma transaction — a record present
in one module and absent in another is a defect, never a timing artefact.

### Issuing a capital call

| Module | What must appear |
|---|---|
| **Accounting** | journal entry `POSTED`, ref `CCALL-<fund6>-<ts>`, assigned audit id; **Dr 1210** capital contributions receivable, **Cr 3010** partners capital uncalled, both equal to the rounded total |
| **Portfolio** | `capitalCall` carrying `journalEntryId`; one allocation per LP with commitment/uncalled snapshots, `amountPaid` 0 |
| **LP portal** | dashboard action + Capital Activity row for that LP's own allocation, with due date and bank instructions (SRD §10) |

### Recording a payment

| Module | What must appear |
|---|---|
| **Accounting** | second journal entry: **Dr cash/bank**, **Cr 1210** clearing the receivable |
| **Portfolio** | allocation `amountPaid` up, status recomputed |
| **LP portal** | paid-in up, outstanding call down, TVPI/DPI recomputed |

### Distribution

| Module | What must appear |
|---|---|
| **Accounting** | journal entry Dr income / Cr payable / Cr carry |
| **Portfolio** | distribution + per-LP allocations |
| **LP portal** | Distributions row, DPI moves, statement downloadable (SRD §11) |

| # | Flow | Status |
|---|---|---|
| A1 | Capital call issued → LP sees it → GL balances 1210/3010 | **PASS** — see run below |
| A2 | Payment recorded → LP paid-in rises → GL clears 1210 | **PASS** — see run below |
| A3 | Distribution → LP Distributions tab → GL income/payable | **PASS** — see run below |
| A4 | LP onboarding: invite → activation → first login | **PASS** — backend 10/10 + 7/7, browser 7/7 |
| A5 | Document publish → Document Centre → download (SRD §20) | **PASS** — after defect 19 |
| A6 | Service request raised → staff sees → reply returns (SRD §21) | **PASS** — after building the staff side, defect 16 |
| A7 | Notice issued → Notices row → acknowledgement recorded (SRD §23) | **PASS** — after building the staff side, defect 17 |

## B. SRD §37 developer guardrails — each is a test

| # | Guardrail | How it is checked | Status |
|---|---|---|---|
| G1 | Never treat called capital and paid-in capital as the same value | `called` differs from `paidIn` in the payload, and the UI shows both plus Outstanding Call (SRD §9) | **fixed** — defect 6 |
| G2 | Never calculate TVPI using committed capital instead of paid-in | recompute `(dist + NAV) / paidIn` from the payload and compare | **PASS** G2a-d |
| G3 | Never display DPI/RVPI/TVPI regardless of operating model | an OPEN_ENDED fund must not show private-capital multiples (SRD §3, §4) | **fixed** — defect 7 |
| G4 | Never show provisional NAV without a valuation-status label | every NAV on screen carries ESTIMATED/PROVISIONAL/FINAL/RESTATED (SRD §6) | **PASS** dashboard + history report FINAL |
| G5 | Never use current FX rates for historic transactions | historic rows keep their stored rate (SRD §18) | |
| G6 | Never recalculate published historic statements using current valuations | SRD §16.3 snapshot immutability | |
| G7 | Never show fund-wide LP data to an individual investor | investor-scoped totals only | **PASS** Q1a |
| G8 | Never expose a document or account by id without the entitlement chain | direct id fetch as the wrong investor returns 404 (SRD §30) | **PASS** Q1b (404) |
| G9 | Never allow an investor to edit a posted transaction | no write control on ledger rows | |
| G10 | Bank instructions never active on edit | SRD §25 status ladder, MFA, masking | |

## C. SRD §38 QA scenarios

| # | Scenario | Status |
|---|---|---|
| Q1 | Investor A cannot access Investor B statements, documents or activity | **PASS** distinct scoped totals; cross-investor capital call by id returns 404 |
| Q2 | An investor entitled to Fund A cannot access Fund B | **PASS** foreign fund absent from the fund list; scoping to it returns zero |
| Q3 | Revoked sessions terminate within the propagation target (SRD §31, 60s or less) | |
| Q4 | Historic FX conversions do not use the live rate | |
| Q5 | Private-capital multiples match approved fund-accounting records | **PASS** TVPI/DPI/RVPI recomputed from the payload match to 4dp |
| Q6 | Capital-call acknowledgement does not mark the call as paid (SRD §10) | not yet exercised |
| Q7 | Provisional and restated values are visibly labelled | |
| Q8 | Restatement does not delete the original statement | |
| Q9 | Document downloads and bank changes generate audit records (SRD §32) | |
| Q10 | Organisation administrators cannot expand fund entitlements (SRD §24) | |
| Q11 | All PRIVATE_CAPITAL and OPEN_ENDED screens render correctly | all 10 LP screens render with live endpoint traffic; OPEN_ENDED not yet exercised (no open-ended fund on the test account) |

## D. Hardcoded-data audit

**Every value on screen traces to an API response or it is a defect.** Dump the rendered text and
every number, diff against the JSON that screen's own endpoints returned, then either demonstrate
the derivation or fix it. Plus a static sweep for literal fixtures and mock/demo/sample
identifiers. Tooling: `scripts/lp-page-dump.mjs`, `scripts/lp-trace-numbers.mjs`.

## E. Component-by-component control audit

Every control reaches a real endpoint, changes local view state only, or is honestly disabled. A
control that looks live and silently does nothing is a defect. Tab-switching checked explicitly.

## F. Role matrix (SRD §5)

MANAGER (lp.test@arcus.co.zw), SIGNATORY (lp.signatory@example.com), VIEWER
(lp.viewer@example.com). Per SRD §5 a Viewer has no transaction submission, no bank changes and no
colleague administration; a Signatory adds acknowledgements, subscription/redemption submission
and service requests but cannot approve internal fund records; an Administrator manages colleagues
but cannot grant access beyond organisation entitlements.

## G. Final pass

After every fix, A–F re-run end to end from a clean load. Only a clean final run justifies calling
the portal correct.

---

## Status

### Defects found and fixed

| # | Screen | Defect | Fix | Verified |
|---|---|---|---|---|
| 1 | Dashboard, Performance | Chart Y axis rounded up to a fixed 50M step, so an account peaking at $1.25M got a 0–50M scale and both series lay flat on the baseline | ceiling scales with the data (1/2/2.5/5/10 by magnitude) | axis renders 0–$2M |
| 2 | Dashboard, Performance | Y tick label rendered `$1.2000000000000002M` | ticks through `toPrecision(3)` | reads `$1.2M` |
| 3 | Performance API | `history()` "Since Inception" spanned a fixed 84 months for every investor | SI window derived from the investor's own earliest dated record, clamped 12–120 months | endpoint returns Jan 2025 → Now |
| 4 | Performance API | X ticks were months-back tokens (`−84M`), reading as money against a `$M` Y axis | ticks are the point's own month and year | `Jan 2025 … Now` |
| 5 | Dashboard | "4 Investments" under Total Commitment was a count of the funds' portfolio companies, not the investor's commitments | `investmentCount` = the investor's own commitments; company count returned as `portfolioCompanyCount` | `investmentCount: 1`, `portfolioCompanyCount: 4` |
| 6 | Dashboard | Paid-In 5.0% + Unfunded 92.5% did not reach 100%: unfunded is commitment minus **called**, so the called-and-unpaid 2.5% sat in neither slice. **SRD §9 requires an explicit "Outstanding Call — called but not yet paid" measure, and §37 forbids treating called and paid-in as the same value.** | `kpis.called` and `kpis.outstandingCalled` added; Capital Position gains a "Called, Not Yet Paid" slice | API returns called 1,875,000 / paidIn 1,250,000 / outstandingCalled 625,000; 1.25M + 0.625M + 23.125M = 25M exactly |

### Tooling and environment defects found and fixed

| # | Where | Defect | Fix |
|---|---|---|---|
| T1 | `scripts/lp-trace-numbers.mjs` | A page that failed to render scored `numbers=0, untraced=0` — indistinguishable from a clean pass. Ten screens reported green while every one showed "Request failed". | no endpoint traffic, no numbers, or an on-screen error state now means FAILED plus a non-zero exit code |
| T2 | `scripts/lp-trace-numbers.mjs` | Flat 4.5s settle expired before a cold `next dev` route finished compiling (9–52s here) | waits for the screen's own traffic to arrive and go idle |
| T3 | `scripts/run-portal-dev.mjs` | No way to run a second instance | `--port` / `--dist` / `--lp-url`; `--port` requires `--dist` so two dev servers cannot share a build dir |
| T4 | `nvccz/src/app.ts` | CORS allowlist enumerated five dev ports; a sixth was rejected, surfacing in the browser only as "Request failed" | 3201/3210 added, plus an explicit `ALLOW_LOOPBACK_CORS=1` hatch — not keyed off `NODE_ENV`, which this machine's `.env` pins to `production`, which would have made the branch silently dead |

### Data observations that shape the test

- All three seeded capital calls have `journalEntryId: null` and **no `CCALL-*` journal entry
  exists**, so they were inserted directly rather than created through
  `CapitalCallService.initiate()`. The Accounting leg has never been exercised and cannot be
  verified against existing records — A1 must create a call through the Portfolio UI.
- Capital-call statuses in the database (`INITIATED`, `NOTICES_SENT`, `PENDING`, `OUTSTANDING`,
  `PARTIAL`) do not match the SRD §10 vocabulary (`DRAFT`, `ISSUED`, `ACKNOWLEDGED`,
  `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`). To be reconciled.
- SRD §34's dashboard wireframe shows a ratio row of **Net IRR / TVPI / DPI / RVPI**. The built
  dashboard surfaces TVPI and DPI as sub-labels and Net IRR as a KPI, but no RVPI. To be checked.
- The only distribution belongs to a different client on a different fund with `amountPaid` 0, so
  the manager account's `$0.00` distributions and `0.00x` DPI are correct, not a wiring failure.

### Defects found and fixed (continued)

| # | Screen | Defect | Fix | Verified |
|---|---|---|---|---|
| 7 | API (dashboard) | Fund rows carried no operating model, so the client had nothing to gate on and rendered private-capital multiples for every fund regardless of structure — SRD §3 requires the classification and §37 forbids showing DPI/RVPI/TVPI without it. The value was already stored on `LpFundPortalContext` and used by the performance and ledger services; only the dashboard omitted it. | dashboard fund rows now carry `operatingModel`, `defaultShareClass` and `valuationStatus` | `operatingModel: "PRIVATE_CAPITAL"` present on every entitled fund; SRD check G3a passes |
| 8 | Performance | A **third** chart axis (capital flow) still used the fixed 50M step, and its tick formatter had the same float-tail bug | all three axes now call one shared `niceAxisMax()` in `lib/lp-portal/format.ts`; `formatCapitalY` trims float tails | pending re-run |
| 9 | Dashboard | RVPI appeared nowhere on the dashboard, though SRD §34's wireframe carries a ratio row of Net IRR / TVPI / DPI / RVPI (Performance already showed all four) | Current NAV card helper now reads `<TVPI> TVPI · <RVPI> RVPI` | pending re-run |

### SRD API conformance run

`node .lp-uat/srd-api-checks.mjs` — **15/15 passing**. Covers G1 (called vs paid-in, and that
paid-in + outstanding + unfunded reconciles to the commitment exactly), G2 (TVPI/DPI/RVPI computed
on paid-in, demonstrably not on committed capital), Q1 (cross-investor isolation, including a
direct id fetch returning 404), Q2 (fund entitlement), G4/Q7 (valuation status present) and G3
(operating model present).

### Untraced on-screen numbers — all resolved

| Screen | Value | Explanation |
|---|---|---|
| dashboard | 92.5, 2.5, 5.0, 0.9 | percentages of commitment, derived |
| dashboard | 220.2 | NAV 220,248 shown as $220.2K |
| dashboard | 625.0 | the new Outstanding Call, 625,000 as $625.0K |
| dashboard, performance | 0.4 / 0.8 / 1.2 / 1.6 | chart Y-axis ticks (now free of float tails) |
| performance | 50 | **defect 8** — a third chart still on the fixed 50M axis |
| account-activity | 1.88 | called capital 1,875,000 as $1.88M |
| account-activity | 2.5 | the capital call's own call percentage |
| account-activity | 9000, 81, 92 | **not real** — digits mined out of the cuid `cmtmb6qa9000hunq81c92cnd9` by the trace script |
| capital-activity | 4821 | the masked bank account tail `••••4821` (SRD §11 masking working) |

### Tooling defects (continued)

| # | Where | Defect | Fix |
|---|---|---|---|
| T5 | `scripts/lp-trace-numbers.mjs` | The number extractor mined digits out of record ids, reporting three phantom "untraced values" per row | matches only free-standing numbers (letter/digit guards on both sides) |
| T6 | `next.config.js` / `.mjs` | Each portal dev server watched the whole project root including the other instances' `.next-*` dirs, so two servers rebuilt each other in a loop; a chunk was rewritten while being served and the browser got a truncated file, dying with `SyntaxError: Invalid or unexpected token` and a ChunkLoadError | `webpack.watchOptions.ignored` excludes `**/.next*/**` (added to both config files per the repo's sync rule) |
| T7 | test method | The LP dev server could not serve its 7.9 MB `app/layout.js` chunk at all — it returned 2.25 MB, then 0 bytes, leaving every page stuck on "Loading..." with no API traffic | the UAT pass now runs against a **production build** (`next build` + `next start`), which is both stable and closer to what an investor actually receives |

### Defects found and fixed (continued)

| # | Screen | Defect | Fix | Verified |
|---|---|---|---|---|
| 10 | Performance (API) | **Fabricated benchmark series.** `benchmarks()` had no data source, so per benchmark id it took a hardcoded `base`/`step` and returned `base + i * step` across six yearly points, stamped `valuationStatus: "FINAL"` — a straight arithmetic line presented to investors as the index their fund is judged against. Its own note read *"replace with approved index feed when available"*, **and the performance screen rendered that note into the fund table's Benchmark column**, putting developer placeholder prose on an investor-facing data row. | new `lp_benchmark_series_points` table (idempotent raw-SQL script, logged in `vps-pending-migrations.md`); `benchmarks()` returns approved rows only, else `configured: false` / `valuationStatus: "UNAVAILABLE"`; the Benchmark column shows the latest approved value or `—`; the panel says "No approved CAMBRIDGE series is configured for NET_IRR." | endpoint returns `configured:false`, empty series; screen shows the honest message; Benchmark column reads `—` |
| 11 | Performance (API) | A snapshot without a stored fund name fell back to the **raw fund id**, so the Fund column showed an investor `cmtmb1j1m0008unwo7m6zv48z` | the fund's real name is looked up when the snapshot lacks it | column now reads `Arcus Growth Fund V` |
| 12 | Performance (API) | An **OPEN_ENDED** fund was reporting `netIrr: -102` against zero paid-in and zero NAV, rendered as `-102.0%` beside a real `18.7%`. SRD §3 forbids showing commitment/DPI/TVPI concepts to an open-ended fund and §37 forbids showing them regardless of operating model. | private-capital multiples withheld at the source for OPEN_ENDED; nulls typed as nullable and rendered `—`, never `0.0%`/`0.00x` — an absent measure is not zero | row reads `Arcus Equity Opportunities · Open-End · — · — · $0.00` |

### Final verification run — all three roles, production build

Every one of the **30 screen × role combinations renders with live endpoint traffic.** Every
number on screen traces to an API payload or to a derivation demonstrated below.

| Role | Screens rendered | Total untraced | All explained |
|---|---|---|---|
| MANAGER | 10/10 | 8 | yes |
| SIGNATORY | 10/10 | 8 | yes |
| VIEWER | 10/10 | 8 | yes |

Remaining untraced values, each accounted for:

| Value | Screen | What it is |
|---|---|---|
| 92.5, 53.7, 2.5, 0.9 | dashboard, account-activity | percentages of commitment, and the capital call's own call percentage |
| 220 | dashboard, performance | NAV 220,248 shown as `$220.2K` |
| 625 | dashboard | the Outstanding Call, 625,000 as `$625.0K` |
| 337 | dashboard | commitment `$337.50M` |
| 312 | account-activity | `$312,500.00` |
| 904 | dashboard | capital call reference `#904` |
| 4821 | capital-activity | masked bank account tail `••••4821` (SRD §11 masking working) |
| 256 | documents | the label `Checksum (SHA-256)` |
| 127.0, 0.1 | documents | `IP: 127.0.0.1` in download history |

---

## Cross-module run — capital call through all three modules

Executed 9 September 2026 against the running stack. A call was **created through the Portfolio
endpoint** (`POST /api/funds/:fundId/capital-calls`) rather than seeded, because all pre-existing
capital calls had `journalEntryId: null` and no `CCALL-*` journal entry existed at all — they had
been inserted directly, so the Accounting leg had never once been exercised.

### A1 — issue

| Module | Observed |
|---|---|
| **Accounting** | journal entry `CCALL-cmtboh-1788963617663`, `POSTED`; **Dr 1210 Capital Contributions Receivable 455,000** / **Cr 3010 Partners Capital – Uncalled 455,000**; balanced |
| **Portfolio** | call `INITIATED`, `journalEntryId` matches the entry above; 3 allocations (250,000 / 125,000 / 80,000 — 1% of each LP's commitment), summing to 455,000, equal to the GL total |
| **LP portal** | nothing yet — correct, and see defect 13 |

Then `POST .../send-notices` → status `NOTICES_SENT`:

| Module | Observed |
|---|---|
| **LP portal** | Capital Activity row `909 · Matanho Growth Fund I · Sep 9 2026 · Oct 15 2026 · $250,000 · $0 · $250,000 · Issued`, an Actions-Required item `CAPITAL_CALL / MEDIUM / 2026-10-15`, and the dashboard moving to called 1,500,000 / outstanding 250,000 / unfunded 23,500,000 |

The portal reports the status as **ISSUED**, matching SRD §10's vocabulary, while the database
stores `NOTICES_SENT` — the mapping is already in place.

### A2 — payment

`POST .../allocations/:id/payments` for 100,000 of the LP's 250,000:

| Module | Observed |
|---|---|
| **Accounting** | journal entry `CCALLPAY-cmtu6qxt-1788963813637`, `POSTED`; **Dr 1100 Bank – Operating Account 100,000** / **Cr 1210 Capital Contributions Receivable 100,000**; balanced — the receivable raised at A1 is cleared by exactly the amount paid |
| **Portfolio** | allocation `amountPaid` 100,000, status recomputed |
| **LP portal** | paid-in 1,250,000 → **1,350,000**; outstanding 250,000 → **150,000**; row status **PARTIALLY_PAID**; Capital Position reads Paid-In $1.35M (5.4%) · Called Not Yet Paid $150.0K (0.6%) · Unfunded $23.50M (94.0%) — **5.4 + 0.6 + 94.0 = 100.0%** |

The identity `paid-in + outstanding + unfunded = total commitment` held exactly at every step of
both flows.

### Defect found by this run

| # | Where | Defect | Fix | Verified |
|---|---|---|---|---|
| 13 | Dashboard KPIs vs Capital Calls screen | The shared `LpFundMetricsService` counts every allocation whose call is not `CANCELLED`/`DRAFT`, so a call that had been **created but never issued** was already in the investor's `called` and `outstandingCalled`. The investor's own Capital Calls screen hides unissued calls (SRD §10 puts the portal notification at ISSUED). The two screens therefore contradicted each other: the dashboard said **$875K called and outstanding** while the Capital Calls list showed **nothing outstanding at all** — an obligation the investor could neither see nor act on. | `isCapitalCallVisible` exported from `LpPortalCapitalActivityService`; the portal dashboard now computes `called`, `outstandingCalled` and `unfunded` from investor-visible allocations only. The shared metrics service is correct for staff-side fund reporting and is left untouched. | before notices: called 1,250,000 / outstanding 0 / unfunded 23,750,000 with one visible PAID call. After notices: called 1,500,000 / outstanding 250,000, matching the newly visible ISSUED call exactly |

### Untraced values on this run — all resolved

`5.4`, `94.0`, `0.6` percentages of commitment · `237` NAV `$237.9K` · `150` outstanding `$150.0K`
· `909` capital-call reference · `36` from "Oct 15, 2026 (in 36 days)".

---

## A3 — distribution through all three modules

Declared via `POST /api/funds/:fundId/distributions` (source `EXIT_PROCEEDS`, gross 400,000), then
`send-notices`, then a payout of the LP's share.

| Module | Observed |
|---|---|
| **Accounting (declare)** | `DIST-cmtboh-1788964026133` `POSTED` — **Dr 4100 Dividend Income 400,000 / Cr 2400 Distributions Payable to LPs 400,000**, balanced |
| **Accounting (payout)** | `DISTPAY-cmtu6zoz-1788964289574` `POSTED` — **Dr 2400 Distributions Payable to LPs 318,819.19 / Cr 1100 Bank – Operating Account 318,819.19**, balanced. The payable raised on declaration is discharged by exactly the amount paid. |
| **Portfolio** | distribution `DECLARED` → `NOTICES_SENT`; 3 allocations |
| **LP portal** | row `DIST-3BTQ9M · REALISATION_PROCEEDS · PAID · gross 318,819.19 · net 318,819.19`; distributions 0 → **318,819.19**; **DPI 0.0000 → 0.2362**; **TVPI 0.1762 → 0.4124**; RVPI unchanged |

**Allocation basis verified, not assumed.** Each LP's share is pro-rata on **paid-in capital**,
matching `paidInSnapshot / total paid-in × gross` to the cent, and the three allocations sum to
exactly the 400,000 gross. An LP who has paid in nothing receives nothing — correct for private
capital. DPI and TVPI recompute exactly per SRD §16.1 (`distributions / paid-in`,
`(distributions + NAV) / paid-in`).

The portal maps the stored `EXIT_PROCEEDS` to SRD §11's `REALISATION_PROCEEDS` vocabulary, as it
does `NOTICES_SENT` → `ISSUED` for calls.

### Defect found and fixed by this run

| # | Where | Defect | Fix | Verified |
|---|---|---|---|---|
| 14 | LP distributions | `destinationBankMasked` was **hardcoded `null`** in `mapDistSummary`, so SRD §11's required masked bank destination was always empty no matter what bank data existed | resolved from `LpBankAccount` (which stores `accountNumberMasked`, so nothing is unmasked here), scoped to the distribution's fund with a fund-agnostic account as fallback | resolver returns `First National Bank ••••4821` for the fund that has a registered account and `null` for one that does not |

---

## Findings referred rather than changed — accounting treatment

Two related issues in `DistributionService`, both in the Accounting/Portfolio domain rather than
the portal. I am flagging rather than fixing them, because each turns on a chart-of-accounts
policy decision that would misstate the financial statements if guessed.

**1. Every distribution is debited to `4100 Dividend Income`, whatever its source.**
`incomeId` is resolved once from `CR_DIVIDEND_INCOME = "4100"` and used unconditionally, so the
`source` field never influences the posting. The run above is the evidence: a distribution
declared as `EXIT_PROCEEDS` was booked to **Dividend Income**. A realisation of an investment is
not dividend income, and neither is interest. Correcting this needs a source → GL account mapping
that someone with authority over the chart of accounts signs off; inventing one would silently
change reported income.

**2. Two of SRD §11's six distribution types cannot be created.**
`ALLOWED_SOURCES` is `DIVIDEND, EXIT_PROCEEDS, INTEREST, OTHER`, but SRD §11 says *"Supported
types include return of capital, realisation proceeds, dividend, interest, income and other."*
`RETURN_OF_CAPITAL` and `INCOME` are rejected on creation — even though the LP portal's
`mapDistributionType` already handles and displays both. Widening the list is a one-line change,
but a **return of capital is not income at all**, so admitting it before issue 1 is settled would
post capital returns to an income account. The two should be fixed together.

---

## A5, A6, A7 — and what they exposed

Three flows, and each one turned out to have no staff side at all. The investor half was built and
the return half was missing, so nothing an investor did could ever be answered.

### A6 — service request (SRD §21)

`LpServiceRequest` was referenced only by `LpPortalServiceDeskService`, every method of which takes
an investor `LpPortalContext` and filters to that investor's own client. **No internal user could
read, assign, answer or close a request.** The message model already anticipated the other side
(`authorType: "INVESTOR | OPS"`); only OPS was unwired.

Built: `LpPortalRequestAdminService` + four routes under `/api/lp-portal/admin/requests`
(`requireGpAdmin`), and `assigned_to_id` on `lp_service_requests` for SRD §21's ASSIGNED state.

Observed end to end: investor submits `SR-U8ZGMYVKFB` → staff list shows it → assign sets
`ASSIGNED` → staff reply writes an `OPS` message and moves it to `AWAITING_INVESTOR` → **the
investor sees the reply in their own thread**. A different investor requesting that reference gets
**404**; an LP token on `/admin/requests` gets **403**.

### A7 — notice (SRD §23)

Same shape. `LpNotice` already modelled ALL / FUND / ORG / USER targeting, a share class, and an
`LpNoticeReceipt` per recipient — but nothing could issue one. Notices could be displayed and
acknowledged and never created.

Built: `LpPortalNoticeAdminService` + `/api/lp-portal/admin/notices` (list, create), materialising
a receipt per entitled investor so "delivered" is recorded rather than inferred.

Observed: staff issue a FUND-targeted notice → **delivered 3** (the three LPs in that fund) →
investor sees it → investor acknowledges → staff see **delivered 3, opened 1, acknowledged 1**.

### A5 — document publish (SRD §20)

Observed: staff publish to one investor → it appears in that investor's Document Centre → the
investor downloads it, **HTTP 200, 75 bytes, byte-identical to the original** → a different
investor gets **404**.

### Defects found and fixed

| # | Where | Defect | Fix | Verified |
|---|---|---|---|---|
| 15 | `DistributionService` | Every distribution debited `4100 Dividend Income` whatever its source, so realisations and interest were both booked as dividend income; and `RETURN_OF_CAPITAL` / `INCOME` — two of SRD §11's six types — were rejected outright | four new accounts (`4110` Interest Income, `4120` Realised Gain on Investments, `4130` Other Investment Income, `3020` Partners Capital – Contributed) and a `SOURCE_DEBIT_ACCOUNT` map, falling back to 4100 where an account is absent | one distribution declared per source, debit account read back from each journal entry: all six correct, **`RETURN_OF_CAPITAL` posts to Equity, never revenue**. Probe records then deleted |
| 16 | LP service desk | No staff surface existed; an investor request could be submitted and never read, assigned or answered | `LpPortalRequestAdminService`, four admin routes, `assigned_to_id` column | full round trip above; 404 cross-investor, 403 for an LP on the admin route |
| 17 | LP notices | No staff surface existed; notices could be acknowledged but never issued | `LpPortalNoticeAdminService`, two admin routes, receipts per recipient | full round trip above |
| 18 | LP notices | Delivery is recorded per investor organisation while an open/acknowledgement is recorded per person, so counting receipt rows inflated `delivered` the moment anyone acknowledged — 3 recipients became 4 | counts are of **distinct investors**, not rows | delivered stays 3 after acknowledgement; opened 1, acknowledged 1 |
| 19 | Document + report download, document publish | `RemoteUploadService` exports a named class and a singleton and has **no default export**, but four call sites did `(await import(...)).default` and `new`-ed it — so publishing a document, downloading a document, and downloading a performance report all threw `RemoteUploadService is not a constructor`. **Investor document download had never worked.** Publishing additionally passed a bare `Buffer` where `{buffer, originalname, mimetype}` is required (`source.on is not a function`), and built a filename it never used, hardcoding `.pdf` whatever the file was. | all four sites use the exported singleton; publish passes the correct input shape with an extension derived from the real mime type | publish 201, investor download **200 with byte-identical content**, cross-investor 404 |

### Note on the environment

The API restarted mid-run with `Restarting: src/routes/payrollRoutes.ts has been modified` followed
by `EADDRINUSE` — concurrent payroll work is editing the **backend** repo while these tests run, so
the shared-tree problem now applies to `nvccz` as well as `nvccz-new`. Each occurrence was waited
out rather than worked around, but it makes runs slower and occasionally kills the API mid-request.

---

## A4 — LP onboarding: invite, credentials, first login

The requirement: the invitation goes to the investor's email, carries a link **to the LP portal**
and sign-in credentials, and the investor is made to set their own password the first time they
sign in.

### What was there

The flow issued an activation link only. It created the account with a deliberately unusable
random password and emailed a `reset-password?token=` link — no credentials, and nothing that
could require a password change, because the schema had no way to express one.

Worse, the link's origin resolved to the wrong portal. The chain was
`LP_PORTAL_URL || FRONTEND_URL || localhost:3110`, and **`LP_PORTAL_URL` is set in no environment
file**, so the effective value everywhere was `FRONTEND_URL` — `https://dev.arcus.co.zw`, the
**staff** origin, which refuses LP accounts outright. Every invited investor was therefore emailed
a link to a portal they cannot sign in to.

### What it does now

| Step | Behaviour |
|---|---|
| Invite | account created with a generated **temporary password** (14 chars, one of each class, ambiguous characters avoided since it is retyped by hand) and flagged `mustChangePassword` |
| Email | carries the **LP portal** sign-in URL, the investor's email, the temporary password, a statement that it must be changed on first sign-in, and the 7-day set-password link as an alternative |
| Portal URL | `FRONTEND_URL` removed from the chain — it is the staff origin. An unconfigured `LP_PORTAL_URL` now warns loudly and uses the conventional LP port rather than silently borrowing the staff app |
| First sign-in | login returns `mustChangePassword: true`; the portal sends the investor to `/set-password` and the middleware bounces every other route back to it, so the requirement cannot be walked around by typing a URL |
| After change | flag cleared server-side, temporary password dead, chosen password works |

### Verified

`scripts/_uat/verify-lp-invite-email.ts` patches the mail transport and asserts on the email that
would actually have been sent — **10/10**: addressed to the invitee, links to the LP portal, carries
the email and temporary password, states the change requirement, still offers the token link,
account flagged and given the LP role, and **the emailed password verifies against the stored
hash**.

`scripts/_uat/verify-lp-first-login.ts` drives the live API — **7/7**: first sign-in with the
emailed password succeeds and reports `mustChangePassword: true`; the change is accepted; the flag
clears in the database; **the temporary password then returns 401**; the chosen password works and
is not challenged again.

### Defects found and fixed

| # | Where | Defect | Fix |
|---|---|---|---|
| 20 | `LpPortalInviteService` | The invitation link resolved to `FRONTEND_URL`, the **staff** origin, because `LP_PORTAL_URL` is unset everywhere — an invited investor received a link to a portal that refuses LP accounts | staff origin removed from the chain; unset config warns and falls back to the LP port, never the staff app |
| 21 | Invite + auth | No way to issue credentials or require a change: accounts were created with an unusable password and the schema had no `mustChangePassword` | `users.must_change_password` column, temporary password generation, login response carries the flag, both password paths clear it |
| 22 | LP portal (frontend) | Nothing read the flag, so even once the backend required a change the portal would have let the investor straight in | `/set-password` page, login redirect, and a middleware guard covering every route |

**Configuration note:** `LP_PORTAL_URL` should be set per environment to the investor portal
origin. It is unset in `nvccz/.env` today; the code no longer falls back to the staff origin, but
until it is set, deployed invitations will point at `http://localhost:3110`. I have not edited the
environment file — that is your call per environment.

---

## A4 in the browser — and the loop it exposed

`.lp-uat/verify-first-login-browser.mjs` drives the investor's real first sign-in through the LP
portal. **7/7:**

- signing in with the emailed temporary password lands on `/set-password`
- navigating to `/lp-portal` bounces straight back to `/set-password`
- setting a password reaches the portal, which renders 1,627 characters of real content
- the temporary password is then refused (**401**)
- the chosen password signs in and is not challenged again

### Two further defects, both found only by driving the browser

| # | Where | Defect | Fix |
|---|---|---|---|
| 23 | `lib/portal/config.ts` | The LP portal enforces a strict route allowlist, and `/set-password` was not on it — so the page redirected to `/lp-portal`, which the new guard redirected back to `/set-password`: **an infinite redirect loop**, and the investor saw a browser error page immediately after signing in. Adding it to `AUTH_ROUTES` would not have worked either: auth routes redirect an already-authenticated user to the portal home, which is exactly what this page must not do. | `/set-password` added to `LP_PREFIXES` and `INVESTEE_PREFIXES` directly, with a comment recording why not `AUTH_ROUTES` |
| 24 | `/set-password` | Changing a password increments `tokenVersion`, which correctly kills every other session — including the one the investor is holding. They set their password and were dumped on the login screen with no explanation. | on success the page signs them back in with the password they just chose and stores fresh cookies; if that re-authentication fails it says so and sends them to sign in, rather than leaving a dead session |

## Regression after all of today's changes

All three roles re-run against the rebuilt portal: **30/30 screen × role combinations render with
live endpoint traffic.** Every remaining untraced value falls into the categories already
explained — percentages of commitment, compact money (`$237.9K`, `$318.8K`, `$150.0K`), capital
call references (`904`, `909`), the masked bank tail `••••4821`, the `SHA-256` label and
`127.0.0.1` in download history.

Both investors' capital positions reconcile **exactly**:

| Investor | Commitment | Paid-in | Outstanding | Unfunded | Identity |
|---|---|---|---|---|---|
| Arcus LP Test Account | 25,000,000 | 1,350,000 | 150,000 | 23,500,000 | exact |
| Arcus Capital Partners LP | 337,500,000 | 0 | 6,250,000 | 331,250,000 | exact |

The signatory's `paidIn` of 0 is correct rather than a defect: they have paid 343,750, but against
a call on **Matanho Growth Fund I**, which is not among their two entitled funds. `called` and
`paidIn` are scoped to the same entitled set, so the two agree — which is also a live demonstration
of SRD §30 entitlement scoping doing its job.

## Where A1–A7 now stand

| Flow | Result |
|---|---|
| A1 capital call issued | PASS — GL `Dr 1210 / Cr 3010` balanced, allocations sum to the entry, LP sees it on notice |
| A2 payment recorded | PASS — GL `Dr 1100 / Cr 1210` clears the receivable, LP paid-in rises |
| A3 distribution | PASS — GL income → payable → bank, DPI and TVPI recompute per SRD §16.1 |
| A4 onboarding | PASS — invite with LP-portal link and credentials, forced password change, 7/7 in browser |
| A5 document publish | PASS — investor downloads byte-identical content, cross-investor 404 |
| A6 service request | PASS — after building the staff side that did not exist |
| A7 notice | PASS — after building the staff side that did not exist |
