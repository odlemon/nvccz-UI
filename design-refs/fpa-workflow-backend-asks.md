# FP&A Workflow — backend asks (archive / residual)

**Audience:** API team  
**Base:** `{host}/api/v1/fpa`  
**Page:** `/forecasting/workflow`

## Status (2026-07-12)

The seven review-cockpit gaps are **closed and live**. FE verified against:

| Contract | Live check |
|----------|------------|
| `GET …/tasks` priority `HIGH`/`MEDIUM`/`LOW` | `MEDIUM` returned (NORMAL mapped on BE) |
| `GET …/tasks/export` raw CSV | `text/csv` + header row |
| Board pack download | `application/vnd.openxmlformats…sheet` + `.xlsx` (`PK` bytes) |
| `GET …/tasks/{id}/summary` | 200 with lines / null-safe totals |
| Comments / attachments / events / stages / WoW | Wired on FE |

## Residual (non-blocking)

1. **`reviewerId` / `reviewerName`** on cycle tasks often still `null`. FE falls back to cycle owner for the Reviewer column. Prefer BE populating assigned FP&A reviewer when known.
2. **Empty summary shape** — contract allows all-null + `lines: []`. Current sample returns numeric zeros; FE handles both.
3. Keep binary routes **without** `{ success, data }` envelopes on 2xx (`tasks/export`, `exports/{id}/download`, `attachments/{id}/download`).

## FE now ships

- Board pack default `.xlsx` (CSV only as last-resort fallback if JSON cell pack returns)
- Owner **changeNotes** on Budgeting + Worksheet submit
- Cycle + task comments with **ALL / INTERNAL** visibility for approvers
- Attachment **delete** for approvers
- `NORMAL` → `MEDIUM` normalize on merge/filter/display
