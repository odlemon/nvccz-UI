# Backend asks — Model Planning optional tasks (Stage 2)

**Date:** 2026-07-16
**Backend status:** Delivered 2026-07-17
**FE status:** Assign Task UI shipped; approve/return and threaded collaboration wiring in progress
**Context:** SRD Stage 2 step 4 — *“Optionally assign tasks (e.g. Review Marketing Plan)”*
**Distinct from:** Department **owner slice** tasks created on cycle create (`owners[].taskId`) — those are submit-eligible dept plans, not ad-hoc review tasks.

---

## Product rules

| Task type | Created when | Example | Submit? |
|-----------|--------------|---------|---------|
| **Owner slice** | Cycle create (`owners[]`) | “Finance plan input” | Yes — `POST /tasks/{id}/submit` |
| **Planning task** (ad-hoc) | FP&A assigns on worksheet | “Review Marketing Plan” | Optional — checklist / complete, not necessarily dept submit |

FE shows both in the Tasks list. Owner slices are tagged **Dept plan**; ad-hoc tasks are normal planning tasks.

---

## Delivered MPC-native contracts

### 1. List cycle tasks (critical)

```http
GET /api/v1/fpa/model-planning/cycles/{cycleId}/tasks
```

Query (optional): `status`, `departmentId`, `assigneeId`, `priority`

**Response:** same shape as budget cycle tasks (`FpaCycleTask[]`):

```json
[
  {
    "id": "task_…",
    "title": "Review Marketing Plan",
    "status": "OPEN",
    "priority": "MEDIUM",
    "departmentId": "dept_…",
    "departmentName": "Marketing",
    "assigneeId": "user_…",
    "assigneeName": "Priya Nair",
    "dueDate": "2026-05-16",
    "modelId": "mdl_…",
    "versionId": "ver_…"
  }
]
```

**Must include:**

- Owner slice tasks (`owners[].taskId`) **and** ad-hoc tasks assigned via POST below  
- Enriched `departmentName` / `assigneeName`  
- Filter by `departmentId` when View by department is active (optional but useful)

**Why:** Worksheet right rail Tasks tab + lower Tasks card. Today FE falls back to `GET /budget-cycles/{id}/tasks` only for legacy budget cycles — **wrong entity for MPC ids**.

---

### 2. Create / assign planning task (critical)

```http
POST /api/v1/fpa/model-planning/cycles/{cycleId}/tasks
```

**Body (FE sends):**

```json
{
  "title": "Review Marketing Plan",
  "assigneeId": "user_…",
  "departmentId": "dept_…",
  "dueDate": "2026-05-16",
  "priority": "MEDIUM",
  "description": "Validate Q4 marketing opex assumptions",
  "modelId": "mdl_…",
  "versionId": "ver_…"
}
```

**Response:** `201` + created `FpaCycleTask` (with `id`, names enriched).

**Behaviour:**

- Notify assignee (in-app bell / email — same as budget owner assign)  
- Task is scoped to the **Model Planning cycle** (`cycleId`), not budget-cycle entity  
- `departmentId` must be a department on the cycle’s `owners[]` (or any dept in tenant — product choice; FE only offers cycle owner departments)  
- Validate `assigneeId` belongs to department when possible → `UNKNOWN_ASSIGNEE` / `UNKNOWN_DEPARTMENT` on 400  

**Permissions:** caller needs `fpa-assign-tasks` (FE gates with `canAssignTasks`).

---

### 3. Task complete / status update (nice-to-have for checkbox)

FE Tasks tab has a done checkbox (local today). Prefer:

```http
PATCH /api/v1/fpa/tasks/{taskId}
{ "status": "COMPLETED" }
```

Or dedicated:

```http
POST /api/v1/fpa/tasks/{taskId}/complete
```

**Do not** use complete for owner slice tasks that should go through **submit** workflow.

---

### 4. Cycle comments + activity for MPC (nice-to-have)

FE still calls budget-cycle comment/activity endpoints for MPC ids (they fail silently). Prefer MPC-native:

```http
GET  /api/v1/fpa/model-planning/cycles/{id}/comments
POST /api/v1/fpa/model-planning/cycles/{id}/comments
GET  /api/v1/fpa/model-planning/cycles/{id}/activity
```

Same shapes as budget cycle collab if possible.

---

## Error codes

| Code | HTTP | When |
|------|------|------|
| `UNKNOWN_DEPARTMENT` | 400 | Bad `departmentId` on create |
| `UNKNOWN_ASSIGNEE` | 400 | Bad `assigneeId` |
| `TASK_ASSIGN_FORBIDDEN` | 403 | Caller lacks assign permission |
| `CYCLE_LOCKED` | 403 | Cycle not open for new tasks |

---

## How to verify (BE + FE)

1. Create MPC with Finance + Sales owners (owner slice tasks appear in list with **Dept plan**).  
2. As FP&A on worksheet → **Tasks** tab → **Assign task** → “Review Marketing Plan” → Marketing assignee → due date.  
3. `GET …/model-planning/cycles/{id}/tasks` returns new task + owner tasks.  
4. Assignee sees task in list / notifications.  
5. Owner slice submit still uses `POST /tasks/{ownerTaskId}/submit` only.

---

## FE files

| File | Role |
|------|------|
| `components/fpa/planning/planning-assign-task-dialog.tsx` | Assign modal |
| `components/fpa/planning/planning-collab-sidebar.tsx` | Tasks tab + Assign button |
| `components/fpa/fpa-worksheet.tsx` | Load tasks, create task, pass users/depts |
| `lib/api/fpa-api.ts` | `listModelPlanningCycleTasks`, `createModelPlanningCycleTask` |
| `lib/fpa/planning-task-utils.ts` | Map API tasks + owner slices |

---

## UAT suggestion

Extend `npm run uat:fpa:model-planning-cycle` with:

- List MPC tasks after create (≥ owner slice count)  
- POST ad-hoc task → appears on GET list  
- Assignee notification fired (optional assert)
