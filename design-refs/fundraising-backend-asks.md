# Fundraising — backend asks (FE gaps)

**Audience:** API team  
**Base:** `{API_HOST}/api` — mounts `/api/fundraising` and `/api/investors` (no `/api/v1`)  
**Full contract:** [`fundraising-frontend-api.md`](./fundraising-frontend-api.md)

> ## ✅ Status update
> Settings / Meetings / Documents / campaign engagement / forecast monthly curve / placement
> agent commissions / commitment checklist / mandate & RFP classification — **SHIPPED on BE**
> (see [`fundraising-frontend-api.md`](./fundraising-frontend-api.md#fe-gap-apis-settings--meetings--documents--extras)
> for the live contract). Each gap below is marked **SHIPPED** rather than deleted, to keep the
> history of why it was asked for.
>
> **FE wiring status in this pass:**
> - **Wired to dedicated endpoints:** Settings CRUD (gap 1 — `fundraising-settings.tsx`), Meetings
>   resource (gap 2 — `fundraising-meetings.tsx`), Documents unified index (gap 3 —
>   `fundraising-documents.tsx`, replacing the N+1 aggregator), campaign engagement KPIs
>   (`fundraising-campaigns.tsx`), forecast monthly close curve (`fundraising-forecasts.tsx`),
>   commitment closing checklist (`fundraising-commitments.tsx`), placement agent commissions
>   (`fundraising-placement-agents.tsx`), mandate/RFP asset class, geography, RFP due date, fit
>   score (`fundraising-mandates.tsx`).
> - All 8 gaps below are now **✅ Shipped + FE wired**. A couple of request-body shapes were
>   inferred where this doc didn't give an explicit example (notifications PATCH, stage-gate PATCH
>   per-stage flags) — see "FE assumption to confirm" notes under gap 1 and double-check against the
>   live BE contract.

---

## 1. Settings CRUD (pipelines, stage gates, amount types, notifications)

**Status: ✅ SHIPPED on BE + FE wired** — `components/fundraising/fundraising-settings.tsx` now loads
`GET /fundraising/settings` on mount and renders PE/VC + AM pipeline stages from
`data.pipelines.PE_VC.stages` / `data.pipelines.AM.stages`, stage gates from `data.stageGates`,
amount types from `data.amountTypes` (read-only — no enable/disable toggle in the current UI),
notifications from `data.notifications`, and roles from `data.roles` (falling back to the static
role summary list only while `data.roles` is empty, per the example payload above). Add/Edit/Delete
stage call `createPipelineStage` / `patchPipelineStage` / `deletePipelineStage` and reload; delete
surfaces `STAGE_IN_USE` via `toastFrError`. Stage gate edits toggle the six boolean flags and call
`patchStageGates({ gates: [{ stageCode, ...flags }] })`. Notification toggles call
`patchNotificationSettings`.

**FE assumption to confirm:** the `PATCH /fundraising/settings/notifications` body shape isn't shown
in this doc's examples. FE sends `{ notifications: [{ id, enabled }] }` (single changed item, same
bulk-array convention as `patchStageGates`'s `{ gates: [...] }`). Please confirm or correct this
shape — if wrong, notification toggles will silently fail and revert client-side.

### Product rule / why

SRD requires **configurable pipelines** per operating model (PE / VC / AM). Stage moves on the Kanban board are server-authoritative and depend on **stage gates** defined in Settings. Amount types are independent labels (Indicative → Activated AUM) and must not be hard-coded in FE.

Today, `POST /fundraising/campaigns` only **seeds** `campaign.stages[]` on create. There is no tenant-level or module-level settings resource. The Settings tab (`/fundraising/settings`) exposes five workspaces — Pipelines, Stage Gates, Amount Types, Roles, Notifications — but cannot persist edits.

### Proposed endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/settings` | Return module config for current tenant |
| `PATCH` | `/api/fundraising/settings` | Partial update of settings sections |
| `POST` | `/api/fundraising/settings/pipelines/:pipelineKey/stages` | Add stage to PE / VC / AM pipeline |
| `PATCH` | `/api/fundraising/settings/pipelines/:pipelineKey/stages/:stageId` | Edit stage name, sort order, win probability |
| `DELETE` | `/api/fundraising/settings/pipelines/:pipelineKey/stages/:stageId` | Remove stage (guard: no open opportunities) |
| `PATCH` | `/api/fundraising/settings/stage-gates` | Toggle gate flags per stage |
| `PATCH` | `/api/fundraising/settings/amount-types` | Enable/disable or relabel amount types |
| `PATCH` | `/api/fundraising/settings/notifications` | Toggle notification rules |

**`pipelineKey` examples:** `PE_VC`, `AM` (or separate `VC` if product requires three distinct lists).

### Example — `GET /api/fundraising/settings`

```json
{
  "success": true,
  "data": {
    "pipelines": {
      "PE_VC": {
        "stages": [
          {
            "id": "stage-uuid-1",
            "stageCode": "TARGET_INVESTOR",
            "stageName": "Target Investor",
            "sortOrder": 1,
            "winProbabilityPct": 5
          }
        ]
      },
      "AM": {
        "stages": [
          {
            "id": "stage-uuid-am-1",
            "stageCode": "TARGET_CLIENT",
            "stageName": "Target Client",
            "sortOrder": 1,
            "winProbabilityPct": 5
          }
        ]
      }
    },
    "stageGates": [
      {
        "stageCode": "QUALIFIED",
        "requiresIndicativeAmount": true,
        "requiresSoftCircle": false,
        "requiresProposed": false,
        "requiresSigned": false,
        "requiresKycNotBlocked": false,
        "requiresPreviousStageChecklist": true
      }
    ],
    "amountTypes": [
      { "key": "INDICATIVE", "label": "Indicative", "enabled": true },
      { "key": "QUALIFIED", "label": "Qualified", "enabled": true },
      { "key": "SOFT_CIRCLE", "label": "Soft Circle", "enabled": true },
      { "key": "PROPOSED", "label": "Proposed", "enabled": true },
      { "key": "SIGNED", "label": "Signed", "enabled": true },
      { "key": "ADMITTED", "label": "Admitted", "enabled": true },
      { "key": "FUNDED", "label": "Funded", "enabled": true },
      { "key": "EXPECTED_AUM", "label": "Expected AUM", "enabled": true },
      { "key": "ACTIVATED_AUM", "label": "Activated AUM", "enabled": true }
    ],
    "notifications": [
      {
        "id": "notif-1",
        "eventKey": "STAGE_GATE_FAILED",
        "channel": "IN_APP",
        "enabled": true,
        "recipients": ["CAMPAIGN_OWNER", "OPPORTUNITY_OWNER"]
      }
    ],
    "roles": []
  }
}
```

