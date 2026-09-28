# Accounting (V52) — current-state inventory

*Snapshot taken 2026-09-27. Read-only: no code or data was changed in either repo.*

- **Frontend:** `nvccz-new`, branch `feature/investee-portal-v8-live`, with an uncommitted working tree. The runtime, `actions.ts`, `live-loaders.ts` and the patch script all have local modifications, and this document describes the working tree as it stands.
- **Backend:** `../nvccz`.
- **Related docs:**
  - `design-refs/accounting-final-sweep-findings.md`
  - `design-refs/accounting-v52-record-flows-backend-asks.md`
  - `design-refs/accounting-v52-ui-handoff.md`
  - `design-refs/dev-uat-esign-perf-accounting-fixes.md`
  - `design-refs/accounting-sweep/SRD_REQUIREMENTS.md`, which is a sibling doc in this folder.

**How this was gathered**
- **Frontend actions:** I read the host, loaders, actions, adapters and patch script. I also ran a scripted click-through of every page of the vendored runtime in a standalone local harness, which served a copy of the runtime and recorded dispatched events, navigations, toasts and DOM effects. No backend was involved.
- **Backend:** each accounting router file was read in full, along with its middleware and enough of each controller and service to describe the handler. Permission holders came from the seed and migration scripts. Scheduled jobs came from `src/app.ts` `startServer()`, the services, the scripts and the deploy configs.

## Summary

| Measure | Value |
|---|---|
| Accounting pages (Next routes under `/accounting`) | **27** primary pages. 24 are in the runtime sidebar; `audit`, `access` and `integrations` are URL-only. There are also about 30 runtime sub-views (drill-downs, close workspace and CEO drill-downs). |
| Pages with a live data scope | 26 of 27. `integrations` has none. |
| Live write actions | **19 action ids**, from about 33 UI entry points. All go through `LIVE_ACTIONS` in `accounting-v52-app.tsx` to `lib/accounting-v52/actions.ts`. |
| Mock actions | **119**, counted per page. 4 of these are honest "not available" toasts. |
| Dead actions | **16**. FX Revaluation has 3, Group Consolidation 3, Access Control 3, and the Fixed Asset lifecycle actions 7. |
| Backend accounting route definitions | **420** in mounted routers: 178 on journals/COA/fiscal/FX/cashbook/recon/docs and 242 on sub-ledgers/statements/tax/budgets/approvals. Another 39 related routes are cross-referenced, and 54 route definitions sit in 5 router files that are never mounted. |
| Routes guarded only by `authenticate` | **304 of 420**: 156 plus 148. `authenticate` does not reject LP, investee or applicant tokens. |
| Routes with no JWT check | 2. `POST /api/cron/exchange-rate-display/snapshot-refresh` has no auth at all. `POST /api/accounting/assets/depreciation/cron/monthly` uses a shared secret, or loopback only if the secret is unset. |
| Scheduled jobs started in `app.ts` | 6 timers, none of them an accounting-ledger job except the performance GL retry. Details are in §5. |
| Short-term investments backend | **Yes.** It is a real, DB-backed module: 16 routes under `/api/accounting/short-term-investments`, 5 Prisma models, and GL postings for placement, accrual, liquidation and FX. All of its routes are AUTH-ONLY. V52 reads only `GET /dashboard`; every STI button in the UI is mock. |

**Top findings to triage.** Each is covered in detail in its section.
1. **"Run auto-match" on Bank Reconciliation signs off the reconciliation.** It dispatches `recon-signoff`, which marks every unreconciled cashbook line reconciled against the balance the UI shows (§2).
2. **Several buttons report success without calling the backend.** Their backends exist, but they are not wired: depreciation, FX revaluation, rate maintenance, all STI actions, period lock (both Close and Settings), recurring schedule create and pause, CoA import, and credit notes (§2, §5).
3. **Anyone logged in can lock or unlock GL periods, void posted journals, or post straight to the ledger** (§3):
   - `POST /api/cashbook/periods/lock` locks or unlocks GL/BANK periods for any authenticated user. It bypasses `accounting.period_lock.manage`.
   - `PATCH /journal-entries/:id/void` lets any authenticated user void a posted JE.
   - Many AUTH-ONLY routes create POSTED journals directly, bypassing maker-checker: recurring run, cashbook receipts/payments/batches/transfers/reversals, multi-currency payments, FX posting and revalue, and bill submit.
4. **No scheduler runs any accounting job** (§5).
   - Depreciation has only a cron HTTP endpoint that nothing calls.
   - STI interest accrual runs on every staff login.
   - Recurring journals, FX revaluation and period close are manual only.
   - There are no dunning reminders and no bank feeds.
5. **Six bank-reconciliation routes read the wrong path parameter, and `/api/approval-workflows` throws at runtime** (§3, §6). The approval-workflows service calls a Prisma model that does not exist.

---

## 1. Pages

### 1.1 How the module is served

- **Current module:** `accounting-v52` in `lib/config/modules.ts` (line ~391), served at **`/accounting`**. Superseded ids in `SUPERSEDED_MODULE_IDS`: `accounting` (legacy, frozen at `/accounting-legacy`) and `accounting-v2` (`/accounting-v2`). Both old route trees still exist under `app/accounting-legacy/**` and `app/accounting-v2/**`; do not edit them.
- **Next routes:** `app/accounting/layout.tsx` mounts `AccountingV52Layout` (`components/layout/accounting-v52-layout.tsx`) → `ClientDesignModuleShell` → `AccountingV52App` (`components/accounting-v52-mock/accounting-v52-app.tsx`). Every `app/accounting/**/page.tsx` is a placeholder `<span>`; the page body is rendered by the vendored runtime `components/accounting-v52-mock/matanho-accounting-runtime.js` (5,561 lines, ~2.3 MB, about 50 stacked "version layers" v1…v51, each with its own renderers and click dispatcher, "last assignment to `pages.<id>` wins").
- **Page id ↔ URL:** `lib/accounting-v52-mock/nav.ts` (`AC52_PAGE_TO_PATH`). The host pushes the Next route when the runtime navigates; runtime ids with no path (sub-views) re-render in place under the parent URL.
- **Sidebar:** the runtime renders its own sidebar (`navGroups` in the runtime), not the Arcus shared sidebar. Groups/labels below were read from the rendered DOM. The runtime removes `audit`, `access` and `integrations` from the Governance group (v17 layer, `enhance17`), so those three pages are reachable only by URL or in-page links. Sidebar badges are computed from live state (`navCount`), per `accounting-final-sweep-findings.md` §6.
- **Page gating:** the runtime has its own client-side role simulator (`#roleSelect`, `permittedPage()`/`can()`, persisted in `localStorage` `matanho-accounting-role`). Real enforcement is Next `middleware.ts` (route→module map lines 82-105, longest-prefix match; `/accounting/ceo`, `/timesheets`, `/recurring`, `/trial-balance` have no entry and fall back to `/accounting` = `ac52-overview`) and the backend.
- **Runtime patching:** all live wiring inside the runtime must go through `scripts/patch-accounting-v52-runtime.mjs` (19 anchored steps; injects `scripts/accounting-v52-payables-live.inc.js` between `/* BEGIN_AC52_PAYABLES_LIVE */` markers). `window.__AC52_LIVE__ = true` is set by the host so patched pages render hydrated records instead of fixtures.

### 1.2 Primary pages (27 Next routes)

| # | Runtime page id | URL | Runtime sidebar group → label | Final renderer layer | In `modules.ts` subModules? |
|---|---|---|---|---|---|
| 1 | `overview` | `/accounting` | Control centre → Command Centre | v8 `overviewPage8` | yes (`ac52-overview`) |
| 2 | `ceo` | `/accounting/ceo` | Control centre → CEO View | v15 `ceoPage` | **no** |
| 3 | `approvals` | `/accounting/approvals` | Control centre → Approval Queue | v8 `approvalsPage8` | yes |
| 4 | `close` | `/accounting/close` | Control centre → Period Close | v11 close control centre (+v12 slice/sort) | yes |
| 5 | `ledger` | `/accounting/general-ledger` | Daily accounting → General Ledger | v12 `ledgerPage12` (+v26 adjustment) | yes |
| 6 | `journals` | `/accounting/journals` | Daily accounting → Journal Entries | v8 `journalPage8` | yes |
| 7 | `cash` | `/accounting/cash-book` | Daily accounting → Cash & Liquidity | v12 `cashPage12` (buttons patched to open v8 cash modal) | yes |
| 8 | `reconciliation` | `/accounting/bank-reconciliation` | Daily accounting → Bank Reconciliation | v28 recon workbench | yes |
| 9 | `payables` | `/accounting/payables` | Daily accounting → Payables & Payments | v28 + live include `ac52LiveApPage()` | yes |
| 10 | `receivables` | `/accounting/receivables` | Daily accounting → Receivables | v28 (buttons patched to v8 invoice/receipt modals) | yes |
| 11 | `expenses` | `/accounting/expenses` | Daily accounting → Expenses & Claims | v34 | yes |
| 12 | `timesheets` | `/accounting/timesheets` | Daily accounting → Timesheets & Projects | v34 (`timesheets48`) | **no** |
| 13 | `recurring` | `/accounting/recurring` | Daily accounting → Recurring Schedules | v27 scheduler | **no** |
| 14 | `inventory` | `/accounting/inventory` | Registers & valuation → Inventory Accounting | v51 `invPage` | yes |
| 15 | `assets` | `/accounting/assets` | Registers & valuation → Fixed Assets | v51 `assetPage` | yes |
| 16 | `investments` | `/accounting/short-term-investments` | Registers & valuation → Short-Term Investments | v17 `investments17` (+v26 update/flow) | yes |
| 17 | `reports` | `/accounting/reports` | Reporting & compliance → Financial Reports | v17 report builder (+v20 signatures, v23 multi-currency/consolidated) | yes |
| 18 | `trialbalance` | `/accounting/trial-balance` | Reporting & compliance → Trial Balance | v15/v12 `trialBalancePage12` | **no** |
| 19 | `compliance` | `/accounting/tax` | Reporting & compliance → Compliance & Tax | v17 `compliance17` | yes |
| 20 | `fx` | `/accounting/fx-revaluation` | Reporting & compliance → FX Revaluation | v23 `fxPage23` | yes |
| 21 | `consolidation` | `/accounting/consolidation` | Reporting & compliance → Group Consolidation | v23 `consolidationPage23` | yes |
| 22 | `coa` | `/accounting/chart-governance` | Reporting & compliance → Chart of Accounts | v8 CoA governance | yes |
| 23 | `vault` | `/accounting/vault` | Governance → Document Vault | base layer vault | yes |
| 24 | `audit` | `/accounting/audit` | *(hidden from runtime sidebar)* | base layer audit trail | yes |
| 25 | `access` | `/accounting/access` | *(hidden from runtime sidebar)* | v12 `accessPage12` | yes |
| 26 | `integrations` | `/accounting/integrations` | *(hidden from runtime sidebar)* | base layer connectors | yes |
| 27 | `settings` | `/accounting/settings` | Governance → Settings | v17 settings (+v26 change requests) | yes |

### 1.3 Tabs per page (rendered in place, no route change)

| Page | Tabs (runtime action) |
|---|---|
| close | v11 sub-views instead of tabs: calendar, analytics, exceptions/exception, evidence, sign-offs, lock, workstream (`v11ws`), task (`v11task`) |
| reconciliation | Comparison workbench · Exceptions · Internal modules · Matching rules · Sign-off (`v28=tab key=recon`); bank selector buttons (`recon-bank`) |
| payables (live) | Overview (`command`) · Supplier bills · Payment queue · Purchase orders · Quotations & sourcing · Vendors · Ageing (`v28=tab key=ap`); bill filters `aplive-filter=vendor/status/source` |
| receivables | Command · Invoices (`billing`) · Quotations · Customers · Ageing & ECL · Collections (`v28=tab key=ar`) |
| expenses | Command · Claims · Corporate cards · Recurring · Policy studio (`v34=tab key=exp`) |
| timesheets | Command · Timesheets · Projects · Profitability · Billing readiness (`v34=tab key=time`) |
| recurring | Schedules · Run queue · Calendar · Exceptions · Controls (`v27=schedule-view`) |
| inventory | Overview · Movement ledger · Usage & projects · Replenishment · Physical counts · Valuation & GL (`v51=inv-tab`) |
| assets | Overview · Asset register · Depreciation · Additions & CIP · Custody & verification · Impairment & valuation · Disposals (`v51=asset-tab`) |
| investments | Instrument drill (`v17=investment`) tabs: Overview · Daily accruals · Rate history · Journals · Settlement (`instrument-tab`) |
| reports | Report selector (`report-select`: Income Statement, Balance Sheet, Cash Flow, etc.), view `actual` / `comparison` (`report-view`) |
| access | Named users · Role permissions · Access requests · SoD policies (`v12=access-tab`) |
| settings | General & banks · Periods & lock · Letterheads · Security & RBAC · Audit trail · Integrations (`v17=settings-tab`); v26 config-domain table |

All tabs checked in the harness switch content in place; none navigates to another route (the CLAUDE.md "tab navigates away" bug pattern was not observed here).

### 1.4 Runtime sub-views and drawers that matter

`pages` keys that have no Next route (rendered under the parent URL): `journaldetail` (journal drill from Ledger/Cash), `accountdetail`, `v8accountdetail` (CoA account drill), `v8recurringdetail`, `v8investmentanalytics`, `investmentanalytics`, `v8paymentrun`, `v12complianceworkpaper` (tax pack workpaper), `v28detail` (AR invoice / AP bill / PO / RFQ / customer / recon-line detail; live AP detail via `ac52LiveApDetail`), CEO drill-downs `ceoliquidity`, `ceoperformance`, `ceoworkingcapital`, `ceorisk`, `ceoapprovals`, `ceoentity`, close sub-views `v11ws`, `v11task`, `v11exceptions`, `v11exception`, `v11analytics`, `v11evidence`, `v11signoffs`, `v11lock`, `v11calendar`. Also registered but removed from the sidebar: `vendors`, `quotations`, `billing`.

Overlays: v8 modal/drawer (journal detail, approval detail, invoice/receipt/cash modals, CoA account modal), v10 focus/deep/drawer layers, v28 `#v28Overlay`, v34 `#v34Overlay`, v51 `#v51Layer`, v27 overlay, v17 modal/`confirm17`, v23 document drawer (`doc-edit/doc-email/doc-sign`), v12 document viewer (zoom, letterhead, email, sign). The host's `MutationObserver` moves any body-level `v\d+…` layer into `.accounting-v52-root` so it is styled.

Shared chrome in the runtime topbar: command palette (`open-command`), entity/period selects (client-only), simulated-role select, theme toggle, notifications, and a USD/ZWG rate pill fed by `refreshOfficialRateV5()` which scrapes `https://www.rbz.co.zw/` from the browser (via a public CORS proxy).

---

## 2. Per-page data sources and actions

### 2.0 Method and legend

**Data:** each page's live scopes come from `scopesForAc52Page()` in `lib/accounting-v52/live-loaders.ts`; `loadAc52Scopes()` fetches them with a `settle()` wrapper (per-call errors collected into `meta.errors`), `adapters.ts` maps them, and `runtime.hydrate()` pushes them into the runtime (`ac52HydrateFromBackend` → `rootEl.__ac52Hydrate*` hooks and `window.__ac52*` globals). Scope → endpoints:

| Scope | Endpoints (via `lib/api/*`) | Adapter |
|---|---|---|
| `coa` | `GET /accounting/chart-of-accounts` | `adaptAc52Accounts` |
| `journals` | `GET /accounting/journal-entries` (default POSTED+PENDING) | `adaptAc52Journals` |
| `approvals` | journal list above (PENDING journals) + `GET /approvals/my-pending` | `adaptAc52Approvals`, `adaptAc52NonJournalApprovals` |
| `cash` | `GET /cashbook/banks` | `adaptAc52Banks` |
| `reconciliation` | `GET /accounting/bank-reconciliation`, then `GET /accounting/bank-reconciliation/:id/unmatched` for the latest; `reconBanks` ledger balance derived client-side from POSTED journal lines on each bank's GL | `adaptAc52ReconciliationStatement` |
| `payables` | `GET /accounting/purchase-invoices?limit=200`, `GET /accounting/vendors?limit=200`, `GET /cashbook/banks`, procurement `GET /procurement/purchase-orders`, `/procurement/rfq`, `/vendor-quotations`, `/procurement/invoices` (403 tolerated) | `adaptAc52ApBills`, `adaptAc52ProcurementBills`, `adaptAc52ApVendors`, `adaptAc52ApPOs`, `adaptAc52ApRfqs` |
| `receivables` | `GET /accounting/invoices?limit=200`, `GET /accounting/customers?limit=200` | `adaptAc52ArInvoices`, `adaptAc52ArCustomers` |
| `expenses` | `GET /accounting/expenses`, `GET /users`, `GET /accounting/vendors?status=…` (procurement-v23 `listVendors`), `GET /accounting/expense-categories?isActive=true` | `adaptAc52Claims` + `expenseLookups` |
| `inventory` | `GET /accounting/inventory/items?limit=200` | `adaptAc52InventoryItems` |
| `assets` | `GET /accounting/assets?limit=200` | `adaptAc52FixedAssets` |
| `investments` | `GET /accounting/short-term-investments/dashboard` | `adaptAc52Investments` |
| `fx` | `GET /accounting/multi-currency/reports/unrealized-fx` | `adaptAc52FxExposure` |
| `recurring` | `GET /accounting/recurring-journal-templates` | `adaptAc52RecurringSchedules` |
| `vault` | `GET /accounting/documents`, `GET /users` | `adaptAc52VaultDocuments` |
| `compliance` | `GET /tax-return-packs`, `GET /users` | `adaptAc52TaxPacks` |
| `consolidation` | `GET /accounting/consolidation/summary` | passed through |
| `close` | `GET /accounting/fiscal-calendar`, then `GET /accounting/close-tasks/periods/:currentOpenPeriodId/tasks` | `adaptAc52CloseTasks`, `adaptAc52CloseTasksV11`, `fiscalPeriods` (8 most recent) |
| `timesheets` | `GET /accounting/timesheets/pending-approval`, `GET /accounting/projects` | `adaptAc52Timesheets`, `adaptAc52Projects` |
| `audit` | `GET /audit-logs?page=1&limit=100`, `GET /users` | `adaptAc52AuditEvents` |
| `access` | `GET /users`, `GET /roles` | `adaptAc52AccessData` |
| `statements` | `GET /accounting/chart-of-accounts` + `GET /accounting/journal-entries?limit=1000` → computed client-side by `computeAc52FinancialStatements` (`lib/accounting-v52/financial-statements.ts`); backend statement endpoints are **not** used | — |
| `ceo` | derived, no fetch: cash from POSTED journal lines on bank GLs; revenue/net income/entities from the consolidation summary; `risk`/`close`/`ar`/`ap` per entity hard-set to 0/null | — |

**Actions:** the runtime dispatches `window` event `matanho:before-action`. The host (`accounting-v52-app.tsx` `onBeforeAction`) only intercepts ids in its **`LIVE_ACTIONS` set (19 ids)**, calls `preventDefault()` (so the runtime does not also mutate its mock state), serialises through `busyRef`, calls `handleAccountingV52Action()` in `lib/accounting-v52/actions.ts`, toasts via `sonner`, then invalidates and re-fetches the scopes in `ACTION_SCOPE`. Inside the runtime, v8 confirm-modal actions reach the event only if the key is in `AC52_LIVE_ACTION_KEYS` (`coa-save, invoice-create, cash-post, receipt-post, expense-create, stock-adjust, asset-create, recurring-run, recurring-run-due, recon-signoff`); the other live ids are dispatched directly by patched layer code.

Status legend:
- **LIVE**: reaches the backend through `LIVE_ACTIONS` → `actions.ts` (handler named), or is a real cross-module navigation.
- **MOCK**: changes only runtime state (`S`, `V12`, `V17`, `ST27`…, persisted in `localStorage`), shows a success toast, downloads a client-generated file, or shows an honest "not available" toast (marked *blocked*).
- **DEAD**: button renders but has no handler, or its only effect is closing a modal / re-rendering with no visible change.
- **NAV**: in-module navigation / drill-down only (not counted as an action).

Classification was verified two ways: (1) reading the dispatch sites in the runtime and the patch script; (2) a scripted click-through of every visible control on every page (3 levels deep: page → modal/drawer/tab → confirm) in a standalone harness of the runtime with `__AC52_LIVE__=true`, recording `matanho:before-action` events, route changes, toasts, downloads, `window.open`/`location.assign` and DOM changes. The harness has no backend data, so rows that only exist when hydrated (live AP bills, timesheet rows, real close tasks, real approvals) were confirmed from code instead.

### 2.1 LIVE actions (the complete list — 19 action ids)

| # | Action id | UI entry point(s) | `actions.ts` handler | Backend calls | Scopes refreshed |
|---|---|---|---|---|---|
| 1 | `coa-save` | CoA → Add account / Edit → "Review account change" → confirm | `handleCoaSave` | `POST /accounting/chart-of-accounts` or `PUT /accounting/chart-of-accounts/:id` (backendId resolved from host `accountsCacheRef`) | coa |
| 2 | `upload-document` | Vault → Upload document (hidden `#vaultFile` input `change`) | `handleUploadDocument` | `POST /accounting/documents` (multipart) | vault |
| 3 | `close-task-complete` | Period Close → task → "Complete close task" → confirm (`v11 task-do`, only when the task id is a real hydrated task); base-layer drawer `mark-close-complete` / `complete-close-task` when the task has `backendId` | `handleCloseTaskComplete` | `PATCH /accounting/close-tasks/tasks/:taskId {status:'COMPLETE'}` | close |
| 4 | `timesheet-approve` | Timesheets → row Approve → confirm (`v34 timesheet-approve-confirm`) | `handleTimesheetApprove` | `POST /accounting/timesheets/:id/approve` | timesheets |
| 5 | `timesheet-return` | Timesheets → row Return → confirm (`timesheet-return-confirm`) | `handleTimesheetReturn` | `POST /accounting/timesheets/:id/return` | timesheets |
| 6 | `create-tax-pack` | Compliance & Tax → New compliance pack → "Create & compile" (`v17 compliance-new-confirm`) | `handleCreateTaxPack` | `GET /forecast-entities`, `POST /tax-return-packs`, `POST /tax-return-packs/:id/compile` | compliance |
| 7 | `approval-decision` | Approval Queue → row → "Approve & post" / "Reject / return" → confirm (v8 `approval-approve`/`approval-reject`, only for rows with `backendKind`) | `handleApprovalDecision` | journal rows: `PATCH /accounting/journal-entries/:id/post` or `/void`; other rows: `POST /approvals/:id/approve` or `/reject` | journals, approvals, cash, reconciliation, statements, coa, payables, investments |
| 8 | `journal-submit` | Journal Entries → "Review & submit" → confirm | `handleJournalSubmit` | `GET /accounting/chart-of-accounts`, `GET /accounting/currencies`, `POST /accounting/journal-entries` (creates PENDING) | journal-dependent scopes |
| 9 | `ap-pay-bill` | Payables (live) → Payment queue "Pay" / bill menu "Pay bill" / bill detail "Pay bill" (`aplive-pay`) → "Pay" (`aplive-pay-confirm`) | `handleApPayBill` | procurement bill: `POST /procurement/invoices/:id/payment` (multipart, proof of payment required); accounting bill: `POST /accounting/purchase-invoices/:id/pay` (may return `pending_approval` → CFO) | payables + journal-dependent |
| 10 | `invoice-create` | Receivables → New invoice (v8 modal) → "Review & create" → confirm | `handleInvoiceCreate` | `GET /accounting/currencies`, `POST /accounting/invoices`, then `PATCH /accounting/invoices/:id/send` | receivables + journal-dependent |
| 11 | `customer-create` | Receivables → More actions → Create customer → Save (`ac52-customer-create`) | `handleCustomerCreate` | `POST /accounting/customers` | receivables |
| 12 | `cash-post` | Cash & Liquidity → New receipt / New payment / New transfer; Command Centre → New receipt (v8 cash modal "Review & post" → confirm) | `handleCashPost` | `POST /cashbook/receipts`, `POST /cashbook/payments` (both after `GET /accounting/chart-of-accounts`), or `POST /cashbook/transfers` | cash + journal-dependent |
| 13 | `receipt-post` | Receivables → Record receipt (More actions or invoice menu) → v8 receipt modal "Review & allocate" → confirm | `handleReceiptPost` | `GET /accounting/invoices/:id`, `POST /cashbook/receipts`, `GET /cashbook/open-items/customers/:id`, `POST /cashbook/open-items/match/:entryId`; fallback `PATCH /accounting/invoices/:id/send` + `PATCH …/mark-as-paid` | receivables, cash + journal-dependent |
| 14 | `expense-create` | Expenses → New expense claim (patched live form) → "Save expense" (`ac52-expense-create`) | `handleExpenseCreate` | `GET /accounting/currencies`, `POST /accounting/expenses` | expenses + journal-dependent |
| 15 | `stock-adjust` | Inventory → Receive stock / Issue stock / Adjust / Cycle count / Transfer (and item drawer Issue/Receive/Count) → "Save movement" (`v51 save-inv`) | `handleStockAdjust` | `POST /accounting/inventory/movements` (receipt/issue) or `POST /accounting/inventory/adjustments` (adjust/count); **transfer returns an error** ("not available on the live inventory API") | inventory + journal-dependent |
| 16 | `asset-create` | Fixed Assets → Add fixed asset → "Create asset" (`v51 save-asset`) | `handleAssetCreate` | `GET /accounting/chart-of-accounts`, `POST /accounting/assets` | assets + journal-dependent |
| 17 | `recurring-run` | Recurring → Run queue → Review → "Generate occurrence" (`v27 schedule-run-confirm`) | `handleRecurringRun` | `POST /accounting/recurring-journal-templates/:id/run` | recurring + journal-dependent |
| 18 | `recurring-run-due` | Recurring → Run queue → Process due → "Validate & generate" (`run-due-confirm`) | `handleRecurringRunDue` | `POST /accounting/recurring-journal-templates/run-due` | recurring + journal-dependent |
| 19 | `recon-signoff` | Bank Reconciliation → **"Run auto-match"** (`v28 recon-auto`) **and** Sign-off tab → "Submit for sign-off" (`recon-submit`) | `handleReconSignoff` | `GET /cashbook/reconciliation/banks/:bankId/entries`, `POST /cashbook/reconciliation/banks/:bankId/sessions` (selects **every** unreconciled entry), `POST /cashbook/reconciliation/sessions/:id/finish`; on failure `POST …/discard` | reconciliation, cash + journal-dependent |

Other live-backed controls that are not writes: Payables `aplive-go` buttons ("Capture a supplier invoice", "Purchase orders in procurement", "Open in procurement" on POs/RFQs/bills) navigate to `/procurement/intake`, `/procurement/purchase-orders`, `/procurement/evaluation`, `/procurement/invoices`, `/procurement/vendors` **in the same tab** via `window.location.assign` (contrary to the CLAUDE.md cross-module new-tab rule).

No runtime event outside the 19 ids was observed in the harness (no "not-allowlisted" dispatch).

### 2.2 Page by page

For each page: **Data** (source) then **Actions**. NAV items are listed only where they matter.

#### 1. Command Centre — `overview`
- **Data:** scopes `journals, cash, payables, receivables, approvals`. KPI cards (cash, AR, AP, revenue/investment income, pending approvals, control exceptions) and recent-journals table derive from hydrated `S.*`. The 12-month revenue bar chart (`v8-overview-month`) and the "Control exceptions" / "Investment accrual batch" work items are fixture-driven when no live equivalent exists. Hero (`spotlight`) figures are hardcoded (see §8).
- **Actions:** New receipt (`v8-open-cash`) → v8 cash modal → **LIVE `cash-post`**; Save draft (`v8-save-cash-draft`) **MOCK**; journal row drawer → Request reversal (`v8-request-reversal` → `reversal-request`) **MOCK**; month bars **MOCK** (UI filter). NAV: New journal, Preview financials, Open management report, General ledger, Open approval centre, Open close centre, KPI cards.

#### 2. CEO View — `ceo` (+ `ceoliquidity`, `ceoperformance`, `ceoworkingcapital`, `ceorisk`, `ceoapprovals`, `ceoentity`)
- **Data:** scopes `journals, cash, payables, receivables, approvals, consolidation, close, ceo`; `window.__ac52CeoSummary`. Panels with no backing model show "—" (risk register, maturity forecasts, coverage ratios, budget variance). Harness without data shows the `ceoEntities` fixture ($6.84m etc.), which a hydrated session replaces.
- **Actions (all v15):** Board pack (`board-pack`) → Email secure link (`email`) **MOCK** toast, Sign board pack (`sign`) **MOCK** toast; Executive filters → Apply (`apply-filters`) **MOCK**; Refresh executive data (`refresh`) **MOCK** toast (claims recalculation; does not refetch); approval card → **"Approve decision" (`approve`) MOCK** — toast only, does not call `/approvals` or post a journal; risk card → Record response → Save (`save-risk`) **MOCK**; column sorts (`v15-sort`) UI. NAV: `route` to the six drill-downs, entity row → `ceoentity`.

#### 3. Approval Queue — `approvals`
- **Data:** scope `approvals` = PENDING journals + `GET /approvals/my-pending` (Master data / Payment / Investment approvals).
- **Actions:** row → drawer → Approve & post (`v8-approve-approval` → confirm) → **LIVE `approval-decision`** when the row has `backendKind`, otherwise MOCK `approveApproval8`; Reject / return → Review rejection → confirm → **LIVE `approval-decision`** (decision reject) / MOCK for fixture rows; Refresh policy (`v8-refresh-approvals`) **MOCK** toast. NAV: Policy simulator → `access`.

#### 4. Period Close — `close` (v11 close control centre)
- **Data:** scope `close` = fiscal calendar + close tasks of the current OPEN period (`window.__ac52CloseTasksV11`). Workstreams, exceptions, evidence documents, sign-off chain, readiness %, forecast finish ("01 Aug 17:20"), "July 2026" labels and the lock gates are v11 fixtures (`C.*` in localStorage); only tasks that match a real id are live.
- **Actions:** task → Complete close task (`task-review` → `task-do`) → **LIVE `close-task-complete`** for real tasks (local status change for fixture tasks); Reopen task **MOCK** (no backend call to reopen); Save task metadata (`task-save`), comment, checklist tick (`check`), Attach evidence (`attach`/`attach-do`) **MOCK**; Run control scan (`scan`/`scan-do`) **MOCK**; Submit close (`submit`/`submit-do`) **MOCK**; CFO brief (`brief`) **MOCK** (static text); Explain priority (`why`) **MOCK**; Add task (`add-task`/`add-task-do`) **MOCK** (does not call `POST /close-tasks/periods/:id/tasks`); exception Resolve/Reopen (`resolve-do`), Escalate (`escalate`), Create correction journal (`correction-do`, toast claims a draft was routed — nothing posted) **MOCK**; bulk complete (`bulk-do`) **MOCK**; sign-offs Approve scope (`sign-do`), Send reminder (`remind`, `remind-sign`), certificate, download, exports, audit index **MOCK**; **Request period lock (`lock-review` → `lock-do`) MOCK** — sets `C.locked=true` locally, does not call `/accounting/fiscal-calendar/locks/*`. NAV: calendar, analytics, exceptions, evidence, signoffs, lock, workstream, task; `v12=close-slice` top/bottom 10 and column sorts UI.

