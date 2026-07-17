# Fundraising & Investor Relations — Frontend API Reference

**Audience:** Frontend engineers  
**Base URL:** `{API_HOST}/api` (e.g. `http://localhost:3009/api` or `https://dev-api.arcus.co.zw/api`)  
**Auth:** every route below requires `Authorization: Bearer <token>` from `POST /api/auth/login`  
**Do not use** `/api/v1/...` — there is no versioning on this module.

| Mount | Purpose |
|-------|---------|
| `/api/fundraising` | Campaigns, pipeline, opportunities, ops modules |
| `/api/investors` | Investor organisations, contacts, 360° |

**Deprecated (do not wire new UI):** `/api/fundraising/deals/*`

Demo login: `admin@nts.com` / `admin123`

---

## Response envelope

**Success**

```json
{ "success": true, "data": { } }
```

**Error** — toast on `error.code`

```json
{
  "success": false,
  "error": {
    "code": "STAGE_GATE_FAILED",
    "message": "Stage gate requirements not met",
    "unmetRequirements": ["requiresSoftCircle: softCircleAmount required"]
  }
}
```

Some activation errors use `error.unmet` (string array) instead of `unmetRequirements`.

### Common error codes

| code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | Missing/invalid fields (e.g. amount change without `reason`) |
| `STAGE_GATE_FAILED` | 400 | Forward stage move blocked — show `unmetRequirements` checklist |
| `ACTIVATION_REQUIREMENTS_UNMET` | 400 | Campaign activate incomplete — show `unmet` |
| `CAMPAIGN_NOT_ACTIVE` | 400 | Creating opportunity on non-ACTIVE campaign |
| `COMPLIANCE_BLOCKED` | 400 | Admit / fund / activate while KYC/sanctions blocked |
| `OPPORTUNITY_NOT_FOUND` | 404 | Bad opportunity id |
| `CAMPAIGN_NOT_FOUND` | 404 | Bad campaign id |
| `INVESTOR_NOT_FOUND` | 404 | Bad investor id |
| `COMMITMENT_NOT_FOUND` | 404 | Bad commitment id |
| `REPORT_NOT_FOUND` | 404 | Unknown report key |
| `FUND_REQUIRED` | 400 | PE/VC campaign missing `fundId` |

---

## Suggested FE call order (happy path)

1. Login → store token  
2. `POST /investors` → `POST /investors/:id/contacts`  
3. `POST /fundraising/campaigns` → `POST …/activate`  
4. `POST /fundraising/opportunities`  
5. Board: `GET /fundraising/campaigns/:id/board`  
6. Drag column → `POST …/opportunities/:id/transition` `{ toStageCode }`  
7. Amount edits → `PATCH …/opportunities/:id` **with `reason`**  
8. Drawer: `GET /investors/:id/360`  

---

## Auth

### `POST /api/auth/login`

```json
{ "email": "admin@nts.com", "password": "admin123" }
```

Use returned `token` (or `data.token`) as Bearer on all fundraising routes.

---

# Investors — `/api/investors`

## `GET /investors`

Query: `q`, `status`, `investorType`, `page`, `pageSize`

```json
{
  "success": true,
  "data": {
    "items": [ { "id": "…", "legalName": "…", "investorType": "PENSION_FUND", "kycStatus": "CLEARED" } ],
    "page": 1,
    "pageSize": 25,
    "total": 10,
    "totalPages": 1
  }
}
```

## `POST /investors`

```json
{
  "legalName": "National Pension Fund",
  "tradingName": "NPF",
  "investorType": "PENSION_FUND",
  "registrationNumber": "REG-001",
  "countryCode": "ZW",
  "jurisdiction": "Zimbabwe",
  "baseCurrency": "USD",
  "estimatedAum": 500000000,
  "typicalMinimumTicket": 1000000,
  "typicalMaximumTicket": 25000000,
  "assetClassPreferences": ["PRIVATE_EQUITY", "INFRASTRUCTURE"],
  "geographicInterests": ["SSA"],
  "relationshipOwnerId": "<userId>",
  "source": "CONFERENCE",
  "kycStatus": "NOT_STARTED",
  "sanctionsStatus": "NOT_SCREENED",
  "riskRating": "MEDIUM",
  "investorClassification": "INSTITUTIONAL",
  "nextAction": "Intro call",
  "nextActionDate": "2026-08-01"
}
```

