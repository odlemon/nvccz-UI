# Fundraising — Gap Analysis (requirements recheck)

**Captured:** 2026-07-17
**Method:** Full cross-reference of all 20 tabs against `fundraising-srd.md` + per-tab `fundraising-*-stages.md` + guardrails in `fundraising-frontend.md` + the live contract in `fundraising-frontend-api.md`, vs the actual implementation (`components/fundraising/*`, `lib/api/fundraising-api.ts`, `lib/fundraising/mappers.ts`, `fundraising-create-wizards.tsx`).

**Legend**
- `[FE]` frontend gap — status is shown per item; remaining partials are explicit.
- `[BE]` backend gap — see [`fundraising-backend-asks.md`](./fundraising-backend-asks.md) (gaps 9+).
- Status: ☐ not started · ◐ partial · ✅ done (FE) · ⛔ blocked by BE.

> The per-tab `fundraising-*-stages.md` status tables predate the live-wiring passes and understate current progress. **This file supersedes them for status.**

---

## Cross-tab guardrails (highest priority)

| # | Guardrail | Current | Fix |
|---|-----------|---------|-----|
| G1 | `STAGE_GATE_FAILED` / `ACTIVATION_REQUIREMENTS_UNMET` / `COMPLIANCE_BLOCKED` surfaced as **checklist**, not just toast | Toast-only via `toastFrError` (`lib/api/fundraising-api.ts`) | `[FE]` Reusable unmet-requirements dialog; used on Pipeline board, Campaigns activate, Commitments admit/fund, Onboarding activate |
| G2 | Amount edits require `reason` + immutable history | `patchOpportunity`/`patchCommitment` exist but unused; no edit UI | `[FE]` Amount editor with mandatory reason + history/timeline drawer |
| G3 | Comms / meetings / tasks link to opportunity + investor | `opportunityId` never sent | `[FE]` Add opportunity picker + require investor/opportunity |
| G4 | Independent amount types never overwrite | Display only | `[FE]` per-type editors (Pipeline/Commitments) |

---

## Group A — Foundation (Settings, Campaigns, Investors, Contacts)

### Settings
- ✅ `[FE]` Amount Types enable/disable wired to `patchAmountTypes` (relabel remains backend-contract dependent).
- ✅ `[FE]` Stage-gate rows use configured `stageName`.
- `[BE]` Confirm `GET /fundraising/settings` always returns all 9 amount types (else FE mock fallback).

### Campaigns
- ✅ `[FE]` Communications panel is live; backend-pending Templates, Lists, Events and Materials are explicitly labelled illustrative.
- ✅ `[FE]` Activation-gate failures use the G1 checklist dialog.
- ✅ `[FE]` Approval submit / Pause / Archive / Edit actions are wired through `patchCampaign`.
- ◐ `[FE]` Wizard now captures fund, description, min/hardcap targets, close dates, region tags, segments and owner; product picker/team directory remain contract-dependent.
- ◐ `[FE]` Export button remains backend-pending; static as-at date was removed.
- `[BE]` Campaign templates / distribution lists / roadshow events / materials resources.
- `[BE]` Campaign submit-for-approval + pause endpoints.

### Investors
- ✅ `[FE]` Investor 360 now exposes tabbed contacts, pipeline, meetings, documents, communications, commitments, KYC and activity.
- ✅ `[FE]` `getRelationshipSummary` feeds the KPI strip.
- ◐ `[FE]` Create wizard missing SRD fields (tradingName, registrationNumber, jurisdiction, relationshipOwner, source, sanctions/risk/classification, eligibility, asset-class/geographic prefs, nextAction).
- ◐ `[FE]` Edit/archive wired through `patchInvestor`; export remains backend-pending.
- `[BE]` `GET /investors` extended filters (country, jurisdiction, KYC, sanctions, risk, classification, campaign, AUM range, ownerId).
- `[BE]` Duplicate-org rejection error code/message contract.
- `[BE]` List rollup fields (commitmentsSummary, openOpportunities, lastContactAt, relationshipOwnerName).

### Contacts
- ✅ `[FE]` Removed the 20-org cap and paginated investor loading before contact aggregation.
- ✅ `[FE]` Contact edit/archive actions use `patchContact`/`archiveContact`.
- ◐ `[FE]` Department and Investor 360 deep-link added; export and global contact comms history remain backend-pending.
- `[BE]` Global `GET /contacts` (or `/investors/contacts`) paginated cross-org index with filters.
- `[BE]` `GET /fundraising/communications?contactId=` for contact comms history.

---

## Group B — Pipeline & activity (Pipeline, Communications, Meetings, Mandates)