#### 5. General Ledger — `ledger` (v12)
- **Data:** scopes `journals, coa`; ledger lines and balances derived client-side from `S.journals` (`ledgerLines12`, `tb12`). No backend GL-detail endpoint is used.
- **Actions:** Export ledger (`export-ledger`) **MOCK** toast; Record adjustment (`v26 journal-adjust`) → Create adjustment draft (`journal-adjust-save`) **MOCK** (local draft, not a JE). NAV: New journal, Trial balance, Chart of Accounts, journal row → `journaldetail`.

#### 6. Journal Entries — `journals` (v8)
- **Data:** scopes `journals, coa`. The Maker–Checker draft is reset to live posting accounts on hydrate when fixture codes are absent (`dev-uat-esign-perf-accounting-fixes.md`).
- **Actions:** Review & submit (`v8-journal-review` → confirm) → **LIVE `journal-submit`**; Save draft (`v8-journal-save-draft`) **MOCK**; + Add line / × remove line / Clear amounts **MOCK** (form editing); Import journal (`v8-import-journal` → `v8-review-journal-import` → `journal-import`) **MOCK** (toast says the batch was "routed to maker-checker"; nothing is sent); Export register (`v8-export`) **MOCK** (client CSV download); journal row → Request reversal (`reversal-request`) **MOCK**. NAV: Open approvals.

#### 7. Cash & Liquidity — `cash` (v12 page, v8 modal)
- **Data:** scopes `cash, journals, coa`; bank balances derived from POSTED journal lines against each bank's linked GL account. Cash batches/drafts panels are v12 local state.
- **Actions:** New receipt / New payment / New transfer (`v12 cash-new`, patched to v8 `openCashModal`) → Review & post → **LIVE `cash-post`**; Save draft **MOCK**; Import batch (`cash-import`) **MOCK — blocked** toast "Cash batch import is not wired to the live cashbook yet". NAV: Open workbench → reconciliation, journal row → `journaldetail`.

#### 8. Bank Reconciliation — `reconciliation` (v28)
- **Data:** scopes `reconciliation, cash, journals`. `reconBanks` (statement = ledger, both derived from journal lines — no imported statement exists) and `reconLines = []` in live mode; the latest `bank-reconciliation` run's unmatched lines feed `S.reconciliation`. Matching-rules auto-match rate trend chart is fixture.
- **Actions:** **Run auto-match (`recon-auto`) → LIVE `recon-signoff`** — it does not auto-match; it signs off every unreconciled cashbook line with statement balance = UI ledger balance; Submit for sign-off (`recon-submit`) → **LIVE `recon-signoff`**; Import statement (`recon-import`) → "Save & continue" (`generic-save`) **MOCK** (does not call `/bank-reconciliation/upload`); exception More actions → Create adjustment (`recon-adjust`) **MOCK**, Escalate (`recon-escalate`) **MOCK**; Add matching rule (`recon-rule` → `generic-save`) **MOCK**; Filters, bank selector, chart zoom UI. NAV: Investigate → `v28detail`.

#### 9. Payables & Payments — `payables` (v28 + live include)
- **Data:** scope `payables` — accounting purchase invoices + procurement invoices side by side (source column), vendors with open balances, payment banks (`window.__ac52ApBanks`), procurement POs and RFQ/quotations. The prototype's sample bills, "$270.8k", flat 2.5% WHT and "96% PO coverage" figures are replaced in live mode (`ac52LiveApPage`).
- **Actions:** Pay (`aplive-pay` → `aplive-pay-confirm`) → **LIVE `ap-pay-bill`**; Capture a supplier invoice / Purchase orders in procurement / Open in procurement (`aplive-go`) → **LIVE cross-module navigation, same tab**; bill document drawer Edit / Email / Sign (`v23 doc-edit`, `doc-email`, `doc-sign`) **MOCK** (no visible result); filters (`aplive-filter` vendor/status/source) UI. NAV: Open bill / Open purchase order → `v28detail` (live detail page with Pay bill and document link). Not offered in live mode (removed by the include): Schedule payment, Place/release hold, Record receipt, Amend PO, Submit recommendation, payment run.

#### 10. Receivables — `receivables` (v28, v8 modals)
- **Data:** scope `receivables` — `arInvoices`, `arCustomers` (open balance computed from invoices). Quotations tab, ECL/ageing trend chart and collections work queue are fixture-driven where no live list exists.
- **Actions:** New invoice (`new-ar-invoice` → v8 modal) → Review & create → **LIVE `invoice-create`**; Preview invoice (`v8-preview-new-invoice`) **MOCK** (preview); Record receipt (`ar-receipt` → v8 receipt modal → `v8-review-receipt`) → **LIVE `receipt-post`**; Create customer (`new-customer` → `ac52-customer-create`) → **LIVE `customer-create`**; New quotation (`new-ar-quote`) **MOCK — blocked** toast "Customer quotations are not persisted by the live accounting API yet"; Send statements (`ar-statements` → `generic-save`) **MOCK**; Recurring billing (`ar-recurring`) **MOCK** (modal only); Issue credit note (`ar-creditnote`) **MOCK** (generic modal; `/accounting/credit-notes` never called); Send by email (`doc-email`) **MOCK**; invoice document drawer Edit/Email/Sign (`v23 doc-*`) **MOCK**. NAV: Open invoice / customer row / collections item → `v28detail`.

#### 11. Expenses & Claims — `expenses` (v34)
- **Data:** scope `expenses` — claims from `/accounting/expenses` with user names; `expenseLookups` (vendors, categories; falls back to five named categories when the category register is empty). Corporate cards, recurring expenses and policy studio tabs are fixtures.
- **Actions:** New expense claim (`action-modal id=Expense claim`, patched) → Save expense (`ac52-expense-create`) → **LIVE `expense-create`** (toast "No vendors" if the vendor lookup is empty); Import card feed **MOCK — blocked** toast "Corporate card import has no live backend endpoint yet"; claim → Open claim / Review evidence (`claim`, `evidence`) **MOCK** drawers; Return for correction (`action-modal`) **MOCK** (generic "Finance action" modal); corporate-card document cells (`document`) **MOCK** previews; Filters UI.

#### 12. Timesheets & Projects — `timesheets` (v34)
- **Data:** scope `timesheets` — pending-approval timesheets and projects (hero now derived from live arrays per the 9 Sep sweep).
- **Actions:** row Approve / Return → confirm → **LIVE `timesheet-approve` / `timesheet-return`**; "Approve selected" (`action-modal id=Timesheet approval`) **MOCK** (generic modal, no bulk API call); Import timesheets (`action-modal id=Timesheet import`) **MOCK**; project cards (`v34=project`) drawers **MOCK**; Filters UI.

#### 13. Recurring Schedules — `recurring` (v27)
- **Data:** scope `recurring` — `GET /accounting/recurring-journal-templates` merged into `ac52LiveSchedules27()`. Exceptions, calendar, controls, 90-day simulation and audit are `ST27` fixtures.
- **Actions:** Generate occurrence (`schedule-run-confirm`) → **LIVE `recurring-run`**; Process due → Validate & generate (`run-due-confirm`) → **LIVE `recurring-run-due`**; **New schedule → Create schedule (`schedule-save`) MOCK** (local `ST27`; `POST /recurring-journal-templates` is not called); Preview next 3 runs (`schedule-preview-builder`) **MOCK**; Create counterparty (`counterparty-new`/`counterparty-save`) **MOCK**; Skip occurrence (`schedule-skip`) **MOCK**; pause/resume (`schedule-pause`/`schedule-resume`) **MOCK** (`PATCH /:id/active` not called); Resolve exception (`exception-resolve`/`exception-confirm`) **MOCK**; Simulate 90 days (`schedule-simulate`) **MOCK** (modal); Export calendar (`schedule-export`) **MOCK** (client file); Controls → Edit / Manage / Test (`control-edit`, `calendar-edit`, `integration-test`) **MOCK** (static modals); header "More actions" menu UI.

#### 14. Inventory Accounting — `inventory` (v51)
- **Data:** scope `inventory` — items (`__ac52HydrateRegisters`). Movement ledger, usage by project, replenishment, counts and valuation/GL panels derive from the hydrated items where possible, otherwise fixtures.
- **Actions:** Receive / Issue / Adjust / Cycle count / Capture count (`inv-action`) → Save movement (`save-inv`) → **LIVE `stock-adjust`**; Transfer (`inv-action id=transfer`) → Save movement → dispatches `stock-adjust` but `handleStockAdjust` returns an error for `transfer` (**effectively blocked**); item drawer (`inv-item`) and "Investigate" **MOCK**/drill.

#### 15. Fixed Assets — `assets` (v51)
- **Data:** scope `assets` — asset register. Depreciation schedule, custody, CIP, impairment and disposal panels are computed from hydrated assets or fixtures; no `/assets/:id/depreciation-schedule` call.
- **Actions:** Add fixed asset → Create asset (`save-asset`) → **LIVE `asset-create`**. **DEAD:** Run depreciation, Preview, Post run (`asset-action id=depreciation` / `post-depreciation`), Transfer / Record transfer, Impairment review / Assess, Dispose / Create disposal, Capitalise / Review, Record verification — all open `assetModal(kind)`'s generic "Fixed asset action" modal whose **Confirm button is `data-v51="close"`**, i.e. it only closes the modal (no state change, no toast, no API call). Backend depreciation/dispose endpoints exist but are not wired (§5).

#### 16. Short-Term Investments — `investments` (v17 + v26)
- **Data:** scope `investments` — `GET /accounting/short-term-investments/dashboard` instruments only (read-only). Accrual history, rate history, instrument journals, settlement tab, growth chart and KPI strip use fixture/derived values when the dashboard does not supply them.
- **Actions (all MOCK):** New investment instrument (`investment-new`), Edit effective-dated rate (`investment-rate`), Liquidate / mature (`investment-settle`) → modal → `confirm17` → generic "Action completed" toast; Run daily accrual (`investment-accrue`) → `confirm17` toast; Update instrument (`v26 invest-update` → `invest-update-save`) and Cash movement (`invest-flow` → `invest-flow-save`) mutate the local `investments` array. None calls the STI API (`/instruments`, `/apy-rates`, `/catch-up`, `/liquidate`, `/accruals/*/approve`, `/run-accruals`). Instrument drill tabs, sorts and chart zoom UI.

#### 17. Financial Reports — `reports` (v17)
- **Data:** scope `statements` — rows computed client-side from CoA + up to 1,000 journals (`computeAc52FinancialStatements`). Prior-year comparison columns (2025, 2024), signatories (named prototype people), approval status and ratio reports (`mfi`, `pe`) are fixtures.
- **Actions:** Preview report (`report-preview`) **MOCK** (document preview); Export Excel (`export-report`) **MOCK**; Send for approval (`report-submit`) **MOCK** (confirm → toast; no approval request created); signature pads (`report-signature` → `v20-signature-save`/`clear`) **MOCK**; Multi-currency / Consolidated view (`v23 currency-report`, `consolidated-report`) **MOCK** previews; report line drill (`report-line`) UI.

#### 18. Trial Balance — `trialbalance` (v15/v12)
- **Data:** scopes `coa, journals`; TB computed client-side (`core12()/tb12()`). `/api/accounting/trial-balance` is not used.
- **Actions:** Preview controlled TB (`preview-tb`) → document viewer: zoom/max/min UI, Edit letterhead → Save letterhead version (`letterhead-save`) **MOCK**, Email secure link (`doc-email`) **MOCK** toast, Sign document (`doc-sign`) **MOCK** toast; Export workbook (`v15 export`) **MOCK** toast; account expand (`tb-toggle`) UI. NAV: Back to ledger; row → reports.

#### 19. Compliance & Tax — `compliance` (v17)
- **Data:** scope `compliance` — tax return packs. VAT return figures, exceptions and the notification feed are fixture where packs carry no data; `/api/vat` reports are not used.
- **Actions:** New compliance pack → Create & compile → **LIVE `create-tax-pack`**; Run readiness scan (`compliance-scan` → `confirm-yes`) **MOCK** toast; pack preview / workpaper (`compliance-preview` → `v12complianceworkpaper`) **MOCK** (sign/submit inside it are local); notification row → NAV reports. Pack review/approve/sign-off (which would post the tax accrual JE) are not wired.

#### 20. FX Revaluation — `fx` (v23)
- **Data:** scope `fx` — `GET /accounting/multi-currency/reports/unrealized-fx` → `window.__ac52FxSummary` (exposure, gain). The USD/ZWG closing-rate chart and the exposure table fall back to fixtures (`3490740` etc.) when the summary is absent.
- **Actions:** **DEAD:** Rate sources (`fx-sources`), Preview journal (`fx-journal`), **Run revaluation (`fx-run`)** — rendered by `fxPage23` but no handler exists in the v23 dispatcher (no toast, no modal, no API). Filters / chart focus / exposure row drill UI. Backend revaluation (`POST /multi-currency/banks/:bankId/revalue`) and rate CRUD are not wired; Settings rate add (`fx-add` → `v8-add-rate`) is MOCK.

#### 21. Group Consolidation — `consolidation` (v23)
- **Data:** scope `consolidation` — `GET /accounting/consolidation/summary` → `window.__ac52ConsolidationSummary` (entities, IS/BS per entity, consolidated totals). Intercompany matching pairs and elimination proposals are fixtures.
- **Actions:** **DEAD:** Import trial balances (`cons-import`), Generate consolidation (`cons-generate`), entity row (`cons-entity`) — no handler. Run matching (`cons-match`) → reciprocal-balance drawer → Create adjustment (`v23-ic-adjust`) **MOCK**. Filters UI.

#### 22. Chart of Accounts — `coa` (v8)
- **Data:** scope `coa` (live accounts with `backendId`).
- **Actions:** Add account / Edit (`v8-add-account`, `v8-edit-account` → `v8-review-account` → confirm) → **LIVE `coa-save`** (non-admin/CFO edits become a `MASTER_DATA_COA` approval request server-side); Import CoA (`v8-import-coa` → `coa-import`) **MOCK** (adds two hardcoded accounts locally; `/chart-of-accounts/bulk-import` not called); Change history (`v8-coa-history`) **MOCK** (session-local list). NAV: account row → `v8accountdetail`.

#### 23. Document Vault — `vault` (base layer)
- **Data:** scope `vault` — `GET /accounting/documents` with uploader names.
- **Actions:** Upload document (file input) → **LIVE `upload-document`**; Create document (`create-document` → editor → `save-document-editor`) **MOCK**; folder filter (`select-folder`) UI; preview document drawer (`preview-document`) and its version/sign/download actions **MOCK**.

#### 24. Audit Trail — `audit` (base layer, not in sidebar)
- **Data:** scope `audit` — `GET /audit-logs?limit=100` (system-wide AuditLog, not filtered to accounting) with role names.
- **Actions:** Export audit log (`export-audit`) **MOCK** (client CSV of the loaded rows); **Verify integrity (`verify-audit`) MOCK** — toast asserts "All visible events pass hash-chain and timestamp validation" with no check performed; event drawer → Export event evidence (`download-evidence`) **MOCK** toast.

#### 25. Access Control — `access` (v12, not in sidebar)
- **Data:** scope `access` — real users and roles; permission matrix built from `roles.permissions`; MFA / approval limits / access reviews shown as "—"; access requests empty state (no backend workflow).
- **Actions:** **DEAD:** Invite user (`access-invite`), Create role (`access-role`), Run access certification (`access-certify`) — no handler. Tab switches UI; role-permission and request rows are `action=noop`.

#### 26. Integrations — `integrations` (base layer, not in sidebar)
- **Data:** **none** — no scope (`scopesForAc52Page` default); static connector cards (fixture statuses, last-sync times). Flagged in `accounting-final-sweep-findings.md` §8.
- **Actions:** Integration logs (`integration-logs`) **MOCK** static drawer; Add connector (`add-connector`) **MOCK** modal; Open connector (`connector-detail`) → **Test connection (`test-connection`) MOCK** toast "Connection test passed" (fabricated).

#### 27. Settings — `settings` (v17 + v26)
- **Data:** scopes `cash, close, audit, consolidation, access` — banks table, real fiscal periods (Periods & lock tab), audit tab, real users on Security & RBAC, integrations tab reads "Connection status not tracked". Letterhead, enterprise config-domain table (values "—"), approval limits and the harness-visible prototype users are fixtures when not hydrated.
- **Actions (all MOCK):** Save configuration (v17 `settings-save` → confirm → generic toast; v26 `settings-save` toast); Add bank (`settings-add-bank` → confirm) — does not call `POST /cashbook/banks`; **Lock July 2026 (`period-lock`) → sets `V17.periodLocked` locally**, does not call `/fiscal-calendar/locks/*`; Save letterhead (`letterhead-save`); Invite user (`user-invite` → confirm); user access / access-request decisions (`user-access`, `access-request` → confirm); Configure integration (`integration-config`); New change request / domain change (`v26 settings-new-change`, `settings-change-submit`) toast "submitted for independent approval" with no approval created; Review pending changes (`settings-review`); custom exchange rate (`v8-add-rate`/`v8-review-fx-rate` → `fx-rate-save`).

### 2.3 Action counts

| Status | Distinct action ids | Notes |
|---|---|---|
| **LIVE** (write to backend) | **19** | the `LIVE_ACTIONS` set; about 33 UI entry points reach them (several ids have 2-6 triggers). Plus 1 live cross-module navigation id (`aplive-go`, 5 targets). |
| **MOCK** (client-only; includes 4 *blocked* honest toasts) | **119** | tallied per page from §2.2 (each runtime action id once per page; an id reused on two pages counts twice; tab/sort/filter/zoom UI and pure NAV excluded). By page: overview 3, ceo 6, approvals 1, close 22, ledger 2, journals 6, cash 1, reconciliation 3, payables 3, receivables 5, expenses 5, timesheets 3, recurring 12, inventory 2, investments 6, reports 7, trial balance 5, compliance 2, consolidation 2, coa 2, vault 2, audit 3, integrations 3, settings 13. Blocked toasts: `cash-import`, `new-ar-quote`, corporate card import, inventory `transfer`. |
| **DEAD** (no handler / confirm only closes) | **16** | FX `fx-sources`, `fx-journal`, `fx-run`; Consolidation `cons-import`, `cons-generate`, `cons-entity`; Access `access-invite`, `access-role`, `access-certify`; Assets `asset-action` kinds `depreciation`, `post-depreciation`, `transfer`, `impair`, `disposal`, `capitalise`, `verify` (generic modal whose Confirm is `data-v51="close"`). |

---

---

## 3. Backend routes

Sources: `nvccz/src/app.ts` mounts (lines 617-894) and every router file listed, read in full. Paths are mount prefix + sub-path; guards in execution order. **AUTH-ONLY** = only `authenticate` (any valid token, including LP/investee/applicant portal accounts); **NO-AUTH** = no JWT check.

### 3.0 Guard semantics

- **`authenticate`** (`middleware/authenticate.ts`): requires `Authorization: Bearer <jwt>`, verifies it with `JWT_SECRET`, loads `user + role` from the DB, checks User Master availability (status and effective/end dates, returns 403) and `tokenVersion`, then sets `req.user`. It proves identity only. It does **not** check the portal/user type, so an INVESTEE, APPLICANT or LP token passes it. `requireInternalStaffUser()` exists in `permissionAuth.ts` but none of the routers below use it.
- **`requirePermission(key)` / `requireAnyPermission([...])`** (`middleware/permissionAuth.ts` → `config/cfoModulePermissions.userHasEffectivePermission`): passes if `role.permissions` JSON has `{name:key, value:true}`, **or** the user is CFO (roleCode `CFO` or a role signal "chief financial officer"/"cfo") and the key is in `CFO_MODULE_PERMISSIONS` (this includes all four `accounting.period_lock.*` keys and `manage_accounting`). `procurement.*` keys can additionally be narrowed by User Master scope. **There is no admin bypass.** An ADMIN role passes only if its permission JSON contains the key.
- **`authorize(roles)`** (legacy, `authenticate.ts`): case-insensitive match of the allowed list against `role.name` or `roleCode` ("chief financial officer" also matches "cfo"). A **CFO bypass** (`cfoPassesLegacyAuthorize`) also lets CFO through any list that contains `accountant`, or `finance_manager` without investment scope, when CFO has `view_accounting`. It does the same for `hr_manager`/`payroll_manager`, for `manager`/`user` with `view_financial_reports`, and for `procurement`/`proc_mgr`/`operations`. There is no generic admin bypass: `"admin"` must be in the list.
- **`requireExchangeRateDisplayAdmin`** (`middleware/exchangeRateDisplayAuth.ts` → `ExchangeRateDisplayAccessService.isFinanceAdmin`): passes if `isAdminViewer(user)` (sys-admin, or any role signal *containing* the substring "admin", "administrator" or "super_admin"), or roleCode/role name is CFO/FIN_MGR/FIN_MANAGER/FINANCE_MANAGER, or a role signal contains "cfo"/"fin_mgr"/"finance manager". This is loose substring matching: a role name such as "Administrative Officer" would pass.
- **In-handler checks** worth knowing: `JournalEntryService.postJournalEntry` requires admin/CFO (`isModulePrivilegedUser`) or `manage_ledger`, blocks the preparer from posting their own JE (maker-checker), checks balance, and runs `PeriodLockService.assertModuleDateOpen(GL)`. `ChartOfAccountsController.updateChartOfAccounts` applies changes directly only for admin/CFO; everyone else gets a `MASTER_DATA_COA` approval request (202), or 503 if no workflow is configured. `CashbookBatchImportService.deleteBatch` allows the creator only.

Markers: **AUTH-ONLY** means the only guard is `authenticate` (any valid token, including external-portal accounts). **NO-AUTH** means no guard at all.

Additional conventions used in §3.2:

- **Guards** are listed in execution order. Router-level guards (`router.use(...)`) come first.
- `authenticate` (`middleware/authenticate.ts`) checks the Bearer JWT, loads the user and role, applies the User Master status and validity window, and checks the tokenVersion.
- `staff` = `requireInternalStaffUser()`: refuses external-portal accounts (investee, applicant and LP accounts).
- `authorize([...])` matches role names or codes (`userMatchesAuthorizeRoleList`). A CFO also passes through `cfoPassesLegacyAuthorize`, for example on `accountant` routes when they hold `view_accounting`.
- `perm-any[...]` = `requireAnyPermission([...])`.
- **AUTH-ONLY**: the route carries no role or permission middleware, only `authenticate`, optionally with `staff`. Any logged-in user can reach it. If the handler does its own authorisation check, the entry says so.
- **NO-AUTH**: the route has no JWT check.
- **GL**: says whether the handler writes JournalEntry/JournalEntryLine rows, and names the posting function. There are three posting helpers:
  - `JournalEntryService.create*JournalEntry` creates JEs with status **PENDING**. They still need posting, either through `/api/accounting/journal-entries` approval or `postJournalEntry`.
  - `createJournalEntryWithAuditSequence` and `assignNextAuditIdAndCreateJournal` (`AuditTrailSequenceService`) create JEs with whatever status the caller passes. Most callers here pass **POSTED**, which skips maker-checker.
  - `JournalEntryService.postJournalEntry` needs `options.user` with admin or CFO rights, or `manage_ledger`. It also blocks the preparer from posting their own entry unless `allowCreatorPost` is set.

### 3.1 Ledger, close, FX, cashbook, reconciliation, documents

#### Journals / GL / COA / Trial balance
##### journalEntryRoutes.ts — mount `/api/accounting/journal-entries`
Router-level guards: `router.use(authenticate)`. Controller: `JournalEntryController`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/journal-entries/ | authenticate **AUTH-ONLY** | `getJournalEntries`: lists JEs (default POSTED+PENDING; `status`, `currencyId`, `startDate`/`endDate`, optional `limit` (max 500)/`offset` pagination), sorted by transactionDate desc |
| POST | /api/accounting/journal-entries/ | authenticate **AUTH-ONLY** | `createJournalEntry`: creates a manual JE in **PENDING** (needs ≥2 lines; debits must equal credits, or a ZiG-equivalent balance within 0.05 for mixed currencies; rejects account 1000 "reporting bucket"; assigns a sequential audit id) |
| GET | /api/accounting/journal-entries/by-date-range | authenticate **AUTH-ONLY** | `getJournalEntriesByDateRange`: same as the list but `startDate`/`endDate` are required |
| GET | /api/accounting/journal-entries/audit-trail/last-entries | authenticate **AUTH-ONLY** | last N (≤100) JEs by sequential audit-trail id |
| GET | /api/accounting/journal-entries/audit-trail/verify-sequential | authenticate **AUTH-ONLY** | checks the last N audit ids for gaps |
| GET | /api/accounting/journal-entries/:id | authenticate **AUTH-ONLY** | JE with lines |
| PATCH | /api/accounting/journal-entries/:id/post | authenticate **AUTH-ONLY** (route) + in-service check | `postJournalEntry`: PENDING → **POSTED**. The service requires admin/CFO or `manage_ledger`, blocks self-posting by the preparer, checks balance and the GL period lock |
| PATCH | /api/accounting/journal-entries/:id/void | authenticate **AUTH-ONLY** | `voidJournalEntry`: sets **VOID**. If the JE was POSTED it auto-creates a POSTED reversing JE (`VR-<ref>`). **No permission, maker-checker or period-lock check in the service**, so any authenticated user can void a posted JE |
| PATCH | /api/accounting/journal-entries/:id | authenticate **AUTH-ONLY** | `updateJournalEntry`: replaces header and lines of a **PENDING** JE only (POSTED/VOID → 409) |

##### chartOfAccountsRoutes.ts — mount `/api/accounting/chart-of-accounts`
Router-level guards: none (`authenticate` is set per route). Upload: `uploadCoaCsv` (multer memory, 5 MB, CSV). Controller: `ChartOfAccountsController`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/accounting/chart-of-accounts/ | authenticate **AUTH-ONLY** | `createChartOfAccounts`: creates a GL account directly, with no approval or privilege check |
| GET | /api/accounting/chart-of-accounts/ | authenticate **AUTH-ONLY** | lists accounts (filters: accountType, isActive, parentId…) |
| GET | /api/accounting/chart-of-accounts/with-journal-entries | authenticate **AUTH-ONLY** | accounts plus JE lines plus per-account totals |
| POST | /api/accounting/chart-of-accounts/bulk-import | authenticate **AUTH-ONLY**, `uploadCoaCsv.single("file")` | `bulkImportChartOfAccounts`: CSV import, all-or-nothing (row errors → 400) |
| GET | /api/accounting/chart-of-accounts/:id | authenticate **AUTH-ONLY** | account by id |
| PUT | /api/accounting/chart-of-accounts/:id | authenticate **AUTH-ONLY** (route) + in-handler | `updateChartOfAccounts`: admin/CFO apply directly; others create a MASTER_DATA_COA approval request (202), or 503 if no workflow is configured |
| PATCH | /api/accounting/chart-of-accounts/:id | authenticate **AUTH-ONLY** (route) + in-handler | same handler as PUT |
| DELETE | /api/accounting/chart-of-accounts/:id | authenticate **AUTH-ONLY** | `deleteChartOfAccounts`: **hard delete**. Blocked only if the account has children or JE lines. No privilege check |

##### glLedgerDetailRoutes.ts — mount `/api/accounting/gl-ledger-detail`
Router-level guards: `router.use(authenticate)`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/gl-ledger-detail/ | authenticate **AUTH-ONLY** | `generateGLLedgerDetail`: GL detail report for `accountNo` plus required `startDate`/`endDate` |
| GET | /api/accounting/gl-ledger-detail/bank/:bankId | authenticate **AUTH-ONLY** | resolves the bank's GL account and runs the same report |

##### trialBalanceRoutes.ts — mount `/api/accounting/trial-balance`
Router-level guards: none (`authenticate` is set per route).

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/trial-balance/ | authenticate **AUTH-ONLY** | `generateTrialBalance` (as-of date, or period/start-end, currencyId) |
| GET | /api/accounting/trial-balance/summary | authenticate **AUTH-ONLY** | `getTrialBalanceSummary`: totals and in-balance flag |
| GET | /api/accounting/trial-balance/by-account-type | authenticate **AUTH-ONLY** | TB grouped by account type |