**investorType examples:** `PENSION_FUND`, `INSURANCE`, `FAMILY_OFFICE`, `DFI`, `SOVEREIGN`, `BANK`, `CONSULTANT`

**kycStatus:** `NOT_STARTED` \| `IN_PROGRESS` \| `CLEARED` \| `DOCUMENTS_REQUESTED` \| `UNDER_REVIEW` \| `APPROVED` \| `APPROVED_WITH_CONDITIONS` \| `REJECTED` \| `EXPIRED`  
**sanctionsStatus:** `NOT_SCREENED` \| `CLEAR` \| `BLOCKED` \| `FAILED`

## `GET /investors/:investorId`

Org + contacts.

## `PATCH /investors/:investorId`

Partial update — same fields as create (optional).

## `GET /investors/:investorId/360`

Investor drawer / 360 page.

```json
{
  "success": true,
  "data": {
    "organisation": { "id": "…", "legalName": "…", "kycStatus": "CLEARED" },
    "investor": { },
    "contacts": [],
    "opportunities": [],
    "commitments": [],
    "mandates": [],
    "communications": [],
    "kycCases": [],
    "ddqCases": [],
    "agreements": [],
    "tasks": [],
    "internalTaskCommunications": []
  }
}
```

Prefer `data.organisation` for the summary header.

## `GET /investors/:investorId/relationship-summary`

Lighter rollup (counts / amounts) for list KPIs.

## Contacts

### `POST /investors/:investorId/contacts`

```json
{
  "fullName": "Ada Owner",
  "roleTitle": "CIO",
  "department": "Investments",
  "email": "ada@example.com",
  "phone": "+263771234567",
  "decisionInfluence": "DECISION_MAKER",
  "communicationConsent": true,
  "isPrimary": true,
  "nextAction": "Send teaser",
  "nextActionDate": "2026-08-05"
}
```

### `PATCH /investors/:investorId/contacts/:contactId`

Partial update.

### `POST /investors/:investorId/contacts/:contactId/archive`

Sets contact status to archived (soft).

---

# Fundraising — `/api/fundraising`

## Dashboard

### `GET /fundraising/dashboard`

Query: `campaignId`, `campaignType`

Returns pipeline KPIs: `targetTotal`, `signedTotal`, `admittedTotal`, `fundedTotal`, `expectedAumTotal`, `activatedAumTotal`, `grossPipeline`, `weightedPipeline`, `coverageRatio`, `opportunityCounts`, `openTasks`.

---

## Campaigns

### `GET /fundraising/campaigns`

Query: `campaignType`, `status`, `fundId`

### `POST /fundraising/campaigns`

Creates **DRAFT** / **PENDING** campaign and seeds stages (13 PE/VC or 13 AM).

```json
{
  "campaignType": "PE_FUNDRAISE",
  "name": "Fund IV First Close",
  "fundId": "<fundId>",
  "productId": null,
  "description": "First close push",
  "targetCapital": 100000000,
  "minimumTargetAmount": 50000000,
  "hardCapAmount": 120000000,
  "primaryCurrency": "USD",
  "startDate": "2026-01-01",
  "closeDate": "2027-12-31",
  "firstCloseTargetDate": "2026-09-30",
  "finalCloseTargetDate": "2027-12-31",
  "regionTags": ["SSA"],
  "investorSegments": { "types": ["PENSION_FUND", "DFI"] },
  "campaignOwnerId": "<userId>"
}
```

**campaignType**

| Value | Stages | `fundId` |
|-------|--------|---------|
| `PE_FUNDRAISE` | PE/VC 13 | **required** |
| `VC_FUNDRAISE` | PE/VC 13 | **required** |
| `CO_INVESTMENT` | PE/VC 13 | **required** |
| `SPV` | PE/VC 13 | **required** |
| `CONTINUATION_VEHICLE` | PE/VC 13 | **required** |
| `INSTITUTIONAL_MANDATE` | AM 13 | optional |
| `PRODUCT_LAUNCH` | AM 13 | optional |
| `DISTRIBUTOR_CAMPAIGN` | AM 13 | optional |

**status:** `DRAFT` \| `ACTIVE` \| `CLOSED` \| `ARCHIVED`  
**approvalStatus:** `PENDING` \| `APPROVED` \| `REJECTED`

