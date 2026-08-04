# Accounting Module — Current State Reference

> **Purpose:** Snapshot of the live `/accounting` module (UI structure + API wiring) as of **2026-07-29**, before replacing the UI with a new design + hardcoded data. Use this file later to re-wire APIs the same way (or better).
>
> **Live URL:** https://dev.arcus.co.zw/accounting (and local `/accounting`)
>
> **Module id:** `accounting` (permission-gated via `ModuleGuard`)
>
> **Parity with:** [`performance-module-current-state.md`](./performance-module-current-state.md)

---

## How to use this doc during redesign

1. **Replace UI** with the new design + hardcoded fixtures — keep routes / sub-module ids stable if possible so permissions still work.
2. When re-integrating APIs, use each section’s **API client**, **endpoints**, and **Redux slice** tables below as the contract map.
3. Prefer the **typed clients** under `lib/api/*` over ad-hoc `apiClient` calls (some screens still mix Redux thunks + direct client calls).
4. Do **not** port forward known orphans / dual stacks listed in [Known issues & cleanup](#known-issues--cleanup).
5. This module is **live API today** (not a mock). Redesign will temporarily swap to fixtures like Performance — then re-wire using this doc.

---

## Architecture overview

```
app/accounting/**/page.tsx
  └─ ModuleGuard (moduleId="accounting", subModuleId=…)
       └─ AccountingLayout
            ├─ SharedTopbar
            ├─ AccountingSidebar          (from lib/config/modules.ts)
            └─ Screen component            (components/accounting/… or page-local)
                 └─ Redux thunks / typed API clients (lib/api/*)
```

| Layer | Location |
|---|---|
| Routes | `app/accounting/**/page.tsx` (13 pages) |
| Layout / sidebar | `components/layout/accounting-layout.tsx`, `accounting-sidebar.tsx` |
| Nav config | `lib/config/modules.ts` → `accounting` |
| Screen UI | `components/accounting/**` (~119 files) |
| Action permissions | `lib/config/accounting-permissions.ts`, `lib/hooks/useAccountingPermissions.ts` |
| API clients | `lib/api/accounting-api.ts`, `cashbook-api.ts`, `reconciliation-api.ts`, `short-term-investments-api.ts`, `chart-of-accounts-api.ts`, `vat-api.ts`, `exchange-rate-display-api.ts` |
| State | Redux Toolkit slices (no React Query in this module) |

**Related but separate:** Investments Ops accounting (`/investments-v2/accounting`) — not part of this ERP Accounting module.

---

## 1. Navigation / sidebar

**Config source:** `lib/config/modules.ts` (`id: "accounting"`)  
**Sidebar:** `components/layout/accounting-sidebar.tsx` — filters by `hasSubModuleAccess('accounting', id)`, highlights by `pathname`.  
**Layout mount side-effect:** dispatches `fetchCurrencies()` from `accountingSlice`.

### Top-level items (active)

| Label | Path | Sub-module id |
|---|---|---|
| Dashboard | `/accounting` | `accounting-dashboard` |
| General Ledger | `/accounting/general-ledger` | `general-ledger` |
| Cash Book | `/accounting/cash-book` | `cash-book` |
| Sales | `/accounting/invoices` | `invoices` |
| Purchases | `/accounting/payables` | `payables` |
| Bank Reconciliation | `/accounting/bank-reconciliation` | `bank-reconciliation` |
| Expenses | `/accounting/expenses` | `expenses` |
| Inventory | `/accounting/inventory` | `inventory-accounting` |
| Asset Management | `/accounting/assets` | `asset-management` |
| Short-Term Investments | `/accounting/short-term-investments` | `short-term-investments` |
| Financial Reports | `/accounting/reports` | `financial-reports` |
| Settings | `/accounting/settings` | `accounting-settings` |

### Commented / dead nav (still in modules.ts as comments)

| Label | Path | Notes |
|---|---|---|
| Accounts Receivable | `/accounting/debtors` | Commented — Sales covers AR invoices |
| Accounts Payable | `/accounting/creditors` | Commented — Purchases covers AP |

### Routes that exist but are **alternate / orphan**

| Path | Notes |
|---|---|
| `/accounting/dashboard` | Legacy **v1** dashboard (`AccountingDashboard`); root `/accounting` uses **V2** |

---

## 2. Route map

| Path | Page file | Main component |
|---|---|---|
| `/accounting` | `app/accounting/page.tsx` | `AccountingDashboardV2` |
| `/accounting/dashboard` | `app/accounting/dashboard/page.tsx` | `AccountingDashboard` (v1) |
| `/accounting/general-ledger` | `app/accounting/general-ledger/page.tsx` | `GeneralLedger` |
| `/accounting/cash-book` | `app/accounting/cash-book/page.tsx` | **Page-local** `CashbookPage` (large inline screen) |
| `/accounting/invoices` | `app/accounting/invoices/page.tsx` | `InvoicesManagement` |
| `/accounting/payables` | `app/accounting/payables/page.tsx` | `PayablesManagement` |
| `/accounting/bank-reconciliation` | `app/accounting/bank-reconciliation/page.tsx` | Session list + `ReconciliationWorkspace` (page-local) |
| `/accounting/expenses` | `app/accounting/expenses/page.tsx` | `ExpensesManagement` |
| `/accounting/inventory` | `app/accounting/inventory/page.tsx` | `InventoryManagement` |
| `/accounting/assets` | `app/accounting/assets/page.tsx` | `AssetsManagement` |
| `/accounting/short-term-investments` | `app/accounting/short-term-investments/page.tsx` | `ShortTermInvestmentsManagement` |
| `/accounting/reports` | `app/accounting/reports/page.tsx` | `FinancialReports` |
| `/accounting/settings` | `app/accounting/settings/page.tsx` | `AccountingSettings` |

No dynamic `[id]` routes — detail UIs are drawers/modals.

---

## 3. Feature areas (UI + behaviour)

### 3.1 Dashboard

| Item | Detail |
|---|---|
| Primary | `components/accounting/accounting-dashboard-v2.tsx` @ `/accounting` |
| Legacy | `accounting-dashboard.tsx` @ `/accounting/dashboard` |
| Data | `fetchAccountingDashboard` / `accountingApi.getDashboard` (+ stats/charts helpers) |
| Skeleton | `accounting-dashboard-skeleton.tsx` |

### 3.2 General Ledger

| Item | Detail |
|---|---|
| Screen | `general-ledger.tsx` — tabs: Journal Entries, Trial Balance |
| Create / view | `create-journal-entry-modal.tsx`, `journal-entry-view-drawer.tsx`, `journal-entry-drawer.tsx` |
| TB view | `trial-balance-view.tsx` |
| Shared tables | `accounting-data-table.tsx`, `transactions-data-table.tsx`, `transaction-view-drawer.tsx` |
| API | Journals CRUD + `postJournalEntry` / `voidJournalEntry`; TB via `getTrialBalance*` |

### 3.3 Cash Book

| Item | Detail |
|---|---|
| Screen | Mostly **inline** in `app/accounting/cash-book/page.tsx` |
| Tabs | Single Entries, Batch, Transfers, Entry Types, Contra Entries |
| Modals | Receipt / Payment / Transfer create; `process-cashbook.tsx`; `export-cashbook-audit-modal.tsx`; `allocate-payment-modal.tsx` |
| Drawers | `cashbook-entry-view-drawer`, `cashbook-batch-view-drawer`, `cashbook-transfer-view-drawer` |
| Config tabs | `tabs/entry-types-tab.tsx`, `tabs/contra-entries-tab.tsx` (+ create/view modals) |
| Table | `CashbookDataTable.tsx` |
| API | `cashbookApi` (`/cashbook/...`) + fiscal calendar under `/accounting/fiscal-calendar` |
| Slice | `cashbookSlice` (entry types, periods/locks, contra) + some banks/entries still via `accountingSlice` |

### 3.4 Sales (Invoices / AR)

| Item | Detail |
|---|---|
| Screen | `invoices-management.tsx` — tabs: Invoices, Credit Notes, Customers |
| Invoice lifecycle | Create → Send → Mark paid / Void |
| Modals / forms | `create-invoice-modal`, `void-invoice-modal`, `mark-as-paid-modal`, `invoice-mark-paid-form`, `invoice-void-form` |
| Drawers | `invoice-view-drawer`, `customer-view-drawer`, `credit-note-view-drawer` |
| Customers | `customers-management`, `create-customer-modal`, `view-customer-modal` |
| Credit notes | `credit-notes-management`, `create-credit-note-modal` |
| PDF | `invoice-pdf.tsx` |
| Slice / hook | `invoices-slice.ts`, `use-invoices.ts` |
| API | `/accounting/invoices*`, `/accounting/customers*`, `/accounting/credit-notes*` |

### 3.5 Purchases (Payables / AP)

| Item | Detail |
|---|---|
| Screen | `payables-management.tsx` — status tabs + Vendors + Pending approval |
| Modals | `create-purchase-invoice-modal`, `batch-pay-modal` |
| Drawer | `purchase-invoice-view-drawer` |
| Vendors | `vendors-management`, create/view modals, `pending-vendor-review-modal` |
| Approval | `vendor-approval/pending-vendors-list.tsx`, `vendor-approval-drawer.tsx` |
| PDF | `purchase-invoice-pdf.tsx` |
| Slice / hook | `purchase-invoices-slice.ts`, `use-purchase-invoices.ts` |
| API | Purchase invoices under `/accounting/...` (submit / pay / batch-pay) + vendors (`/accounting/vendors`, list also hits `/cashbook/vendors`) |

### 3.6 Bank Reconciliation

| Item | Detail |
|---|---|
| **Live stack** | Session-based workspace: `reconciliation/reconciliation-session-list.tsx`, `reconciliation-workspace.tsx`, header form, entries table, comparison, totals, statement table, detail drawer |
| API | `reconciliationApi` → `/cashbook/reconciliation/...` |
| Slice | `reconciliationSlice.ts` |
| **Legacy stack (orphan UI)** | `bank-reconciliation-management.tsx` + upload/match modals/drawers/audit — still backed by `accountingApi` `/accounting/bank-reconciliation*` and thunks in `accountingSlice` — **not mounted by current page** |

### 3.7 Expenses

| Item | Detail |
|---|---|
| Screen | `expenses-management.tsx` (+ `expenses-list.tsx`) |
| Tabs | All / Drafts / Posted / Void |
| Modals | `create-expense-modal`, `expense-view-drawer`, `delete-expense-dialog` |
| API / slice | `accountingApi` expenses + categories; `accountingSlice` |

### 3.8 Inventory

| Item | Detail |
|---|---|
| Screen | `inventory-management.tsx` — Items / Valuation / Reorder Levels |
| Modals | `create-inventory-modal`, `inventory-view-drawer`, `stock-movement-modal` |
| API | inventory items, stock movements, valuation, reorder alerts, COGS, adjustments |

### 3.9 Assets

| Item | Detail |
|---|---|
| Screen | `assets-management.tsx` |
| Modals | `create-asset-modal`, `asset-view-drawer`, `calculate-depreciation-modal`, `dispose-asset-modal`, `revalue-asset-modal` |
| API | `/accounting/assets*` — CRUD, depreciation, backfill, post, dispose, schedule, revalue |

### 3.10 Short-Term Investments (STI)

| Item | Detail |
|---|---|
| Screen shell | `short-term-investments/short-term-investments-management.tsx` |
| Tabs | Dashboard · Instruments · Settings |
| Pieces | `sti-dashboard.tsx`, `sti-instruments-list.tsx`, `sti-settings.tsx`, `create-instrument-modal.tsx`, `instrument-view-drawer.tsx`, `liquidate-instrument-modal.tsx` |
| API | `lib/api/short-term-investments-api.ts` → `/accounting/short-term-investments*` |
| Slice | `shortTermInvestmentsSlice.ts` |
| Methods | settings get/update; dashboard; instruments CRUD; liquidate/void; rate history/add; accruals approve/all; audit trail; run-accruals |

### 3.11 Financial Reports

| Item | Detail |
|---|---|
| Screen | `financial-reports.tsx` |
| Tabs / views | `income-statement-view`, `balance-sheet-view`, `cash-flow-view`, `creditors-age-analysis`, `vat-report-view`, `unrealized-fx-gains-view` |
| API | IS/BS/CF (+ consolidated), creditors age, unrealized FX; VAT via `vat-api.ts` (`/vat/report/output-tax-audit`) |

### 3.12 Settings (admin operations)

| Item | Detail |
|---|---|
| Screen | `accounting-settings.tsx` |
| Tabs | Currencies · Exchange Rates · Chart of Accounts · Expense Categories · Bank Accounts · VAT Rates · Period Lockout |
| Key files | `currencies-management`, `exchange-rates-management`, `exchange-rate-modals`, `chart-of-accounts-management`, `bulk-import-coa-modal`, `expense-categories-management`, `bank-accounts-management`, `vat-rates-management`, `tabs/period-lockout-tab`, period lockout create/view |
| FX display | Also uses `exchange-rate-display-api.ts` (`/exchange-rate-display`) for widget/compare/history/configs |
| Fiscal / lockout | Cashbook fiscal calendar APIs (`getFiscalCalendar`, `saveLocksDraft`, `commitLocks`, …) |

---

## 4. API clients (contract map)

### 4.1 `accountingApi` — `lib/api/accounting-api.ts`

Base: mostly `/accounting/...` (some vendor list via `/cashbook/vendors`).

| Domain | Client methods (representative) | Path pattern |
|---|---|---|
| Currencies | `getCurrencies`, create/update/delete | `/accounting/currencies` |
| Accounts (legacy) | `getAccounts`, CRUD | `/accounting/accounts` |
| Chart of accounts | `getChartOfAccounts`, CRUD | `/accounting/chart-of-accounts` |
| Journals | `getJournalEntries`, CRUD, `postJournalEntry`, `voidJournalEntry` | `/accounting/journal-entries` |
| Customers | CRUD | `/accounting/customers` |
| Suppliers | CRUD | `/accounting/suppliers` |
| Vendors | CRUD (+ list may use `/cashbook/vendors`) | `/accounting/vendors` |
| Invoices | CRUD, `sendInvoice`, `markInvoiceAsPaid`, `voidInvoice` | `/accounting/invoices` |
| Credit notes | CRUD, send, apply | `/accounting/credit-notes` |
| Purchase invoices | list/create/update + submit/pay/batch-pay (see file) | `/accounting/purchase-invoices*` |
| Expenses / categories | CRUD | `/accounting/expenses`, `/accounting/expense-categories` |
| Inventory | items, movements, valuation, reorder, COGS, adjustment | `/accounting/inventory*` |
| Assets | CRUD, depreciation, dispose, schedule, revalue | `/accounting/assets*` |
| Dashboard | `getDashboard`, stats, sales/credit charts, recent expenses | `/accounting/dashboard*` |
| Reports | TB / IS / BS / CF (+ V2 + consolidated generate) | `/accounting/trial-balance`, `income-statement`, `balance-sheet`, `cash-flow` |
| Exchange rates | CRUD | `/accounting/multi-currency/exchange-rates` |
| Legacy bank recon | upload, match, approve, unmatched, audit | `/accounting/bank-reconciliation*` |
| VAT rates | CRUD (in accounting-api / settings UI) | `/accounting/vat-rates*` (confirm in file) |
| Creditors age / FX gains / COA bulk / asset register | report helpers at end of file | various `/accounting/...` |

### 4.2 `cashbookApi` — `lib/api/cashbook-api.ts`

Base: `/cashbook/...` (+ fiscal under `/accounting/fiscal-calendar`).

| Domain | Methods |
|---|---|
| Banks | `getCashbookBanks`, CRUD, `getGlAccountsForBank` |
| Entries | `getCashbookEntries`, `createCashbookReceipt`, `createCashbookPayment`, `getCashbookTransactions` |
| Position / reports | `getCashbookBankPosition`, cash-flow report, balance-check |
| Batches | `getCashbookBatches`, `postCashbookBatch`, `createCashbookBatchImport` |
| Open items | `getOpenItemsForCustomer/Supplier`, `matchOpenItems` |
| Transfers | `getCashbookTransfers`, `createCashbookTransfer` |
| Entry types | CRUD |
| Periods / fiscal | `getPeriods`, `lockPeriod`, fiscal calendar draft/commit/policy/audit |
| Contra | config CRUD + `generateContraEntry` |
| Attachments / audit export | `uploadReceiptAttachment`, `exportCashbookAudit` |
| Reversals | `getTransactionReversalHistory`, `reverseTransaction` |

### 4.3 `reconciliationApi` — `lib/api/reconciliation-api.ts`

| Method | Endpoint |
|---|---|
| `getReconciliationEntries` | `GET /cashbook/reconciliation/banks/:bankId/entries` |
| `listSessions` | `GET /cashbook/reconciliation/banks/:bankId/sessions` |
| `createDraftSession` | `POST .../sessions` |
| `getSession` | `GET /cashbook/reconciliation/sessions/:id` |
| `updateDraftSession` | `PUT .../sessions/:id` |
| `finishSession` | `POST .../sessions/:id/finish` |
| `discardSession` | `POST .../sessions/:id/discard` |
| `getReconciliationDisplay` | `GET /cashbook/reconciliation/display` |

### 4.4 STI — `lib/api/short-term-investments-api.ts`

Named exports (not a class): `getSTISettings`, `updateSTISettings`, `getSTIDashboard`, `getInstruments`, `getInstrument`, `createInstrument`, `updateInstrument`, `deleteInstrument`, `liquidateInstrument`, `voidInstrument`, `getRateHistory`, `addRate`, `getAccruals`, `approveAccrual`, `approveAllAccruals`, `getAuditTrail`, `runAccruals`.

Base: `/accounting/short-term-investments`.

### 4.5 Other clients

| File | Role |
|---|---|
| `chart-of-accounts-api.ts` | COA types + CRUD helpers (also mirrored on `accountingApi`) |
| `vat-api.ts` | Output tax audit report |
| `exchange-rate-display-api.ts` | Display widgets / compare / history / configs / ingest |

---

## 5. Redux slices

| Slice file | Store key | Owns |
|---|---|---|
| `lib/store/slices/accountingSlice.ts` | `accounting` | Currencies, vendors, COA, journals post/void, expenses, customers, inventory, FX rates, reports (TB/IS/BS/CF), dashboard, **legacy** bank recon, some cashbook banks/entries |
| `cashbookSlice.ts` | `cashbook` | Entry types, periods / fiscal locks, contra configs |
| `invoices-slice.ts` | `invoices` | Sales invoice lifecycle + customers fetch |
| `purchase-invoices-slice.ts` | `purchaseInvoices` | Purchase invoice lifecycle |
| `reconciliationSlice.ts` | `reconciliation` | Session-based bank recon |
| `shortTermInvestmentsSlice.ts` | `shortTermInvestments` | STI settings / dashboard / instruments / rates / accruals / audit |

**Unused / helpers:**

- `currenciesSlice.ts` — **not registered** in store (currencies live in `accountingSlice`)
- `accounting-slice-additions.ts` — action-creator helpers only

**Hooks:** `use-invoices.ts`, `use-purchase-invoices.ts`, `use-accounting-dashboard.ts`, `useAccountingPermissions.ts`

---

## 6. Permissions

| Layer | File |
|---|---|
| Module / sub-module matrix | `lib/config/role-permissions.ts` (`moduleId: 'accounting'`) |
| Button-level actions | `lib/config/accounting-permissions.ts` → `ACCOUNTING_ACTIONS` |
| Hook | `lib/hooks/useAccountingPermissions.ts` |
| Source matrix | `permissions-matrix-2026-03-03.json` (referenced in accounting-permissions comments) |

Action groups include: dashboard, journals, cashbook, invoices/credit notes, payables, bank recon, expenses, inventory, assets (incl. dispose/revalue/depreciation), reports (IS/BS/CF), settings (currencies, FX, COA, VAT, banks, period lock), STI (where role allows).

---

## 7. Live vs mock

**Verdict:** **Fully live** — Redux + typed `apiClient` APIs. No accounting fixture/mock package.

Evidence:

- Screens dispatch thunks from accounting / cashbook / invoices / purchase / reconciliation / STI slices
- Direct `accountingApi` / `cashbookApi` / STI function calls in several screens
- No `lib/accounting-mock` or hardcoded redesign suite (unlike Performance’s `performance-mock`)

When redesign starts: introduce something like `components/accounting-mock/` + fixtures, keep routes, then re-wire using this doc.

---

## 8. Known issues & cleanup

Do **not** carry these into the redesigned UI unless intentional:

1. **Dual dashboards** — V2 at `/accounting`, unused-feeling V1 at `/accounting/dashboard` (v1 still imported unused on root page).
2. **Dual bank-recon stacks** — live session API vs orphan upload/match UI + legacy endpoints.
3. **`BankReconciliationManagement`** unused by current route.
4. **`CurrencyFilter`** imported in `accounting-layout.tsx` but not rendered.
5. **`currenciesSlice.ts`** unused in store.
6. Commented debtors/creditors routes — Sales/Purchases replaced them.
7. Mixed data access — some screens Redux-only, some direct API, some both.
8. Cash Book UI is a very large page-local component — hard to redesign in place; prefer extracting to `components/accounting/` when mock/rebuild starts.
9. Vendor list endpoint inconsistency (`/cashbook/vendors` vs `/accounting/vendors`).

---

## 9. File inventory (high level)

```
app/accounting/
  page.tsx, dashboard/, general-ledger/, cash-book/, invoices/, payables/,
  bank-reconciliation/, expenses/, inventory/, assets/,
  short-term-investments/, reports/, settings/

components/layout/
  accounting-layout.tsx, accounting-sidebar.tsx

components/accounting/
  (core screens, modals, drawers, tabs, reconciliation/, short-term-investments/, vendor-approval/)

lib/api/
  accounting-api.ts, cashbook-api.ts, reconciliation-api.ts,
  short-term-investments-api.ts, chart-of-accounts-api.ts,
  vat-api.ts, exchange-rate-display-api.ts

lib/store/slices/
  accountingSlice.ts, cashbookSlice.ts, invoices-slice.ts,
  purchase-invoices-slice.ts, reconciliationSlice.ts,
  shortTermInvestmentsSlice.ts

lib/config/
  modules.ts (accounting entry), accounting-permissions.ts, role-permissions.ts
```

---

## 10. Suggested redesign process (same as Performance)

1. Keep this file as the **API + route source of truth**.
2. When designs arrive: build interactive mocks under something like `components/accounting-mock/` with fixtures — **do not delete** live screens until mocks are accepted.
3. Optionally archive key live screen copies under `design-refs/pre-rebrand-archive/` if a hard rollback of TSX is needed (Performance did this for login; for Accounting the live tree + this MD is usually enough).
4. Re-wire screen-by-screen using the tables above; write BE gaps to `design-refs/accounting-*-backend-asks.md` per workspace rules.
5. Verify twice (static re-read + grep live call sites) before claiming a screen is live again.

---

## Short status line

> Accounting current-state snapshot captured **2026-07-29**: 13 routes from Dashboard → Settings including Cash Book, Sales, Purchases, Bank Recon, Expenses, Inventory, Assets, STI, Reports. Live Redux + `accountingApi` / `cashbookApi` / `reconciliationApi` / STI APIs. Ready for crop-driven redesign without losing the re-wire map.
