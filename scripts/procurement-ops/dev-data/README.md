# Dev procurement data (Arcus dev only)

Scripts that run inside `arcus-dev-api-1` against `arcus_dev`. Each refuses the production database; the
dataset build also refuses unless the dev mail guard is on (`python scripts/procurement-ops/dev_mail_guard.py on`).

Run any of them with the runner, which copies the script into the container and executes it there:

    python scripts/procurement-ops/dev-data/dev_api_node.py scripts/procurement-ops/dev-data/<script> [flags]

| Script | What it does |
|---|---|
| `dev_inventory.mjs` | Read-only counts: procurement tables (test-named vs other), linked journals and cashbook entries, personas, company profile. |
| `dev_cleanup_procurement.mjs` | Removes test-named procurement chains ("UAT …", "Storyline …", @vendors.example.test) with the journals and cashbook entries they posted, and their audit rows. Dry run by default; `--apply` deletes in one transaction; `--all` takes every procurement record (rebuilding the demo from nothing). Refuses if anything outside procurement points at those rows. |
| `dev_profile_personas.mjs` | Company profile (no statutory numbers invented) and realistic display names for the eight demo personas. `--apply` to write. |
| `dev_demo_dataset.mjs` | Builds the demo dataset through the API as the people who do each step: 9 vendors, FY 2026 / FY 2027 plans, six sourcing chains in different stages (one paid with its journal posted), requisitions in every state, a contract and vault documents. Writes `demo-manifest.json` in the container. |
| `dev_demo_backdate.mjs` | Spreads that dataset over the past weeks in business order, renumbers `*_YYYYMMDD_NNNN` documents to their new day, and moves every copy of a number and the audit rows with them. Dry run by default; `--apply` to write. |

After a regression run on dev, `dev_cleanup_procurement.mjs --apply` removes what the suites created and leaves
the demo dataset. Back up `arcus_dev` before any `--apply` (the last backup:
`/var/www/projects/arcus/backups/arcus_dev-20260913-063341-pre-procurement-cleanup.sql.gz`).
