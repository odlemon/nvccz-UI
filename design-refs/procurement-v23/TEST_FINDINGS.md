# Test findings — Procurement V23

**Engagement:** Procurement V23 end-to-end (UI to backend) · branch `feature/procurement-v23-live` (both repos)
**Method:** real browser sessions and real API requests as seeded personas; a finding is recorded only after it has been reproduced.

| Severity | Open | Fixed locally, not deployed | Deployed and verified |
|---|---|---|---|
| CRITICAL | 0 | 0 | 1 |
| HIGH | 0 | 2 | 0 |
| MEDIUM | 0 | 1 | 0 |
| LOW | 0 | 1 | 0 |

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
- The same submit with a portal token that carries no RFQ id: **500** "Invalid RFQ portal token".

### Expected

404 and 400. A 500 tells the vendor or the desk that the system broke, not that the request
was wrong, and it hides real failures in the error log.

### Root cause

`VendorQuotationService` throws a plain `Error` for every problem, and every controller method
passes it to `next(error)`. The error middleware answers any error without a status as 500.

### Fix

Commit `b7e2163` on `feature/procurement-v23-live` (nvccz). `VendorQuotationController` sets
the status before handing the error on:

- "not found" → 404;
- "already been …" → 409;
- a missing field, or a bad or expired token → 400.

Prisma errors are left alone and stay 500.

### Verification

| Request | Before | After |
|---|---|---|
| Accept an unknown quotation (Procurement Manager) | 500 | **404** "Quotation not found" |
| Reject an unknown quotation | 500 | **404** |
| Read an unknown quotation | 500 | **404** |
| Public submit, empty body | 500 | **400** "vendorPortalToken is required" |
| Public submit, forged token | 500 | **400** "Invalid vendor portal token signature" |

**Status:** FIXED LOCALLY — not deployed.

---

## PROC-FINDING-004

**Title:** Accounts payable cannot capture a supplier invoice — the staff path of the invoice endpoint is unreachable
**Module:** Procurement (backend) · **Dimension:** QAT · **Category:** Functional / Routing
**Severity:** MEDIUM
**Persona affected:** Accountant, Finance Officer
**Surface:** API · `POST /api/procurement/invoices`

### Steps to reproduce

1. Run a requisition through to an approved goods received note (`nvccz/scripts/_uat/procurement-p2p-flow.mjs` does this).
2. Sign in as the Accountant.
3. `POST /api/procurement/invoices` with the PO id, the vendor id, an invoice date, a due
   date and the invoice lines.

### Expected

201, a captured invoice. The controller has a staff branch for exactly this: it requires an
invoice date and a vendor id when the caller is staff.

### Actual

**400** "vendorPortalToken is required for vendor-submitted invoices". Every staff capture is
refused this way, whatever the role. An invoice can only enter procurement through the vendor's
emailed link.

### Root cause

The route is the public vendor submission route and is declared **before**
`router.use(authenticate)`. Nothing ever reads the Authorization header on it, so `req.user`
is never set, and the controller treats every request as a vendor's.

### Fix

Commit `b7e2163` on `feature/procurement-v23-live` (nvccz):

- **With an Authorization header,** the route authenticates the token, holds the caller to
  internal staff, and requires `procurement.intake.manage`. The controller's staff branch then
  applies.
- **Without a header,** it is still the vendor's token-signed submission, unchanged.

### Verification

| | Before | After |
|---|---|---|
| Accountant captures the invoice for `PO_20260911_0001` | 400 | **201** `INV_20260911_0001`, then approved by the Finance Manager |
| Staff persona without the capture grant | 400 (vendor token demanded) | **403** |
| LP portal token | 400 | **403** |
| No Authorization header, no vendor token | 400 | 400 (vendor path, unchanged) |

The authorisation probe now carries this row, and every asserted cell matches the policy.

**Status:** FIXED LOCALLY — not deployed.

---

## PROC-FINDING-005

**Title:** Procurement V23 showed the vendored demo dataset as the organisation's records, and its forms confirmed saves that were never made
**Module:** Procurement V23 (frontend) · **Dimension:** QAT · **Category:** Data Integrity / Functional
**Severity:** HIGH
**Persona affected:** Everyone who uses the module
**Surface:** UI · `/procurement-v23/*`

