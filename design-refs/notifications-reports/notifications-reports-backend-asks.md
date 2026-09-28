# Notifications, dashboards, reports, currency, numbering, statuses: backend contract (SRD §34–§40)

All routes are under `/api/procurement`, staff only. Built in `../nvccz` (`src/controllers/ProcurementInsightsController.ts`, `src/services/{notifications,reports,dashboards,fx,numbering,status}`). Every response is `{ success, data }`; a refusal is `{ success: false, message }` with 400 (input), 403 (role), 404 or 409 (status move not allowed).

## Permissions
| Permission | Granted by default to |
|---|---|
| `procurement.reports.view` | Procurement Manager, Procurement Officer, and every role that holds all read grants (Finance Manager, CFO, CEO, Internal Auditor) |
| `procurement.reports.export` | Procurement Manager, Finance Manager, CFO, CEO, Internal Auditor |
| `procurement.dashboard.executive` | CFO, CEO, Board Chairman, Board Member, administrators |
| `procurement.dashboard.view` | as before; Board Chairman and Board Member added |
Settings routes (rules, numbering, currency) read with `audit.view` / `rfq.view` / `orders.view`, write with `audit.view` (the same grant as `PUT /settings`).

## §34 Notifications
- `GET /notification-rules` → 14 rows `{ key, label, audience, enabled, inApp, email, params, paramLabels }`.
- `PUT /notification-rules` `{ rules: { EVENT: { enabled?, inApp?, email?, params? } } }` → the new list. Unknown event or setting, or a threshold outside 0–3650: 400.
- `GET /notification-log?event&status&channel&recipientId&entityId&page&pageSize` → `{ items, total, page, pageSize }`. `status`: SENT, BLOCKED (held by the mail guard), FAILED, SKIPPED, DISABLED.
- `POST /notification-jobs/run[?include=vendorDocuments]` → what each timed check sent (deadline, overdue evaluation, escalation; closes expired events).
- Events: REQUISITION_SUBMITTED, APPROVAL_REQUIRED, REQUISITION_RETURNED, REQUISITION_REJECTED, RFQ_INVITATION, SOURCING_DEADLINE, EVALUATION_ASSIGNED, EVALUATION_OVERDUE, APPROVAL_ASSIGNED, PO_ISSUED, VENDOR_DOCUMENT_EXPIRING, INVOICE_EXCEPTION, INTEGRATION_FAILURE, TASK_ESCALATION. In-app type is `PROCUREMENT_<EVENT>` except the vendor-document and tax-clearance notices, which keep their earlier type names (`VENDOR_DOCUMENT_EXPIRING`, `_EXPIRED`, `VENDOR_TAX_CLEARANCE_EXPIRING`, `_EXPIRED`).

## §35 Dashboards
- `GET /dashboards/me` → `{ views: ["executive"|"procurement"|"mine"], defaultView, mine: { requisitions, requisitionsTotal, approvalsAwaitingMe, evaluationsAwaitingMe, myOpenOrders, returned, drafts } }` (any staff).
- `GET /dashboards/procurement?preset=month|quarter|year|12m|all | from&to&convertTo` → `{ period, generatedAt, tiles, charts }`. Every tile and chart datum carries `drill: { report, filters }`.
- `GET /dashboards/executive` → same shape with the executive tiles and charts.
- Money is `{ byCurrency, converted: { total, currency, rates[] }, unconverted, mixed, targetCurrency }`; never one summed figure.

## §37 Reports
- `GET /reports` → 15 definitions `{ key, name, description, filters[], columns[], hasMoney }`.
- `GET /reports/:key?from&to&department&supplier&category&currency&status&convertTo&page&pageSize` → `{ …definition, filters (applied), rows (this page), total, page, pageSize, summary, generatedAt }`.
- `GET /reports/:key/export?format=csv|xlsx|pdf&…same filters` → the file (exactly the filtered rows, all pages); audited.

## §38 Currency
- `GET /fx` → `{ settings: { reportingCurrency, source: TABLE|URL, sourceUrl, maxAgeDays }, currencies }`; `PUT /fx` (same fields; URL source needs a URL).
- `GET /fx/rates`, `POST /fx/rates { from, to, rate, date }` (rate > 0, two different currencies; stored with source MANUAL), `DELETE /fx/rates/:id` (deactivates), `GET /fx/convert?from&to&date`.
- Conversion order: same currency; stored rate within the maximum age; the inverse rate; a cross through the reporting currency; the URL service. None usable → not converted.
- An order with no currency (none stated, none inherited) and an invoice with no currency are refused with 400. Receipts store the order's currency.

## §39 Numbering
- `GET /numbering` → per type `{ key, label, format, defaultFormat, example }` for REQUISITION, RFQ, TENDER, QUOTATION, PURCHASE_ORDER, GRN, INVOICE; `PUT /numbering { formats: { KEY: "PO-{YYYY}-{#####}" } }`. One `{#…}` counter, `{YYYY}` `{MM}` `{DD}`, letters, digits, `- _ /`, 64 characters.

## §40 Statuses
- `GET /statuses` → per record type `{ labels, transitions, terminal }` (purchase orders also `confirmed` / `unconfirmed`). `GET /status-history?entityType&entityId`.
- `PUT /requisitions/:id/cancel { reason }`, `PUT /requisitions/:id/close`, `POST /rfqs/:id/{approve,publish,close}`, `POST /rfqs/:id/cancel { reason }`, `PUT /purchase-orders/:id/{cancel { reason },close}`.
- `POST /rfq { …, saveAsDraft: true }` creates a Draft that sends nothing until published.
- An illegal move by any route returns 409 with the reason; a Cancelled or Closed record cannot be changed at all.
