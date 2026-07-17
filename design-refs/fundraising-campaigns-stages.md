# Campaigns — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Campaign management, creation workflow, activation gates, communications hub  
**Route:** `/fundraising/campaigns`  
**Component:** `components/fundraising/fundraising-campaigns.tsx`  
**Wizard:** `FrCampaignWizard` in `fundraising-create-wizards.tsx`  
**Mock:** `campaigns-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-campaigns-backend-asks.md` *(create on first BE gap)*

**Product rules**

- A campaign is one fundraising initiative (fundraise, product launch, mandate, SPV, co-invest).
- Must link **Type + Product/Fund + Strategy**; targets include raise/min/hard cap and close dates where PE/VC.
- **Cannot activate** until: product exists, targets approved, documents uploaded, pipeline configured, team assigned, compliance approval completed.
- No campaign may bypass approvals.

---

## Status diagram

```
[0 Orient hub]
   → [1 Browse Overview / sub-tabs]
   → [2 Create campaign wizard]
   → [3 Submit for approval]
   → [4 Activate (gates met)]
   → [5 Operate hub: timeline / materials / lists / events]
   → [6 Pause / Archive]
```

---

## Stage 0 — Orient the Campaigns hub

| | |
|---|---|
| **Who** | IR Officer / Head of Fundraising |
| **Goal** | Confirm workspace tabs and mock campaign health |
| **Steps** | 1. Open `/fundraising/campaigns`. 2. Note tabs: Overview, Campaigns, Communications, Templates, Lists, Events, Materials. |
| **Done when** | Hub loads with campaign cards or empty state (live). |
| **FE now / BE blocked** | Mock Overview with Live/Planned cards. No API. |

---

## Stage 1 — Browse overview and sub-tabs

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Read campaign progress, timeline, collateral without editing |
| **Steps** | 1. Scan Live/Planned cards (target, progress, engagement KPIs). 2. Read Communications Timeline. 3. Open Templates / Lists / Events / Materials panels. |
| **Done when** | User can describe campaign status from the hub. |
| **FE now / BE blocked** | Panels populated from mock. “View all / Manage” often non-functional. |

---

## Stage 2 — Create campaign (wizard)

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Draft a new campaign with identity, targets, pipeline template, owners |
| **Steps** | 1. **New Campaign**. 2. Identity (name, type). 3. Target & horizon. 4. Pipeline template. 5. Owners / team. 6. Review → submit. |
| **Done when** | Campaign exists in **Draft** (or equivalent) with required fields. |
| **FE now / BE blocked** | Wizard: Identity → Target → Pipeline → Owners → Review. Toast only — **no list append**. Missing Fund/Product/Strategy, min/hard cap, close dates, investor segments, jurisdictions. |

---

## Stage 3 — Approval

| | |
|---|---|
| **Who** | Compliance / Approver (see Approvals tab) |
| **Goal** | Approve targets and campaign activation request |
| **Steps** | 1. Submit campaign for approval. 2. Approver reviews in Approvals (or inline). 3. Status → Approved / Rejected with reason. |
| **Done when** | Approval decision recorded; campaign cannot skip this. |
| **FE now / BE blocked** | **Missing** in Campaigns UI. Approvals tab has “Campaign activation” type in mock only — not wired. |

---

## Stage 4 — Activate

| | |
|---|---|
| **Who** | Head of Fundraising (after approval) |
| **Goal** | Move campaign to Live only when activation gates pass |
| **Steps** | 1. Confirm product/fund linked. 2. Targets approved. 3. Required docs uploaded. 4. Pipeline configured. 5. Team assigned. 6. Compliance approval done. 7. Launch / Activate. |
| **Done when** | Campaign status is Live/Active; opportunities can attach. |
| **FE now / BE blocked** | Live/Planned badges only. **No gate checklist or activate action.** BE must return structured unmet gates. |

---

## Stage 5 — Operate the hub

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Run outreach: timeline, materials versions, lists, events |
| **Steps** | 1. Log or view communications tied to campaign. 2. Manage materials (version, status, owner). 3. Maintain distribution lists and roadshow events. |
| **Done when** | Activity and materials reflect real campaign work. |
| **FE now / BE blocked** | Mock timeline/materials. No create/edit persistence for hub artifacts. |

---

## Stage 6 — Pause or archive

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Stop or retire a campaign without deleting history |
| **Steps** | 1. Pause (no new opportunities / outreach) or Archive. 2. Confirm historical data remains queryable. |
| **Done when** | Status reflects Pause/Archive; audit entry written. |
| **FE now / BE blocked** | Actions not in UI (SRD: Edit / Launch / Pause / Archive). |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Orient | Mock | Hub tabs present |
| 1 Browse | Mock | View-all often inert |
| 2 Create | Partial | Wizard; toast only |
| 3 Approval | Missing | Not wired |
| 4 Activate | Missing | No gates |
| 5 Operate | Partial | Mock collateral |
| 6 Pause/Archive | Missing | No actions |
