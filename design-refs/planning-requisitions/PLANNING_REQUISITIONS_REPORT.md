# Procurement Planning, Purchase Requisitions and Requisition Approval: gap check, build and verification

All local (MySQL `arcus_dev`, API :3009, staff portal :3120). Nothing deployed, nothing committed.
Scope: SRD §10 (annual plan), §11 (purchase requisition), §12 (requisition approval routing).

## 1. Migration log (backend repo, apply to dev in this order)

| # | Command | Effect |
|---|---|---|
| 1 | `npm run db:migrate:user-status` (existing) | User states (Task A) |
| 2 | `npm run db:migrate:nts-remaining` (existing, uncommitted) | Procurement settings table (Task A prerequisite) |
| 3 | `npm run db:migrate:user-master` | User Master fields (Task A) |
| 4 | `npm run db:migrate:vendor-master` | Vendor Master, documents, reopen events, invoice `submitted_via` (Task B) |
| 5 | `npm run db:migrate:planning-requisitions` | **This task. One idempotent script.** See below. |

Then `npx prisma generate` (stop the API first; on Windows the running process locks the engine DLL).

`db:migrate:planning-requisitions` adds:
- `procurement_plan_items`: `requirement`, `business_unit`, `planned_start_date`, `required_delivery_date`, `budget_code`, `cost_centre`, `responsible_officer_id`, `currency_code` (`requirement` back-filled from `description`); `procurement_plans.business_unit`.
- `purchase_requisitions`: `required_date`, `procurement_method`, `risk_level`, `exception_type`, `resubmission_count`, `suggested_vendor_id`; indexes on `plan_item_id` and `(budget_code, cost_centre)`; a `plan_item_id` that pointed at nothing is cleared.
- `purchase_orders.plan_item_id`, `procurement_rfqs.plan_item_id` (back-filled from the requisition).
- New tables: `document_sequences` (atomic counters), `procurement_budgets` (budget master), `procurement_decision_log` (approval decisions), `purchase_requisition_attachments`.
- `procurement_settings`: `suggested_vendor_policy` (default `ALLOWED_APPROVED_ONLY`), `budget_check_mode` (default `ENFORCE`), `plan_link_policy` (default `OPTIONAL`); `pr_number_format` default becomes `PR-{YYYY}-{######}` and a saved old daily format (`PR_{YYYY}{MM}{DD}_{####}`) is moved to it once.

Existing requisition numbers (`PR_20260101_0001` style) are left as they are; new ones follow the configured format. There is no runtime scheduler or cron addition.

## 2. Audit: what was missing or inert
- **Numbering**: `REQ_YYYYMMDD_0001` derived from a scan of existing rows (racy; two simultaneous creates could collide); no configurable yearly format.
- **Requisition**: no currency, required date, procurement method, risk level, exception type, suggested vendor or attachments; the Estimated Total existed but nothing stopped it being wrong; budget code and plan line were free text checked against nothing.
- **Plan**: lines had only description, category, quarter, method, value and department; nothing recorded who is responsible, when it starts or is needed, or which budget it draws on; a requisition could link to any plan line, including one in a draft plan; no consumption anywhere.
- **Routing**: the approval matrix had amount and role only. `matchRules` existed in the engine but keys never matched what was sent (`procurementMethod`, `riskLevel`, category, business unit, exception were never in the request data), and the matrix could not write them; delegation was off for every step and its picker in the UI was a list of fixture names.
- **Actions**: only approve and reject. No return for amendment, no comment; no decision log (only the general audit trail); the reject form pre-wrote a reason.
- **Fingerprint bug found on the way**: "you must change the requisition before resubmitting" compared line ids, and lines are re-created on every edit, so an unchanged resubmission always passed. It now compares content and includes the new header fields.

## 3. What was built
Backend: `DocumentNumberingService` (atomic counter row in `document_sequences`, bumped inside the creating transaction; format tokens `{YYYY}` `{MM}` `{DD}` `{######}`), `ProcurementRequisitionRulesService` (header vocabulary, plan link and consumption, budget check, suggested-vendor rule), `ProcurementDecisionLogService`, return-for-amendment / comment / authorised delegation in `ProcurementRequisitionApprovalService`, delegate eligibility in `UserMasterPolicyService`, plan §10 fields and consumption in `ProcurementRegistersService`, budget master, requisition policy and options endpoints, attachments (multipart upload to the file store), plus a bulk `POST /procurement/requisitions/context`.
Frontend: requisition form (all §11 fields, live budget and plan position, attachments), edit form for draft, rejected and returned requisitions (lines included), decision history, reject / return / comment dialog, delegate dialog fed by the API, matrix editor with delegation and routing conditions, Configuration screen for requisition policy and budgets, plan forms and register with the §10 fields and Drawn / Remaining columns.