### Example — `PATCH /api/fundraising/settings/pipelines/PE_VC/stages/:stageId`

```json
{
  "stageName": "Contacted",
  "winProbabilityPct": 15,
  "sortOrder": 2
}
```

### Example — `PATCH /api/fundraising/settings/stage-gates`

```json
{
  "gates": [
    {
      "stageCode": "COMMERCIAL_NEGOTIATION",
      "requiresSoftCircle": true,
      "requiresKycNotBlocked": true
    }
  ]
}
```

### Expected error codes

| code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | Invalid probability, duplicate sort order, missing required fields |
| `STAGE_IN_USE` | 409 | Delete/reorder blocked — open opportunities on stage |
| `SETTINGS_NOT_FOUND` | 404 | Tenant settings not initialized |
| `FORBIDDEN` | 403 | User lacks Head of Fundraising / Admin role |

### FE verify steps

1. Open `/fundraising/settings` → Pipelines tab loads PE/AM stages from `GET /fundraising/settings` (not mock).
2. Edit win probability on a stage → `PATCH …/stages/:id` → list refreshes with new value.
3. Add stage → appears in pipeline list and in `GET /fundraising/campaigns/:id` for new campaigns.
4. Toggle stage gate → forward transition on board respects new gate (`STAGE_GATE_FAILED` when unmet).
5. Notifications tab toggles persist across reload.

### FE files that consume this

- `components/fundraising/fundraising-settings.tsx` — live-wired (this pass)
- `components/fundraising/settings-mock-data.ts` — `FR_ROLES` kept only as the empty-`data.roles`
  fallback; `PE_STAGE_CODES` / `AM_STAGE_CODES` / `STAGE_GATES` / `FR_NOTIFICATIONS` mocks are no
  longer read (left in the file, unused, for reference)
- `lib/api/fundraising-api.ts` (`getSettings`, `createPipelineStage`, `patchPipelineStage`,
  `deletePipelineStage`, `patchStageGates`, `patchNotificationSettings`)
- `lib/fundraising/mappers.ts` (`mapPipelineStages`, `mapStageGateRow`, `mapNotificationRow`,
  `mapSettingsRole`, `STAGE_GATE_FLAGS`)

---

## 2. Dedicated Meetings resource

**Status: ✅ SHIPPED on BE + FE wired.**
The FE uses the dedicated resource for scheduling, list/calendar display and cancellation. Meetings
are **business records, not video-conference sessions**: there is no Join button, generated video room,
or Teams integration. A scheduled record stores the planned agenda; completion must persist what was
discussed, the outcome, decisions and follow-up actions.

### Product rule / why

SRD lists **Meetings** and **Tasks** as separate nav items. The FE Meetings tab (`/fundraising/meetings`)
provides the same month-calendar design as Events Management, plus a list view, scheduling and
attendee management. A “meeting” here is an auditable interaction record:

1. Before the meeting: date/time, related investor/campaign/opportunity, attendees and agenda.
2. After the meeting: discussion notes, outcome summary, decisions and action items.
3. Completing a meeting must be atomic: the record becomes `COMPLETED` only when its outcomes save.

Do not require or generate `videoLink`, provider meeting IDs, join tokens, calendar-provider sync, or
recurrence for this requirement.

### Proposed endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/meetings` | List / filter meetings |
| `POST` | `/api/fundraising/meetings` | Schedule meeting |
| `GET` | `/api/fundraising/meetings/:meetingId` | Detail |
| `PATCH` | `/api/fundraising/meetings/:meetingId` | Reschedule; update agenda, attendees and linkage |
| `POST` | `/api/fundraising/meetings/:meetingId/cancel` | Cancel with reason |
| `POST` | `/api/fundraising/meetings/:meetingId/complete` | Atomically persist outcomes and mark completed |

### Query params — `GET /api/fundraising/meetings`

`campaignId`, `investorId`, `opportunityId`, `ownerId`, `from`, `to`, `meetingType`, `status`, `page`, `pageSize`

**meetingType:** existing `VIDEO` \| `IN_PERSON` \| `PHONE` is acceptable as interaction format;
`VIDEO` means online/virtual only and does not imply a hosted video service.  
**status:** `SCHEDULED` \| `COMPLETED` \| `CANCELLED` \| `NO_SHOW`

### Example — `POST /api/fundraising/meetings`

```json
{
  "title": "Fund IV intro — NPF CIO",
  "meetingType": "VIDEO",
  "scheduledStart": "2026-08-05T14:00:00.000Z",
  "scheduledEnd": "2026-08-05T15:00:00.000Z",
  "timezone": "Africa/Harare",
  "location": null,
  "campaignId": "<campaignId>",
  "investorId": "<investorId>",
  "opportunityId": "<opportunityId>",
  "contactId": "<contactId>",
  "ownerId": "<userId>",
  "attendees": [
    { "email": "ada@example.com", "fullName": "Ada Owner", "role": "EXTERNAL" },
    { "userId": "<userId>", "role": "INTERNAL" }
  ],
  "agenda": "Review teaser; agree DDQ owners; confirm next diligence milestone",
  "status": "SCHEDULED"
}
```