### `GET /fundraising/campaigns/:campaignId`

Includes `stages[]` (+ checklist templates) and `glMapping`.

### `PATCH /fundraising/campaigns/:campaignId`

Partial update (`targetCapital` preferred over `targetAmount`).

### `POST /fundraising/campaigns/:campaignId/activate`

Sets `ACTIVE` + `APPROVED`. On failure:

```json
{
  "success": false,
  "error": {
    "code": "ACTIVATION_REQUIREMENTS_UNMET",
    "message": "Campaign cannot be activated",
    "unmet": ["campaign owner / team assigned required"]
  }
}
```

### `GET /fundraising/campaigns/:campaignId/dashboard`

Campaign-scoped metrics + per-stage counts.

### `GET /fundraising/campaigns/:campaignId/board`  ★ Kanban

```json
{
  "success": true,
  "data": {
    "campaignId": "…",
    "columns": [
      {
        "stage": {
          "id": "…",
          "stageCode": "CONTACTED",
          "stageName": "Contacted",
          "sortOrder": 2,
          "winProbabilityPct": "15"
        },
        "cards": [
          {
            "id": "…",
            "indicativeAmount": "5000000",
            "softCircleAmount": null,
            "priority": "HIGH",
            "status": "OPEN",
            "investor": { "id": "…", "legalName": "National Pension Fund" },
            "currentStage": { "stageCode": "CONTACTED" }
          }
        ],
        "totals": {
          "count": 1,
          "indicativeAmount": 5000000,
          "qualifiedAmount": 0,
          "softCircleAmount": 0,
          "proposedAmount": 0,
          "signedAmount": 0,
          "weightedAmount": 750000
        }
      }
    ]
  }
}
```

**Drag-and-drop:** call `POST /opportunities/:id/transition` with `toStageCode`. Only update the board UI after `success: true`. On `STAGE_GATE_FAILED`, show `unmetRequirements` and snap the card back.

### `GET /fundraising/campaigns/:campaignId/metrics`

Campaign metrics summary (commitments + opportunity amounts).

---

## Opportunities

### `GET /fundraising/opportunities`

Query: `campaignId`, `investorId`, `status`, `stageCode`, `ownerId`

### `POST /fundraising/opportunities`

Campaign must be **ACTIVE**.

```json
{
  "campaignId": "<id>",
  "investorId": "<id>",
  "primaryContactId": "<contactId>",
  "opportunityType": "LP_COMMITMENT",
  "opportunityCurrency": "USD",
  "indicativeAmount": 2500000,
  "qualifiedAmount": null,
  "softCircleAmount": null,
  "proposedAmount": null,
  "signedAmount": null,
  "expectedAum": null,
  "confidenceAdjustment": 1,
  "expectedCloseDate": "2026-12-15",
  "opportunityOwnerId": "<userId>",
  "priority": "HIGH",
  "source": "DIRECT",
  "consultantName": null,
  "placementAgentName": null,
  "notes": "Warm intro via CIO"
}
```

### `GET /fundraising/opportunities/:opportunityId`

Includes investor, stage, amount/stage history samples.

### `PATCH /fundraising/opportunities/:opportunityId`

Partial update. **If any amount field changes, `reason` (or `amountReason`) is required.**

```json
{
  "softCircleAmount": 2000000,
  "reason": "Soft circle confirmed on call"
}
```

Amount fields (independent — never overwrite each other silently; history is written):

| Field | amountType |
|-------|------------|
| `indicativeAmount` | `INDICATIVE` |
| `qualifiedAmount` | `QUALIFIED` |
| `softCircleAmount` | `SOFT_CIRCLE` |
| `proposedAmount` | `PROPOSED` |
| `signedAmount` | `SIGNED` |
| `admittedAmount` | `ADMITTED` |
| `fundedAmount` | `FUNDED` |
| `expectedAum` | `EXPECTED_AUM` |
| `activatedAum` | `ACTIVATED_AUM` |

### `POST /fundraising/opportunities/:opportunityId/transition`

```json
{ "toStageCode": "QUALIFIED", "reason": "DDQ started" }
```

Or `{ "toStageId": "<stageId>" }`.

### `POST /fundraising/opportunities/:opportunityId/assign`