##### recurringJournalRoutes.ts — mount `/api/accounting/recurring-journal-templates`
Router-level guards: none (`authenticate` is set per route). Controller: `RecurringJournalController` → `RecurringJournalService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/recurring-journal-templates/ | authenticate **AUTH-ONLY** | list templates (`activeOnly`) |
| POST | /api/accounting/recurring-journal-templates/ | authenticate **AUTH-ONLY** | create template (lines must balance, accounts must exist) |
| PATCH | /api/accounting/recurring-journal-templates/:id/active | authenticate **AUTH-ONLY** | toggle `isActive` |
| POST | /api/accounting/recurring-journal-templates/:id/run | authenticate **AUTH-ONLY** | `postTemplateForMonth`: creates the JE **directly as POSTED**. **Bypasses maker-checker and the GL period-lock check** (none found in `RecurringJournalService`) |
| POST | /api/accounting/recurring-journal-templates/run-due | authenticate **AUTH-ONLY** | runs all due templates, each posting a POSTED JE (same bypass) |

#### Fiscal calendar, close & locks
##### fiscalCalendarRoutes.ts — mount `/api/accounting/fiscal-calendar`
Router-level guards: `router.use(authenticate)`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/fiscal-calendar/ | authenticate, requireAnyPermission(["accounting.period_lock.view","accounting.period_lock.manage","manage_accounting"]) | calendar with module locks plus the current lock draft (created if missing) |
| PUT | /api/accounting/fiscal-calendar/locks/draft | authenticate, requirePermission("accounting.period_lock.manage") | saves the lock draft (`draft.moduleLocks`) |
| POST | /api/accounting/fiscal-calendar/locks/commit | authenticate, requirePermission("accounting.period_lock.manage") | commits the draft into `ModulePeriodLock` |
| GET | /api/accounting/fiscal-calendar/period-lock/audit | authenticate, requireAnyPermission(["accounting.period_lock.audit_view","accounting.period_lock.manage"]) | period-lock audit log (take/skip) |
| GET | /api/accounting/fiscal-calendar/posting-exceptions | authenticate, requireAnyPermission(["accounting.period_lock.view","accounting.period_lock.manage","manage_accounting"]) | `PostingGuardService.listExceptions` |
| PATCH | /api/accounting/fiscal-calendar/policy | authenticate, requirePermission("accounting.period_lock.manage") | updates the company locked-period policy |

##### accountingCloseTaskRoutes.ts — mount `/api/accounting/close-tasks`
Router-level guards: `router.use(authenticate)`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/close-tasks/periods/:fiscalPeriodId/tasks | authenticate, requirePermission("accounting.period_lock.view") | list close tasks for a period |
| POST | /api/accounting/close-tasks/periods/:fiscalPeriodId/tasks | authenticate, requirePermission("accounting.period_lock.manage") | create a close task |
| PATCH | /api/accounting/close-tasks/tasks/:taskId | authenticate, requirePermission("accounting.period_lock.manage") | update task status |
| GET | /api/accounting/close-tasks/periods/:fiscalPeriodId/can-lock | authenticate, requirePermission("accounting.period_lock.view") | whether all close tasks allow locking |

##### periodLockoutRoutes.ts — mount `/api/cashbook/periods` (legacy cashbook period lockout)
Router-level guards: `router.use(authenticate)`. Requests also pass the `authenticate` in `cashbookRoutes-Enhanced` and `cashbookRoutes` first (see the cashbook mount notes). Controller: `PeriodLockoutController` → `PeriodLockoutService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/periods/lock | authenticate **AUTH-ONLY** | `lockPeriod` → `PeriodLockService.applyLegacyImmediateLock`: **locks or unlocks** (`isLocked` true/false) the **GL and BANK** `ModulePeriodLock` for the YYYY-MM period immediately, and syncs `accounting_periods` and `period_lockouts`. **This bypasses the `accounting.period_lock.manage` permission and the close-task `can-lock` gate enforced on /fiscal-calendar**, so any authenticated user can reopen a locked GL period |
| GET | /api/cashbook/periods/:period/status | authenticate **AUTH-ONLY** | effective lock status for YYYY-MM |
| GET | /api/cashbook/periods/ | authenticate **AUTH-ONLY** | list periods (filters) |
| POST | /api/cashbook/periods/validate-date | authenticate **AUTH-ONLY** | checks a date against GL/BANK locks (`assertModuleDateOpen`) |
| GET | /api/cashbook/periods/:period/history | authenticate **AUTH-ONLY** | lockout history for the period |

#### Currencies / FX
##### currencyRoutes.ts — mount `/api/accounting/currencies`
Router-level guards: `router.use(authenticate)`. Controller: `currencyController`. There are no in-handler role checks.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/accounting/currencies/ | authenticate **AUTH-ONLY** | create currency (code/name/symbol/isDefault) |
| GET | /api/accounting/currencies/ | authenticate **AUTH-ONLY** | list (isActive/isDefault filters) |
| GET | /api/accounting/currencies/:id | authenticate **AUTH-ONLY** | by id |
| PUT | /api/accounting/currencies/:id | authenticate **AUTH-ONLY** | update, including isActive/isDefault |
| DELETE | /api/accounting/currencies/:id | authenticate **AUTH-ONLY** | soft delete (`isActive:false`) |
| GET | /api/accounting/currencies/default | authenticate **AUTH-ONLY** | `getDefaultCurrency`. **Unreachable**: it is registered after `GET /:id`, so `/default` is handled as `id="default"` (likely 404) |
| POST | /api/accounting/currencies/:id/set-default | authenticate **AUTH-ONLY** | make this currency the default |

