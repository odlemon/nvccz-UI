# Portfolio + Investee Portal — Gap Analysis & Implementation Plan

**Date:** 4 September 2026 · **Scope:** analysis + plan; **staff Phase 0–2 (+ decidable 4/5) implemented 5 Sep 2026**
**Baseline flow doc:** [`portfolio-user-stories.md`](./portfolio-user-stories.md) (3 tracks, 18 epics, 12-touchpoint table)
**Breadth:** every interactive element in both modules (393 staff + all investee controls)

> **Implementation note (5 Sep 2026, staff agent):** Phase 0–2 and decidable Phase 4/5 staff items are marked in Part 2 below. Not deployed. Not committed unless separately requested. Investee Phase 3 owned by parallel agent.

## Definition of done applied

An item is **Done** only if it works end-to-end, is connected to a real API, and a user can complete the action and see the result reflected. Renders-but-does-nothing = gap.

| Status | Meaning |
|---|---|
| ✅ Done | Wired end-to-end to a real endpoint |
| 🟡 Partial | Works in part, or reads live but can't write |
| ⬜ Static | Renders, no backend call — click does nothing persistent |
| ❌ Missing | No UI trigger at all, or handler orphaned |
| ❓ Unconfirmed | Could not verify; check listed |

## How status was determined (method, so it's reproducible)

1. Extracted every action id from the staff runtime (`data-action="…"` + `button('…','id')`) → **393 distinct**.
2. Extracted every action id handled in `lib/portfolio-v11/actions.ts` → **82** (includes `api-*` aliases).
3. Intersected the two sets. An id only fires an API call if it appears in **both**.
4. Repeated against commit `a5cef0f` to separate regressions from long-standing gaps.
5. For the investee portal, checked the host component for a write path and the runtime for `fetch(`.

**Not** based on visual inspection — a control can look finished and be inert, which is exactly what most of these are.

---

# PART 1 — GAP ANALYSIS

## 🔴 Headline finding: the deal lifecycle regressed and is currently unusable

> **Update 5 Sep 2026 (live E2E):** Lifecycle triggers are restored and verified on non-fixture deal `cmto08vnf000hunmkl41hmtqv` (DD → Term sheet PDF). Board IM works after staging to `UNDER_BOARD_REVIEW`. Upload matrix: [`portfolio-investee-upload-audit.md`](./portfolio-investee-upload-audit.md). Text below is historical context for the `ba32eef` regression.

Commit **`ba32eef`** ("Ship portfolio-v11 to /portfolio rename and performance-v22 v24.5 seed") re-generated `matanho-portfolio-runtime.js` from the V25 client package. That file had been **hand-patched** with the deal-lifecycle wiring described in [`dd-term-investee-flow-report.md`](./dd-term-investee-flow-report.md) (28 Aug). Regenerating it **discarded those hand edits**.

**20 action ids were lost. 5 of them still have live handlers in `actions.ts` — the backend wiring is intact but nothing in the UI can trigger it:**

| Orphaned action | What the user can no longer do |
|---|---|
| `start-due-diligence` | Start DD on a deal |
| `complete-due-diligence` | Complete DD (incl. the 4-criteria gate + tab switch) |
| `submit-create-term-sheet` | Create a term sheet |
| `submit-start-board-review` | Start a board review / upload the IM |
| `start-implementation` | Initiate implementation |

**15 further ids lost, no live handler:** `create-term-sheet`, `start-board-review`, `open-dd-assessment`, `view-dd-assessment`, **`open-investee-portal`** (the staff→founder link), **`retry-live-load`** (the error-recovery Retry button), `reload-deal-detail`, `download-deal-document`, `preview-deal-document`, `open-deal-document-external`, `wizard-back`, `wizard-next`, `wizard-step`, `toggle-deal-column`, `open-admin-module`.

**Verification:** `complete-due-diligence` occurs 4× at `a5cef0f`, **0×** at `ba32eef` and 0× today. The runtime is clean vs HEAD, so this is committed, not a dirty working tree.

**Consequence:** Track A cannot progress past screening through the UI. Epics 3.1, 3.4, 3.6, 4.1, 5.1, 6.1 and story 7.2 in the baseline doc are **now false**. So is cross-cutting story X.3 (Retry button).

