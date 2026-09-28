# Notifications, dashboards, search, reports, currency, numbering and statuses (SRD §34–§40)

Module: `/procurement`. Everything below is local; nothing was deployed.
Backend: `../nvccz` (Express + Prisma + MySQL). Frontend: this repo, `components/procurement-v23-mock` and `lib/procurement-v23`.

Test evidence (all run against the local stack, real browser for the UI):

| Suite | Result |
|---|---|
| `nvccz/scripts/_uat/notifications-reports-e2e.ts` (API, new) | 209/209 (incl. mixed-currency data, 7 numbering types under concurrency, illegal-transition blocks, notifications on/off with the log) |
| `nvccz-new/scripts/_uat/notifications-reports-ui.mjs` (browser, new) | 117/117 |
| Earlier API suites (planning 165, sourcing 210, p2p, documents-audit, vendor-master, user-master, vendor-portal) | planning 165, sourcing 210, p2p 181, documents-audit 123, vendor-master 78, vendor-portal 56, user-master 69: all pass |
| Earlier browser suites (p2p-ui, documents-audit-ui) | p2p-ui 82/82, documents-audit-ui 134/134, planning-requisitions-ui 79/80, vendor-master-ui 55/56 (see below) |

---

## 1. What was missing (gap check)

**§34 Notifications**
- Only a handful of events notified anyone, each through its own code and its own email; no rule could be switched off; nothing recorded what was sent, held or skipped.
- No notification at all for: sourcing deadline approaching, evaluation overdue, evaluation assignment, approval delegated, invoice exception (existed, own template), integration failure, escalation of a stalled approval. Vendor-document expiry existed with its own path.
- Requisition-return and rejection sent in-app rows written by hand; the RFQ invitation used a private email template.

**§35 Dashboards**
- The Command Centre was mostly fixture: "Approved plan $8.24M", "Committed spend $5.12M", "8 open tenders" and four static charts were typed into the runtime. No executive view, no role-specific view, no date filter, no drill-down, no currency handling. Someone with no procurement role could not open it at all.

**§36 Search / filters / sorting / paging / export**
- No requisition, tender, receipt, invoice or contract list had a working search box (the ones drawn were decorative and filtered nothing). No compound filters, no sorting, no export. Paging existed (task F) but not filter-aware.

**§37 Reports**
- The "Reports Vault" page was a static catalogue. None of the 15 reports existed as a report, none had filters, none exported. No XLSX anywhere.

**§38 Currency**
- Every amount on screen was formatted as USD. A ZiG order showed as `$`. Totals across records ignored currency. No exchange-rate mechanism. An order could be created with no currency and silently priced in the default. Goods-received notes carried no currency.

**§39 Numbering**
- Requisition, RFQ and PO numbers followed a partly configurable format; tender, receipt, invoice and quotation numbers did not. Allocation was not atomic for all types, so simultaneous creates could collide and the retry loops burned numbers.

**§40 Statuses**
- Statuses were free strings: any write could move a record anywhere, a Cancelled requisition could be edited or resubmitted, and there was no Cancel or Close action on requisitions, sourcing events or orders at all. Sourcing events were only ever Open or Awarded (Draft, Approved, Published, Closed, Under Evaluation, Awaiting Approval, Cancelled were never reached). The UI used its own status words ("Pending department head", "Sent to vendor").

## 2. What was built

### §34 One dispatcher, one template, configurable rules
- `ProcurementNotifier.notify(event, …)` is the only path. Fourteen events (submitted, approval required, returned, rejected, RFQ invitation, sourcing deadline, evaluation assigned, evaluation overdue, approval assigned, PO issued, vendor document expiring, invoice exception, integration failure, task escalation).
- Rules (`procurement_settings.notification_rules_json`): on/off, in-app, email, and thresholds for the timed ones. Off means nothing is sent and the decision is logged.
- Recipients are resolved per event (the approver of the current step, the requester, the committee member, vendor managers, procurement managers, finance managers…), active staff only, the person who caused the event left out unless it is their own receipt.
- One email body (facts table + button) inside the existing branded header/footer/signature; the same content is the in-app notification.
- `procurement_notification_log`: every decision per recipient and channel (SENT, BLOCKED by the mail guard, FAILED, SKIPPED, DISABLED). Locally the guard blocks all outbound mail (`MAIL_REDIRECT_ENFORCE`, no `MAIL_REDIRECT_TO`), so delivery is verified from that log with the recipient's address.
- Timed events run from a scheduler and on demand (`POST /procurement/notification-jobs/run`), once per record, thresholds from the rules.
- Wired at: requisition submit / approval step / return / reject, RFQ invitation, committee appointment, delegation, PO issue, invoice exception, ledger and cashbook posting failure, deadline, overdue evaluation, escalation, vendor document expiry.
- Configuration → Notifications tab: the rules table, save, "Run the timed checks now", the paged filterable log.