```json
{ "opportunityOwnerId": "<userId>" }
```

### `POST /fundraising/opportunities/:opportunityId/mark-lost`

```json
{ "lostReason": "Chose competitor" }
```

### `POST /fundraising/opportunities/:opportunityId/set-status`

```json
{ "status": "ON_HOLD", "reason": "Waiting on IC calendar" }
```

**status values:** `OPEN` \| `LOST` \| `WITHDRAWN` \| `DEFERRED` \| `ON_HOLD` \| `DISQUALIFIED` \| `TENDER_CANCELLED` \| `WON`

### `GET /fundraising/opportunities/:opportunityId/timeline`

```json
{
  "success": true,
  "data": {
    "opportunityId": "…",
    "events": [
      { "type": "AMOUNT", "at": "…", "amountType": "INDICATIVE", "newValue": "2500000" },
      { "type": "stage", "at": "…", "toStageCode": "CONTACTED" }
    ]
  }
}
```

### Checklist

**`GET /fundraising/opportunities/:opportunityId/checklist`**  
Query: `stageId` (optional)

**`PATCH /fundraising/opportunities/:opportunityId/checklist`**

```json
{
  "items": [
    { "id": "<checklistItemId>", "isComplete": true },
    { "itemKey": "nda_signed", "stageId": "<stageId>", "isComplete": true }
  ]
}
```

---

## PE / VC stage codes (seed order)

`TARGET_INVESTOR` → `CONTACTED` → `QUALIFIED` → `ENGAGED` → `DATA_ROOM` → `DUE_DILIGENCE` → `IC_REVIEW` → `COMMERCIAL_NEGOTIATION` → `SUBSCRIPTION_DOCS` → `KYC_COMPLIANCE` → `SIGNED` → `ADMITTED` → `FUNDED`

## AM mandate stage codes

`TARGET_CLIENT` → `INITIAL_CONTACT` → `DISCOVERY` → `QUALIFIED` → `RFI_RFP` → `PROPOSAL` → `DUE_DILIGENCE` → `PRESENTATION` → `PREFERRED_BIDDER` → `NEGOTIATION` → `AWARDED` → `ASSETS_IN_TRANSITION` → `ACTIVATED`

### Stage gates (server)

| Gate | Requirement |
|------|-------------|
| `requiresIndicativeAmount` | indicative / qualified / expectedAum > 0 |
| `requiresSoftCircle` | softCircleAmount > 0 |
| `requiresProposed` | proposedAmount > 0 |
| `requiresSigned` | signedAmount > 0 |
| `requiresKycNotBlocked` | investor KYC/sanctions not blocked |
| `requiresPreviousStageChecklist` | required checklist items complete on previous stage |

---

## Communications

### `GET /fundraising/communications`

Query: `campaignId`, `opportunityId`, `investorId`, `external=true` (hides `INTERNAL` / `INTERNAL_NOTE`)

### `POST /fundraising/communications`

```json
{
  "campaignId": "<id>",
  "opportunityId": "<id>",
  "investorId": "<id>",
  "contactId": "<id>",
  "interactionType": "PHONE_CALL",
  "subject": "Intro call",
  "summary": "Positive interest; follow up with teaser",
  "outcome": "FOLLOW_UP",
  "sentiment": "POSITIVE",
  "confidentiality": "INTERNAL",
  "nextAction": "Send teaser deck",
  "dueDate": "2026-08-10",
  "ownerId": "<userId>",
  "participants": ["ada@example.com"],
  "attachments": [],
  "occurredAt": "2026-07-16T10:00:00.000Z"
}
```

**interactionType examples:** `EMAIL`, `PHONE_CALL`, `VIDEO_MEETING`, `PHYSICAL_MEETING`, `CONFERENCE`, `PRESENTATION`, `FOLLOW_UP`, `INTERNAL_NOTE`, `DATA_ROOM_INVITATION`, `PROPOSAL_SUBMISSION`, `DDQ_RESPONSE`

**confidentiality:** `INTERNAL` \| `INTERNAL_NOTE` \| `EXTERNAL` \| `CONFIDENTIAL`  
Never expose `INTERNAL` / `INTERNAL_NOTE` to investor-facing UIs (`external=true`).

### `GET /fundraising/communications/:communicationId`

---

## Tasks