## 🟠 Second finding: three core actions were never wired (not a regression)

`actions.ts` handles ids the UI has **never** emitted — confirmed absent at `a5cef0f` too:

| actions.ts expects | UI actually emits | Result |
|---|---|---|
| `submit-create-capital-call` / `api-create-capital-call` | `submit-capital-call` | ❌ Capital call creation never fires |
| `send-capital-call-notices` / `send-notices` | *(nothing)* | ❌ Notices can't be sent |
| `submit-add-lp` | `submit-lp` / `add-lp` | ❌ LP onboarding never fires |

By contrast `submit-create-fund` **is** present in both → fund creation genuinely works. These are one-line id mismatches, not missing features.

## Track A — the deal journey (staff)

| Story | Status | Evidence / what's missing |
|---|---|---|
| 1.1 Public application form | ❓ | `/funding-application` is outside both modules; not verified this pass. Check: submit end-to-end and confirm a row appears via `GET /applications`. |
| 1.2 Deals appear on board | ✅ | `loadApplicationsScope` → `GET /applications?light=true` |
| 1.3 Add deal by hand | ✅ | `submit-add-deal` in UI **and** actions.ts → `POST /applications` |
| 1.4 Launch applicant portal | ⬜ | `open-applicant-portal` present, no handler — opens a URL only |
| 2.1 Auto-scoring | ❓ | Score is displayed; scoring itself is backend-side and unverified here |
| 2.2 Screening tab review | 🟡 | Renders from live deal data; criteria table content is fixture-shaped |
| 2.3 Confirm shortlist | ⬜ | `confirm-shortlist` in UI, **no** actions.ts branch |
| 2.4 Re-run screening | ⬜ | `rerun-screening` in UI, no branch |
| 2.5 Request clarification | ✅ | `submit-clarification` wired → `POST /applications/:id/request-clarification` |
| 2.6 Reject / not-meet-criteria | ⬜ | `screen-reject`, `human-review` in UI, no branch |
| 3.1 Start DD | ❌ | **Regressed** — handler alive, trigger gone |
| 3.2 Assign workstreams | ✅ | `submit-dd-task` wired → assign-task |
| 3.3 Record DD assessment | ❌ | **Regressed** (`open-dd-assessment`, `view-dd-assessment` lost) |
| 3.4 DD completion gate | ❌ | **Regressed** — gate logic `canCompleteDueDiligence` absent from runtime |
| 3.5 Lock after completion | 🟡 | Backend still enforces it; the FE affordance was in the lost patch |
| 3.6 Auto-switch to Term tab | ❌ | **Regressed** |
| 4.1 Create term sheet | ❌ | **Regressed** |
| 4.2 Counter-offer | ✅ | `accept-counter`, `retain-position` wired |
| 4.3 Issue for signature | 🟡 | `submit-new-envelope` wired → fundraising agreements. ⚠ But `/e-signatures` **throws** once agreements return ≥1 row (adapter omits `recipients`; renderer calls `.recipients.slice()`), so this breaks on first real use |
| 5.1 Start board review | ❌ | **Regressed** |
| 5.2 Cast IC vote | 🟡 | `final-vote` wired ✅; `vote-approve`/`vote-conditions`/`vote-reject`/`vote-defer` have **no** branch |
| 5.3 Rejection closes cleanly | ❓ | Backend guard; not verifiable from FE |
| 6.1 Initiate implementation | ❌ | **Regressed** |
| 6.2 Release tranche | 🟡 | `confirm-release-tranche` wired ✅; `release-tranche` (the opener) has no branch |
| 6.3 Compliance gate | ❓ | Backend-enforced; not FE-verifiable |
| 7.1 Deal document room | ⬜ | Upload handler exists in actions.ts; the document controls were **lost** in the regression |
| 7.2 Open investee portal | ❌ | **Regressed** — `open-investee-portal` gone |
| 8.1 Drag between stages | ❌ | `change-deal-stage` absent from the runtime; also the stage-map display defect (3 stages fall back to *Screening*) |
| 8.2 Filter/sort/export | ⬜ | Client-side only; `export-deals` has no backend |

## Track B — Investee Portal V8 (founder)

