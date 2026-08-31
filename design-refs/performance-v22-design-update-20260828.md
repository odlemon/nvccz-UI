# Performance V22.1 — Design update report (28 Aug 2026 package)

**Package:** `Matanho_Performance_Management_v22_1_Deployment_Developer_Package` (v22.1.0)  
**Path:** `C:\Users\lysp\Downloads\Matanho_Performance_Management_v22_1_Deployment_Developer_Package-20260828T144718Z-1-001\...`  
**Integration target:** `/performance-v22` (Mode A runtime host)  
**Scope:** Visual / interaction layer only — no API or backend changes.

## Package inventory

| Category | Contents |
|---|---|
| Deployable UI | `public/index.html` (V22.1 SPA), `public/legacy-v22.html` |
| Assets | `public/assets/*` (api-client, backend-bridge, integration.css, favicon) |
| Backend contract (reference) | `backend/openapi.yaml`, ui-action-catalog, binding matrix, permissions |
| Docs | COMPONENT_INVENTORY, DEPLOYMENT_GUIDE, BACKEND_INTEGRATION_GUIDE, TAILWIND_RESPONSIVE_GUIDE |
| Original + changelog | `original/V22_CHANGELOG.md`, interaction-corrections HTML |
| Tailwind partials | `src/components/*.html`, `src/styles/tokens.css` |
| Mock server | `mock/mock-server.mjs` (standalone preview on :4173) |

**Note:** SHA256 of `public/index.html` in the 28 Aug package matches the 15 Aug package — same V22.1 UI baseline. This update re-syncs the Next.js extract and confirms V22 interaction-correction layers are applied.

## Screens covered

All module workspaces in the package are hosted under `/performance-v22`:

Command Centre, Company Strategy, Scorecards (Org / Department / Board / CEO / Employee), Objectives & KPIs, Tasks & Projects, Performance Reviews, Corrective Actions, Reports & Compliance, Document Vault, Alerts & Audit, Access & Settings, plus internal routes (Departments, Integrations, KPI Analytics, Timesheets, Enterprise Risk).

## Change report

| Screen | What changed (per new design) | Implementation notes | Verified? |
|---|---|---|---|
| **Task workspace (Layer 3)** | Quick-action rail: fixed oversized/black SVG icons; explicit 14px icon sizing, contrast, button height, horizontal scroll | V22 CSS block `.v16-task-command` + `.v16-task-command button svg` in scoped `performance-v22.css` | Yes — CSS + runtime V22 patch present; `node --check` passes |
| **KPI registry / Enterprise Risk rows** | Generic “Record detail” drawer disabled; rows open only real workflows (KPI config, risk record page) | V22 JS: `openDrawer` intercept, `markManagedRows()`, `data-v22-managed-row` | Yes — grep confirms patch block |
| **Performance Reports** | Whole row opens controlled report preview; keyboard Enter/Space | V22 JS: `data-v22-report-id`, click/keydown → `MatanhoV20.previewReport` | Yes |
| **Tasks & Projects — project cards** | Legacy V4/V5/V6 card hooks removed; cards route to V20 project workspace; duplicate Layer 2 cleared | V22 JS: `patchProjectCards`, `clearLegacyProjectState`, `data-v22-project-id` | Yes |
| **Enterprise Risk Register** | Live visible-record count, clear-filter, sort (residual/inherent/review/owner); responsive table→cards on tablet/mobile | V22 JS: `patchRiskRegister`, `applyRiskFilters`, `.v22-risk-livebar`; responsive CSS in V22 block | Yes |
| **Enterprise Intelligence (Layer 2)** | Replaced generic dataset with contextual intelligence per active module | V22 JS: `spec()`, `contextualizeLayer`, `.v22-intel-*` components; hides `.sig-depthbar`, `.sig-card-tool` | Yes |
| **Scorecards — manager permission note** | Removed oversized green/black permission icon; text-only governance note retained | V22 CSS: `.v13-manager-rights svg/i { display:none }` | Yes |
| **Scorecards — all tabs** | Formal BSC templates: Organization, Department, Board, CEO, Employee (unchanged in V22.1 baseline — already in package) | Existing runtime renderers `scorecards()`, tab switcher `scorecard-tab` | Yes — tab structure unchanged; data/wiring preserved |
| **Shell / navigation** | Unchanged V22.1 sidebar, topbar, entity/role/year selectors | Next.js path routing via `__setPm22Page` / `PM22_PAGE_TO_PATH`; Arcus app switcher + session profile preserved as integration patches | Yes |

## Next.js integration preserved (not in client package)

- Arcus App Switcher: `openApps` → `window.__openArcusAppSwitcher`
- Session profile popover: `openUserMenu` + `buildArcusProfilePopoverHtml`
- Sign-out: `client-design-sign-out` → `clientDesignSignOut()`
- Sidebar expanded on mount: `pm22EnsureExpanded()`
- Safe missing-page fallback in `render()`

Extract script updated: `scripts/extract-performance-v22.mjs` (new package path + auth/switcher post-patches).

## Out of scope (flagged — not built)

| Item | Why flagged |
|---|---|
| Backend hydration (`enableBackendHydration: true`) | Requires live `/api/v1/bootstrap` — separate BE task |
| Tailwind component partial migration (`src/components/*.html`) | Styling reference for future production refactor; not part of this visual sync |
| Mock server / OpenAPI implementation | Package includes contract; no backend work in this task |
| Live `/performance` module | Left unchanged per handoff — comparison module is `/performance-v22` only |

## Verification (Pass 1 + Pass 2)

1. Re-extracted from 28 Aug package → `components/performance-v22-mock/*`, `public/performance-v22/assets/*`
2. `node --check` on `matanho-performance-runtime.js` — OK
3. Grep: `MatanhoV22`, `v22-intel`, `v22-risk-livebar`, `openUserMenu`, `__openArcusAppSwitcher`, V22 CSS block — all present
4. No new hardcoded mock fallbacks introduced; `enableBackendHydration: false` unchanged

## Blockers

None. Current work can resume.