### Steps to reproduce

1. Sign in as any staff persona, with no procurement records in the database.
2. Open any V23 page.
3. Raise a requisition, record a GRN, or approve anything.

### Expected

The organisation's own records, or an honest empty state. A save either reaches the API or is
refused with the reason.

### Actual

- **Demo data shown as real (reproduced):** `procurement-v23-baseline.mjs` found:
  - 16 of 17 pages showing demo records — `PR-X8F2-0187`, `TN-2026-014`, `TechNova Solutions`,
    `PO-2026-0584` — while the database held no requisition, RFQ, PO, GRN or invoice;
  - 113 KPI cards carrying fixture literals, such as "Vendors 482" and "Open tenders 8";
  - sidebar badges, the cycle donut ("287 active records"), the spend trend and the category
    bars, all fixed.
- **Saves that never happened (from the runtime source):** the handlers do not call the API.
  - `submitPR` adds a row to the in-browser store and toasts "Approval routing was created and
    the department head was notified".
  - `create-grn-confirm` toasts "GRN created".
  - `approve-prompt-v6` flips the prompt's status in memory.

  Before the fix, the host routed no action anywhere, so none of these could have reached the
  API. This part was established from the code, not reproduced in a browser.

### Root cause

`components/procurement-v23-mock/procurement-v23-app.tsx` mounted the vendored runtime and
nothing else: no loaders, no hydrate, no action routing.

### Fix

nvccz-new `9d3c7fd` and the cycle-two commit on `feature/procurement-v23-live`:

- **Data:** live loaders by grant, and every demo-bearing store hydrated from the API or emptied.
- **Figures:** KPI literals become live figures or an em dash; fixture charts become empty
  states; the donuts, invoice-match chains and attention list are derived from records.
- **Approvals:** prompts built only from real pending decisions.
- **Actions:**
  - connected: raise, submit, approve and reject a requisition; award; approve and reject a
    GRN; approve an invoice; register a vendor; send a PO;
  - every other confirm, save or submit step is refused as not connected, so nothing is
    reported as saved when it was not.

### Verification

| | Before | After |
|---|---|---|
| Pages showing demo records (System Administrator, Procurement Officer, Operations head, Operations member) | 16 / 17 | **0 / 17** |
| Page or console errors | 0 | 0 |
| Raise a requisition through the form (Operations member) | in-memory row only | **`REQ_20260911_0004` PENDING_APPROVAL**, Operations, read back from the API |
| Approve a requisition in the Approval Centre (Operations head) | in-memory status | **`REQ_20260911_0002` APPROVED** |
| Award from the Approval Centre (Procurement Manager) | in-memory status | **`QUO_20260911_0005` accepted, `PO_20260911_0002` raised and sent** |
| Register a vendor through the V6 form (Procurement Officer) | in-memory row | **vendor created**, with email, BP number and tax status |
| Confirm a GRN in the still-unconnected modal | "GRN created" | **refused**: "not connected to the backend yet", GRN count 1 → 1 |
| Audit & Compliance event stream | five invented events | the real procurement audit trail (`GET /procurement/audit-events`) |

Evidence scripts:
- `scripts/_uat/procurement-v23-actions.mjs` checks each action through the API afterwards;
- `scripts/_uat/procurement-v23-baseline.mjs --live=…` reports the census per page.

**Status:** FIXED LOCALLY for the screens and actions listed — not deployed. The steps still
unconnected (RFx builder, bid scoring, GRN recording, invoice capture, plans, contracts,
documents) are refused rather than faked. They are tracked in
[`../procurement-v23-backend-asks.md`](../procurement-v23-backend-asks.md) and the next cycle.

---

## Not yet findings

- **`POST /procurement/rfqs/:id/award` returns 410** to everyone. This is intended: award was
  retired in favour of accepting a quotation, which creates the purchase order. The V23
  "award" action must call `POST /vendor-quotations/:id/accept`.
- **The approval queue** (`GET /procurement/requisitions/pending-approval`) returns 400 to
  anyone who is not a department head. The response still needs checking against a real
  pending requisition.
