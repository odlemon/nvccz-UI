# Settings — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Configurable pipelines, stage probabilities, amount types, roles, notifications  
**Route:** `/fundraising/settings`  
**Component:** `components/fundraising/fundraising-settings.tsx`  
**Mock:** `settings-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-settings-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Pipelines are configurable per operating model (PE / VC / AM).
- Stage moves elsewhere depend on **stage gates** defined here; server remains authoritative.
- Amount types are independent labels (Indicative → Activated AUM); FE must not invent overwrite behaviour.
- Roles in this tab are module summaries; object-level auth is server-owned.

---

## Status diagram

```
[0 Open Settings]
   → [1 Review Pipelines PE/AM]
   → [2 Add / adjust stages + probabilities]
   → [3 Configure Stage Gates]
   → [4 Confirm Amount Types]
   → [5 Review Roles]
   → [6 Tune Notifications]
```

---

## Stage 0 — Open Settings

| | |
|---|---|
| **Who** | Head of Fundraising / Admin |
| **Goal** | Land on module config workspace |
| **Steps** | 1. Open `/fundraising/settings`. 2. Confirm five tabs: Pipelines, Stage Gates, Amount Types, Roles, Notifications. |
| **Done when** | Settings chrome loads; a tab is selected. |
| **FE now / BE blocked** | Mock shell loads. No live config API. |

---

## Stage 1 — Review pipelines (PE / AM)

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Confirm stage lists and default win probabilities match the operating models in use |
| **Steps** | 1. Open **Pipelines**. 2. Review PE stage list. 3. Review AM stage list. 4. Use “View all” if present. |
| **Done when** | Stages and probabilities are visible for each pipeline shown. |
| **FE now / BE blocked** | PE + AM mock lists exist. **VC pipeline missing** vs SRD three-model requirement. |

---

## Stage 2 — Add or adjust stages

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Extend or correct pipeline stages before campaign activation |
| **Steps** | 1. **Add Stage** wizard: choose PE/AM → name → win % → Review. 2. Confirm stage appears in list (live: after persist). |
| **Done when** | New stage is stored on the selected pipeline with probability. |
| **FE now / BE blocked** | Wizard + local state only. No reorder/edit/delete. No server persist. |

---

## Stage 3 — Configure stage gates

| | |
|---|---|
| **Who** | Compliance + Head of Fundraising |
| **Goal** | Define requirement checklists for stage transitions used by Pipeline Kanban |
| **Steps** | 1. Open **Stage Gates**. 2. **Edit gate**: from → to → requirements bullets → Review. 3. Confirm gate text matches product rules (KYC, docs, etc.). |
| **Done when** | Each critical transition has documented requirements. |
| **FE now / BE blocked** | Edit-only mock gates. Pipeline does **not** enforce them yet. Need BE validation contract. |

---

## Stage 4 — Confirm amount types

| | |
|---|---|
| **Who** | Finance + Head of Fundraising |
| **Goal** | Align UI labels with independent amount types (never overwrite) |
| **Steps** | 1. Open **Amount Types**. 2. Verify SRD set: Indicative, Qualified, Soft Circle, Proposed, Signed, Admitted, Funded, Expected AUM, Activated AUM. |
| **Done when** | All nine types are represented and treated as independent. |
| **FE now / BE blocked** | Read-only cards; mock set **incomplete** (Qualified / Proposed gaps). No history config UI. |

---

## Stage 5 — Review roles

| | |
|---|---|
| **Who** | Admin |
| **Goal** | Confirm fundraising role packs are understood (detail managed in Admin) |
| **Steps** | 1. Open **Roles**. 2. Scan permission chips / summaries. 3. Note SRD roles not yet mapped (Placement Agent portal, Investor Portal). |
| **Done when** | Team knows which FE packs apply (`fundraising-permissions.ts`). |
| **FE now / BE blocked** | Read-only summaries. Object-level scopes are BE. |

---

## Stage 6 — Tune notifications

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Enable alerts for material events (stage change, overdue tasks, approvals, etc.) |
| **Steps** | 1. Open **Notifications**. 2. Toggle rules on/off. 3. Save (live: persist preferences). |
| **Done when** | Preferences persist per user (or tenant policy). |
| **FE now / BE blocked** | Local toggles only. No notification delivery. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Ready to browse |
| 1 Pipelines | Partial | VC pipeline missing |
| 2 Add stage | Partial | Wizard; no persist |
| 3 Gates | Partial | Not enforced in Pipeline |
| 4 Amount types | Partial | Incomplete vs SRD 9 types |
| 5 Roles | Partial | Summaries only |
| 6 Notifications | Partial | Local toggles |
