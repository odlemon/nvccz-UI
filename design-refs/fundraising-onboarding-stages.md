# Client Onboarding — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** KYC/compliance + LP commitment onboarding + mandate activation  
**Route:** `/fundraising/onboarding`  
**Component:** `components/fundraising/fundraising-onboarding.tsx`  
**Mock:** `onboarding-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-onboarding-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Commercial discussions may continue before KYC approval; **Admit / Fund / Activate Assets** blocked while compliance hold exists.
- KYC statuses: NOT_STARTED → DOCUMENTS_REQUESTED → DOCUMENTS_RECEIVED → UNDER_REVIEW → MORE_INFORMATION_REQUIRED → APPROVED / APPROVED_WITH_CONDITIONS / REJECTED / EXPIRED.
- Mandate statuses: AWARDED → ONBOARDING → ASSETS_IN_TRANSITION → PARTIALLY_FUNDED → ACTIVE (+ SUSPENDED / TERMINATED / LOST_BEFORE_ACTIVATION).
- Mandate Active only after agreement, KYC, guidelines, benchmark, fees, reporting, custodian, opening balances, assets received.

---

## Status diagram

```
[0 Open Onboarding + KPIs]
   → [1 Case list / select]
   → [2 Start onboarding case]
   → [3 Request documents / KYC]
   → [4 Work readiness checklist]
   → [5 Clear compliance hold]
   → [6 Activate (LP or Mandate)]
```

---

## Stage 0 — Open Onboarding

| | |
|---|---|
| **Who** | Ops / Compliance / IR |
| **Goal** | See open cases and holds |
| **Steps** | 1. Open `/fundraising/onboarding`. 2. Read KPIs. 3. Note compliance-hold banner when present. |
| **Done when** | Cases and holds visible. |
| **FE now / BE blocked** | Mock KPIs + hold banner. |

---

## Stage 1 — Browse cases

| | |
|---|---|
| **Who** | Ops |
| **Goal** | Triage LP Commitment vs Mandate cases |
| **Steps** | Table: investor, type, KYC status, mandate status, owner. Select → detail. |
| **Done when** | Case selected. |
| **FE now / BE blocked** | Cases table + DetailPanel. |

---

## Stage 2 — Start onboarding case

| | |
|---|---|
| **Who** | Ops |
| **Goal** | Open case after award / signed commitment |
| **Steps** | Start Onboarding wizard: Investor → Case setup (LP vs Mandate) → Review. Seed checklist. Prefer auto-create from Mandates/Commitments when live. |
| **Done when** | Case persists with type-specific checklist. |
| **FE now / BE blocked** | Wizard seeds local checklist; not linked from other tabs. |

---

## Stage 3 — Request documents / KYC

| | |
|---|---|
| **Who** | Compliance |
| **Goal** | Collect KYC package (registration, UBOs, tax, ID, SoW/SoF, sanctions, PEP, signatories, banks) |
| **Steps** | Request Documents → KYC DOCUMENTS_REQUESTED → receive → UNDER_REVIEW → approve/reject/conditions. |
| **Done when** | KYC terminal state reached. |
| **FE now / BE blocked** | Request Documents moves status locally when not on hold. Full KYC field capture incomplete. |

---

## Stage 4 — Readiness checklist

| | |
|---|---|
| **Who** | Ops |
| **Goal** | Complete LP or Mandate activation items |
| **Steps** | Toggle checklist items (agreement, guidelines, benchmark, fees, reporting, custodian, balances, assets…). |
| **Done when** | All required items complete (server-validated). |
| **FE now / BE blocked** | Checklist displayed; **not toggleable**. |

---

## Stage 5 — Compliance hold

| | |
|---|---|
| **Who** | Compliance |
| **Goal** | Block activation while risk unresolved |
| **Steps** | Hold prevents Request Documents / Admit / Fund / Activate. Release with reason when cleared. |
| **Done when** | Hold state authoritative on server. |
| **FE now / BE blocked** | Banner blocks some CTAs in mock. Release workflow incomplete. |

---

## Stage 6 — Activate

| | |
|---|---|
| **Who** | Ops + Compliance |
| **Goal** | Move mandate to ACTIVE or LP to post-onboarding operational state |
| **Steps** | Activate only when KYC approved and checklist complete; write audit. |
| **Done when** | Status ACTIVE / operational; Activated AUM can be recognised separately. |
| **FE now / BE blocked** | “Go-live readiness” item exists; **no Activate action**. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Hold banner |
| 1 Browse | Partial | Table + detail |
| 2 Start case | Partial | Local wizard |
| 3 KYC docs | Partial | Thin field set |
| 4 Checklist | Partial | Not editable |
| 5 Hold | Partial | Banner only |
| 6 Activate | Missing | — |
