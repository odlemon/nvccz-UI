# Pipeline — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Opportunity formula, PE/VC/AM pipelines, stage validation, Kanban, amount types, weighted pipeline  
**Route:** `/fundraising/pipeline`  
**Components:** `fundraising-pipeline.tsx` (overview), `fundraising-pipeline-board.tsx` (board)  
**Wizard:** `FrOpportunityWizard`  
**Mock:** `pipeline-mock-data.ts`, `pipeline-board-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-pipeline-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Opportunity = Investor + Campaign + Fund/Product + Relationship Owner.
- Amount types are independent; every change writes history (old/new/user/timestamp/reason).
- Drag-and-drop changes UI only after **server validation**; failures return missing-requirements checklist.
- Temporary statuses: Lost, Deferred, Withdrawn, On Hold, Disqualified, Tender Cancelled.
- Adaptive labels: PE/VC vs Asset Management (AUM / Activated).

---

## Status diagram

```
[0 Open Pipeline → filter model/campaign]
   → [1 Overview KPIs / funnel / capital chart]
   → [2 Triage opportunities table]
   → [3 Board View — inspect cards]
   → [4 Create opportunity]
   → [5 Move stage (validated)]
   → [6 Update amounts (history)]
   → [7 Lost / hold / temporary status]
```

---

## Stage 0 — Open Pipeline and filter

| | |
|---|---|
| **Who** | Head of Fundraising / Deal Manager |
| **Goal** | Select the right fund model cut |
| **Steps** | 1. Open `/fundraising/pipeline`. 2. Choose Overview vs Board. 3. Filter All / VC / PE / AM (and campaign when live). |
| **Done when** | Correct model labels and opportunity set shown. |
| **FE now / BE blocked** | Overview/Board toggle + fund filter chips. Mock data. |

---

## Stage 1 — Overview: KPIs and charts

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Read target, pipeline, coverage, capital progress |
| **Steps** | 1. Read KPI strip (target, soft/hard/signed/funded or AM equivalents, coverage). 2. Pipeline-by-stage funnel. 3. Capital raised chart (cumulative/monthly). |
| **Done when** | Executive numbers match BE aggregates (live). |
| **FE now / BE blocked** | Static mock KPIs/charts. Formulas (weighted, FX) not live. |

---

## Stage 2 — Triage opportunities (table)

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Prioritise deals by stage, amount, probability, next step, age |
| **Steps** | 1. Open Top Opportunities / main table. 2. Sort/filter. 3. Open opportunity drawer for detail. |
| **Done when** | User can act on next steps from the table. |
| **FE now / BE blocked** | Table + view-all dialog. No full opportunity drawer with amount history. |

---

## Stage 3 — Board View: inspect cards

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Work stage columns: count, total value, card fields |
| **Steps** | 1. Switch to Board View. 2. Confirm column headers (name, count, value). 3. Select card → detail (amounts, owner, probability, next action, age, priority). |
| **Done when** | Card detail matches opportunity record. |
| **FE now / BE blocked** | Kanban columns Prospect → … → IC Review (shorter than SRD). Select-only; **no drag-and-drop**. |

---

## Stage 4 — Create opportunity

| | |
|---|---|
| **Who** | BD / Deal Manager |
| **Goal** | Create opportunity bound to investor + campaign + fund/product + owner |
| **Steps** | 1. **Add Opportunity**. 2. Basics. 3. Investor. 4. Amounts (all relevant types — start with indicative/soft as applicable). 5. Stage & campaign (+ fund/product). 6. Review → save. |
| **Done when** | Opportunity persists on board/table at correct stage. |
| **FE now / BE blocked** | Wizard captures soft circle mainly; **Fund/Product/Mandate missing**. Toast / local only. |

---

## Stage 5 — Move stage (server-validated)

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Advance or regress stage only when gates pass |
| **Steps** | 1. Drag card (or choose Move). 2. UI waits for BE validation. 3. On failure: show checklist of missing requirements (from Settings gates + domain rules). 4. On success: refresh column totals and audit. |
| **Done when** | Stage on server matches UI; failed moves do not stick. |
| **FE now / BE blocked** | **Missing DnD and validation.** Settings gates not consumed. Critical BE ask. |

---

## Stage 6 — Update amounts with history

| | |
|---|---|
| **Who** | Deal Manager / Finance |
| **Goal** | Change an amount type without overwriting others |
| **Steps** | 1. Open opportunity amounts. 2. Set new value for one type + reason. 3. Confirm history entry. 4. KPIs refresh. |
| **Done when** | Independent fields updated; history immutable. |
| **FE now / BE blocked** | **Missing** per-type editors and history UI. |

---

## Stage 7 — Temporary / terminal statuses

| | |
|---|---|
| **Who** | Deal Manager |
| **Goal** | Mark Lost / Deferred / Withdrawn / On Hold / Disqualified / Tender Cancelled |
| **Steps** | 1. Choose status + lost reason where required. 2. Card leaves active weighted pipeline as rules dictate. |
| **Done when** | Status persisted; analytics exclude correctly. |
| **FE now / BE blocked** | **Missing** temporary status controls. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open/filter | Mock | Overview + Board |
| 1 KPIs/charts | Mock | Static |
| 2 Table triage | Partial | No rich drawer |
| 3 Board inspect | Partial | No DnD |
| 4 Create | Partial | Soft circle only; weak bindings |
| 5 Stage move | Missing | Core BE validation gap |
| 6 Amounts/history | Missing | Guardrail gap |
| 7 Temp statuses | Missing | — |