##### multiCurrencyRoutes.ts — mount `/api/accounting/multi-currency`
Router-level guards: `router.use(authenticate)`. Controller: `MultiCurrencyController` → `MultiCurrencyService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/accounting/multi-currency/exchange-rates | authenticate **AUTH-ONLY** | create an exchange rate (effectiveDate, from/to, rate) |
| GET | /api/accounting/multi-currency/exchange-rates | authenticate **AUTH-ONLY** | list rates (filters, paging) |
| PUT | /api/accounting/multi-currency/exchange-rates/:id | authenticate **AUTH-ONLY** | update a rate |
| DELETE | /api/accounting/multi-currency/exchange-rates/:id | authenticate **AUTH-ONLY** | **hard delete** of an exchange rate |
| POST | /api/accounting/multi-currency/convert | authenticate **AUTH-ONLY** | amount conversion (read-only calculation) |
| POST | /api/accounting/multi-currency/payments | authenticate **AUTH-ONLY** | `processMultiCurrencyPayment`: records the FX gain/loss and creates a **POSTED** JE for the payment |
| GET | /api/accounting/multi-currency/forex-gain-loss | authenticate **AUTH-ONLY** | list FX gain/loss records |
| GET | /api/accounting/multi-currency/reports/unrealized-fx | authenticate **AUTH-ONLY** | `UnrealizedFxReportService.run(asOf)` |
| GET | /api/accounting/multi-currency/dashboard/multi-currency-dashboard | authenticate **AUTH-ONLY** | multi-currency dashboard aggregates |
| POST | /api/accounting/multi-currency/calculate-forex-gain-loss | authenticate **AUTH-ONLY** | calculates realized FX for an invoice payment (no write) |
| POST | /api/accounting/multi-currency/post-forex-gain-loss | authenticate **AUTH-ONLY** | creates a ForexGainLoss row plus a **POSTED** JE. Auto-creates COA 6000 "Foreign Exchange Gain/Loss" if missing |
| GET | /api/accounting/multi-currency/reconcile-invoice/:invoiceId | authenticate **AUTH-ONLY** | multi-currency invoice reconciliation view |
| POST | /api/accounting/multi-currency/banks/:bankId/revalue | authenticate **AUTH-ONLY** | revalues a foreign-currency bank. Creates a **POSTED** unrealized FX JE and may auto-create the COA account |

##### exchangeRateDisplayRoutes.ts — mount `/api/exchange-rate-display`
Router-level guards: `router.use(authenticate)`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/exchange-rate-display/widget | authenticate **AUTH-ONLY** | resolves the rate widget data |
| GET | /api/exchange-rate-display/rates/compare | authenticate **AUTH-ONLY** | compares official vs street rates |
| GET | /api/exchange-rate-display/rates/history | authenticate **AUTH-ONLY** | quote history |
| GET | /api/exchange-rate-display/configs | authenticate, requireExchangeRateDisplayAdmin | list display configs |
| POST | /api/exchange-rate-display/configs | authenticate, requireExchangeRateDisplayAdmin | create config |
| PUT | /api/exchange-rate-display/configs/:id | authenticate, requireExchangeRateDisplayAdmin | update config |
| POST | /api/exchange-rate-display/ingest/run | authenticate, requireExchangeRateDisplayAdmin | `StreetRateIngestService.ingestLive()`: triggers an external rate scrape/ingest |
| POST | /api/exchange-rate-display/quotes/manual | authenticate, requireExchangeRateDisplayAdmin | manual quote override (from/to code, avg) |

##### exchangeRateDisplayCronRoutes.ts — mount `/api/cron/exchange-rate-display`
Router-level guards: **none**. The earlier `/api/cron` router (`cronRoutes`) has no `router.use` guard, and app.ts comments that cron routes use "route-specific secrets", but this one has none.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cron/exchange-rate-display/snapshot-refresh | **NO-AUTH** | inline handler → `ExchangeRateDisplayCronService.refreshSnapshots()`. There is no shared-secret or loopback check (compare `/api/cron/vendors/compliance-cycle`, which has one) |

#### Banks, cashbook & reconciliation
**Mount-order notes for `/api/cashbook`** (app.ts 675-698):
1. The specific routers are mounted first: `/batches` (cashbookBatchImportRoutes), `/open-items`, `/transactions` and `/reversals` (the same transactionReversalRoutes mounted twice), `/transfers`. Then `/api/cashbook` → **cashbookRoutes-Enhanced**, then `/api/cashbook` → **cashbookRoutes**, then `/contra`, `/entry-types`, `/periods`.
2. `cashbookRoutes-Enhanced` and `cashbookRoutes` both do `router.use(authenticate)` at the `/api/cashbook` root. Every `/api/cashbook/*` request that falls through the earlier routers therefore runs `authenticate` in each of them before reaching its own router. For `/contra`, `/entry-types` and `/periods` that is **three `authenticate` calls, and three user DB lookups, per request** (about 100 ms each on the dev DB). No path under `/api/cashbook` is unauthenticated.
3. **Shadowing, specific router over generic cashbookRoutes** (the earlier router wins):
   - `GET /api/cashbook/batches` → cashbookBatchImportRoutes `listBatches` (CashbookBatchImportService). This shadows cashbookRoutes `GET /batches` (`CashbookController.listBatches`).
   - `GET /api/cashbook/batches/:id` → the batch-import `getBatch`, which shadows `CashbookController.getBatch`.
   - `POST /api/cashbook/batches/:id/post` → batch-import `postBatch` (CashbookBatchImportService), which shadows `CashbookController.postBatch` (CashbookService.postBatch). These are different services with different posting logic.
   - `POST /batches/import`, `GET /batches/:id/export` and `GET /batches/export/all` in cashbookRoutes are shadowed by the same handlers in the batch-import router, so the behaviour is the same.
   - `GET /api/cashbook/entries` → Enhanced `getAllEntries`, which shadows cashbookRoutes `GET /entries` (`CashbookController.getCashbookEntries`). That route is dead.
   - Still reachable in cashbookRoutes: `POST /batches`, `POST /batches/:batchId/transactions/:transactionId`, `GET /batches/import/template`.
4. **contra / entry-types / periods mounted after the generic routers**: I checked every route against the Enhanced patterns (`/:bankId/summary`, `/:bankId/unreconciled`, `/:bankId/post-batch`, `/entries/:id…`) and the cashbookRoutes patterns. **None of the actual contra/entry-types/periods routes are shadowed.** The only collision would be a hypothetical `GET /api/cashbook/<x>/summary`. The one real shadow here is inside `entryTypeRoutes` (`/statistics`, see below).

##### bankReconciliationRoutes.ts — mount `/api/accounting/bank-reconciliation`
Router-level guards: none (`authenticate` is set per route). Upload: `upload` (multer memory, 10 MB, CSV/XLSX/XLS). Controller: static methods of `BankReconciliationController`. The file also builds an unused `new BankReconciliationController()`. **Several routes pass path params that the handler never reads (param-name mismatch), so they are likely broken at runtime.**

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/accounting/bank-reconciliation/upload | authenticate **AUTH-ONLY**, upload.single('file') | `createBankStatement`: parses the CSV/XLSX (or JSON `items`), creates `bankReconciliation` + `bankTransaction` rows, then runs `BankReconciliationEngineService.runReconciliation` (auto-match) |
| GET | /api/accounting/bank-reconciliation/ | authenticate **AUTH-ONLY** | `getReconciliationStatus`: lists reconciliations (status/currencyId filters) |
| GET | /api/accounting/bank-reconciliation/summary | authenticate **AUTH-ONLY** | engine summary statistics |
| GET | /api/accounting/bank-reconciliation/template | authenticate **AUTH-ONLY** | static import template (sync) |
| GET | /api/accounting/bank-reconciliation/:id | authenticate **AUTH-ONLY** | reconciliation with transactions/results |
| GET | /api/accounting/bank-reconciliation/:reconciliationId/unmatched | authenticate **AUTH-ONLY** | unmatched bank transactions |
| GET | /api/accounting/bank-reconciliation/transactions/:bankTransactionId/matches | authenticate **AUTH-ONLY** | potential GL/cashbook matches |
| POST | /api/accounting/bank-reconciliation/approve-match | authenticate **AUTH-ONLY** | `markTransactionReconciled`. It reads `req.params.transactionId`, but the route has no param, so the value is **undefined → likely fails** |
| POST | /api/accounting/bank-reconciliation/results/:reconciliationResultId/reject | authenticate **AUTH-ONLY** | `resolveMismatch`. It reads `req.params.mismatchId` (**undefined**) and needs body `type` ∈ MATCH_TRANSACTION/CREATE_TRANSACTION/IGNORE. Likely broken |
| GET | /api/accounting/bank-reconciliation/:reconciliationId/audit-trail | authenticate **AUTH-ONLY** | `getReconciliationReport`. It reads `req.params.statementId` (**undefined**), queries the legacy `bankStatement` model, and likely returns 500 or 404 |
| DELETE | /api/accounting/bank-reconciliation/:id | authenticate **AUTH-ONLY** | Mapped to **`completeReconciliation`**, not a delete. It reads `req.params.statementId` (**undefined**). Semantically wrong and likely broken |
| POST | /api/accounting/bank-reconciliation/manual-reconcile | authenticate **AUTH-ONLY** | `markTransactionReconciled` (the same param bug as approve-match) |
| POST | /api/accounting/bank-reconciliation/create-journal | authenticate **AUTH-ONLY** | Mapped to **`createBankStatement`**. It creates a statement, not a journal (mislabelled) |
| GET | /api/accounting/bank-reconciliation/:reconciliationId/report | authenticate **AUTH-ONLY** | `getReconciliationReport` (the same statementId bug) |
| POST | /api/accounting/bank-reconciliation/import | authenticate **AUTH-ONLY**, upload.single('file') | `createBankStatement` (alias of /upload) |

##### cashbookBatchImportRoutes.ts — mount `/api/cashbook/batches`
Router-level guards: `router.use(authenticate)`. Upload: `upload` from `CashbookBatchImportController` (multer memory, CSV only). Service: `CashbookBatchImportService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/batches/import | authenticate **AUTH-ONLY**, upload.single('file') | `importCSV`: validates the CSV and creates a batch with PENDING cashbook entries |
| POST | /api/cashbook/batches/:batchId/post | authenticate **AUTH-ONLY** | `postBatch`: creates a **POSTED** JE for each PENDING entry and marks the entries and the batch POSTED. **No maker-checker and no period-lock check found in this service** |
| GET | /api/cashbook/batches/ | authenticate **AUTH-ONLY** | list batches (page/limit). This shadows cashbookRoutes `GET /batches` |
| GET | /api/cashbook/batches/:batchId | authenticate **AUTH-ONLY** | batch details |
| PUT | /api/cashbook/batches/:batchId | authenticate **AUTH-ONLY** | update batch (service checks) |
| DELETE | /api/cashbook/batches/:batchId | authenticate **AUTH-ONLY** | **hard-deletes** the batch and its entries. Creator only; POSTED batches are blocked |
| GET | /api/cashbook/batches/:batchId/export | authenticate **AUTH-ONLY** | export one batch |
| GET | /api/cashbook/batches/export/all | authenticate **AUTH-ONLY** | export all of the user's batches |

##### openItemMatchingRoutes.ts — mount `/api/cashbook/open-items`
Router-level guards: `router.use(authenticate)`. Service: `OpenItemMatchingService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/cashbook/open-items/customers/:customerId | authenticate **AUTH-ONLY** | customer open invoices |
| GET | /api/cashbook/open-items/suppliers/:supplierId | authenticate **AUTH-ONLY** | supplier open items |
| POST | /api/cashbook/open-items/match/:paymentId | authenticate **AUTH-ONLY** | allocates a payment to invoices (`allocations[]`) and sets invoices PAID/PARTIALLY_PAID |
| POST | /api/cashbook/open-items/unmatch | authenticate **AUTH-ONLY** | deletes allocations (`paymentId`, `allocationIds[]`) and reverts invoice status |
| GET | /api/cashbook/open-items/allocations/:paymentId | authenticate **AUTH-ONLY** | payment allocations |
| GET | /api/cashbook/open-items/summary | authenticate **AUTH-ONLY** | matching summary (customerId/supplierId) |

##### transactionReversalRoutes.ts — mounted twice: `/api/cashbook/transactions` **and** `/api/cashbook/reversals`
Router-level guards: `router.use(authenticate)`. Each route below exists under both prefixes (4 definitions, 8 endpoints). Service: `TransactionReversalService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/{transactions\|reversals}/:transactionId/reverse | authenticate **AUTH-ONLY** | reverses a cashbook tx (reason required): creates a POSTED reversal tx plus a **POSTED** reversing JE (`REV-<ref>`). Blocked if the legacy cashbook month is locked |
| GET | /api/cashbook/{transactions\|reversals}/:transactionId/reversal-history | authenticate **AUTH-ONLY** | reversal history |
| GET | /api/cashbook/{transactions\|reversals}/ | authenticate **AUTH-ONLY** | all reversals (page/limit) |
| GET | /api/cashbook/{transactions\|reversals}/:transactionId/can-reverse | authenticate **AUTH-ONLY** | eligibility check, including the period lock |

##### cashbookTransferRoutes.ts — mount `/api/cashbook/transfers`
Router-level guards: `router.use(authenticate)`. Service: `CashbookTransferService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/transfers/ | authenticate **AUTH-ONLY** | inter-bank transfer: creates POSTED from/to cashbook entries plus a **POSTED** JE. Checks the legacy cashbook month lock |
| GET | /api/cashbook/transfers/summary | authenticate **AUTH-ONLY** | transfer summary (dateFrom/dateTo) |
| GET | /api/cashbook/transfers/ | authenticate **AUTH-ONLY** | list transfers |
| GET | /api/cashbook/transfers/:transferId | authenticate **AUTH-ONLY** | transfer by id |

##### cashbookRoutes-Enhanced.ts — mount `/api/cashbook` (mounted before cashbookRoutes)
Router-level guards: `router.use(authenticate)`, which also applies to every later `/api/cashbook/*` router. Upload: `uploadCashbookReceipt` (multer memory, 15 MB, PDF/images). Controllers: `CashbookControllerEnhanced` → `CashbookServiceEnhanced`, `CashbookReconciliationSessionController`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/entries/:id/receipt-attachment | authenticate **AUTH-ONLY**, uploadCashbookReceipt.single("file") | attaches a receipt document to a cashbook entry |
| GET | /api/cashbook/entries/:id | authenticate **AUTH-ONLY** | entry by id |
| GET | /api/cashbook/entries | authenticate **AUTH-ONLY** | `getAllEntries` (filters). **Shadows** cashbookRoutes `GET /entries` |
| GET | /api/cashbook/export-audit | authenticate **AUTH-ONLY** | month audit export (bankId/year/month/format) and writes an audit log |
| PUT | /api/cashbook/entries/:id | authenticate **AUTH-ONLY** | `updateCashbookEntry` |
| PUT | /api/cashbook/entries/:id/void | authenticate **AUTH-ONLY** | `voidCashbookEntry`: creates a reversing JE and marks the entry VOIDED |
| POST | /api/cashbook/:bankId/post-batch | authenticate **AUTH-ONLY** | `postCashbookBatch`: posts pending entries for a bank (POSTED) |
| PUT | /api/cashbook/entries/:id/reconcile | authenticate **AUTH-ONLY** | marks an entry reconciled |
| PUT | /api/cashbook/entries/:id/unreconcile | authenticate **AUTH-ONLY** | marks an entry unreconciled |
| GET | /api/cashbook/reconciliation/banks/:bankId/entries | authenticate **AUTH-ONLY** | recon-session candidate entries |
| GET | /api/cashbook/reconciliation/banks/:bankId/sessions | authenticate **AUTH-ONLY** | list sessions for a bank |
| POST | /api/cashbook/reconciliation/banks/:bankId/sessions | authenticate **AUTH-ONLY** | create a DRAFT reconciliation session |
| GET | /api/cashbook/reconciliation/sessions/:sessionId | authenticate **AUTH-ONLY** | session by id |
| PATCH | /api/cashbook/reconciliation/sessions/:sessionId | authenticate **AUTH-ONLY** | update the draft (ticked entries, statement balance) |
| POST | /api/cashbook/reconciliation/sessions/:sessionId/finish | authenticate **AUTH-ONLY** | finishes the session: marks the ticked POSTED entries reconciled |
| POST | /api/cashbook/reconciliation/sessions/:sessionId/discard | authenticate **AUTH-ONLY** | discards the draft |
| GET | /api/cashbook/:bankId/summary | authenticate **AUTH-ONLY** | cashbook summary per bank |
| GET | /api/cashbook/:bankId/unreconciled | authenticate **AUTH-ONLY** | unreconciled entries per bank |
| POST | /api/cashbook/reconciliation/seed-five-unreconciled | authenticate **AUTH-ONLY** | **test/seed endpoint exposed in all environments**: creates 5 POSTED unreconciled cashbook entries (with JEs against GL 4000/5000) for body `bankId` |
| GET | /api/cashbook/reconciliation/display | authenticate **AUTH-ONLY** | reconciliation display data |

##### cashbookRoutes.ts — mount `/api/cashbook` (after Enhanced)
Router-level guards: `router.use(authenticate)`. Upload: `upload` (multer memory, 10 MB, CSV). Controllers: `CashbookController` → `CashbookService`, plus Reference/Template/Discount/CashbookCustomer/Vendor/Invoice controllers.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/receipts | authenticate **AUTH-ONLY** | `createCashReceipt`: checks GL/BANK period locks, creates the entry, **immediately creates the JE and marks the entry POSTED**, and applies customer control-account integration |
| POST | /api/cashbook/payments | authenticate **AUTH-ONLY** | `createCashPayment`: checks bank/GL locks, creates the entry plus the JE, and marks it **POSTED** |
| POST | /api/cashbook/transactions/:id/post | authenticate **AUTH-ONLY** | `postTransaction`: PENDING → POSTED with JE and period-lock checks |
| POST | /api/cashbook/transactions/:id/void | authenticate **AUTH-ONLY** | voids the tx (reason required; blocked if reconciled), creates a POSTED reversing JE (`VR-`) and writes an audit log |
| POST | /api/cashbook/batches | authenticate **AUTH-ONLY** | `createBatch`: creates a DRAFT batch (reachable) |
| GET | /api/cashbook/batches | authenticate **AUTH-ONLY** | **shadowed** by cashbookBatchImportRoutes `GET /` |
| GET | /api/cashbook/batches/:id | authenticate **AUTH-ONLY** | **shadowed** by batch-import `GET /:batchId` |
| POST | /api/cashbook/batches/:batchId/transactions/:transactionId | authenticate **AUTH-ONLY** | adds a tx to a batch (reachable). No userId check |
| POST | /api/cashbook/batches/:id/post | authenticate **AUTH-ONLY** | **shadowed** by batch-import `POST /:batchId/post` (a different service) |
| POST | /api/cashbook/batches/import | authenticate **AUTH-ONLY**, upload.single('file') | **shadowed** by batch-import `/import` (same controller) |
| GET | /api/cashbook/batches/import/template | authenticate **AUTH-ONLY** | CSV template (reachable) |
| GET | /api/cashbook/batches/:id/export | authenticate **AUTH-ONLY** | **shadowed** (same handler in batch-import) |
| GET | /api/cashbook/batches/export/all | authenticate **AUTH-ONLY** | **shadowed** (same handler in batch-import) |
| GET | /api/cashbook/banks | authenticate **AUTH-ONLY** | list banks |
| POST | /api/cashbook/banks | authenticate **AUTH-ONLY** | create a bank account (master data, no privilege check) |
| GET | /api/cashbook/banks/:id | authenticate **AUTH-ONLY** | bank by id |
| PUT | /api/cashbook/banks/:id | authenticate **AUTH-ONLY** | update bank |
| DELETE | /api/cashbook/banks/:id | authenticate **AUTH-ONLY** | soft-delete bank (`isActive:false`) |
| GET | /api/cashbook/customers | authenticate **AUTH-ONLY** | customers (direct prisma) |
| GET | /api/cashbook/customers/:id | authenticate **AUTH-ONLY** | customer by id |
| GET | /api/cashbook/vendors | authenticate **AUTH-ONLY** | vendors (direct prisma) |
| GET | /api/cashbook/invoices | authenticate **AUTH-ONLY** | invoices via InvoiceService |
| GET | /api/cashbook/invoices/:id | authenticate **AUTH-ONLY** | invoice by id |
| GET | /api/cashbook/gl-accounts | authenticate **AUTH-ONLY** | GL accounts for cashbook pickers |
| GET | /api/cashbook/entries | authenticate **AUTH-ONLY** | **shadowed** by Enhanced `GET /entries` (dead) |
| POST | /api/cashbook/reference/configure | authenticate **AUTH-ONLY** | configure reference-number format |
| GET | /api/cashbook/reference/next | authenticate **AUTH-ONLY** | next reference (RECEIPT/PAYMENT/BATCH) |
| POST | /api/cashbook/templates | authenticate **AUTH-ONLY** | create a transaction template |
| POST | /api/cashbook/discounts/configure | authenticate **AUTH-ONLY** | `createDiscountConfig` |
| POST | /api/cashbook/discounts/calculate | authenticate **AUTH-ONLY** | calculate a discount (no write) |

##### contraEntryRoutes.ts — mount `/api/cashbook/contra` (mounted after the generic /api/cashbook routers; not shadowed)
Router-level guards: `router.use(authenticate)`, plus the two upstream `authenticate` calls. Service: `ContraEntryService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/contra/configure | authenticate **AUTH-ONLY** | create/update a contra-entry config |
| GET | /api/cashbook/contra/configs | authenticate **AUTH-ONLY** | list configs |
| GET | /api/cashbook/contra/all-entries | authenticate **AUTH-ONLY** | list all contra entries (currencyId, limit) |
| POST | /api/cashbook/contra/generate | authenticate **AUTH-ONLY** | generate `contraEntry` rows for a cashbook entry |
| GET | /api/cashbook/contra/entries/:cashbookEntryId | authenticate **AUTH-ONLY** | contra entries for a cashbook entry |

##### entryTypeRoutes.ts — mount `/api/cashbook/entry-types` (mounted after the generic /api/cashbook routers; not shadowed by them)
Router-level guards: `router.use(authenticate)`, plus the two upstream `authenticate` calls. Service: `EntryTypeService`.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /api/cashbook/entry-types/ | authenticate **AUTH-ONLY** | create an entry-type config (D/C designation, allowed accounts) |
| GET | /api/cashbook/entry-types/ | authenticate **AUTH-ONLY** | list (transactionType/isActive/currencyId) |
| GET | /api/cashbook/entry-types/:entryTypeId | authenticate **AUTH-ONLY** | by id |
| PUT | /api/cashbook/entry-types/:entryTypeId | authenticate **AUTH-ONLY** | update |
| DELETE | /api/cashbook/entry-types/:entryTypeId | authenticate **AUTH-ONLY** | **hard delete** (`cashbookEntryTypeConfig.delete`). Blocked if used by transactions |
| GET | /api/cashbook/entry-types/transaction/:transactionType | authenticate **AUTH-ONLY** | entry types for a transaction type |
| GET | /api/cashbook/entry-types/statistics | authenticate **AUTH-ONLY** | **Unreachable**: registered after `GET /:entryTypeId`, so it is handled as `entryTypeId="statistics"` |
| GET | /api/cashbook/entry-types/:entryTypeId/validate | authenticate **AUTH-ONLY** | validates the entry-type configuration |

(`periodLockoutRoutes`, mounted at `/api/cashbook/periods`, is listed under "Fiscal calendar, close & locks" above.)

#### Dashboard / documents / integration APIs
##### accountingDashboardRoutes.ts — mount `/api/accounting/dashboard`
Router-level guards: none.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/dashboard/ | authenticate, authorize(["admin","accountant","finance_manager"]) (CFO passes through the legacy bypass) | `AccountingDashboardService.getDashboardData` (startDate/endDate) |

##### accountingDocumentRoutes.ts — mount `/api/accounting/documents`
Router-level guards: none. Upload: `accountingDocumentUpload` (multer memory, 50 MB, **no file-type filter**).

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/documents/ | authenticate, authorize(["admin","accountant"]) | list document-vault documents |
| POST | /api/accounting/documents/ | authenticate, authorize(["admin","accountant"]), accountingDocumentUpload.single("file") | uploads to Firebase Storage and creates the document record |

##### accountingApiRoutes.ts — mount `/accounting/api` (note: no `/api` prefix)
Router-level guards: none.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| POST | /accounting/api/post_journal_entry | authenticate **AUTH-ONLY** | `AccountingApiController.postJournalEntry`: validates balanced lines by `accountCode` (each line must be exactly one of DR/CR, rejects 1000) and calls `createManualJournalEntry`. The JE is actually created as **PENDING**, although the response says "Journal entry posted" (201) |

##### accountingPeIntegrationV1Routes.ts — mount `/api/accounting/v1`
Router-level guards: none.

| Method | Path | Guards | Handler / what it does |
|---|---|---|---|
| GET | /api/accounting/v1/pe/portfolio-irr | authenticate, authorize(["admin","ceo","fund_manager","investments_manager","finance_manager","cfo"]) | weighted portfolio gross IRR (4 dp) for performance sync |
| GET | /api/accounting/v1/kpis/portfolio-irr | same | alias of the above |
| GET | /api/accounting/v1/pe/portfolio-total-revenue | same | sums `TOTAL_REVENUE` KPI across portfolio companies (optional fundId) |

#### Unmounted router files
I confirmed none of these is passed to `app.use` anywhere in `src/`. `batchImportExportRoutes` is **imported** at app.ts:688 but never `app.use`'d, so it is dead. The other four are not imported at all. All use `router.use(authenticate)`, so they would be AUTH-ONLY if mounted.

##### controlAccountRoutes.ts — NOT MOUNTED
| Method | Path (relative) | Guards | Handler |
|---|---|---|---|
| GET | /customers/:customerId/payment-summary | authenticate | ControlAccountController.getCustomerPaymentSummary |
| GET | /suppliers/:vendorId/payment-summary | authenticate | getSupplierPaymentSummary |
| POST | /customers/:customerId/apply-payment | authenticate | applyCustomerPayment |
| POST | /suppliers/:vendorId/apply-payment | authenticate | applySupplierPayment |

##### openItemRoutes.ts — NOT MOUNTED (superseded by openItemMatchingRoutes)
| Method | Path (relative) | Guards | Handler |
|---|---|---|---|
| GET | /customers/:customerId/invoices | authenticate | OpenItemController.getCustomerInvoices |
| GET | /vendors/:vendorId/invoices | authenticate | getVendorInvoices |
| POST | /receipts/:id/allocate | authenticate | allocatePayment |
| POST | /payments/:id/allocate | authenticate | allocatePayment |
| GET | /receipts/:id/allocations | authenticate | getPaymentAllocations |
| GET | /payments/:id/allocations | authenticate | getPaymentAllocations |
| GET | /open-items/aging | authenticate | getOpenItemAging |
| GET | /customers/:customerId/open-items | authenticate | getCustomerOpenItems |
| DELETE | /allocations/:allocationId | authenticate | removePaymentAllocation |

##### cashbookAdditionalRoutes.ts — NOT MOUNTED
Four of these handlers are live through cashbookRoutes: reference/next, reference/configure, POST templates, discounts/calculate. All the others, including `BankReconciliationController.performAutomaticMatching` and `getReconciliationMismatches`, are unreachable in production. Internal shadowing: `/templates/search` and `/templates/frequent` come after `/templates/:id`.

| Method | Path (relative) | Guards | Handler |
|---|---|---|---|
| GET | /reference/next | authenticate | ReferenceNumberController.getNextReference |
| POST | /reference/configure | authenticate | configureReference |
| GET | /reference/settings | authenticate | getReferenceSettings |
| POST | /reference/reset | authenticate | resetReference |
| POST | /reference/validate | authenticate | validateReference |
| POST | /templates | authenticate | TemplateController.createTemplate |
| GET | /templates | authenticate | getTemplates |
| GET | /templates/:id | authenticate | getTemplate |
| PUT | /templates/:id | authenticate | updateTemplate |
| DELETE | /templates/:id | authenticate | deleteTemplate |
| GET | /templates/search | authenticate | searchTemplates (shadowed) |
| GET | /templates/frequent | authenticate | getFrequentTemplates (shadowed) |
| POST | /templates/:id/apply | authenticate | applyTemplate |
| POST | /discounts/calculate | authenticate | DiscountController.calculateDiscount |
| GET | /discounts/customer/:customerId | authenticate | getCustomerDiscount |
| GET | /discounts/supplier/:supplierId | authenticate | getSupplierDiscount |
| POST | /discounts | authenticate | createDiscountConfig |
| PUT | /discounts/:id | authenticate | updateDiscountConfig |
| DELETE | /discounts/:id | authenticate | deleteDiscountConfig |
| GET | /discounts | authenticate | getAllDiscountConfigs |
| GET | /discounts/summary | authenticate | getDiscountSummary |
| POST | /reconciliation/statements | authenticate | BankReconciliationController.createBankStatement |
| GET | /reconciliation/status/:bankId | authenticate | getReconciliationStatus |
| POST | /reconciliation/match/:statementId | authenticate | performAutomaticMatching |
| GET | /reconciliation/mismatches/:statementId | authenticate | getReconciliationMismatches |
| POST | /reconciliation/mismatches/:mismatchId/resolve | authenticate | resolveMismatch |
| POST | /reconciliation/mark/:transactionId | authenticate | markTransactionReconciled |
| POST | /reconciliation/complete/:statementId | authenticate | completeReconciliation |
| GET | /reconciliation/report/:statementId | authenticate | getReconciliationReport |

Note: these param names (`mismatchId`, `transactionId`, `statementId`) are the ones the BankReconciliation handlers expect. The mounted `bankReconciliationRoutes` uses different names, which explains the broken routes flagged above.

##### cashbookImportRoutes.ts — NOT MOUNTED
| Method | Path (relative) | Guards | Handler |
|---|---|---|---|
| POST | /upload | authenticate, upload.single('file') (CSV, 10 MB) | CashbookImportController.uploadImportFile |
| GET | /batch/:batchId | authenticate | getImportBatch |
| GET | /batches | authenticate | listImportBatches |
| GET | /download/:batchId | authenticate | downloadImportFile |
| DELETE | /cleanup | authenticate | cleanupOldImports |
| GET | /template | authenticate | getImportTemplate |

##### batchImportExportRoutes.ts — IMPORTED at app.ts:688 but NOT MOUNTED
| Method | Path (relative) | Guards | Handler |
|---|---|---|---|
| POST | /import | authenticate, upload.single('file') (CSV, 10 MB) | BatchImportExportController.importBatch |
| GET | /:batchId/export | authenticate | exportBatch |
| GET | /import/:batchId/status | authenticate | getImportStatus |
| GET | /:batchId/exports | authenticate | getExportHistory |
| DELETE | /:batchId | authenticate | deleteBatch |
| GET | /:batchId/export/:exportId/download | authenticate | downloadExport |

#### Totals for §3.1

Route definitions per mounted router (AUTH-ONLY / NO-AUTH counted per definition):

| Router | Mount | Routes | AUTH-ONLY | NO-AUTH | Permission/role-guarded |
|---|---|---|---|---|---|
| journalEntryRoutes | /api/accounting/journal-entries | 9 | 9 | 0 | 0 |
| chartOfAccountsRoutes | /api/accounting/chart-of-accounts | 8 | 8 | 0 | 0 |
| glLedgerDetailRoutes | /api/accounting/gl-ledger-detail | 2 | 2 | 0 | 0 |
| trialBalanceRoutes | /api/accounting/trial-balance | 3 | 3 | 0 | 0 |
| recurringJournalRoutes | /api/accounting/recurring-journal-templates | 5 | 5 | 0 | 0 |
| fiscalCalendarRoutes | /api/accounting/fiscal-calendar | 6 | 0 | 0 | 6 |
| accountingCloseTaskRoutes | /api/accounting/close-tasks | 4 | 0 | 0 | 4 |
| periodLockoutRoutes | /api/cashbook/periods | 5 | 5 | 0 | 0 |
| currencyRoutes | /api/accounting/currencies | 7 | 7 | 0 | 0 |
| multiCurrencyRoutes | /api/accounting/multi-currency | 13 | 13 | 0 | 0 |
| exchangeRateDisplayRoutes | /api/exchange-rate-display | 8 | 3 | 0 | 5 |
| exchangeRateDisplayCronRoutes | /api/cron/exchange-rate-display | 1 | 0 | 1 | 0 |
| bankReconciliationRoutes | /api/accounting/bank-reconciliation | 15 | 15 | 0 | 0 |
| cashbookBatchImportRoutes | /api/cashbook/batches | 8 | 8 | 0 | 0 |
| openItemMatchingRoutes | /api/cashbook/open-items | 6 | 6 | 0 | 0 |
| transactionReversalRoutes | /api/cashbook/transactions + /api/cashbook/reversals | 4 (8 endpoints) | 4 (8) | 0 | 0 |
| cashbookTransferRoutes | /api/cashbook/transfers | 4 | 4 | 0 | 0 |
| cashbookRoutes-Enhanced | /api/cashbook | 20 | 20 | 0 | 0 |
| cashbookRoutes | /api/cashbook | 30 | 30 | 0 | 0 |
| contraEntryRoutes | /api/cashbook/contra | 5 | 5 | 0 | 0 |
| entryTypeRoutes | /api/cashbook/entry-types | 8 | 8 | 0 | 0 |
| accountingDashboardRoutes | /api/accounting/dashboard | 1 | 0 | 0 | 1 |
| accountingDocumentRoutes | /api/accounting/documents | 2 | 0 | 0 | 2 |
| accountingApiRoutes | /accounting/api | 1 | 1 | 0 | 0 |
| accountingPeIntegrationV1Routes | /api/accounting/v1 | 3 | 0 | 0 | 3 |

- **Total mounted route definitions: 178** (182 reachable method+path endpoints, counting transactionReversalRoutes' double mount).
  - Of these, 8 definitions are shadowed or unreachable: currencies `GET /default`; entry-types `GET /statistics`; cashbookRoutes `GET /batches`, `GET /batches/:id`, `POST /batches/:id/post`, `GET /entries`; and cashbookRoutes `/batches/import`, `/batches/:id/export`, `/batches/export/all` (shadowed by identical handlers). Separately, 6 bank-reconciliation routes are wired to handlers that read the wrong param name.
- **AUTH-ONLY: 156 definitions** (160 endpoints). **NO-AUTH: 1** (`POST /api/cron/exchange-rate-display/snapshot-refresh`).
- **Permission/role-guarded: 21 definitions**: 10 with `requirePermission`/`requireAnyPermission`, 5 with `requireExchangeRateDisplayAdmin`, 6 with legacy `authorize(roles)`.
- Unmounted router files: controlAccountRoutes (4), openItemRoutes (9), cashbookAdditionalRoutes (29), cashbookImportRoutes (6), batchImportExportRoutes (6) = **54 dead route definitions**.

**Distinct permission keys used in route guards (4):**
- `accounting.period_lock.view`
- `accounting.period_lock.manage`
- `accounting.period_lock.audit_view`
- `manage_accounting`

Also relevant: `manage_ledger` is enforced inside `JournalEntryService.postJournalEntry` (not in a route guard). `view_accounting` and `view_financial_reports` are consulted by the CFO legacy-authorize bypass.

**Roles used in `authorize(...)`:** admin, accountant, finance_manager, ceo, fund_manager, investments_manager, cfo. Separately, `requireExchangeRateDisplayAdmin` accepts CFO/FIN_MGR/FIN_MANAGER/FINANCE_MANAGER or any "admin" role signal.

##### Highest-risk findings (summary)
1. `POST /api/cashbook/periods/lock` (AUTH-ONLY) can **lock or unlock the GL+BANK period** directly. This bypasses the `accounting.period_lock.manage` permission and the close-task gate on `/api/accounting/fiscal-calendar`.
2. `PATCH /api/accounting/journal-entries/:id/void` (AUTH-ONLY) lets anyone void a POSTED JE (and auto-create a POSTED reversal). There is no permission, maker-checker or period-lock check.
3. Several AUTH-ONLY routes create **POSTED JEs directly**, bypassing the maker-checker enforced on `/journal-entries/:id/post`: recurring-journal `/:id/run` and `/run-due` (no period-lock check either), cashbook `/receipts` and `/payments`, `/api/cashbook/batches/:batchId/post`, transfers, reversals, and multi-currency `/payments`, `/post-forex-gain-loss` and `/banks/:bankId/revalue`.
4. COA create, bulk-import and hard-delete, currency CRUD/default, bank-account CRUD, and exchange-rate CRUD (hard delete) are AUTH-ONLY master-data writes. Because `authenticate` does not reject external-portal (investee/LP/applicant) tokens, those accounts can also call every AUTH-ONLY route.
5. `POST /api/cashbook/reconciliation/seed-five-unreconciled` is a data-seeding endpoint live in every environment.
6. `POST /api/cron/exchange-rate-display/snapshot-refresh` has no auth and no secret.
7. The bank-reconciliation router has 6 routes with param-name mismatches (approve-match, manual-reconcile, results/:id/reject, :id/audit-trail, :id/report, DELETE :id → `completeReconciliation`) and one mislabelled route (`create-journal` → `createBankStatement`).

### 3.2 Sub-ledgers, statements, tax, budgets, approvals

#### Payables / bills / payments
##### vendorRoutes.ts — mount `/api/accounting/vendors`
Router-level guards: `authenticate`, `requireInternalStaffUser()`. Permission keys come from `PROCUREMENT_PERMISSIONS` (`procurement.vendors.*`). The KYC upload uses `uploadKyc.single("file")` (multer). No GL posting anywhere in this router.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/vendors/for-rfq | authenticate, staff — **AUTH-ONLY** | `listVendorsForRfq`: vendors eligible for an RFQ picker (`VendorProcurementListService`). No GL. |
| GET | /api/accounting/vendors/status-options | authenticate, staff, perm-any[procurement.vendors.view] | Lifecycle status options plus expiry notice days. No GL. |
| GET | /api/accounting/vendors/document-settings | authenticate, staff, perm-any[procurement.vendors.view] | Reads `VendorDocumentUploadSettings.expiryNoticeDays`. No GL. |
| PUT | /api/accounting/vendors/document-settings | authenticate, staff, perm-any[procurement.vendors.manage] | Upserts `VendorDocumentUploadSettings` and writes an audit log entry. No GL. |
| POST | /api/accounting/vendors/compliance-cycle | authenticate, staff, perm-any[procurement.vendors.manage] | `VendorComplianceJobService.runCycle()`: expiry and lapse sweep. No GL. |
| PUT | /api/accounting/vendors/kyc-documents/:documentId | authenticate, staff, perm-any[procurement.vendors.manage] | `VendorKycService.updateMeta` plus audit log. No GL. |
| POST | /api/accounting/vendors/:id/status | authenticate, staff, perm-any[procurement.vendors.manage, procurement.vendors.approve] | `VendorLifecycleService.transition`. No GL. |
| GET | /api/accounting/vendors/pending-review | authenticate, staff, perm-any[procurement.vendors.view] | Lists self-registered vendors awaiting review. No GL. |
| GET | /api/accounting/vendors/kyc-documents/:documentId/download | authenticate, staff, perm-any[procurement.vendors.view] | Streams the decrypted KYC file. No GL. |
| PUT | /api/accounting/vendors/:id/approve-registration | authenticate, staff, perm-any[procurement.vendors.approve] | Approves a pending self-registration and emails the vendor. No GL. |
| PUT | /api/accounting/vendors/:id/decline-registration | authenticate, staff, perm-any[procurement.vendors.approve] | Declines the registration and emails the vendor. No GL. |
| POST | /api/accounting/vendors/:id/blacklist | authenticate, staff, perm-any[procurement.vendors.approve] | Lifecycle transition to BLOCKED. No GL. |
| POST | /api/accounting/vendors/:id/unblacklist | authenticate, staff, perm-any[procurement.vendors.approve] | Lifecycle transition to APPROVED. No GL. |
| POST | /api/accounting/vendors/:id/banks | authenticate, staff, perm-any[procurement.vendors.banks.manage] | `VendorBankService.create`. No GL. |
| GET | /api/accounting/vendors/:id/banks | authenticate, staff, perm-any[procurement.vendors.banks.view] | Lists the vendor's bank accounts. No GL. |
| PUT | /api/accounting/vendors/:id/banks/:bankId | authenticate, staff, perm-any[procurement.vendors.banks.manage] | `VendorBankService.update`. No GL. |
| POST | /api/accounting/vendors/:id/kyc-documents | authenticate, staff, perm-any[procurement.vendors.manage], uploadKyc.single("file") | Encrypted KYC upload plus audit log. No GL. |
| GET | /api/accounting/vendors/:id/kyc-documents | authenticate, staff, perm-any[procurement.vendors.view] | Lists KYC documents. No GL. |
| POST | /api/accounting/vendors/ | authenticate, staff, perm-any[procurement.vendors.manage] | Creates a vendor: duplicate check, vendorCode, gate refresh, audit log. No GL. |
| GET | /api/accounting/vendors/ | authenticate, staff — **AUTH-ONLY** | `getVendors`: list with compliance summary. The handler strips bank details unless the user has `procurement.vendors.banks.view` or is admin/CFO. No GL. |
| GET | /api/accounting/vendors/:id | authenticate, staff — **AUTH-ONLY** | Vendor detail plus PO, invoice and quotation counts. Bank details are stripped in the handler unless the user has banks.view. No GL. |
| PUT | /api/accounting/vendors/:id | authenticate, staff, perm-any[procurement.vendors.manage] | Updates the vendor plus audit log. No GL. |
| DELETE | /api/accounting/vendors/:id | authenticate, staff, perm-any[procurement.vendors.manage] | Deactivates the vendor if it has linked POs, bills, expenses or cashbook rows. Otherwise hard-deletes the vendor and its banks, KYC and clarifications. No GL. |
| GET | /api/accounting/vendors/:id/expenses | authenticate, staff — **AUTH-ONLY** | Paged `expense` rows for the vendor. No GL. |

##### purchaseInvoiceRoutes.ts — mount `/api/accounting/purchase-invoices`
Router-level guards: none. Every route passes only `authenticate` inline, so **the whole router is AUTH-ONLY**.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/purchase-invoices/ | authenticate — **AUTH-ONLY** | `PurchaseInvoiceService.createPurchaseInvoice`: creates a DRAFT vendor bill after a duplicate vendor-reference check. **No GL.** |
| POST | /api/accounting/purchase-invoices/from-purchase-order | authenticate — **AUTH-ONLY** | `createVendorBillFromPurchaseOrder`: converts a PO or GRN into a DRAFT bill. **No GL.** |
| POST | /api/accounting/purchase-invoices/batch-pay | authenticate — **AUTH-ONLY** | `payInvoicesBatch`: pays several CREDIT bills together. A non-privileged user at or above `PAYMENT_APPROVAL_THRESHOLD_USD` gets a `PAYMENT_EXECUTION` ApprovalRequest instead (HTTP 202, or 503 if no approval config exists). Otherwise **GL: creates a `cashbookEntry` and a POSTED JE (Dr AP, Cr Bank) via `assignNextAuditIdAndCreateJournal`**. |
| GET | /api/accounting/purchase-invoices/ | authenticate — **AUTH-ONLY** | Paged bill list. No GL. |
| GET | /api/accounting/purchase-invoices/expense-accounts | authenticate — **AUTH-ONLY** | Expense-type CoA accounts for the submit dialog. No GL. |
| GET | /api/accounting/purchase-invoices/banks | authenticate — **AUTH-ONLY** | Bank list. No GL. |
| GET | /api/accounting/purchase-invoices/creditors-age-analysis | authenticate — **AUTH-ONLY** | `CreditorsAgeAnalysisService.generate({asOfDate})`: AP aging. No GL. |
| GET | /api/accounting/purchase-invoices/:id | authenticate — **AUTH-ONLY** | Bill detail including JE and payment JE rates. No GL. |
| PUT | /api/accounting/purchase-invoices/:id | authenticate — **AUTH-ONLY** | `updatePurchaseInvoice` (DRAFT edits). No GL. |
| DELETE | /api/accounting/purchase-invoices/:id | authenticate — **AUTH-ONLY** | Hard-deletes the bill. DRAFT only; writes an audit log. No GL. |
| POST | /api/accounting/purchase-invoices/:id/submit | authenticate — **AUTH-ONLY** | `submitInvoice`: payment method BANK, CASH or CREDIT. The three-way match blocks a bill more than 20% over its PO unless the user has `manage_accounting`, `manage_ledger` or `manage_financial_reports`. **GL: POSTED JE via `createJournalEntryWithAuditSequence`**, with no maker-checker. CREDIT: Dr Expense and VAT input, Cr AP. BANK/CASH also creates a cashbook payment via `CashbookService.createCashPayment` and rewrites its lines. |
| POST | /api/accounting/purchase-invoices/:id/pay | authenticate — **AUTH-ONLY** | `payInvoice`: pays a CREDIT bill. Uses the same threshold gate as batch-pay (`evaluateSinglePaymentThreshold` leading to a `PAYMENT_EXECUTION` ApprovalRequest). Otherwise **GL: `CashbookService.createCashPayment`** (Dr AP, Cr Bank; the payment JE is POSTED by the cashbook service). |

#### Receivables / invoices / credit notes / receipts
##### customerRoutes.ts — mount `/api/accounting/customers`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** Handlers call Prisma directly.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/customers/ | authenticate — **AUTH-ONLY** | `prisma.customer.create`, then `VcCacSyncService.recomputeAndPersist` (fire and forget). No GL. |
| GET | /api/accounting/customers/ | authenticate — **AUTH-ONLY** | Paged list. No GL. |
| GET | /api/accounting/customers/:id | authenticate — **AUTH-ONLY** | Customer detail with invoices, credit notes and cashbook entries plus their JE refs. No GL. |
| PUT | /api/accounting/customers/:id | authenticate — **AUTH-ONLY** | `prisma.customer.update`. No GL. |
| DELETE | /api/accounting/customers/:id | authenticate — **AUTH-ONLY** | Soft delete (`isActive=false`). No GL. |

##### invoiceRoutes.ts — mount `/api/accounting/invoices`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.**

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/invoices/ | authenticate — **AUTH-ONLY** | `InvoiceService.createInvoice`: creates a DRAFT invoice. **GL: PENDING JE via `JournalEntryService.createInvoiceJournalEntry`** (Dr Debtors, Cr Revenue and VAT). |
| GET | /api/accounting/invoices/ | authenticate — **AUTH-ONLY** | Paged list with USD and local equivalents. No GL. |
| GET | /api/accounting/invoices/debtors-age-analysis | authenticate — **AUTH-ONLY** | `DebtorsAgeAnalysisService.generate`: AR aging. No GL. |
| GET | /api/accounting/invoices/:id | authenticate — **AUTH-ONLY** | Invoice detail. No GL. |
| PUT | /api/accounting/invoices/:id | authenticate — **AUTH-ONLY** | `updateInvoice`. **GL: `createReversalInvoiceJournalEntry` plus a new `createInvoiceJournalEntry`**, both PENDING. |
| DELETE | /api/accounting/invoices/:id | authenticate — **AUTH-ONLY** | Soft delete. **GL: `createReversalInvoiceJournalEntry` only when the status is SENT or PARTIALLY_PAID.** A PAID invoice can be deleted with no reversal, and a DRAFT invoice's PENDING JE is not voided. |
| GET | /api/accounting/invoices/summary | authenticate — **AUTH-ONLY** | Intended to call `getInvoiceSummary`. **Unreachable: `GET /:id` is declared first, so this request resolves to getInvoiceById("summary").** |
| PATCH | /api/accounting/invoices/:id/send | authenticate — **AUTH-ONLY** | `sendInvoice`: DRAFT to SENT. **GL: posts the linked PENDING JE with `JournalEntryService.postJournalEntry(..., {user, allowCreatorPost:true})`**. That call still requires admin, CFO or `manage_ledger`. |
| PATCH | /api/accounting/invoices/:id/mark-as-paid | authenticate — **AUTH-ONLY** | `markAsPaid`: full or partial payment. **GL: PENDING JE via `createInvoicePaymentJournalEntry`**. No cashbook row is created. |
| PATCH | /api/accounting/invoices/:id/void | authenticate — **AUTH-ONLY** | `voidInvoice`: sets VOID. **GL: `createReversalInvoiceJournalEntry`.** |

##### creditNoteRoutes.ts — mount `/api/accounting/credit-notes`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.**

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/credit-notes/ | authenticate — **AUTH-ONLY** | `CreditNoteService.createCreditNote`: creates a DRAFT credit note. **GL: POSTED JE (Dr Revenue and VAT, Cr AR) in the same transaction via `assignNextAuditIdAndCreateJournal`**, with no maker-checker. |
| GET | /api/accounting/credit-notes/ | authenticate — **AUTH-ONLY** | Filtered list. No GL. |
| GET | /api/accounting/credit-notes/report | authenticate — **AUTH-ONLY** | `generateCreditNoteReport`. No GL. |
| GET | /api/accounting/credit-notes/dashboard/credit-note-dashboard | authenticate — **AUTH-ONLY** | Counts and aggregates from `creditNote`. No GL. |
| GET | /api/accounting/credit-notes/customer/:customerId | authenticate — **AUTH-ONLY** | The customer's credit notes. No GL. |
| POST | /api/accounting/credit-notes/:id/send | authenticate — **AUTH-ONLY** | DRAFT to SENT. No GL. |
| POST | /api/accounting/credit-notes/:id/apply | authenticate — **AUTH-ONLY** | `applyCreditNote`: SENT credit note applied to an invoice. Updates statuses and outstanding amounts only. **No GL**; the application JE is deprecated as a no-op. |
| GET | /api/accounting/credit-notes/:id | authenticate — **AUTH-ONLY** | Detail. No GL. |
| PUT | /api/accounting/credit-notes/:id | authenticate — **AUTH-ONLY** | DRAFT only. **The amount can change but the already-POSTED JE is not adjusted.** |
| DELETE | /api/accounting/credit-notes/:id | authenticate — **AUTH-ONLY** | DRAFT only, soft delete. **The POSTED JE from creation is not reversed.** |

##### statementRoutes.ts — mount `/api/accounting/statements`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** It persists `StatementOfAccount` rows and never touches the GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/statements/customer | authenticate — **AUTH-ONLY** | Generates statements for every customer. No GL. |
| POST | /api/accounting/statements/vendor | authenticate — **AUTH-ONLY** | Generates statements for every vendor. No GL. |
| POST | /api/accounting/statements/customer/:customerId | authenticate — **AUTH-ONLY** | Generates one customer statement. No GL. |
| POST | /api/accounting/statements/vendor/:vendorId | authenticate — **AUTH-ONLY** | Generates one vendor statement. No GL. |
| GET | /api/accounting/statements/ | authenticate — **AUTH-ONLY** | Paged list. No GL. |
| GET | /api/accounting/statements/:id | authenticate — **AUTH-ONLY** | Statement with its line items. No GL. |
| DELETE | /api/accounting/statements/:id | authenticate — **AUTH-ONLY** | Deletes the statement. No GL. |
| GET | /api/accounting/statements/customer | authenticate — **AUTH-ONLY** | **Unreachable: shadowed by `GET /:id`**, declared first. |
| GET | /api/accounting/statements/vendor | authenticate — **AUTH-ONLY** | **Unreachable: shadowed by `GET /:id`.** |
| GET | /api/accounting/statements/customer/:customerId | authenticate — **AUTH-ONLY** | The customer's statements. No GL. |
| GET | /api/accounting/statements/vendor/:vendorId | authenticate — **AUTH-ONLY** | The vendor's statements. No GL. |
| GET | /api/accounting/statements/dashboard/statement-dashboard | authenticate — **AUTH-ONLY** | Counts and recent statements. No GL. |
| GET | /api/accounting/statements/:statementId/format | authenticate — **AUTH-ONLY** | Formats the statement for print. No GL. |
| POST | /api/accounting/statements/:statementId/email | authenticate — **AUTH-ONLY** | **Stub.** `emailStatement` only logs the content to the console (`TODO: Integrate with actual email service`) and returns success. |

##### revenueRoutes.ts — mount `/api/accounting/revenues`
Router-level guards: none. Every route: `authenticate, authorize(["admin","accountant"])`.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/revenues/ | authenticate, authorize[admin,accountant] | `RevenueService.createRevenue`. **GL: PENDING JE via `JournalEntryService.createRevenueJournalEntry`.** |
| GET | /api/accounting/revenues/ | authenticate, authorize[admin,accountant] | Filtered list. No GL. |
| GET | /api/accounting/revenues/:id | authenticate, authorize[admin,accountant] | Detail. No GL. |
| PUT | /api/accounting/revenues/:id | authenticate, authorize[admin,accountant] | `updateRevenue`. **GL: `createReversalRevenueJournalEntry` plus a new `createRevenueJournalEntry`.** |
| DELETE | /api/accounting/revenues/:id | authenticate, authorize[admin,accountant] | Soft delete. **The linked JE is not reversed.** |

##### revenueSourceRoutes.ts — mount `/api/accounting/revenue-sources`
Router-level guards: none. Every route: `authenticate, authorize(["admin","accountant"])`. Direct Prisma CRUD on `revenueSource`. No GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/revenue-sources/ | authenticate, authorize[admin,accountant] | Create. No GL. |
| GET | /api/accounting/revenue-sources/ | authenticate, authorize[admin,accountant] | List. No GL. |
| GET | /api/accounting/revenue-sources/:id | authenticate, authorize[admin,accountant] | Get. No GL. |
| PUT | /api/accounting/revenue-sources/:id | authenticate, authorize[admin,accountant] | Update. No GL. |
| DELETE | /api/accounting/revenue-sources/:id | authenticate, authorize[admin,accountant] | Delete. No GL. |

##### revenueCategoryRoutes.ts — mount `/api/accounting/revenue-categories`
Router-level guards: none. Every route: `authenticate, authorize(["admin","accountant"])`. Direct Prisma CRUD on `revenueCategory`. No GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/revenue-categories/ | authenticate, authorize[admin,accountant] | Create. No GL. |
| GET | /api/accounting/revenue-categories/ | authenticate, authorize[admin,accountant] | List. No GL. |
| GET | /api/accounting/revenue-categories/:id | authenticate, authorize[admin,accountant] | Get. No GL. |
| PUT | /api/accounting/revenue-categories/:id | authenticate, authorize[admin,accountant] | Update. No GL. |
| DELETE | /api/accounting/revenue-categories/:id | authenticate, authorize[admin,accountant] | Delete. No GL. |

##### Receipts and quotations (cross-reference)
There is **no accounting sales-quotation router**. `vendorQuotationRoutes` and procurement `rfqs/.../quotations` belong to procurement. Customer receipts go through the cashbook:

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/cashbook/receipts (`cashbookRoutes.ts`; `/api/cashbook` is also mounted with `cashbookRoutes-Enhanced`, which has no `/receipts`) | authenticate (router-level) — **AUTH-ONLY** | `CashbookService.createCashReceipt`. **GL: POSTED JE (Dr Bank, Cr contra account) via `CashbookService.createJournalEntry`.** |

`openItemRoutes.ts` defines `POST /receipts/:id/allocate` and `GET /receipts/:id/allocations`, and `cashbookAdditionalRoutes.ts` defines reference settings. **Neither router is mounted in app.ts**, so those routes are dead code and not counted.

#### Expenses & claims
There is **no expense-claim or reimbursement router**. The only reimbursement endpoints are `payrollRoutes` `/employees/:id/reimbursement-vendor`, which belong to payroll.

##### expenseRoutes.ts — mount `/api/accounting/expenses`
Router-level guards: none. Every route: `authenticate` only, so **the whole router is AUTH-ONLY**.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/expenses/ | authenticate — **AUTH-ONLY** | `ExpenseService.createExpense`. **GL: PENDING JE via `JournalEntryService.createExpenseJournalEntry`.** Then runs a VC CAC sync. |
| GET | /api/accounting/expenses/ | authenticate — **AUTH-ONLY** | Paged list. No GL. |
| GET | /api/accounting/expenses/:id | authenticate — **AUTH-ONLY** | Detail. No GL. |
| PUT | /api/accounting/expenses/:id | authenticate — **AUTH-ONLY** | `updateExpense`. **GL: `createReversalJournalEntry` plus a new `createExpenseJournalEntry`.** |
| DELETE | /api/accounting/expenses/:id | authenticate — **AUTH-ONLY** | DRAFT: soft delete. POSTED: **GL: `createReversalJournalEntry`**, then soft delete. |
| GET | /api/accounting/expenses/summary | authenticate — **AUTH-ONLY** | Intended to call `getExpenseSummary`. **Unreachable: shadowed by `GET /:id`**, declared first. |
| POST | /api/accounting/expenses/calculate-vat | authenticate — **AUTH-ONLY** | VAT calculator using the active `VatRate`. No GL. |

##### expenseCategoryRoutes.ts — mount `/api/accounting/expense-categories`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** Direct Prisma on `expenseCategory`. No GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/expense-categories/ | authenticate — **AUTH-ONLY** | Create with a unique-name and parent check. No GL. |
| GET | /api/accounting/expense-categories/ | authenticate — **AUTH-ONLY** | List. No GL. |
| GET | /api/accounting/expense-categories/:id | authenticate — **AUTH-ONLY** | Get. No GL. |
| PUT | /api/accounting/expense-categories/:id | authenticate — **AUTH-ONLY** | Update. No GL. |
| DELETE | /api/accounting/expense-categories/:id | authenticate — **AUTH-ONLY** | Soft delete; blocked if the category has expenses or children. No GL. |
| GET | /api/accounting/expense-categories/:id/expenses | authenticate — **AUTH-ONLY** | The category's expenses. No GL. |

#### Fixed assets & depreciation
##### assetRoutes.ts — mount `/api/accounting/assets`
Router-level guards: `authenticate` applies **after** the first route. The cron route is declared before `router.use(authenticate)`.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/assets/depreciation/cron/monthly | **NO-AUTH (no JWT)** | `postMonthlyDepreciationCron`. The handler requires the `X-Depreciation-Cron-Secret` header to match `DEPRECIATION_CRON_SECRET`; if that env var is unset, it only accepts loopback callers. Acts as the first user whose firstName is "admin". **GL: `AssetService.postMonthlyDepreciation`, which runs `calculateDepreciation` and `postDepreciation` (POSTED JE).** |
| POST | /api/accounting/assets/ | authenticate — **AUTH-ONLY** | `AssetService.createAsset`. **GL: POSTED acquisition JE via `createAssetAcquisitionJournalEntry`, using `createJournalEntryWithAuditSequence`.** |
| GET | /api/accounting/assets/ | authenticate — **AUTH-ONLY** | Filtered list. No GL. |
| GET | /api/accounting/assets/register | authenticate — **AUTH-ONLY** | `getAssetRegister`. No GL. |
| GET | /api/accounting/assets/depreciation-schedule | authenticate — **AUTH-ONLY** | `getDepreciationSchedule` (reads `assetId` from the query). No GL. |
| GET | /api/accounting/assets/:id | authenticate — **AUTH-ONLY** | Asset detail with depreciation records. No GL. |
| PUT | /api/accounting/assets/:id | authenticate — **AUTH-ONLY** | `updateAsset`. No GL. |
| DELETE | /api/accounting/assets/:id | authenticate — **AUTH-ONLY** | Soft delete, refused while the asset is IN_USE. **The acquisition JE is not reversed.** |
| POST | /api/accounting/assets/:assetId/depreciation/backfill | authenticate — **AUTH-ONLY** | `backfillDepreciationToDate`. **GL when `autoPost` is set: POSTED JEs via raw `prisma.journalEntry.create`**, which bypasses the audit-sequence helper. |
| POST | /api/accounting/assets/:id/depreciation/backfill | authenticate — **AUTH-ONLY** | Alias with the same path shape. Express always matches the previous line, so this one never runs; harmless because the handler is the same. |
| POST | /api/accounting/assets/:assetId/depreciation | authenticate — **AUTH-ONLY** | `calculateDepreciation`: creates a `DepreciationRecord` only. No GL. |
| POST | /api/accounting/assets/:id/depreciate | authenticate — **AUTH-ONLY** | Alias of the above. No GL. |
| POST | /api/accounting/assets/depreciation/:depreciationId/post | authenticate — **AUTH-ONLY** | `postDepreciation`. **GL: POSTED JE (Dr Depreciation expense, Cr Accumulated depreciation) via `createJournalEntryWithAuditSequence`.** |
| POST | /api/accounting/assets/:assetId/dispose | authenticate — **AUTH-ONLY** | `disposeAsset`. **GL: POSTED disposal JE (gain or loss) via `assignNextAuditIdAndCreateJournal`** in a transaction. |
| POST | /api/accounting/assets/:id/dispose | authenticate — **AUTH-ONLY** | Alias with the same path shape; never runs, same handler. |
| GET | /api/accounting/assets/:assetId/depreciation-schedule | authenticate — **AUTH-ONLY** | Per-asset schedule. No GL. |
| GET | /api/accounting/assets/dashboard/asset-dashboard | authenticate — **AUTH-ONLY** | Counts and aggregates. No GL. |
| POST | /api/accounting/assets/depreciation/monthly | authenticate — **AUTH-ONLY** | `postMonthlyDepreciation`. **GL: calculates and posts POSTED JEs for every asset.** |
| POST | /api/accounting/assets/depreciation/annual | authenticate — **AUTH-ONLY** | `postAnnualDepreciation(year)`. **GL: creates records and runs `postDepreciation` (POSTED JE) per asset.** |
| POST | /api/accounting/assets/:id/revalue | authenticate — **AUTH-ONLY** | `revalueAsset`. **GL: POSTED JE via raw `prisma.journalEntry.create` in `createRevaluationJournalEntry`**, with no audit sequence. |
| GET | /api/accounting/assets/register/generate | authenticate — **AUTH-ONLY** | `generateAssetRegister`. No GL. |
| GET | /api/accounting/assets/depreciation-schedule/generate | authenticate — **AUTH-ONLY** | `generateDepreciationSchedule`. No GL. |

#### Inventory
##### inventoryRoutes.ts — mount `/api/accounting/inventory`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.**

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/inventory/settings | authenticate — **AUTH-ONLY** | `getInventorySettings` (`allowNegativeStock`). No GL. |
| PATCH | /api/accounting/inventory/settings | authenticate — **AUTH-ONLY** | `updateInventorySettings`: any user can toggle negative stock. No GL. |
| POST | /api/accounting/inventory/items | authenticate — **AUTH-ONLY** | `createInventoryItem`. No GL. |
| GET | /api/accounting/inventory/items | authenticate — **AUTH-ONLY** | Filtered list. No GL. |
| GET | /api/accounting/inventory/items/:id | authenticate — **AUTH-ONLY** | Item detail. No GL. |
| PUT | /api/accounting/inventory/items/:id | authenticate — **AUTH-ONLY** | `updateInventoryItem`. No GL. |
| DELETE | /api/accounting/inventory/items/:id | authenticate — **AUTH-ONLY** | `deleteInventoryItem`. No GL. |
| POST | /api/accounting/inventory/movements | authenticate — **AUTH-ONLY** | `recordStockMovement` (IN, OUT or ADJUSTMENT). **No GL.** |
| GET | /api/accounting/inventory/items/:itemId/movements | authenticate — **AUTH-ONLY** | Movement history. No GL. |
| GET | /api/accounting/inventory/valuation | authenticate — **AUTH-ONLY** | FIFO, LIFO or AVERAGE valuation. No GL. |
| GET | /api/accounting/inventory/reorder-alerts | authenticate — **AUTH-ONLY** | `getReorderLevelAlerts`. No GL. |
| GET | /api/accounting/inventory/reorder-levels | authenticate — **AUTH-ONLY** | Alias of reorder-alerts. No GL. |
| GET | /api/accounting/inventory/dashboard | authenticate — **AUTH-ONLY** | Dashboard aggregates. No GL. |
| POST | /api/accounting/inventory/sales-invoice | authenticate — **AUTH-ONLY** | `processSalesInvoice`: reduces stock. **GL: POSTED COGS JE (Dr COGS, Cr Inventory) via `createCOGSJournalEntry` and `createJournalEntryWithAuditSequence`.** |
| POST | /api/accounting/inventory/update-stock | authenticate — **AUTH-ONLY** | `updateStockQuantity`, which delegates to `recordStockMovement`. No GL. |
| POST | /api/accounting/inventory/calculate-cogs | authenticate — **AUTH-ONLY** | COGS calculator only. No GL. |
| GET | /api/accounting/inventory/report | authenticate — **AUTH-ONLY** | `generateInventoryReport`. No GL. |
| GET | /api/accounting/inventory/check-reorder-levels | authenticate — **AUTH-ONLY** | `checkReorderLevels`. No GL. |
| GET | /api/accounting/inventory/inventory-value | authenticate — **AUTH-ONLY** | `getInventoryValue(method)`. No GL. |
| POST | /api/accounting/inventory/adjustments | authenticate — **AUTH-ONLY** | `createInventoryAdjustment`. **No GL. Bug: it takes `Math.abs(quantity)` and always records an ADJUSTMENT, which `recordStockMovement` treats as stock IN, so a negative adjustment increases stock.** |

#### Short-term investments
##### shortTermInvestmentRoutes.ts — mount `/api/accounting/short-term-investments`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** The only role logic in any handler is the `isModulePrivilegedUser` check in `createInstrument`, which decides whether a large placement is queued for approval. All data lives in the DB.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/short-term-investments/settings | authenticate — **AUTH-ONLY** | Reads `ShortTermInvestmentSettings` (`postingMode` DRAFT or APPROVED, `fiscalTimezone`, watermark). No GL. |
| PATCH | /api/accounting/short-term-investments/settings | authenticate — **AUTH-ONLY** | `updateSettings`. **Any user can switch `postingMode` to APPROVED, after which every STI JE is created POSTED and maker-checker is skipped.** No GL itself. |
| GET | /api/accounting/short-term-investments/dashboard | authenticate — **AUTH-ONLY** | `getDashboard({asOfIso, broker})`: computed from the instrument, accrual and APY tables. No GL. |
| GET | /api/accounting/short-term-investments/instruments | authenticate — **AUTH-ONLY** | `prisma.shortTermInvestmentInstrument.findMany`. No GL. |
| POST | /api/accounting/short-term-investments/instruments | authenticate — **AUTH-ONLY** | `createInstrument`. A non-privileged user at or above `INVESTMENT_APPROVAL_THRESHOLD_USD` gets an `INVESTMENT_BOOKING` ApprovalRequest instead (HTTP 202, or 503 without config). Otherwise **GL: placement JE via `createJournalEntryWithAuditSequence`** (Dr STI principal, Cr Bank), POSTED if `postingMode` is APPROVED and PENDING otherwise. |
| GET | /api/accounting/short-term-investments/instruments/:id | authenticate — **AUTH-ONLY** | Instrument with accruals, APY history and audit logs. No GL. |
| PATCH | /api/accounting/short-term-investments/instruments/:id | authenticate — **AUTH-ONLY** | Edits an ACTIVE instrument: name, category, broker, maturity, currency, FX GL accounts, day-count (locked after the first accrual). Audit log. No GL. |
| DELETE | /api/accounting/short-term-investments/instruments/:id | authenticate — **AUTH-ONLY** | **Always returns 405** ("use /void"). |
| POST | /api/accounting/short-term-investments/instruments/:id/apy-rates | authenticate — **AUTH-ONLY** | `appendApyRate` (effective-dated). No GL. |
| POST | /api/accounting/short-term-investments/instruments/:id/catch-up | authenticate — **AUTH-ONLY** | `catchUpAccruals`. **GL: one accrual JE per day via `createAccrualJournalInTx`** (`assignNextAuditIdAndCreateJournal`; Dr Accrued interest, Cr Interest income), POSTED or PENDING according to `postingMode`. |
| POST | /api/accounting/short-term-investments/instruments/:id/liquidate | authenticate — **AUTH-ONLY** | `liquidateInstrument`. **GL: settlement JE via `assignNextAuditIdAndCreateJournal`, plus a realized-FX JE via `createJournalEntryWithAuditSequence`.** |
| POST | /api/accounting/short-term-investments/instruments/:id/void | authenticate — **AUTH-ONLY** | `voidInstrument`. **GL: `JournalEntryService.voidJournalEntry` on the placement, accrual and liquidation JEs.** |
| POST | /api/accounting/short-term-investments/instruments/:id/accruals/approve-all | authenticate — **AUTH-ONLY** | `approveAllPendingAccrualJournalsForInstrument`, which calls `approveAccrualJournal` in a loop. **GL: `postJournalEntry`.** **Likely always fails: `postJournalEntry` is called without `options.user`, so the admin, CFO or `manage_ledger` authority check throws.** Not tested at runtime. |
| POST | /api/accounting/short-term-investments/accruals/:instrumentId/approve-all | authenticate — **AUTH-ONLY** | Alias of the above. |
| POST | /api/accounting/short-term-investments/accruals/:accrualId/approve | authenticate — **AUTH-ONLY** | `approveAccrualJournal`: calls `postJournalEntry(jeId, userId)` without the user. **Same likely failure.** |
| POST | /api/accounting/short-term-investments/fx/month-end-revaluation | authenticate — **AUTH-ONLY** | `runMonthEndRevaluation({yearMonth})`. **GL: unrealized-FX JE via `createJournalEntryWithAuditSequence`**, plus a `ShortTermInvestmentFxRevaluation` row. |

**Other STI touchpoints found in the search** (`investment`, `placement`, `treasury`, `money market`, `deposit`, `sti`, `ShortTerm`):
- `controllers/AuthController.ts:216`: **every staff login calls `ShortTermInvestmentService.maybeRunDailyAccrualAfterLogin`**, which runs `runDailyAccrualJob` and creates accrual JEs. There is no cron route; login is the scheduler. The cooldown only applies if `STI_LOGIN_ACCRUAL_COOLDOWN_MS` is set.
- `services/ApprovalService.ts:995` has the `INVESTMENT_BOOKING` case. On approval, `PaymentInvestmentApprovalService.applyApprovedInvestmentBooking` calls `ShortTermInvestmentService.createInstrument`. The approval is reached through `/api/approvals/:id/approve`.
- `services/AccountingDashboardService.ts:1586-1595` reads the STI dashboard and instruments into the accounting dashboard at `/api/accounting/dashboard`.
- `BalanceSheetService.ts:145`, `CashFlowCategorizationService.ts:19,107` and `AccountingDashboardService.ts:1045` classify GL accounts by name (`"money market"`) as cash equivalents or investments.
- `config/financialReportFormSchemas.ts:83`, `utils/reportingDerivedKpis.ts:109` and `services/investmentMonitoringKpiCompute.ts:153` handle a `shortTermInvestments` field in investee financial-report forms. That is portfolio-company reporting, not the STI module.
- `config/short-term-investments-endpoints.ts` holds Swagger docs only.
- No "treasury", "fixed deposit" or "term deposit" router or service exists. `investmentOps*`, `listedEquity*` and `/api/investments/*` cover the listed-equity and portfolio investment domain and are not STI.
- Prisma models: `ShortTermInvestmentSettings`, `ShortTermInvestmentInstrument` (six GL account FKs to `ChartOfAccounts`), `ShortTermInvestmentApyRate`, `ShortTermInvestmentAccrual` (`journalEntryId`, status `PENDING_POST` or `POSTED`) and `ShortTermInvestmentFxRevaluation` (`journalEntryId`). **Everything persists; there is no mock data.**

#### Financial statements & consolidation
All of these routers are read-only computations over `journalEntryLine` and `chartOfAccounts`, with `exchangeRate` for consolidation. The income statement's budget variance reads `prisma.budget`. **No GL writes.** Guards on every route: `authenticate, authorize(["admin","accountant"])`, which a CFO with `view_accounting` also passes. There are no router-level guards.

##### incomeStatementRoutes.ts — mount `/api/accounting/income-statement`
| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/income-statement/generate | authenticate, authorize[admin,accountant] | `generateIncomeStatement`. No GL. |
| GET | /api/accounting/income-statement/with-budget-variance | authenticate, authorize[admin,accountant] | `generateIncomeStatementWithBudgetVariance` (reads `budget`). No GL. |
| POST | /api/accounting/income-statement/with-budget-variance | authenticate, authorize[admin,accountant] | Same as the GET. No GL. |
| POST | /api/accounting/income-statement/detailed | authenticate, authorize[admin,accountant] | `getDetailedIncomeStatement`. No GL. |
| POST | /api/accounting/income-statement/summary | authenticate, authorize[admin,accountant] | `getIncomeStatementSummary`. No GL. |
| POST | /api/accounting/income-statement/comprehensive | authenticate, authorize[admin,accountant] | `getComprehensiveDetailedIncomeStatement`. No GL. |
| POST | /api/accounting/income-statement/comparative | authenticate, authorize[admin,accountant] | `getComparativeIncomeStatement`. No GL. |
| GET | /api/accounting/income-statement/comparative/this-month-vs-last-month | authenticate, authorize[admin,accountant] | Comparative for this month against last month. No GL. |
| POST | /api/accounting/income-statement/vertical | authenticate, authorize[admin,accountant] | `getVerticalIncomeStatement`. No GL. |
| GET | /api/accounting/income-statement/ | authenticate, authorize[admin,accountant] | Query-driven: summary, detailed or standard. No GL. |
| POST | /api/accounting/income-statement/consolidated | authenticate, authorize[admin,accountant] | `ConsolidatedReportService.generateConsolidatedIncomeStatement` (forecast entities plus FX). No GL. |

##### cashFlowRoutes.ts — mount `/api/accounting/cash-flow`
| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/cash-flow/generate | authenticate, authorize[admin,accountant] | `CashFlowService.generateCashFlowStatement`. No GL. |
| POST | /api/accounting/cash-flow/detailed | authenticate, authorize[admin,accountant] | Detailed. No GL. |
| POST | /api/accounting/cash-flow/summary | authenticate, authorize[admin,accountant] | Summary. No GL. |
| POST | /api/accounting/cash-flow/comprehensive | authenticate, authorize[admin,accountant] | Comprehensive. No GL. |
| POST | /api/accounting/cash-flow/comparative | authenticate, authorize[admin,accountant] | Comparative. No GL. |
| GET | /api/accounting/cash-flow/ | authenticate, authorize[admin,accountant] | Query-driven variant. No GL. |

##### balanceSheetRoutes.ts — mount `/api/accounting/balance-sheet`
| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/balance-sheet/generate | authenticate, authorize[admin,accountant] | `BalanceSheetService.generateBalanceSheet`. No GL. |
| GET | /api/accounting/balance-sheet/ | authenticate, authorize[admin,accountant] | Same, driven by the query (`hideZeroBalances`). No GL. |
| POST | /api/accounting/balance-sheet/consolidated | authenticate, authorize[admin,accountant] | `ConsolidatedReportService.generateConsolidatedBalanceSheet`. No GL. |

##### statementOfEquityRoutes.ts — mount `/api/accounting/statement-of-equity`
| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/accounting/statement-of-equity/generate | authenticate, authorize[admin,accountant] | `StatementOfEquityService.generateStatementOfEquity` (journal lines on equity accounts). No GL. |

##### consolidationRoutes.ts — mount `/api/accounting/consolidation`
| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/consolidation/summary | authenticate, authorize[admin,accountant] | `BalanceSheetController.getConsolidationSummary`, which calls `ConsolidatedReportService.getConsolidationSummary`. No GL. |

#### Tax / VAT
##### vatReportRoutes.ts — mount `/api/vat`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.**

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/vat/report | authenticate — **AUTH-ONLY** | `VATReportService.generateVATReport`: VAT input and output from `journalEntryLine` on the VAT CoA accounts. Writes an audit log entry. No GL. |
| GET | /api/vat/report/output-tax-audit | authenticate — **AUTH-ONLY** | `getVATOutputAuditTrail`. No GL. |

##### vatRateRoutes.ts — mount `/api/accounting/vat-rates`
**Note: app.ts mounts this router once (line 894), not twice.** Router-level guards: `authenticate`. Every route adds `authorize(["admin","finance_manager","ceo"])`. Direct Prisma on `vatRate`; each write refreshes the cache with `VATService.refreshActiveVatRate(true)`. No GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/vat-rates/ | authenticate, authorize[admin,finance_manager,ceo] | List. No GL. |
| GET | /api/accounting/vat-rates/active | authenticate, authorize[admin,finance_manager,ceo] | Active rate. No GL. |
| POST | /api/accounting/vat-rates/ | authenticate, authorize[admin,finance_manager,ceo] | Create. No GL. |
| PUT | /api/accounting/vat-rates/:id | authenticate, authorize[admin,finance_manager,ceo] | Update. No GL. |
| POST | /api/accounting/vat-rates/:id/set-active | authenticate, authorize[admin,finance_manager,ceo] | Switch the active rate. No GL. |
| DELETE | /api/accounting/vat-rates/:id | authenticate, authorize[admin,finance_manager,ceo] | Hard delete. No GL. |

##### taxReturnPackRoutes.ts — mount `/api/tax-return-packs`
Router-level guards: `authenticate`, `authorize(["admin","fund_manager","cfo","analyst"])`. Per-route middleware comes from `middleware/taxReturnPackAuth.ts`:
- `requireTaxReturnPackView` loads the pack and calls `assertCanView`: admin, a tax officer (CFO, fund manager, or a tax, tax officer or accountant role signal), a checker, or a fund manager of that fund.
- `requireTaxReturnPackCompile`: admin or a tax officer.
- `requireTaxReturnPackApprove`: a checker (admin, CFO, or a managing partner or checker role signal) who is not the maker.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/tax-return-packs/ | authenticate, authorize[gpRoles] | `TaxReturnPackProvisionService.list`. If `fundId` is given, the handler calls `assertCanView`. No GL. |
| POST | /api/tax-return-packs/ | authenticate, authorize[gpRoles], requireTaxReturnPackCompile | `provision`: creates the pack. No GL. |
| GET | /api/tax-return-packs/:packId | authenticate, authorize[gpRoles], requireTaxReturnPackView | Pack detail. No GL. |
| GET | /api/tax-return-packs/:packId/dashboard | authenticate, authorize[gpRoles], requireTaxReturnPackView | Dashboard. No GL. |
| POST | /api/tax-return-packs/:packId/compile | authenticate, authorize[gpRoles], requireTaxReturnPackView, requireTaxReturnPackCompile | `TaxReturnPackCompileService.compile` (SAF-T and WHT compile services). No GL. |
| GET | /api/tax-return-packs/:packId/reconciliation | authenticate, authorize[gpRoles], requireTaxReturnPackView | Reconciliation lines. No GL. |
| PATCH | /api/tax-return-packs/:packId/reconciliation/:lineId | authenticate, authorize[gpRoles], requireTaxReturnPackView, requireTaxReturnPackCompile | `overrideLine`. No GL. |
| GET | /api/tax-return-packs/:packId/cgt | authenticate, authorize[gpRoles], requireTaxReturnPackView | CGT schedule. No GL. |
| POST | /api/tax-return-packs/:packId/submit-review | authenticate, authorize[gpRoles], requireTaxReturnPackView, requireTaxReturnPackCompile | `TaxReturnPackApprovalService.submitReview`. No GL. |
| POST | /api/tax-return-packs/:packId/sign-off | authenticate, authorize[gpRoles], requireTaxReturnPackView, requireTaxReturnPackApprove | `signOff`. **GL: `TaxReturnPackGlPostingService.postTaxAccrual`, which calls `JournalEntryService.createManualJournalEntry` (a PENDING tax accrual JE).** |
| GET | /api/tax-return-packs/:packId/pdf | authenticate, authorize[gpRoles], requireTaxReturnPackView | Renders the PDF. No GL. |
| GET | /api/tax-return-packs/:packId/audit | authenticate, authorize[gpRoles], requireTaxReturnPackView | `TaxReturnPackAuditService.list`. No GL. |

#### Projects & timesheets
##### projectRoutes.ts — mount `/api/accounting/projects`
Router-level guards: `authenticate`. VIEW_OR_MANAGE = `accounting.timesheets.view`, `accounting.timesheets.manage`, `manage_accounting`. MANAGE_ONLY = `accounting.timesheets.manage`, `manage_accounting`.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/projects/ | authenticate, perm-any[VIEW_OR_MANAGE] | `ProjectService.listProjects`. No GL. |
| POST | /api/accounting/projects/ | authenticate, perm-any[MANAGE_ONLY] | `createProject`. No GL. |
| PUT | /api/accounting/projects/:id | authenticate, perm-any[MANAGE_ONLY] | `updateProject`. No GL. |

##### timesheetRoutes.ts — mount `/api/accounting/timesheets`
Router-level guards: `authenticate`. SELF_SERVICE = the same three keys as VIEW_OR_MANAGE; MANAGE_ONLY as above. No GL anywhere: approving a timesheet only sets its status.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/accounting/timesheets/mine | authenticate, perm-any[SELF_SERVICE] | The caller's own timesheets. No GL. |
| GET | /api/accounting/timesheets/pending-approval | authenticate, perm-any[MANAGE_ONLY] | `listPendingApproval`, limited by the approver's department reach. No GL. |
| GET | /api/accounting/timesheets/team | authenticate, perm-any[MANAGE_ONLY] | `listForManager`. No GL. |
| POST | /api/accounting/timesheets/:weekEnding/entries | authenticate, perm-any[SELF_SERVICE] | `getOrCreateTimesheet` plus `upsertEntry`. No GL. |
| DELETE | /api/accounting/timesheets/entries/:entryId | authenticate, perm-any[SELF_SERVICE] | `deleteEntry` (owner only). No GL. |
| POST | /api/accounting/timesheets/:id/submit | authenticate, perm-any[SELF_SERVICE] | `submitTimesheet`. No GL. |
| POST | /api/accounting/timesheets/:id/approve | authenticate, perm-any[MANAGE_ONLY] | `approveTimesheet`: SUBMITTED to APPROVED, checks approver reach. No GL. |
| POST | /api/accounting/timesheets/:id/return | authenticate, perm-any[MANAGE_ONLY] | `returnTimesheet`: sets RETURNED with a reason. No GL. |

#### Budgets
##### budgetManagementRoutes.ts — mount `/api/budget-management`
Router-level guards: none. Writes use `authenticate, authorize(["admin","ceo","cfo"])`. `BudgetManagementService` uses the `Budget`, `BudgetItem` and `VarianceReport` Prisma models. No GL.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/budget-management/ | authenticate, authorize[admin,ceo,cfo] | `createBudget`. No GL. |
| GET | /api/budget-management/ | authenticate — **AUTH-ONLY** | `getAllBudgets`. No GL. |
| GET | /api/budget-management/:id | authenticate — **AUTH-ONLY** | `getBudgetById`. No GL. |
| PUT | /api/budget-management/:id | authenticate, authorize[admin,ceo,cfo] | `updateBudget`. No GL. |
| DELETE | /api/budget-management/:id | authenticate, authorize[admin,ceo,cfo] | `deleteBudget`. No GL. |
| POST | /api/budget-management/:budgetId/items | authenticate, authorize[admin,ceo,cfo] | `createBudgetItem`. No GL. |
| GET | /api/budget-management/:budgetId/items | authenticate — **AUTH-ONLY** | `getBudgetItems`. No GL. |
| PUT | /api/budget-management/items/:id | authenticate — **AUTH-ONLY (write)** | `updateBudgetItem`. **Any logged-in user can change budget line amounts.** No GL. |
| DELETE | /api/budget-management/items/:id | authenticate, authorize[admin,ceo,cfo] | `deleteBudgetItem`. No GL. |
| POST | /api/budget-management/variance-reports | authenticate, authorize[admin,ceo,cfo] | `createVarianceReport`. No GL. |
| GET | /api/budget-management/variance-reports | authenticate — **AUTH-ONLY** | **Unreachable: shadowed by `GET /:id`**, declared first; resolves to getBudgetById("variance-reports"). |
| GET | /api/budget-management/analytics/summary | authenticate — **AUTH-ONLY** | `getBudgetAnalytics`. No GL. |

##### Other budget routes (from a grep of `budget` in src/routes)

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/procurement/budgets | authenticate, staff, read-only-profile guard — **AUTH-ONLY** | `ProcurementRequisitionFlowController.budgets`: `ProcurementBudget` lines with committed and available amounts. No GL. |
| POST | /api/procurement/budgets | authenticate, staff, read-only-profile guard — **AUTH-ONLY** (the handler refuses anyone who is not admin or CFO) | `saveBudget`: creates a `procurementBudget`. No GL. |
| PUT | /api/procurement/budgets/:id | same as the POST — **AUTH-ONLY** (admin or CFO check in the handler) | `saveBudget`: updates it. No GL. |
| GET/POST/PATCH/PUT (27 routes) | /api/v1/fpa/budget-cycles, /budget-cycles/:id, and `/budget-cycles/:id/{owners, validate-setup, open, owner-workspace, review-workspace, tasks/export, tasks, approval-events, comments (GET and POST), validate-owner-submit, load-actuals, load-baseline, validate, submit-fpa, fpa-accept, fpa-return, cfo-approve, cfo-return, lock, board-pack, summary}` | authenticate (router-level) — **AUTH-ONLY** at route level | `FpaController` calling `FpaBudgetCycleService`. The service asserts `FpaAccessService.assertCanApprove` on create, update, open and the approve/return steps. The FP&A planning cycle uses Fpa* models. No GL. |
| POST | /api/performance/bsc-workflow/budget-variance-reports | authenticate, methodGuard(read: performance.bsc.view or .manage; write: performance.bsc.manage) | `BscWorkflowController.postBudgetVarianceReport`. No GL. |
| GET | /api/performance/bsc-workflow/budget-variance-reports/by-goal/:goalId | authenticate, methodGuard (as above) | Lists by goal. No GL. |
| POST | /api/events/:eventId/budget-items | authenticate (router-level) — **AUTH-ONLY** | Adds event budget items. No GL. |
| GET | /api/events/:eventId/budget-items | authenticate — **AUTH-ONLY** | Lists them. No GL. |
| POST | /api/events/:eventId/budget/approve | authenticate — **AUTH-ONLY** | `EventService.approveBudget`, with no role check. No GL. |

#### Approvals (accounting-related)
##### approvalRoutes.ts — mount `/api/approvals`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** The service checks that the caller is the assigned approver or a delegate (`approverCanActOnApproval`, `UserMasterPolicyService.guardApprove`) and enforces step order.

Accounting-related stage types in `ApprovalService.updateEntityStatusAfterApproval`:
- `PAYMENT_EXECUTION`: vendor bill single or batch payment. Approval runs `PaymentInvestmentApprovalService.applyApprovedPayment`, which calls `PurchaseInvoiceService.payInvoice` or `payInvoicesBatch`. **GL: cashbook entry plus JE.**
- `INVESTMENT_BOOKING`: STI placement. Approval runs `applyApprovedInvestmentBooking`, which calls `ShortTermInvestmentService.createInstrument`. **GL: placement JE.**
- `MASTER_DATA_COA`: Chart of Accounts edit, applied with `applyChartOfAccountsUpdate` in the approval transaction. No JE.
- `INVOICE`: sets the procurement invoice to APPROVED. Status only, no JE.

There is **no approval stage type for journals, expenses or credit notes**. Journal maker-checker lives in `JournalEntryService.postJournalEntry` (the journal-entries router, outside this inventory).

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/approvals/my-pending | authenticate — **AUTH-ONLY** | `getMyPendingApprovals`, which includes the PAYMENT_EXECUTION, INVESTMENT_BOOKING and MASTER_DATA_COA items. No GL. |
| POST | /api/approvals/delegate | authenticate — **AUTH-ONLY** | Delegates by entity (`delegateApprovalForEntity`). No GL. |
| POST | /api/approvals/:id/approve | authenticate — **AUTH-ONLY** (approver identity checked in the service) | `ApprovalService.approveApproval`. **GL indirectly** on the final step for PAYMENT_EXECUTION (payInvoice or payInvoicesBatch) and INVESTMENT_BOOKING (createInstrument). |
| POST | /api/approvals/:id/reject | authenticate — **AUTH-ONLY** | `rejectApproval`. No GL. |
| POST | /api/approvals/:id/delegate | authenticate — **AUTH-ONLY** | `delegateApproval`. No GL. |

##### approvalWorkflowRoutes.ts — mount `/api/approval-workflows`
Router-level guards: `authenticate`. **The whole router is AUTH-ONLY.** A generic engine keyed by `module` and `entityType`, using the `ApprovalWorkflow`, `ApprovalStep`, `ApprovalRequest` and `Approval` models. It changes request and step status only and **never touches the entity it approves** (no bill, payment or journal side effects). No accounting-specific code.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| POST | /api/approval-workflows/ | authenticate — **AUTH-ONLY (write)** | `createApprovalWorkflow`: any user can define workflows. No GL. |
| GET | /api/approval-workflows/ | authenticate — **AUTH-ONLY** | List, filtered by module and entityType. No GL. |
| GET | /api/approval-workflows/:id | authenticate — **AUTH-ONLY** | Get. No GL. |
| GET | /api/approval-workflows/:module/:entityType | authenticate — **AUTH-ONLY** | `getWorkflowByModuleAndEntity`. No GL. |
| POST | /api/approval-workflows/requests | authenticate — **AUTH-ONLY** | `createApprovalRequest`. No GL. |
| GET | /api/approval-workflows/requests/my | authenticate — **AUTH-ONLY** | **Unreachable: shadowed by `GET /:module/:entityType`**, declared first (module="requests", entityType="my"). |
| PUT | /api/approval-workflows/requests/:requestId/steps/:stepId/approve | authenticate — **AUTH-ONLY** | `processApproval`: the approval row is keyed on `requestId_stepId_approverId`, so only the assigned approver matches. No GL. |

#### Audit & settings
No dedicated `accounting-settings` router exists. Settings live inside each module: inventory `/settings` and STI `/settings` are listed above; vendor `/document-settings` belongs to procurement. There is no audit endpoint filtered to module=accounting. `GET /api/audit-logs` filters by `entityType`, `entityId`, `adminId` and `action`.

| Method | Path | Guards | Handler / what it does (GL posting?) |
|---|---|---|---|
| GET | /api/audit-logs/ (`auditLogRoutes.ts`, mounted first) | authenticate, perm-any[manage_accounting, view_accounting, accounting.period_lock.audit_view] | `AuditLogController.list`: paged `auditLog`, filtered by entityType, entityId, adminId and action. No GL. |
| GET | /api/audit-logs/ (`auditRoutes.ts`, mounted second at the same path, app.ts:754) | authenticate — **AUTH-ONLY** | `AuditController.getAuditLogs`. **Effectively unreachable:** `auditLogRoutes` either answers or returns 403 first. |
| GET | /api/system-audit-log/ | authenticate — **AUTH-ONLY** | `SystemAuditLogController.getSystemAuditLog` (hours, action, entityType, scope). No GL. |
| GET | /api/system-audit-log/last-24-hours | authenticate — **AUTH-ONLY** | Last 24 hours (scope defaults to "uat"). No GL. |
| GET | /api/accounting/journal-entries/audit-trail/last-entries (cross-reference) | authenticate (router-level) — **AUTH-ONLY** | Last audit-sequence journal entries. No GL. |
| GET | /api/accounting/journal-entries/audit-trail/verify-sequential (cross-reference) | authenticate — **AUTH-ONLY** | Verifies the sequential integrity of the JE audit IDs. No GL. |
| POST | /api/cashbook/reference/configure (cross-reference, `cashbookRoutes.ts`) | authenticate — **AUTH-ONLY** | `ReferenceNumberController.configureReference`: reference-number format settings. No GL. |

#### Totals for §3.2

| Router | Routes | AUTH-ONLY | NO-AUTH |
|---|---|---|---|
| vendorRoutes | 24 | 4 (staff only) | 0 |
| purchaseInvoiceRoutes | 12 | 12 | 0 |
| customerRoutes | 5 | 5 | 0 |
| invoiceRoutes | 10 | 10 | 0 |
| creditNoteRoutes | 10 | 10 | 0 |
| statementRoutes | 14 | 14 | 0 |
| revenueRoutes | 5 | 0 | 0 |
| revenueSourceRoutes | 5 | 0 | 0 |
| revenueCategoryRoutes | 5 | 0 | 0 |
| cashbook receipts (cross-reference) | 1 | 1 | 0 |
| expenseRoutes | 7 | 7 | 0 |
| expenseCategoryRoutes | 6 | 6 | 0 |
| assetRoutes | 22 | 21 | 1 (cron: shared secret or loopback) |
| inventoryRoutes | 20 | 20 | 0 |
| shortTermInvestmentRoutes | 16 | 16 | 0 |
| incomeStatementRoutes | 11 | 0 | 0 |
| cashFlowRoutes | 6 | 0 | 0 |
| balanceSheetRoutes | 3 | 0 | 0 |
| statementOfEquityRoutes | 1 | 0 | 0 |
| consolidationRoutes | 1 | 0 | 0 |
| vatReportRoutes | 2 | 2 | 0 |
| vatRateRoutes | 6 | 0 | 0 |
| taxReturnPackRoutes | 12 | 0 | 0 |
| projectRoutes | 3 | 0 | 0 |
| timesheetRoutes | 8 | 0 | 0 |
| budgetManagementRoutes | 12 | 6 | 0 |
| procurement budgets (cross-reference) | 3 | 3 | 0 |
| FP&A budget-cycles (cross-reference) | 27 | 27 | 0 |
| bsc-workflow budget-variance (cross-reference) | 2 | 0 | 0 |
| events budget (cross-reference) | 3 | 3 | 0 |
| approvalRoutes | 5 | 5 | 0 |
| approvalWorkflowRoutes | 7 | 7 | 0 |
| audit and settings (auditLog 1, audit 1, systemAudit 2, JE audit-trail 2, cashbook reference 1) | 7 | 6 | 0 |
| **Total** | **281** | **185** | **1** |

Without the cross-reference rows (cashbook receipts, procurement, FP&A, BSC and events budgets, JE audit-trail and cashbook reference), the core routers in scope total **242 routes**, of which **148 are AUTH-ONLY**.

##### Routes that can never be reached (shadowed by route order or duplicate mounts)
- `GET /api/accounting/invoices/summary`
- `GET /api/accounting/expenses/summary`
- `GET /api/accounting/statements/customer`
- `GET /api/accounting/statements/vendor`
- `GET /api/budget-management/variance-reports`
- `GET /api/approval-workflows/requests/my`
- `GET /api/audit-logs` through `auditRoutes`
- Duplicate aliases that never run but are harmless (same handler): assets `/:id/depreciation/backfill` and `/:id/dispose`

##### GL-integrity issues noticed
- **Credit notes:** POSTED on create, but a DRAFT credit note can be deleted or amount-edited with no reversal.
- **Revenue:** DELETE does not reverse the JE.
- **Invoices:** DELETE of a PAID invoice has no reversal; a DRAFT invoice's PENDING JE is left in place.
- **Assets:** DELETE leaves the acquisition JE. Revaluation and backfill write POSTED JEs through raw `prisma.journalEntry.create`, outside the audit sequence.
- **STI:** accrual approve calls `postJournalEntry` without a user, so it likely always fails. Any user can switch `postingMode` to APPROVED, which bypasses maker-checker for every STI JE.
- **Bills:** `purchase-invoices/:id/submit` writes POSTED JEs for any authenticated user.
- **Inventory:** a negative adjustment increases stock.
- **Statements:** the email route is a console.log stub.

##### Distinct permission keys used by middleware in these routes
`procurement.vendors.view`, `procurement.vendors.manage`, `procurement.vendors.approve`, `procurement.vendors.banks.view`, `procurement.vendors.banks.manage`, `accounting.timesheets.view`, `accounting.timesheets.manage`, `manage_accounting`, `view_accounting`, `accounting.period_lock.audit_view`, `performance.bsc.view`, `performance.bsc.manage`

- **Permission keys checked inside handlers or services:** `manage_ledger` (JE posting), `manage_accounting`, `manage_ledger` and `manage_financial_reports` (PO-variance override on bill submit), and `procurement.vendors.banks.view` (vendor bank visibility).
- **Role lists passed to `authorize(...)`:** [admin, accountant]; [admin, finance_manager, ceo]; [admin, ceo, cfo]; [admin, fund_manager, cfo, analyst].
- **Custom middleware:** `requireInternalStaffUser`, `requireTaxReturnPackView`, `requireTaxReturnPackCompile`, `requireTaxReturnPackApprove`, `methodGuard`, and the procurement read-only-profile guard.

### 3.3 Combined totals

| Group | Route definitions | AUTH-ONLY | No JWT |
|---|---|---|---|
| §3.1 ledger/close/FX/cashbook/recon/docs (25 mounted routers) | 178 (182 endpoints) | 156 | 1 (exchange-rate cron, no auth at all) |
| §3.2 sub-ledgers/statements/tax/budgets/approvals (core routers) | 242 | 148 | 1 (depreciation cron: shared secret or loopback) |
| **Total core accounting** | **420** | **304** | **2** |
| §3.2 cross-referenced related routes (cashbook receipts, procurement/FP&A/BSC/events budgets, JE audit-trail, cashbook reference) | 39 | 37 | 0 |
| Unmounted router files (dead) | 54 | n/a | n/a |

---

## 4. Permission keys and holders

### 4.1 Permission model

**Where permissions come from**
- The JWT carries only `{ userId, tokenVersion }` (`src/middleware/authenticate.ts` `createToken`).
- `authenticate` loads the user with `include: { role: true }` from the DB on **every request**. It also checks User Master availability and `tokenVersion`.
- Permissions are a JSON array on `Role.permissions` (`[{ name, value }]`). There is no separate permissions table. A key counts as held when some entry has that `name` and `value === true` (`roleHasPermissionInJson` in `src/config/cfoModulePermissions.ts`). If a role has a key listed twice, any `true` entry wins.

**`requirePermission` / `requireAnyPermission` / `requireAllPermissions`** (`src/middleware/permissionAuth.ts`) call `userHasEffectivePermission(user, key)`, which works like this:
1. `procurementScopeAllows`: this can only *narrow* `procurement.*` keys (User Master procurement function or READ_ONLY profile). It does not affect accounting keys.
2. If the role JSON holds the key, access is granted.
3. **CFO synthetic grant:** a user whose `roleCode === "CFO"` (or whose role name matches "chief financial officer"/"cfo") gets every key in `CFO_MODULE_PERMISSIONS`, whatever the role JSON says. That covers view/manage_accounting, view/manage_ledger, view/manage_financial_reports, bank_reconciliation, all four `accounting.period_lock.*` keys and both `accounting.timesheets.*` keys.
4. Otherwise access is denied.

- **There is no ADMIN or SUPER_ADMIN bypass in `requirePermission`.** An admin passes only if the `admin` role row actually holds the key.
  - `deploy/ensure-admin.js` (Docker entrypoint) creates the `admin` role with `permissions: []` when it is missing. On a fresh container DB, admin would get 403 on every `requirePermission` route until the role JSON is seeded.
  - `prisma/seed.ts` and `scripts/03-seed-admin.ts` seed admin with view/manage_accounting, ledger, financial_reports and bank_reconciliation, but **not** `accounting.period_lock.*`. Admin receives those only if `npm run db:seed:period-lock-permissions` has been run. That script merges them into every role that has `manage_accounting`.
- Compliance revocation (`getEffectivePermissionsForUser`, which blocks keys when a cert has expired) is exported but **not used by `requirePermission`**.

**Legacy `authorize([...roles])`** (in `authenticate.ts`, re-exported by permissionAuth) matches on role *name or roleCode*, lower-cased, with no JSON check. It also has a CFO escape hatch (`cfoPassesLegacyAuthorize`): a CFO passes an "accountant" or "finance_manager" list when it holds `view_accounting`, and a "manager"/"user" list when it holds `view_financial_reports`.
- Caveat: the tokens are compared literally. The seeded Finance Manager role (name `Finance Manager`, code `FIN_MGR`) does **not** match `"finance_manager"`. Only a role literally named or coded `finance_manager` does.

**In-service checks (not middleware)**
- `JournalEntryService.postJournalEntry` (~L1768): posting requires `isModulePrivilegedUser` (admin/CFO by role signal) or `manage_ledger`. The preparer cannot post their own entry.
- `PurchaseInvoiceService.userCanOverridePoVariance` (~L850): the >120% PO-variance override needs role name `admin`, or `manage_accounting`, `manage_ledger` or `manage_financial_reports`.
- `PeriodLockService.userHasOverride`: `accounting.period_lock.override` lets a user post into a locked period.
- `EmailNotificationService` (~L6947): recurring-journal-posted emails go to every user whose role JSON has `manage_accounting`, plus `ACCOUNTANT_NOTIFICATION_EMAILS`.
- Tax return packs: `TaxReturnPackAccessService`. Admin (via `isAdminViewer`) and tax officers can view and compile. Only a "checker" can approve.

**Most accounting routers are authenticate-only.** Any logged-in user can use them, including LP, investee and applicant portal users, because none of these routers applies `requireInternalStaffUser`. This covers chart of accounts, journal entries, cashbook (all sub-routers), cashbook periods (`periodLockoutRoutes`), bank reconciliation, assets, inventory, credit notes, statements, multi-currency, invoices, purchase invoices, customers, expenses, VAT reports, GL ledger detail, trial balance, open items, transfers and reversals, contra entries, control accounts, currencies, **recurring journal templates (including run and run-due)** and **short-term investments** (the header comment says this is intentional). `/accounting/api` (accountingApiRoutes) is also authenticate-only.

### 4.2 Keys, where they are enforced, and who holds them

#### Keys enforced by middleware

| Permission key | Used by (router → routes) | Roles that hold it (source) |
|---|---|---|
| `accounting.period_lock.view` | `fiscalCalendarRoutes` GET `/`, GET `/posting-exceptions` (any-of with manage and manage_accounting); `accountingCloseTaskRoutes` GET routes | Finance level-5 roles: Finance Manager, FP&A Version Lock Authority (`scripts/seed-hardcoded-roles.ts` L149-155, `src/config/hardcodedRoles.ts`). CFO via `CFO_MODULE_PERMISSIONS` (code grant plus `scripts/seed-cfo-module-permissions.ts`). Any role with `manage_accounting` once `scripts/seed-period-lock-permissions.ts` has run (incl. admin). |
| `accounting.period_lock.manage` | `fiscalCalendarRoutes` PUT `/locks/draft`, POST `/locks/commit`, PATCH `/policy`, plus audit and exceptions reads; `accountingCloseTaskRoutes` POST/PATCH | Same as above |
| `accounting.period_lock.audit_view` | `fiscalCalendarRoutes` GET `/period-lock/audit`; `auditLogRoutes` GET `/` (any-of) | Same as above |
| `accounting.period_lock.override` | No route. `PeriodLockService` lets the user post into a locked period | Same as above |
| `manage_accounting` | any-of on `fiscalCalendarRoutes` GET `/` and `/posting-exceptions`; `auditLogRoutes`; `timesheetRoutes` (all); `projectRoutes`. In-service: PO-variance override, recurring-journal email recipients, `TimesheetService`, `PerformanceAccessService`, `PerformanceWorkflowService` | admin (`prisma/seed.ts`, `scripts/03-seed-admin.ts`). Every level-5 role in any department (`02-seed-roles.ts`, `seed-hardcoded-roles.ts`, `seed-departments-and-roles.ts`, `seed-investments-department.ts`). Finance level ≥4: Finance Officer, Finance Manager, FP&A Lock, Internal Auditor (L4 Finance). CFO (code grant). **Accountant (L3) does not hold it.** |
| `view_accounting` | `auditLogRoutes` (any-of). `cfoPassesLegacyAuthorize` checks it | admin; all level ≥3 roles in every department (hardcoded seed); all Finance roles; CFO |
| `accounting.timesheets.view` | `timesheetRoutes` self-service; `projectRoutes` GET | Every internal staff role (`scripts/run-performance-role-permissions-migration.ts`, `run-performance-rbac-v2-migration.ts`); CFO |
| `accounting.timesheets.manage` | `timesheetRoutes` approve/return/team/pending; `projectRoutes` writes | Manager/exec tiers plus "HR Manager" (same two migration scripts); CFO |
| `manage_ledger` | No route. `JournalEntryService` post-to-GL gate; PO-variance override | admin; all level-5 roles; Finance ≥4; CFO |

#### Keys that are seeded but not enforced anywhere

| Key | Status |
|---|---|
| `view_ledger` | Seeded (admin, level ≥3, Finance, CFO). Nothing checks it. |
| `view_financial_reports` | Seeded. Checked only inside the CFO legacy-authorize bypass. |
| `manage_financial_reports` | Seeded. Checked only in the PO-variance override. |
| `bank_reconciliation` | Seeded (admin; Finance ≥4 in the hardcoded seed; level-5 in the other seeds; CFO). **No route enforces it.** `bankReconciliationRoutes` is authenticate-only. |

#### Role-name lists (`authorize`) on accounting routers

| Router | Allowed roles |
|---|---|
| income-statement, cash-flow, balance-sheet, statement-of-equity, consolidation, revenues, revenue-sources, revenue-categories, accounting documents | `admin`, `accountant` |
| accounting dashboard | `admin`, `accountant`, `finance_manager` |
| accounting v1 (PE integration) | `admin`, `ceo`, `fund_manager`, `investments_manager`, `finance_manager`, `cfo` |
| VAT rates | `admin`, `finance_manager`, `ceo` |
| budget-management | `admin`, `ceo`, `cfo` |
| tax-return-packs | `admin`, `fund_manager`, `cfo`, `analyst`, then `TaxReturnPackAccessService` |

`scripts/run-performance-role-permissions-migration.ts` notes that the granular permission system has no data behind it for any role except `admin`. The keys above are real only where the listed scripts have actually run against a given DB.

---

## 5. Scheduled jobs / cron

### 5.1 Every scheduled or job-like mechanism in the backend

#### A. In-process timers (started from `src/app.ts` `startServer()`)

| Job | File | Schedule | Started? | Env flags | What it does |
|---|---|---|---|---|---|
| `VendorComplianceJobService.startScheduler` → `runCycle` | `src/services/VendorComplianceJobService.ts:136` | First run +120 s, then every 6 h | **Yes** | `VENDOR_COMPLIANCE_JOB=off` | Syncs lapsed vendor KYC and tax-clearance statuses. Notifies vendor managers of expiring or expired documents. |
| `startNotificationScheduler` → `runAllNotificationJobs` | `src/services/notifications/ProcurementNotificationJobs.ts:117` | +150 s, then hourly | **Yes** | `PROCUREMENT_NOTIFICATION_JOB=off` | Closes expired RFQs. Sends RFQ-deadline notices, evaluation-overdue notices and approval escalations. |
| `startPerformanceAlertScheduler` | `src/services/PerformanceAlertRuleService.ts:258` | Ticks every 60 s (first at 180 s). Evaluates every `performance_settings.workflow.alertEvaluationMinutes` (default 10 min) | **Yes** | `PERFORMANCE_ALERT_JOB=off` | Evaluates performance alert rules, then raises, clears and escalates alerts and notifies. Runs as the first ACTIVE user whose role is named `admin`; does nothing if there is none. |
| `startPerformanceGlRetryScheduler` | `src/services/PerformanceAlertRuleService.ts:244` | +240 s, then every 15 min | **Yes** | `PERFORMANCE_GL_RETRY_JOB=off` | `PerformanceGlPostingService.retryFailed({limit:100})`: re-posts `performance_goal_progress_events` whose `journal_status='failed'`. Uses the same reference, so nothing posts twice. |
| `startPerformanceIntegrationRefreshScheduler` | `src/services/PerformanceIntegrationOverviewService.ts:133` | +300 s, then hourly | **Yes** | `PERFORMANCE_INTEGRATION_REFRESH_JOB=off` | Re-syncs performance goals whose `syncEndpointPath` contains `/v1/` when due by `trackingFrequency`. |
| `startPerformanceReportScheduler` → `runDue` | `src/services/PerformanceReportService.ts:273` | Every 5 min, starting at ~200 s (first run ~8 min after boot) | **Yes** | `PERFORMANCE_REPORT_JOB=off` | Generates due `performance_report_schedules` and notifies recipients. |

No `node-cron`, `CronJob`, bull/bullmq or agenda exists anywhere (the only `node-cron` text is a commented-out stub in `PerformanceETLService.ts:449`). PM2 (`ecosystem.config.js`, 1 instance) and Docker (`Dockerfile`, `deploy/docker-entrypoint.sh`) run only `node dist/app.js`; there is no cron sidecar. `vercel.json` has no crons.

#### B. Login-triggered background work (no timer; runs in `setImmediate` after every non-applicant login, `AuthController.ts` ~L209)

| Job | File | Trigger | Env flags | What it does |
|---|---|---|---|---|
| `ShortTermInvestmentService.maybeRunDailyAccrualAfterLogin` | `src/services/ShortTermInvestmentService.ts:540` | Every login | `STI_LOGIN_ACCRUAL_COOLDOWN_MS` (default 0, which means every login) | Backfills missing daily STI interest accruals through fiscal "today" (same logic as `/catch-up`). |
| `AccountingGoalSyncService.maybeRunAfterLogin` | `src/services/AccountingGoalSyncService.ts:381` | Every login, with a 2-min DB lease | `PERF_LOGIN_SYNC_ENABLED` (default true) | Incremental P&L sync from the GL into performance goals. Skips payroll and balance sheet. |

#### C. HTTP "cron" endpoints (not timed; need an external caller)

| Job | File / route | Schedule | Started? | Auth / env | What it does |
|---|---|---|---|---|---|
| Monthly depreciation | `POST /api/cron/depreciation/monthly` (legacy `POST /api/accounting/assets/depreciation/cron/monthly`), `AssetController.postMonthlyDepreciationCron` | None in code. `scripts/cron-depreciation-monthly.sh` is a template crontab (`15 2 1 * *`; `*/5` for testing) | **Dormant.** Template only; no installer or evidence it is on any host | `DEPRECIATION_CRON_SECRET` (header `X-Depreciation-Cron-Secret`); loopback-only if unset | `AssetService.postMonthlyDepreciation`, posted as the user whose firstName is "admin" |
| Vendor tax-clearance alerts | `POST /api/cron/vendors/tax-clearance-revalidation-alerts` | none | Dormant (superseded by timer A1) | `VENDOR_TAX_CLEARANCE_CRON_SECRET`, else loopback | Tax-clearance revalidation alerts |
| Vendor compliance cycle | `POST /api/cron/vendors/compliance-cycle` | none | Manual twin of A1 | same | `VendorComplianceJobService.runCycle` |
| Investee reporting reminders | `POST /api/cron/reporting/reminders` (+ `/api/public/reporting/reminders`) | none found | Dormant | `REPORTING_REMINDERS_CRON_SECRET`, else loopback | Investee reporting reminder emails (T-3, overdue, request) |
| Reporting schedule tick | `POST /api/cron/reporting/schedule-tick` (+ public) | none found | Dormant | same | Applies active `reporting_schedule_configs` (auto-opens the reporting calendar, reminders) |
| Fund reporting tick | `POST /api/cron/fund-reporting/schedule-tick` | `docs/fund-performance-reporting-ubuntu-cron-setup.md` suggests `55 7 * * *` | Dormant (doc only) | `FUND_REPORTING_CRON_SECRET` or `REPORTING_REMINDERS_CRON_SECRET`, else loopback | Quarterly fund performance report scheduling |
| LP snapshot refresh | `POST /api/cron/lp-portal/snapshot-refresh` | `docs/lp-portal-ubuntu-cron-setup.md` suggests `0 2 * * *` | Dormant (doc only) | **No auth at all** | `LpPortalSnapshotCronService.refreshAll` |
| Street FX display refresh | `POST /api/cron/exchange-rate-display/snapshot-refresh` | none | Dormant | **No auth at all** | `StreetRateIngestService.ingestLive` (Zimrate USD/ZWG street and official rates for the display module) |
| Payroll cert expiry | `POST /api/payroll/compliance/cron/expiry-check` (`runExpiryCron`, `PayrollExtendedController.ts:506`) | Requirements doc says daily 06:00 Harare | Dormant | `COMPLIANCE_CRON_SECRET` or `CRON_SECRET`; **open if neither is set** | `ComplianceExpiryCronService.runExpiryCheck` (expiry warnings, permission revocation) |
| Market-data scrape | `POST /api/investments/market-data/cron/scrape-domestic` | `0 7 * * 1-5`, `*/15 7-13 * * 1-5`, `0 14 * * 1-5` (UTC) in `/etc/cron.d/arcus-listed-equity` | **External host cron.** Installed by `scripts/install-listed-equity-cron-vps.py` and `_install-cron-*.py` / `_setup-dev-market-cron.py`; `verify-listed-equity-cron-vps.py` checks it. Not live-verified here | `MARKET_DATA_CRON_SECRET` or `CRON_SECRET`, else loopback | ZSE/VFEX price scrape |
| Market-data retry | `POST /api/investments/market-data/cron/retry-failed-ingest` | `*/15 * * * *` | Same host cron | same | Retries failed price ingests |
| Trade-routing retry | `POST /api/investments/trades/cron/retry-failed-routing` | `*/15 * * * *` | Only in `install-listed-equity-cron-vps.py` (the docker-based installers omit it) | `TRADE_ROUTER_CRON_SECRET` or `CRON_SECRET`, else loopback | Retries failed listed-equity trade routing |

#### D. Queues with no worker
- `procurement_rpa_jobs`: `POST /api/procurement/rpa-jobs` inserts `QUEUED` rows. **No processor exists.**
- `InvestmentJobWorkerService`: a DB-backed job table with leases and a heartbeat `setInterval` while a job runs. There is **no poller**. Jobs run only where the caller invokes `processJobById` inline (Phase1, Reconciliation L338, Reporting, Valuation). Other enqueues (e.g. `FILE_UPLOAD_SESSION`, `RECONCILIATION_UPLOAD`) are record rows.

#### E. Manual "run" endpoints that look like jobs but are user-triggered (JWT)
`POST /api/accounting/recurring-journal-templates/run-due` and `/:id/run`; `POST /api/performance/.../schedules/run-due`; `POST /api/procurement/compliance-reminders/run`; STI `/instruments/:id/catch-up` and `/fx/month-end-revaluation`; `POST /api/accounting/multi-currency/banks/:bankId/revalue`; `POST /api/accounting/assets/depreciation/monthly` and `/annual`.

(Unrelated: `nvccz-new/scripts/_matanho-*.py` install a `15 3 * * *` analytics-retention crontab for the separate Matanho marketing site, not this API.)

### 5.2 Finance / accounting job coverage

| Concern | Verdict | Detail |
|---|---|---|
| Depreciation | **Endpoint exists, nothing calls it on a schedule** | `POST /api/cron/depreciation/monthly` (secret or loopback) plus a template shell and crontab in `scripts/cron-depreciation-monthly.sh`. No evidence it is installed. JWT manual endpoints: `POST /api/accounting/assets/depreciation/monthly` and `/annual`, plus per-asset `/:id/depreciation` and `/backfill`. |
| Interest accrual (STI) | **No timed job. Login-triggered** | Runs after every staff login (`maybeRunDailyAccrualAfterLogin`, throttled only by `STI_LOGIN_ACCRUAL_COOLDOWN_MS`). Manual: `POST /api/accounting/short-term-investments/instruments/:id/catch-up`. Accrual approval is manual (`/accruals/:id/approve`, `/approve-all`). |
| Recurring journals | **No job (manual endpoint only)** | `POST /api/accounting/recurring-journal-templates/run-due` and `/:id/run` (authenticate-only, any user). Nothing calls `runDueTemplates` automatically. |
| FX rates fetch | **No job** | Accounting rates are entered manually (`POST /api/accounting/multi-currency/exchange-rates`). USD/ZWG is fetched on demand from Zimrate (`ZimrateRateService` via `MultiCurrencyService`/`UsdZwgRateResolver`). Procurement `FxService` can fetch from a configured URL on demand. The street-rate display snapshot endpoint exists (unauthenticated) but has no scheduler. The Zimrate API key is hard-coded in `src/services/ZimrateRateService.ts:8`. |
| FX revaluation | **No job (manual endpoints only)** | `POST /api/accounting/multi-currency/banks/:bankId/revalue` (per bank) and `POST /api/accounting/short-term-investments/fx/month-end-revaluation`. No general AR/AP month-end revaluation endpoint was found. |
| Invoice/bill due reminders (dunning) | **Nothing** | No overdue or dunning service in the backend. The only reminder jobs are investee *reporting* reminders (C) and procurement RFQ/approval notices (A2). |
| Bank feeds | **Nothing** | No feed or open-banking integration. Only statement CSV/Excel upload (bank-reconciliation upload, cashbook import/batches). |
| Period close | **No job (manual)** | Fiscal-calendar lock draft and commit, policy, and close-tasks CRUD are all user-driven. No auto-lock or auto-close job and no close reminders. |
| Payroll GL posting | **No job. Synchronous** | `PayrollService.createPayrollJournalEntry` runs inside payroll processing/approval. There is no retry scheduler for payroll GL. |
| Performance GL retry | **Job exists and is started** | `startPerformanceGlRetryScheduler`: every 15 min after a 4-min delay. Disable with `PERFORMANCE_GL_RETRY_JOB=off`. |

### 5.3 Jobs the UI implies vs backend

The runtime (`components/accounting-v52-mock/matanho-accounting-runtime.js`) holds many layered versions (v1, v4, v5, v7, v8, v11, v17, v25, v27, v28…). The host `components/accounting-v52-mock/accounting-v52-app.tsx` intercepts `matanho:before-action` only for its `LIVE_ACTIONS` set. `lib/accounting-v52/actions.ts` handles exactly: coa-save, upload-document, close-task-complete, timesheet-approve/return, create-tax-pack, approval-decision, journal-submit, ap-pay-bill, invoice-create, customer-create, cash-post, receipt-post, expense-create, stock-adjust, asset-create, **recurring-run**, **recurring-run-due**, recon-signoff. Everything else is client-only mock.

| UI label → action id(s) | Handled in actions.ts? | Backend endpoint / job |
|---|---|---|
| "Run depreciation" / "Post depreciation run" / "Preview journal": `asset-dep-run`, `asset-dep-preview` (v28 opens a generic "Finance action" modal), `run-depreciation`, `validate-depreciation` (v1, toast), `post-depreciation-v4` / `preview-depreciation-v4` (v4, posts into local state), `asset-action` with `depreciation` (later layer) | **No**. Mock only | Exists: `POST /api/accounting/assets/depreciation/monthly` (JWT) plus the cron endpoint. **Not wired.** |
| "Run revaluation" / "Validate rates" / "Preview journal" / submit: `run-fx`, `validate-rates`, `preview-fx-journal`, `submit-fx` | **No**. Toast only | Partial: per-bank `/multi-currency/banks/:bankId/revalue` and STI month-end FX. No full revaluation run. No job. |
| "Add custom exchange rate": `v8-add-rate`, `v8-edit-rate`, `v8-review-fx-rate` | **No** | `POST`/`PUT /api/accounting/multi-currency/exchange-rates` exist. Not wired. |
| STI "Run daily accrual": `investment-accrue` (v17 confirm); APY change `v8-rate-change`, `v8-review-rate-change`; `investment-mature` | **No** | Accrual runs on login. Manual `/instruments/:id/catch-up`, `/apy-rates`, `/liquidate`, accrual approve endpoints exist. Not wired (only the STI dashboard is loaded read-only via `getSTIDashboard`). |
| Recurring "Run now" / "Run due schedules": v27 `schedule-run` → `schedule-run-confirm` → **`recurring-run`**; v27 `schedule-run-due` → `run-due-confirm` → **`recurring-run-due`** | **Yes** (`handleRecurringRun`, `handleRecurringRunDue`) | `POST /recurring-journal-templates/:id/run` and `/run-due`. Manual only, **no scheduler**. Older-layer ids `v5-run-recurring`, `v7-run-recurring`, `v8-run-recurring`, `v8-run-due-recurring` stay mock. |
| Recurring pause/resume: `schedule-pause`, `schedule-resume`, `v8-pause-recurring`, `v7-pause-recurring` | **No** | `PATCH /recurring-journal-templates/:id/active` exists. Not wired. |
| "Auto-post after approval" / "Auto-post below threshold" posting policy (recurring schedules, investments, settings `Auto-post approved sources`) | **No** | No backend concept of auto-post and no scheduler. Recurring runs only post when someone calls run or run-due. |
| "Run auto-match": `recon-auto` (also `v8-recon-auto`, v17/v25 variants) | Indirectly **yes**: in v28 live mode `recon-auto` and `recon-submit` dispatch **`recon-signoff`** | ⚠ Not an auto-match. `handleReconSignoff` selects **every** unreconciled cashbook line as of today and finishes a session, with `statementEndBalance = bank.statement` from the UI. No auto-match engine or job exists in the backend. |
| "Bank feeds x/y" KPI (v8 `S.banks[].feed`, v12) | n/a (display) | Nothing. No bank-feed integration. The KPI is computed from mock `feed` strings. |
| Close "Send close reminder(s)": `send-close-reminders`, `remind` (v11 workspace) | **No**. Toast only | Nothing. Close-tasks have no reminder endpoint or job. |
| AR "Send reminder" / "Overdue invoice reminder" / "Reminder sent" status / `ar-promise` / `ar-statements` / `ar-email` | **No** | Nothing. No dunning or AR reminder service. |
| "Lock July 2026": `period-lock` (v17 confirm) | **No** | `PUT /accounting/fiscal-calendar/locks/draft` plus `POST /locks/commit` exist (need `accounting.period_lock.manage`). Not wired. |
| "Payment run": `payment-run`, `ap-payment-run` | **No** (`ap-pay-bill` is the only wired AP action) | Batch-pay endpoints exist on purchase invoices / procurement. Not wired here. |

"Dunning", "bank feed sync" and "auto-post" have no backend counterpart at all. Depreciation, FX revaluation, rate maintenance, STI actions and period lock have backend endpoints that the accounting UI does not call.

---

## 6. Data model

Source: `nvccz/prisma/schema.prisma` (554 models) plus raw-SQL migration scripts. Conventions: almost every `status` on accounting models is a plain `String` (not a Prisma enum). The only real Prisma enums in the accounting area are `CashbookEntryType` (RECEIPT|PAYMENT), `CashbookEntryStatus` (PENDING|POSTED|VOIDED), `CounterpartyType` (GL|CUSTOMER|SUPPLIER), `CashbookReconciliationSessionStatus` (DRAFT|FINALIZED|CANCELLED), plus `ExpenseStatus`/`BudgetStatus`/`PayrollStatus` enums that are **declared but not used** by the `Expense`/`Budget` models, which use String columns instead.

### 6.1 Models by domain

#### General ledger core
- **JournalEntry** (`journal_entries`): GL header. Fields: `referenceNumber` (unique), `transactionDate`, `totalAmount`, `currencyId`→Currency, `status` String (default PENDING; PENDING/POSTED/VOIDED in practice), `auditTrailSequenceNumber` (unique, gap-checked), `forecastEntityId`→ForecastEntity (multi-entity tag), `isEliminationEntry`, `usdZwgRateSnapshot`, `createdById`. Back-relations from about 20 subledgers (expenses, invoices, bills, cashbook, capital calls, fees, distributions, payroll, STI, listed-equity settlements, performance events).
- **JournalEntryLine** (`journal_entry_lines`): GL line. Fields: `journalEntryId`→JournalEntry (cascade), `chartOfAccountId`→ChartOfAccounts, `debitAmount`/`creditAmount` Decimal(15,3), `vatAmount`, `recordedCurrencyId`→Currency (multi-currency manual JEs), `description`.
- **ChartOfAccounts** (`chart_of_accounts`): global chart of accounts. Fields: `accountNo` (unique), `accountName`, `accountType` String (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE...), `naturalBalance` DEBIT|CREDIT (derived from the type), `financialStatement`, `parentId` (self-hierarchy), `isActive`. There is no separate AccountType model: the type is a string column.
- **AuditTrailSequence** (`audit_trail_sequences`): named counter behind `JournalEntry.auditTrailSequenceNumber`. Fields: `name` (unique), `value`.
- **RecurringJournalTemplate** (`recurring_journal_templates`, raw-SQL): scheduled JE template. Fields: `name`, `isActive`, `dayOfMonth`, `currencyId`→Currency, `linesJson` [{chartOfAccountId, debit, credit}], `referencePrefix`, `createdById`.
- **RecurringJournalRun** (`recurring_journal_runs`, raw-SQL): idempotency log. Fields: `templateId`→Template, `yearMonth`, `journalEntryId`→JournalEntry (unique). Unique on (template, yearMonth).

#### Periods, locks and close
- **FiscalYear** (`fiscal_years`, raw-SQL): fields `name`, `startDate`, `endDate`, `status` String (OPEN...).
- **FiscalPeriod** (`fiscal_periods`, raw-SQL): fields `fiscalYearId`→FiscalYear, `periodNumber`, `name`, `startDate`, `endDate`, `status` String (OPEN/locked shell).
- **ModulePeriodLock** (`module_period_locks`, raw-SQL): per-module lock for each period. Fields: `moduleCode` (GL/AR/AP/BANK...), `fiscalPeriodId`→FiscalPeriod, `lockStatus` String, `reason`, `updatedById`.
- **CompanyAccountingPolicy** (`company_accounting_policies`, raw-SQL, singleton): fields `lockedPeriodPolicy` ERROR|WARN, `allowOverridePosting`, `glErrorBatchEnabled`, `lockConfigVersion`.
- **PeriodLockDraft** (`period_lock_drafts`, raw-SQL, singleton): staged lock matrix `draftJson`, committed through the fiscal-calendar API.
- **PostingException** (`posting_exceptions`, raw-SQL): feeder posts parked because the target period is locked. Fields: `sourceModule`, `targetModule`, `sourceDocumentType/Id`, `accountingDate`, `reasonCode`, `status` String (OPEN...), `payloadSnapshot`.
- **PeriodLockAuditLog** (`period_lock_audit_logs`, raw-SQL): fields `actionType`, `moduleCode`, `fiscalPeriodId`, `oldValue/newValue`, `performedById`, `source`.
- **AccountingCloseTask** (`accounting_close_tasks`, raw-SQL): month-end checklist. Fields: `fiscalPeriodId`→FiscalPeriod, `workstream`, `task`, `ownerId`→User, `dueAt`, `status` OPEN|IN_PROGRESS|COMPLETE, `dependsOnId` (self), `completedById/At`.
- **AccountingPeriod** (`accounting_periods`, legacy): `period` "YYYY-MM" unique, `isLocked`, `lockedBy`, `reason`. PeriodLockService still dual-writes it.
- **PeriodLockout** (`period_lockouts`, legacy cashbook lock): `year`, `month`, `isLocked`, `lockedBy`, `reason`. Also dual-written by PeriodLockService.

#### Currencies and FX
- **Currency** (`currencies`): `code` (unique), `name`, `symbol`, `decimalPlaces`, `isActive`, `isDefault`.
- **ExchangeRate** (`exchange_rates`): accounting FX table. Fields: `date`, `fromCurrencyId`/`toCurrencyId`→Currency, `rate`, `source` TABLE|URL|MANUAL, `isActive`. Unique on (date, from, to).
- **ForexGainLoss** (`forex_gain_loss`): realised/unrealised FX record. Fields: `invoiceId`→Invoice, `from/toCurrencyId`, `originalAmount`, `convertedAmount`, `exchangeRate`, `gainLossAmount`, `gainLossType`, `journalEntryId`→JournalEntry.
- **ExchangeRateQuote / ExchangeRateDisplayConfig / ExchangeRateDisplaySource** (`exchange_rate_*`): street/official rate *display* feed (header ticker and quarterly-statement FX). These are not GL rates.

#### Banks, cashbook and reconciliation
- **Bank** (`banks`): company bank account. Fields: `name`, `accountNumber` (unique), `currencyId`→Currency, `glAccountId`→ChartOfAccounts (shared Cash and Cash Equivalents CoA), `branchCode`, `swiftCode`, `isActive`.
- **CashbookEntry** (`cashbook_entries`): bank receipt/payment. Fields: `bankId`→Bank, `type` CashbookEntryType, `status` CashbookEntryStatus, `counterpartyType` CounterpartyType, `glAccountId`/`customerId`/`vendorId`, `journalEntryId`→JournalEntry (unique), `batchId`→CashbookBatch, `entryTypeId`→CashbookEntryTypeConfig, `transferId`→CashbookTransfer, `originalTransactionId` (reversal self-link), `isReconciled`, `cashbookReconciliationSessionId`.
- **CashbookBatch** (`cashbook_batches`): batch of entries. Fields: `name`, `status` DRAFT/POSTED, `totalAmount`, `importFileUrl`.
- **CashbookImportBatch** (`cashbook_import_batches`): CSV import job. Fields: `fileName`, `mapping` Json, `status`, `totalRows`, `validRows`, `errorRows`.
- **CashbookExport** (`cashbook_exports`): export log. Fields: `batchId`, `fileName`, `format`, `status`.
- **CashbookTransfer** (`cashbook_transfers`): inter-bank transfer. Fields: `fromBankId`/`toBankId`→Bank, `amount`, `transferDate`, `status` (POSTED), `projectCode`. Entries link back through `CashbookEntry.transferId`.
- **CashbookEntryTypeConfig** (`cashbook_entry_type_configs`): entry types. Fields: `name`, `transactionType`, `counterpartyType`, `defaultGlAccountId`→CoA, `requiresProjectCode`, `referencePrefix`, `debitCreditLogic`.
- **ContraEntryConfig** (`contra_entry_configs`): fields `entryType`, `glAccountId`→CoA, `contraType`, `isEnabled`.
- **ContraEntry** (`contra_entries`): fields `cashbookEntryId`→CashbookEntry, `contraType`, `amount`, `debitAccountId`/`creditAccountId`→CoA.
- **PaymentAllocation** (`payment_allocations`): open-item matching of a receipt to AR invoices. Fields: `cashbookEntryId`→CashbookEntry, `invoiceId`→Invoice, `allocatedAmount`, `discountAmount`.
- **CashbookTemplate** (`cashbook_templates`): quick-entry template. Fields: `name`, `description`, `projectCode`, `glAccountId`→CoA, `vatCode`.
- **DiscountConfig** (`discount_configs`): settlement-discount rules. Fields: `entityType` (customer/vendor), `entityId`, `discountType`, `discountValue`, `min/maxAmount`, `validFrom/To`.
- **ReferenceNumberConfig** (`reference_number_configs`): auto-numbering. Fields: `type`, `prefix`, `currentNumber`, `incrementBy`, `resetPeriod`.
- **CashbookReconciliationSession** (`cashbook_reconciliation_sessions`, raw-SQL): Sage-style reconciliation. Fields: `bankId`→Bank, `status` CashbookReconciliationSessionStatus, `statementDate`, `statementEndBalance`, `opening/closingBalance`, `finishedById/At`.
- **CashbookReconciliationSessionLine** (`cashbook_reconciliation_session_lines`, raw-SQL): fields `sessionId`, `cashbookEntryId`, `selected`.
- **BankStatement** (`bank_statements`): statement header for the cashbook matcher. Fields: `bankId`→Bank, `statementDate`, `opening/closingBalance`, `totalDebits/Credits`, `isReconciled`.
- **BankStatementItem** (`bank_statement_items`): fields `statementId`, `transactionDate`, `debit/creditAmount`, `balance`, `isMatched`, `matchedTransactionId`→CashbookEntry.
- **ReconciliationMismatch** (`reconciliation_mismatches`): fields `statementId`, `transactionId`→CashbookEntry, `type`, `systemAmount`/`statementAmount`, `severity`, `isResolved`.
- **BankReconciliation** (`bank_reconciliations`): uploaded-statement AI matcher run. Fields: `fileName/Url`, `status` String (PENDING...), `bankId`→Bank, `matchedCount`/`unmatchedCount`, `confidenceThreshold`, `opening/closingBalance`, `statementDate`.
- **BankTransaction** (`bank_transactions`): parsed statement line. Fields: `reconciliationId`→BankReconciliation, `transactionDate`, `amount`, `debit/creditAmount`, `isMatched`, `confidenceScore`, `matchedJournalEntryId`→JournalEntry.
- **ReconciliationResult** (`reconciliation_results`): proposed match. Fields: `reconciliationId`, `bankTransactionId`, `journalEntryId`, `matchType`, `confidenceScore`, `status` PENDING/APPROVED/REJECTED.
- **ReconciliationAuditTrail** (`reconciliation_audit_trail`): fields `reconciliationId`, `action`, `details` Json.

#### Accounts payable (vendors, bills, payments)
- **Vendor** (`vendors`): shared by procurement and AP. Fields: `name`, `vendorCode` (unique), `taxNumber`/`vatNumber`/`bpNumber`, `lifecycleStatus` DRAFT|PENDING_REVIEW|ACTIVE|SUSPENDED|INACTIVE, `approvalStatus`, `complianceStatus`, `taxComplianceStatus`, `settlementCurrencyId`→Currency, `isBlacklisted`.
- **VendorBank** (`vendor_banks`): fields `vendorId`→Vendor, `bankName`, `accountNumber`, `branchCode`, `swiftCode`, `currencyCode`, `isPrimary`.
- **PurchaseInvoice** (`purchase_invoices`): AP bill. Fields: `invoiceNumber` (unique), `vendorId`→Vendor, `vendorInvoiceReference` (unique per vendor), `status` String (DRAFT/SUBMITTED...), `paymentStatus` (PENDING/PARTIAL/PAID), `totalAmount`/`outstandingAmount`/`paidAmount`, `journalEntryId` and `paymentJournalEntryId`→JournalEntry, `cashbookEntryId`→CashbookEntry, `sourcePurchaseOrderId`→PurchaseOrder, `sourceGoodsReceivedNoteId`→GRN, `suite06MatchStatus` (three-way match result).
- **PurchaseInvoiceItem** (`purchase_invoice_items`): fields `invoiceId`, `itemName`, `quantity`, `unitPrice`, `totalPrice`, `vatRate`.
- **PurchaseInvoicePayment** (`purchase_invoice_payments`, raw-SQL): batch-pay allocation. Fields: `purchaseInvoiceId`→PurchaseInvoice, `cashbookEntryId`→CashbookEntry, `amount`, `paymentDate`, `paymentReference`.
- **ProcurementInvoice** (`procurement_invoices`): the procurement-side supplier invoice, with a separate AP path. Fields: `invoiceNumber`, `purchaseOrderId`, `vendorId`, `status` (RECEIVED...), `paymentStatus`, `financeHandoffStatus` (READY_FOR_FINANCE...), `journalEntryId`, `cashbookEntryId`.
- **VendorInvoiceIntake** (`vendor_invoice_intakes`): PDF/LLM bill intake. Fields: `intakeNumber`, `status`, `vendorId`, `sourcePurchaseOrderId`, `goodsReceivedNoteId`, `purchaseInvoiceId`→PurchaseInvoice (unique), `overallConfidence`.
- **GoodsReceivedNote / GoodsReceivedNoteItem / GrnReturnToVendor**: procurement receipt. Fields: `grnNumber`, `purchaseOrderId`, `status`, `qualityStatus`, `receiptType` GOODS|SERVICE|MIXED. Referenced by bills for three-way match. There are no GL postings at GRN (no GRNI accrual).

#### Accounts receivable
- **Customer** (`customers`): fields `name`, `taxNumber`, `contactPerson`, `email`, `paymentTerms`, `isActive`.
- **Invoice** (`invoices`): sales invoice. Fields: `customerId`→Customer, `invoiceNumber`, `status` String (DRAFT/SENT/PAID/VOID), `totalAmount`/`outstandingAmount`/`paidAmount`, `currencyId`/`paymentCurrencyId`→Currency, `dueDate`, `journalEntryId`→JournalEntry, `vendorId` (legacy "supplier bill" flag), FX snapshots at creation/sent/paid.
- **SalesInvoiceItem** (`sales_invoice_items`): inventory-backed line. Fields: `invoiceId`→Invoice, `itemId`→InventoryItem, `quantity`, `unitPrice`, `unitCost`, `totalCost`.
- **CreditNote** (`credit_notes`): fields `customerId`, `invoiceId`→Invoice, `creditNoteNumber` (unique), `status` (DRAFT/SENT/APPLIED), `totalAmount`, `appliedAmount`/`remainingAmount`, `journalEntryId`.
- **StatementOfAccount** (`statement_of_accounts`): customer or vendor statement. Fields: `customerId?`/`vendorId?`, `statementDate`, `opening/closingBalance`, `totalDebits/Credits`, `statementType`, `currencyId`.
- **StatementItem** (`statement_items`): fields `statementId`, `transactionDate`, `debit/creditAmount`, `balance`, `transactionType`, `transactionId`.
- There is no dedicated **Receipt** model: receipts are `CashbookEntry(type=RECEIPT)`, allocated through PaymentAllocation.

#### Revenue and expenses
- **Revenue** (`revenues`): direct revenue record. Fields: `sourceId`→RevenueSource, `categoryId`→RevenueCategory, `totalAmount`, `status` String (DRAFT...), `paymentMethod`, `journalEntryId`.
- **RevenueSource** / **RevenueCategory** (`revenue_sources`/`revenue_categories`): lookups. Fields: `name` (unique), `parentId` (category hierarchy), `isActive`.
- **Expense** (`expenses`): direct expense. Fields: `vendorId`→Vendor, `categoryId`→ExpenseCategory, `totalAmount`, `vatAmount`, `status` String (DRAFT...; the `ExpenseStatus` enum is unused), `paymentMethod` BANK/CREDIT, `journalEntryId`.
- **ExpenseCategory** (`expense_categories`): `name` (unique), `parentId`, `isActive`.
- There is no **expense-claim/reimbursement** model. The closest is the Employee↔Vendor "reimbursement vendor" shell (`Vendor.reimbursementEmployee`). The V52 "Claims" page has no dedicated backend entity.

#### Fixed assets
- **Asset** (`assets`): fields `assetCode` (unique), `cost`, `usefulLifeYears`, `depreciationMethod`, `currentBookValue`, `salvageValue`, `status` String (IN_USE/DISPOSED), and `assetAccountId`/`accumulatedDepreciationAccountId`/`depreciationExpenseAccountId`→CoA.
- **DepreciationRecord** (`depreciation_records`): fields `assetId`, `period`, `depreciationAmount`, `accumulatedDepreciation`, `bookValue`, `isPosted`, `postedAt`. Unique on (asset, period).
- **AssetDisposalRecord** (`asset_disposal_records`): fields `assetId`, `disposalDate`, `disposalValue`, `disposalMethod`, `gainLoss`.

#### Inventory
- **InventoryItem** (`inventory_items`): fields `skuNumber` (unique), `itemName`, `costOfPurchase`, `quantityOnHand`, `reorderLevel`, `supplierId`→Vendor, `inventoryAssetAccountId`→CoA.
- **StockMovement** (`stock_movements`): fields `itemId`→InventoryItem, `movementType` String (IN/OUT/ADJUSTMENT...), `quantity`, `unitCost`, `totalCost`, `reference`.
- **InventorySettings** (`inventory_settings`, raw-SQL singleton): `allowNegativeStock`.

#### Short-term investments (money-market, T-bills)
- **ShortTermInvestmentSettings** (raw-SQL singleton): `postingMode` DRAFT|APPROVED, `lastAccrualWatermark`, `fiscalTimezone`.
- **ShortTermInvestmentInstrument** (raw-SQL): fields `name`, `status` ACTIVE|SETTLED|VOIDED, `principal`, `currencyId`/`functionalCurrencyId`, `compoundingMethod` SIMPLE|COMPOUND_DAILY|COMPOUND_MONTHLY, `settlementBankId`→Bank, six GL account FKs (principal, accrued, income, negative-yield, unrealised FX, realised FX), `maturityDate`, `liquidationJournalEntryId`.
- **ShortTermInvestmentApyRate** (raw-SQL): fields `instrumentId`, `effectiveFrom/To`, `apy`.
- **ShortTermInvestmentAccrual** (raw-SQL): daily accrual. Fields: `instrumentId`, `accrualDate`, `amountInstrumentCcy`, `runningAccruedBalance`, `apyRateId`, `status` PENDING_POST|POSTED|REVERSED, `journalEntryId`/`reversalJournalEntryId`.
- **ShortTermInvestmentFxRevaluation** (raw-SQL): fields `instrumentId`, `yearMonth`, `journalEntryId`, `prior/revisedCarryingFunctional`.

#### VAT and tax
- **VatRate** (`vat_rates`, raw-SQL via letterhead/VAT migration): fields `name`, `rateDecimal` (0.155 = 15.5%), `isActive` (one active). There is **no VAT-return model**: the VAT report is computed on the fly (`VATReportService`, `/api/vat/report`), and the pack stores VAT totals.
- **TaxReturnPack** (`tax_return_packs`, raw-SQL): ZIMRA CIT/CGT/VAT pack. Fields: `forecastEntityId`→ForecastEntity, `fundId`→Fund, `taxYear`, `taxPeriod`, `taxRegime`, `status` String (DRAFT/COMPILED/IN_REVIEW/APPROVED/LOCKED), `citLiability`/`cgtLiability`/`vatNetPayable`, and `journalEntryId` (plain string, no Prisma relation).
- **TaxReturnPackReconciliationLine**: fields `packId`, `lineCode`, `accountNo`, `glBalance`, `taxAdjustment`, `taxCategory` BOOK/...
- **TaxReturnPackCgtLine**: fields `packId`, `assetRef`, `sourceType/Id`, `salePrice`, `costAdjusted`, `capitalGain`, `cgtLiability`.
- **TaxReturnPackLedgerSnapshot**: frozen GL lines. Fields: `packId`, `journalEntryId`, `journalLineId`, `accountNo`, `amount`, `amountUsd`/`amountZig`.
- **TaxReturnPackLineOverride**: fields `packId`, `reconciliationLineId`, `prior/newTaxCategory`, `overriddenById`.
- **TaxAdjustmentRule**: fields `ruleCode`, `matchType`, `matchValue`, `taxCategory` (seeded; read-only).
- **TaxReturnPackAuditEvent**: fields `packId`, `eventType`, `actorId`, `details`.

#### Budgets
- **Budget** (`budgets`): accounting budget. Fields: `name`, `budgetType`, `period`, `totalBudgeted`/`totalActual`/`totalVariance`, `status` String "draft" (the `BudgetStatus` enum is unused), `isActive`, `startDate/endDate`.
- **BudgetItem** (`budget_items`): fields `budgetId`→Budget, `category`, `accountCode` (free-text, no FK to CoA), `budgetedAmount`, `actualAmount`, `variance`, `isSignificantVariance`.
- **VarianceReport** (`variance_reports`): fields `budgetId`, report payload.
- The FP&A `Planning*` models (PlanningModel/Version/Cell/ActualsSnapshot...) are a separate budgeting engine and out of scope, except for the GL-actuals read in Part 2.

#### Projects and timesheets
- **Project** (`projects`, raw-SQL): fields `name`, `clientName`, `projectType`, `budget`, `status` ACTIVE..., `ownerId`, `goalId`, `departmentName`.
- **Timesheet** (`timesheets`, raw-SQL): fields `userId`, `weekEnding`, `status` DRAFT|SUBMITTED|APPROVED|RETURNED, `approvedById/At`, `returnReason`.
- **TimesheetEntry** (`timesheet_entries`, raw-SQL): fields `timesheetId`, `projectId`→Project, `date`, `hours`, `billable`, `taskId`. There is no GL/WIP/billing link yet.

#### Consolidation / multi-entity
- **ForecastEntity** (`forecast_entities`): legal entity/subsidiary or external startup. Fields: `name`, `type` INTERNAL_SUBSIDIARY|EXTERNAL_STARTUP, `baseCurrency`, `isDefault` (maps to CompanyProfile), `portfolioCompanyId`. JEs are tagged via `JournalEntry.forecastEntityId`, and eliminations via `isEliminationEntry`.
- **EntityChartOfAccount** (`entity_chart_of_accounts`): per-entity CoA clone. Fields: `entityId`, `accountNo`, `accountType`, `sourceAccountId`→ChartOfAccounts.
- **CompanyProfile** / **CompanyProfileAddress**: letterhead and fiscal timezone (`fiscalTimezone`).

#### Documents and approvals
- **AccountingDocument** (`accounting_documents`, raw-SQL): document vault. Fields: `name`, `category` (General...), `fileUrl`, `storagePath`, `mimeType`, `fileSizeBytes`, `uploadedById`. There is no FK link to JEs/bills.
- **ApprovalRequest** (`approval_requests`): generic multi-step approval. Fields: `entityId`, `entityData` Json, `stageType`, `status` PENDING/APPROVED/REJECTED, `currentStep/totalSteps`, `configId`→ProcurementApprovalConfig. It is reused for accounting gates (`MASTER_DATA_COA` CoA edits, bill payment and STI placement over threshold, via `PaymentInvestmentApprovalService`, seeded by `db:migrate:accounting-approval-configs-seed`).
- **Approval** (`approvals`): fields `requestId`, `stageId`→ProcurementApprovalStage, `approverId`, `status`, `delegatedToId`, `signatureData`.

#### Other models carrying GL links (non-accounting owners)
CapitalCall, ManagementFeePeriod, Distribution, PortfolioCompanyDividend, PayrollRun, PerformanceGoalProgressEvent and ListedEquityTradeSettlement all hold `journalEntryId` with a Prisma relation. CapTableTransaction, FundraisingCommitment/Deal, DealExecutionPack and TaxReturnPack hold a `journalEntryId` string with no relation. InvestmentAccountingEvent / InvestmentAccountingJournalWorkflow / InvestmentAccountingReversal / InvestmentAccountingExportLink form the investment-ops accounting facade. CapTableGlMapping, FundraisingCampaignGlMapping and SpCashGlExport are GL account mappings or exports.

### 6.2 Raw-SQL tables

Tables created by `scripts/run-*-migration.ts` (raw `CREATE TABLE`) rather than by `prisma/migrations`. All of them are also declared as Prisma models (so `prisma generate` knows them), but `prisma migrate`/`db push` would not create them correctly.

| Script (`npm run db:migrate:*`) | Tables |
|---|---|
| `run-accounting-close-tasks-migration.ts` (`accounting-close-tasks`) | `accounting_close_tasks` (FK `depends_on_id` ON DELETE SET NULL in SQL, NoAction in Prisma) |
| `run-accounting-documents-migration.ts` (`accounting-documents`) | `accounting_documents` |
| `run-recurring-journal-tables-migration.ts` (`recurring-journal-tables`) | `recurring_journal_templates`, `recurring_journal_runs` |
| `run-short-term-investment-tables-migration.ts` (`short-term-investments`) | `short_term_investment_settings`, `_instruments`, `_apy_rates`, `_accruals`, `_fx_revaluations` |
| `run-fiscal-period-lock-migration.ts` (`fiscal-period-lock`) | `fiscal_years`, `fiscal_periods`, `module_period_locks`, `company_accounting_policies`, `period_lock_drafts`, `posting_exceptions`, `period_lock_audit_logs` |
| `run-cashbook-reconciliation-session-migration.ts` | `cashbook_reconciliation_sessions`, `cashbook_reconciliation_session_lines` |
| `run-timesheets-projects-migration.ts` | `projects`, `timesheets`, `timesheet_entries` |
| `run-tax-return-pack-migration.ts` (+ `-gaps`, `-vat-fields`) | `tax_return_packs`, `tax_return_pack_reconciliation_lines`, `_cgt_lines`, `_ledger_snapshots`, `_line_overrides`, `tax_adjustment_rules`, `tax_return_pack_audit_events` |
| `run-inventory-settings-migration.ts` | `inventory_settings` |
| `run-purchase-invoice-batch-payment-migration.ts` | `purchase_invoice_payments` |
| `run-letterhead-addresses-and-vat-migration.ts` | `company_profile_addresses`, `vat_rates` |
| `run-procurement-invoice-auto-approval-migration.ts` | `procurement_settings` |
| `run-investment-ops-v2-migration.ts` | `investment_accounting_events`, `investment_reconciliation_batches/_items` |

Column-only raw-SQL migrations on existing accounting tables: `journal-entry-forecast-entity` (adds `forecast_entity_id` and `is_elimination_entry` to journal_entries), `journal-line-amount-precision` (Decimal 15,3), `journal-line-recorded-currency`, `chart-natural-balance`, `exchange-snapshots` / `invoice-lifecycle-rates` / `invoice-payment-snapshots` (usdZwg snapshots), `bank-gl-to-cash-equivalents`, `purchase-invoice-source-po`, `cashbook-receipt-attachment`, `vendor-master`, `vendor-tax-compliance`, `vat-drop-effective-from`.

**Tables with no Prisma model at all:**
- `financial_reports` (`scripts/sql/add_financial_reports_table.sql`): investee financial reporting. Accessed through `$queryRaw` in `FinancialReportService`.
- `portfolio_company_valuations`: raw SQL.
- `invoice_categories`: created by the first `20250805073810_coa` Prisma migration and since dropped from the schema. Orphaned, with no code reference.
- `approval_workflows` / `approval_steps` (migration `20251006094806_dssa`): no Prisma model, yet `src/services/ApprovalWorkflowService.ts` calls `prisma.approvalWorkflow.*`. The mounted route `/api/approval-workflows` therefore throws at runtime (`@ts-nocheck` hides the error).

### 6.3 Models without routes

Method: grepped `.<camelModel>.(find|create|update|upsert|delete|count|aggregate|groupBy)` across `src/`, then traced each using service to a mounted router in `src/app.ts`.

**No code usage at all**
- `ExchangeRateDisplaySource`: no reads or writes anywhere in `src/`.

**Used only by code that is not mounted (unreachable over HTTP)**
- `CashbookImportBatch`: only via `CashbookImportController` / `CashbookImportService` / `BatchImportExportService`. `routes/cashbookImportRoutes.ts` is never imported in `app.ts`.
- `CashbookExport`: only via `BatchImportExportController/Service`. `routes/batchImportExportRoutes.ts` is imported in `app.ts` (line 688) but never passed to `app.use`.
- Other route files with no mount: `controlAccountRoutes.ts` (customer/supplier payment-summary, apply-payment), `openItemRoutes.ts` (superseded by the mounted `openItemMatchingRoutes`), `cashbookAdditionalRoutes.ts` (a duplicate of endpoints already served by `cashbookRoutes.ts` / `bankReconciliationRoutes.ts`).

**Internal-only (no CRUD route by design)**
- `AuditTrailSequence`: used internally by `AuditTrailSequenceService`.
- `TaxAdjustmentRule`: seeded, read by `TaxReturnPackLedgerIngestService`, with no create/edit endpoint.
- `PostingException`: written by `PeriodLockService`/`PostingGuardService`. Read-only list at `GET /api/accounting/fiscal-calendar/posting-exceptions`, with no resolve or retry endpoint.
- `AccountingPeriod` / `PeriodLockout`: legacy tables still dual-written by `PeriodLockService.commit`. `PeriodLockout` is exposed via `/api/cashbook/periods`.

**Dead writer code (worth knowing)**
- `src/services/AccountingPostingClient.ts`: HTTP client for `/accounting/api/post_journal_entry` with zero importers.
- `src/services/YearEndCloseService.ts` `runYearEndClose()`: creates the closing JE, but has no caller and no route. There is no year-end close endpoint.
- `ProcurementService.convertPOToBill()` (service line about 5052): writes a supplier bill into the AR `invoices` table (generic customer + `vendorId`). It has no callers; the live `/procurement/.../convert-to-bill` uses `PurchaseInvoiceService.createVendorBillFromPurchaseOrder`.
- No in-process scheduler exists for recurring journals, despite the schema comment "cron posts". They post only via `POST /recurring-journal-templates/run-due` or `/:id/run`. Depreciation runs via `POST /api/cron/depreciation/monthly` (external cron) or `/assets/depreciation/cron/monthly`. STI accrual runs on user login (`AuthController` → `ShortTermInvestmentService.maybeRunDailyAccrualAfterLogin`, 24h watermark).

Every other accounting model listed above is reached from a mounted route.

### 6.4 Backend routes not used by the Accounting V52 UI

The V52 host calls the following modules. Endpoints were resolved from the methods actually invoked in `lib/accounting-v52/{live-loaders,actions}.ts` and `components/accounting-v52-mock/accounting-v52-app.tsx`:
- `accountingApi`: 29 methods.
- `cashbookApi`: `createCashbookReceipt`/`Payment`/`Transfer`, `getCashbookBanks`, `getOpenItemsForCustomer`, `matchOpenItems`.
- `reconciliationApi`: session create, finish and discard, plus entries.
- `chartOfAccountsApi`.
- `tax-return-pack-api`: list, create, compile, forecast-entities.
- `accounting-documents-api`: list and upload.
- `consolidation-api`: summary.
- `accounting-close-tasks-api`: fiscal-calendar GET, tasks list, task PATCH.
- `approvals-api`: my-pending, approve, reject.
- `timesheets-api`: pending-approval, approve, return, projects.
- `short-term-investments-api`: `getSTIDashboard` only.
- `audit-log-api`.
- `procurement-v23-api`: invoices, POs, quotations, RFQs, vendors, pay.

The financial statements (IS/BS/CF/TB) are **computed client-side** in `lib/accounting-v52/financial-statements.ts` from journal lines. They are not fetched from the backend report endpoints.

#### Prefixes never called by V52 (no method in the chain hits them)

| Backend prefix | Endpoints | Notes |
|---|---|---|
| `/api/accounting/income-statement` | 11 (generate, detailed, comparative, with-budget-variance, consolidated...) | wrappers exist in accounting-api.ts but are unused by V52 |
| `/api/accounting/balance-sheet` | 3 (generate, get, consolidated) | same |
| `/api/accounting/cash-flow` | 6 | same |
| `/api/accounting/trial-balance` | 3 (`/`, `/summary`, `/by-account-type`) | same |
| `/api/accounting/statement-of-equity` | 1 (`POST /generate`) | not wrapped at all |
| `/api/accounting/gl-ledger-detail` | 2 (`/`, `/bank/:bankId`) | not wrapped; the GL drill-down is client-side |
| `/api/accounting/dashboard` | 1 (`GET /`) | accounting-api.ts calls non-existent `/dashboard/stats`, `/sales-chart`, `/credit-notes-chart` |
| `/api/accounting/revenues`, `/revenue-sources`, `/revenue-categories` | 5 each (CRUD) | not wrapped |
| `/api/accounting/credit-notes` | 10 (CRUD, send, apply, report, dashboard) | wrapped, unused by V52 |
| `/api/accounting/statements` | 14 (customer/vendor statements, email, format) | not wrapped |
| `/api/accounting/vat-rates` | 6 | wrapped, unused |
| `/api/vat` | 2 (`/report`, `/report/output-tax-audit`) | not wrapped. The V52 VAT view has no backend report |
| `/api/accounting/v1` | 3 (`/pe/portfolio-irr`, `/kpis/portfolio-irr`, `/pe/portfolio-total-revenue`) | a feed for Performance sync, not a UI |
| `/accounting/api/post_journal_entry` | 1 (no `/api` prefix) | external posting endpoint |
| `/api/cashbook/batches` (batch import) | 8 | wrapped in cashbook-api.ts, unused |
| `/api/cashbook/transactions`, `/api/cashbook/reversals` | 4 (reverse, history, can-reverse) | wrapped, unused |
| `/api/cashbook/contra` | 5 | wrapped, unused |
| `/api/cashbook/entry-types` | 8 | wrapped, unused |
| `/api/cashbook/periods` | 5 (legacy lock) | wrapped, unused |
| `/api/cashbook/entries*`, `/:bankId/summary`, `/:bankId/unreconciled`, `/export-audit`, templates, discounts, reference numbers, customers/vendors/invoices sub-routes | about 40 | only `/receipts`, `/payments`, `/banks`, `/vendors`, `/transfers`, `/open-items/customers`, `/open-items/match`, `/reconciliation/banks/:id/{entries,sessions}` and `/reconciliation/sessions/:id/{finish,discard}` are used |
| `/api/budget-management` | 12 (budgets, items, variance reports, analytics) | not wrapped. V52 has no budget data source |
| `/api/company-profile` | settings/letterhead | not called by V52 |
| `/api/exchange-rate-display` | rate ticker | V52 runtime scrapes RBZ directly in-browser (`refreshOfficialRateV5`, via allorigins proxy) instead |

#### Prefixes V52 touches only partially (write/ops endpoints unused)
- `/api/accounting/short-term-investments`: only `GET /dashboard`. Unused: instruments CRUD, APY rates, catch-up, liquidate, void, accrual approve, month-end FX reval, settings.
- `/api/accounting/fiscal-calendar`: only `GET /`. Unused: `PUT /locks/draft`, `POST /locks/commit`, `GET /period-lock/audit`, `GET /posting-exceptions`, `PATCH /policy`. V52 cannot lock a period.
- `/api/accounting/close-tasks`: list and PATCH status used. Unused: `POST /periods/:id/tasks` (create) and `GET /periods/:id/can-lock`.
- `/api/accounting/bank-reconciliation`: list and unmatched used by V52. Wrapped but not invoked: upload, approve-match, reject, audit-trail, summary. Not wrapped: `/manual-reconcile`, `/create-journal`, `/:id/report`, `/import`, `/template`.
- `/api/accounting/multi-currency`: only `GET /reports/unrealized-fx`. Unused: exchange-rate CRUD (wrapped), convert, payments, forex-gain-loss, calculate/post-forex-gain-loss, bank revalue, dashboard, reconcile-invoice.
- `/api/accounting/assets`: V52 uses list and create. Wrapped but not invoked: depreciation, backfill, post, dispose, register, schedule.
- `/api/accounting/inventory`: V52 uses items list, movements, adjustments. Unused: settings, valuation, reorder-alerts, sales-invoice, calculate-cogs, report, dashboard.
- `/api/accounting/purchase-invoices`: V52 uses list and pay. Wrapped but not invoked: submit, batch-pay, creditors-age-analysis, banks, expense-accounts.
- `/api/accounting/journal-entries`: by-date-range, create, post and void used. Unused: `PUT /:id` (edit pending), `GET /:id`.
- `/api/accounting/recurring-journal-templates`: list, run and run-due used. Unused: `POST /` (create) and `PATCH /:id/active`.
- `/api/accounting/timesheets`: pending-approval, approve and return used. Unused: mine, team, entries, submit.
- `/api/accounting/projects`: GET used. Unused: POST and PUT.
- `/api/tax-return-packs`: list, create and compile used. Unused: `/:id`, dashboard, reconciliation, cgt, submit-review, pdf, audit (and the sign-off path that posts the tax accrual JE).
- `/api/accounting/customers`, `/expenses`, `/invoices`: list, create, send and mark-paid used. Update, delete and void are wrapped but unused.

Stale paths in `accounting-api.ts` with **no backend route**: `/accounting/accounts`, `/accounting/suppliers`, `/accounting/reports/trial-balance`, `/accounting/dashboard/stats|sales-chart|credit-notes-chart`. V52 does not call them, but any other consumer of those wrappers would get a 404.

---

## 7. Integrations (other modules posting to or reading the GL)

GL writes go through two helpers in `src/services/AuditTrailSequenceService.ts`: `createJournalEntryWithAuditSequence()` and `assignNextAuditIdAndCreateJournal(tx, ...)`. Both enforce the GL period lock (`PeriodLockService.assertModuleDateOpen`), assign an audit number and default the `forecastEntityId`. Lines are then written with `journalEntryLine.create`. Higher-level wrappers are `JournalEntryService.createManualJournalEntry` / `createExpenseJournalEntry` and `CashbookService.createCashPayment` / `createCashReceipt` (cashbook entry plus bank JE).

| Source module | File :: function | Direction | What | Trigger |
|---|---|---|---|---|
| Procurement (P2P pay) | `services/ProcurementService.ts :: payProcurementInvoice` | writes GL | `JournalEntryService.createExpenseJournalEntry` (Dr Expense/VAT, Cr AP, category "PROCUREMENT"), then `CashbookService.createCashPayment` (Dr AP, Cr bank). Links `ProcurementInvoice.journalEntryId/cashbookEntryId` | Manual: `POST /api/procurement/invoices/:id/payment` (V52 also calls this via `payProcurementInvoice`) |
| Procurement (PO → bill) | `controllers/ProcurementController.ts :: convertPOToBill` → `PurchaseInvoiceService.createVendorBillFromPurchaseOrder` | writes AP subledger | Creates a DRAFT `PurchaseInvoice` with `sourcePurchaseOrderId`. The JE is posted later by `PurchaseInvoiceService.submitInvoice` (Dr expense/VAT, Cr AP), with a 20% over-PO guard | Manual |
| Procurement (Suite 06 intake) | `services/VendorInvoiceIntakeService.ts` (confirm path) → `PurchaseInvoiceService.createPurchaseInvoice` | writes AP subledger | LLM-extracted vendor PDF becomes a draft `PurchaseInvoice` linked to PO/GRN; three-way match fields `suite06MatchStatus` | Manual confirm |
| Procurement (finance handoff) | `services/p2p/InvoiceControlService.ts` | none | `financeHandoffStatus` state machine only. No GL or AP-bill creation | Manual |
| Procurement (read) | `controllers/ProcurementController.ts :: getAllPayments` | reads GL | `journalEntry.findMany` for payment listing | On request |
| Procurement (legacy, dead) | `services/ProcurementService.ts :: convertPOToBill` | would write AR table | `prisma.invoice.create` with vendorId (supplier bill in the sales-invoice table). No callers | n/a |
| Payroll (run) | `services/PayrollService.ts :: processPayrollRun` → `createPayrollJournalEntry` | writes GL | `createJournalEntryWithAuditSequence` (salary expense vs net-pay and statutory/deduction liability accounts resolved by `payrollGlAccountResolver` / `payrollLiabilityAccountHelpers`). Sets `PayrollRun.journalEntryId`; the run is not COMPLETED until the JE succeeds | Automatic on `POST /api/payroll/payroll-runs/:id/process` |
| Payroll (repair) | `PayrollService.ts :: repairCompletedPayrollRunAccounting` | writes GL | Re-creates a missing payroll JE, then re-syncs the budget | Manual/admin |
| Payroll (payment) | `PayrollService.ts :: processPayrollPayment` | writes GL + cashbook | `prisma.cashbookEntry.create` directly (bank PAYMENT) plus `createJournalEntryWithAuditSequence` (Dr net-pay liability, Cr bank) | Manual `POST /payroll-runs/:id/payment` |
| Payroll → Budget | `services/BudgetPayrollSyncService.ts :: syncPayrollRunToBudget` | writes Budget | Updates salary `BudgetItem.actualAmount` / `Budget.totalActual` for the active budget period | Automatic inside processPayrollRun |
| Performance (goal progress) | `PerformanceGoalProgressBridge` → `PerformanceGlPostingService.postEvent` → `KpiAccountingIntegrationService.postPerformanceProgressJournal` | writes GL | `createJournalEntryWithAuditSequence` (Dr/Cr KPI GL account vs bank/counter-account from Performance settings). Links `PerformanceGoalProgressEvent.journalEntryId`. Correction events post reversals | Automatic on each KPI-mapped goal progress event |
| Performance (achievement) | `PerformanceGoalService.ts` / `PerformanceWorkflowService.ts :: triggerAccountingIntegration` → `KpiAccountingIntegrationService.triggerKpiAchievementJournal` | writes GL | Posts pending progress events for the goal | Automatic on goal achievement/approval |
| Performance (retry) | `PerformanceAlertRuleService.ts :: startPerformanceGlRetryScheduler` (tick) → `PerformanceGlPostingService.retryFailed({limit:100})` | writes GL | Retries failed performance postings | Automatic: `setInterval` every 15 min (first run 4 min after boot, started in `app.ts:935`). Also manual `POST /api/performance/integration/gl-postings/retry` |
| Performance (void hook) | `JournalEntryService.voidJournalEntry` → `PerformanceGlPostingService.onJournalVoided` | GL → Performance | Voiding a JE un-posts the linked progress event | Automatic |
| Performance (read) | `AccountingGoalSyncService.runSyncJob` → `FinancialKpiGlValueService` (calls `BalanceSheetService.generateBalanceSheet`, `IncomeStatementService.generateIncomeStatement`) and `AccountingGlPeriodTotalsService` (`journalEntryLine.aggregate`) | reads GL | Financial KPI values and baselines (`syncConfig.glBaselines`). The same GL-totals reader is used by `EnhancedGoalTrackingService` (`getIncomeStatementMetric`, `getBalanceSheetMetric`, `getAccountBalance`), `PerformanceDashboardService`, `PerformanceAnalyticsService`, `BscDigitalEntryService` and `PerformanceGoalService` | Automatic on sync jobs; manual refresh |
| Performance (integration overview) | `PerformanceIntegrationOverviewService.overview/refreshAll` + `startPerformanceIntegrationRefreshScheduler` | reads GL indirectly | Reads only performanceGoal/syncJob rows. `refreshAll` runs `PerformanceIntegrationService.runManualSync`, which calls each goal's `syncEndpointPath` (e.g. `/api/accounting/v1/pe/portfolio-irr`) | Hourly scheduler (goals with `/v1/` endpoints) + manual `POST /api/performance/integration/refresh` |
| Performance (misc reads) | `PerformanceDashboardService.getAccountingBudgetForPeriod` (budget.findMany); `PerformanceKpiRegistryService.list/assertRefs` (CoA lookup for KPI→account mapping); `TargetTrackingService.getRevenueData/getExpenseData` (journalEntry.findMany); `DataIntegrationService.calculateOperationalMetrics` (journalEntryLine) | reads GL/Budget | Dashboards, KPI registry validation | On request |
| Performance (alerts) | `PerformanceAlertRuleService` (`startPerformanceAlertScheduler`) | none | Alert rules evaluate performance data, not GL | 60 s scheduler |
| Accounting v1 feed → Performance | `routes/accountingPeIntegrationV1Routes.ts` → `AccountingPeIntegrationController` → `PortfolioDashboardService.getWeightedFundGrossIrrForPeSync` / `getAggregatedPortfolioTotalRevenue` | reads portfolio (not GL) | Exposes PE IRR / portfolio revenue under `/api/accounting/v1` for performance goal sync | Pulled by the Performance sync |
| FP&A (actuals) | `services/fpa/FpaActualsService.ts :: sync` | reads GL | `journalEntryLine.findMany` into `PlanningActualsSnapshot` for line items mapped to CoA accounts | Manual `POST /api/v1/fpa/actuals/sync`; automatic inside `FpaBudgetCycleService` (lines ~612, ~1283) and `FpaModelSetupService` (~554, ~962) |
| FP&A (CoA mapping) | `FpaDataMappingService.refresh`, `FpaModelSetupService.preflight/ensureMinimalScopeAndCoa/setCoa` | reads CoA | Pulls global CoA into planning models | Manual setup |
| Forecast entities / consolidation | `ForecastEntityService.resyncFromGlobalCoa` | reads CoA, writes EntityChartOfAccount | Clones global CoA per entity | Manual `POST /api/forecast-entities/:id/...resync` |
| Forecast entities / consolidation | `AuditTrailSequenceService.resolveDefaultForecastEntityId` | writes GL tag | Every new JE defaults `forecastEntityId` to the default entity | Automatic |
| Forecast entities / consolidation | `ConsolidatedReportService.loadJournalLinesWithCoaForConsolidated/generateConsolidatedBalanceSheet` | reads GL | Consolidation by entity, eliminations layer | On request |
| Capital calls (Fund) | `services/CapitalCallService.ts :: initiate` | writes GL | `assignNextAuditIdAndCreateJournal` (Dr 1210 Capital Contributions Receivable, Cr 3010 Partners Capital Uncalled) plus lines; sets `CapitalCall.journalEntryId` | Manual `POST /api/funds/:fundId/capital-calls` |
| Capital calls (Fund) | `CapitalCallService :: recordAllocationPayment` | writes GL | Receipt JE (Dr bank, Cr 1210 receivable) per LP payment | Manual |
| Management fees (LP fees) | `services/ManagementFeeService.ts :: accrueForPeriod` / `recordAllocationPayment` | writes GL | Fee accrual JE (Dr 1220 Management Fee Receivable / Cr 4010 Management Fee Revenue) and payment JE clearing 1220; `ManagementFeePeriod.journalEntryId` | Manual via `lpFeesAndDistributionsRoutes` (`/api/funds/...`) |
| Distributions | `services/DistributionService.ts :: create` / `recordAllocationPayment` | writes GL | Declaration JE (Dr source income e.g. 4100, Cr 2400 Distributions Payable + Cr 4020 Performance Fee Revenue for carry) and payout JE (Dr 2400, Cr bank); `Distribution.journalEntryId` | Manual via `lpFeesAndDistributionsRoutes` |
| Portfolio (investee valuations/dividends) | `services/PortfolioCompanyAccountingService.ts :: recordValuationAdjustment` / `recordDividend` (→ private `createJournalEntryFromAccountCodes` → `JournalEntryService.createManualJournalEntry`) | writes GL | Unrealised FV gain/loss JE; dividend receivable/income JE (`PortfolioCompanyDividend.journalEntryId`) | Manual `POST /api/portfolio-companies/:id/...` **and automatic** from `FinancialReportService.runPostApprovalAutomations` when an investee's submitted financial report is approved |
| Investment implementation (fund disbursement) | `services/InvestmentImplementationService.ts :: approveFundDisbursement` | writes GL + cashbook | `CashbookService.createCashPayment` (Dr portfolio investment GL, Cr bank); `FundDisbursement` gets `cashbookEntry` | Automatic on disbursement approval (`investmentImplementationRoutes`) |
| Investee portal | `services/ApplicantPortalService.ts` | reads (no GL) | Reads `fundDisbursement` for the investee's disbursement status. Investee-submitted financial reports feed the valuation/dividend automation above | Indirect |
| Listed equity trades | `listedEquity/TradeOrchestratorService.ts :: processRouting / ensureSettlementPosted` → `ListedEquityGlPostingService.postSettlement` | writes GL | `createJournalEntryWithAuditSequence` header, then `InvestmentAccountingFacadeService.commitSettlementBundle` writes `journalEntryLine.create` directly, plus `ListedEquityTradeSettlement.journalEntryId`, `InvestmentTransaction`, cash ledger and `InvestmentAccountingEvent` | Automatic when a trade routing hop reaches settlement |
| Listed equity trades | `listedEquity/CoreBankingBridgeService.ts :: placeHold` | writes cashbook | `prisma.cashbookEntry.create` directly (PAYMENT, PENDING, "Listed equity buy hold") with no JE | Automatic during trade routing |
| Investment ops (orders) | `InvestmentOrderPhase2Service :: ensureOrderSettlementAccounting` → `InvestmentAccountingFacadeService.recordFromOrderSettlement` | event only | Creates `InvestmentAccountingEvent` NOT_POSTED ("journal optional until GL mapping exists"): **no JE** | Automatic on order settlement |
| Investment ops (facade) | `InvestmentAccountingFacadeService.journalWorkflow` (updates `journalEntry.status` directly), `approveReversal` (creates reversing JE), `createLedgerExport` (reads journals) | writes/reads GL | Investment-ops journal approve/post/reverse and ledger export | Manual `/api/investment-ops/accounting/*` |
| Investment ops (reconciliation) | `InvestmentReconciliationService.executeBatch` | reads cashbook | `cashbookEntry.aggregate` vs custodian | Manual |
| Cap table | `capTable/CapTableTransactionExecutionService.ts :: execute` → `CapTableGlPostingService.postIssuance` | writes GL | `JournalEntryService.createManualJournalEntry` via `CapTableGlMapping` account codes | Automatic on executing a cap-table transaction |
| Fundraising | `fundraising/FundraisingCloseService.ts :: closeDeal`, `FundraisingSrdService.ts :: admitCommitment` → `FundraisingGlPostingService.postCommitment` | writes GL | Manual JE via `FundraisingCampaignGlMapping` | Automatic on close/admit |
| Deal execution packs | `dealExecutionPack/DealExecutionPackExecuteService.ts :: execute` → `DealExecutionPackGlPostingService.postInvestment` | writes GL | Investment JE via `createManualJournalEntry` | Automatic on pack execution |
| Tax return packs | `taxReturnPack/TaxReturnPackApprovalService.ts :: signOff` → `TaxReturnPackGlPostingService.postTaxAccrual` | writes GL | CIT/CGT tax accrual JE; `TaxReturnPack.journalEntryId` | Automatic on sign-off |
| Tax return packs | `TaxReturnPackLedgerIngestService`, `TaxReturnPackSaftCompileService`, `TaxReturnPackWhtCompileService`, `TaxReturnPackPreflightService` | reads GL | `journalEntryLine` into ledger snapshots, SAF-T and WHT schedules | On compile |
| Quarterly LP statements | `quarterlyStatements/QuarterlyStatementPreflightService` | reads GL | Blocks if capital-call or distribution JEs are not POSTED | On run |
| Quarterly LP statements | `QuarterlyStatementLedgerFreezeService` | reads cashbook | Freezes `cashbookEntry` rows | On run |
| Events | `services/EventService.ts :: recordExpense` | writes GL | `JournalEntryService.createExpenseJournalEntry` for event expenses | Automatic when an event expense is recorded |
| Events | `EventService :: approveBudget` → `createBudgetAllocationJournalEntry` | writes GL + CoA | `createJournalEntryWithAuditSequence` + direct `journalEntryLine.create`. **Auto-creates CoA accounts** (`getOrCreateEventBudgetAccount`, `getOrCreateCashAccount`) | Automatic on event budget approval |
| Budget management | `services/BudgetManagementService.ts` | none to GL | Budget CRUD only. `BudgetItem.actualAmount` is manual except for payroll sync; there is no GL-actuals pull | Manual `/api/budget-management` |
| Portfolio dashboard | `PortfolioDashboardService.getPostedExpenseTotalsSplit` | reads GL | Raw SQL over `journal_entry_lines`/`journal_entries`/`chart_of_accounts` (management vs other expense) | On request |
| Short-term investments | `ShortTermInvestmentService :: createInstrument` (placement JE), `createAccrualJournalInTx`/`approveAccrualJournal`, `liquidateInstrument`, `runMonthEndRevaluation` | writes GL | Placement, daily accrual (PENDING or POSTED per `postingMode`), maturity/liquidation and unrealised-FX JEs | Accrual automatic on user login (`AuthController` → `maybeRunDailyAccrualAfterLogin`, 24h cooldown); others manual. Placement over threshold is CFO-gated via `PaymentInvestmentApprovalService` → ApprovalRequest |
| Stock-picker cash | `stockPickerCash/SpCashCloseService` | export only | Own sub-ledger (`SpCashJournal*`). `SpCashGlExport` is a file export; no `journalEntry` writes | Manual close |
| External / other apps | `routes/accountingApiRoutes.ts` → `AccountingApiController.postJournalEntry` | writes GL | `POST /accounting/api/post_journal_entry` (JWT) → `JournalEntryService.createManualJournalEntry`. The intended client `AccountingPostingClient` has no users | Manual/API |

Key observations for planning:
- **GL writers that bypass `JournalEntryService` validation:**
  - `EventService.createBudgetAllocationJournalEntry` writes lines directly and creates CoA rows on the fly.
  - `InvestmentAccountingFacadeService.commitSettlementBundle` writes lines directly.
  - `PayrollService.processPayrollPayment` and `CoreBankingBridgeService.placeHold` write `cashbookEntry` directly.
  - `InvestmentAccountingFacadeService.journalWorkflow` flips `journalEntry.status` directly.
- **Nothing posts at GRN**: no GRNI or inventory receipt, and procurement never creates `StockMovement` or `Asset` rows. **Timesheets/projects have no GL/WIP link.** Budget actuals are not sourced from the GL.
- **Two parallel AP paths post to the GL:**
  - `ProcurementInvoice` (procurement pay): expense JE plus cashbook at payment time.
  - `PurchaseInvoice` (accounting bill): JE at submit, payment JE/cashbook at pay.
  - V52 surfaces both (`listProcurementInvoices` + `getPurchaseInvoices`), which risks double-counting spend if the same supplier invoice enters both.

---

## 8. Known issues already documented

From `design-refs/accounting-final-sweep-findings.md` (2026-09-08 live sweep + 9 Sep cross-module sweep):
- Fixed: every page fetched each endpoint 6× (now `pendingScopesRef`) (§1); CEO View and its 5 drill-downs fabricated (§2); Audit Trail fabricated (§3); Settings mock banks/periods/RBAC/integrations/config-domain table (§4); Access Control fabricated (§5); sidebar badge counts hardcoded (§6); timesheets hero fabricated; sidebar could never collapse.
- **Open — §7:** FX rate scraped in the browser from `https://www.rbz.co.zw/` through an anonymous CORS proxy (`refreshOfficialRateV5()`); fails with CORS on every load, degrades to last stored rate.
- **Open — §8:** `/accounting/integrations` standalone page fetches nothing (static content).
- **Open — "Still fabricated":** `spotlight(page)` hero figures are hardcoded on every accounting page except timesheets (payables 92%, receivables 42d DSO, expenses 96%, inventory 4.8×, assets 88%, …).
- Observation: cash shows **$3,501,180.00 CR** (net credit on the bank control account) — ledger-faithful, underlying postings worth confirming.
- Not a defect: Performance test users get 403 on documents/consolidation/fiscal-calendar/audit-logs/roles (they hold only `accounting.timesheets.*`).

From `design-refs/accounting-v52-record-flows-backend-asks.md` (updated 2026-09-24):
- Still product-blocked with honest toast: New quotation / convert quote; corporate card import; cash batch import (CSV/XLSX); stock transfer between warehouses; **asset depreciation run / dispose / impairment still prototype modals**.
- BE fix shipped: `PATCH /accounting/invoices/:id/send` passes `req.user` and `allowCreatorPost: true` so the creator can post the AR send journal.
- DEV schema blocker found and patched: `vendors.country`, `trading_name`, `risk_rating`, `lifecycle_status` missing on `arcus_dev` (GET `/accounting/vendors` 500); now run by `db:migrate:nts-remaining` on `--api` deploy.
- Expense-categories register empty on DEV (UI falls back to named categories).

From `design-refs/dev-uat-esign-perf-accounting-fixes.md` (2026-09-23):
- Journal Maker–Checker defaulted to fixture account `5140` absent from the live CoA ("Account 5140 was not found…"); fixed by loading `coa` with journals/ledger and resetting draft lines on hydrate.

From `design-refs/accounting-v52-ui-handoff.md`:
- Stale: says base path `/accounting-v52` and "fixture/demo data only — no live API wiring"; the module is now at `/accounting` with the live wiring described in §2. It also names `design-refs/accounting-v52-backend-asks.md`, which the record-flows doc superseded.

New in this inventory (not previously documented; listed for triage, details in §2/§3/§5):
- "Run auto-match" signs off the reconciliation (`recon-signoff`) rather than matching.
- FX Revaluation, Group Consolidation and Access Control primary buttons are DEAD; all Fixed Asset lifecycle actions except Add are DEAD.
- Payables "Open in procurement" / "Capture a supplier invoice" navigate in the same tab (`window.location.assign`), against the CLAUDE.md cross-module new-tab rule.
- CEO "Approve decision", Close "Request period lock", Settings "Lock July 2026", Recurring "Create schedule", CoA "Import", Journals "Import", Audit "Verify integrity", Integrations "Test connection" all report success without any backend call.
- `/accounting/ceo`, `/timesheets`, `/recurring`, `/trial-balance` are missing from both `modules.ts` subModules and the `middleware.ts` route map (inherit `/accounting` access).