### Pipeline
- ✅ `[FE]` Overview campaign type is passed to `listOpportunities`.
- ◐ `[FE]` Funnel / capital chart / upcoming / recent activity are mock (`pipeline-mock-data.ts`) → live (`getDashboard`, analytics funnel, meetings, comms).
- ✅ `[FE]` Opportunity drawer includes amounts/history/status controls.
- ✅ `[FE]` Amount edit requires reason and refreshes immutable history (G2).
- ✅ `[FE]` Lost/on-hold opportunity actions are wired.
- ✅ `[FE]` Failed board moves surface the G1 checklist.
- ◐ `[FE]` Board column totals + card probability missing.
- ◐ `[FE]` Wizard missing owner, primary contact, fund/product, full amount types.
- `[BE]` Analytics funnel/time-series for live overview charts (confirm which endpoint feeds capital chart).

### Communications
- ◐ `[FE]` Create payload now sends outcome/sentiment/nextAction/dueDate/**opportunityId**; participants/contact remain contract-dependent.
- ◐ `[FE]` Detail includes opportunity; advanced filters and export remain backend-pending.
- `[BE]` Secure share links (expiry/limits/watermark) for comms attachments; `opportunityId`/`contactId` query filters.

### Meetings & Tasks
- ✅ `[FE]` Meeting/task creation sends `opportunityId`; tasks include description and assignee (G3).
- ✅ `[FE]` Meetings use the Events Management calendar design; agenda and structured completion outcomes are wired; all video-join behavior was removed.
- ◐ `[FE]` Related-opportunity display remains compact and export is backend-pending.
- ✅ `[BE]` Outcome-rich meeting completion is shipped: atomic notes/outcome/decisions/actions, optional linked tasks/communication and idempotency.

### Mandates & RFPs
- ◐ `[FE]` Mandate/RFP filters are functional; KPI strip and server pagination remain partial.
- ◐ `[FE]` RFP create is wired; outcome/debrief PATCH remains partial.
- ◐ `[FE]` Stage taxonomy still mock-derived (4 coarse stages) vs AM pipeline; no onboarding handoff link.
- ◐ `[FE]` Detail missing contacts/interactions/documents/meetings panels; tender pack UI missing.
- `[BE]` `POST /fundraising/rfps` + `PATCH /fundraising/rfps/:id` (outcome, commercial); mandate/RFP stage field or AM-opportunity mapping; tender/proposal version + approval routing; auto onboarding case on Won.

---

## Group C — Evidence & legal (Due Diligence, Data Rooms, Documents, Agreements)

### Due Diligence
- ◐ `[FE]` DDQ header bar and status lifecycle controls added; category checklist remains in the matrix.
- ◐ `[FE]` Matrix missing owner/due/version cols + inline status edit (`patchDdqCase` unused).
- ◐ `[FE]` DDQ lifecycle transition UI is wired; export/archive remain backend-pending.
- ⛔ `[FE]` Q&A / requests drawer, answer library, reviewer comments/approvals → need BE.
- `[BE]` DDQ item-status PATCH; Q&A thread endpoints; answer library; reviewer comments/approvals/submission history; evidence download; export; archive; DDQ case status transition body.

### Data Rooms
- ✅ `[FE]` Folder file listing and `downloadDataRoomDocument` are wired.
- ◐ `[FE]` Invite/upload permission granularity (viewOnly/downloadLimit/watermark/expiry) missing; watermark/expiry on create.
- ◐ `[FE]` Seed folder structure on create; export toast-only.
- ⛔ `[FE]` Revoke/expire actions → need BE.
- `[BE]` Revoke access / revoke-room; access-grant fields (view-only, download limits, contact-level); failed-login + device/country monitoring; per-folder/per-document permissions; watermark/expiry on create.

### Documents
- ◐ `[FE]` Version history, status workflow and supersede warning are wired; existing-document version upload/export remain backend-pending.
- `[BE]` New-version-to-existing-doc endpoint on unified index; per-version download; export inventory.

### Agreements
- ◐ `[FE]` Send dialog now captures `sequenceOrder`/`expiresAt`; provider decline/certificate/signed-copy remain backend-pending.
- ⛔ `[FE]` Real e-sign surface (kept manual-ack; `SignatureMark` is decorative) → need BE provider.
- `[BE]` E-sign provider integration; decline signatory; signed-copy/certificate download; checksum; signature audit trail; `sequenceOrder` enforcement.

---

## Group D — Capital & close (Commitments, Onboarding, Placement Agents)

### Commitments & Closings
- ◐ `[FE]` Register columns ≠ SRD (need Fund, Currency, Signed, Admitted, Funded, Status, Closing); KPI set missing Admitted / Remaining / Investors.
- ✅ `[FE]` Admit is checklist- and compliance-gated; server failures use G1.
- ◐ `[FE]` No amount edit/history (G2); no bulk admit; export toast-only.
- ◐ `[FE]` Closings read-only — wire `createClosing`/`patchClosing`/`postClosingReadiness` (all unused); readiness panel (legal/compliance/fund/equalisation/portal).
- ◐ `[FE]` Post-close panel (LP portal, capital-call contacts, reporting prefs).
- `[BE]` Confirm closing record richness on list/detail; post-close provisioning confirmation; structured `unmetRequirements` on admit/fund failure.

### Client Onboarding
- ◐ `[FE]` Wizard is KYC-only → add LP-Commitment vs Mandate branch.
- ◐ `[FE]` `docsNote` is sent and review/more-info/approve/reject transitions are wired; checklist editing remains contract-dependent.
- ◐ `[FE]` No hold-release action; no LP activation path; Activated-vs-Expected AUM not shown; export toast-only.
- `[BE]` Compliance hold/release entity + endpoint; KYC terminal transitions body (APPROVED/REJECTED/CONDITIONS); persistent unmet checklist on activate failure.

### Placement Agents
- ◐ `[FE]` Added success fee, protected date, restrictions, supporting agreement and edit; multi-geography remains partial.
- ◐ `[FE]` Opportunity link: no unassign / eligible toggle; exclusions display-only (no CRUD/enforcement).
- ◐ `[FE]` Commission ops read-only (no accrue/pay/hold); export toast-only.
- `[BE]` Exclusion enforcement on assign; commission accrual tied to funded covered opps; accrue/pay/hold lifecycle; agent object-level auth (external portal).

---

## Group E — Analytics & governance (Forecasts, Reports, Dashboard, Approvals, Audit)

### Forecasts & Analytics
- ◐ `[FE]` Missing KPIs (Activated AUM, Remaining, monthly/quarterly closings).
- ◐ `[FE]` Owner performance and stage ageing panels are live; concentration/geo/export remain backend-pending.
- ⛔ `[FE]` Assumption sliders don't recalc → need BE recalc endpoint (interim: client projection only).
- `[BE]` `PATCH`/recalculate-from-assumptions endpoint; concentration/geo analytics.

### Reports
- ◐ `[FE]` Catalog incomplete (missing Investor / Commercial / Mandate report cards).
- ◐ `[FE]` "View last run" empty pre-run; role gating.
- ⛔ `[FE]` Configure (schedule/recipients/format/dateRange) not persisted; no artifact export/download → need BE.
- `[BE]` Report schedule CRUD; run history; async job status; artifact (XLSX/PDF/CSV) download.

### Dashboard
- ✅ `[FE]` Recent Activity uses live audit data with mock data only as an empty-state fallback.
- ◐ `[FE]` Upcoming Actions panel absent (meetings/overdue tasks/pending approvals/expiring docs/closings).
- ◐ `[FE]` Missing Gross Pipeline + Expected Revenue KPIs; no trends/sparklines; no opportunity drawer/drill-through; `campaignType` not passed to `getDashboard`; soft-circle summed client-side.
- `[BE]` `expectedRevenue` + period-over-period trend fields on `GET /dashboard`.

### Approvals
- ◐ `[FE]` No deep links to source (objectId unused); source not refreshed after decide; synthetic history.
- ⛔ `[FE]` No upstream producers — campaign activation, concessions (`putCommercialTerms` unused), stage overrides don't create approval rows / block until decided → need BE `POST /approvals` + history.
- `[BE]` `POST /approvals` (manual create) + approval history endpoint; auto-generation on concession/activation/override.

### Audit Logs
- ◐ `[FE]` Client date-range/object filters and incremental loading are implemented; role/session/device depend on backend fields.
- ⛔ `[FE]` Export toast-only → need BE.
- `[BE]` `from`/`to` query params; export endpoint (itself audited); confirm live write coverage across module.

---

## Summary counts

| Group | Tabs | FE items | BE asks |
|-------|------|---------:|--------:|
| Guardrails | 4 | 4 | 0 |
| A Foundation | 4 | ~16 | ~8 |
| B Pipeline/activity | 4 | ~18 | ~7 |
| C Evidence/legal | 4 | ~16 | ~10 |
| D Capital/close | 3 | ~14 | ~7 |
| E Analytics/gov | 5 | ~16 | ~8 |

BE asks are tracked in [`fundraising-backend-asks.md`](./fundraising-backend-asks.md) (gaps 9+).

## Verification

- ✅ Isolated Fundraising TypeScript check passes (`components/fundraising/**`, fundraising API/mappers).
- ✅ IDE diagnostics report no errors in edited Fundraising files.
- ⚠️ Repository-wide `tsc --noEmit` remains blocked by unrelated pre-existing syntax errors in Performance and Accounting files.
