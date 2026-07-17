# Data Rooms — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Secure investor data rooms per campaign; permissions, watermarks, MFA, monitoring  
**Route:** `/fundraising/data-rooms`  
**Component:** `components/fundraising/fundraising-data-rooms.tsx`  
**Mock:** `data-rooms-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-data-rooms-backend-asks.md` *(create on first BE gap)*

**Product rules**

- One or more rooms per campaign; investor-specific access.
- Folder/document permissions, watermarks, view-only, download limits, expiration, MFA, activity logs, revocation.
- Suggested folder structure (Fund Overview → Subscription Documents) per SRD.
- Monitoring: views, downloads, failed logins, last access, user, device, country.

---

## Status diagram

```
[0 Open rooms portfolio]
   → [1 Filter / select room]
   → [2 Inspect folders, access, activity]
   → [3 Create room + security]
   → [4 Invite investors / set permissions]
   → [5 Publish documents into folders]
   → [6 Revoke / expire]
   → [7 Monitor access]
```

---

## Stage 0 — Open Data Rooms

| | |
|---|---|
| **Who** | IR / Compliance |
| **Goal** | See active rooms and engagement |
| **Steps** | 1. Open `/fundraising/data-rooms`. 2. Read KPIs (active rooms, docs, views/downloads). |
| **Done when** | Portfolio visible. |
| **FE now / BE blocked** | Mock KPI + room cards. |

---

## Stage 1 — Filter and select room

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Find room by name/status |
| **Steps** | Search; filter Active / Draft / Expired / Revoked; select card. |
| **Done when** | Detail panel scoped to room. |
| **FE now / BE blocked** | Search + status filter + detail aside. |

---

## Stage 2 — Inspect room

| | |
|---|---|
| **Who** | IR / Compliance |
| **Goal** | Review security posture, folders, access list, recent activity |
| **Steps** | 1. Watermark / MFA badges. 2. Folder tiles. 3. Access list levels. 4. Recent activity. |
| **Done when** | Operator understands who can see what. |
| **FE now / BE blocked** | Detail shell; folder files are placeholders. |

---

## Stage 3 — Create data room

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Create room for a campaign with security defaults |
| **Steps** | 1. New Data Room. 2. Name, campaign. 3. Security (watermark, MFA, expiry). 4. Review → create. |
| **Done when** | Room persists in Draft/Active. |
| **FE now / BE blocked** | Wizard toast only — **does not add to grid**. Security step informational. |

---

## Stage 4 — Invite and permissions

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Grant investor/contact access with view/download limits |
| **Steps** | 1. Invite investor. 2. Set permission level + expiry. 3. Confirm invite logged. |
| **Done when** | Access list updates; invitee can authenticate. |
| **FE now / BE blocked** | Invite dialog toast; accessList not updated. |

---

## Stage 5 — Publish documents

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Place Documents module files into room folders |
| **Steps** | Add/link documents into folders; enforce view-only / download rules. |
| **Done when** | Real files appear under folders. |
| **FE now / BE blocked** | **Not wired** to Documents. Hardcoded stubs. |

---

## Stage 6 — Revoke or expire

| | |
|---|---|
| **Who** | Compliance / IR |
| **Goal** | Cut access when process ends or risk requires |
| **Steps** | Revoke user or room; set Expired; confirm downloads stop. |
| **Done when** | Status Revoked/Expired; access denied. |
| **FE now / BE blocked** | Statuses in mock only; no revoke flow. |

---

## Stage 7 — Monitor access

| | |
|---|---|
| **Who** | Compliance |
| **Goal** | Detect abuse / failed access |
| **Steps** | Review views, downloads, failed logins, device, country. |
| **Done when** | Monitoring view is queryable and audited. |
| **FE now / BE blocked** | Thin recent activity mock; failed-login monitoring incomplete. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | KPIs |
| 1 Filter/select | Partial | Works on mock |
| 2 Inspect | Partial | Placeholder files |
| 3 Create | Partial | Toast only |
| 4 Invite | Partial | No access update |
| 5 Publish docs | Missing | — |
| 6 Revoke/expire | Missing | Status labels only |
| 7 Monitor | Partial | Thin activity |
