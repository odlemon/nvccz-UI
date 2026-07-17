# Commitments & Closings — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Commitment statuses, closing events, readiness; FE combines Commitments + Closings  
**Route:** `/fundraising/commitments`  
**Component:** `components/fundraising/fundraising-commitments.tsx`  
**Mock:** `commitments-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-commitments-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Commitment ≠ cash received. Signed ≠ Admitted ≠ Funded ≠ Cash.
- Commitment statuses include INDICATIVE → … → ADMITTED_AT_CLOSE → FUNDED (+ REDUCED/CANCELLED/DEFAULTED).
- Multiple closing events: First / Interim / Subsequent / Extended / Final.
- Closing validation: Legal + Compliance + Fund readiness; post-close creates LP portal access, capital call contacts, reporting prefs.
- Compliance block prevents Admit / Fund.

---

## Status diagram

```
[0 Open Commitments + KPIs]
   → [1 Commitment register]
   → [2 Add / update commitment amounts]
   → [3 Readiness checklist (docs/KYC/sig)]
   → [4 Closing timeline + event]
   → [5 Validate closing → Admit]
   → [6 Fund / cash recognition]
   → [7 Post-close activities]
```

---

## Stage 0 — Open workspace

| | |
|---|---|
| **Who** | Finance / Head of Fundraising |
| **Goal** | See commitment and closing progress |
| **Steps** | 1. Open `/fundraising/commitments`. 2. Read KPIs (total, signed, admitted, funded, remaining, investors). |
| **Done when** | KPIs match BE aggregates (live). |
| **FE now / BE blocked** | Mock 5 KPI cards. |

---

## Stage 1 — Commitment register

| | |
|---|---|
| **Who** | Finance / IR |
| **Goal** | Triage investors by commitment and operational statuses |
| **Steps** | Table: Investor, Fund, Currency, Commitment, Signed, Admitted, Funded, Status, Closing. Filter/export. |
| **Done when** | Working set selected. |
| **FE now / BE blocked** | Investor table with soft/hard, docs/KYC/sig/funding columns. Bulk admit missing. |

---

## Stage 2 — Add or update commitment

| | |
|---|---|
| **Who** | Finance / Deal Manager |
| **Goal** | Record independent amount fields with history |
| **Steps** | Add Commitment wizard / edit amounts; never overwrite other types; reason required. |
| **Done when** | Amounts persist with history. |
| **FE now / BE blocked** | Wizard toast only — **no list mutation**. No amount history. |

---

## Stage 3 — Readiness checklist

| | |
|---|---|
| **Who** | Ops / Compliance / Legal |
| **Goal** | Confirm docs, KYC/AML, signatures before close |
| **Steps** | Per-investor checklist; update Docs / KYC / Signature statuses. |
| **Done when** | Checklist green for admit candidates. |
| **FE now / BE blocked** | Sidebar checklist display; **not editable**. |

---

## Stage 4 — Closing timeline and event

| | |
|---|---|
| **Who** | Head of Fundraising / Legal |
| **Goal** | Plan First/Interim/Final close |
| **Steps** | 1. View Closing Timeline. 2. Open Next Closing Event (date, target, %). 3. Attach closing pack docs. |
| **Done when** | Closing event record exists with investors in scope. |
| **FE now / BE blocked** | Timeline + next event cards. Full closing entity (approvals, equalisation) incomplete. |

---

## Stage 5 — Validate and admit

| | |
|---|---|
| **Who** | Legal + Compliance + Fund ops |
| **Goal** | Admit investors only when gates pass |
| **Steps** | Legal readiness + Compliance readiness + Fund readiness (min raise, approvals). Bulk or single Admit. |
| **Done when** | Admitted commitments recorded; blocked investors listed with reasons. |
| **FE now / BE blocked** | Funding/admission columns display-only. **No validation API.** |

---

## Stage 6 — Funding / cash

| | |
|---|---|
| **Who** | Finance |
| **Goal** | Recognise funded capital only when cash received |
| **Steps** | Update Funded / Partially Funded; keep unfunded; never equate signed to cash. |
| **Done when** | Funded amounts match bank reality. |
| **FE now / BE blocked** | Funding status pills in mock. |

---

## Stage 7 — Post-close

| | |
|---|---|
| **Who** | Ops |
| **Goal** | Auto-create LP relationship, portal access, capital call contacts, reporting prefs |
| **Steps** | After close completes, verify post-close tasks created. |
| **Done when** | Downstream records exist. |
| **FE now / BE blocked** | **Missing.** |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | KPIs |
| 1 Register | Partial | Good table shell |
| 2 Add/update | Partial | Toast only |
| 3 Checklist | Partial | Not editable |
| 4 Closing event | Partial | Thin entity |
| 5 Admit | Missing | Core gates |
| 6 Fund/cash | Partial | Display only |
| 7 Post-close | Missing | — |
