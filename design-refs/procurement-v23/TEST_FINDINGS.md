# Test findings — Procurement V23

**Engagement:** Procurement V23 end-to-end (UI to backend) · branch `feature/procurement-v23-live` (both repos)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only after it has been reproduced.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 1 |
| HIGH | 0 | 1 | 0 |
| MEDIUM | 0 | 0 | 0 |
| LOW | 1 | 0 | 0 |

---

## Cycle 0 — baseline

### What the module renders before any wiring

`scripts/_uat/procurement-v23-baseline.mjs`, as System Administrator and again as Procurement
Officer, 1440px, local stack:

- All 17 pages render with **0 page or console errors**, and the Procurement Officer lands on
  every page (the frontend does not block the role).
- **16 of 17 pages show the vendored demo dataset** — `PR-X8F2-0187`, `TN-2026-014`,
  `TechNova Solutions`, `PO-2026-0584`, `GRN-2026-0219`, `INV-98431`, `FA-000882`, `T. Moyo` and
  others. The local database holds no requisitions, purchase orders, RFQs, GRNs or invoices,
  so none of it can have come from the API. The 17th (Settings) shows the demo role matrix,
  which the probe's markers do not cover.
- The runtime exposes an integration surface: `MatanhoProcurementUI.hydrate`, `getSnapshot`,
  `setBackendAdapter`, `request`, `openApproval`, `openDocument`, `createTender`, and 252 base
  action handlers on `window.MatanhoProcurementHandlers`.
- `hydrate()` accepts 13 of the store's collections. `planItems`, `grns`, `journals`, `assets`
  and the versioned add-ons (`contractsV6`, `bidAwardsV6`, `approvalPromptsV6`,
  `vendorMessagesV6`, `vendorAuditTrailV19` and others) cannot be replaced through it.
- 81 distinct actions appear across the pages; **32 have no base handler** and are either
  handled by one of the later capture-phase layers (V5–V21) or do nothing: `record-grn`,
  `submit-plan`, `add-plan-item`, `invite-vendors`, `create-tender`, `open-evaluation`,
  `sync-accounting`, `export-bank`, `scan-delivery`, `import-plan` and 22 more.

### The local data set was not testable

No local user held any procurement role (PROC_MGR, PROC_OFF, BUYER) or a payables role.
`nvccz/scripts/seed-procurement-test-users.ts` adds one real login per missing persona; the
department head, Finance Manager, CFO, Internal Auditor and System Administrator reuse existing
test users.

---

## PROC-FINDING-001

**Title:** Any LP or investee portal account can use the internal procurement API — reading vendor master data and creating requisitions
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Access Control / Data Isolation
**Severity:** CRITICAL
**Persona affected:** Every vendor on file; the organisation's procurement records
**Surface:** API · `/api/procurement/*`, `/api/procurement/suite06/*`, `/api/procurement-approval-configs/*`, `/api/accounting/vendors/*`, `/api/vendor-quotations/*`

### Steps to reproduce

1. Sign in to the **LP portal** as an LP (`POST /api/auth/login`, `portal: "lp"`). The token
   carries `aud: "lp"`, role `LIMITED_PARTNER`.
2. With that token, `GET /api/accounting/vendors/:id`.
3. With that token, `POST /api/procurement/requisitions` with a title, a department and one item.

### Expected

403 on both. An external portal account has no business with internal procurement.

### Actual

Both succeed.

- **Vendor master data:** `GET /api/accounting/vendors/:id` returns 200 with `taxNumber`,
  `bpNumber`, `contactPerson`, `email`, `phone`, `address`, `paymentTerms`,
  `taxClearanceExpiryDate`.
- **Vendor bank accounts and KYC documents:** `GET .../vendors/:id/banks` and
  `.../vendors/:id/kyc-documents` return 200. The local vendor has no rows, so the arrays were
  empty; the endpoints answered the LP token all the same.