**Decisive finding (updated 5 Sep 2026):** write channel now exists (`lib/investee-portal-v8/actions.ts` + host `matanho:before-action`). Phase 3 T3.1–T3.6 wired; T3.7 vault and Messages remain backend asks. Runtime still has **0** direct `fetch(` — writes go through the host handler.

- `components/investee-portal-v8-mock/investee-portal-v8-app.tsx` listens for `matanho:before-action` and rehydrates via `loadInvesteePortalLiveData`.
- Reads: profile, application, company, termSheets, dashboard, reportingRequests, financialReports.

| Story | Status | Evidence |
|---|---|---|
| 9.1 Account provisioned | ✅ | Backend-side, on DD-complete / term-sheet-create |
| 9.2 Founder signs in | ✅ | Portal loads under applicant auth |
| 9.3 Company name shown | 🟡 | Hydrated from `GET /applicant/company`; surrounding metrics are fixtures |
| 10.1 Read term sheet | ✅ | **The one genuinely live screen** — `GET /term-sheets/my` |
| 10.2 Sign documents | ✅ | `complete-signature` → `signTermSheet()` via `lib/investee-portal-v8/actions.ts` |
| 10.3 Cap table | ⬜ | Fixture |
| 10.4 Governance | ⬜ | Fixture |
| 11.1 See reporting obligations | 🟡 | Live schedule from `getReportingRequests()` when hydrated |
| 11.2 Submit a report | ✅ | Structured submit → drafts + `submitFinancialReportBundle` |
| 11.3 Report KPIs | ✅ | `complete-kpi-submit` → `submitPeriodKPIs()` |
| 11.4 Forecast model | ⬜ | Fixture; state persists only to `localStorage` |
| 12.1 Capital/procurement requests | 🟡 | Founder create/submit → applicant procurement APIs (T4.1 partial) |
| 12.2 Document vault | ⬜ | Inert — backend ask [`investee-portal-v8-backend-asks.md`](./investee-portal-v8-backend-asks.md) |
| 12.3 Messages | ⬜ | Inert; backend ask (same doc) |
| 13.1 Team & access | ⬜ | Fixture |
| 13.2 Settings | ✅ | `save-settings` → `updateProfile` / `updateCompany` / letterhead |

**Phase 3 FE (5 Sep 2026):** write channel + T3.1–T3.6 wired; T3.7/Messages = backend asks. Not deployed / not committed in that pass.

**Good news buried here:** `lib/api/application-portal-api.ts` already exposes **30 methods**, including most of what Epics 10–13 need. Remaining gaps are vault/messages APIs and lower-priority fixtures.

## Track C — fund & LP capital (staff)

| Story | Status | Evidence |
|---|---|---|
| 14.1 Create fund | ✅ | `submit-create-fund` in both |
| 14.2 Onboard LP | ❌ | Id mismatch — UI `submit-lp`, handler `submit-add-lp` |
| 14.3 Fund performance view | 🟡 | Reads live; `GET /funds` has **no** IRR/DPI fields (`lib/api/funds-api.ts`). `adaptFunds` fills IRR/DPI/TVPI/distributed with **deterministic demoSeed fallbacks** when those fields are absent (not literal zeros) — see Corrections |
| 15.1 Raise capital call | ❌ | Id mismatch — UI `submit-capital-call`, handler `submit-create-capital-call` |
| 15.2 LP allocations | ❓ | Backend-side; unverifiable while 15.1 can't fire |
| 15.3 Send notices | ❌ | No UI trigger at all |
| 15.4 Track collection | 🟡 | Register reads live via `loadCapitalCallsScope` (N+1 across ≤20 funds); `adaptCapitalCalls` falls back to `callPercent` as `amount` |
| 15.5 Message LPs | ✅ | `send-communication` wired |

## Supporting workspaces (staff) — every remaining element

Bucketed counts across all **393** staff actions (18 wired = **4.6%**):

