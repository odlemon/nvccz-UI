# Communications — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Interaction log; secure links for sensitive docs; confidentiality  
**Route:** `/fundraising/communications`  
**Component:** `components/fundraising/fundraising-communications.tsx`  
**Mock:** `communications-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-communications-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Every material interaction is logged (email, call, meetings, notes, DDQ, data room invite, etc.).
- Fields include Opportunity, Organisation, Contact, Type, Subject, Owner, Participants, Date, Outcome, Summary, Sentiment, Next Action, Due Date, Attachments, Confidentiality.
- Sensitive documents use **secure authenticated links** (expiry, limits, password, watermark, audit) — never casual email attachments.
- Internal notes never exposed externally.

---

## Status diagram

```
[0 Open log]
   → [1 Search / filter]
   → [2 Open detail]
   → [3 Log interaction]
   → [4 Attach / secure share]
   → [5 Export]
```

---

## Stage 0 — Open communications log

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | See interaction history |
| **Steps** | 1. Open `/fundraising/communications`. 2. Confirm activity table loads. |
| **Done when** | Log visible or empty state. |
| **FE now / BE blocked** | Mock feed + detail aside. |

---

## Stage 1 — Search and filter

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Narrow by subject, investor, type |
| **Steps** | Search + type filter (extend to campaign, opportunity, date, sentiment). |
| **Done when** | Filtered set matches criteria. |
| **FE now / BE blocked** | Subject/investor search + type select. |

---

## Stage 2 — Open detail

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Read full interaction context |
| **Steps** | 1. Select row. 2. Confirm org, contact, campaign, outcome, sentiment, confidential flag, next action. |
| **Done when** | Detail sufficient to continue relationship work. |
| **FE now / BE blocked** | Detail panel. **Opportunity** link missing vs SRD. |

---

## Stage 3 — Log interaction

| | |
|---|---|
| **Who** | IR Officer / BD |
| **Goal** | Record a new touch |
| **Steps** | 1. **Log Interaction**. 2. Type, subject, summary, date. 3. Investor, contact, campaign, **opportunity**. 4. Outcome, sentiment, next action, confidentiality. 5. Save → appears in feed. |
| **Done when** | Record persisted and listed. |
| **FE now / BE blocked** | 3-step wizard; toast only; missing outcome/sentiment/next action/opportunity/participants. |

---

## Stage 4 — Attachments and secure share

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Share sensitive materials safely |
| **Steps** | 1. Attach or generate secure download link. 2. Set expiry, download limits, password/watermark as required. 3. Audit access. |
| **Done when** | Link issued; downloads audited. |
| **FE now / BE blocked** | **Missing** secure-link flow. |

---

## Stage 5 — Export

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Export interaction history |
| **Steps** | Export filtered log. |
| **Done when** | File downloaded. |
| **FE now / BE blocked** | Toast only. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Feed shell |
| 1 Filter | Partial | Basic |
| 2 Detail | Partial | No opportunity field |
| 3 Log | Partial | Toast; incomplete fields |
| 4 Secure share | Missing | Critical for sensitive docs |
| 5 Export | Missing | Toast |
