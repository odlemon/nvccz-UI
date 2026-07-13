# FP&A Annual Budgeting — Backend gaps

**Updated:** 2026-07-12 (post backend SRD gap response)  
**Canonical API:** `/v1/fpa/budget-cycles` + `/models/{id}/grid?cycleId=` — **not** `/planning-cycles`  
**Smoke:** `admin@nts.com` · API `http://31.220.82.129:3009/api` · model `cmrgm59xg00i3kt4malx3fx46` (`dd`)  
**FE wiring:** Create stepper, owner workspace, worksheet (updatedCells / conflict / bulk / trace), review workspace, request-reopen — see [fpa-budgeting-owner-workspace-api.md](./fpa-budgeting-owner-workspace-api.md)

**Migrate (backend):** `npm run db:migrate:fpa-budget-srd-gaps` · `npx prisma generate`

---

## Shipped (backend 2026-07-12) — FE wired

| Gap | Status |
|-----|--------|
| P0.1 Model PUT scope/COA | Shipped — GET round-trips `entityIds` / `departmentIds` / `accountIds` |
| P0.2 Create fields | Shipped — `workflowTemplateId`, owner `dueDate` / `baselineMethod` / `categories`, `VERSION_NOT_READY` |
| P0.3 Validate-setup | Shipped — full list; stronger `DRIVER_RATE_MISSING`; model merge → `COA_MISSING` / `SCOPE_MISSING` |
| P0.4 Open side-effects | Shipped — `actualsRowCount` + `actualsLoadReason`; baseline by method; owners notified |
| P0.5–8 Grid / cells | Shipped — dept scope enforced; `CELL_NOT_EDITABLE`; `LOCKED_VERSION`; 409 payload; `updatedCells`; submit gates |
| P0.9 Baseline methods | Shipped — cycle + owner methods; register method / prior / current / changePct |
| P1 Review workspace | Shipped — `GET …/review-workspace` |
| P1 Reopen | Shipped — `POST /versions/{id}/request-reopen` → new DRAFT copy |
| P1 Board pack | Shipped — failures → `BOARD_PACK_FAILED` |
| P2 Trace | Shipped — `GET …/cells/{cellId}/trace` |
| P2 Bulk ops | Shipped — `POST …/cells/bulk-operation` |

---

## Still deferred (do not invent on FE)

| Item | Notes |
|------|--------|
| Async `calculate` job queue | `POST …/calculate` + job polling |
| Cycle-scoped driver submit/approve | Beyond existing driver APIs |
| Per-line-item baseline override | Beyond owner/cycle method fields |

---

## FE contact

- Client: `lib/api/fpa-api.ts`
- UI: `components/fpa/fpa-budget-cycles.tsx`, `components/fpa/fpa-worksheet.tsx`
- Manual test: [fpa-budgeting-manual-test-guide.md](./fpa-budgeting-manual-test-guide.md)
