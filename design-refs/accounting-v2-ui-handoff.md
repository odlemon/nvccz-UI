# Accounting V2 UI — handoff

> **Status:** All 18 screens built from PDF rasters. Live `/accounting` untouched.
> **Source:** `design-refs/Arcus_Accounting_UI_Inspiration_and_Interaction_Reference.pdf`
> **Rasters:** `design-refs/accounting-v2-pages/*.png` (22 PNGs @ 2×, 1920×1200)
> **Mount:** `/accounting-v2` · App Switcher: **Accounting (New)**
> **Mode:** Hardcoded fixtures / interactive mock — no live API wiring.

## Screens — all complete

| # | Screen | Route | subModuleId | Status |
|---|---|---|---|---|
| 01 | Command Centre | `/accounting-v2` | `ac-dashboard` | done |
| 02 | General Ledger Explorer | `/accounting-v2/general-ledger` | `ac-gl` | done |
| 03 | Journal Entry Maker-Checker | `/accounting-v2/journals/new` | `ac-journal` | done |
| 04 | Cash Book | `/accounting-v2/cash-book` | `ac-cash` | done |
| 05 | Bank Reconciliation | `/accounting-v2/bank-reconciliation` | `ac-recon` | done |
| 06 | Invoice three-way match | `/accounting-v2/payables/match` | `ac-purchases` | done |
| 07 | Receivables / Collections | `/accounting-v2/receivables` | `ac-sales` | done |
| 08 | Inventory valuation | `/accounting-v2/inventory` | `ac-inventory` | done |
| 09 | Fixed Assets | `/accounting-v2/assets` | `ac-assets` | done |
| 10 | Short-Term Investments | `/accounting-v2/short-term-investments` | `ac-sti` | done |
| 11 | Financial Reports builder | `/accounting-v2/reports` | `ac-reports` | done |
| 12 | Month-End Close | `/accounting-v2/close` | `ac-close` | done |
| 13 | Expenses & Claims | `/accounting-v2/expenses` | `ac-expenses` | done |
| 14 | Chart Governance | `/accounting-v2/chart-governance` | `ac-settings` | done |
| 15 | Tax Return Pack | `/accounting-v2/tax` | `ac-tax` | done |
| 16 | FX Revaluation | `/accounting-v2/fx-revaluation` | `ac-fx` | done |
| 17 | Consolidation | `/accounting-v2/consolidation` | `ac-consolidation` | done |
| 18 | Payment Run | `/accounting-v2/payment-run` | `ac-payment-run` | done |

## Code map

| Layer | Path |
|---|---|
| Module | `lib/config/modules.ts` — `accounting-v2` / **Accounting (New)** |
| Permissions | `lib/config/role-permissions.ts` — open (mock phase) |
| Routes | `app/accounting-v2/**/page.tsx` (18 pages) |
| Layout | `components/layout/accounting-v2-layout.tsx` |
| Shell / nav | `components/accounting-mock/shell.tsx`, `lib/accounting-mock/nav.ts` |
| Tokens | `lib/accounting-mock/tokens.ts` |
| Primitives | `components/accounting-mock/primitives.tsx` |
| Screens | `components/accounting-mock/screens/*-screen.tsx` (18 screens) |
| Fixtures | `lib/accounting-mock/fixtures*.ts` (18 fixture files) |

## Locked palette

| Token | Hex |
|---|---|
| Midnight navy | `#0B1739` |
| Cobalt | `#2563EB` |
| Pale sky | `#D8E8FF` |
| Canvas | `#F5F8FC` |
| Pending | `#F59E0B` |
| Exception | `#DC2626` |
| **No green** | Positive/complete states use cobalt |

## Known deviations

1. **Shell consistency:** The PDF draws slightly different app chrome on different pages. One canonical shell is shipped (caps `ARCUS ACCOUNTING` lockup, `‹` collapse).
2. **Two-bar de-duplication:** The PDF's accounting chrome carries its own search, notifications, help and user menu. In-app these already exist in the global Arcus `SharedTopbar`, which sits above the mock shell, so rendering both produced two competing navbars. The mock chrome is therefore reduced to a slim context strip holding only the **entity / period / currency** filters plus the FX readout; all global chrome comes from `SharedTopbar`. See `AccountingMockTopChrome` in `components/accounting-mock/shell.tsx`.
3. **Button radii:** All buttons use `rounded-full` per Arcus workspace rule, overriding the PDF's square/lightly-rounded buttons.
4. **Bank-feed status dot (04):** Cobalt instead of green (palette rule).
5. **Payment Run stepper (18):** 5 steps per the raster (not 3 as in the brief's description).
6. **Fixed Assets NBV (09):** AST-VEH-0014 uses arithmetically correct $26,940 where raster OCR was inconsistent.
7. **Responsive:** PDF is desktop-only (dense ~13.5"); cards/tables collapse/scroll on narrow viewports — no mobile layouts invented.

## Linter status

ReadLints clean across all 54 files (18 screens + 18 fixtures + 18 route pages).
