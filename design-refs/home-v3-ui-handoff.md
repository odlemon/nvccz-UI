# Home Version 3 — UI handoff

> **Status:** Superseded by the live build — this started as Matanho Employee Hub Premium
> **V17.1**, mock-only, but Phases 0-9 plus a full regression pass (see
> `design-refs/home-page/execution-plan.md` for the detailed, current record) rewired nearly every
> page to the real backend. Routes, code paths and "no live API" claims below are historical —
> current routes live under `/home` (not `/home-v3`; the old path still works via a legacy redirect
> in `middleware.ts`), and the module is real-data end-to-end except for a short, explicitly-tracked
> list of known gaps in execution-plan.md's "Round 2" section.  
> **Source:** `C:\Users\lysp\Downloads\Matanho_Employee_Hub_Premium_v17_1`  
> **Previous:** V10 (superseded by this extract)  
> **Mode:** Originally an interactive mock (client runtime + fixtures); now live-wired — see
> execution-plan.md.  
> **Comparison set:** `/` (Homepage) · `/employee-hub` (Employee Hub) · `/home` (Home Version 3)

## What shipped (V17.1)

Faithful Next.js integration of the **entire** client SPA:

| Area | Included |
|------|----------|
| Shell | Sidebar, topbar, command palette, notifications, profile, settings, toasts, modals/drawers |
| Home | Japandi hero, scene carousel, workday timer, snapshot / priorities / schedule, **responsive Matanho Assistant composer** (V17.1 grid-area fix) |
| Daily Cover | Theme studio + wallpaper export / share |
| News | Library + article reader |
| Newsletters | Library, reader, studio editor |
| Forums | List + thread |
| Calendar | Month / week board |
| My Work | Projects, tasks, scorecard side |
| Performance | Overview / Goals / Feedback / Development / Scorecard |
| People | Directory + person detail |
| Profile | Overview / Experience / Goals / Preferences / Documents |
| Services | Service grid + requests |
| Apps | Pinned / categories / access requests |
| **Matanho AI (V16 redesign)** | Ask / Briefs / Search / Draft / Saved modes, context switches, structured answers, desktop three-panel layout |

- Scoped client CSS under `.home-v3-root`
- Extracted client runtime adapted for App Router
- Fixtures from `MATANHO_DATA` + `public/home-v3/assets/`
- App Switcher entry **Home Version 3**
- Public preview (no login) via middleware pass-through

## Routes

| Client hash | Next route |
|-------------|------------|
| `#/home` | `/home-v3` |
| `#/daily-cover` | `/home-v3/cover` |
| `#/news` | `/home-v3/news` |
| (article) | `/home-v3/news/[id]` |
| `#/newsletters` | `/home-v3/newsletters` |
| (reader) | `/home-v3/newsletters/[id]` |
| (editor) | `/home-v3/newsletters/editor` |
| `#/forums` | `/home-v3/forums` |
| (thread) | `/home-v3/forums/[id]` |
| `#/calendar` | `/home-v3/calendar` |
| `#/my-work` | `/home-v3/work` |
| `#/performance` | `/home-v3/performance` |
| `#/people` | `/home-v3/people` |
| `#/my-profile` | `/home-v3/profile` |
| `#/services` | `/home-v3/services` |
| `#/apps` | `/home-v3/apps` |
| `#/matanho-ai` | `/home-v3/search` |

## Code map

| Layer | Path |
|-------|------|
| Module | `lib/config/modules.ts` — `home-v3` |
| Host | `components/home-v3-mock/home-v3-app.tsx` |
| Runtime | `components/home-v3-mock/matanho-runtime.js` |
| Styles | `home-v3.css` + `home-v3-overrides.css` |
| Nav / deep links | `lib/home-v3-mock/nav.ts` |
| Fixtures | `matanho-data.ts`, `hero-scenes.ts` |
| Assets | `public/home-v3/assets/` |
| Extract | `scripts/extract-home-v3.mjs`, `extract-home-v3-runtime.mjs`, `scope-home-v3-css.mjs`, patches |

## Known deviations

1. **SharedTopbar** above client shell (App Switcher for comparison).
2. Hash routing → Next paths (now `/home/...`, see execution-plan.md).
3. Client button radii (~12px), not Arcus pills.
4. CSS scoped under `.home-v3-root`.
5. ~~Mock/`localStorage` only — no live Matanho API.~~ Superseded: real backend end-to-end as of
   Phases 0-9 + the round-2 regression pass — see execution-plan.md for what's wired and the small
   list of remaining known gaps. `localStorage` is still used as a client-side cache layer for a
   few fields, seeded from real data on load (see `home-v3-app.tsx`'s `seed*Cache` functions), not
   as the source of truth.
6. `/` and `/employee-hub` unchanged.

## Public preview

**http://localhost:3002/home-v3**

## Verify

1. `/home-v3` — home + assistant composer visible at desktop/tablet widths
2. `/home-v3/search` — Matanho AI V16 workspace (Ask/Briefs/Search/Draft/Saved)
3. Sidebar routes update URLs under `/home-v3/...`
4. News / forums / newsletter deep links still hydrate