### §35 Dashboards (live, role-specific)
- `GET /procurement/dashboards/{me,procurement,executive}`; permissions `procurement.dashboard.view` and the new `procurement.dashboard.executive`.
- Procurement: open requisitions, pending approvals (requisitions + orders + invoices), RFQs in progress, tenders closing soon, evaluations pending, orders issued, vendor compliance exceptions, procurement spend per currency (+ converted), cycle time, savings/variance, overdue activities; charts: committed spend by month, requisitions and orders by status, sourcing pipeline.
- Executive: total value, volume, cycle time by stage, pending approvals (with value), exception transactions, vendor concentration; charts: spend by category / department / supplier, sourcing method split.
- "My work": own requisitions by status, approvals waiting on the person, evaluations to score, open orders. A member of staff with no procurement role now gets this instead of being refused.
- SVG charts with title, axis titles, value labels, legends and tooltips; every tile and bar drills into the report behind it with its filters set. Period presets and custom dates; "show totals in" any currency.

### §36 Lists
- Toolbar on requisitions, tenders, quotations, orders, receipts, invoices, vendors, contracts, plan lines and approvals: search across every field of the record (reference, supplier, requester, department, category, status, date, amount), status / department / category / supplier / requester / currency filters where the list has more than one value, date range, value range, clear, sortable headers, page size (10/25/50/100), export of exactly the filtered rows as CSV.
- Decorative search rows that filtered nothing were removed.

### §37 Reports
- 15 report definitions driving screen, CSV, XLSX (real workbook with a Totals sheet) and PDF from the same query; filters: date, department, supplier, category, currency, status where the report has them; paged; each export audited.
- Permissions `procurement.reports.view` and `.export`.

### §38 Currency
- Every order, invoice and receipt carries its own currency (`goods_received_notes.currency_id` added; legacy rows back-filled). An order with no currency (none stated, none inherited from requisition / quotation / vendor) is refused instead of defaulted.
- Money is never added across currencies: totals are per currency; a converted total uses the configurable exchange-rate service (rate table or URL, maximum rate age, cross-rate through the reporting currency) and always shows the rates used with date and source; an amount with no usable rate is listed as not converted.
- Configuration → Currency: reporting currency, rate source, maximum age, rate table (add, remove).
- Register rows show each record's own currency code.

### §39 Numbering
- One `NumberingService` and one atomic counter (`document_sequences`) for requisition, RFQ, tender, quotation, purchase order, receipt and invoice; formats `{YYYY}{MM}{DD}` + one `{####}` counter, validated, configurable per type (Configuration → Numbering, with live example); counter restarts when the date part changes; first use continues after the highest number already issued; a create that fails after its number was issued gives it back if it is still the latest.

### §40 Statuses
- One transition map per record type, enforced at the data layer (Prisma middleware) so an illegal move is refused whichever route, service or script asks; Cancelled and Closed are terminal; every accepted move is written to `procurement_status_history` with who and when.
- Requisition: Draft, Submitted, Under Review, Approved, Rejected, Returned, Converted to Sourcing, Cancelled, Closed. Sourcing event: Draft, Approved, Published, Open, Closed, Under Evaluation, Awaiting Approval, Awarded, Cancelled.
- New actions (API and UI): cancel / close requisition, save event as draft, approve, publish (sends invitations, moves Published → Open), close, cancel event, cancel / close order. Automatic moves: Open → Closed at the closing time, → Under Evaluation when bids are opened or scoring starts, → Awaiting Approval when the recommendation is submitted, → Awarded when it is approved, back to Under Evaluation when it is rejected.
- The UI offers a status action only where the map allows it from the current status and the role may take it; irreversible ones ask for confirmation and a reason.

