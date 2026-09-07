# VPS pending migrations (local → Contabo)

When Contabo (`arcus_dev` on the VPS) is reachable again, apply every row where `appliedToVps` is `false`.

**Rules**
- Every schema/data migration we run locally must be added here the same day.
- `appliedToLocal=true` once verified on local MySQL.
- `appliedToVps=false` until you explicitly ask to apply on the VPS.
- Do not invent Contabo changes outside this list.

| id | description | how to apply | appliedToLocal | appliedToVps | notes |
|---|---|---|---|---|---|
| `2026-08-26-application-form-data` | Add `applications.application_form_data` JSON NULL | `ALTER TABLE applications ADD COLUMN application_form_data JSON NULL;` (or `prisma db push` / migrate) | `true` | `false` | Added for funding form UoF/declarations/Impact-ESG persistence |
| `2026-08-27-local-mysql-baseline` | Full schema sync from `prisma/schema.prisma` on empty local DB | Local only: `npx prisma db push` | `true` | `false` | Not a Contabo delta; VPS already had schema. Skip on VPS unless rebuilding |
| `2026-08-27-assert-dev-db-arcus_dev` | Allow seeds/UAT on `arcus_dev` as well as `nts` | Deploy updated `scripts/lib/assert-dev-database.ts` | `true` | `false` | Code change, not SQL |
| `2026-08-27-portfolio-v11-local-demo-seed` | Seed admin@nts.com + PE fund + NTS/Demo ACTIVE_DD deals | `npx ts-node --transpile-only -r dotenv/config scripts/seed-portfolio-v11-local-demo.ts` | `true` | `false` | **Local-only demo recreate** — Contabo dump unavailable. Do **not** blindly re-run on VPS if production data exists |
| `2026-09-07-role-portfolio-settings-permissions` | Add `roles.portfolio_settings_permissions` (JSON NULL) | `ALTER TABLE roles ADD COLUMN portfolio_settings_permissions JSON NULL;` (matches schema.prisma `Role.portfolioSettingsPermissions Json?`) | `true` | `true` | Undocumented drift found while running the role sync below — column existed on local `arcus_dev` (schema.prisma already has it) but was missing on both reachable VPS databases, blocking `prisma.role.findMany()`. Nullable/additive, applied via raw SQL over SSH tunnel to `arcus-dev-mysql-1` (`arcus_dev`, tunnel :3307) and `nvccz-prod-mysql-1` (`nvccz_prod`, tunnel :3327) on 2026-09-07. Did not check/touch `arcus-demo-mysql-1` (`arcus_prod`) — not in scope for this task, flag separately if this is needed there too. |
| `2026-09-07-sync-hardcoded-roles-vps` | Data-only: populate `roles` table from `src/config/hardcodedRoles.ts` (accounting-v52/admin-management audit found this had never been run beyond a handful of manually-created roles) | `npm run sync:roles` (`scripts/sync-hardcoded-roles.ts` — creates/updates by name, skips admin roles, idempotent) | `true` | `true` | Ran against local `arcus_dev` earlier the same session (6→59 roles), then VPS `arcus_dev` (6→58 roles) and VPS `nvccz_prod` (2→57 roles) via the SSH tunnels above on 2026-09-07. Required the column migration directly above first. Not run against `arcus_prod` (demo) — same scope note as above. |

## How to add a new entry

When you run a migration locally, append a row:

```md
| `YYYY-MM-DD-short-slug` | What changed | Exact SQL or npm script | `true` | `false` | Context |
```

## Apply-to-VPS checklist (when asked)

1. SSH / tunnel to Contabo MySQL.
2. For each row with `appliedToVps=false` that is safe for Contabo, run `how to apply`.
3. Flip `appliedToVps` to `true` and note the date in `notes`.
