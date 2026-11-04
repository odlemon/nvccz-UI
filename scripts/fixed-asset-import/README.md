# Fixed asset register import

The target is explicitly production `nvccz_prod`. The manifest has 33 source rows.

The existing `assets` table cannot preserve supplier, quantity, source-row identity, unit cost, or USD total. The importer therefore requires a dedicated `asset_register_imports` table. It writes no journals and uses source-row uniqueness for retries.

Run inside the existing `nvccz-prod-api-1` backend container, where Compose supplies the working production `DATABASE_URL`:

```powershell
BACKEND_DATABASE_MODULE=/app/src/utils/database npx ts-node --transpile-only /app/scripts/fixed-asset-import/import.ts
```

The runner creates the table, inserts only missing source keys, creates assets directly through Prisma (not `AssetService.createAsset`), and prints a JSON report. It must not be run against an unintended database.

The runner executes `migration.sql` automatically before importing. Afterward, verify with:

```sh
BACKEND_DATABASE_MODULE=/app/src/utils/database npx ts-node --transpile-only /app/scripts/fixed-asset-import/verify.ts
```

Expected result: 33 source rows, 33 assets, and 0 `FAR-%` journal entries.