## 3. Other fixes found on the way
- `VendorComplianceJobService` had its own notification code; it now goes through the dispatcher and honours the rule (off = notices left unmarked, so switching on sends what is still due).
- The Board Chairman / Board Member roles briefly received the whole read-only procurement grant from a first draft of the role table; corrected in code and revoked in the dev database (they hold dashboard, reports and executive dashboard only).
- Sealed bids: an event that is merely Closed is no longer treated as "decided" (that would have released sealed submissions without a formal opening).
- Audit trail report and audit list ran the database out of sort memory on wide rows; both now sort ids first.
- Invoice-exception dedupe made one query per person (about 1,000 on the dev data); now one query. Mass mailings (over 25 addresses) are sent in the background so the invoice, order or approval never waits on them.
- `extendRfqClosing` now works on a Draft or Approved event (nothing has been sent yet).
- Decision-log wording, PO/requisition/tender status words in the UI now come from one vocabulary (`lib/procurement-v23/status-vocabulary.ts`), compared with `/procurement/statuses`.
- p2p API suite: direct order creation now states its currency (no longer defaulted).

## 4. Interpretation decisions
- **Statuses beyond the SRD's text.** "Submitted" and "Under Review" are reached in one step (a submitted requisition is routed at once), so a requisition on its route reads Under Review and its route names who it waits on. A published event opens immediately (Published then Open, both recorded).
- **Draft is not "open".** Open Requisitions counts Submitted, Under Review, Returned and Approved-awaiting-sourcing; drafts are not counted.
- **Currency defaults.** A requisition still takes the organisation's default currency when its form does not choose one, because the requester needs a working form; the currency is then stored on the record and never re-derived. Orders, invoices and receipts inherit from what they came from and are otherwise refused.
- **Reporting currency** is a setting; when unset it is the default currency.
- **List export** is CSV of exactly the rows the filters leave; the 15 reports export PDF / CSV / XLSX.
- **Email in local runs is held by the mail guard by design**; delivery is shown in the notification log with the address it would have gone to.
- **Notification "actor" rule.** A person is not notified of their own action, except the requester's receipt for a submission.
- **Cycle-time figures** are shown in days, hours or minutes as they fall (dev flows approve in seconds).

## 5. Purchase order statuses that still need confirmation
The SRD's list is cut off after "Draft, Pending Approval, Approved, Issued …". Those four are implemented as named (stored DRAFT, PENDING, APPROVED, SENT). The statuses the system already used after them are kept as they were and are **not confirmed** against the SRD: Rejected, Acknowledged, Partially delivered, Delivered, Billed, Cancelled, Closed. Please confirm (or send the rest of the list) before these are treated as final.

## 6. Migration log (local database, in the order run)
1. `npm run db:migrate:procurement-config` (nvccz) — `procurement_settings`: tender / grn / invoice / quotation number formats, reporting currency, rate source, source URL, maximum rate age; `exchange_rates.source`; `goods_received_notes.currency_id`; back-fill of missing currency on requisitions, orders, invoices and receipts; new tables `procurement_status_history`, `procurement_notification_log`. Idempotent.
2. `npx prisma generate` (nvccz). No `migrate` / `db push` was run.
3. `npm run db:migrate:procurement-permissions` (nvccz) — adds `procurement.reports.view`, `procurement.reports.export`, `procurement.dashboard.executive` to the role grants (49 grants over 10 roles). Only adds.
4. One-off dev clean-up: the twelve extra grants a first draft gave the Board roles were removed by hand (not part of the script).
5. Earlier in this work stream, unchanged: `db:migrate:document-audit`.
6. To repeat on every other environment at deploy time (nothing was run there): steps 1–3 in that order, then restart the API. The back-fill in step 1 should be run again after the last deploy because test data created since carries no currency.

## 7. How to run
```
# API (from ../nvccz)
npx ts-node --transpile-only -r dotenv/config scripts/_uat/notifications-reports-e2e.ts
# browser (from this repo; UAT_HIDE=1 parks the window off-screen)
node scripts/_uat/notifications-reports-ui.mjs
```

## 8. Not verified / open
- `planning-requisitions-ui` "plan line persisted" and `vendor-master-ui` "bank account shown masked" failed in the last run. Their API suites (planning 165/165, vendor-master 78/78) cover the same persistence and pass; both UI checks use a fixed 1.5–2.5 s wait against a slow dev database, so I believe they are timing, but I did not prove that.
- `sourcing-evaluation-ui` needs the vendor portal on port 3140, which was not running; not run.
- Email was never delivered anywhere (mail guard); XLSX was opened with SheetJS, not Excel; PDF layout was not reviewed by eye.
- Numbering concurrency is proven for every type at the allocator and end to end for requisitions, RFQs and purchase orders; receipts, invoices and quotations are covered at the allocator only.
