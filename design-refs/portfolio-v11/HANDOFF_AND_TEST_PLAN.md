# Portfolio V11 — handoff and full-sweep test plan

**For:** the next agent picking this up cold · **Goal:** Portfolio module (staff-facing) demo-ready,
same standard as Procurement V23's completed sweep · **Handoff date:** 15 September 2026

---

## 1. What this is

Arcus / Matanho platform. Portfolio ("client-faithful port," internal id `portfolio-v11`, client package
version V25) is a vendored runtime script rendered inside a Next.js host, with live data and write
actions wired to the backend. Real route is `/portfolio` (renamed from `/portfolio-v11`, 308-redirected
in `middleware.ts`); the module id/folder naming stayed `portfolio-v11` throughout.

| | Path | Notes |
|---|---|---|
| Frontend repo | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 · GitHub `odlemon/nvccz-UI` · default branch **`dev`** |
| API repo | `C:\Users\lysp\Downloads\nvccz` | Express + Prisma + MySQL · GitHub `odlemon/nvccz` · default **`master`**, also **`prod`** |
| Working branch (frontend) | `feature/portfolio-v11-live`, cut from `dev` at `c3422c1` | |
| Working branch (backend) | not yet created — cut only if a genuine backend change is needed | |
| Superseded, do not confuse | module id `portfolio-management` (hidden, `path: /portfolio`) — currently wins module-resolution for real `/portfolio/*` routes due to a stale path in `portfolio-v11`'s own modules.ts entry (Phase 2 fix) | |

**Frontend key files**
- `components/portfolio-v11-mock/matanho-portfolio-runtime.js` — vendored runtime. **Generated — never hand-edit directly.**
- `scripts/extract-portfolio-v25.mjs` — regenerates the runtime; self-invokes the patch script below.
- `scripts/patch-portfolio-runtime.mjs` + `scripts/portfolio-runtime-live-bridge.inc.js` — idempotent live-data patch, re-applied after every extraction.
- `components/portfolio-v11-mock/portfolio-v11-app.tsx` — host; owns page-scoped live-data loading, listens for `matanho:before-action`.
- `lib/portfolio-v11/actions.ts` — `handlePortfolioV11Action()`, ~50 handled action ids.
- `lib/portfolio-v11/bootstrap.ts` — `scopesForPage()` / `loadPortfolioV11Scopes()`, the progressive-load engine (governed by `.cursor/rules/portfolio-progressive-loads.mdc`).
- `lib/portfolio-v11/adapters.ts` — API → view-model shapes, incl. `STAGE_MAP` (Phase 3/4 fix target).
- `lib/config/modules.ts` — `portfolio-v11` module entry (Phase 2 fix target).
- `middleware.ts` — `STAFF_PUBLIC_PASS_THROUGH` (`/portfolio` entry, Phase 4 fix target), `routePermissions` (keys Portfolio to literal `'portfolio'`).
- `lib/portal/config.ts` — `STAFF_PUBLIC_PASS_THROUGH` array itself.
- `design-refs/portfolio-investee-gap-analysis-and-plan.md` — the Sept 2026 static gap-analysis this sweep is live-verifying. Explicitly says it was written without the dev server running.
- `design-refs/FULL_SWEEP_2026-09_OVERVIEW.md` — cross-module index (this sweep + Investee Portal + LP Portal re-sweep).

**Test personas** (all confirmed live 15 Sep 2026 against `dev-api.matanho.com`):

| Account | Password | Portal | Role |
|---|---|---|---|
| `admin@nts.com` | `admin123` | staff | god-mode — bypasses all RBAC, not useful for real permission testing |
| `investee.test@arcus.co.zw` | `admin123` | investee | applicant — **note: `design-refs/portal-test-credentials.md` documents `PortalTest!2026` for this account; that's stale, `admin123` is what actually works** |
| `lp.test@arcus.co.zw` | `admin123` | lp | MANAGER — same stale-password correction as above |
| `lp.signatory@example.com` | `Password123!` | lp | SIGNATORY |
| `lp.viewer@example.com` | `Password123!` | lp | VIEWER |

`PORTFOLIO_MGR` / `INV_ANALYST` roleCodes exist in `lib/config/role-permissions.ts` — seeded in Phase 2:

| Account | Password | Role |
|---|---|---|
| `portfolio.mgr@nts.local` | `$xW8y1Zf3D8w` | PORTFOLIO_MGR (full access) |
| `inv.analyst@nts.local` | `Y7Fs9JdS*2MG` | INV_ANALYST (write access) |

