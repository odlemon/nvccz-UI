# Performance V22 — handoff and full-sweep test plan

**For:** the next agent picking this up cold · **Goal:** Performance module demo-ready, same standard
as Procurement V23's, Portfolio V11's and Investee Portal V8's sweeps · **Handoff date:** 19 September 2026

---

## 1. What this is

Added to the Portfolio + Investee Portal + LP Portal full-sweep engagement on 19 September 2026, at the
user's explicit request to cover "the whole system including the performance module." Same method:
live browser testing, real bugs root-caused and fixed by severity, every fix verified live, deployed to
dev then production, merged to trunk.

| | Path | Notes |
|---|---|---|
| Frontend repo | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 · GitHub `odlemon/nvccz-UI` · default branch **`dev`** |
| API repo | `C:\Users\lysp\Downloads\nvccz` | Express + Prisma + MySQL · GitHub `odlemon/nvccz` · default **`master`**, also **`prod`** |
| Working branch (frontend) | `feature/performance-v22-live`, cut from `dev` at `b05ac09` | |
| Working branch (backend) | not yet created — cut only if a genuine backend change is needed | |

## 2. Module identity — READ THIS FIRST, it is genuinely confusing

`lib/config/modules.ts` has **two** performance module entries that both display as "Performance
Management":

- `id: "performance-management"` — the OLD module. `hiddenFromSwitcher: true` **and** listed in
  `SUPERSEDED_MODULE_IDS`. Its own subModules still declare paths under `/performance/*` (e.g.
  `/performance/contracts`, `/performance/goals`) — **these path strings are stale/misleading**, see below.
- `id: "performance-v22"` — the CURRENT module (client Matanho Performance Management V22.1, integrated
  28 Aug 2026 per `performance-v22-ui-handoff.md`). Its config still declares `path: "/performance-v22"`
  and subModule paths like `/performance-v22/strategy` — **also stale**, see below.