| Bucket | Count | Wired | Assessment |
|---|---|---|---|
| submit/create (writes) | 135 | 16 | **119 write controls do nothing** — the core problem |
| open detail/drawer | 54 | 0 | Mostly legitimate — open drawers over already-loaded data |
| export/download | 41 | 1 | 40 exports non-functional |
| filter/search/columns | 22 | 0 | Legitimately client-side over loaded data |
| signature UI | 21 | 0 | Whole signature studio inert |
| editor / report builder | 17 | 0 | Report builder is 100% static (`v9ReportSections` fixture) |
| modal/overlay chrome | 12 | 0 | Legitimate — pure UI |
| preview | 11 | 0 | Previews render fixtures |
| tab switch | 11 | 0 | Legitimate — pure UI |
| other | 69 | 1 | Mixed |

**Reads are the healthy half:** 18 scopes in `bootstrap.ts` are genuinely wired (funds, applications, dashboard, capital calls, companies, LPs, cash accounts/ledger/reservations, statement imports, recon, exceptions, period close, documents, agreements, reporting, mailer, settings).

**Known-broken beyond wiring** (from prior audit, unchanged):
- `/e-signatures` TypeError on non-empty data
- Reports Vault renders blank titles (`adaptReportVault` omits name/version/generated/classification)
- Mailer Lists blank description/owner
- NaN on empty collections (cash accounts, reconciliations)
- `/applicant-portal` hangs on skeleton forever (no scopes → never hydrates)
- No API at all: recon line-pairs, report builder, reporting calendar, analytics trend/variance

---

# PART 2 — IMPLEMENTATION PLAN

Sequenced by dependency. Each task states its precondition, so nothing asks to wire a thing before its model/endpoint is confirmed.

## Phase 0 — Stop the bleeding (blocks everything else)

**T0.1 — Make the generated runtime safe to regenerate.** ✅ *Done (5 Sep 2026). Decision: (a).*
- `scripts/patch-portfolio-runtime.mjs` (idempotent) + `scripts/portfolio-runtime-live-bridge.inc.js`
- Hooked at end of `scripts/extract-portfolio-v25.mjs` (runs patch after overwrite)
- Also keeps `scripts/patch-portfolio-v25-empty-guards.mjs` (invoked from the patch script)
- **nav.ts:** hand `/detail` + `/workspace` branches stay in `lib/portfolio-v11-mock/nav.ts` (extractor does not overwrite this file — protect via source control / do not regenerate from client package)

**T0.2 — Restore the 5 orphaned lifecycle triggers.** ✅ *Done (UI emission + gate).*
Live bridge restores `start-due-diligence`, `complete-due-diligence` (+ `__pv11CanCompleteDD` gate), `submit-create-term-sheet`, `submit-start-board-review`, `start-implementation`. Host still switches to Term tab on `api-complete-due-diligence` / `api-create-term-sheet` success.

**T0.3 — Restore the 15 other lost controls.** 🟡 *Partial.*
Restored priority controls: `open-investee-portal`, `retry-live-load`, `reload-deal-detail`, `open-dd-assessment` / `view-dd-assessment`, deal-document preview/download/external. Wizard/column/admin-module remain client chrome (fall through to base / by-design).

## Phase 1 — Close the three never-wired core actions

**T1.1 — Capital call creation.** ✅ *Done.* Form → `api-create-capital-call` / aliases `submit-capital-call` ↔ `submit-create-capital-call` in `actions.ts` + live `submitCapitalCall`.
**T1.2 — Capital call notices.** ✅ *Done.* “Send notices” on capital-call detail → `send-capital-call-notices` (endpoint confirmed).
**T1.3 — LP onboarding.** ✅ *Done.* `submit-lp` / `add-lp` aliases → `submit-add-lp` / `api-add-lp`.
**T1.4 — Screening decisions.** ✅ *Done (mapped to related APIs).* `confirm-shortlist` → `triggerShortlisting`; `rerun-screening` / `human-review` / `screen-reject` → `analystScreening`. Optional explicit routes: [`portfolio-staff-phase02-backend-asks.md`](./portfolio-staff-phase02-backend-asks.md).
**T1.5 — Individual IC votes.** ✅ *Done.* `vote-approve|conditions|reject|defer` + `final-vote` → `api-cast-ic-vote` / `boardReviewApi.castVote`.

## Phase 2 — Fix what breaks on real data

