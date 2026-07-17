# Agreements & Signatures — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Agreement lifecycle, e-sign, version binding, PE/VC + AM document types  
**Route:** `/fundraising/agreements`  
**Component:** `components/fundraising/fundraising-agreements.tsx`  
**Mock:** `agreements-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-agreements-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Signature always belongs to a **specific document version**.
- New version → pending signature requests invalid; new approval workflow; prior signed versions archived.
- Signed document ≠ deal won; still need commitment/admission/funding or mandate activation path.
- Types differ for PE/VC vs AM (NDA, Term Sheet, Subscription, LPA, Side Letter, IMA, Fee Schedule, …).

---

## Status diagram

```
[0 Open Agreements]
   → [1 Browse agreements / signature queue]
   → [2 Create draft agreement]
   → [3 Bind document version]
   → [4 Send for signature]
   → [5 Track partial → completed]
   → [6 Supersede version (invalidate pending)]
```

---

## Stage 0 — Open Agreements

| | |
|---|---|
| **Who** | Legal / IR |
| **Goal** | See agreement and signature workload |
| **Steps** | 1. Open `/fundraising/agreements`. 2. Read KPIs. 3. Note version-invalidation guardrail banner. |
| **Done when** | Workspace loads. |
| **FE now / BE blocked** | Mock KPIs + banner. |

---

## Stage 1 — Browse lists

| | |
|---|---|
| **Who** | Legal |
| **Goal** | Triage agreements and open signature requests |
| **Steps** | Tabs: Agreements | Signature requests. Open detail (type, investor, campaign, version, progress). |
| **Done when** | Target agreement selected. |
| **FE now / BE blocked** | Lists + detail + decorative signature pads. |

---

## Stage 2 — Create draft

| | |
|---|---|
| **Who** | Legal / IR |
| **Goal** | Create agreement draft for investor/campaign |
| **Steps** | New Agreement wizard: Identity → Parties → Review → Draft. |
| **Done when** | Draft exists with type and parties. |
| **FE now / BE blocked** | FrSimpleWizard creates local Draft. No real document upload. |

---

## Stage 3 — Bind document version

| | |
|---|---|
| **Who** | Legal |
| **Goal** | Attach file/version that signatures will bind to |
| **Steps** | Upload or select document version; checksum stored. |
| **Done when** | Version id locked for signing. |
| **FE now / BE blocked** | Version field in mock; **no upload / checksum**. |

---

## Stage 4 — Send for signature

| | |
|---|---|
| **Who** | Legal |
| **Goal** | Invite signatories with sequence and expiry |
| **Steps** | Send for Signature: required signatories, sequence, invite/expiry dates. |
| **Done when** | Status Sent; invites issued. |
| **FE now / BE blocked** | Dialog adds signatory locally → Sent. No e-sign provider. |

---

## Stage 5 — Track execution

| | |
|---|---|
| **Who** | Legal / IR |
| **Goal** | Monitor Partially Signed → Completed; capture certificate/copy |
| **Steps** | Watch progress; record signed dates; store certificate + signed copy. |
| **Done when** | Completed with audit trail; or Expired/Voided/Declined handled. |
| **FE now / BE blocked** | Progress bar + statuses in mock. No real capture/decline. |

---

## Stage 6 — Supersede version

| | |
|---|---|
| **Who** | Legal |
| **Goal** | Upload newer version; invalidate pending requests |
| **Steps** | 1. Upload new version. 2. Pending sigs void. 3. Restart approval/sign workflow. 4. Archive prior signed versions. |
| **Done when** | Only current version accepts new signatures. |
| **FE now / BE blocked** | Banner copy only — **flow not implementable** yet. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Guardrail banner |
| 1 Browse | Partial | Decorative pads |
| 2 Create | Partial | Local Draft |
| 3 Version bind | Missing | No file/checksum |
| 4 Send | Partial | Mock invite |
| 5 Track | Partial | Visual only |
| 6 Supersede | Missing | Banner only |