## 4. Enforcement, as tested
- **Numbers** are gap-free (refused creates burn none) and unique under 12 simultaneous creates; the format is configurable and validated.
- **Estimated Total** is derived from the lines and cannot be set; negative or zero-quantity lines are refused.
- **Plan**: only approved plans can be drawn on; an approved plan's lines are frozen; a requisition that would overdraw a line is refused at submit unless it declares an exception (recorded as a warning); currency must match the plan line; policy can require a plan link or an exception type.
- **Budget**: block / warn / off; missing code, unknown code, wrong currency, no estimate and insufficient available are each refused with the figures; rejecting or returning releases the committed amount.
- **Suggested vendor**: not allowed / approved vendors only / sole source only, with the vendor gate applied.
- **Routing** on all nine criteria (amount, department, business unit, cost centre, category, branch, method, risk, exception), each tested as a match and a non-match; a matrix with no step that applies to everything is refused so no requisition is left without an approver.
- **Actions**: approve, reject (reason required), return for amendment (comment required, requester amends, unchanged resubmission refused, re-routed from step 1), comment, delegate (only the current step's approver, only where the step allows it, reason required; the requester, a suspended user, a user with too low an approval limit or level, a read-only profile or a non-approving function are refused). Approval limits are enforced with escalation and audit.
- **Decision capture**: user, action, date and time, comments, previous and resulting status, step, and on-behalf-of, in `procurement_decision_log`, visible to the requester, approvers on the route and anyone with the view-all grant; also in the audit trail.
- **Carry-through**: the requisition's currency and plan line reach the RFQ and purchase order; an order in another currency is refused.
- **Attachments**: uploaded to the file store, listed, removable while the requisition is editable, locked during approval, type and count limited.

## 5. Verification
| Suite | Result |
|---|---|
| `planning-requisitions-e2e.ts` (real API) | **165/165** |
| `planning-requisitions-ui.mjs` (visible browser, six real users) | **80/80** |
| `user-master-e2e.ts` (re-run) | 69/69 |
| `vendor-master-e2e.ts` (re-run) | 78/78 (one earlier run hit a database connection blip; rerun clean) |
| `vendor-portal-adversarial.ts` (re-run) | 56/56 |
| `vendor-master-ui.mjs` (visible browser, re-run) | 56/56 |
Screenshots: `design-refs/planning-requisitions/screens/`.

## 6. Decisions I made (you asked me not to stop for approval)
- **Budget check defaults to Enforce.** With no budget loaded, a requisition cannot be submitted (a budget code is required and must exist for the year). Set it to Warn on dev until budgets are loaded (Configuration, Approval matrix, Requisition policy). The older user-master suite sets it to Off for its own run and restores it.
- **Budget position** counts in-flight and approved requisitions (everything except draft, rejected, returned, cancelled) for the same code and cost centre in the calendar year; an exact cost-centre row wins over a whole-code row. Amounts are compared in the budget's currency; a mismatch is refused, not converted.
- **Return for amendment** is a new requisition status, `RETURNED`, distinct from `REJECTED`; the requester amends and resubmits and it is routed afresh.
- **Delegation** is off unless the matrix step turns it on; the delegate must be someone who could approve it themselves. The picker shows ineligible people disabled, with the reason. Delegation from non-requisition approvals (award, receipt, invoice, plan) has no picker yet, so its button is hidden in the Approval Centre rather than showing fixture names.
- **Plan line methods** are a fixed vocabulary shared with the requisition (RFQ, open tender, restricted tender, single source, direct purchase, framework call-off); older free-text values such as "Framework" are mapped.
- **Plan submit** requires every line to carry a value, method, delivery date, budget code and responsible officer, and the lines to fit the plan budget.
- Existing requisition numbers keep their old format.

## 7. Limits and follow-ups
- Approvals of awards, receipts, invoices and plans are still decided one person at a time with no return or delegate; only requisitions have them.
- Attachments are checked by extension and size (15 MB, 20 per requisition), not scanned.
- Plan workspace KPI tiles and the execution chart on the plan page are vendored samples that pre-date this work; the line tables, register and forms are live.
- Email is blocked by the local mail guard, so notifications were verified in-app only.

