# Accounting V52 UI handoff

## Source

- **Client file:** `C:\Users\lysp\Downloads\Accounting FE\Matanho_Accounting_V52.html`
- **Integration mode:** Mode A runtime host (same as Payroll V6)
- **Next module id:** `accounting-v52`
- **Base path:** `/accounting-v52`

## Generated assets

| Output | Purpose |
|--------|---------|
| `components/accounting-v52-mock/accounting-v52.css` | Scoped styles (`.accounting-v52-root`) |
| `components/accounting-v52-mock/shell.ts` | DOM shell (app + overlays) |
| `components/accounting-v52-mock/matanho-accounting-runtime.js` | Concatenated client scripts + Next nav bridge |
| `components/accounting-v52-mock/accounting-v52-app.tsx` | React host |
| `lib/accounting-v52-mock/nav.ts` | Page id ↔ path map |
| `scripts/extract-accounting-v52.mjs` | Re-run when client HTML updates |

## Primary nav page ids

`overview, approvals, close, ledger, journals, cash, reconciliation, payables, receivables, expenses, inventory, assets, investments, reports, compliance, fx, consolidation, coa, vault, audit, access, integrations, settings`

Upgrade layers add internal drill-down pages (`ceo`, `trialbalance`, `journaldetail`, etc.) — these stay runtime-internal via `setPage`; only primary nav pages have Next routes.

## App Switcher

- Tile label: **Accounting**
- Supersedes: `accounting-v2` (and legacy `accounting` was already hidden)
- Legacy `/accounting`, `/accounting-v2` remain routable for comparison

## Runtime patches

- `$` / `$$` scoped to `rootEl`
- `goPage` + `render()` call `window.__ACCOUNTING_V52_NAV__` instead of hash routing
- Theme on `rootEl.dataset.theme`
- `AbortController` on document listeners

## Verify locally

```bash
npm run build
# Dev: open /accounting-v52, /accounting-v52/general-ledger
```

## Backend

Fixture/demo data only — no live API wiring in this port. File `design-refs/accounting-v52-backend-asks.md` if BE contract work starts.
