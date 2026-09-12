# Procurement V23 UI handoff

## Source

- **Client package:** `C:\Users\lysp\Downloads\Procurement FE-20260819T064256Z-1-001\Procurement FE\matanho-procurement-ui-v23\dist\index.html`
- **Typography standard:** client `docs/TYPOGRAPHY_STANDARD.md` (min 11px, high-contrast)
- **Integration mode:** Mode A runtime host
- **Next module id:** `procurement-v23`
- **Base path:** `/procurement-v23`

## Generated assets

| Output | Purpose |
|--------|---------|
| `components/procurement-v23-mock/procurement-v23.css` | Scoped styles (`.procurement-v23-root`) |
| `components/procurement-v23-mock/shell.ts` | DOM shell |
| `components/procurement-v23-mock/matanho-procurement-runtime.js` | Inline scripts from dist `index.html` + nav bridge |
| `components/procurement-v23-mock/procurement-v23-app.tsx` | React host |
| `lib/procurement-v23-mock/nav.ts` | Page id ↔ path map |
| `scripts/extract-procurement-v23.mjs` | Re-run when client dist updates |

## Primary nav page ids

`dashboard, plan, approvals, requisitions, tenders, evaluation, vendors, contracts, orders, receiving, invoices, accounts, documents, reports, audit, settings`

Extra runtime page: `analytics` (chart drill-down) — route at `/procurement-v23/analytics`.

## App Switcher

- Tile label: **Procurement**
- Supersedes: legacy `procurement` module in switcher
- Legacy `/procurement/*` remains routable for comparison

## Runtime patches

- `$` / `$$` default root = `rootEl`
- `navigate`, `render`, and V18 `navigateV14` call `window.__PROCUREMENT_V23_NAV__` instead of hash
- Logo embedded as `LOGO_DATA` in runtime (no external assets)

## Verify locally

```bash
npm run build
# Dev: open /procurement-v23, /procurement-v23/tenders
```

## Backend

Fixture/demo data with optional `window.MatanhoBackend` adapter stub — no live BE wiring. File `design-refs/procurement-v23-backend-asks.md` when API integration starts.
