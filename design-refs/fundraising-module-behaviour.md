# Fundraising & Investor Relations — how the module works

**Purpose of this document.** Describe what the module *does* — its objects, its lifecycles,
its gates and how its screens connect — as a set of **falsifiable claims**. Every claim carries
an id (`B1`, `B2`, …) so it can be tested against the running system.
`fundraising-behaviour-verification.md` records the result of testing each one.

This is a behavioural description, not a data-provenance audit. The question it answers is
"does the module work the way it is supposed to work", not "does this number come from the API".

**Sources.** The backend services are the authority for behaviour
(`FundraisingIrCampaignService`, `FundraisingIrOpportunityService`, `FundraisingSrdService`,
`FundraisingRequirementsService`, `FundraisingAccessService`), cross-checked against the SRD
(`Arcus_Fundraising_Investor_Relations_Mandate_Origination_SRD_with_UI_Inspiration.pdf`).

**How to re-run the checks**

```bash
node scripts/fundraising-behaviour-check.mjs        # B1-B30, API-level state machines
node scripts/fundraising-ui-behaviour-check.mjs     # B5, B28 — only observable on screen
node scripts/fundraising-e2e-roundtrips.mjs         # B32 journey, trips A/B (also --trip=c|d|e)
cd ../nvccz && npm run db:cleanup:fundraising-test-artefacts   # remove scratch records
```

---

## 1. What the module is for

Sourcing investors, running fundraising campaigns, originating asset-management mandates,
performing investor due diligence, negotiating terms, executing documentation, and converting a
successful opportunity into a funded commitment or an activated mandate.

The organising principle, stated in the SRD's development principle and enforced throughout the
data model: **commercial interest, signed commitments, admitted commitments, funded capital,
awarded mandates and activated AUM are different things and never collapse into one number.**

---

## 2. Object model — how the pieces connect

```
Campaign ──┬── PipelineStage (13 per campaign, copied from a template at creation)
           ├── Opportunity ──┬── OpportunityStageHistory
           │                 ├── OpportunityAmountHistory
           │                 ├── OpportunityChecklistItem (seeded per stage on entry)
           │                 └── Commitment ── Closing
           ├── DataRoom ── Folder ── Document, Access, AccessLog
           ├── DdqCase ── DdqItem  (answers sourced from the answer library)
           ├── Communication, Meeting, Document, Agreement
           ├── Closing
           └── Templates / DistributionLists / Events / Materials

InvestorOrganisation ──┬── InvestorContact (many)
                       ├── Opportunity (many, across campaigns)
                       ├── Commitment, Mandate, Rfp, KycCase
                       └── ComplianceHold
```

**B1.** An investor organisation is reusable: one organisation can carry several contacts and
several opportunities across different campaigns, without duplication.

**B2.** An opportunity is the join of *campaign + investor + owner*. It cannot exist without
both a campaign and an investor.

**B3.** A commitment belongs to exactly one opportunity, and may be attached to a closing.

---

## 3. Lifecycles

### 3.1 Campaign

```
DRAFT ──(submit for approval)──▶ PENDING ──(activate)──▶ ACTIVE ──(pause)──▶ PAUSED
```

**B4.** Activation is gated. `FundraisingIrCampaignService.activate` refuses with
`ACTIVATION_REQUIREMENTS_UNMET` and returns the specific unmet list when any of these fail:

| Requirement | Condition |
|---|---|
| `targetCapital required` | targetCapital missing or ≤ 0 |
| `startDate required` / `closeDate required` | either date missing |
| `pipeline configured: at least one stage required` | campaign has no stages |
| `campaign owner / team assigned required` | `campaignOwnerId` unset |
| `fundId / product link required for PE/VC campaign types` | PE/VC type with no linked fund |
| `compliance approval must not be REJECTED` | `approvalStatus === REJECTED` |
| `campaign activation approval must be APPROVED` | an activation approval exists and is not approved |

**B5.** The unmet list is surfaced to the user as a **checklist dialog**, not just a toast — the
`FrRequirementsDialog`, wired on Campaigns, Commitments, Mandates, Onboarding and the Pipeline
board.

**B6.** An opportunity cannot be created against a campaign that is not ACTIVE
(`CAMPAIGN_NOT_ACTIVE`). The create wizard warns before submit when a non-active campaign is
selected.