### `GET /fundraising/tasks`

Query: `campaignId`, `opportunityId`, `investorId`

```json
{
  "success": true,
  "data": {
    "performanceTasks": [ { "id": "…", "title": "…", "taskMetadata": { "sourceModule": "fundraising" } } ],
    "internalTaskCommunications": []
  }
}
```

### `POST /fundraising/tasks`

```json
{
  "title": "Follow up soft circle",
  "description": "Confirm ticket size",
  "dueDate": "2026-08-01",
  "priority": "HIGH",
  "status": "NOT_STARTED",
  "campaignId": "<id>",
  "opportunityId": "<id>",
  "investorId": "<id>"
}
```

### `PATCH /fundraising/tasks/:taskId`

Partial update of title/description/dueDate/priority/status/stage.

---

## Commitments

**Guardrail:** signed ≠ admitted ≠ funded ≠ cash.

### `GET /fundraising/commitments`

Query: `campaignId`, `investorId`, `opportunityId`, `status`

### `POST /fundraising/commitments`

```json
{
  "opportunityId": "<id>",
  "investorId": "<id>",
  "campaignId": "<id>",
  "fundId": "<fundId>",
  "currency": "USD",
  "commitmentAmount": 5000000,
  "status": "SIGNED",
  "signedAt": "2026-07-01T00:00:00.000Z",
  "closingId": null,
  "capitalCallContact": "ops@lp.example.com"
}
```

**status examples:** `INDICATIVE` \| `SOFT_CIRCLED` \| `PROPOSED` \| `DOCUMENTS_ISSUED` \| `SIGNED` \| `ACCEPTED` \| `ADMITTED_AT_CLOSE` \| `PARTIALLY_FUNDED` \| `FUNDED` \| `REDUCED` \| `CANCELLED` \| `DEFAULTED` \| `DRAFT`

### `GET /fundraising/commitments/:commitmentId`

### `PATCH /fundraising/commitments/:commitmentId`

### `POST /fundraising/commitments/:commitmentId/admit`

```json
{ "closingId": "<closingId>" }
```

→ status `ADMITTED_AT_CLOSE`, sets admission date; may provision LP/GL when fund linked. Blocked if compliance hold.

### `POST /fundraising/commitments/:commitmentId/fund`

```json
{ "fundedAmount": 2000000, "accountingStatus": "CASH_RECEIVED" }
```

→ `FUNDED` or `PARTIALLY_FUNDED`. Does **not** run from signed document alone.

---

## Closings

### `GET /fundraising/closings`

Query: `campaignId`, `status`

### `POST /fundraising/closings`

```json
{
  "campaignId": "<id>",
  "fundId": "<fundId>",
  "closeType": "FIRST_CLOSE",
  "closingDate": "2026-09-30",
  "status": "PLANNED",
  "notes": "Target first close"
}
```

**closeType:** `FIRST_CLOSE` \| `INTERIM_CLOSE` \| `SUBSEQUENT_CLOSE` \| `EXTENDED_CLOSE` \| `FINAL_CLOSE`

### `GET /fundraising/closings/:closingId`

### `PATCH /fundraising/closings/:closingId`

### `POST /fundraising/closings/:closingId/readiness`

```json
{
  "legalReady": true,
  "complianceReady": true,
  "fundReady": true,
  "equalisationStatus": "PENDING"
}
```

---

## Mandates

### `GET /fundraising/mandates`

### `POST /fundraising/mandates`

```json
{
  "investorId": "<id>",
  "campaignId": "<id>",
  "opportunityId": "<id>",
  "name": "Pension equity mandate",
  "status": "AWARDED",
  "expectedAum": 50000000,
  "currency": "USD",
  "ownerId": "<userId>"
}
```

**status:** `AWARDED` \| `ONBOARDING` \| `ASSETS_IN_TRANSITION` \| `PARTIALLY_FUNDED` \| `ACTIVE` \| `SUSPENDED` \| `TERMINATED` \| `LOST_BEFORE_ACTIVATION` \| `DRAFT`

### `GET|PATCH /fundraising/mandates/:mandateId`

Checklist booleans on patch: `agreementSigned`, `kycApproved`, `guidelinesConfigured`, `benchmarkConfigured`, `feesConfigured`, `reportingConfigured`, `custodianConfirmed`, `openingBalancesVerified`, `assetsReceived`

