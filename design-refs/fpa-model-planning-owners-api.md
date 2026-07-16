# FE handoff — Model Planning owners / scoped grid / slice submit

**Date:** 2026-07-16  
**BE status:** Shipped + UAT **23/23** green against client-demo DB (`nts`)  
**FE status:** Wired to MPC-native owner-workspace, scoped grid, task slice submit, error toasts  
**Do not use:** `GET /budget-cycles/{id}/owner-workspace` for Model Planning cycle ids — that entity is different. (FE only falls back for legacy budget-cycle worksheet links.)

---

## What FE consumes

| Capability | BE | FE |
|------------|----|----|
| Persist `owners[]` on create (≥1 required) | `400 NO_OWNERS` if missing | Create modal always sends `owners[]` |
| Enrich on get / list / workspace | names + `taskId` + `status` + `dueDate` | Mapped into worksheet View by / submit |
| `PUT …/owners` after create | Yes | `fpaApi.assignModelPlanningOwners` |
| `GET …/owner-workspace` (MPC-native) | Yes | Preferred path in worksheet |
| Grid `assignedDepartmentIds` + cell `departmentId` | Yes | `null` = no FE lock; array = owner lock |
| Write guard `DEPARTMENT_SCOPE_LOCKED` | Yes | Toast on cell / bulk update |
| Slice submit via `POST /tasks/{taskId}/submit` | **Only** path | Submit banner → `submitTask` |
| Seed dept INPUT cells on owner assign | Yes | Grid after create |
| Toast codes listed below | Yes | Create + save + submit |

---

## API contract

### Create

`POST /api/v1/fpa/model-planning/cycles` — body includes `owners: [{ departmentId, assigneeId, dueDate? }]`.

Response / get / list / workspace include enriched `owners[]` with `taskId`, `status`, names.

Submit-eligible owner statuses: `OPEN` | `IN_PROGRESS` | `RETURNED` | legacy `PENDING`.

### Owner workspace

`GET /api/v1/fpa/model-planning/cycles/{id}/owner-workspace`

```json
{
  "cycle": { "id": "…", "status": "DRAFT", "cycle_name": "…" },
  "owners": [],
  "myOwner": { "departmentId": "…", "taskId": "…", "status": "OPEN" },
  "canSubmit": true,
  "unmetRequirements": [],
  "assignedDepartmentIds": ["dept_…"],
  "readOnly": false
}
```

### Grid

`GET …/grid?cycleId={mpcId}&versionId=&scenarioId=&departmentId=`

| Field | Owner | FP&A / full-edit |
|-------|-------|------------------|
| `assignedDepartmentIds` | Their dept id(s) | `null` / omit → no FE lock |
| Cells | Own dept + company (`departmentId: null`, not editable) | All depts |

Cell writes **must** pass `cycleId`.

### Slice submit

`POST /api/v1/fpa/tasks/{taskId}/submit` — that department only. Cycle → `IN_REVIEW` when **all** owners submitted.

---

## Error codes

| Code | HTTP | FE toast |
|------|------|----------|
| `NO_OWNERS` | 400 | Create |
| `UNKNOWN_DEPARTMENT` | 400 | Create |
| `UNKNOWN_ASSIGNEE` | 400 | Create |
| `SOURCE_VERSION_NOT_PUBLISHED` | 400 | Create |
| `ACTUAL_PERIOD_LOCKED` | 403 | Cell / bulk |
| `DEPARTMENT_SCOPE_LOCKED` | 403 | Cell / bulk |
| `OWNER_SUBMIT_BLOCKED` | 403 | Submit banner |
| `LOCKED_VERSION` | 403 | Cell (remind `cycleId`) |

---

## FE files

| File | Role |
|------|------|
| `components/fpa/fpa-model-planning-cycle-create-modal.tsx` | Sends `owners[]`; create error toasts |
| `components/fpa/fpa-worksheet.tsx` | MPC owner-workspace; View by `departmentId`; scoped edit; Submit → `submitTask` |
| `lib/api/fpa-api.ts` | Types + `getModelPlanningOwnerWorkspace` / `assignModelPlanningOwners` |
| `lib/hooks/useFpaPermissions.ts` | `canEditAllDepartments` |

---

## Verify (client demo nts)

| Field | Value |
|-------|--------|
| Email | `ada.owner@nts.com` |
| Password | `OwnerDemo123!` |
| Role | `BUDGET_OWNER` |
| Finance dept | `cmh3bbvoh0000uncw5qn5f71g` |
| Sales dept | `cmh3bbxch0001uncwz6g2vihv` |

1. Admin: create MPC Finance→Ada + Sales→anyone; confirm `owners[].taskId`.  
2. Ada: worksheet `cycleId` → View by Finance; edit Finance INPUT only.  
3. Write company / other dept → `DEPARTMENT_SCOPE_LOCKED`.  
4. Submit my plan → Finance submitted; Sales still open.  
5. FP&A: unrestricted grid; View by still works.

```bash
npm run uat:fpa:model-planning-cycle
```

---

## Policy (do not invent)

1. Task submit only — no `submit-slice`.  
2. Cycle consolidates after **all** owner slices, not the first.  
3. Company rollups: read-only for owners.  
4. Published models: cell writes need `cycleId` while MPC is open for input.
