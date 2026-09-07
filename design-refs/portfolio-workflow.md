# Portfolio module — end-to-end workflow (discovery)

**Date:** 4 September 2026
**Type:** Discovery / documentation only — no code, UI or data changes were made.
**Scope:** The deal-lifecycle pipeline is the spine. Funds, Capital Calls, Companies, Reports Vault and E-Signatures are covered only where they attach to that spine.

**Repos cited**
- FE — `C:\Users\lysp\Downloads\nvccz-new` (this repo)
- BE — `C:\Users\lysp\Downloads\nvccz` (separate Express + Prisma API, dev port `3009`)

**Route note:** the module moved from `/portfolio-v11` to `/portfolio` in commits `ba32eef` / `752cfad`. Paths below use the current `/portfolio/*`. Internal directories still carry the old name (`components/portfolio-v11-mock/`, `lib/portfolio-v11/`) — that rename was deliberately deferred.

---

## 0. Headline finding — the starting hypothesis is wrong in one important way

The hypothesis given was:

> applicant submits an application → it becomes a deal → the deal moves through stages → at some point capital calls get triggered/tracked against a fund/deal.

The first three steps are correct. **The capital-call step is not.** There are **two independent tracks** that share only the `Fund` entity:

```
TRACK A — Deal pipeline (Application-centric)
  Funding application → screening → due diligence → term sheet
    → board/IC → implementation → disbursed → PortfolioCompany
                                                    ↓ hands off to Investee Portal V8

TRACK B — Fund capital (Fund + LP-centric)
  Client (LP) → InvestmentCommitment → CapitalCall → CapitalCallAllocation → payments

           the ONLY thing joining A and B is a shared Fund
```

