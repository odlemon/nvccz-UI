# Cash recon — one-shot bank statement ingest

Product rule: Cash match import is **choose file → done**. No Validate / Submit / Commit / Reject steps in the UI.

## Endpoint

`POST /api/investment-ops/external-statements/imports/ingest`

Same body as create import (`providerId`, `cashAccountId`, `currency`, `fileName`, `fileHash`, `rawContent`). Idempotency key required.

## Behaviour

1. Parse CSV.
2. Validate dates, amounts, duplicate file hash.
3. If invalid → **400** `IMPORT_VALIDATION_FAILED` with `details.errors[]` (`lineNumber`, `code`, `message`). Nothing posted.
4. If valid → commit external statement lines. Control totals default to opening `0` and closing = movement sum when omitted. Maker-checker is skipped on this path.

## FE

- `lib/api/stock-picker-cash-api.ts` → `ingestExternalStatementImport`
- `app/investments-v2/reconciliation/fund-cash/page.tsx` — file picker runs ingest immediately

## Verify

1. Cash match → Import Statements → select a valid CSV.
2. Modal closes; bank lines appear after **Run Reconciliation**.
3. Upload a CSV missing `value_date` → modal stays open with `Line N: Missing value_date / trade_date`.
