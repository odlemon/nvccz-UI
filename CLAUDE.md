# CLAUDE.md

## What this repo is
Next.js 14 (App Router) frontend for a multi-portal PE/fund-operations platform ("Arcus"/"Matanho"). Talks to a **separate sibling repo** `../nvccz` (Node/Express + Prisma + MySQL, port 3009) — no backend code lives here. Base API URL: `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:3009/api`).

Four portal builds share this codebase, keyed by `NEXT_PUBLIC_PORTAL` and separate `.next-*` output dirs: **staff**, **lp**, **investee**, **apply**. Start via `node scripts/run-portal-dev.mjs <portal>` (`npm run dev:staff|dev:lp|dev:investee|dev:apply`).

See `design-refs/agent-operations-and-deployment-handbook.md` for deploy/infra details and the mandatory workflow (stage → audit → implement → write `*-backend-asks.md` → user tests → repeat).

## Module structure
Modules live in three places, all keyed by the same id:
- `app/<module>/**` — routes (App Router `page.tsx`/`layout.tsx`)
- `components/<module>/` or `components/<module>-mock/` — UI
- `lib/<module>/` — API adapters, live-loaders, actions, types
- `lib/config/modules.ts` — the single source of truth for what's active. Each entry carries `hiddenFromSwitcher` and there's a `SUPERSEDED_MODULE_IDS` set for modules replaced by a newer port. **Check this file before assuming a route/module is current** — legacy and versioned variants often coexist (e.g. `accounting` / `accounting-v2` / `accounting-v52`).

**Two module architectures exist:**
1. **"-mock" client-faithful ports** (e.g. `portfolio-v11-mock`, `accounting-v52-mock`, `investee-portal-v8-mock`): a thin `<module>-app.tsx` React host mounts a vendored, auto-extracted `matanho-<module>-runtime.js` script into a div, wires Next router navigation via callbacks, and intercepts a `matanho:before-action` event to route writes through `lib/<module>/actions.ts` against an explicit allowlist of action ids that should hit the live backend (see `API_ACTIONS` in e.g. `investee-portal-v8-app.tsx`). Anything not on the allowlist stays client-only/mock.
2. **Plain modules** (no runtime.js): ordinary React components under `components/<module>/`, own `<module>-sidebar.tsx` + `<module>-layout.tsx` pair. No single shared sidebar exists across modules — `components/layout/shared-topbar.tsx` is the one genuinely shared piece (search, notifications, theme toggle, app switcher).

## Tech stack
- Next.js 14.2, React 18, TypeScript 5 (strict), path alias `@/*`
- Tailwind CSS v4 (CSS-first config, no `tailwind.config`) + Radix primitives + `lucide-react` (shadcn-style)
- `@reduxjs/toolkit`/`react-redux` used in some modules, not global
- `recharts` for charts, `react-hook-form` + `zod` for forms, `@tiptap/*`/`jspdf`/`react-pdf` for docs
- No Jest/Vitest/RTL test suite — `playwright` is used for scripted UAT/walkthrough scripts, not conventional unit tests
- Ignore `@remix-run/react`, `@sveltejs/kit`, `svelte`, `vue*` in package.json — leftover v0.dev scaffold noise, not used

## Conventions
- **API clients**: `lib/api/<domain>-api.ts` wrap a singleton `apiClient` (`lib/api/api-client.ts`, hand-rolled fetch wrapper with `ApiError`, 401→redirect-to-login handling via `PUBLIC_ROUTE_PREFIXES`). Newer files add `unwrapData()` (strip `{success,data}` envelope), `toastFrError()` (map backend error codes to `sonner` toasts), and a header comment stating the backend route contract + linking the matching `design-refs/*.md` spec. Follow this pattern for new API files.
- **Live-loaders**: `lib/<module>/live-loaders.ts` does a `Promise.all` of API calls with a `safe()`-style wrapper collecting per-call errors rather than failing the whole page. Maturity varies by module (portfolio's is elaborate; investee-portal's is simpler) — there's no shared abstraction, so don't assume one exists.
- Client components use `"use client"`, hooks-heavy function components; typing is strict at the tsconfig level but domain code leans on `Record<string, any>` in places — don't assume end-to-end type safety, verify shapes against the actual API response.
- `design-refs/` is the place for specs, gap-analyses, and backend-ask docs — not repo root. Several loose `*.md`/`.csv` files exist at root from before this convention; don't add more there.

## Things to avoid / watch for
- **`next.config.js` and `next.config.mjs` must be hand-kept in sync** (`.js` is used locally, `.mjs` in Docker) — a comment in `.js` warns mismatches cause `/_next/image` 404s on the login background. There's no automated check; if you edit one, edit both.
- **Never hand-regenerate a `matanho-<module>-runtime.js`** from its `scripts/extract-<module>.mjs` without going through the module's patch script (pattern: `scripts/patch-portfolio-runtime.mjs`). A prior regeneration silently discarded 20 hand-patched live-data action wirings — see `design-refs/portfolio-investee-gap-analysis-and-plan.md` for the exact gap-analysis method used to catch it (extract action ids from runtime, diff against `actions.ts` handlers and a known-good commit).
- **Tab-switching bug pattern**: on several modules, tabbed pages navigate to a different route instead of switching content in place (found on Reviews, Reports, Enterprise Risk Register in Performance; Application tab in Deal Detail). Check this explicitly on any tabbed UI you touch.
- **Hardcoded values masquerading as live data**: sidebar badge counts and KPI cards have been found hardcoded rather than computed from real records in more than one module. Don't trust a plausible-looking number — trace it to its source data.
- Don't commit secrets into `design-refs/` — an existing doc has a plaintext credential inline flagged "rotate later"; don't repeat that pattern in new docs.
- `.env.local` (not committed) holds all environment wiring — `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_PORTAL`, per-portal redirect URLs, per-portal auth cookie key overrides. There's no committed `.env.example`; check with the user before assuming a var's default.

## Cross-module integration
- Modules are independent Next apps sharing one codebase/tsconfig, not a monorepo of packages — coupling happens through `lib/config/modules.ts` (routing/visibility) and shared UI primitives (`components/ui/`, `shared-topbar.tsx`), not through direct imports between module folders.
- `lp-portal` and `investee-portal-v8` open via `externalPortalUrl` (new tab, separate portal build) rather than in-app routing — don't assume every sidebar link stays within the current Next app.
- Backend contracts are documented per-domain in `design-refs/*-backend-asks.md`; when a module's data looks wrong, check whether the mismatch is frontend wiring or a gap already logged in that module's backend-asks doc before treating it as a new bug.