### 3.2 Opportunity — the 13-stage pipeline

Two pipelines, chosen by campaign type (`AM_TYPES` → `AM`, everything else → `PE_VC`):

| # | PE / VC | Asset-management mandate |
|---:|---|---|
| 1 | Target Investor | Target Client |
| 2 | Contacted | Initial Contact |
| 3 | Qualified | Discovery |
| 4 | Engaged | Qualified |
| 5 | Data Room | RFI / RFP |
| 6 | Due Diligence | Proposal |
| 7 | IC Review | Due Diligence |
| 8 | Commercial Negotiation | Presentation |
| 9 | Subscription Docs | Preferred Bidder |
| 10 | KYC / Compliance | Negotiation |
| 11 | Signed | Awarded |
| 12 | Admitted | Assets in Transition |
| 13 | Funded | Activated |

**B7.** Each stage carries a `winProbabilityPct`. Moving an opportunity to a stage sets its
`stageProbability` to that stage's value — probability is a property of the stage, not typed by
hand.

**B8.** **Gates only apply moving forward.** `movingForward` is
`toStage.sortOrder > fromStage.sortOrder`; a backward move is always allowed, so a mistake can
be corrected without fighting the gates.

**B9.** Gate rules are per-stage `gateRules` and produce named failures:

| Rule | Requires |
|---|---|
| `requiresIndicativeAmount` | one of indicativeAmount, qualifiedAmount or expectedAum is positive |
| `requiresSoftCircle` | softCircleAmount positive |
| `requiresProposed` | proposedAmount positive |
| `requiresSigned` | signedAmount positive |
| `requiresKycNotBlocked` | investor kycStatus not REJECTED/EXPIRED **and** sanctionsStatus not BLOCKED/FAILED |
| `requiresPreviousStageChecklist` | no incomplete *required* checklist item on the stage being left |

**B10.** Entering a compliance-sensitive stage (`ADMITTED`, `FUNDED`, `ACTIVATED`,
`ASSETS_IN_TRANSITION`) additionally runs a full compliance check on the investor, which fails
on an active compliance hold, a REJECTED/EXPIRED KYC, or a BLOCKED/FAILED sanctions status.

**B11.** A failed transition changes nothing and returns `STAGE_GATE_FAILED` with
`unmetRequirements`. The board never keeps an optimistic move — it reloads from the server.

**B12.** A successful forward transition **seeds that stage's checklist items** from
`FundraisingStageChecklistTemplate`.

**B13.** Every transition writes an `OpportunityStageHistory` row: from, to, reason, actor,
timestamp, and the gate result.

**B14.** Status `WON` is only permitted from stage SIGNED, ADMITTED, FUNDED or ACTIVATED
(`INVALID_WON_STAGE`).

### 3.3 The nine amount types

`INDICATIVE, QUALIFIED, SOFT_CIRCLE, PROPOSED, SIGNED, ADMITTED, FUNDED, EXPECTED_AUM,
ACTIVATED_AUM`

**B15.** They are independent fields; setting one never overwrites another.

**B16.** Changing any amount **requires a reason**, enforced server-side —
`reason (or amountReason) is required when changing opportunity amounts`. The board's amount
editor also refuses to submit without one.

**B17.** A change writes an `OpportunityAmountHistory` row carrying amount type, old value, new
value, currency, reason and actor. History is append-only.

**B18.** History is written **only when the value actually changes** (`decEq` comparison), so
re-saving the same number does not manufacture an audit trail.

### 3.4 Commitment

```
SIGNED ──(admit)──▶ ADMITTED_AT_CLOSE ──(fund, partial)──▶ PARTIALLY_FUNDED ──(fund, full)──▶ FUNDED
```

**B19.** Admitting is blocked by compliance (`COMPLIANCE_BLOCKED`) using the same investor check
as the stage gates.

**B20.** Admitting is idempotent: admitting an already-admitted commitment returns it unchanged.

**B21.** Funding is **cumulative** — `newFunded = previousFunded + amount` — and the status is
derived, not chosen: `FUNDED` when funded ≥ commitment amount, otherwise `PARTIALLY_FUNDED`.
`unfundedAmount` is recomputed as `max(0, commitment − funded)`.

**B22.** Admitting or funding **propagates back to the opportunity**: it updates the
opportunity's `admittedAmount` / `fundedAmount` and writes a matching amount-history row. The
two objects cannot drift apart.

