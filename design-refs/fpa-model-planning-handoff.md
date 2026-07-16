# Handoff — FP&A Model Planning (FE) + backend API asks

**For:** next coding agent picking up this work  
**Date:** 2026-07-14 (updated 2026-07-15 with full Planning+Builder SRD)  
**Repo:** `nvccz-new` (Next.js App Router FE)  
**Owner context:** Frontend wired Model Planning / Scenarios to live APIs and wrote a backend contract MD for BE to implement.

**Canonical product SRD (Builder + Planning together):**  
- [`fpa-model-planning-builder-srd.md`](./fpa-model-planning-builder-srd.md) — full Version 1.0  
- [`fpa-model-planning-builder-frontend.md`](./fpa-model-planning-builder-frontend.md) — **what the frontend must implement**

**How to log in & drive the UI in a browser:** see [`fpa-browser-login-playbook.md`](./fpa-browser-login-playbook.md).

---

## What we were working on

**Product area:** FP&A **Model Planning**

| UI | Route |
|----|--------|
| Planning workspace (grid + chrome) | `/forecasting/models/[id]/worksheet` |
| Scenario Comparison mode (same page) | `…/worksheet?view=compare` |
| Standalone Scenarios page | `/forecasting/scenarios` |

**Goal:** Stop treating planning/compare as hardcoded SRD mocks. Define exact backend contracts, then wire FE so every action hits the API. Where BE is still thin, show empty states + `logFpaGap` — **not** fake numbers presented as live.

Related earlier work (same FP&A module, already shipped earlier in the same epic): auth loading fixes, BigInt toast, reports/settings/assumptions, thinner KPI sparklines.

---

## Where we left off

### Done (frontend)

1. **Backend requirements MD (give this to backend)**  
   [`design-refs/fpa-model-planning-api-requirements.md`](./fpa-model-planning-api-requirements.md)  
   Full endpoint list, request/response bodies, priorities (P0 compare matrix + scenario CRUD + drivers; P1 waterfall/sensitivity + `planning-summary`).

2. **API client updated** — [`lib/api/fpa-api.ts`](../lib/api/fpa-api.ts)  
   - Enriched `compareScenarios` types (`FpaScenarioCompareResult`, etc.)  
   - `bulkUpdateDrivers`  
   - `getPlanningSummary`

3. **Compare mapper** — [`lib/fpa/scenario-compare.ts`](../lib/fpa/scenario-compare.ts)

4. **In-worksheet compare** — [`components/fpa/planning/planning-scenario-compare-view.tsx`](../components/fpa/planning/planning-scenario-compare-view.tsx)  
   Multi-scenario compare, assumptions save via drivers/bulk, waterfall/sensitivity from API.

5. **Chrome** — [`components/fpa/planning/planning-workspace-chrome.tsx`](../components/fpa/planning/planning-workspace-chrome.tsx)  
   No `__demo__` scenario tabs when API returns scenarios; no demo KPI/driver/trend injection as primary.

6. **Standalone Scenarios** — [`components/fpa/fpa-scenario-comparison.tsx`](../components/fpa/fpa-scenario-comparison.tsx)  
   Live list + `compareScenarios` + create / copy / promote.

7. **Worksheet shell** — [`components/fpa/fpa-worksheet.tsx`](../components/fpa/fpa-worksheet.tsx)  
   Loads `getPlanningSummary` for KPIs/trend/workflow; refresh re-bootstrap + drivers + summary.

**Orphan / out of scope:** [`planning-workspace-board.tsx`](../components/fpa/planning/planning-workspace-board.tsx) — old hardcoded SRD mock, **not wired to any route**. Ignore unless asked.

### Not done / blocked on backend

Backend must implement (or finish) shapes in the requirements MD. Until then FE will look “empty” on compare waterfall/sensitivity and planning-summary KPIs may fall back to home dashboard.

**Smoke / verify when BE is ready:**

- [ ] `POST /v1/fpa/scenarios/{anchor}/compare` with `scenarioIds[]` returns enriched `metrics` / `assumptions` / optional `waterfall` / `sensitivity`
- [ ] `PUT /v1/fpa/models/{id}/drivers/bulk` (or per-driver PUT)
- [ ] `POST /scenarios`, `…/copy`, `…/promote`
- [ ] `GET /v1/fpa/models/{id}/planning-summary?versionId=&scenarioId=`
- Manual: Planning grid → switch scenario → Compare multi-select → edit assumptions → Scenarios page Duplicate/Promote/Create