### `POST /fundraising/mandates/:mandateId/activate`

Requires all activation checklist flags + KYC clear. Sets `ACTIVE` / `activatedAum`. **Awarded ≠ activated.**

---

## RFPs / Tenders

### `GET /fundraising/rfps`

### `POST /fundraising/rfps`

```json
{
  "investorId": "<id>",
  "campaignId": "<id>",
  "referenceNumber": "RFP-2026-041",
  "institutionName": "National Pension Fund",
  "deadline": "2026-10-01",
  "presentationDate": "2026-09-15",
  "evaluationCriteria": { "fees": 30, "trackRecord": 40, "team": 30 },
  "status": "SUBMITTED",
  "commercialInfo": { "feeBps": 45, "benchmark": "MSCI EM" }
}
```

### `GET|PATCH /fundraising/rfps/:rfpId`

Set `outcome`: `WON` \| `LOST` \| `PENDING` before convert.

### `POST /fundraising/rfps/:rfpId/convert-to-mandate`

Only when `outcome === "WON"`. Returns new mandate.

---

## Commercial terms & approvals

### `GET /fundraising/opportunities/:opportunityId/commercial-terms`

### `PUT /fundraising/opportunities/:opportunityId/commercial-terms`

```json
{
  "termsType": "PE_VC",
  "terms": {
    "managementFee": 2,
    "carriedInterest": 20,
    "hurdle": 8,
    "mfn": true,
    "sideLetters": []
  }
}
```

`termsType`: `PE_VC` \| `AM`  
Body accepts `terms` or `termsJson`.

### `GET /fundraising/approvals`

Query: `status`, `objectType`

### `POST /fundraising/approvals/:approvalId/decide`

```json
{ "decision": "APPROVED", "decisionNotes": "Within policy" }
```

`decision`: `APPROVED` \| `REJECTED`

---

## Due Diligence (DDQ)

### `GET /fundraising/ddq/templates`

### `POST /fundraising/ddq/templates`

```json
{
  "name": "Standard LP DDQ",
  "category": "Compliance",
  "questions": [ { "q": "List UBOs", "required": true } ]
}
```

Accepts `questions` or `questionsJson`.

### `GET /fundraising/ddq/cases`

Query: `investorId`, `campaignId`, `opportunityId`, `status`

### `POST /fundraising/ddq/cases`

```json
{
  "investorId": "<id>",
  "campaignId": "<id>",
  "opportunityId": "<id>",
  "templateId": "<id>",
  "title": "Fund IV DDQ — NPF",
  "ownerId": "<userId>"
}
```

### `GET|PATCH /fundraising/ddq/cases/:caseId`

### `POST /fundraising/ddq/cases/:caseId/items/:itemId/evidence` (multipart)

- `Content-Type: multipart/form-data`  
- Field name: **`file`**  
- Max ~25 MB  

---

## KYC cases

### `GET /fundraising/kyc-cases`

Query: `investorId`, `status`

### `POST /fundraising/kyc-cases`

```json
{
  "investorId": "<id>",
  "status": "UNDER_REVIEW",
  "riskRating": "MEDIUM",
  "pepFlag": false,
  "adverseMediaFlag": false,
  "details": { "sourceOfWealth": "…" },
  "ownerId": "<userId>"
}
```

### `GET|PATCH /fundraising/kyc-cases/:caseId`

Commercial talk may continue while KYC open; **Admit / Fund / Activate** blocked if compliance fails.

---

## Data rooms

### `GET /fundraising/campaigns/:campaignId/data-rooms`

### `POST /fundraising/campaigns/:campaignId/data-rooms`

```json
{ "name": "Fund IV Data Room", "requiresMfa": false, "status": "ACTIVE" }
```

### `GET /fundraising/data-rooms/:dataRoomId`

Includes folders / documents / access as returned by BE.

### `POST /fundraising/data-rooms/:dataRoomId/folders`

```json
{ "name": "Legal", "parentId": null, "sortOrder": 1 }
```

### `POST /fundraising/data-rooms/:dataRoomId/documents` (multipart)

- Field: **`file`**  
- Optional body fields: `folderId`, `viewOnly`, `downloadLimit`, `watermarkEnabled`

### `GET /fundraising/data-rooms/:dataRoomId/documents/:documentId/download`