### 3.5 Closing

```
PLANNED ──▶ SCHEDULED ──▶ COMPLETED
```

**B23.** A closing carries three independent sign-offs — `legalReady`, `complianceReady`,
`fundReady` — recorded through `POST /closings/:id/readiness`.

**B24.** The UI will not run a closing until all three sign-offs are in; the control is disabled
and states why.

**B25.** Sign-offs are reversible: the chips toggle, so a sign-off can be withdrawn.

### 3.6 KYC and compliance

**B26.** KYC status on the investor gates pipeline progress and commitment admission/funding as
described in B9, B10 and B19. A `complianceHoldActive` investor is blocked regardless of KYC
status.

### 3.7 Approvals

**B27.** An approval request references an object (`objectType` + `objectId`) and moves
`PENDING → APPROVED | REJECTED` through `POST /approvals/:id/decide`, which requires a decision
note. Deciding removes it from the pending inbox.

---

## 4. Screens and how they connect

| Screen | Reads | Writes | Connects to |
|---|---|---|---|
| Dashboard | dashboard aggregate, opportunities, tasks, audit | task status | Everything — scope selector by campaign/type |
| Campaigns | campaigns, engagement, templates/lists/events/materials | create, activate, pause, submit for approval, create ops rows | Pipeline, Data rooms |
| Investor Organisations | investors, 360, relationship summary | create, patch, archive | Contacts, Opportunities, Commitments, KYC |
| Contacts | contacts, investors | create, patch, archive | Investor org (drawer links out) |
| Pipeline (overview) | dashboard, opportunities, funnel, meetings, commitments, audit | — (read-only view) | Board |
| Pipeline (board) | campaign board | **stage transition (drag)**, amount edit, mark lost, assign | Opportunity detail, Commitments |
| Mandates & RFPs | mandates, rfps | create, patch, activate, convert RFP → mandate | Onboarding, Investors |
| Due Diligence | ddq templates, ddq cases (+ items) | create case, patch, upload evidence, export | Answer library, Investors |
| Data Rooms | campaign data rooms, room detail | create room, create folder, upload, grant/revoke access | Campaigns, Investors, Documents |
| Communications | communications | log interaction | Investors, Opportunities, Campaigns |
| Meetings & Tasks | meetings, tasks | create, complete, cancel meeting; patch task | Opportunities, Investors |
| Documents | unified document index | upload, patch, download, export | Data rooms + agreements (virtual rows) |
| Agreements & Signatures | agreements, templates | create, add signatory, send, upload version | Commitments, Investors |
| Commitments & Closings | commitments, closings, investors, campaigns | create commitment, admit, fund, checklist; create/sign-off/run closing | Opportunities, Closings |
| Client Onboarding | kyc cases, mandates | create/patch KYC case, activate mandate | Investors, Mandates |
| Placement Agents | agents, commissions | create, patch, assign opportunity | Opportunities |
| Forecasts & Analytics | scenarios, funnel, source, owner performance, stage ageing | create scenario | Campaigns, Pipeline |
| Reports | report catalogue, schedules | run report, create schedule | All analytics |
| Approvals | approvals, history | decide | Campaigns, Commitments, Opportunities, Closings |
| Audit Logs | audit logs | export | Everything |
| Settings | settings (pipelines, gates, amount types, roles, notifications) | create/patch/delete stage, patch gates, patch notifications | Pipeline behaviour |

**B28.** Every tabbed screen switches content **in place** — no navigation to another route.

**B29.** Settings is not decorative: the stages and gate rules it shows are the ones the
pipeline actually enforces.

---

## 5. Roles

**B30.** Read is broad; **write is narrow**. `FundraisingAccessService.assertCanEdit` permits
only an admin viewer, a fund manager, or investor-relations. Everyone else receives `403 — "You
do not have permission to edit fundraising data"`.

**B31.** A refusal is always visible to the user: either the module is blocked at the guard, the
control is not offered, or the write fails with a message on screen. There are no silent
no-ops.

---

## 6. What "working" means for this module

**B32.** A user can carry a relationship from first contact to funded capital without leaving
the module: create the campaign, add the investor and contact, open an opportunity, move it
through the gates, record the commitment, admit it, fund it, and close it — with every stage
change, amount change and decision recorded and attributable.