`CapitalCall` has **no** foreign key to `Application`, and no field referencing a deal
(`prisma/schema.prisma:1490-1514` — the model's only relations are `fund`, `currency`, `journalEntry`, `createdBy`, `allocations`). A capital call is a fund manager drawing committed capital from limited partners; it is not triggered by, and does not reference, any individual deal. See §3.

---

## 1. Entry point — public funding application

**Source:** `design-refs/funding-application-public.md`

| Item | Detail |
|---|---|
| URL | `/funding-application` — **no login** |
| Portal | Dedicated Apply portal (`NEXT_PUBLIC_PORTAL=apply`); see `design-refs/funding-application-standalone-domain.md` |
| UI | Multi-step form, `components/funding-application/` |
| Draft | `localStorage` key `arcus-funding-application-draft-v1`, autosaved |
| Files | Upload immediately via public API; URLs stored in the draft |

**Product rule, stated explicitly** (`funding-application-public.md:3-5`): the applicant-facing form must live **outside** the Portfolio staff shell, as its own public URL.

**APIs**

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/applications/upload-documents` | Multipart `files` + `documentTypes`; no `applicationId` → temp media URLs |
| `POST` | `/api/applications` | Final submit, with `documents: [{documentType, fileName, fileUrl, fileSize}]` |

Required document types on submit: `BUSINESS_PLAN`, `PROOF_OF_CONCEPT`, `MARKET_RESEARCH`, `PROJECTED_CASH_FLOWS` (`funding-application-public.md:23`).

**Two side effects fire on `POST /api/applications`** (`funding-application-public.md:30-37`):
1. "Application received" email to the applicant — `EmailNotificationService.sendApplicationReceivedEmail`
2. **AI shortlisting starts** — `ApplicationScoringService` → `ChatGPTService` → `LlmChatService` / DeepSeek

**Staff-side entry point:** `/portfolio/applicant-portal` simply redirects out to the apply URL (`app/portfolio/applicant-portal/page.tsx`; rule at `funding-application-public.md:14-15`). It is a launcher, not a workspace.

---

## 2. The deal pipeline (Track A)

### 2.1 The core structural fact — an application *is* the deal

There is **no separate `Deal` model.** `Application` (`prisma/schema.prisma:1748-1797`) is the single row that travels the whole pipeline. It "becomes a deal" by being assigned a human-readable reference:

> `dealReference` — "Human-readable sequential deal id: `{PREFIX}-{year}-{6-digit-seq}`; PREFIX from env `DEAL_REFERENCE_PREFIX` (default VST)" — `schema.prisma:1776-1777`, counter model `DealReferenceCounter` at `schema.prisma:1800-1805`.

Everything else in the pipeline hangs off it as **1:1 optional relations** (`schema.prisma:1786-1790`):

```
Application
  ├── dueDiligenceReview       DueDiligenceReview?
  ├── termSheet                TermSheet?
  ├── boardReview              BoardReview?
  ├── investmentMemo           InvestmentMemo?
  ├── investmentImplementation InvestmentImplementation?
  ├── documents                ApplicationDocument[]
  ├── tasks                    Task[]
  ├── dealCollaborationLogs    ActivityLog[]
  └── dealExecutionPacks       DealExecutionPack[]
```

`fundId` is **optional** (`schema.prisma:1750`) — an application need not be attached to a fund.

### 2.2 Stage field

`currentStage` is a **free-form `String`**, not an enum, defaulting to `"SCREENING_PENDING"` (`schema.prisma:1752-1753`). Its schema comment lists only some values and trails off in an ellipsis:

```prisma
/// UAT workflow: SCREENING_PENDING, SCREENING, ACTIVE_DD, REJECTED_SCREENING, AUTO_REJECTED, …
currentStage String @default("SCREENING_PENDING")
```

Because it is an unconstrained string there is no single authoritative list. The table below was reconstructed by finding every place the backend **writes** the field.

### 2.3 Stage-by-stage — trigger and writer (verified)

| # | `currentStage` | What moves it here | Written at (BE `src/`) |
|---|---|---|---|
| 1 | `SCREENING_PENDING` | Row created by public submit | default, `schema.prisma:1753` |
| 2 | `SCREENING` | AI scoring runs on the new application | `services/ApplicationScoringService.ts:354, 376, 397` |
| — | `REJECTED_SCREENING` | Screening rejection | `services/ApplicationService.ts:1760` |
| 3 | `ACTIVE_DD` | Due diligence initiated | `services/DueDiligenceService.ts:106, 140` |
| 4 | `TERM_SHEET` | — see oddity below | `services/BoardReviewService.ts:1618` |
| 5 | `TERM_SHEET_CREATED` | Term sheet created | `controllers/TermSheetController.ts:199` |
| 6 | `UNDER_BOARD_REVIEW` | — see oddity below | `services/TermSheetService.ts:586` |
| 7 | `TERM_SHEET_APPROVED` | Term sheet approved | `controllers/TermSheetController.ts:453` |
| — | `BOARD_REJECTED` | Board/IC rejects | `controllers/BoardReviewController.ts:26`, `services/BoardReviewService.ts:1344` |
| 8 | `PORTFOLIO_COMPANY_CREATED` | Portfolio company created | `controllers/PortfolioCompanyController.ts:65` |
| 9 | `INVESTMENT_IMPLEMENTATION` | Implementation initiated | `controllers/InvestmentImplementationController.ts:83` |
| 10 | `DISBURSED` | Funds disbursed | `services/InvestmentImplementationService.ts:1582` |

> **⚠ Oddity — the two term-sheet/board writers are crossed.** `TERM_SHEET` is set by **`BoardReviewService`** (`:1618`) while `UNDER_BOARD_REVIEW` is set by **`TermSheetService`** (`:586`) — the opposite of what the names suggest. This may be intentional (each service advancing the deal *past* its own step) or a genuine mix-up. **Not documented anywhere; not confirmed.**

> **⚠ `BELOW_THRESHOLD`** appears only in `config/swagger.ts:7815, 7842` as an API example. No service writes it. It may be documented-but-unimplemented, or written via a path my search did not match.

### 2.4 How the UI collapses these stages

The Deal Flow kanban does not show the raw stages. `lib/portfolio-v11/adapters.ts:44-78` maps them onto **8 display columns** — Sourcing, Screening, Initial Review, Due Diligence, Investment Committee, Term Sheet, Portfolio, Rejected — via `STAGE_MAP`, applied at `adapters.ts:194-195`:

```ts
const stageKey = String(a.currentStage || a.status || '').toUpperCase()
const stage = STAGE_MAP[stageKey] || 'Screening'
```

> ### 🐞 Confirmed defect — three live stages are missing from `STAGE_MAP`
> The backend actively writes these three, but `STAGE_MAP` (`adapters.ts:44-78`) has no entry for any of them:
>
> | Stage written by BE | Written at | UI result |
> |---|---|---|
> | `TERM_SHEET_CREATED` | `TermSheetController.ts:199` | → falls through to `'Screening'` |
> | `TERM_SHEET_APPROVED` | `TermSheetController.ts:453` | → falls through to `'Screening'` |
> | `PORTFOLIO_COMPANY_CREATED` | `PortfolioCompanyController.ts:65` | → falls through to `'Screening'` |
>
> Because the fallback is `'Screening'`, a deal that has just had its **term sheet approved** or its **portfolio company created** appears to jump *backwards* to the Screening column in the kanban. This is a frontend display bug only — the stored `currentStage` is correct. Reported, not fixed (discovery-only task).

### 2.5 Screens

Deal Flow list: `/portfolio/deals` — fed by `applicationsApi.getAll({ light: true })` → `GET /applications?light=true` (`lib/portfolio-v11/bootstrap.ts` `loadApplicationsScope`; the `light` contract is described in `design-refs/portfolio-v11-deal-detail-backend-asks.md:13-16`).

Deal detail: `/portfolio/deals/detail?id=…` — query-string, not a dynamic segment. It loads in parallel: `applicationsApi.getById` (deliberately **without** `light`, so documents and form data are present), `dueDiligenceApi.getByApplicationId`, `termSheetApi.getByApplicationId`, `boardReviewApi.getByApplicationId` (`lib/portfolio-v11/live-loaders.ts:24`, rationale in `design-refs/portfolio-v11-live-backend.md:13`).

Deal detail tabs (from `data-tab` attributes in `components/portfolio-v11-mock/matanho-portfolio-runtime.js`): Overview, Application, **screening**, Diligence, **term**, **board**, **disbursement**, **documents**.

The documented click-path through those tabs (`portfolio-v11-deal-detail-backend-asks.md:65-73`):

1. Deal Flow → deal detail
2. Application tab — `applicantEmail` / `applicantPhone`
3. Due Diligence tab → **Start due diligence**
4. Term Sheet tab → **Create term sheet**
5. Board tab → **Start board review** (upload IM)
6. Disbursement tab → **Initiate implementation** — *"needs `portfolioCompanyId` after DD complete"*

### 2.6 Two distinct screening scores

Easily conflated; the schema separates them (`schema.prisma:1770-1775`):

- `initialScreeningScore` — the **AI/auto** score
- `screeningScore` — the analyst's *"Initial Screening Scorecard"* (UAT), explicitly *"separate from AI `initialScreeningScore`"*
- `screeningOutcome`
- `screeningRejectionReason` — marked *"Internal only … not sent to applicant in email"*

The FE picks whichever exists, in priority order (`adapters.ts:196`):
`screeningScore ?? initialScreeningScore ?? dueDiligenceScore ?? applicationProgress`, defaulting to `50`.

### 2.7 Due-diligence completion gate

**Source:** `design-refs/dd-term-investee-flow-report.md:15-20`

Completion is gated — `canCompleteDueDiligence()` in the runtime mirrors the backend rule requiring **4 required booleans plus task completion**, not merely score/recommendation/comments. The button renders `disabled` with a tooltip when the gate fails.

After completion:
- Workstreams **lock**. `POST …/assign-task` returns *"Cannot assign workstreams after due diligence is completed"*; `TaskService.updateTaskStage` also blocks DD tasks (`dd-term-investee-flow-report.md:17`).
- The UI auto-switches to the **Term Sheet** tab (`setDealTab('term')` on success, `portfolio-v11-app.tsx`).
- Emails go to both the applicant and the DD reviewer (`sendDueDiligenceCompletedReviewerEmail`).

### 2.8 Compliance gates before money moves

`schema.prisma:1780-1782`:

```prisma
/// Statutory guardrail (RBZ Exchange Control + KYC): fund disbursement APIs require this true.
complianceCleared Boolean @default(false)
kycVerified       Boolean @default(false)
```

`complianceCleared` is a hard precondition for disbursement, enforced backend-side.

---

## 3. Where Capital Calls actually fit

**They are not part of the deal pipeline.** They belong to a fund-and-LP track.

### 3.1 The chain

```
Client (LP)
   └── InvestmentCommitment   (clientId + fundId, @@unique)   schema.prisma:1467-1485
          └── CapitalCallAllocation                            schema.prisma:1517-…
                 └── CapitalCall  (fundId)                     schema.prisma:1490-1514
```

- `CapitalCall` is keyed on `fundId` and carries `callPercent`, `paymentDueDate`, `bankInstructions`, `transactionDate`, `status` (default `INITIATED`), `noticesSentAt`, and an optional `journalEntryId` (`schema.prisma:1490-1503`).
- `CapitalCallAllocation` is the **per-LP line** — schema comment: *"amounts snapshot at initiation; payments update `amountPaid` / `status`"* (`schema.prisma:1516-1522`). It references `capitalCallId`, `clientId` and `investmentCommitmentId`.
- The same `InvestmentCommitment` also anchors `ManagementFeeAllocation` and `DistributionAllocation` (`schema.prisma:1482-1483`) — i.e. fees and distributions are siblings of capital calls, all LP-commitment-scoped.

### 3.2 API and screens

- `GET /funds/{fundId}/capital-calls` — list (`portfolio-funds-capital-backend-asks.md:15`)
- `POST /funds/:fundId/capital-calls` and `…/:id/send-notices` — write actions (`lib/portfolio-v11/actions.ts`)
- Screens: `/portfolio/capital-calls`; also surfaced in the Funds page "Recent Capital Activity" card

Note the fetch is **per fund** — `loadCapitalCallsScope` in `lib/portfolio-v11/bootstrap.ts` iterates funds, and currently also fetches `detail()` for up to 12 calls per fund as a workaround for missing list totals (`portfolio-funds-capital-backend-asks.md:11-36`).

### 3.3 The only link between the tracks

`Application.fundId` (optional, `schema.prisma:1750`), `PortfolioCompany.fundId` (optional, `schema.prisma:1263`) and `CapitalCall.fundId` (required, `schema.prisma:1492`) all point at the same `Fund`. That shared fund is the **entire** relationship. Investing in a deal and calling capital from LPs are independent operations that happen to be denominated against the same vehicle.

---

## 4. Branches, parallel tracks and exit points

### 4.1 Exit points (terminal states)

All map to the UI's **Rejected** column (`adapters.ts:57, 72-77`):

| Stage | Where it comes from |
|---|---|
| `REJECTED_SCREENING` | `ApplicationService.ts:1760` |
| `AUTO_REJECTED` | schema comment `:1752`; no writer located |
| `BELOW_THRESHOLD` | swagger example only — see §2.3 |
| `BOARD_REJECTED` | `BoardReviewController.ts:26`, `BoardReviewService.ts:1344` |
| `REJECTED` / `DECLINED` / `WITHDRAWN` | present in `STAGE_MAP`; no BE writer located |

`BOARD_REJECTED` is re-checked downstream when deciding whether to create a user/company (`BoardReviewController.ts:225`) and drives rejection-flavoured emails (`EmailNotificationService.ts:1298, 2169, 2999`).

### 4.2 Handoff out of the module → Investee Portal V8

**Source:** `design-refs/dd-term-investee-flow-report.md:21-26, 41`

At the term-sheet / DD-completion boundary the module provisions an **external-facing company and login**:

- `BoardReviewService.createUserAndPortfolioCompany` creates the `PortfolioCompany` **and** its `User`, and sends credentials.
- `TermSheetService.createTermSheet` calls the same helper **idempotently**, so a company exists by term-sheet creation too.
- The staff UI's *"Launch investee portal"* opens `/investee-portal-v8` (`__INVESTEE_PORTAL_URL__` / `open-investee-portal`, wired in `portfolio-v11-app.tsx` + `lib/portal/config.ts`).
- The investee then reads their own term sheet at `/investee-portal-v8/terms` via `GET /term-sheets/my`.
- A legacy fully-wired React equivalent also exists at `/application-portal/term-sheets`.

**This is the documented handoff point.** Per scope, the Investee Portal's internals are not covered here — but note that in live mode only its **Terms** page is wired; Overview is partially hydrated and KPI Centre / Reporting / Forecasts / Cap table remain fixtures (`dd-term-investee-flow-report.md:32-41`).

### 4.3 Structural gap — Application → PortfolioCompany is not modelled

`PortfolioCompany` (`schema.prisma:1236-1300`) has `userId` (unique) and an optional `fundId`, but **no `applicationId`** — I grepped the full model body and found no application reference. The link is created *imperatively* by `createUserAndPortfolioCompany`, never captured as a foreign key.

Consequence: there is no queryable path from a portfolio company back to the application that produced it. Anything needing that relationship must infer it via the shared `fundId` or by name/user matching. **Not documented; flagged as a finding.**

### 4.4 Parallel/secondary tracks inside the module

These attach to the module but not to the deal pipeline:

- **Cash & controls** — `/portfolio/cash-accounts`, `cash-ledger`, `cash-reservations`, `statement-imports`, `reconciliations`, `exceptions`, `period-close`. Backed by `investment-ops/*` endpoints (`lib/api/stock-picker-cash-api.ts`).
- **Fund reporting** — `/portfolio/reporting`, `reports-vault`, `mailer-lists`, `fund-performance`, via `fund-reporting/*`.
- **E-Signatures** — `/portfolio/e-signatures`, fed by `/fundraising/agreements`; a handoff point toward the Fundraising module.
- **Companies / LPs** — `/portfolio/companies` (`portfolio-companies/with-investments`), `/portfolio/lps` (`/clients`).

---

## 5. Open questions / undocumented areas

Ordered roughly by how much they'd affect someone building on this.

1. **`currentStage` has no canonical list.** It is an unconstrained `String` (`schema.prisma:1753`) whose own comment is truncated with "…". The §2.3 table is reconstructed from write-sites, not from a spec. **No specification document for the stage machine was found anywhere in `design-refs/` or the handoff-package docs.** If one exists outside the repo it should supersede this.

2. **Three stages missing from the FE `STAGE_MAP`** (§2.4) — `TERM_SHEET_CREATED`, `TERM_SHEET_APPROVED`, `PORTFOLIO_COMPANY_CREATED` silently render as *Screening*. Confirmed by inspection; **no ticket found**.

3. **Crossed term-sheet / board writers** (§2.3) — `TERM_SHEET` written by `BoardReviewService`, `UNDER_BOARD_REVIEW` written by `TermSheetService`. Intentional or a bug? **Unconfirmed.**

4. **`BELOW_THRESHOLD`, `AUTO_REJECTED`, `REJECTED`, `DECLINED`, `WITHDRAWN`** — present in the FE map and/or swagger, but I located **no backend writer** for them. Either dead states, or written through a path my grep missed.

5. **When are the portfolio company and credentials created?** The repo contradicts itself, and *the docs themselves flag it as an open product question*: `portfolio-v11-deal-detail-backend-asks.md:7-8` says creation happens on **DD complete** and asks product to *"confirm intended timing"* versus term-sheet create; `:54-57` repeats the ask. Meanwhile `dd-term-investee-flow-report.md:21` records that term-sheet create now *also* ensures the company idempotently. So today **both** paths create it. **Which is canonical is unresolved.**

6. **No `applicationId` on `PortfolioCompany`** (§4.3) — relationship exists only in imperative code.

7. **Where does an application acquire its `fundId`?** `fundId` is optional on `Application` and I did not trace where it is assigned — whether the applicant picks a fund, an analyst assigns one, or it is inferred. **Unconfirmed.**

8. **`dealReference` assignment timing.** `DealReferenceService` and `DealReferenceCounter` exist (`schema.prisma:1799-1805`), but I did not confirm at which stage the reference is minted — i.e. the precise moment an application "becomes a deal" in the human-readable sense.

9. **`InvestmentMemo` and `DealExecutionPack`** are 1:1 relations on `Application` (`schema.prisma:1788, 1794`) that I did not trace into the UI. The board tab mentions "upload IM", suggesting `InvestmentMemo` is the board-review artefact, but this is **inferred, not confirmed**.

10. **Capital-call `status` values** — `String @default("INITIATED")` with `NOTICES_SENT` seen in an example payload (`portfolio-funds-capital-backend-asks.md:24`). Full lifecycle not enumerated anywhere found.

11. **Task/workstream model.** `Application.tasks` and `TaskService.updateTaskStage` gate DD completion, but the task stage vocabulary was not traced.

### Method note

Priority order followed as instructed: existing documentation first (`design-refs/*`), then UI/route tracing, then schema/code as supporting evidence. Where the three disagreed — notably on portfolio-company creation timing (§5.5) — the disagreement is recorded rather than resolved. Nothing in this document was inferred without either a citation or an explicit "unconfirmed" marker.