Auth-gated binary download (do not rely on public URL alone for sensitive docs).

### `POST /fundraising/data-rooms/:dataRoomId/access`

```json
{ "investorId": "<id>", "expiresAt": "2026-12-31T00:00:00.000Z" }
```

---

## Agreements & e-sign

### `GET /fundraising/agreements`

Query: `opportunityId`, `investorId`, `campaignId`

### `POST /fundraising/agreements`

```json
{
  "opportunityId": "<id>",
  "investorId": "<id>",
  "campaignId": "<id>",
  "commitmentId": null,
  "documentType": "SUBSCRIPTION_AGREEMENT",
  "title": "Subscription — NPF"
}
```

**documentType (PE/VC examples):** `NDA`, `TERM_SHEET`, `SUBSCRIPTION_AGREEMENT`, `LPA`, `SIDE_LETTER`, `CO_INVESTMENT_AGREEMENT`  
**AM examples:** `IMA`, `MANDATE`, `FEE_SCHEDULE`, `INVESTMENT_GUIDELINES`

### `GET /fundraising/agreements/:agreementId`

### `POST /fundraising/agreements/:agreementId/versions` (multipart)

- Field: **`file`**  
- New version **invalidates** pending signatories on previous version.

### `POST /fundraising/agreements/:agreementId/signatories`

```json
{
  "fullName": "Ada Owner",
  "email": "ada@example.com",
  "sequenceOrder": 1,
  "expiresAt": "2026-08-31T00:00:00.000Z"
}
```

### `POST /fundraising/agreements/:agreementId/signatories/:signatoryId/sign`

```json
{ "certificateRef": "manual-ack-2026-07-16" }
```

**Guardrail:** uploading / signing a document does **not** auto-mark opportunity WON or commitment funded.

---

## Placement agents

### `GET /fundraising/placement-agents`

### `POST /fundraising/placement-agents`

```json
{
  "legalName": "Africa Placement Partners",
  "territory": "SSA",
  "geography": ["ZW", "ZA", "KE"],
  "commissionPct": 1.5,
  "retainer": 25000,
  "successFee": 0,
  "appointmentStart": "2026-01-01",
  "appointmentEnd": "2027-12-31",
  "protectedUntil": "2028-06-30"
}
```

### `GET|PATCH /fundraising/placement-agents/:agentId`

### `POST /fundraising/placement-agents/:agentId/assign-opportunity`

```json
{ "opportunityId": "<id>" }
```

---

## Forecasts

### `GET /fundraising/forecasts/scenarios`

Query: `campaignId`

### `POST /fundraising/forecasts/scenarios`

```json
{
  "campaignId": "<id>",
  "name": "Base case",
  "scenarioType": "BASE",
  "assumptions": { "winRate": 0.4 },
  "projectedSigned": 40000000,
  "projectedAum": 0,
  "projectedFees": 800000
}
```

**scenarioType:** `DOWNSIDE` \| `BASE` \| `UPSIDE`  
Scenarios **never** mutate live opportunities.

---

## Analytics

All accept query `campaignId` (optional unless noted).

| Method | Path |
|--------|------|
| GET | `/fundraising/analytics/funnel` |
| GET | `/fundraising/analytics/source` |
| GET | `/fundraising/analytics/owner-performance` |
| GET | `/fundraising/analytics/stage-ageing` |

---

## Reports

### `GET /fundraising/reports/:reportKey`

| reportKey | Notes |
|-----------|--------|
| `pipeline-summary` | Requires `?campaignId=` |
| `campaign-metrics` | Same as pipeline-summary |
| `funnel` / `pipeline-funnel` | Funnel analytics |
| `source` / `source-analysis` | Source breakdown |
| `owner-performance` | Owner leaderboard |
| `stage-ageing` | Ageing heatmap data |

---

## Audit logs

### `GET /fundraising/audit-logs`

Query: `objectType`, `objectId`, `userId`, `limit` (max 500)

Append-only; FE is read-only.

---

## Multipart uploads (summary)

| Endpoint | Form field |
|----------|------------|
| `POST …/ddq/cases/:caseId/items/:itemId/evidence` | `file` |
| `POST …/data-rooms/:id/documents` | `file` |
| `POST …/agreements/:id/versions` | `file` |

