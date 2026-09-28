# Accounting V52 — remaining record / write gaps

> Updated 2026-09-24 after closing FE-closable write surfaces and fixing invoice send JE post authority on BE.
>
> **DEV browser verify (2026-09-24, staff stamp `20260924-083713`, `admin@nts.com`):** expense lookups hydrate, expense-create, invoice create+send, and honest quotation/corporate-card toasts — **PASS**. Live write gaps listed below as “Already live” can be treated closed on DEV after the vendors schema patch noted under Verification.

## Already live (FE + BE)

| Surface | Action key | API |
|---|---|---|
| Chart of Accounts save | `coa-save` | `/chart-of-accounts` |
| Manual journal submit | `journal-submit` | `POST /accounting/journal-entries` |
| Approval centre | `approval-decision` | journal post/void or `/approvals/:id/*` |
| Pay supplier bill | `ap-pay-bill` | procurement pay or purchase-invoice pay |
| Capture supplier invoice | `aplive-go` → procurement intake | intentional redirect |
| Create customer | `customer-create` | `POST /accounting/customers` |
| Customer invoice create (+ send) | `invoice-create` | `POST /accounting/invoices` then `PATCH …/send` |
| Cash receipt / payment / transfer | `cash-post` | `/cashbook/receipts`, `/payments`, `/transfers` |
| Allocate customer receipt | `receipt-post` | cashbook receipt + open-item match when possible; mark-as-paid on full clear |
| Expense claim create | `expense-create` | `POST /accounting/expenses` (vendorId + category/categoryId required) |
| Inventory receive / issue / adjust | `stock-adjust` | `/accounting/inventory/movements` or `/adjustments` |
| Fixed asset add | `asset-create` | `POST /accounting/assets` |
| Recurring run / run-due | `recurring-run`, `recurring-run-due` | `/accounting/recurring-journal-templates/:id/run`, `/run-due` |
| Bank recon sign-off / auto-match CTA | `recon-signoff` | cashbook reconciliation create draft session + finish |
| Timesheet approve/return | `timesheet-*` | timesheets API |
| Tax pack create | `create-tax-pack` | tax-return-pack API |
| Document vault upload | `upload-document` | accounting documents API |
| Close task complete | `close-task-complete` | close-tasks API |

### BE fix shipped with this close-out

`PATCH /accounting/invoices/:id/send` now passes `req.user` into `JournalEntryService.postJournalEntry` and sets `allowCreatorPost: true` so the AR send journal created as PENDING on invoice create can be posted by the same finance user (avoids undefined-user / preparer-cannot-post failures).

## Still product-blocked (honest UI toast; no fake local write)

| Surface | Behaviour |
|---|---|
| New quotation / convert quote | Toast: quotations are not persisted by the live accounting API |
| Corporate card import | Toast: no live import endpoint |
| Cash batch import (CSV/XLSX) | Toast: not wired to live cashbook |
| Stock transfer between warehouses | Error from `stock-adjust` — no transfer API |
| Asset depreciation run / dispose / impairment | Still prototype modals (create asset is live) |

## How FE verifies

1. Receivables → New invoice → create → should send when role can post GL (admin/finance).
2. Expenses → **New expense claim** → vendor + category + amount → Save → toast + claims refresh.
3. Inventory → Receive / Issue / Adjust → Save movement → toast + inventory refresh.
4. Fixed Assets → **Add fixed asset** → description + cost → Create → toast + register refresh.
5. Recurring → Run now / Process due → live template run.
6. Bank Reconciliation → Run auto-match or Submit for sign-off → cashbook session finish (fails honestly if statement/ledger difference blocks finish).
7. Quotations / Corporate card → toast only (no local draft pretend-success).

FE files: `lib/accounting-v52/actions.ts`, `components/accounting-v52-mock/accounting-v52-app.tsx`, `matanho-accounting-runtime.js` (via `scripts/patch-accounting-v52-runtime.mjs`), `lib/accounting-v52/live-loaders.ts`.

BE files: `nvccz/src/services/InvoiceService.ts`, `JournalEntryService.ts`, `controllers/InvoiceController.ts`.

## Verification (DEV browser, 2026-09-24)

| # | Surface | Result | Evidence |
|---|---|---|---|
| 1 | Expenses hydrate — `window.__ac52ExpenseLookups.vendors` | **PASS** | After hard refresh: **13** vendors (non-empty). Categories array empty (UI falls back to named categories). |
| 2 | New expense claim → Save | **PASS** | Toast: `Expense recorded · EXP-1790232668502` (Jacaranda / Operations / $125.50). Not “No vendors”. |
| 3 | Receivables → New invoice create+send | **PASS** | Toast: `INV_20260924_0002 created · journal JE-1790232730145-915 and sent.` (`allowCreatorPost` path OK). |
| 4 | New quotation | **PASS** | Honest toast: quotations not persisted by live API. |
| 5 | Import card feed | **PASS** | Honest toast: no live corporate-card import endpoint. |

### DEV schema blocker found + patched during verify

`GET /accounting/vendors` was **500**: Prisma expected `vendors.country` (also missing `trading_name`, `risk_rating`, `lifecycle_status`) — columns in schema / `nvccz/scripts/run-nts-remaining-migration.ts` but not yet on `arcus_dev`.

Applied on DEV MySQL (idempotent equivalent of that script’s vendor §8 DDL):

```sql
ALTER TABLE vendors
  ADD COLUMN country VARCHAR(64) NULL,
  ADD COLUMN trading_name VARCHAR(255) NULL,
  ADD COLUMN risk_rating VARCHAR(32) NULL,
  ADD COLUMN lifecycle_status VARCHAR(32) NULL DEFAULT 'ACTIVE';
```

**Follow-up (addressed):** `db:migrate:nts-remaining` is registered in `nvccz/package.json` (included in `db:migrate:all`) and runs automatically on Arcus DEV selective `--api` deploy (`scripts/deploy-arcus-dev-selective.py` → `compose run … npm run db:migrate:nts-remaining` after image build). Entrypoint still skips schema sync on ordinary restarts. See `design-refs/arcus-dev-selective-deploy.md` § API migrations on `--api`.

Expense categories register was empty (`GET /accounting/expense-categories` → `[]`); not a blocker because the claim modal uses fallback category names when lookups.categories is empty.
