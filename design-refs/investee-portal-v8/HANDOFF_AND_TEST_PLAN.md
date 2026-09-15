# Investee Portal V8 — handoff and full-sweep test plan

**For:** the next agent picking this up cold · **Goal:** Investee Portal (founder-facing) demo-ready,
same standard as Procurement V23's and Portfolio V11's completed sweeps · **Handoff date:** 15 September 2026

---

## 1. What this is

Arcus / Matanho platform. Investee Portal (internal id `investee-portal-v8`) is a vendored, auto-extracted
runtime script rendered inside a Next.js host (`investee-portal-v8-app.tsx`), with a hand-built live-data
layer wiring it to the backend. Route base `/investee-portal-v8`.

| | Path | Notes |
|---|---|---|
| Frontend repo | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 · GitHub `odlemon/nvccz-UI` · default branch **`dev`** |
| API repo | `C:\Users\lysp\Downloads\nvccz` | Express + Prisma + MySQL · GitHub `odlemon/nvccz` · default **`master`**, also **`prod`** |
| Working branch (frontend) | `feature/investee-portal-v8-live`, cut from `dev` at `e85e1cd` | |
| Working branch (backend) | not yet created — cut only if a genuine backend change is needed | |

**Frontend key files**
- `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js` — vendored runtime. **Generated — never hand-edit directly, always go through the patch script below.**
- `scripts/extract-investee-portal-v8.mjs` — regenerates the runtime (+ shell.html/shell.ts/investee-portal-v8.css/nav.ts) from the vendor source at `C:/Users/lysp/Downloads/Matanho_Investee_Portal_Production_v8`; self-invokes the patch script below (Phase 6 addition).
- `scripts/patch-investee-portal-runtime.mjs` — **new this session (Phase 6)**. Idempotent, data-driven (33 hunks) re-application of every hand-built live-data addition, plus 2 smaller hunks for shell.html/shell.ts and investee-portal-v8.css. See its header comment for the full inventory and the `ba32eef`-incident rationale for why it exists.
- `components/investee-portal-v8-mock/investee-portal-v8-app.tsx` — host; owns the `API_ACTIONS` allowlist that routes `matanho:before-action` events to the live backend via `lib/investee-portal-v8/actions.ts`.
- `lib/investee-portal-v8/actions.ts` — `handleInvesteePortalV8Action()`-style dispatcher (532 lines), depends directly on the runtime's `window.MatanhoInvesteeUI` global (`hydrate`/`getSnapshot`/`notify`/`closeOverlays`).
- `design-refs/investee-portal-v8-backend-asks.md`, `design-refs/investee-portal-v8-ui-handoff.md` — prior static analysis; per the cross-module overview these were written without the dev server running and this sweep is the live-verification pass.
- `design-refs/portfolio-investee-gap-analysis-and-plan.md` — the Sept 2026 static gap-analysis covering both Portfolio and Investee.
- `design-refs/FULL_SWEEP_2026-09_OVERVIEW.md` — cross-module index (this sweep + Portfolio, already done + LP Portal re-sweep, not yet started).

---

## 2. Where everything stands

| Phase | Status |
|---|---|
| 6 — Runtime safety net | **Done** — `scripts/patch-investee-portal-runtime.mjs` built and proven: a real extraction against the vendor source followed by the patch script reproduces the committed `matanho-investee-portal-runtime.js`, `shell.html`, `shell.ts`, and `investee-portal-v8.css` byte-for-byte (`git hash-object` match against `HEAD`), and the patch script is idempotent across 3 repeated standalone runs. Self-invoked from `extract-investee-portal-v8.mjs` exactly like Portfolio's `extract-portfolio-v25.mjs` T0.1 pattern. Two extra hand-edits outside the runtime.js (a "Switch module" topbar button in shell.html/shell.ts; a typography-readability CSS block) were also found silently dropped by a raw extract and are now covered by the same patch script — same incident class, so fixed rather than left as a gap. Committed `532748d`, pushed to `feature/investee-portal-v8-live`. `node --check` passes on the patched runtime (remember: this does not guarantee a real Next.js/webpack build succeeds — see Portfolio's Phase 4 lesson on `${...}` interpolation outside template-literal context).
| 7 — Live testing | Not started |
| 8 — Fixes by severity | Not started |
| 9 — Merge & deploy | Not started |

See the plan document (`atomic-questing-newell.md`) Phases 6-9 for the full intended scope: FINDING-003 re-check from the Investee side, claimed-live screens with `investee.test@arcus.co.zw` (Term Sheet, Signatures, KPI Centre, Financial Reporting, Settings), the `application-portal/<suffix>` → `investee-portal-v8<suffix>` redirect audit, and confirming Document Vault/Messages/Cap Table/Governance/Forecasts/Team & Access are in their documented (mock/fixture/inert) state rather than regressed.