```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

## What FE must never do

1. Call `/api/v1/fundraising` or `/api/v1/investors`  
2. Wire new screens to `/api/fundraising/deals/*`  
3. Optimistically complete Kanban moves before transition succeeds  
4. Treat signed PDF / signed commitment as cash or as activated AUM  
5. Overwrite amount fields without sending `reason`  
6. Show `INTERNAL` / `INTERNAL_NOTE` communications externally  

---

## Verify against running API

```bash
npm run uat:fundraising:srd
```

Related: [`fundraising-srd-fe-handoff.md`](./fundraising-srd-fe-handoff.md) · [`fundraising-frontend.md`](./fundraising-frontend.md) · SRD [`fundraising-srd.md`](./fundraising-srd.md) · Gaps [`fundraising-backend-asks.md`](./fundraising-backend-asks.md)

---

# FE gap APIs (Settings / Meetings / Documents / extras)

Shipped to unblock Settings, Meetings, Documents tabs and related KPIs.

## Settings

| Method | Path |
|--------|------|
| GET | `/fundraising/settings` |
| PATCH | `/fundraising/settings` |
| POST | `/fundraising/settings/pipelines/:pipelineKey/stages` |
| PATCH | `/fundraising/settings/pipelines/:pipelineKey/stages/:stageId` |
| DELETE | `/fundraising/settings/pipelines/:pipelineKey/stages/:stageId` |
| PATCH | `/fundraising/settings/stage-gates` |
| PATCH | `/fundraising/settings/amount-types` |
| PATCH | `/fundraising/settings/notifications` |

`pipelineKey`: `PE_VC` | `AM`

`GET /fundraising/settings` returns `pipelines`, `stageGates`, `amountTypes`, `notifications`, `roles`.

Template edits apply to **new** campaigns. Existing campaign stages unchanged.

**Errors:** `VALIDATION_ERROR`, `STAGE_IN_USE` (409), `SETTINGS_NOT_FOUND`, `FORBIDDEN`

## Meetings

| Method | Path |
|--------|------|
| GET | `/fundraising/meetings` |
| POST | `/fundraising/meetings` |
| GET | `/fundraising/meetings/:meetingId` |
| PATCH | `/fundraising/meetings/:meetingId` |
| POST | `/fundraising/meetings/:meetingId/cancel` |
| POST | `/fundraising/meetings/:meetingId/complete` |

Query: `campaignId`, `investorId`, `opportunityId`, `ownerId`, `from`, `to`, `meetingType`, `status`, `page`, `pageSize`

**meetingType:** `VIDEO` | `IN_PERSON` | `PHONE`
**status:** `SCHEDULED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`

## Documents (unified index)

| Method | Path |
|--------|------|
| GET | `/fundraising/documents` |
| POST | `/fundraising/documents` (optional multipart `file`) |
| GET | `/fundraising/documents/:documentId` |
| PATCH | `/fundraising/documents/:documentId` |
| GET | `/fundraising/documents/:documentId/download` |

Query: `campaignId`, `investorId`, `opportunityId`, `category`, `q`, `confidential`, `sourceType`, `page`, `pageSize`

**sourceType:** `DATA_ROOM` | `AGREEMENT` | `DDQ_EVIDENCE` | `UPLOAD`

## Campaign engagement

`GET /fundraising/campaigns/:campaignId/engagement` — sent, opened, replied, meetingsBooked, materialsDownloaded, progressPct

## Forecast monthly curve

`GET /fundraising/forecasts/scenarios/:scenarioId/curve` — `monthlyProjection[]` with month + cumulativeSigned

Also on scenario create/list as `monthlyProjection`.

## Mandate / RFP classification

Mandates: `assetClass`, `geography`, `rfpDueDate`. RFPs: `assetClass`, `geography`, `fitScore`.

## Placement agent commissions

`GET /fundraising/placement-agents/:agentId/commissions`

Agent list/detail: `commissionStatus`, `accruedCommission`, `paidCommission`.

## Commitment checklist

| Method | Path |
|--------|------|
| GET | `/fundraising/commitments/:commitmentId/checklist` |
| PATCH | `/fundraising/commitments/:commitmentId/checklist/:itemId` |

Body: `{ \"isComplete\": true }`

Seeds default closing items if empty. Distinct from opportunity stage checklist.
