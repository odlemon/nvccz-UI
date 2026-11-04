# Receivables Port Handoff

Date: 2026-10-28
Scope: Faithful legacy Receivables port to `/accounting/receivables`.

## Current status

The Receivables port is implemented locally. Deployment was not performed. Work is paused at the user’s request so another agent can continue later.

Bank Reconciliation work is out of scope. Do not modify or revert the other agent’s bank reconciliation files.

## Implemented

- `/accounting-legacy/invoices` and `/accounting/receivables` use the shared `ReceivablesLegacyContent` wrapper around `InvoicesManagement`.
- `/accounting/receivables/page.tsx` is a null stub.
- The V52 live layer now emits `#ac52LegacyReceivablesSlot` and portals the persistent React module into it.
- The V52 navigation shell remains around the restored module.
- A separate `/accounting/receivables/workflows` route preserves the existing V52 Receivables workflow screen for receipts-to-allocate and ageing.
- The restored module links to the preserved workflow screen with “Receipts & ageing”.
- Existing invoice, credit-note, and customer drawers/modals/actions remain available.
- Invoice delete now uses the existing delete API with confirmation and permission gating.
- Invoice bulk send uses the existing send API; “Mark as Paid” bulk action points users to receipt allocation instead of duplicating settlement logic.
- Invoice startup loading was changed to avoid tab/page resets caused by currency/customer startup effects.
- Invoice responses use request IDs so stale responses cannot overwrite newer results.
- Customer loading uses a request sequence guard to prevent late responses overwriting newer searches/pages.
- Server pagination is wired for invoices, credit notes, and customers.
- Credit note Redux pagination state and stale-request protection were added.
- PDF, Excel, and CSV export controls use the shared branded export utility. Exports fetch the full filtered dataset.
- Bulk upload dialog supports CSV/XLSX for sales invoices and CSV/XLSX for customers, including template download, preview validation, disabled invalid imports, API submission, and results.
- The bulk invoice payload creates drafts through `/accounting/invoices`; customer imports use `/accounting/customers`.
- Backend invoice search was added to the existing paginated invoice route/service.
- The live runtime was regenerated with `node scripts/accounting-live-sync.mjs`.

## Functional source and workflow trace

Relevant Accounting source sections consulted:

- `SRD 2.0_ Arcus Accounting Module (1).pdf`: Debtors/Accounts Receivable and Credit Notes workflows.
- `Arcus supplementary TECHNICAL SRD Accounting Module (1).pdf`: invoice generation and payment posting flow.
- `core accounting.pdf`: credit-note API/test workflow.

Frontend/API traces:

- `components/accounting/invoices-management.tsx`
- `components/accounting/credit-notes-management.tsx`
- `components/accounting/customers-management.tsx`
- `lib/hooks/use-invoices.ts`
- `lib/hooks/use-credit-notes.ts`
- `lib/store/slices/invoices-slice.ts`
- `lib/store/slices/accountingSlice.ts`
- `lib/api/accounting-api.ts`
- Backend `InvoiceController`, `InvoiceService`, `CustomerController`, credit-note routes/controllers/services, and the receipt/open-item routes.

## Verification evidence

Artifacts are in `test-artifacts/accounting-receivables/`.

- `scripts/_uat/acct-receivables.mjs`: 24/24 local API lifecycle checks passed, including invoice draft/edit/send/void/delete, receipts, allocation/unallocation, credit notes, FX/payment rules, and permissions.
- `scripts/_uat/receivables-crud.mjs`: synthetic customer update/delete, invoice create/update/delete, credit-note create/delete passed.
- `scripts/_uat/receivables-parity.mjs`: both routes rendered the same component. It covered Sales Invoices, Credit Notes, Customers, all invoice status tabs, credit-note status tabs, export controls, screenshots, and metrics.
- `scripts/_uat/receivables-interactions.mjs`: valid and invalid invoice/customer bulk previews, API payload interception, drawers, create modal, action menu, customer pagination, credit-note pagination with a 23-row fixture, and the preserved workflow route passed.
- `scripts/_uat/receivables-pixel-diff.py`: best shift `[0, 0]`; threshold 32 diff was 0.585% after masking only the new export-control area; threshold 64 diff was 0%.
- Browser metrics at 1600x1000: legacy module and restored module used 15px table text, 57px rows, 19px main-tab text, and the restored module was pinned to the same 1344px content width. CSSOM leak sweep found 0 matching shell rules inside the mount. Portal host/content stayed stable after tab changes: one host, same host, same content node.
- Export validity: all nine files opened/parsed: three PDFs began `%PDF-`, three XLSX files were valid ZIP workbooks, and CSV files parsed with expected headers/rows. Local PDF branding was Matanho.

## Known gaps / next steps

1. Run the full parity and interaction harness once more after the next agent’s environment is stable. The last successful interaction run passed all targeted checks; intermittent local server/API startup failures were environmental.
2. Inspect `git diff` before handoff completion because the workspace is intentionally dirty with unrelated work. Keep only Receivables changes when preparing a commit.
3. The full frontend `npx tsc --noEmit` remains noisy with many pre-existing workspace errors. The focused Receivables check also includes pre-existing errors from `accountingSlice` and related shared types; no new Receivables-specific error remained beyond those existing shared errors after the local fixes.
4. The current `components/accounting-v52-mock/matanho-accounting-runtime.js` is regenerated output. If the live script changes again, rerun `node scripts/accounting-live-sync.mjs` and recheck the generated diff.
5. Confirm whether product wants the preserved V52 workflow route linked as a separate route or later merged into a drawer/subview. The current implementation intentionally keeps it accessible without adding V52 Receipts/Ageing chrome to the legacy screen.
6. Run a clean production build after the unrelated Bank Reconciliation agent’s missing-component issue is resolved. Do not fix that issue from this task.
7. Do not deploy until explicitly requested.

## Files added for this task

- `components/accounting/receivables-legacy-content.tsx`
- `components/accounting/bulk-receivables-upload-modal.tsx`
- `app/accounting/receivables/workflows/page.tsx`
- `scripts/_uat/receivables-parity.mjs`
- `scripts/_uat/receivables-interactions.mjs`
- `scripts/_uat/receivables-pixel-diff.py`
- `scripts/_uat/receivables-crud.mjs`
- `test-artifacts/accounting-receivables/`

