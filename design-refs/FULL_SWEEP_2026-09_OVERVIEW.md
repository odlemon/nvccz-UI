# Full Sweep 2026-09 — Portfolio + Investee Portal + LP Portal + Performance

Cross-module index for the whole-system full-sweep engagement, following the same method as the
completed Procurement V23 sweep: live browser testing, real bugs root-caused and fixed by severity,
every fix verified live, deployed to dev then production, merged to trunk. Originally scoped to the
fund/investor-side (Portfolio, Investee Portal, LP Portal); Performance was added on 19 September 2026
at the user's explicit request to cover "the whole system."

## Modules

| Module | Branch | Docs | Status |
|---|---|---|---|
| Portfolio (staff) | `feature/portfolio-v11-live` | [`portfolio-v11/HANDOFF_AND_TEST_PLAN.md`](./portfolio-v11/HANDOFF_AND_TEST_PLAN.md), [`portfolio-v11/TEST_FINDINGS.md`](./portfolio-v11/TEST_FINDINGS.md) | **Done** (Phases 0-5) — merged to `dev`/`master`/`prod`, deployed to production, verified live |
| Investee Portal (founder) | `feature/investee-portal-v8-live` | [`investee-portal-v8/HANDOFF_AND_TEST_PLAN.md`](./investee-portal-v8/HANDOFF_AND_TEST_PLAN.md), [`investee-portal-v8/TEST_FINDINGS.md`](./investee-portal-v8/TEST_FINDINGS.md) | **In progress** — Phase 6 (runtime patch-script safety net) done; Phase 7 (live testing) underway: Term Sheet/Signatures/KPI Centre/Reporting Centre covered so far, 2 real bugs found and fixed live (FINDING-IP8-001 signature status stuck, FINDING-IP8-002 `[object Object]` KPI values), 1 open and unresolved (FINDING-IP8-003, two unexplained 400s on Reporting Centre, root cause not found). Deployed to dev `ui-investee`; not yet merged to `dev`/`master`/prod. Financial Reporting, Settings, the `application-portal` redirect audit, and the fixture/inert-screen check are still outstanding. |
| LP Portal (LP, full re-sweep) | `feature/lp-portal-resweep-live` | `lp-portal-resweep/HANDOFF_AND_TEST_PLAN.md`, `lp-portal-resweep/TEST_FINDINGS.md` — baseline: [`lp-portal-test-plan.md`](./lp-portal-test-plan.md) (9 Sep 2026, "done to the standard asked") | Not started |
| Performance (staff) | `feature/performance-v22-live` | [`performance-v22/HANDOFF_AND_TEST_PLAN.md`](./performance-v22/HANDOFF_AND_TEST_PLAN.md), `performance-v22/TEST_FINDINGS.md` (not yet created) | **Phase 0 only** — rescued an orphaned, uncommitted runtime patch script (`scripts/patch-performance-runtime.mjs`, 304 hunks, confirmed it's the real source of the currently-live runtime) and wired both extract scripts to self-invoke it; merged straight to `dev` given the real data-loss risk it closed, ahead of the rest of this module's sweep. Live testing not yet started. Also flagged: a module-identity/routing question (`performance-v22`'s own config still says `/performance-v22`, but the live, canonical URL is `/performance` — needs the same live-impact check already done for Portfolio's equivalent bug before deciding whether to fix it or leave it, see the handoff doc). |

## Why this order

FINDING-003 (investee → staff privilege escalation, [`uat-three-module/TEST_FINDINGS.md`](./uat-three-module/TEST_FINDINGS.md)) is re-verified first, ahead of all four modules' own work — no persona's test activity on a shared dev environment is trustworthy until it's confirmed closed. **Already done**, 15 September 2026, as Phase 1 of this engagement. Portfolio goes before LP Portal's cross-module re-test because LP Portal's capital-call/distribution flow originates in Portfolio; re-testing it before Portfolio's own fixes land would just mean testing it twice. Investee Portal and Performance are both independent of the other three and can run as parallel workstreams.

## Cross-module backend-asks (consolidated at close-out)

*Populated in Phase 13 from all three modules' individual findings.*

## Known pre-existing docs this sweep builds on

- `portfolio-investee-gap-analysis-and-plan.md` — Sept 2026 static gap-analysis (Portfolio + Investee + fund/LP-capital), written without the dev server running — this sweep is the live-verification pass it recommends.
- `investee-portal-v8-backend-asks.md` — Document Vault + Messages, confirmed no backend exists, do not build FE stubs.
- `portfolio-funds-capital-backend-asks.md`, `portfolio-staff-phase02-backend-asks.md`, `portfolio-v23-backend-asks.md` — prior Portfolio backend-ask trackers.
- `lp-portal-test-plan.md`, `lp-portal-backend-asks.md` — LP Portal's completed sweep and its still-open items (2 accounting-policy questions, several unexercised guardrails/QA scenarios).