---

## 2. Where everything stands

| Phase | Status |
|---|---|
| 0 — Setup & preflight | **Done** — branch cut from `dev` @ `c3422c1`, docs scaffolded, FINDING-003's backend fix confirmed present and wired (`isExternalPortalUser`/`requireInternalStaffUser` gate `GET/POST /users`), `financial_reports`/`reporting_notification_logs` tables confirmed present on `arcus_dev`, all 5 personas confirmed logging in |
| 1 — Security gate (FINDING-003) | **Done** — re-verified live, both layers hold, no regression across investee/LP/applicant role types. Detail in `design-refs/uat-three-module/TEST_FINDINGS.md`'s FINDING-003 |
| 2 — Foundation (module fix, permission alias, personas) | **Done** — `modules.ts` path fixed and deployed to dev (`64e7e8e`); verified live via the App Switcher (Portfolio Management tile now correctly highlighted as active — that list excludes superseded modules, so this proves `getModuleByPath` resolves to `portfolio-v11`, not `portfolio-management`). `portfolio` → `portfolio-management` alias added to `MODULE_ID_ALIASES` (groundwork for Phase 4; `STAFF_PUBLIC_PASS_THROUGH` not touched yet). Seeded `portfolio.mgr@nts.local` (PORTFOLIO_MGR) and `inv.analyst@nts.local` (INV_ANALYST), both confirmed logging in and reaching `/portfolio` with real live data. |
| 3 — Live testing | **Done** — 11 findings logged (FINDING-PV11-001 through -011), see `TEST_FINDINGS.md`. Summary: Wave 1 (capital calls/LP onboarding/distributions) — 3 findings, one a missing feature (distributions, decided: build in Phase 4). Wave 2 (deal lifecycle) — 3 findings: term-sheet/implementation-initiate blocked by the same legacy-`authorize()` bug as -001 (now checked repo-wide), board-review creation broken by a multipart Content-Type bug that also desyncs the deal's stage, and a hero-status-vs-list-stage display divergence traced to stale seed/demo disbursement records. Wave 3 (RBAC/remaining) — 2 findings: Dashboard's and Deal Flow's filter bars are mostly decorative (confirmed: geography, currency, stage, owner, age all no-op; Funds page's equivalent filters work correctly, proving the fix pattern already exists in the same file), and Period Close's two primary buttons (pre-check, request approval) silently no-op for a related but distinct reason (missing dataset field, not the no-op dispatcher case). Confirmed *not* regressed / working as intended: STAGE_MAP fallback (already fixed pre-session), IRR/DPI/TVPI legitimate zeros with an existing backend-ask (T2.6) already tracking real computation, `start-implementation`'s precondition validation, e-signatures (no crash), Settings' tabs and Report Builder (still correctly out of scope, loading cleanly). `v11IsFullAuthority`'s hardcoded role list turned out to be a disconnected demo-only toggle, not a real blocker (FINDING-PV11-009). `start-due-diligence` couldn't be live-exercised (no pre-DD fixture deal exists) — documented as a coverage gap, not skipped silently. |
| 4 — Fixes by severity | **In progress** — 5 of 7 HIGH findings fixed, deployed to dev and live-verified: PV11-004 (LP onboarding — root cause was actually `portfolio-runtime-live-bridge.inc.js` shadowing the first fix attempt, see the finding's correction note), PV11-007 (backend `authorize()` gap, repo-wide), PV11-008 (board-review multipart bug), PV11-010 (Deal Flow's filters — Dashboard's half still needs `renderDashboard` wiring), PV11-011 (Period Close's dead buttons). Remaining: PV11-005 (build the distribution-creation UI — the big one), PV11-002 and PV11-006 (both MEDIUM, not started), PV11-009 (no code fix — flagged for a product decision, not this pass). **Important discovery for whoever picks up PV11-002/-005/-006 next:** `portfolio-runtime-live-bridge.inc.js` independently overrides several base runtime functions for the live-data path (confirmed for `submitLP`, `submitCapitalCall`) — check this file first before assuming a fix to the base `matanho-portfolio-runtime.js` function actually executes; it may be silently shadowed exactly like PV11-004's first attempt was. |
| 5 — Merge & deploy | Not started |

See `TEST_FINDINGS.md` for the running defect log.
