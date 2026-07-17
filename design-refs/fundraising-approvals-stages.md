# Approvals — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Approval routing for commercial concessions, side letters, stage overrides, campaign activation  
**Route:** `/fundraising/approvals`  
**Component:** `components/fundraising/fundraising-approvals.tsx`  
**Mock:** `approvals-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-approvals-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Concessions outside thresholds auto-generate approval requests (fee discounts, custom reporting, non-standard liquidity, special liability, exclusivity, side letters).
- Campaign activation cannot bypass approvals.
- Stage overrides (if allowed) require approval + reason.
- Decisions must propagate back to the source object; audit recorded.

---

## Status diagram

```
[0 Open Approvals inbox]
   → [1 Triage pending]
   → [2 Review request context]
   → [3 Approve / Reject with reason]
   → [4 History / audit]
   → [5 Source modules submit requests]
```

---

## Stage 0 — Open Approvals

| | |
|---|---|
| **Who** | Approver (Head of Fundraising / Compliance / Legal / Finance) |
| **Goal** | See pending workload |
| **Steps** | 1. Open `/fundraising/approvals`. 2. Read pending banner/count. |
| **Done when** | Inbox loads. |
| **FE now / BE blocked** | Mock pending banner + table. |

---

## Stage 1 — Triage

| | |
|---|---|
| **Who** | Approver |
| **Goal** | Filter Pending / Approved / Rejected; prioritise High |
| **Steps** | Status filter; scan type (Fee discount, Side letter, Stage override, Campaign activation). |
| **Done when** | Next request selected. |
| **FE now / BE blocked** | Status filter works on mock. |

---

## Stage 2 — Review context

| | |
|---|---|
| **Who** | Approver |
| **Goal** | Understand ask before deciding |
| **Steps** | Read title, summary, campaign, investor, amount, priority, requester. |
| **Done when** | Enough context to decide (or request more info). |
| **FE now / BE blocked** | Row fields present; deep links to source objects weak. |

---

## Stage 3 — Decide

| | |
|---|---|
| **Who** | Approver |
| **Goal** | Approve or Reject with mandatory reason |
| **Steps** | Decision dialog → reason → submit → status updates → source object unlocked/blocked accordingly. |
| **Done when** | Decision persisted; source module reflects outcome. |
| **FE now / BE blocked** | Local approve/reject + toast. **Does not propagate** to Campaigns/Pipeline/etc. |

---

## Stage 4 — History

| | |
|---|---|
| **Who** | Approver / Auditor |
| **Goal** | See prior decisions on the request |
| **Steps** | Open history dialog (actor, timestamp, action, reason). |
| **Done when** | Trail complete. |
| **FE now / BE blocked** | History dialog on mock data. |

---

## Stage 5 — Upstream submission (other tabs)

| | |
|---|---|
| **Who** | Requesters in Campaigns / Pipeline / Commercial terms |
| **Goal** | Auto or manual create approval when thresholds breached |
| **Steps** | From source UI, submit approval; appears in inbox; block activate/move until decided. |
| **Done when** | End-to-end request → decision → unlock works. |
| **FE now / BE blocked** | **Missing** wiring from other modules. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Inbox |
| 1 Triage | Partial | Filters |
| 2 Review | Partial | Weak deep links |
| 3 Decide | Partial | Local only |
| 4 History | Partial | Mock |
| 5 Upstream submit | Missing | Critical integration |
