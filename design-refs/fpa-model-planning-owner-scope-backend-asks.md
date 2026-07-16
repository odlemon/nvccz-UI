# Backend asks — Model Planning department / owner scope + slice submit

**Date:** 2026-07-16  
**Status:** **Implemented** (BE UAT 23/23) · FE wired  
**Canonical contract:** [`fpa-model-planning-owners-api.md`](./fpa-model-planning-owners-api.md)

This file was the original FE ask. All critical items below are **done** on BE; FE now uses the MPC-native owner-workspace and task slice submit. Do not use budget-cycle `owner-workspace` for Model Planning cycle ids.

| Ask | Status |
|-----|--------|
| Persist `owners[]` on create (≥1) | Done (`NO_OWNERS`) |
| Enrich get/list/workspace | Done |
| `PUT …/owners` | Done |
| `GET …/model-planning/cycles/{id}/owner-workspace` | Done |
| Grid `assignedDepartmentIds` + `departmentId` | Done |
| `DEPARTMENT_SCOPE_LOCKED` | Done |
| Slice submit via `POST /tasks/{taskId}/submit` | Done (only path) |
| Seed dept INPUT cells | Done |

See the handoff doc for request/response shapes, demo Ada login, and FE verify steps.
