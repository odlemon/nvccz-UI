# Payroll V6 — runtime action inventory

**Date:** 9 September 2026
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
| **NO-BACKEND** | The capability does not exist on the backend. Recorded in `payroll-v6-backend-asks.md`; the control still does its client-side thing and is not presented as saved. |

---

### LIVE — routed to the API (10)

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

Each checks its permission first and returns a visible refusal
("Your role does not have permission for …") rather than failing silently.

### NAV — page navigation (2)

`overview`, `runs`

These are page ids; `handleAction` short-circuits on `pageIds.has(action)` and
calls `goPage()`.

### VIEW — client-side view state (23)

`close-drawer`, `close-modal`, `client-design-sign-out`, `profile-menu`,
`employee-documents`, `access-filter`, `audit-filter`, `cancel-doc-edit`,
`edit-document`, `edit-report`, `preview-report`, `v5-edit-report`,
`open-onboarding`, `open-rule`, `training-detail`, `employee-audit`,
`vendor-documents`, `compare-quotations`, `compare-runs`, `drill-payroll`,
`chart-open-runs`, `chart-open-employees`, `mark-read`

Drawers, modals, tab/filter switches and in-page navigation. All legitimately
client-side — none of them claims to persist anything.

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

### EXPORT — payslip documents (3)

`download-payslip`, `preview-payslip`, `download-review-pack`

Generate a PDF client-side. **Known gap:** the backend has
`GET /payroll/employee/payslips/:id/download` (a real, hash-verified PDF) and
these still build a local PDF instead. Logged in the backend-asks doc as the
next wiring step; the numbers they print now come from the live payslip.

### NO-BACKEND — capability does not exist (36)

These have no endpoint to call. They are listed individually so none is
mistaken for working:

**Vendors & quotations (11)** — no payroll-vendor API exists at all:
`new-vendor`, `save-vendor-v2`, `email-vendor`, `new-rfq`, `save-rfq-v2`,
`send-bid-form`, `preview-bid-form`, `send-vendor-invitations`,
`compare-quotations`, `export-quote-comparison`, `download-vendor-register`

**Inputs & validation (5)** — no input-batch store:
`upload-inputs`, `resolve-input`, `export-errors`, `download-input-template`,
`import-employees`

**Exceptions (2)** — no exceptions table; the register is derived from real
data-quality blockers on employee records, but resolution is not persisted:
`resolve-exception`, `escalate-exception`, `assign-exceptions`

**Pay groups & calendar (5)** — no pay-group model:
`new-paygroup`, `edit-paygroup`, `edit-schedule`, `edit-schedule-v2`,
`copy-calendar`, `copy-calendar-v2`

**Onboarding (2)** — no candidate pipeline:
`complete-onboarding`, `save-onboarding`

**Document vault (4)** — no payroll document store:
`upload-document`, `create-document`, `confirm-upload`,
`confirm-create-document`, `save-document`

**Reports (3)** — no report generation endpoint:
`custom-report`, `save-report`, `scheduled-reports`

**Access & settings (5)** — role administration is not exposed to this module:
`edit-access`, `assign-access`, `run-access-review`, `save-settings`,
`integration-logs`, `platform-health`

**Components & tax (3)** — the read side is live; the write side is not wired:
`new-component`, `edit-component`, `import-components`, `new-tax-rule`,
`tax-impact`

**Other (2)** — `record-training`, `leave-adjustment`, `request-leave`,
`ess-bank-change`, `edit-employee`, `new-employee`, `save-run`,
`generic-save`, `record-decision`, `approval-decision`, `audit-evidence`,
`verify-audit`

> `new-employee` / `edit-employee` are a special case: `POST`/`PUT
> /payroll/employees` **do** exist and are guarded, but the runtime's create
> form collects a different field set (it has no `userId`, which the Employee
> record requires) so wiring it needs a form change, not just a handler. Logged
> as the highest-value remaining item in the backend-asks doc.

---

## Reconciliation of routes vs navigation

`app/payroll-v6/` has 19 route folders plus `page.tsx`; `lib/payroll-v6-mock/nav.ts`
maps 20 page ids and the sidebar renders all of them. The 10 submodules listed
in `lib/config/modules.ts` are a **subset** used by the app switcher, not the
module's own navigation — the remaining 10 pages are reachable from the sidebar
and all render. No route is dead: all 20 were dumped and all 20 mounted with a
`#content` element and zero console errors (see `payroll-v6-test-plan.md`).
