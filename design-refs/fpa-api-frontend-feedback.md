# FP&A API — Frontend integration feedback

Date: 2026-07-12  
Frontend base: `NEXT_PUBLIC_API_BASE_URL` → `/v1/fpa/*` and `/forecast-entities/*`  
Smoke identity: `admin@nts.com` against `http://31.220.82.129:3009/api`  
Sample model: `cmrgagtqn0003kt4m1ykg39vb` (UAT FPA Model)

Backend response (2026-07-12) incorporated below. The UI wires shipped endpoints; remaining gaps are the “still thin” domain surfaces.

---

## 1. Broken / failing endpoints — backend status (2026-07-12)

| Method | Path | Backend status | Frontend wiring |
|--------|------|----------------|-----------------|
| `PUT` | `/v1/fpa/drivers/{id}` | **Exists** | Assumptions drawer uses `updateDriver` |
| `POST` | `/models/{id}/cells/update` | **403** when locked — **expected** | Toast; no change |
| `POST` | `/models/{id}/cells/update` | Empty DRAFT **fixed** (coordinate upsert); prefer `POST /versions/{id}/seed-cells` | Client has `seedVersionCells` |
| Spread / copy-forward | locked → **403** — **expected** | Toast |
| `POST` | `/scenarios/{id}/promote` | **Exists** | Scenarios “Promote to Forecast” live |
| `POST` | `/tasks/{id}/reassign` | **Exists** (+ notify/email) | Workflow drawer reassign + user id |
| `GET` | `/exports/{id}/download` | **Exists**; job also returns `downloadUrl` | Reports + worksheet via `resolveExportDownloadUrl` |
| `GET` | `/workflows` | **Exists** (`?modelId=&status=`) | Client `listWorkflows` supports `status` |

Happy-path smoke (200/201): models list/get, dashboard, line-items, drivers list/create/update, grid, scenarios list/compare/promote, my-tasks (filterable), variance, domain views, forecast-entities, formula validate, board-pack export + download, actuals sync, task submit/reassign.

---

## 2. Contract mismatches

| Topic | Observation | Frontend handling |
|-------|-------------|-------------------|
| Auth login token | Login returns top-level `token`, not `data.accessToken` | Existing auth client |
| Decimals | Cell / variance / driver `value` often strings | `asNumber()` / `formatMoney()` |
| Grid cell flags | Locked versions: `isEditable: false`, `isLocked: true` | UI respects lock; 403 on edit |
| `GET /tasks/my-tasks` | Now supports `?modelId=&versionId=` | Worksheet Submit binds via filtered my-tasks |
| Scenario compare body | `{ versionId, compareScenarioId }` | As documented |
| Export | `downloadUrl` on job + `GET /exports/{id}/download` | Prefer job URL, else download endpoint |
| Entities | Mix of `baseCurrency` / `base_currency` | Settings reads both |
| Variance % | `variancePercent` can be `null` | Treated as 0 |

---

## 3. Section 7 + extras — shipped this pass (wired in FE)

| Need | Endpoint / field | FE usage |
|------|------------------|----------|
| Period band | Grid `periods[].periodRole`, `cells[].periodRole`, `actualCutoff` | Worksheet ACTUALS/FORECAST bands |
| Owner display | Grid + home `ownerName` / `ownerAvatarUrl` | Worksheet header + model fallback |
| Cell comments | `GET/POST /models/{id}/cells/{cellId}/comments` | Add Comment + Cell Details count/list |
| Apply Growth | `POST /models/{id}/cells/apply-growth` | Toolbar popover (rate %) |
| Validation strip | `GET /models/{id}/grid/validations?versionId=` | Validation Messages card (falls back to model validate) |
| History authors | Cell history `userName` | Cell Details history |
| Home sparklines / cash | `kpis.sparklines`, `cashByMonth[]` | Home trend + cash bars when present |
| Over-budget owners | `departmentName`, `ownerName`, `ownerAvatarUrl` | Home over-budget table |
| Worksheet Submit binder | `GET /tasks/my-tasks?modelId=&versionId=` | Submit enabled from bound open task |

---

## 4. Annual budgeting cycle + owner workspace (wired 2026-07-12)

Staged create / owner sheet contract now wired in FE:

| Need | Endpoint / field | FE usage |
|------|------------------|----------|
| Create DRAFT | `POST /budget-cycles` (`openImmediately: false`) | Create stepper **Save draft** / first persist |
| Update setup | `PATCH /budget-cycles/{id}` | Re-save draft in create modal |
| Validate setup | `POST …/validate-setup` | Full `errors[]` in create modal + DRAFT detail actions |
| Open cycle | `POST …/open` | **Validate & open** + detail **Open cycle for input** |
| Owner chrome | `GET …/owner-workspace` | Cycle detail cards, planning areas, register, `canSubmit` / unmet |
| Scoped grid | `GET /models/{id}/grid?cycleId=` | Worksheet passes `cycleId`; shows `assignedDepartmentIds` |
| Cell status | `cells[].cellStatus` | Legend / details / editability (INPUT only) |
| Concurrency | `recordVersion` on update; **409 CONFLICT** | Update body + toast with currentValue / changedBy |
| Owner submit gates | `POST /tasks/{id}/submit` → `SUBMISSION_BLOCKED` | Full unmet list in owner bar + detail |
| Maker-checker | `fpa-accept` / `cfo-approve` → **403** `MAKER_CHECKER` | Toast messaging |

Still thin / not fully UI’d yet: formula trace via cell detail, bulk-operation menu (legacy spread/copy/growth still used with `cycleId`), compare UI after conflict beyond Reload.

---

## 5. Still thin (not blocking core path)

Backend notes these remain thin; FE keeps empty/partial states:

- Domain hire-plan / revenue waterfall / full cash statement rows  
- Scenario waterfall / sensitivity matrix  
- Variance commentary queue + department rollup  
- Settings sync-source / thresholds / workflow defaults  
- Optional: server `quarterTotals` / `fyTotal`; richer `unitLabel` / `displayScale` (FE still derives Q/FY client-side)

---

## 6. Expected behaviors (frontend assumptions)

1. **Lock:** After `POST /versions/{id}/lock`, cell update / spread / copy-forward / apply-growth return **403**.
2. **Submit / Return / Approve / Reassign:** Task transition endpoints live.
3. **Actuals import:** `POST /actuals/sync` may return `rowCount: 0` when no GL rows.
4. **Empty version:** Prefer `POST /versions/{id}/seed-cells` before grid edits on blank DRAFT.
5. **Bootstrap:** `GET /models` → `GET /models/{id}` → `defaultScenarioId` / `defaultVersionId`.
6. **Budget cycle open:** Create without `openImmediately` → `DRAFT`; `validate-setup` must pass before `open`; owners notified on open.

---

## 7. Frontend wiring summary

| Area | Status |
|------|--------|
| Typed client `lib/api/fpa-api.ts` | Includes drivers PUT, promote, seed-cells, apply-growth, cell comments, grid validations, export download, my-tasks filters, staged budget-cycle + owner-workspace |
| Worksheet | Design chrome + cycleId grid + cellStatus / recordVersion |
| Budgeting | Create stepper (DRAFT → validate → open) + owner workspace chrome |
| Drivers / Scenarios / Workflow / Reports / Home | Updated for shipped endpoints |
| Domain / Variance / Settings extras | Still partial per §5 |
| Gap logger | `lib/fpa/fpa-api-gaps.ts` |

UI mapping: [fpa-api-by-ui-section.md](./fpa-api-by-ui-section.md) · Contracts: [fpa-api-reference.md](./fpa-api-reference.md) (when present in repo).
