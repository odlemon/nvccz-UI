---
name: client-ui-faithful-port
description: >-
  Faithfully integrate a client-delivered UI (vanilla HTML/JS SPA, React kit, or
  mockup package) into this Next.js Arcus app as a parallel comparison module —
  scoped CSS, Next routes, App Switcher entry, fixtures/assets, no redesign.
  Use when the user provides a client project folder, asks for Home Version N /
  Module (New) / faithful port, or says integrate the design as-is into Next.js.
---

# Client UI faithful port (Next.js)

## Goal

Ship the client’s design **as they built it** inside our Next.js app for side-by-side review. Change the **stack only** (vanilla/static → Next). Do **not** Arcus-ify pills, rewrite layout, or invent product rules.

Reference implementation: `/home-v3` (Matanho Employee Hub Premium V10).  
Case study: [reference-home-v3.md](reference-home-v3.md) · Playbook: [design-refs/client-ui-faithful-port-playbook.md](../../../design-refs/client-ui-faithful-port-playbook.md)

## Decide the integration mode (first)

Inspect the client package before coding:

| Client shape | Mode | Approach |
|--------------|------|----------|
| Monolithic `index.html` + embedded CSS/JS, no React | **A — Runtime host** | Extract CSS + JS runtime; mount from a React client host; Next owns URLs |
| React/Vite/Next components | **B — Component port** | Copy/adapt components into `components/<module>-mock/`; map routes |
| PDF/PNG mockups only | **C — Screen rebuild** | Same as existing Employee Hub / Accounting V2: tokens + fixtures + screens |

Prefer **A** when the client ships a working SPA and fidelity matters more than idiomatic JSX.

Flag conflicts before assuming (React version, Tailwind v3 vs v4, global CSS vars, button radii). Explicit exception: **keep client radii** for comparison modules (not Arcus `rounded-full`).

## Packaging pattern (always)

Mirror Employee Hub / Accounting V2:

| Layer | Path pattern |
|-------|----------------|
| Module | `lib/config/modules.ts` — `id`, display name, `path`, `subModules` |
| Permissions | `lib/config/role-permissions.ts` — open mock access for authenticated roles |
| Public preview | `middleware.ts` `passThroughRoutes` + skip `ModuleGuard` / AuthProvider boot gate if backend is down |
| Routes | `app/<module>/**/page.tsx` |
| Layout | `components/layout/<module>-layout.tsx` — `SharedTopbar` + module UI |
| UI package | `components/<module>-mock/` |
| Data/tokens/nav | `lib/<module>-mock/` |
| Assets | `public/<module>/assets/` (copy from client) |
| Handoff | `design-refs/<module>-ui-handoff.md` |

Leave existing live modules (`/`, `/employee-hub`, etc.) **unchanged**.

## Mode A workflow (vanilla SPA → Next) — Home V3 method

### 1. Audit client

- Entry: `index.html` (or `dist/`)
- List view functions / routes / `MATANHO_DATA`-style seed
- Assets folder; fonts; CSS vars; hash vs path routing
- Confirm full suite vs single page

### 2. Extract

Use Node scripts under `scripts/` (don’t paste 600KB into chat):

1. Pull `<style>` → scoped CSS under `.` + module root class (e.g. `.home-v3-root`)
2. Pull seed data → `lib/<module>-mock/*-data.ts` (rewrite `assets/` → `/<module>/assets/`)
3. Pull app IIFE → `components/<module>-mock/*-runtime.js` wrapped as `startXRuntime(rootEl, options)`
4. Copy `assets/` → `public/<module>/assets/`

### 3. Patch runtime for Next

- Replace `location.hash` / `hashchange` with `options.onNavigate` + optional `__MODULE_PATH__` for deep links
- Mount `#app` / `#portal` inside `rootEl` (not `document.getElementById` for shell)
- Apply cover-theme / CSS vars on `rootEl`, not `document.documentElement`
- Scope event listeners with `AbortController` and abort on `destroy()`
- Fix share/copy links to Next paths (`/module/...` not `#/route`)
- Toasts: prefer `document.body` host if root uses `overflow: clip`

### 4. Scope CSS

- `:root` / `html` / `body` → `.module-root`
- Prefix all selectors under `.module-root` (robust @media-aware scoper)
- Overrides file for SharedTopbar offset (`h-20` / `5rem`): sidebar `position: absolute` inside root, overlay `inset: 5rem 0 0 0`

### 5. React host + layout

- Client host mounts runtime once in layout (avoid remount on every child page)
- `usePathname` → `setRoute` / detail hydration
- Runtime navigate → `router.push`
- Thin `app/<module>/**/page.tsx` files for App Router + deep links

### 6. Deep links

Parse and build paths for list + detail (article, thread, editor). Sync both ways so refresh keeps the view.

### 7. Public preview

If auth/backend blocks review:

- Add `/<module>` to middleware `passThroughRoutes`
- Skip AuthProvider boot spinner on that path
- Drop `ModuleGuard` for the mock module

### 8. Handoff + verify

Write `design-refs/<module>-ui-handoff.md` with routes, deviations, verify checklist.  
Hit every route (expect 200). Verify assets load. Confirm sibling modules untouched.

## Mode B / C (short)

- **B:** Port components; still scope tokens; fixtures; same packaging table.
- **C:** Follow existing `employee-hub-mock` / `accounting-mock` screen + fixture pattern from PDF rasters.

## Hard rules

1. Faithful first — no “improvements” unless the user asks.
2. Docs in `design-refs/` are source of truth (handoff + any BE asks).
3. Verify twice (static re-read + route/asset grep or HTTP smoke).
4. Do not replace production routes; add parallel module ids (`*-v2`, `home-v3`, `… (New)`).
5. SharedTopbar stays for App Switcher comparison unless the user wants full-bleed-only.

## Checklist (copy per module)

```
- [ ] Client package audited (stack, routes, assets)
- [ ] Integration mode chosen (A/B/C) and conflicts flagged
- [ ] MODULE_CONFIG + permissions (+ passThrough if needed)
- [ ] Assets copied to public/<module>/assets
- [ ] CSS scoped under .<module>-root
- [ ] Runtime host or React screens for ALL client views
- [ ] Next routes + deep links bidirectional
- [ ] design-refs/<module>-ui-handoff.md
- [ ] Smoke all routes; live modules still work
```
