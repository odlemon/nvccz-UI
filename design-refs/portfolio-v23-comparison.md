# Portfolio V11 (ours) vs Client V23 Handoff — Comparison

**Date:** 2026-08-17  
**Client package:** `Matanho_Portfolio_Management_v23_Production_Handoff` (v23.0.0)  
**Our integrated module:** `/portfolio-v11` (`portfolio-v11-mock`)  
**Legacy live module (unchanged):** `/portfolio` (`portfolio-management`, superseded)

## Verdict: **Same product — upgrade in place**

V23 is **not** a new module layout. It is the **next revision** of the same Matanho Portfolio Management SPA we already ported from the client's V11 handoff.

| Dimension | Our `/portfolio-v11` (before upgrade) | Client V23 handoff |
|-----------|--------------------------------------|--------------------|
| **Integration mode** | Mode A runtime host in Next.js | Same (vanilla `src/app.js` + scoped CSS) |
| **Version** | 11.0.0 | **23.0.0** |
| **Navigation / pages** | 4 groups, 22+ workspaces | **Identical** structure (`navGroups`, same page ids) |
| **Routes** | `/portfolio-v11/...` | Same page ids — no new top-level areas |
| **Data fixtures** | Funds, deals, companies, cash ops, etc. | **Same seed data** (e.g. Matanho Growth Fund II) |
| **Visual theme** | Purple accent `#6554e8` | **Blue accent `#2563EB`** (V23 release focus) |
| **RBAC / settings** | V11 dynamic roles matrix | Same V11 RBAC block retained in V23 |
| **V22 ops enhancements** | Partial | **Complete** — table filters, exception SLA view, reservation/exception forms, document upload integrity |
| **API integration** | `hydrateFromBackend` stub | Same + **`dist/api/`** client, bootstrap, OpenAPI map, runtime-config |
| **Profile photos** | Logo assets only in our public copy | V23 expects `/assets/employee-1.jpg` … `employee-9.jpg` |

## What V23 changes (gaps we had)

1. **Theme:** Purple → restrained modern blue (`--brand: #2563eb`, `--v23-accent-*` tokens). Active nav, focus rings, badges, links updated in light + dark.
2. **V22.2 interactions:** Cash/recon table filters, exception drill-down, reservation/exception create flows, import error CSV exports.
3. **Document vault:** Upload handler writes richer metadata (folder, retention, classification).
4. **Production handoff:** OpenAPI, endpoint map, bootstrap contract, `runtime-config.js` for live API mode.
5. **Runtime version:** `window.MatanhoPortfolioUI.version` → `23.0.0`.

## What we are **not** replacing

- **Route prefix** stays `/portfolio-v11` (parallel comparison module per faithful-port skill).
- **Module id** stays `portfolio-v11` in App Switcher (display name already "Portfolio Management").
- **Live `/portfolio`** backend-connected module remains separate / superseded.

## Action taken

Re-ran extraction from client V23 into existing `portfolio-v11-mock` files:

- `components/portfolio-v11-mock/matanho-portfolio-runtime.js`
- `components/portfolio-v11-mock/portfolio-v11.css`
- `components/portfolio-v11-mock/shell.ts` / `shell.html`
- `public/portfolio-v11/assets/*` (logos + any bundled images)

Script: `scripts/extract-portfolio-v23.mjs`

## Verify checklist

- [ ] `/portfolio-v11` — dashboard loads with **blue** active nav (not purple)
- [ ] Sidebar groups: Investments, Fund Operations, Reporting & Records, Workspace
- [ ] Cash → Reconciliations → table filter popovers work
- [ ] Settings → RBAC role matrix renders
- [ ] App Switcher → Portfolio Management → `/portfolio-v11`
- [ ] Live `/portfolio` still routes (redirect or legacy) unchanged

## Backend follow-up

For live API wiring (not in this UI-only upgrade), see client package:

- `docs/openapi.yaml`
- `docs/API_ENDPOINT_MAP.csv`
- `integration/examples/bootstrap-response.example.json`
- `BACKEND_DEVELOPER_START_HERE.md`

Track BE work in `design-refs/portfolio-v23-backend-asks.md` when wiring begins.