### Example — `GET /api/fundraising/meetings` response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "mtg-uuid-1",
        "title": "Fund IV intro — NPF CIO",
        "meetingType": "VIDEO",
        "scheduledStart": "2026-08-05T14:00:00.000Z",
        "scheduledEnd": "2026-08-05T15:00:00.000Z",
        "status": "SCHEDULED",
        "agenda": "Review teaser; agree DDQ owners; confirm next diligence milestone",
        "discussionNotes": null,
        "outcomeSummary": null,
        "decisions": [],
        "actionItems": [],
        "investor": { "id": "…", "legalName": "National Pension Fund" },
        "owner": { "id": "…", "displayName": "Kwame Asante" },
        "attendeeCount": 3
      }
    ],
    "page": 1,
    "pageSize": 25,
    "total": 1
  }
}
```

### Required completion request

`POST /api/fundraising/meetings/:meetingId/complete`

```json
{
  "discussionNotes": "Reviewed valuation, governance rights and DDQ ownership.",
  "outcomeSummary": "Investor will proceed to full due diligence.",
  "decisions": [
    "Share the updated financial model",
    "Legal leads the governance-rights response"
  ],
  "actionItems": [
    {
      "title": "Send updated financial model",
      "ownerId": "<userId>",
      "dueDate": "2026-08-07"
    }
  ]
}
```

Return the updated meeting with `status: "COMPLETED"`, `completedAt`, `completedBy`,
`discussionNotes`, `outcomeSummary`, `decisions`, and `actionItems`. Action items may either be
embedded meeting records or created Fundraising tasks, but the response must identify any generated
task IDs. Repeating the same completion request must be idempotent and must not duplicate tasks.

### Expected error codes

| code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | End before start, missing investor/campaign link |
| `MEETING_NOT_FOUND` | 404 | Bad id |
| `SCHEDULING_CONFLICT` | 409 | Owner double-booked (if enforced) |
| `CAMPAIGN_NOT_FOUND` | 404 | Invalid `campaignId` |
| `MEETING_OUTCOME_REQUIRED` | 422 | Completion attempted without `outcomeSummary` |
| `MEETING_CANCELLED` | 409 | Cancelled record cannot be completed |

### FE verify steps

1. `/fundraising/meetings` calendar loads the month using the Events Management calendar design.
2. Schedule a meeting with agenda → it appears on calendar and list after refresh.
3. Open Details → agenda is visible and there is no Join/video-provider action.
4. Complete meeting with notes, outcome, decisions and actions → refreshed detail shows all fields.
5. Cancelled meetings are red; completed meetings are blue; scheduled meetings are yellow.
6. Re-submit completion → no duplicate action items/tasks.
7. Tasks sub-tab continues using `/api/fundraising/tasks` unchanged.

### FE files that consume this

- `components/fundraising/fundraising-meetings.tsx` — live-wired (this pass)
- `lib/api/fundraising-api.ts` (`listMeetings`, `createMeeting`, `patchMeeting`, `cancelMeeting`, `completeMeeting`)
- `lib/fundraising/mappers.ts` (`mapMeetingRecord`, `MEETING_TYPE_LABEL`, `MEETING_STATUS_LABEL`)

---

## 3. Unified Documents library index

**Status: ✅ SHIPPED on BE (Option A) + FE wired** — `components/fundraising/fundraising-documents.tsx`
now calls `listDocuments({ pageSize: 200 })` once and filters/searches client-side (no more
`listCampaigns` → `listDataRooms` → `getDataRoom` → `listAgreements` fan-out). Folder tiles are
derived from the unique `category` values in the result set, as before. Upload calls
`createDocument({ title, category, campaignId, confidential }, file)` against the fixed category
list (`Legal`, `Track Record`, `Marketing`, `Due Diligence`, `KYC`, `Financials`) instead of
requiring a pre-existing data room. Download uses `downloadDocument(id)` → blob → browser download
(no more public data-room URL). `sourceType` (`DATA_ROOM` \| `AGREEMENT` \| `DDQ_EVIDENCE` \|
`UPLOAD`) is mapped to the row's "Source" field in place of the old `room` (data-room name) field.

### Product rule / why

The Documents tab (`/fundraising/documents`) is a **cross-campaign document register** with folder categories (Legal, Track Record, Marketing, Due Diligence, KYC, Financials), version history, confidentiality flags, and campaign/investor linkage.

Existing APIs only expose documents in context:

- Data room: `GET /fundraising/data-rooms/:id`, `POST …/documents` (per room, per campaign)
- Agreements: `GET /fundraising/agreements`, `POST …/versions` (legal docs tied to opportunity/commitment)
- DDQ evidence: per case item multipart upload

There is **no single index** for “all fundraising documents across campaigns.” FE can aggregate client-side but that is N+1 (list campaigns → list rooms → list docs + agreements) and misses unified search, category taxonomy, and version rollup.

### Option A — dedicated index (preferred)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/documents` | Unified register with filters |
| `GET` | `/api/fundraising/documents/:documentId` | Detail + version history |
| `POST` | `/api/fundraising/documents` | Register metadata (optional file upload or link to source) |
| `PATCH` | `/api/fundraising/documents/:documentId` | Update category, confidentiality, tags |
| `GET` | `/api/fundraising/documents/:documentId/download` | Auth-gated binary |

### Option B — confirm FE aggregation

If BE declines a unified resource, confirm FE should:

1. `GET /fundraising/campaigns` → for each campaign `GET …/data-rooms` → `GET /fundraising/data-rooms/:id`
2. `GET /fundraising/agreements?campaignId=` → flatten versions
3. Merge + dedupe in FE with `sourceType`: `DATA_ROOM` \| `AGREEMENT` \| `DDQ_EVIDENCE`

Document expected pagination/search limits so FE does not overload the browser.

### Query params — `GET /api/fundraising/documents` (Option A)

`campaignId`, `investorId`, `opportunityId`, `category`, `q`, `confidential`, `sourceType`, `page`, `pageSize`

**category examples:** `Legal`, `Track Record`, `Marketing`, `Due Diligence`, `KYC`, `Financials`  
**sourceType:** `DATA_ROOM` \| `AGREEMENT` \| `DDQ_EVIDENCE` \| `UPLOAD`

