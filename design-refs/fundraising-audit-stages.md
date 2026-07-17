# Audit Logs — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Immutable audit trail for material actions  
**Route:** `/fundraising/audit`  
**Component:** `components/fundraising/fundraising-audit.tsx`  
**Mock:** `audit-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-audit-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Every material action writes: Timestamp, User, Role, IP, Session, Device, Action, Object, Previous Value, New Value, Reason.
- Audit logs **cannot** be edited or deleted.
- FE is read-only consumer; writes happen server-side on mutations across the module.

---

## Status diagram

```
[0 Open Audit]
   → [1 Summary KPIs]
   → [2 Filter / search]
   → [3 Scan event log]
   → [4 Drill into event (old/new)]
   → [5 Export trail]
```

---

## Stage 0 — Open Audit Logs

| | |
|---|---|
| **Who** | Compliance / Admin / Auditor |
| **Goal** | Land on immutable event log |
| **Steps** | Open `/fundraising/audit`. Confirm no create/edit controls. |
| **Done when** | Log chrome loads. |
| **FE now / BE blocked** | Mock log; not fed by other tabs. |

---

## Stage 1 — Summary KPIs

| | |
|---|---|
| **Who** | Compliance |
| **Goal** | Volume awareness |
| **Steps** | Read summary cards (events volume, users, action mix as provided). |
| **Done when** | Summaries match filtered period. |
| **FE now / BE blocked** | 4 mock summary cards. |

---

## Stage 2 — Filter and search

| | |
|---|---|
| **Who** | Auditor |
| **Goal** | Narrow by action, user, object, date range |
| **Steps** | Search summary/object; filter action type and user; add date/object-type when live. |
| **Done when** | Result set matches investigation need. |
| **FE now / BE blocked** | Search + action + user. Missing date range / object-type / pagination. |

---

## Stage 3 — Scan event log

| | |
|---|---|
| **Who** | Auditor |
| **Goal** | Identify material changes (stage, amounts, approvals, access, uploads) |
| **Steps** | Table: Timestamp, User, Action, Object, Summary, IP. |
| **Done when** | Candidate events identified. |
| **FE now / BE blocked** | Table on static mock. |

---

## Stage 4 — Event detail (diff)

| | |
|---|---|
| **Who** | Auditor |
| **Goal** | See previous vs new value + reason |
| **Steps** | Open detail dialog; confirm old/new/reason/session/device fields. |
| **Done when** | Diff is complete for the event. |
| **FE now / BE blocked** | Detail dialog exists; structured old/new often thin vs SRD. |

---

## Stage 5 — Export

| | |
|---|---|
| **Who** | Compliance |
| **Goal** | Export audit trail for period |
| **Steps** | Export filtered events. |
| **Done when** | File downloaded; export itself audited. |
| **FE now / BE blocked** | Toast only. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Read-only shell |
| 1 KPIs | Mock | Static |
| 2 Filter | Partial | No date/pagination |
| 3 Log | Mock | Not live-fed |
| 4 Detail | Partial | Thin diffs |
| 5 Export | Missing | Toast |