**T2.1 — `/e-signatures` crash.** ✅ *Done.* Adapter already emits `recipients`; runtime hardened with `Array.isArray(...recipients)` guards + bridge harden-on-render.
**T2.2 — Reports Vault blank fields.** ✅ *Already present* in `adaptReportVault` (name/version/generated/classification).
**T2.3 — Mailer Lists blank columns.** ✅ *Done.* `adaptMailerLists` + types emit `description` / `owner` / `funds` / `consent` / `updated`; runtime defensive defaults.
**T2.4 — NaN guards.** ✅ *Done.* Recon matched avg + companies averages guarded; cashAccounts metric already ternary-guarded; empty-guards script retained.
**T2.5 — `/applicant-portal` infinite skeleton.** ✅ *Done.* `scopesForPage('applicant-portal')` now loads `dashboard` primary so hydrate clears.
**T2.6 — Funds IRR/DPI.** ✅ *BE ask only (no fake adapter).* Removed demoSeed; zeros when absent. Asks: [`portfolio-staff-phase02-backend-asks.md`](./portfolio-staff-phase02-backend-asks.md), [`portfolio-funds-capital-backend-asks.md`](./portfolio-funds-capital-backend-asks.md).
**T2.7 — Stage-map defect.** ✅ *Done.* `STAGE_MAP` adds `TERM_SHEET_CREATED`, `TERM_SHEET_APPROVED`, `PORTFOLIO_COMPANY_CREATED`.

## Phase 3 — Give the investee portal a write path

**T3.1 — Build the write channel.** ✅ *Done (5 Sep 2026).*
`lib/investee-portal-v8/actions.ts` + `matanho:before-action` listener in `investee-portal-v8-app.tsx`; runtime emits cancelable `matanho:before-action` before local stubs. Handler → API → `loadInvesteePortalLiveData` rehydrate.

**T3.2 — Term sheet signing.** ✅ *Done.* `complete-signature` / live Signatures + Terms “Sign term sheet” → `applicationPortalApi.signTermSheet()`. Live signature list derived from `GET /term-sheets/my`.

**T3.3 — KPI submission.** ✅ *Done.* KPI Centre “Submit period KPIs” modal → `complete-kpi-submit` → `submitPeriodKPIs()`.

**T3.4 — Financial reporting.** ✅ *Done (FE wire).* Schedule/history from `getReportingRequests` / `getFinancialReports`; templates → `downloadFinancialReportTemplate`; structured submit/save → draft create + `uploadFinancialReportFile` + `submitPeriodKPIs` + `submitFinancialReportBundle`.

**T3.5 — Settings & company profile.** ✅ *Done.* `save-settings` → `updateProfile`, `updateCompany`, letterhead CRUD (`updateLetterhead` / `uploadLetterheadLogo`).

**T3.6 — Overview dashboard.** ✅ *Done.* Live dashboard renders from already-fetched `dashboard` (+ reporting/financial summaries) instead of fixtures when `liveData` is set.

**T3.7 — Document vault.** ⬜ *Backend ask only* — see [`investee-portal-v8-backend-asks.md`](./investee-portal-v8-backend-asks.md). No fake FE.

## Phase 4 — Close the open loops (needs product decisions first)

**T4.1 — Capital & Procurement Requests.** 🟡 *Decided for staff (5 Sep 2026):* staff destination = Procurement VC investee queue (`GET /procurement/requisitions/investee`). Portfolio module does not add a parallel inbox. Founder write path owned by investee Phase 3 (see T3 / investee asks). Documented in [`portfolio-staff-phase02-backend-asks.md`](./portfolio-staff-phase02-backend-asks.md) §4.
**T4.2 — Messages.** ⬜ *Documented gap — no applicant message API.* Options remain: deal collaboration feed, new investee↔staff thread API, or drop. Staff Portfolio Messages stays unwired pending product pick. See same asks §4.
**T4.3 — Document requests round trip.** Connect staff `request-document` to the founder vault. *Depends on T3.7.*
**T4.4 — Reporting round trip.** Connect staff Reporting Schedules to founder submissions. *Depends on T3.4.*
**T4.5 — Founder counter-offer.** Staff have `accept-counter`/`retain-position` but founders have no UI to submit one. Decide whether counters stay out-of-band. *Skipped (undecidable product drop).*

## Phase 5 — Peripheral controls (lower priority bucket)

Deliberately last — none blocks the core flow.