- **Every procurement register and both dashboards:** requisitions, purchase orders, RFQs,
  GRNs, invoices, payments, quotations, approval configurations (accounting's configured
  approval chains by name and stage), Suite 06 intakes and the CFO dashboard — all 200.
- **Writes:** the requisition create returned **201** (`REQ_20260911_0001`, requested by the LP
  account). An Internal Auditor's create also returned 201 (`REQ_20260911_0002`). Both were
  deleted immediately.

Across 28 endpoints the LP account was refused on **2**.

### Root cause

All five routers are mounted with `authenticate` and nothing else. `authenticate` proves a
token is valid, not that its holder is staff. Role logic, where it exists, lives inside
individual controller methods — `createPurchaseRequisition` checks only that a title, items
and a department are present. `requireInternalStaffUser()` already exists for exactly this
case (added for FINDING-006 in the three-module engagement) and was never applied here.

### Fix

`requireInternalStaffUser()` directly after `authenticate` on all five routers. Vendors are
unaffected by design: they never hold a JWT, and their flows (invoice upload and submit,
quotation submit) are public routes declared **before** `authenticate`. No LP, investee or
applicant frontend calls these routers; the applicant procurement flow has its own router at
`/api/applicant`.

Commit `90976cf` on `feature/procurement-v23-live` (nvccz).

### Verification

`nvccz/scripts/_uat/procurement-authz-probe.mjs`, before and after, 11 personas × 28 endpoints:

| | Before | After |
|---|---|---|
| LP account not refused | 26 / 28 | **0 / 28** |
| No token, not refused | 0 / 28 | 0 / 28 (401 throughout) |
| LP `POST /procurement/requisitions` (valid body) | 201 | **403** "This account is not authorized for staff resources." |
| Operations member `POST /procurement/requisitions` | 201 | 201 (legitimate, unchanged) |
| Public vendor routes with no token | reachable | reachable (400 on an empty body) |

