# Investor Organisations — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Central investor database, Investor 360, no duplicates  
**Route:** `/fundraising/investors`  
**Component:** `components/fundraising/fundraising-investors.tsx`  
**Mock:** `investors-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-investors-backend-asks.md` *(create on first BE gap)*

**Product rules**

- One master organisation record (360°). Never duplicate.
- Owns children: contacts, opportunities, commitments, mandates, meetings, communications, documents, KYC, data rooms, agreements, tasks, notes.
- Identity + commercial + relationship + compliance fields required (see SRD).
- Org can participate in many campaigns without cloning the org.

---

## Status diagram

```
[0 Open directory]
   → [1 Search / filter / saved views]
   → [2 Select org → summary / KPIs]
   → [3 Investor 360 tabs (contacts, pipeline, …)]
   → [4 Add organisation]
   → [5 Edit / archive (no delete of history)]
   → [6 Export / bulk update]
```

---

## Stage 0 — Open Investor Directory

| | |
|---|---|
| **Who** | BD / IR Officer |
| **Goal** | Land on master investor list |
| **Steps** | 1. Open `/fundraising/investors`. 2. Confirm table + detail/drawer chrome. |
| **Done when** | Directory loads (or honest empty state). |
| **FE now / BE blocked** | Mock table + sticky detail panel. No API. |

---

## Stage 1 — Search and filter

| | |
|---|---|
| **Who** | BD / IR Officer |
| **Goal** | Find organisations by identity, commercial, relationship, compliance filters |
| **Steps** | 1. Search name. 2. Filter type / owner / status (extend to country, KYC, sanctions, AUM, campaign per SRD). 3. Optionally save view / export. |
| **Done when** | Filtered set matches criteria. |
| **FE now / BE blocked** | Basic search + type/owner/status. Missing advanced filters, saved views, column resize/hide, bulk update. |

---

## Stage 2 — Organisation summary (drawer / panel)

| | |
|---|---|
| **Who** | Deal Manager / IR |
| **Goal** | Read 360 summary without leaving the directory |
| **Steps** | 1. Select a row. 2. Confirm summary: name, type, country/jurisdiction, AUM, risk/classification, owner, status. 3. Confirm relationship KPIs (active opps, campaigns, commitments, AUM, meetings, tasks, open DD). |
| **Done when** | Summary + KPIs visible for selected org. |
| **FE now / BE blocked** | Shallow detail (AUM, ticket, fit, KYC, sanctions, preferences). **Not full KPI strip or tabbed 360.** |

---

## Stage 3 — Investor 360 child tabs

| | |
|---|---|
| **Who** | IR Officer / Deal Manager |
| **Goal** | Work child records from one org |
| **Steps** | Open tabs: Overview, Contacts, Pipeline, Meetings, Documents, Communications, Commitments, KYC, Notes, Activity. Add contact, open opportunity drawer, read activity timeline (newest first). |
| **Done when** | Each child surface loads from the same org id. |
| **FE now / BE blocked** | **Missing** tabbed 360. Contacts/opps are separate routes only. |

---

## Stage 4 — Add Investor Organisation

| | |
|---|---|
| **Who** | BD |
| **Goal** | Create unique master org with identity, profile, relationship, compliance |
| **Steps** | 1. **Add Investor**. 2. Organisation identity. 3. Investment profile. 4. Relationship. 5. Compliance. 6. Review → save. 7. BE rejects duplicates (legal name / registration). |
| **Done when** | Org persists; appears in directory; no duplicate created. |
| **FE now / BE blocked** | Wizard exists; toast only. Missing trading name, registration, jurisdiction, source, risk rating, classification, eligibility, sanctions in wizard. |

---

## Stage 5 — Edit / archive

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Maintain master record without losing history |
| **Steps** | 1. Edit fields. 2. Archive contact-level or org when appropriate. 3. History retained for audit. |
| **Done when** | Updates persist; archive hides from default directory. |
| **FE now / BE blocked** | **No edit/archive UI.** |

---

## Stage 6 — Export / bulk update

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Extract or bulk-maintain directory |
| **Steps** | 1. Export filtered results. 2. Bulk update allowed fields (owner, status, …) with permission. |
| **Done when** | File downloaded / bulk job completes with audit. |
| **FE now / BE blocked** | Export toast only. No bulk update. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Directory shell |
| 1 Filter | Partial | Basic filters |
| 2 Summary | Partial | Shallow panel |
| 3 360 tabs | Missing | Major SRD gap |
| 4 Add | Partial | Toast only |
| 5 Edit/Archive | Missing | — |
| 6 Export/Bulk | Missing | Toast / none |