### Example — `GET /api/fundraising/documents?campaignId=<id>`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "doc-uuid-1",
        "name": "ZGF II Investor Presentation",
        "category": "Marketing",
        "sourceType": "DATA_ROOM",
        "sourceId": "data-room-doc-uuid",
        "campaignId": "<campaignId>",
        "campaignName": "Fund IV First Close",
        "investorId": null,
        "confidential": true,
        "status": "ACTIVE",
        "currentVersion": {
          "versionNumber": 2,
          "fileName": "ZGF-II-Teaser-v2.pdf",
          "uploadedAt": "2026-07-10T09:00:00.000Z",
          "uploadedBy": { "id": "…", "displayName": "Tariro Moyo" }
        },
        "versionCount": 2
      },
      {
        "id": "doc-uuid-2",
        "name": "Subscription — NPF",
        "category": "Legal",
        "sourceType": "AGREEMENT",
        "sourceId": "agreement-uuid",
        "campaignId": "<campaignId>",
        "investorId": "<investorId>",
        "confidential": true,
        "status": "PENDING_SIGNATURE",
        "currentVersion": {
          "versionNumber": 1,
          "fileName": "Sub-Agreement-NPF-v1.pdf",
          "uploadedAt": "2026-07-12T11:00:00.000Z"
        },
        "versionCount": 1
      }
    ],
    "page": 1,
    "pageSize": 25,
    "total": 2
  }
}
```

### Example — `GET /api/fundraising/documents/:documentId`

```json
{
  "success": true,
  "data": {
    "id": "doc-uuid-1",
    "name": "ZGF II Investor Presentation",
    "category": "Marketing",
    "campaignId": "<campaignId>",
    "confidential": true,
    "versions": [
      {
        "versionNumber": 2,
        "fileName": "ZGF-II-Teaser-v2.pdf",
        "uploadedAt": "2026-07-10T09:00:00.000Z",
        "uploadedBy": { "id": "…", "displayName": "Tariro Moyo" },
        "downloadPath": "/api/fundraising/documents/doc-uuid-1/versions/2/download"
      },
      {
        "versionNumber": 1,
        "fileName": "ZGF-II-Teaser-v1.pdf",
        "uploadedAt": "2026-06-20T14:00:00.000Z"
      }
    ]
  }
}
```

### Expected error codes

| code | HTTP | When |
|------|------|------|
| `DOCUMENT_NOT_FOUND` | 404 | Bad id |
| `VALIDATION_ERROR` | 400 | Missing category or campaign link |
| `FORBIDDEN` | 403 | Confidential doc — user lacks campaign/investor scope |
| `DOWNLOAD_LIMIT_EXCEEDED` | 429 | Data-room download cap (if propagated to index) |

### FE verify steps

1. `/fundraising/documents` loads unified list without N+1 client fan-out.
2. Filter by `campaignId` and category “Legal” returns agreement + data-room docs.
3. Search `q=teaser` matches across sources.
4. Version drawer shows history from `GET …/documents/:id`.
5. Download uses auth-gated endpoint (not public URL).

### FE files that consume this

- `components/fundraising/fundraising-documents.tsx` — live-wired (this pass)
- `lib/api/fundraising-api.ts` (`listDocuments`, `createDocument`, `downloadDocument`)
- `lib/fundraising/mappers.ts` (`mapDocumentRow`, `DOCUMENT_SOURCE_LABEL`)
- Unrelated / unchanged: `components/fundraising/fundraising-data-rooms.tsx`,
  `components/fundraising/fundraising-agreements.tsx` (still manage data rooms and agreements
  directly — the Documents tab is a read/upload index on top, not a replacement for those tabs)

---

## 4. Campaign email/roadshow engagement metrics

**Status: ✅ SHIPPED on BE + FE wired** — `GET /fundraising/campaigns/:campaignId/engagement` is
live (`fundraisingApi.getCampaignEngagement`). `components/fundraising/fundraising-campaigns.tsx`
now fetches real engagement per campaign card and renders sent/opened/replied/meetings
booked/materials downloaded/progress % in place of the old mock fields.

### Product rule / why

The Campaigns tab summary cards (`components/fundraising/fundraising-campaigns.tsx`) previously showed mocked **Sent / Opened / Replied**, **Meetings Booked**, **Materials Downloaded**, and a **Progress %** bar per campaign. `GET /fundraising/campaigns` has no equivalent fields, so as of this wiring pass those metrics were removed from the card (replaced with real `target`, `currency`, `owner`, `startDate`/`closeDate`, and status) rather than showing fabricated numbers.

### Proposed endpoint

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/campaigns/:campaignId/engagement` | Email/roadshow engagement rollup |

```json
{
  "success": true,
  "data": {
    "campaignId": "…",
    "sent": 165,
    "opened": 112,
    "replied": 38,
    "meetingsBooked": 24,
    "materialsDownloaded": 51,
    "progressPct": 47
  }
}
```

Alternatively, expose these as extra fields on `GET /fundraising/campaigns/:campaignId/dashboard` (already fetched per-campaign) to avoid a new endpoint.

### FE interim behaviour (until BE ships)

- Campaign cards show target/currency/owner/dates + an **Activate campaign** action for `DRAFT` campaigns instead of engagement metrics.
- The Overview tab's Communications / Templates / Events / Lists / Materials panels remain on illustrative mock data (`campaigns-mock-data.ts`) — they were out of scope for this wiring pass and have no assigned endpoints in `fundraising-frontend-api.md` (Communications could map to `GET /fundraising/communications`, but templates/events/lists/materials have no resource yet).

### FE files that will consume

- `components/fundraising/fundraising-campaigns.tsx`
- `lib/fundraising/mappers.ts` (`mapCampaignCard`)

---

## 5. Forecast scenario monthly close time-series

**Status: ✅ SHIPPED on BE + FE wired** — `GET /fundraising/forecasts/scenarios/:scenarioId/curve`
(`fundraisingApi.getForecastScenarioCurve`) and `monthlyProjection[]` on the scenario payload are
live. `components/fundraising/fundraising-forecasts.tsx` now renders the monthly cumulative close
chart from real data (falling back to the curve endpoint when the scenario list item has no
`monthlyProjection`), and the "not available" placeholder has been removed.

### Product rule / why

The Forecasts tab (`/fundraising/forecasts`) shows a "Monthly close curve" chart — cumulative signed
capital by month for the selected scenario. `GET /fundraising/forecasts/scenarios` and
`POST /fundraising/forecasts/scenarios` only return scenario totals (`projectedSigned`,
`projectedAum`, `projectedFees`) plus an opaque `assumptions` blob — there is no monthly/quarterly
cadence data. FE will not fabricate a curve from the totals (guardrail: no fake "live" numbers), so
this chart currently shows an honest empty state instead of a line.

### Proposed change

Either:

- Add `monthlyProjection: [{ month: "2026-08", cumulativeSigned: number }]` to the scenario
  create/read payload, populated server-side from the assumptions + close velocity, **or**
- Add a dedicated `GET /fundraising/forecasts/scenarios/:scenarioId/curve` endpoint returning the
  same shape.

### FE verify steps

1. Create/edit a scenario on `/fundraising/forecasts`.
2. Monthly close curve renders from real time-series instead of the "not available" placeholder.

### FE files that will consume