**Status:** DEPLOYED to the production API on 11 September 2026 (commit `90976cf`, with the
user's approval) and verified there:

- `requireInternalStaffUser()` is present in both `src` and the compiled `dist` of all five
  routers inside the running container;
- `/health` 200, container restarts 0, no error lines in the log after start;
- `GET /api/procurement/dashboard` with no token returns 401;
- the admin login still succeeds.

Not run on production: the behavioural check with a real LP token. It was run locally (the table above).

---

## PROC-FINDING-002

**Title:** Any staff account can raise purchase orders, approve receipts, approve and pay invoices, award quotations and change vendor bank details
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Access Control / Segregation of Duties
**Severity:** HIGH
**Persona affected:** The organisation's spend and payments; every vendor's bank details
**Surface:** API · `/api/procurement/*`, `/api/vendor-quotations/*`, `/api/procurement/suite06/*`, `/api/accounting/vendors/:id/{banks,blacklist,kyc-documents}`

### Steps to reproduce

1. Sign in as an Operations member with no procurement role (`proc.requester`, role code `OPS_MEM`).
2. `POST /api/procurement/purchase-orders` with a real `vendorId` and one line.

### Expected

403. Raising a purchase order commits the organisation's money; it belongs to the procurement desk.

### Actual

**201**, `PO_20260911_0001`, status DRAFT, total 1.16. The same request as an Internal Auditor
returned 201 (`PO_20260911_0002`) and as an Accountant 201 (`PO_20260911_0003`). All three were
deleted immediately.

The empty-body matrix showed the same for every other desk action. As every staff persona,
PO send, PO-to-bill, GRN approve, invoice approve, invoice payment, quotation accept (the
award), vendor blacklist and vendor bank create reached the handler's own validation instead
of a refusal. RFQ create failed for those roles only because the local vendor had no email
address (400 "Vendors without email").

The inverse was also true. `GET /procurement/requisitions` returned **403** to the Procurement
Officer and the Buyer — the roles that turn approved requisitions into RFQs and purchase orders.

### Root cause

- No route or controller checks the caller's role before any of these actions. Only
  `authenticate` stood in front of them, and after PROC-001 only the staff check.
- `getAllPurchaseRequisitions` admits only a department HEAD, DEPUTY or `PROC_MGR`, and
  filters to the caller's own department.

### Fix

Commit `0847b16` on `feature/procurement-v23-live` (nvccz):

- **Permission catalogue** — `src/config/procurementPermissions.ts`,
  `procurement.<area>.<action>` in the payroll convention, with default grants for 13 roles.
  The grants keep duties apart:
  - running an RFQ and awarding it are separate grants;
  - approving an invoice (Finance Manager, CFO) and paying it (Accountant, Finance Officer)
    are never held by the same non-administrator role;
  - vendor bank details are managed by finance, not by the desk that onboards the vendor.
- **Route guards** — `requireAnyPermission` on each desk action and register.
- **Deliberately staff-wide:**
  - raising your own requisitions;
  - approving or rejecting a requisition (the approval engine decides per record);
  - vendor create and edit, shared with accounting's vendor screen;
  - the approval-configuration list (its create is already administrator-only).
- **Cross-department requisitions** — `procurement.requisitions.view` now sees every
  department's requisitions. Investee fund scoping still applies.
- **Grants migration** — `npm run db:migrate:procurement-permissions`, idempotent, with
  `--check`. Run locally: 169 grants across 13 roles.

### Verification

The same probe, now asserting the policy for each persona: 11 personas × 34 endpoints, plus a valid-body PO.

| | Before | After |
|---|---|---|
| Operations member, valid PO | 201 | **403** "Required one of: procurement.orders.manage" |
| Accountant, valid PO | 201 | **403** |
| Procurement Officer, valid PO | 201 | 201 (legitimate; deleted) |
| Procurement Officer / Buyer list requisitions | 403 / 403 | **200 / 200**, every department |
| Department head list requisitions, approval queue | 200, 200 | 200, 200 (own department, unchanged) |
| Vendor bank details, read | every staff persona | Administrator, Procurement Manager, Accountant, Finance Manager, Internal Auditor |
| Vendor bank details, create | every staff persona | Administrator, Finance Manager |
| Invoice approve / pay | every staff persona | Finance Manager / Accountant (and Administrator) |
| Quotation accept (award) | every staff persona | Administrator, Procurement Manager |
| Asserted cells not matching the policy | — | **0** |

**Status:** FIXED LOCALLY — not deployed. Production is still open to any staff account.

**Deploy note:** the guards and grants must ship together. Run
`npm run db:migrate:procurement-permissions` against the target database before, or with, the
API; otherwise the procurement desk is refused everywhere.

The grants are defaults, not business sign-off, and can be changed per role in Admin → Roles.

---

## PROC-FINDING-003

**Title:** Two quotation endpoints answer 500 where the request is at fault
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Error Handling
**Severity:** LOW
**Surface:** API · `POST /api/vendor-quotations/:id/accept`, `POST /api/vendor-quotations/submit`

### Actual

- `POST /vendor-quotations/:id/accept` with an id that does not exist, as the Procurement Manager
  or System Administrator: **500**. `reviewQuotation` throws, and the controller hands every
  error to `next(error)`, including "not found".
- `POST /vendor-quotations/submit` (public, the vendor's own route) with an empty body: **500**.

### Expected

404 and 400. A 500 tells the vendor or the desk that the system broke, not that the request
was wrong, and it hides real failures in the error log.

**Status:** OPEN. Accept is the award path the V23 wiring will call, so it is fixed there.

---

## Not yet findings

- **`POST /procurement/rfqs/:id/award` returns 410** to everyone. This is intended: award was
  retired in favour of accepting a quotation, which creates the purchase order. The V23
  "award" action must call `POST /vendor-quotations/:id/accept`.
- **The approval queue** (`GET /procurement/requisitions/pending-approval`) returns 400 to
  anyone who is not a department head. The response still needs checking against a real
  pending requisition.
