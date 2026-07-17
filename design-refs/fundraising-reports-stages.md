# Reports — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Predefined fundraising, investor, compliance, commercial, mandate reports  
**Route:** `/fundraising/reports`  
**Component:** `components/fundraising/fundraising-reports.tsx`  
**Mock:** `reports-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-reports-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Catalog covers Progress, Conversion, Concentration, Compliance, Investor, Commercial, Mandate reports (SRD lists).
- Schedules: Daily / Weekly / Monthly / On demand.
- Runs produce downloadable artifacts; last-run history retained.
- Role-based access to sensitive compliance/commercial reports.

---

## Status diagram

```
[0 Open Reports catalog]
   → [1 Browse cards by category]
   → [2 Configure schedule / recipients / format]
   → [3 Run now]
   → [4 View last-run results / download]
   → [5 Re-run / manage schedule]
```

---

## Stage 0 — Open Reports

| | |
|---|---|
| **Who** | Analyst / Exec / Compliance |
| **Goal** | Land on report catalog |
| **Steps** | Open `/fundraising/reports`. |
| **Done when** | Catalog visible. |
| **FE now / BE blocked** | Mock card grid. |

---

## Stage 1 — Browse catalog

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Find report definition |
| **Steps** | Scan categories: Progress, Conversion, Concentration, Compliance, Mandate, etc. |
| **Done when** | Target report selected. |
| **FE now / BE blocked** | Cards with category labels. No create/edit definitions. |

---

## Stage 2 — Configure

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Set schedule, recipients, format, date range |
| **Steps** | Configure & Run dialog. |
| **Done when** | Config saved for the report. |
| **FE now / BE blocked** | Dialog fields; no persist. |

---

## Stage 3 — Run now

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Queue a report run |
| **Steps** | Run now → job queued → completion notification. |
| **Done when** | Run status Succeeded/Failed with artifact. |
| **FE now / BE blocked** | Toast “queued” only. |

---

## Stage 4 — View last-run results

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Inspect sample/result table and download |
| **Steps** | View last run → download XLSX/PDF/CSV. |
| **Done when** | Artifact available. |
| **FE now / BE blocked** | Sample rows dialog; no download. |

---

## Stage 5 — Re-run / manage schedule

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Re-run or change cadence |
| **Steps** | Run again; update schedule; disable if needed. |
| **Done when** | Schedule reflects intent. |
| **FE now / BE blocked** | Re-run toast; schedules not live. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Catalog |
| 1 Browse | Partial | Cards |
| 2 Configure | Partial | No persist |
| 3 Run | Missing | Toast |
| 4 Results | Partial | Sample only |
| 5 Schedule mgmt | Missing | — |
