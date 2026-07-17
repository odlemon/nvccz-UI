# Mandates & RFPs — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Asset Management mandates, RFI/RFP/tenders, AM pipeline, activation ≠ award  
**Route:** `/fundraising/mandates`  
**Component:** `components/fundraising/fundraising-mandates.tsx`  
**Wizard:** `FrMandateWizard`  
**Mock:** `mandates-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-mandates-backend-asks.md` *(create on first BE gap)*

**Product rules**

- AM path: Target Client → Discovery → Qualified → RFP → Proposal → Presentation → Preferred Bidder → Negotiation → Awarded → Transition → Activated.
- Winning/awarding does **not** activate AUM; onboarding checklist required.
- Successful tenders convert into Mandate Onboarding automatically.
- Commercial concessions outside thresholds create Approvals.

---

## Status diagram

```
[0 Open Mandates]
   → [1 Browse / filter table]
   → [2 Detail: contacts, docs, meetings]
   → [3 Create mandate / RFP]
   → [4 Advance AM pipeline stages]
   → [5 Submit tender pack]
   → [6 Outcome Won/Lost → Onboarding]
```

---

## Stage 0 — Open Mandates & RFPs

| | |
|---|---|
| **Who** | BD / IR (AM) |
| **Goal** | Land on institutional mandate workspace |
| **Steps** | 1. Open `/fundraising/mandates`. 2. Confirm table + detail panel. |
| **Done when** | Workspace loads. |
| **FE now / BE blocked** | Mock table + detail. No KPI strip (Active RFPs, Won, Lost, AUM). |

---

## Stage 1 — Browse and filter

| | |
|---|---|
| **Who** | BD |
| **Goal** | Find mandates by stage, asset class, geography, deadline |
| **Steps** | Search; use filters; open Saved Views when available. |
| **Done when** | Working set identified. |
| **FE now / BE blocked** | Search present; several filter selects are non-functional shells. |

---

## Stage 2 — Mandate detail

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Work relationship context for one mandate |
| **Steps** | Select row → contacts, interactions, documents, emails, meetings, score, next step, checklist/docs panels. |
| **Done when** | Enough context to advance stage or schedule work. |
| **FE now / BE blocked** | Rich detail panel. CTAs (Schedule Meeting, Send Materials, Add Note) often inert. |

---

## Stage 3 — Create mandate / RFP

| | |
|---|---|
| **Who** | BD |
| **Goal** | Capture client, terms, fees/custody, activation setup |
| **Steps** | 1. Add Mandate. 2. Client → Mandate terms → Fees & custody → Activation → Review. 3. Persist. |
| **Done when** | Mandate row exists at correct early stage. |
| **FE now / BE blocked** | FrMandateWizard; toast only — **does not append list**. |

---

## Stage 4 — Advance AM pipeline

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Move through SRD AM stages with validation |
| **Steps** | Advance stage; complete checklist items (proposal, presentation, IC, commercial, legal, KYC, agreement). |
| **Done when** | Stage matches server; unmet gates listed on failure. |
| **FE now / BE blocked** | Only coarse stages: RFP / Mandate Live / Shortlist / Evaluation. **Full AM pipeline missing.** |

---

## Stage 5 — Tender submission pack

| | |
|---|---|
| **Who** | BD / Proposal owner |
| **Goal** | Manage RFP/RFI submission (docs, versions, approvals, evidence) |
| **Steps** | Track required documents, proposal versions, internal approvals, submission evidence, commercial terms (fees, benchmarks, limits). |
| **Done when** | Submission recorded before deadline. |
| **FE now / BE blocked** | RFP due date + “Open RFP Doc” CTA; full tender pack UI incomplete. |

---

## Stage 6 — Outcome and onboarding handoff

| | |
|---|---|
| **Who** | BD + Onboarding |
| **Goal** | Record Won/Lost/Pending; Won → Mandate Onboarding |
| **Steps** | 1. Set outcome + debrief / loss reason. 2. On Won, create onboarding case automatically. |
| **Done when** | Outcome stored; onboarding case linked. |
| **FE now / BE blocked** | **Not linked** to Onboarding tab. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | No KPIs |
| 1 Filter | Partial | Shell filters |
| 2 Detail | Partial | Rich panel; inert CTAs |
| 3 Create | Partial | Toast only |
| 4 Pipeline | Partial | Coarse stages |
| 5 Tender pack | Partial | Thin |
| 6 Outcome/handoff | Missing | — |
