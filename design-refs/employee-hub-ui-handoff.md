# Employee Hub & Personal Home — UI handoff

> **Status:** Complete — all 17 interactive mock screens navigable at `/employee-hub`.  
> **Source:** `design-refs/Arcus_Employee_Hub_and_Personal_Home_UI_Mockups (2).pdf`  
> **Rasters:** `design-refs/employee-hub-pages/*.png`  
> **Mode:** Hardcoded fixtures / interactive mock — **no live API wiring** in this phase.

## Design system (from PDF)

- Canvas: white + warm-neutral (`#F7F6F3`)
- Typography: deep navy (`#0F172A`)
- Accents: Arcus cyan (`#0EA5B7`) + restrained azure — **no purple**
- Primary CTAs: deep navy pills (`rounded-full`)
- Logo in chrome: Matanho (`/new_logo.jpeg`)

## Routes (all wired)

| # | Screen | Route | Status |
|---|---|---|---|
| 01 | Employee Home | `/employee-hub` | done |
| 02 | Daily Cover Studio | `/employee-hub/cover` | done |
| 03 | News | `/employee-hub/news` | done |
| 04 | News Article Reader | `/employee-hub/news/[id]` | done |
| 05 | Newsletters Library | `/employee-hub/newsletters` | done |
| 06 | Newsletter Reader | `/employee-hub/newsletters/[id]` | done |
| 07 | Newsletter Editor | `/employee-hub/newsletters/editor` | done |
| 08 | Internal Forums | `/employee-hub/forums` | done |
| 09 | Forum Thread | `/employee-hub/forums/[id]` | done |
| 10 | Personal Calendar | `/employee-hub/calendar` | done |
| 11 | My Work | `/employee-hub/work` | done |
| 12 | My Performance | `/employee-hub/performance` | done |
| 13 | People Directory | `/employee-hub/people` | done |
| 14 | My Profile | `/employee-hub/profile` | done |
| 15 | Employee Services | `/employee-hub/services` | done |
| 16 | Apps | `/employee-hub/apps` | done |
| 17 | AI / Search | `/employee-hub/search` | done |

## Code layout

| Layer | Path |
|---|---|
| Module | `lib/config/modules.ts` → `employee-hub` |
| Permissions | `lib/config/role-permissions.ts` → open access for mock phase |
| Tokens / nav / fixtures | `lib/employee-hub-mock/` |
| Shell / layout | `components/employee-hub-mock/shell.tsx`, `components/layout/employee-hub-layout.tsx` |
| Page wrapper | `components/employee-hub-mock/eh-page.tsx` |
| Screens | `components/employee-hub-mock/screens/*.tsx` (17 files) |
| Routes | `app/employee-hub/**/page.tsx` (17 routes) |

## Verify

1. App Switcher → **Employee Hub** → `/employee-hub`
2. Sidebar links navigate all primary IA items
3. Create menu + search bar → cover / editor / search
4. Feed cards + news list → article reader
5. Forums list → thread detail with live reply
6. Apps launcher deep-links to Performance, Payroll, Portfolio, etc.

## Non-goals (unchanged)

- `/` homepage (markets + tabs) not replaced
- No live leave/payroll/expense API writes
