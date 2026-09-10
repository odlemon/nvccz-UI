# Payroll V6 — runtime action inventory

**Date:** 9 September 2026 · **Revised:** 10 September 2026
**Runtime:** `components/payroll-v6-mock/matanho-payroll-runtime.js`
**Extracted with:**

```bash
grep -oE 'data-action="[a-zA-Z0-9_-]+"' matanho-payroll-runtime.js | sed 's/data-action="//;s/"//'
grep -oE "button\('[^']*',\s*'[a-zA-Z0-9_-]+'" matanho-payroll-runtime.js | sed -E "s/.*,\s*'//;s/'//"
```

**107 unique action ids.** Every one is listed below with a disposition. Nothing
is skipped silently.

## How actions reach the API

The runtime dispatches every `[data-action]` click as a cancelable
`matanho:before-action` DOM event (injected by
`scripts/patch-payroll-runtime.mjs`, registered in the capture phase *before*
the runtime's own listeners so a claimed action never reaches the mock path).

`components/payroll-v6-mock/payroll-v6-app.tsx` matches the id against its
`API_ACTIONS` allowlist and routes those through `lib/payroll-v6/actions.ts`.
Anything not on the allowlist keeps the runtime's own client-side behaviour.

## Dispositions

| Disposition | Meaning |
|---|---|
| **LIVE** | On the `API_ACTIONS` allowlist; hits a real endpoint; permission-checked with an explicit refusal. |
| **VIEW** | Legitimately client-side: opens/closes a drawer or modal, switches a tab, filters or sorts data already on screen, navigates. |
| **EXPORT** | Builds a CSV/DOC/PDF in the browser from data already rendered. Live once the screen it exports is live. |
| **NAV** | A page id — `handleAction` routes it through `goPage()`. |
| **UNWIRED** | The endpoint exists; the control still opens the runtime's own dialog because no form collects the fields it needs and the id is not on `API_ACTIONS`. Form-building, not capability. |
| **NO-BACKEND** | The capability does not exist on the backend. Recorded in `payroll-v6-backend-asks.md`; the control still does its client-side thing and is not presented as saved. |

---

### LIVE — routed to the API (15)

| Action | Endpoint | Permission |
|---|---|---|
| `create-run` | `POST /payroll/payroll-runs` | `payroll.runs.manage` |
| `continue-run` | `POST /payroll/payroll-runs/:id/submit-for-approval` | `payroll.runs.manage` |
| `commit-inputs` | `POST /payroll/payroll-runs/:id/process` | `payroll.runs.manage` |
| `approve-payroll` | `POST /payroll/payroll-runs/:id/approve` | `payroll.runs.approve` |
| `reject-payroll` | `POST /payroll/payroll-runs/:id/reject` | `payroll.runs.approve` |
| `release-payroll` | `POST /payroll/payroll-runs/:id/payment` | `payroll.runs.release` |
| `download-close-pack` | `POST /payroll/payroll-runs/:id/bank-file` | `payroll.runs.release` |
| `suspend-employee` | `POST /payroll/employees/:id/suspend` | `payroll.employees.manage` |
| `reinstate-employee` | `POST /payroll/employees/:id/reinstate` | `payroll.employees.manage` |
| `terminate-employee` | `POST /payroll/employees/:id/terminate` | `payroll.employees.manage` |
| `save-employee` | `PUT /payroll/employees/:id` | `payroll.employees.manage` |
| `complete-onboarding` | `POST /payroll/employees/with-user` | `payroll.employees.manage` |
| `save-paygroup` | `POST /payroll/pay-groups` | `payroll.calendar.manage` |
| `download-payslip` | `GET /payroll/employee/payslips/:id/download` | own payslip |
| `preview-payslip` | `GET /payroll/employee/payslips/:id/download` | own payslip |

Each checks its permission first and returns a visible refusal
("Your role does not have permission for …") rather than failing silently.

### NAV — page navigation (2)

`overview`, `runs`

These are page ids; `handleAction` short-circuits on `pageIds.has(action)` and
calls `goPage()`.

### VIEW — client-side view state (27)

`close-drawer`, `close-modal`, `client-design-sign-out`, `profile-menu`,
`employee-documents`, `access-filter`, `audit-filter`, `cancel-doc-edit`,
`edit-document`, `edit-report`, `preview-report`, `v5-edit-report`,
`open-onboarding`, `open-rule`, `training-detail`, `employee-audit`,
`vendor-documents`, `compare-quotations`, `compare-runs`, `drill-payroll`,
`chart-open-runs`, `chart-open-employees`, `mark-read`, `new-employee`,
`edit-employee`, `new-paygroup`, `new-run`

Drawers, modals, tab/filter switches and in-page navigation. All legitimately
client-side — none of them claims to persist anything. Three are dialog
openers whose submit control is LIVE: `new-employee` -> `complete-onboarding`,
`edit-employee` -> `save-employee`, `new-paygroup` -> `save-paygroup`.

`edit-employee` was itself on the allowlist until 10 September 2026, so the
host claimed the click, the runtime's dialog never opened, and the handler
looked for form fields that did not exist — every click ended at "Nothing to
update". Splitting opener from submit is what makes the control work; a submit
control must also carry the record it acts on (`data-record-id`), the omission
that made the payslip button a silent no-op.

### VIEW — chart interaction (4)

`chart-payroll-detail`, `chart-department-detail`, `chart-export-payroll`,
`chart-export-departments`

The two chart series now render from `/payroll/dashboard`
(`monthlyTrend`, `departmentDistribution`), so these drill into live data.

### EXPORT — generated in-browser from rendered data (14)

`export-employees`, `export-exceptions`, `export-leave`, `export-training`,
`export-audit`, `export-errors`, `export-quote-comparison`,
`download-input-template`, `download-vendor-register`, `download-doc`,
`download-doc-pdf`, `download-report-doc`, `download-report-pdf`,
`download-run-evidence`

These serialise what is already on screen. `export-employees`,
`export-leave`, `export-training` and `export-exceptions` now export live data
because their screens are live. `export-errors` and `download-input-template`
still serialise fixture rows — see NO-BACKEND below.

### EXPORT — payslip documents (1)

`download-review-pack`

`download-payslip` and `preview-payslip` moved to LIVE. They built the PDF in
the browser from hardcoded content — every employee downloaded the same
invented payslip for "Rudo Sibanda" — and the button carried no id to ask for
anything else. It now carries `data-payslip-id`, downloads the backend's own
hash-verified PDF from `GET /payroll/employee/payslips/:id/download`, and is
disabled outright when the signed-in user has no payslip.

### UNWIRED — the endpoint exists, the control does not use it (16)

**Updated 10 September 2026.** Four of the domains below had no backend when
this inventory was first written and now do — inputs, pay groups and calendar,
onboarding, and vendor RFQs were built during the takeover (see
`three-module-takeover-status.md`). The read side of each is live and the
screens render real rows. These controls, though, still open the runtime's own
dialog: what is missing is a form that collects the fields the endpoint needs
and an entry on the `API_ACTIONS` allowlist. That is form-building, not
capability, and each is a contained piece of work.

| Control | Screen | Endpoint waiting for it |
|---|---|---|
| `upload-inputs` | Inputs & Validation | `POST /payroll/inputs/batches` |
| `resolve-input` | Inputs & Validation | `PATCH /payroll/inputs/rows/:rowId/resolve` |
| `edit-paygroup` | Pay Groups & Calendar | `PATCH /payroll/pay-groups/:id` |
| `edit-schedule`, `edit-schedule-v2`, `save-schedule-v2` | Pay Groups & Calendar | `PUT /payroll/pay-groups/:id/periods` |
| `copy-calendar`, `copy-calendar-v2` | Pay Groups & Calendar | `PUT /payroll/pay-groups/:id/periods` |
| `save-onboarding` | Onboarding | `POST /payroll/onboarding/candidates` |
| `new-rfq`, `save-rfq-v2` | Vendors & Quotations | `POST /payroll/rfqs` |
| `send-bid-form`, `preview-bid-form` | Vendors & Quotations | `POST /payroll/rfqs/:id/bids` |
| `new-component`, `edit-component`, `import-components` | Earnings & Deductions | `POST`/`PUT /payroll/allowance-types`, `/deduction-types` |
| `new-tax-rule` | Tax & Statutory | `POST /payroll/tax-rules` |

`export-errors` and `download-input-template` serialise what the Inputs screen
now holds, so they follow that screen rather than needing an endpoint.

`POST /payroll/rfqs/:id/award/:bidId` has no control at all — the runtime has
no award button to wire. Awarding is reachable only through the API until one
is added.

### NO-BACKEND — capability does not exist (17)

These have no endpoint to call, and none is presented as saved. They are listed
individually so none is mistaken for working:

**Vendors (4)** — `Vendor` is read-only to this module; creating and emailing
vendors belongs to procurement, which owns the registry:
`new-vendor`, `save-vendor-v2`, `email-vendor`, `send-vendor-invitations`

**Document vault (5)** — no payroll document store exists:
`upload-document`, `create-document`, `confirm-upload`,
`confirm-create-document`, `save-document`

**Reports (3)** — no report-generation endpoint exists:
`custom-report`, `save-report`, `scheduled-reports`

**Access & settings (5)** — role administration is deliberately not exposed to
this module; it lives in Admin:
`edit-access`, `assign-access`, `run-access-review`, `save-settings`,
`integration-logs`

**Exceptions (2)** — the register is derived from real data-quality blockers on
employee records, but there is no exceptions table, so a resolution has nowhere
to persist: `resolve-exception`, `escalate-exception`

**Other** — `record-training`, `leave-adjustment`, `request-leave`,
`ess-bank-change`, `tax-impact`, `platform-health`, `audit-evidence`,
`verify-audit`, `assign-exceptions`, `save-run`, `generic-save`,
`record-decision`, `approval-decision`, `import-employees`

---

## Reconciliation of routes vs navigation

`app/payroll/` has 19 route folders plus `page.tsx`; `lib/payroll-v6-mock/nav.ts`
maps 20 page ids and the sidebar renders all of them. The 10 submodules listed
in `lib/config/modules.ts` are a **subset** used by the app switcher, not the
module's own navigation — the remaining 10 pages are reachable from the sidebar
and all render. No route is dead: all 20 were dumped and all 20 mounted with a
`#content` element and zero console errors (see `payroll-v6-test-plan.md`).
