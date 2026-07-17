# Documents — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Document library, versioning; related to agreements, DD, data rooms  
**Route:** `/fundraising/documents`  
**Component:** `components/fundraising/fundraising-documents.tsx`  
**Mock:** `documents-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-documents-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Version control every material document.
- Statuses include Draft, In Review, Approved, Superseded.
- Newer agreement versions invalidate pending signatures (see Agreements).
- Confidential documents follow secure access rules (signed URLs, watermark, audit).

---

## Status diagram

```
[0 Open library + KPIs]
   → [1 Browse folders / categories]
   → [2 Inspect document + versions]
   → [3 Upload / register]
   → [4 Classify + set status]
   → [5 Link to campaign / DD / agreements]
   → [6 Export inventory]
```

---

## Stage 0 — Open Documents

| | |
|---|---|
| **Who** | IR / Legal |
| **Goal** | See library health |
| **Steps** | 1. Open `/fundraising/documents`. 2. Read KPIs (total, folders, in review, confidential). |
| **Done when** | Library chrome loads. |
| **FE now / BE blocked** | Mock KPI strip. |

---

## Stage 1 — Browse by category

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Find documents by folder category |
| **Steps** | 1. Select category tile (Legal, Track Record, Marketing, DD, KYC, Financials). 2. Search list. |
| **Done when** | Filtered documents shown. |
| **FE now / BE blocked** | Folder tiles + list. |

---

## Stage 2 — Inspect document and versions

| | |
|---|---|
| **Who** | Legal / IR |
| **Goal** | Confirm current version, owner, status, history |
| **Steps** | 1. Select document. 2. Read detail aside. 3. Open version history. 4. Note signature-void warning when superseding. |
| **Done when** | Version history is clear. |
| **FE now / BE blocked** | Version UI present; no download/preview of real files. |

---

## Stage 3 — Upload / register

| | |
|---|---|
| **Who** | IR / Legal |
| **Goal** | Add a new document or new version |
| **Steps** | 1. Upload Document wizard. 2. Provide file + metadata. 3. Persist; list refreshes. |
| **Done when** | Binary stored; metadata indexed. |
| **FE now / BE blocked** | Wizard appends local metadata only — **no file picker / storage**. |

---

## Stage 4 — Classify and status

| | |
|---|---|
| **Who** | Document owner |
| **Goal** | Category, campaign, confidential flag, workflow status |
| **Steps** | Set classification; move Draft → In Review → Approved / Superseded. |
| **Done when** | Status reflects review outcome. |
| **FE now / BE blocked** | Classification in wizard; post-create status edits limited. |

---

## Stage 5 — Cross-module links

| | |
|---|---|
| **Who** | IR / Legal |
| **Goal** | Same document usable from DD matrix, Data Rooms, Agreements |
| **Steps** | Link document to campaign/opportunity/DD requirement; publish into data room folder. |
| **Done when** | Single document id referenced across modules. |
| **FE now / BE blocked** | **Not wired** to DD / Data Rooms / Agreements. |

---

## Stage 6 — Export inventory

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Export document register |
| **Steps** | Export / view all. |
| **Done when** | Inventory exported. |
| **FE now / BE blocked** | Toast / dialog only. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | KPIs |
| 1 Browse | Partial | Categories |
| 2 Versions | Partial | UI only |
| 3 Upload | Partial | No file I/O |
| 4 Classify | Partial | Limited status edits |
| 5 Cross-links | Missing | — |
| 6 Export | Missing | Toast |