**T5.1 — Exports.** ✅ *Policy decided (client CSV):* prefer client-side CSV from loaded data. `export-deals` wired in live bridge; many registers already call `exportCSV`. Full audit-pack server skipped (no endpoint). Remaining export buttons can reuse the same helper incrementally.
**T5.2 — Signature studio (21 controls).** Skipped (mega-project).
**T5.3 — Report builder (17 controls).** Skipped (no persistence API).
**T5.4 — Previews (11).** Skipped / per-feature later.
**T5.5 — No action needed (~99).** ✅ *Marked by design (5 Sep 2026).* Filters, tab switches, drawer openers, and modal chrome over already-loaded data are **not gaps**.

## Suggested sequencing

```
T0.1 ─┬─ T0.2 ── T0.3 ─┬─ Phase 1 (T1.1–T1.5) ─┬─ Phase 2
      │                │                        └─ Phase 4 (after decisions)
      └────────────────┴─ T3.1 ── T3.2/T3.3/T3.4/T3.5/T3.6
                                                └─ Phase 5 (anytime, lowest)
```

**Critical path:** T0.1 → T0.2 → T1.x. Until T0.1 lands, any runtime work can be wiped by the next extraction. T3.1 is independent of Phase 0 and can run in parallel by a second person.

## Before starting — confirmations (answered from repo evidence, 5 Sep 2026)

Evidence-only; no Phase 0–5 implementation in this pass. Related docs: [`portfolio-user-stories.md`](./portfolio-user-stories.md), [`dd-term-investee-flow-report.md`](./dd-term-investee-flow-report.md).

### 1. T0.1 option — **recommend (a) post-extract patch script**

| Option | Fit to current tooling |
|---|---|
| **(a) Post-extract patch (recommended)** | `scripts/extract-portfolio-v25.mjs` fully overwrites `matanho-portfolio-runtime.js` (writes at end; no patch hook). A sibling pattern already exists: `scripts/patch-portfolio-v25-empty-guards.mjs` (“Run after extract-portfolio-v25.mjs”). Formalize lifecycle patches the same way so regenerations stay safe. |
| (b) Stop regenerating | Cheaper short-term; abandons client-package upgrades that the extract scripts exist for. |
| (c) Move wiring out of runtime | Cleanest long-term; largest refactor vs how `portfolio-v11-app.tsx` + runtime event injection work today. |

**Decision still required from owners** — recommendation is (a) because extract + optional patch is already how this module is maintained.

### 2. Screening-decision endpoints — **no 1:1 match; related APIs exist**

UI emits toast-only handlers for `confirm-shortlist`, `rerun-screening`, `screen-reject`, `human-review` (`matanho-portfolio-runtime.js` ~2833–2836). **No** matching branches in `lib/portfolio-v11/actions.ts`.

Related backend (not named like the UI ids):

| Endpoint | Role |
|---|---|
| `POST /applications/:id/analyst-screening` | Record Initial Screening Scorecard; below-minimum score rejects (`applicationRoutes.ts`, FE `applicationsApi.recordAnalystScreening`) |
| `POST /applications/:id/trigger-shortlisting` | Trigger shortlisting while stage is screening-pending (`applicationsApi.triggerShortlisting`) |
| `POST /applications/:id/request-clarification` | Already wired via `submit-clarification` |

**Implication for T1.4:** map UI actions onto these (or ask BE for explicit confirm/reject/human-review routes). Do not assume endpoints named like the action ids.

### 3. Applicant document endpoint — **no dedicated vault API**

- `lib/api/application-portal-api.ts`: financial-report file upload and application nested `documents` types exist; **no** list/upload/download vault methods for a general document room.
- `applicantPortalRoutes.ts`: no `/applicant/.../documents` (or vault) routes; document-ish paths are financial-report files / templates.
- Staff/other: `POST /applications/upload-documents`, Investment Ops / Fundraising document rooms — not applicant-portal vault.

**Implication for T3.7:** treat as a **backend ask** (or reuse financial-report / application upload with product agreement) before FE wiring.

### 4. Founder Requests / Messages — **hints, not Portfolio inbox**