### Suggested next agent tasks

1. Hand MD to backend; track gaps vs [`fpa-api-frontend-feedback.md`](./fpa-api-frontend-feedback.md) §5.  
2. When BE returns enriched compare: QA both Compare UIs; fix any contract mismatches (decimals as strings, nested `scenario` on promote, etc.).  
3. If `planning-summary` 404s forever, either keep dashboard fallback or deprecate the call.  
4. Do **not** reintroduce mock/SRD primary data for live mode.  
5. Optional cleanup: delete unused `DEMO_*` constants in chrome once unused.

---

## Env / URIs / credentials (no new globals needed from this pass)

**No new env vars or credentials were introduced** for Model Planning. FE keeps using existing API base + auth cookie/JWT.

| Item | Value / note |
|------|----------------|
| Env var | `NEXT_PUBLIC_API_BASE_URL` → typically `http://31.220.82.129:3009/api` |
| FP&A API prefix | `{BASE}/v1/fpa/...` |
| Local FE | `npm run dev` → `http://localhost:3000` |
| App login (smoke) | `admin@nts.com` / `admin123` (from budgeting test docs) |
| Sample UAT model (older feedback) | e.g. `cmrgagtqn0003kt4m1ykg39vb` — confirm against current `GET /v1/fpa/models` |
| Related docs | [`fpa-api-frontend-feedback.md`](./fpa-api-frontend-feedback.md), [`fpa-budgeting-manual-test-guide.md`](./fpa-budgeting-manual-test-guide.md) |

`.env.local` is **not** in the repo (gitignored). Use whatever is already on the machine for `NEXT_PUBLIC_API_BASE_URL`. Do not commit secrets.

**SSH note (ops, not FE):** SSH to `root@31.220.82.129` previously failed mid-key-exchange (`Connection closed by … port 22`) while port 22 was open — server-side sshd issue; use provider console if needed. FE only needs HTTP `:3009`.

**API client defaults:** [`lib/api/api-client.ts`](../lib/api/api-client.ts) falls back to `http://31.220.82.129:3009/api` if env unset.

---

## Key file map

```
design-refs/fpa-model-planning-api-requirements.md   ← give to backend
design-refs/fpa-api-frontend-feedback.md             ← prior FE/BE status
lib/api/fpa-api.ts                                   ← typed client
lib/fpa/scenario-compare.ts                          ← compare mapping
lib/fpa/fpa-api-gaps.ts                              ← gap logger
components/fpa/fpa-worksheet.tsx                     ← planning shell
components/fpa/planning/planning-workspace-chrome.tsx
components/fpa/planning/planning-scenario-compare-view.tsx
components/fpa/fpa-scenario-comparison.tsx           ← /forecasting/scenarios
lib/store/slices/fpaSlice.ts                         ← model/version/scenario selection
```

Nav: Model Planning → `/forecasting/models` · Scenarios → `/forecasting/scenarios` ([`lib/config/modules.ts`](../lib/config/modules.ts)).

---

## Design / product constraints

- Buttons: **pill** `rounded-full` (workspace rule `arcus-button-styles`).  
- Prefer shared `Button` / existing Arcus patterns.  
- FP&A money/driver values may arrive as **strings** — use `asNumber()` / `formatMoney()`.

---

## One-paragraph prompt you can paste to the next agent

> Continue FP&A **Model Planning** FE in `nvccz-new`. We wrote [`design-refs/fpa-model-planning-api-requirements.md`](./fpa-model-planning-api-requirements.md) for backend and wired Planning worksheet + `?view=compare` + `/forecasting/scenarios` to `fpaApi` (enriched compare, create/copy/promote, drivers bulk, `getPlanningSummary`). No new credentials — use `NEXT_PUBLIC_API_BASE_URL` (`http://31.220.82.129:3009/api`) and smoke login `admin@nts.com` / `admin123`. **Left off:** waiting on backend to fulfill the MD (especially multi-scenario compare + planning-summary); FE shows empty/gap-log instead of mocks. Next: QA against live BE, fix contract mismatches, keep demo data out of live paths. Start from the requirements MD and the files listed in this handoff.

---

*End of handoff.*