**What's actually live:** `middleware.ts` (~line 26-31, ~line 107 onward) has a hand-maintained
`ROLE_PERMISSIONS_MAP`-style route table with an explicit comment: `// Performance Management (Matanho
V22 — canonical /performance)`, mapping `/performance`, `/performance/strategy`,
`/performance/scorecards`, etc. to `{module: 'performance-v22', subModule: 'pm22-*'}`. Confirmed live,
19 September 2026: navigating to `https://dev.matanho.com/performance-v22` **redirects to
`/performance`**, which renders the real V22 Command Centre (tab title "Matanho Performance Management
V7 Enterprise" — yes, "V7", a further versioning inconsistency in the vendored branding itself, not
investigated further) with what looks like genuine live/backend-driven empty states ("No month-by-month
performance history is recorded yet"), not the client's own canned mock fixtures.

**So:** `/performance` is the real, current, canonical URL for the V22 experience — exactly the same
migration shape as Procurement (`/procurement` now V23, `/procurement-legacy` frozen,
`/procurement-v23` redirects) and Portfolio (`/portfolio` now V11). **This is very likely NOT itself a
bug** — it's the same intentional short-URL promotion pattern used everywhere else in this codebase —
but it means:

1. **`lib/config/modules.ts`'s `performance-v22` entry's own path fields are stale** (still say
   `/performance-v22/...` instead of `/performance/...`), exactly the same class of bug already found
   and fixed for Portfolio (`FINDING-PV11`: `portfolio-v11`'s config still said `/portfolio-v11` after
   the real rename to `/portfolio`; `getModuleByPath()` resolved to the wrong, superseded entry as a
   result). **Not yet confirmed** whether the same live-impact exists here (wrong nav highlighting,
   wrong module color/breadcrumb) — first thing to check in Phase 2-equivalent work, mirroring exactly
   how the Portfolio fix was diagnosed and fixed.
2. Before touching anything, grep every `getModuleByPath` / `MODULE_CONFIG.find` call site to know the
   real blast radius, same as the Portfolio fix did.
3. Do **not** assume `/performance-v22` should keep working as a real route — first confirm with the
   user or by re-reading design-refs whether the redirect-to-`/performance` is the intended end state
   (matching the Procurement/Portfolio pattern) before "fixing" it in a way that undoes an intentional
   migration.

## 3. Known static analysis to build on (written without live verification — treat as a starting map, not ground truth)

- `design-refs/performance-module-current-state.md` (22 Jul 2026) — describes the **OLD**
  `performance-management` module before the V22 replacement. Route/API/Redux contract map for that
  older build; useful for understanding what existed before, not what's live now.
- `design-refs/performance-module-audit-brief.md`, `performance-functional-requirements.md`,
  `performance-role-matrix.md`, `performance-followup-ui-index.md`, `performance-ui-mock-deviations.md`,
  `performance-ui-polish-handoff.md` — assorted static audits/requirements docs, vintage and live-ness
  not yet checked.
- `design-refs/performance-v22-ui-handoff.md` (28 Aug 2026) — the V22 integration handoff. States "Mode:
  Interactive mock (Mode A runtime host) — no live API" and "backend bridge hydration is off
  (`enableBackendHydration: false`)" **at the time of that handoff**. Contradicted by what's live today
  (19 Sep) showing real empty-state language rather than mock fixtures — something changed the hydration
  story between 28 Aug and now. Confirm the actual current wiring live rather than trusting either doc.
- `design-refs/performance-v22-design-update-20260828.md`, `performance-v24-5-reference.md` — further
  static design docs, not yet cross-checked against live state.
- `fix/performance-v22-ui-parity` (already merged to `dev`) — prior UI-parity fix, already landed, not
  itself a source of new findings but confirms this module has had at least one live-testing pass
  already before this full-sweep addition.

## 4. Suggested first steps (mirroring how Investee Portal's Phase 6→7 handoff was structured)

1. **Module-resolution check** (see §2): grep `getModuleByPath`/`MODULE_CONFIG.find` call sites, confirm
   whether `performance-v22`'s stale path config actually causes wrong nav/breadcrumb/color anywhere
   live, fix if so (same diff shape as the Portfolio fix, if it applies here too).
2. **Runtime safety-net check**: is `/performance` a vendored "-mock" runtime.js host (matching
   Portfolio/Investee's Mode A pattern) or a plain React module? If vendored, confirm whether a
   patch-script safety net (`scripts/patch-performance-runtime.mjs`? — a file of that name already
   exists per an earlier `git status` untracked-files list this session, worth checking what it is
   before assuming none exists) already protects hand-built live-data wiring the way Portfolio's and
   Investee's do, before doing any extraction/regeneration.
3. **Live testing** proper: Dashboard/Command Centre, Company Strategy, Scorecards (Org/Department/
   Board/CEO/User), Goals & KPIs, Tasks & Projects, Performance Reviews, Corrective Actions, Reports &
   Compliance, Document Vault, Alerts & Audit, Access & Settings, Departments, Integrations, KPI
   Analytics, Timesheets — same live-browser-testing standard as every other module in this sweep, not
   a re-read of the static docs above.
4. Log every defect into `TEST_FINDINGS.md` (this directory) in the same format used by
   `investee-portal-v8/TEST_FINDINGS.md` before writing any fix. Checkpoint with the user before
   starting fixes, same convention as every other module in this sweep.

## 5. Where this fits in the overall sweep

See `design-refs/FULL_SWEEP_2026-09_OVERVIEW.md` — Performance was added as a fourth module on 19
September 2026, after Portfolio (done) and mid-way through Investee Portal (Phase 7 in progress). No
hard ordering dependency identified yet between Performance and the other three (Performance doesn't
obviously feed or depend on Portfolio/Investee/LP's capital-call/drawdown flows the way LP Portal
depends on Portfolio) — can run as an independent workstream.