- `components/fundraising/fundraising-forecasts.tsx`
- `lib/api/fundraising-api.ts` (`listForecastScenarios` / `createForecastScenario`)

### FE interim behaviour (until BE ships)

- KPI cards, funnel table (`analytics/funnel`) and source table (`analytics/source`) are fully live.
- Monthly close curve card shows an honest "not available yet" message linking to this ask instead
  of a chart.

---

## 6. Mandate / RFP classification fields (asset class, geography, RFP score)

**Status: ✅ SHIPPED on BE + FE wired** — `assetClass` / `geography` / `rfpDueDate` on mandates and
`assetClass` / `geography` / `fitScore` on RFPs are live. `lib/fundraising/mappers.ts`
(`mapMandateRow`, `mapRfpRow`) now read these fields directly instead of falling back to `—`, and
`components/fundraising/fundraising-mandates.tsx` displays them on rows (geography, due date,
score) and in the detail panel (asset class). The mandate create wizard also captures asset class,
geography, and RFP due date.

### Product rule / why

The Mandates tab (`/fundraising/mandates`) list and detail cards previously showed **asset class**,
**geography**, and an RFP **fit score** per row (mock data). `GET /fundraising/mandates` and
`GET /fundraising/rfps` return investor linkage, status, `expectedAum`, and (for RFPs)
`deadline` / `outcome`, but no `assetClass`, no dedicated mandate/RFP `geography` (FE falls back to
the linked investor's `countryCode`, which is not the same concept as mandate scope geography), and
no RFP evaluation `score`. Per the no-fake-numbers guardrail, the wired UI now shows `—` for these
cells instead of the old mock values.

### Proposed fields

Add to `GET /fundraising/mandates` and `GET /fundraising/mandates/:id`:

```json
{
  "assetClass": "Private Equity",
  "geography": "Sub-Saharan Africa",
  "rfpDueDate": "2026-09-30"
}
```

Add to `GET /fundraising/rfps` and `GET /fundraising/rfps/:id`:

```json
{
  "assetClass": "Fixed Income",
  "geography": "Southern Africa",
  "fitScore": 78
}
```

### FE files that will consume

- `components/fundraising/fundraising-mandates.tsx`
- `lib/fundraising/mappers.ts` (`mapMandateRow`, `mapRfpRow`)

### FE interim behaviour (until BE ships)

- Asset class / geography / score cells render `—`; `ScoreBadge` shows `—` for `null` scores instead
  of a fabricated number.

---

## 7. Placement agent commission accrual status

**Status: ✅ SHIPPED on BE + FE wired** — agent list/detail now returns `commissionStatus`,
`accruedCommission`, `paidCommission`, and the dedicated rollup
`GET /fundraising/placement-agents/:agentId/commissions` (`fundraisingApi.listPlacementCommissions`)
is live. `components/fundraising/fundraising-placement-agents.tsx` shows the real commission chip,
accrued/paid amounts in the detail panel, and a commissions list per agent.

### Product rule / why

The Placement Agents tab (`/fundraising/placement-agents`) previously showed a per-agent
**commission status** chip (`Accruing` / `Paid` / `On Hold`) and an aggregate **"Accruing
Commissions"** KPI (mock: `US$142K`). `GET /fundraising/placement-agents` and
`POST .../placement-agents` (per `fundraising-frontend-api.md`) only model `commissionPct`,
`retainer`, `successFee`, and appointment window — there is no computed commission accrual amount
or lifecycle status (accruing vs. invoiced vs. paid vs. on hold) tied to funded commitments.

Today the wired UI shows the commission chip as `—` and replaced the KPI with real, computable
sums (introduced-opportunity counts and eligible pipeline amount) rather than a fabricated accrual
figure.

### Proposed fields / endpoint

Either add to `GET /fundraising/placement-agents/:agentId`:

```json
{
  "commissionStatus": "ACCRUING",
  "accruedCommission": 142000,
  "paidCommission": 38000,
  "currency": "USD"
}
```

Or a dedicated rollup:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/placement-agents/:agentId/commissions` | Accrual ledger (accruing / invoiced / paid) |

### FE verify steps

1. Agent detail chip shows real `commissionStatus` instead of `—`.
2. "Eligible Pipeline" KPI can be replaced by / supplemented with real accrued commission total.

### FE files that will consume

- `components/fundraising/fundraising-placement-agents.tsx`
- `lib/fundraising/mappers.ts` (`mapPlacementAgentRow`)

---

## 8. Commitment-level checklist (vs. opportunity checklist)

**Status: ✅ SHIPPED on BE + FE wired** — `GET/PATCH /fundraising/commitments/:commitmentId/checklist`
(`fundraisingApi.getCommitmentChecklist`, `patchCommitmentChecklistItem`) are live.
`components/fundraising/fundraising-commitments.tsx` now loads the dedicated closing checklist per
commitment (no longer proxying the linked opportunity's checklist), and toggling an item calls the
PATCH endpoint and refreshes the list.

### Product rule / why

The Commitments tab (`/fundraising/commitments`) detail panel shows a per-commitment closing
checklist (subscription docs, wire instructions, etc.). There is no
`GET /fundraising/commitments/:id/checklist` — only
`GET /fundraising/opportunities/:opportunityId/checklist`. FE currently substitutes the linked
opportunity's checklist as the closest available proxy, which conflates pipeline-stage checklist
items with closing/funding checklist items.

### Proposed endpoint

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/commitments/:commitmentId/checklist` | Closing/funding-specific checklist items |
| `PATCH` | `/api/fundraising/commitments/:commitmentId/checklist/:itemId` | Toggle item done |

### FE interim behaviour (until BE ships)

- Detail panel labels the checklist "Opportunity checklist" and reuses
  `getOpportunityChecklist(opportunityId)` from the commitment's linked opportunity.

### FE files that will consume

- `components/fundraising/fundraising-commitments.tsx`
- `lib/api/fundraising-api.ts` (`getOpportunityChecklist`)

---

## Priority recommendation

All 8 gaps below are **SHIPPED on BE and wired on FE**.

| # | Gap | Blocks | Suggested priority | BE | FE |
|---|-----|--------|-------------------|----|----|
| 1 | Settings CRUD | Configurable pipelines + gate editing | **P1** — core product rule | ✅ Shipped | ✅ Wired |
| 2 | Meetings resource | Calendar UX, schedule flows | **P2** — workaround via communications exists | ✅ Shipped | ✅ Wired |
| 3 | Documents index | Cross-campaign library + search | **P2** — aggregator workable at small scale | ✅ Shipped | ✅ Wired |
| 4 | Campaign engagement metrics | Overview/Campaigns tab card stats | **P3** — cosmetic, cards work without it | ✅ Shipped | ✅ Wired |
| 5 | Forecast monthly close time-series | Forecasts tab close-curve chart | **P3** — KPIs/funnel/source live without it | ✅ Shipped | ✅ Wired |
| 6 | Mandate/RFP asset class, geography, score | Mandates tab classification & RFP fit scoring | **P2** — cosmetic but used for triage | ✅ Shipped | ✅ Wired |
| 7 | Placement agent commission accrual | Placement Agents commission chip + KPI | **P2** — needed for accurate commission ops | ✅ Shipped | ✅ Wired |
| 8 | Commitment-level checklist | Commitments detail closing checklist accuracy | **P3** — opportunity checklist works as proxy | ✅ Shipped | ✅ Wired |

---

# New asks from the full-module requirements recheck (2026-07-17)

Source: [`fundraising-gap-analysis.md`](./fundraising-gap-analysis.md). Gaps 1–8 above are shipped.
Gaps **9+** below are **NOT shipped** — they block the FE items marked ⛔ in the gap analysis. Each
FE tab now ships the surrounding UI (with honest disabled/empty "pending backend" states) and will
wire to these endpoints as they land.

> **Status of all gaps below: ⛔ NOT SHIPPED — awaiting BE.**

---

## 9. Extended Investor directory filters + duplicate contract + list rollups

### Product rule / why
SRD Investor Directory requires advanced filtering and a rich list. `GET /investors` currently only
accepts `q`, `status`, `investorType`, `page`, `pageSize`.

### Proposed — extend `GET /api/investors` query params
`country`, `jurisdiction`, `kycStatus`, `sanctionsStatus`, `riskRating`, `investorClassification`,
`campaignId`, `relationshipOwnerId`, `minAum`, `maxAum` (+ existing).

### Proposed — list item rollup fields
```json
{
  "commitmentsSummary": { "count": 3, "totalSigned": 1500000, "currency": "USD" },
  "openOpportunities": 2,
  "lastContactAt": "2026-07-01T10:00:00.000Z",
  "relationshipOwnerName": "Kwame Asante",
  "estimatedAum": 25000000
}
```

### Duplicate rejection contract
`POST /investors` must reject duplicate `legalName`/`registrationNumber` with a stable code:
```json
{ "success": false, "error": { "code": "DUPLICATE_INVESTOR", "field": "legalName", "existingId": "…" } }
```

### FE consumes
`components/fundraising/fundraising-investors.tsx`, `lib/fundraising/mappers.ts` (`mapInvestorOrg`)

---

## 10. Global contacts index + contact comms history

### Product rule / why
Contacts tab currently N+1s through investors and caps at 20 orgs
(`MAX_INVESTORS_FOR_CONTACT_FETCH`), so contacts beyond the first 20 orgs are invisible.

### Proposed endpoint
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/contacts` (or `/api/investors/contacts`) | Paginated cross-org contacts index |

Query params: `q`, `investorId`, `ownerId`, `decisionInfluence`, `campaignId`, `page`, `pageSize`.
Response items should embed `investor` (id, legalName), `decisionInfluence`, `email`, `phone`,
`department`, `lastContactAt`, `campaigns[]`.

### Also
Add `contactId` to `GET /fundraising/communications` query params for per-contact history.

### FE consumes
`components/fundraising/fundraising-contacts.tsx`, `lib/fundraising/mappers.ts` (`mapContactRow`)

---

## 11. Campaign templates / lists / events / materials + approval + pause

### Product rule / why
Campaigns Overview hub shows Communications, Templates, Distribution Lists, Roadshow Events, and
Materials. Only Communications maps to an existing endpoint
(`GET /fundraising/communications?campaignId=`). The rest have no resource.

### Proposed endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET/POST` | `/api/fundraising/campaigns/:id/templates` | Email/collateral templates |
| `GET/POST` | `/api/fundraising/campaigns/:id/lists` | Distribution lists (target segments) |
| `GET/POST` | `/api/fundraising/campaigns/:id/events` | Roadshow / event schedule |
| `GET/POST` | `/api/fundraising/campaigns/:id/materials` | Marketing materials + versions |
| `POST` | `/api/fundraising/campaigns/:id/submit-for-approval` | Route campaign for activation approval |
| `POST` | `/api/fundraising/campaigns/:id/pause` | Pause an active campaign |

### FE interim
Overview sub-panels keep illustrative data (`campaigns-mock-data.ts`) with a "pending backend"
label; Communications panel wired to `GET /fundraising/communications?campaignId=`.

### FE consumes
`components/fundraising/fundraising-campaigns.tsx`

---

## 12. RFP lifecycle + mandate/RFP stage + tender pack + auto onboarding

### Product rule / why
Mandates tab can create mandates but not RFPs, cannot set RFP outcome, and has no AM pipeline stage
or tender submission pack.

### Proposed endpoints / fields
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/rfps` | Create RFP |
| `PATCH` | `/api/fundraising/rfps/:id` | Outcome (WON/LOST/PENDING), loss reason, debrief, commercial info |
| `GET/POST` | `/api/fundraising/rfps/:id/proposal-versions` | Tender proposal versions + approval routing |

Add a `stageCode`/`stageName` (AM pipeline) to mandate + RFP records, or document that institutional
mandates should be modelled as opportunities on an `INSTITUTIONAL_MANDATE` campaign and advanced via
the existing `POST /fundraising/opportunities/:id/transition` board.

On RFP outcome `WON`, confirm whether BE auto-creates the Mandate Onboarding case (SRD says it
should) or FE must call `POST /fundraising/kyc-cases`.

### FE consumes
`components/fundraising/fundraising-mandates.tsx`, `fundraising-create-wizards.tsx`

---

## 13. DDQ item status, Q&A threads, answer library, reviewer approvals

### Product rule / why
Due Diligence needs a full DDQ lifecycle beyond evidence upload.

### Proposed endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/api/fundraising/ddq/cases/:caseId/items/:itemId` | Update matrix cell status (Requested → Reviewed → Follow-up) + owner + due |
| `GET/POST` | `/api/fundraising/ddq/cases/:caseId/questions` | Q&A thread (question, replies, attachments, resolve) |
| `GET/POST` | `/api/fundraising/ddq/answer-library` | Approved answer library |
| `POST` | `/api/fundraising/ddq/cases/:caseId/items/:itemId/comments` | Reviewer comments |
| `GET` | `/api/fundraising/ddq/cases/:caseId/items/:itemId/evidence/:evidenceId/download` | Evidence download |
| `GET` | `/api/fundraising/ddq/cases/:caseId/export` | Export DDQ report |

Also document the `PATCH /ddq/cases/:caseId` body for case status transitions
(`INTERNAL_REVIEW`/`APPROVED`/`SUBMITTED`) and an archive action.

### FE consumes
`components/fundraising/fundraising-due-diligence.tsx`

---

## 14. Data room revoke + granular permissions + monitoring

### Product rule / why
Data Rooms need enforceable security per SRD (view-only, download limits, watermark, expiry, revoke,
failed-login monitoring).

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `DELETE` | `/api/fundraising/data-rooms/:id/access/:accessId` | Revoke a grant |
| `PATCH` | `/api/fundraising/data-rooms/:id` | Set room status REVOKED/EXPIRED; watermark/expiry defaults |

Extend `POST /data-rooms/:id/access` body: `permissionLevel` (`VIEW_ONLY`/`DOWNLOAD`),
`downloadLimit`, `contactId`, `watermarkEnabled`. Extend
`POST /data-rooms/:id/documents` with `folderId`, `viewOnly`, `downloadLimit`, `watermarkEnabled`.
Add monitoring fields to `GET /data-rooms/:id`: `failedLogins`, activity `device`/`country`.

### FE consumes
`components/fundraising/fundraising-data-rooms.tsx`

---

## 15. Document versioning (new version + per-version download) + export

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/documents/:id/versions` | Upload new version of existing doc |
| `GET` | `/api/fundraising/documents/:id/versions/:n/download` | Per-version download |
| `GET` | `/api/fundraising/documents/export` | Export inventory (CSV/XLSX) |

`GET /documents/:id` already returns `versions[]` (see gap 3) — FE will wire the history drawer to it.

### FE consumes
`components/fundraising/fundraising-documents.tsx`

---

## 16. Agreements e-sign provider + decline + signed-copy/certificate

### Product rule / why
Agreements currently use a manual-ack "Mark signed" with a decorative signature. Institutional e-sign
needs a real provider, sequencing, decline, and downloadable signed output.

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/agreements/:id/send` | Dispatch to e-sign provider (sequence, expiry) |
| `POST` | `/api/fundraising/agreements/:id/signatories/:sigId/decline` | Decline with reason |
| `GET` | `/api/fundraising/agreements/:id/signed-copy` | Download completed signed PDF |
| `GET` | `/api/fundraising/agreements/:id/certificate` | Download completion certificate / audit trail |

Enforce `sequenceOrder`; expose `checksum` on bound versions; return voided-signatory state after a
new version supersedes.

### FE interim
Keep manual sign flow; add `sequenceOrder`/`expiresAt` inputs; certificate/decline buttons show
"pending backend" until endpoints land.

### FE consumes
`components/fundraising/fundraising-agreements.tsx`

---

## 17. Compliance hold/release + KYC lifecycle transitions

### Product rule / why
Onboarding infers compliance holds client-side. SRD needs a server-authoritative hold with a release
workflow, and full KYC status machine.

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/investors/:id/compliance-hold` | Place hold (reason) |
| `POST` | `/api/fundraising/investors/:id/compliance-hold/release` | Release hold (reason, approver) |

Document `PATCH /fundraising/kyc-cases/:id` body for terminal transitions
(`APPROVED`/`REJECTED`/`CONDITIONS`/`MORE_INFORMATION_REQUIRED`) incl. `docsNote`, conditions, and
captured fields (UBO, tax, SoW/SoF, sanctions, banks). Return structured `unmetRequirements` on
activate failure.

### FE consumes
`components/fundraising/fundraising-onboarding.tsx`

---

## 18. Placement agent exclusions + commission lifecycle actions

### Product rule / why
Placement Agents shows commissions read-only and cannot manage exclusions or payouts.

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST/DELETE` | `/api/fundraising/placement-agents/:id/exclusions` | Manage restricted investors/geographies |
| `DELETE` | `/api/fundraising/placement-agents/:id/opportunities/:oppId` | Unassign opportunity |
| `POST` | `/api/fundraising/placement-agents/:id/commissions/:commissionId/pay` | Mark paid / on-hold |

Confirm `assign-opportunity` rejects excluded investors/geographies, and commission accrual is tied
to funded amounts on covered opportunities only.

### FE consumes
`components/fundraising/fundraising-placement-agents.tsx`

---

## 19. Closing entity CRUD + readiness + post-close provisioning

### Product rule / why
Commitments shows closings as a read-only timeline. SRD needs full closing entities with readiness
gates and post-close provisioning.

### Proposed (confirm — some client helpers exist: `createClosing`, `patchClosing`, `postClosingReadiness`)
| Method | Path | Purpose |
|--------|------|---------|
| `POST/PATCH` | `/api/fundraising/closings[/:id]` | Create/edit closing (First/Interim/Final, target, date) |
| `POST` | `/api/fundraising/closings/:id/readiness` | Legal/compliance/fund/equalisation/pack approvals |
| `GET` | `/api/fundraising/closings/:id` | Full closing record incl. investors in scope |

Confirm admit/fund return structured `COMPLIANCE_BLOCKED` + `unmetRequirements`, and that admission
auto-provisions LP relationship / portal access / capital-call contacts (post-close).

### FE consumes
`components/fundraising/fundraising-commitments.tsx`

---

## 20. Reports scheduling + artifact export + run history

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/reports` | Full catalog (Investor, Commercial, Mandate categories incl.) |
| `POST` | `/api/fundraising/reports/:key/run` | Async run → jobId |
| `GET` | `/api/fundraising/reports/jobs/:jobId` | Job status + artifact URL |
| `GET/POST/PATCH/DELETE` | `/api/fundraising/reports/schedules` | Schedule CRUD (recipients, format, cadence) |
| `GET` | `/api/fundraising/reports/:key/history` | Last-run history |

`GET /reports/:reportKey` (synchronous JSON) already exists — FE renders it as a table today.

### FE consumes
`components/fundraising/fundraising-reports.tsx`

---

## 21. Forecast assumption recalculation + concentration/geo analytics

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/forecasts/scenarios/:id/recalculate` | Recompute projected signed/AUM/fees + curve from assumptions |
| `GET` | `/api/fundraising/analytics/concentration` | Investor/geo/sector concentration |
| `GET` | `/api/fundraising/analytics/geography` | Geo distribution for map |

Owner performance (`/analytics/owner-performance`) + stage ageing (`/analytics/stage-ageing`) already
exist — FE will wire panels to them.

### FE interim
Assumption dialog keeps manual projected-total entry with a note that server recalculation is
pending; owner/ageing panels wired to existing endpoints.

### FE consumes
`components/fundraising/fundraising-forecasts.tsx`

---

## 22. Dashboard revenue/trend fields

### Proposed — extend `GET /api/fundraising/dashboard`
```json
{
  "grossPipeline": 42000000,
  "expectedRevenue": 1250000,
  "trends": { "signed": { "value": 12.5, "direction": "up" } },
  "openTasks": 7,
  "upcomingClosings": 2
}
```
FE builds Recent Activity + Upcoming Actions from existing `listMeetings`/`listTasks`/`listApprovals`/
`listCommunications` in the interim.

### FE consumes
`components/fundraising/fundraising-dashboard.tsx`

---

## 23. Approvals producers (manual create) + history

### Product rule / why
Approvals inbox can only consume/decide. Nothing upstream (campaign activation, concessions, stage
overrides) creates approval rows or blocks until decided.

### Proposed
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/fundraising/approvals` | Create approval request (type, objectId, amount, reason) |
| `GET` | `/api/fundraising/approvals/:id/history` | Multi-event decision trail |

Confirm whether BE auto-generates approvals on concession/activation/override, and that decisions
propagate to the source object (unblock/block). `putCommercialTerms`/`getCommercialTerms` exist —
confirm threshold-breach → approval behaviour.

### FE consumes
`components/fundraising/fundraising-approvals.tsx`, `fundraising-campaigns.tsx`, `fundraising-pipeline.tsx`

---

## 24. Audit date-range filter + export

### Proposed — extend `GET /api/fundraising/audit-logs`
Add `from`, `to` query params (in addition to existing `objectType`, `objectId`, `userId`, `action`,
`limit`). Add `role`, `sessionId`, `device` to the event detail payload.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/fundraising/audit-logs/export` | Export trail (the export itself audited) |

### FE consumes
`components/fundraising/fundraising-audit.tsx`, `lib/fundraising/mappers.ts` (`mapAuditLogRow`)

---

## 25. Human-readable relationship fields in list and analytics responses

### Product rule / why
The frontend must never show database UUIDs as owner, requester, assignee, user, object or related
entity labels. Creation forms can submit IDs selected from directory dropdowns, but read responses
must embed the corresponding display names so exports and historical records remain readable even
when a directory entry is later disabled.

### Required response enrichment
No new write endpoint is requested. Extend the existing responses:

| Method + path | Required embedded fields |
|---|---|
| `GET /api/fundraising/opportunities` and campaign board | `opportunityOwnerName`; nested `investor.legalName`, `campaign.name`, `currentStage.stageName` |
| `GET /api/fundraising/communications` | `ownerName`; nested investor/contact/campaign/opportunity display objects |
| `GET /api/fundraising/tasks` | `ownerName` or `assignee: { id, fullName, email }`; related campaign/investor/opportunity names |
| `GET /api/fundraising/mandates` | `ownerName`, `nextStepName` when next step references a workflow/task |
| `GET /api/fundraising/analytics/owner-performance` | `ownerName` alongside `ownerId` |
| `GET /api/fundraising/approvals` and `GET /:id/history` | `requesterName`, `decidedByName`, `objectLabel` |
| `GET /api/fundraising/audit-logs` and `/export` | `userName`, `objectLabel`, and a non-empty `summary`/`description` |

Example:
```json
{
  "id": "<recordId>",
  "ownerId": "<userId>",
  "ownerName": "Ada Owner",
  "objectId": "<opportunityId>",
  "objectLabel": "National Pension Fund — Fund IV",
  "summary": "Soft circle amount changed from USD 1m to USD 2m"
}
```

Keep IDs in responses for navigation and filtering. Names are additive. If a relation no longer
exists, return a persisted snapshot name or `"Deleted user"` rather than omitting the field.

### Errors
These are GET response enrichments and introduce no new error code. Existing authentication,
`*_NOT_FOUND`, and validation responses remain unchanged.

### FE verification
1. Open Pipeline, Communications, Meetings & Tasks, Mandates, Forecasts, Approvals and Audit Logs.
2. Confirm no UUID pattern is visible in owner/user/object/related-entity cells or detail cards.
3. Export each table and confirm the CSV contains names/labels, while IDs remain available only as
   non-visible linkage data.
4. Disable a user and confirm historical audit/approval labels remain readable.

### FE consumes
`components/fundraising/fundraising-pipeline.tsx`,
`components/fundraising/fundraising-communications.tsx`,
`components/fundraising/fundraising-meetings.tsx`,
`components/fundraising/fundraising-mandates.tsx`,
`components/fundraising/fundraising-forecasts.tsx`,
`components/fundraising/fundraising-approvals.tsx`,
`components/fundraising/fundraising-audit.tsx`,
`lib/fundraising/mappers.ts`.

### Contract note: investor commitment summary
`GET /api/investors` currently returns `commitmentsSummary` as:
```json
{ "count": 2, "totalSigned": 5000000, "currency": "USD" }
```
FE now formats this object into a readable amount/count string. Keep this object shape stable and
do not alternate between object and string across list responses.

---

## Related docs

- [`fundraising-gap-analysis.md`](./fundraising-gap-analysis.md) — full FE/BE gap matrix (this pass)
- [`fundraising-frontend-api.md`](./fundraising-frontend-api.md) — live contract for all other tabs
- [`fundraising-settings-stages.md`](./fundraising-settings-stages.md) — Settings tab stage flows
- [`fundraising-meetings-stages.md`](./fundraising-meetings-stages.md) — Meetings tab stage flows
- [`fundraising-documents-stages.md`](./fundraising-documents-stages.md) — Documents tab stage flows
- [`fundraising-srd-fe-handoff.md`](./fundraising-srd-fe-handoff.md) — happy-path smoke order
