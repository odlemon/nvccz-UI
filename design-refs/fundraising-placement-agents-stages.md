# Placement Agents — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Agent appointments, territory, commissions; access only to assigned opportunities  
**Route:** `/fundraising/placement-agents`  
**Component:** `components/fundraising/fundraising-placement-agents.tsx`  
**Mock:** `placement-agents-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-placement-agents-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Record appointment period, territory/geography, investor restrictions, commission %, retainer, success fee, protected period, supporting agreement.
- Commission applies only to opportunities **explicitly covered** by the appointment.
- Placement Agents may only access explicitly assigned opportunities (security).

---

## Status diagram

```
[0 Open Placement Agents]
   → [1 Browse appointments]
   → [2 Add appointment + commercial terms]
   → [3 Link introduced opportunities]
   → [4 Apply exclusions / restrictions]
   → [5 Commission status / payout]
   → [6 Agent-scoped access (external)]
```

---

## Stage 0 — Open Placement Agents

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | See appointments and commission exposure |
| **Steps** | 1. Open `/fundraising/placement-agents`. 2. Read KPIs. |
| **Done when** | Portfolio visible. |
| **FE now / BE blocked** | Mock KPIs + table. |

---

## Stage 1 — Browse appointments

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Review agent, geography, fee, retainer, period, introduced count, commission status, owner |
| **Steps** | Select row → detail (terms, exclusions, opportunities). |
| **Done when** | Appointment context clear. |
| **FE now / BE blocked** | Table + DetailPanel. |

---

## Stage 2 — Add appointment

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Appoint agent with commercial terms |
| **Steps** | Add Appointment: Agent → Commercial terms → Review → save. |
| **Done when** | Appointment persists. |
| **FE now / BE blocked** | Wizard adds local appointment; opportunities empty. |

---

## Stage 3 — Link introduced opportunities

| | |
|---|---|
| **Who** | BD / Head of Fundraising |
| **Goal** | Attribute pipeline opportunities to appointment coverage |
| **Steps** | Link opportunity ids; mark Eligible vs Excluded. |
| **Done when** | Commission base = covered opps only. |
| **FE now / BE blocked** | Read-only opportunities dialog. No CRUD links to Pipeline. |

---

## Stage 4 — Exclusions and restrictions

| | |
|---|---|
| **Who** | Head of Fundraising / Legal |
| **Goal** | Enforce investor/geography restrictions |
| **Steps** | Maintain exclusions list; enforce on new introductions. |
| **Done when** | Restricted investors cannot be attributed. |
| **FE now / BE blocked** | Exclusions shown in detail; not enforced. |

---

## Stage 5 — Commission lifecycle

| | |
|---|---|
| **Who** | Finance |
| **Goal** | Accrue / pay / hold commission |
| **Steps** | Status Accruing → Paid / On Hold; calculate from covered closed amounts per appointment terms. |
| **Done when** | Commission status matches finance. |
| **FE now / BE blocked** | Status chips in mock; no calculation/payout workflow. |

---

## Stage 6 — Agent-scoped access

| | |
|---|---|
| **Who** | Placement Agent (external role) |
| **Goal** | See only assigned opportunities |
| **Steps** | Agent login sees filtered pipeline/docs; no other investors. |
| **Done when** | Object-level auth enforced server-side. |
| **FE now / BE blocked** | **Missing** agent portal / scoped UI. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | KPIs |
| 1 Browse | Partial | Detail panel |
| 2 Add | Partial | Local |
| 3 Link opps | Missing | Read-only mock |
| 4 Exclusions | Partial | Display only |
| 5 Commission | Partial | Chips only |
| 6 Agent access | Missing | Security gap |
