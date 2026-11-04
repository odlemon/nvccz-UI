# Accounting Work Handoff

**State: standby for the user’s next task.** Do not begin an audit, comparison, redesign, or implementation until the user assigns a specific Accounting task.

## Working agreement

- The original Accounting functionality PDFs listed below are the source of truth for expected accounting workflows and business logic. The UI inspiration/reference PDF is visual guidance only.
- When a task arrives, identify the relevant PDF section(s), then inspect the affected current UI, legacy UI, API route/controller/service, and database behavior before making changes.
- The user mainly expects UI work, but each requested change must preserve or correct the underlying workflow so it agrees with the relevant functional SRD.
- Do not compare the whole system against all PDFs preemptively. Consult only the material relevant to the assigned task.
- Work locally and verify as requested. Never deploy unless the user explicitly authorizes deployment for that task.
- Preserve unrelated work and files. Do not include credentials, tokens, or secrets in handoff notes.

## Accounting source documents

These originals are in `C:\Users\lysp\Downloads`:

1. `SRD 2.0_ Arcus Accounting Module (1).pdf` — `SRD_2_0_Arcus_Accounting_Module_1.txt`
2. `Arcus supplementary TECHNICAL SRD Accounting Module (1).pdf` — `Arcus_supplementary_TECHNICAL_SRD_Accounting_Module_1.txt` (October 2025)
3. `Supplementary accounting (3).pdf` — `Supplementary_accounting_3.txt` (November 2025)
4. `core accounting.pdf` — `core_accounting.txt` (October 2025)
5. `Arcus_Cashbook_SRD_Narrative.pdf` — `Arcus_Cashbook_SRD_Narrative.txt` (October 2025)
6. `arcus_cashbook_SRD[1].pdf` — `arcus_cashbook_SRD_1.txt`

There is also `Arcus_Accounting_UI_Inspiration_and_Interaction_Reference.pdf`; do not mistake it for the functional source of truth.

## UI and repository orientation

- Staff frontend repository: `C:\Users\lysp\Downloads\nvccz-new`
- API/backend repository: `C:\Users\lysp\Downloads\nvccz`
- Current Accounting routes are under `app\accounting\...`; the current layout is `components\layout\accounting-v52-layout.tsx` and much of its live behavior is synchronized from `scripts\accounting-live\` into `components\accounting-v52-mock\matanho-accounting-runtime.js`.
- Older Accounting routes are under `app\accounting-legacy\...`, with their older implementation generally in `components\accounting\` and the shared Accounting layout. Inspect the specific requested screen before deciding which legacy UI is the intended reference.
- `app\accounting-v2\...` is a separate UI/design implementation; do not assume it is the legacy target.
- Backend work should be traced from `C:\Users\lysp\Downloads\nvccz\src\routes` through controllers/services to `prisma\schema.prisma`.
- The backend’s `AGENTS.md` requires reading `ENGINEERING_OPERATING_POLICY.md` before backend task work.

## Recent production context

- On 27 October 2026, the user authorized a targeted production release of Portfolio RBAC/Funds grant handling and the specified Accounting Cashbook, Period Close, and Fixed Asset changes; Events was explicitly excluded.
- The staff UI and API containers were verified healthy; internal API, staff login, and public staff login returned HTTP 200. The Events container remained healthy and was not rebuilt.
- A manual additive SQL change ensured `depreciation_records.depreciation_date` exists. The existing 61 global roles were linked to Portfolio role records without changing their permission grants or user assignments; no policy version was activated.
- A one-line client-facing production fixes list is in `FIXES_LOG.md`.
- Do not redeploy these or other changes unless the user explicitly asks.

## Next action

Wait for the user’s next task. When it arrives, work only on that scope, consult the relevant Accounting source document(s), then verify the requested UI and accounting workflow locally as appropriate.
