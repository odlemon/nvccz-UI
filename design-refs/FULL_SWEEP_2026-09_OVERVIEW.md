# Full Sweep 2026-09 — Portfolio + Investee Portal + LP Portal

Cross-module index for the fund/investor-side full-sweep engagement, following the same method as the
completed Procurement V23 sweep: live browser testing, real bugs root-caused and fixed by severity,
every fix verified live, deployed to dev then production, merged to trunk.

## Modules

| Module | Branch | Docs | Status |
|---|---|---|---|
| Portfolio (staff) | `feature/portfolio-v11-live` | [`portfolio-v11/HANDOFF_AND_TEST_PLAN.md`](./portfolio-v11/HANDOFF_AND_TEST_PLAN.md), [`portfolio-v11/TEST_FINDINGS.md`](./portfolio-v11/TEST_FINDINGS.md) | In progress |
| Investee Portal (founder) | `feature/investee-portal-v8-live` | `investee-portal-v8/HANDOFF_AND_TEST_PLAN.md`, `investee-portal-v8/TEST_FINDINGS.md` | Not started |
| LP Portal (LP, full re-sweep) | `feature/lp-portal-resweep-live` | `lp-portal-resweep/HANDOFF_AND_TEST_PLAN.md`, `lp-portal-resweep/TEST_FINDINGS.md` — baseline: [`lp-portal-test-plan.md`](./lp-portal-test-plan.md) (9 Sep 2026, "done to the standard asked") | Not started |

## Why this order

FINDING-003 (investee → staff privilege escalation, [`uat-three-module/TEST_FINDINGS.md`](./uat-three-module/TEST_FINDINGS.md)) is re-verified first, ahead of all three modules' own work — no persona's test activity on a shared dev environment is trustworthy until it's confirmed closed. Portfolio goes before LP Portal's cross-module re-test because LP Portal's capital-call/distribution flow originates in Portfolio; re-testing it before Portfolio's own fixes land would just mean testing it twice. Investee Portal is independent of both and could run in parallel with a second workstream.

## Cross-module backend-asks (consolidated at close-out)

*Populated in Phase 13 from all three modules' individual findings.*

## Known pre-existing docs this sweep builds on

- `portfolio-investee-gap-analysis-and-plan.md` — Sept 2026 static gap-analysis (Portfolio + Investee + fund/LP-capital), written without the dev server running — this sweep is the live-verification pass it recommends.
- `investee-portal-v8-backend-asks.md` — Document Vault + Messages, confirmed no backend exists, do not build FE stubs.
- `portfolio-funds-capital-backend-asks.md`, `portfolio-staff-phase02-backend-asks.md`, `portfolio-v23-backend-asks.md` — prior Portfolio backend-ask trackers.
- `lp-portal-test-plan.md`, `lp-portal-backend-asks.md` — LP Portal's completed sweep and its still-open items (2 accounting-policy questions, several unexercised guardrails/QA scenarios).
