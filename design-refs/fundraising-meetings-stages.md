# Meetings & Tasks — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Meetings, follow-ups, tasks; SRD lists Meetings and Tasks as separate nav items — FE combines them  
**Route:** `/fundraising/meetings`  
**Component:** `components/fundraising/fundraising-meetings.tsx`  
**Mock:** `meetings-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-meetings-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Tasks belong to Opportunity and/or Campaign and/or Investor.
- Task statuses: NOT_STARTED, IN_PROGRESS, WAITING_ON_INVESTOR, WAITING_ON_INTERNAL_TEAM, COMPLETED, CANCELLED, OVERDUE.
- Meetings are auditable business-interaction records, not hosted video calls.
- Scheduling captures agenda/context; completion captures discussion notes, outcome, decisions and actions.
- The calendar uses the Events Management month-grid design.

---

## Status diagram

```
[0 Open workspace → KPI strip]
   → [1 Meetings tab — browse / detail]
   → [2 Schedule meeting + agenda]
   → [3 Complete meeting record + outcomes]
   → [4 Tasks board — triage]
   → [5 Create / move task]
```

---

## Stage 0 — Open Meetings & Tasks

| | |
|---|---|
| **Who** | IR Officer / Deal Manager |
| **Goal** | See workload at a glance |
| **Steps** | 1. Open `/fundraising/meetings`. 2. Read KPIs (upcoming meetings, open/overdue/done tasks). 3. Note tabs: Meetings | Tasks. |
| **Done when** | KPIs and tabs visible. |
| **FE now / BE blocked** | Mock KPI strip + dual tabs. |

---

## Stage 1 — Browse meetings

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Review scheduled / completed / cancelled meetings |
| **Steps** | 1. Meetings tab. 2. Switch List / Calendar. 3. Search. 4. Open Details (agenda, investor, campaign, attendees, related opportunity, outcomes when completed). |
| **Done when** | Meeting context is clear. |
| **FE now / BE blocked** | Live list + Events-style calendar + detail dialog. No Join/video-provider behavior. |

---

## Stage 2 — Schedule meeting

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Create a meeting tied to investor/campaign/opportunity |
| **Steps** | 1. Schedule. 2. Date/time and interaction format. 3. Investor, campaign, opportunity, attendees. 4. Record agenda/planned discussion. 5. Save. |
| **Done when** | Meeting persists; optionally appears on calendar. |
| **FE now / BE blocked** | Live POST with agenda and investor/campaign/opportunity linkage. |

---

## Stage 3 — Complete meeting record

| | |
|---|---|
| **Who** | Meeting owner / IR Officer |
| **Goal** | Preserve what happened and make follow-up explicit |
| **Steps** | 1. Open a scheduled meeting. 2. Mark completed. 3. Enter outcome summary, discussion notes, decisions and action items. 4. Save atomically. |
| **Done when** | Meeting is COMPLETED and all outcome fields persist after refresh; repeated completion does not duplicate tasks. |
| **FE now / BE blocked** | ✅ FE and BE wired: outcome payload is atomic and idempotent; action items can create linked tasks. |

---

## Stage 4 — Tasks board triage

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | See tasks by status columns |
| **Steps** | 1. Tasks tab. 2. Confirm columns map to SRD statuses (incl. waiting / overdue). 3. Open a card for related entities. |
| **Done when** | Board reflects assigned work. |
| **FE now / BE blocked** | 5-column kanban with quick moves. Related field often free-text. |

---

## Stage 5 — Create and move tasks

| | |
|---|---|
| **Who** | IR / Deal Manager |
| **Goal** | Create task with title, description, due, assignee, priority, status; move when progress changes |
| **Steps** | 1. New task → link Opportunity/Campaign/Investor. 2. Move status (DnD or control). 3. Complete / cancel. |
| **Done when** | Task lifecycle persists; dashboard “My Tasks” can refresh. |
| **FE now / BE blocked** | Create dialog + button moves. No description; no DnD; no server validation. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Combined FE tab |
| 1 Browse meetings | Live | List + Events-style calendar + record detail |
| 2 Schedule | Live | Agenda and entity links sent |
| 3 Complete record | Live | Structured outcomes, decisions and linked actions |
| 4 Tasks board | Live | Server-backed status moves |
| 5 Create/move | Live | Description, assignee and entity links |
