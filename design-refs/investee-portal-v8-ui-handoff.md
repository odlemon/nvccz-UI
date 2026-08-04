# Investee Portal V8 — UI handoff

> **Status:** Integrated — client Matanho Investee Portal Production V8 under `/investee-portal-v8`.  
> **Source:** `C:\Users\lysp\Downloads\Matanho_Investee_Portal_Production_v8`  
> **Mode:** Interactive mock (Mode A runtime host) — fixture data in client JS.  
> **Live modules left alone:** Application Portal / other portfolio company routes

## What shipped

Full client V8 investee workspace:

- Overview dashboard
- KPI Centre, Reporting Centre, Actuals & Forecast Model
- Term Sheet, Cap Table, Governance, Signatures
- Capital & Procurement Requests, Document Vault, Messages
- Team & Access, Settings
- Drawers, modals, command palette, theme toggle

## Routes

| Client page id | Next path |
|----------------|-----------|
| `dashboard` | `/investee-portal-v8` |
| `kpis` | `/investee-portal-v8/kpis` |
| `reports` | `/investee-portal-v8/reports` |
| `forecasts` | `/investee-portal-v8/forecasts` |
| `terms` | `/investee-portal-v8/terms` |
| `cap-table` | `/investee-portal-v8/cap-table` |
| `governance` | `/investee-portal-v8/governance` |
| `signatures` | `/investee-portal-v8/signatures` |
| `requests` | `/investee-portal-v8/requests` |
| `data-room` | `/investee-portal-v8/data-room` |
| `messages` | `/investee-portal-v8/messages` |
| `team` | `/investee-portal-v8/team` |
| `settings` | `/investee-portal-v8/settings` |

## Code map

| Layer | Path |
|-------|------|
| Module | `lib/config/modules.ts` — `investee-portal-v8` / **Investee Portal (V8)** |
| Host | `components/investee-portal-v8-mock/investee-portal-v8-app.tsx` |
| Runtime | `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js` |
| Shell | `components/investee-portal-v8-mock/shell.ts` |
| CSS | `investee-portal-v8.css` + overrides |
| Nav | `lib/investee-portal-v8-mock/nav.ts` |
| Assets | `public/investee-portal-v8/assets/` |
| Extract script | `scripts/extract-investee-portal-v8.mjs` |

## Deviations

1. Arcus SharedTopbar above client chrome.
2. Client hash routing replaced with Next paths via `__INVESTEE_V8_NAV__`.
3. Client radii/colors kept (not Arcus pills).
4. Theme applied on module root (`data-theme`) for scoped CSS.
5. Public preview: middleware pass-through `/investee-portal-v8`.

## Public preview

**http://localhost:3002/investee-portal-v8**

(No login required.)

## Verify

1. Open `/investee-portal-v8` — Overview with client sidebar
2. Walk sidebar workspaces — URL updates under `/investee-portal-v8/...`
3. Theme toggle / command palette (Ctrl/Cmd K) still work
4. App Switcher shows **Investee Portal (V8)**