| Concern | Evidence | Suggested destination options (product) |
|---|---|---|
| **Requests (capital/procurement)** | Applicant: `POST /applicant/procurement-requests`, `/applicant/procurement/requisitions*` (`applicantPortalRoutes.ts`). Staff: `GET /procurement/requisitions/investee` (+ SLA-breached), FE `procurement-api-v2.ts`. | Wire founder → Procurement VC investee queue; or Portfolio-native inbox; or drop. |
| **Messages** | No `/applicant/.../messages` routes. Staff deal feed: `/applications/:id/collaboration/messages`. LP portal has its own messages (wrong persona). | Reuse deal collaboration; new investee thread API; or drop. |

Original claim “no staff-side inbox” is **too strong for Requests** (Procurement has a VC investee list) and **accurate for a Portfolio-module Messages inbox**.

### 5. Funds API IRR/DPI — **not on list Fund payload → T2.6 is BE (or alternate API)**

- `lib/api/funds-api.ts` `Fund` interface: amounts, industries, status, dates — **no** `irr` / `dpi` / `tvpi`.
- `FundService` / fund list path: no IRR/DPI computation found for that response.
- Separate fund-reporting / LP-portal / portfolio-monitoring surfaces *do* expose dpi/tvpi/netIrr in other modules — not what `adaptFunds(GET /funds)` consumes today.
- `adaptFunds` (`lib/portfolio-v11/adapters.ts` ~80–101): prefers live fields if present; else **demoSeed** illustrative IRR/DPI/TVPI (not hardcoded `0`). Geography falls back to `"—"`.

### 6. Export policy — **product decision (do not pick unilaterally)**

| Option | Pros | Cons |
|---|---|---|
| **A. Client-side CSV/XLSX from already-loaded scope data** | Cheap; covers most of ~40 export controls quickly | Not audit-grade; incomplete if UI page is filtered/paginated |
| **B. Server-generated packs** (per workspace: deals, docs, evidence) | Audit/evidence-ready; consistent with fundraising `documents/export` precedent | Needs BE per export type; larger scope |
| **C. Hybrid** | CSV for registers; server packs for evidence/audit/ZIP | Needs clear product matrix of which controls are A vs B |

Unblocks T5.1 once chosen; no code change in this analysis pass.

---

## Corrections to the pasted analysis (material)

1. **`adaptFunds` “hardcodes IRR/DPI to 0”** — incorrect. It uses deterministic **non-zero demoSeed fallbacks** when API fields are missing. The real gap is **`GET /funds` not supplying those metrics**.
2. **“No staff-side inbox” for founder Requests** — overstated. Procurement exposes `GET /procurement/requisitions/investee` for VC staff; gap is Portfolio/investee UI wiring + product destination, not total absence of a staff list.
3. **Screening endpoints** — analysis correctly said UI has no `actions.ts` branch; clarify that **related** shortlisting/scorecard endpoints exist but are not named `confirm-shortlist` / `screen-reject` / etc.
4. **Headline regression spot-check (verified):** `complete-due-diligence` count in runtime = **4** at `a5cef0f`, **0** at `ba32eef` and **0** on working tree; handlers still present in `lib/portfolio-v11/actions.ts` (`start-due-diligence`, `complete-due-diligence`, `submit-create-term-sheet`, `submit-start-board-review`, `start-implementation`). Capital-call / LP id mismatches (`submit-capital-call` vs `submit-create-capital-call`, `submit-lp` vs `submit-add-lp`) confirmed in runtime switch + `actions.ts`.
5. **Investee write path claim** — confirmed: no `lib/investee-portal-v8/actions.ts`; host only listens for `investee:reload-request`; runtime has **0** `fetch(` calls.

## What I could not confirm

- `/funding-application` end-to-end submission (outside both modules; not exercised this pass)
- Auto-scoring behaviour (backend-side)
- Backend guards for board rejection and the compliance/disbursement gate — visible in code, not exercised
- Whether capital-call LP allocations compute correctly (unreachable while T1.1 blocks creation)
- Live runtime behaviour generally: **the dev server was not running during this analysis**, so all findings are from code, git history and API surface. Recommend one live pass after Phase 0 to confirm the restored flow.

---

**This document:** living gap analysis + plan. Staff Phase 0–2 (+ decidable 4/5) code landed 5 Sep 2026 (uncommitted / not deployed unless noted in chat).
