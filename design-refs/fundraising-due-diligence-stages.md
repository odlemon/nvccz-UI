# Due Diligence — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** DD types, DDQ management, DD workspace (categories, matrix, Q&A drawer)  
**Route:** `/fundraising/due-diligence`  
**Component:** `components/fundraising/fundraising-due-diligence.tsx`  
**Mock:** `due-diligence-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-due-diligence-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Supports Investor / Operational / Financial / Compliance / Legal / ESG / Technology / Investment Process DD.
- DDQ statuses: NOT_STARTED → IN_PROGRESS → INTERNAL_REVIEW → APPROVED → SUBMITTED → INVESTOR_FOLLOW_UP → COMPLETED.
- Workspace: header (investor, campaign, status, progress, owner) + category checklist + document matrix + right drawer (comments, questions, attachments, activity).
- Templates, answer library, evidence, reviewer comments, approvals, expiry (SRD).

---

## Status diagram

```
[0 Open DD workspace + KPIs]
   → [1 Select investor in DD]
   → [2 Track category progress]
   → [3 Work document matrix]
   → [4 Q&A / requests + thread]
   → [5 Add evidence / DDQ responses]
   → [6 Advance DDQ status / approve]
   → [7 Export / archive]
```

---

## Stage 0 — Open Due Diligence

| | |
|---|---|
| **Who** | IR / DD Lead |
| **Goal** | Portfolio view of DD load |
| **Steps** | 1. Open `/fundraising/due-diligence`. 2. Read KPIs (active investors, open/overdue, completion, docs, days). |
| **Done when** | Workspace loads. |
| **FE now / BE blocked** | Mock 3-column shell + KPIs. |

---

## Stage 1 — Select investor in DD

| | |
|---|---|
| **Who** | DD Lead |
| **Goal** | Focus one investor/campaign DD case |
| **Steps** | 1. Left panel: pick active investor. 2. Confirm header: investor, campaign, overall status, progress, owner. |
| **Done when** | Matrix and Q&A scoped to that investor. |
| **FE now / BE blocked** | Investor list + filters. Campaign header incomplete vs SRD. |

---

## Stage 2 — Category checklist progress

| | |
|---|---|
| **Who** | DD Lead |
| **Goal** | See completion by category (Corporate, Financial, Legal, Compliance, Ops, Tech, ESG, …) |
| **Steps** | Review category progress %, outstanding questions. |
| **Done when** | Bottleneck categories identified. |
| **FE now / BE blocked** | Categories on matrix groups. Dedicated left checklist panel partial vs SRD. |

---

## Stage 3 — Document matrix

| | |
|---|---|
| **Who** | Response owner / Reviewer |
| **Goal** | Track requirement × status × owner × due × version |
| **Steps** | 1. Work matrix rows. 2. Expand row for detail. 3. Update cell status (Not Started / Requested / Uploaded / Reviewed / Follow-up / N/A). |
| **Done when** | Matrix reflects evidence state. |
| **FE now / BE blocked** | Category-grouped matrix. Rows not expandable; due/version columns incomplete. |

---

## Stage 4 — Q&A and requests

| | |
|---|---|
| **Who** | IR + Investor side (via logged responses) |
| **Goal** | Resolve open questions |
| **Steps** | 1. Open/Resolved tabs. 2. Priority + due. 3. Reply in thread. 4. Attach evidence. |
| **Done when** | Requests resolve with audit trail. |
| **FE now / BE blocked** | Open/Resolved + thread composer (local). Attachments “coming soon”. |

---

## Stage 5 — Add evidence / DDQ response

| | |
|---|---|
| **Who** | Response owner |
| **Goal** | Upload evidence or answer from approved library |
| **Steps** | 1. Add Document / answer. 2. Link to matrix requirement. 3. Version + expiry if applicable. |
| **Done when** | Matrix cell updates; document linked. |
| **FE now / BE blocked** | Add Document wizard toast only — **does not update matrix**. No answer library. |

---

## Stage 6 — Advance DDQ workflow

| | |
|---|---|
| **Who** | Reviewer / Approver |
| **Goal** | Move DDQ through SRD statuses with comments |
| **Steps** | Internal review → approve → submit → investor follow-up → complete. |
| **Done when** | Case status matches SRD lifecycle. |
| **FE now / BE blocked** | **DDQ lifecycle statuses not modeled** (doc-level statuses only). |

---

## Stage 7 — Export / archive

| | |
|---|---|
| **Who** | DD Lead |
| **Goal** | Report progress; archive completed investors |
| **Steps** | Export report; move investor to archived list. |
| **Done when** | Report generated; archive list accurate. |
| **FE now / BE blocked** | Export toast; archived dialog exists. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Strong shell |
| 1 Select investor | Partial | Header incomplete |
| 2 Categories | Partial | Grouped matrix |
| 3 Matrix | Partial | Not expandable |
| 4 Q&A | Partial | Local thread |
| 5 Evidence | Partial | No matrix update |
| 6 DDQ workflow | Missing | Major SRD gap |
| 7 Export/archive | Partial | Toast / dialog |
