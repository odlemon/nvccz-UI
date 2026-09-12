# Payroll V6 — UI handoff

> **Status:** Integrated — client Matanho Payroll HR Deploy V6 under `/payroll`.  
> **Source:** `C:\Users\lysp\Downloads\Matanho_Payroll_HR_Deploy_v6`  
> **Mode:** Interactive mock (Mode A runtime host) — no live API.  
> **Live module left alone:** `/payroll` (Payroll)

## What shipped

Full client V6 suite hosted in Next.js:

- Shell (sidebar, topbar, command palette, drawers, modals, toasts)
- Command Centre overview
- Employees, Onboarding
- Payroll Runs, Inputs & Validation, Exception Workbench, Maker-Checker Review, Close & Distribution
- Earnings & Deductions, Pay Groups & Calendar, Tax & Statutory Rules
- Training & Compliance, Leave & Benefits, Vendors & Quotations
- Document Vault, Compliance Reports, Audit Trail, Roles & Access, Settings, My Pay

## Routes

| Client page id | Next path |
|----------------|-----------|
| `overview` | `/payroll` |
| `employees` | `/payroll/employees` |
| `onboarding` | `/payroll/onboarding` |
| `runs` | `/payroll/runs` |
| `inputs` | `/payroll/inputs` |
| `exceptions` | `/payroll/exceptions` |
| `approvals` | `/payroll/approvals` |
| `close` | `/payroll/close` |
| `components` | `/payroll/components` |
| `calendar` | `/payroll/calendar` |
| `tax` | `/payroll/tax` |
| `training` | `/payroll/training` |
| `leave` | `/payroll/leave` |
| `vendors` | `/payroll/vendors` |
| `vault` | `/payroll/vault` |
| `reports` | `/payroll/reports` |
| `audit` | `/payroll/audit` |
| `access` | `/payroll/access` |
| `settings` | `/payroll/settings` |
| `mypay` | `/payroll/mypay` |

## Code map

| Layer | Path |
|-------|------|
| Module | `lib/config/modules.ts` — `payroll-v6` / **Payroll (V6)** |
| Host | `components/payroll-v6-mock/payroll-v6-app.tsx` |
| Runtime | `components/payroll-v6-mock/matanho-payroll-runtime.js` |
| Shell HTML | `components/payroll-v6-mock/shell.ts` |
| CSS | `payroll-v6.css` + `payroll-v6-overrides.css` |
| Nav | `lib/payroll-v6-mock/nav.ts` |
| Assets | `public/payroll-v6/assets/` |
| Extract script | `scripts/extract-payroll-v6.mjs` |

## Deviations

1. Arcus SharedTopbar above client chrome.
2. Client `goPage` synced to Next paths via `__PAYROLL_V6_NAV__`.
3. Client radii/colors kept (not Arcus pills).
4. Tailwind `@tailwind` directives stripped (client ships them uncompiled; design uses custom CSS).
5. Live `/payroll` unchanged.
6. Public preview: middleware pass-through `/payroll`.

## Public preview

**http://localhost:3002/payroll**

(No login required.)

## Verify

1. Open `/payroll` — Command Centre loads with client sidebar
2. Walk sidebar workspaces — URL updates under `/payroll/...`
3. Theme toggle / command palette (Ctrl/Cmd K) still work
4. App Switcher shows **Payroll (V6)** next to live **Payroll**
