# Case study: Home Version 3 (Matanho V10)

## Source

`Matanho_Employee_Hub_Premium_v10` — dependency-free vanilla SPA (`index.html` ~637KB), hash router, embedded CSS/JS, `window.MATANHO_DATA`, `assets/`.

## Mode

**A — Runtime host** (not iframe, not full JSX rewrite).

## What we built

| Piece | Location |
|-------|----------|
| Module | `home-v3` → `/home-v3` (“Home Version 3”) |
| Host | `components/home-v3-mock/home-v3-app.tsx` |
| Runtime | `components/home-v3-mock/matanho-runtime.js` |
| CSS | `home-v3.css` + `home-v3-overrides.css` |
| Data | `lib/home-v3-mock/matanho-data.ts`, `nav.ts`, `hero-scenes.ts` |
| Assets | `public/home-v3/assets/` (62 files) |
| Handoff | `design-refs/home-v3-ui-handoff.md` |

## Extract / patch scripts (reuse pattern)

Under `scripts/`:

- `extract-home-v3.mjs` — CSS + data + hero scenes excerpts
- `extract-home-v3-runtime.mjs` — wrap client IIFE as `startMatanhoRuntime`
- `fix-home-v3-runtime-scope.mjs` — keep `state`/`render` in function scope
- `scope-home-v3-css.mjs` — prefix selectors under `.home-v3-root`
- `patch-home-v3-listeners.mjs` — AbortController on `document` listeners
- `patch-home-v3-details.mjs` — `syncUrl`, deep-link actions, Next share links

For the next vanilla client: copy these scripts and rename module prefixes.

## Key patches that made it work

1. `navigate(route)` → `window.__HOME_V3_NAV__` + render (no hash)
2. Detail opens → `window.__HOME_V3_PATH__({ route, selectedNews, … })` → `buildHv3Path` → `router.push`
3. `parseHv3Location(pathname)` hydrates article/thread/editor on load/refresh
4. Layout owns the host once; pages are thin App Router shells
5. Middleware pass-through `/home-v3` + no ModuleGuard for offline preview
6. Dev port: package default `3001` may be Cursor realtime — use `next dev -p 3002` if `Cannot GET`

## Full suite covered

All client `*View()` functions remained in the runtime (Home through Matanho AI). Do not stop at the first screen unless the user scopes to Home-only.

## Deviations accepted

- Arcus `SharedTopbar` above client chrome
- Client ~12px buttons (not Arcus pills)
- Mock data / localStorage only
