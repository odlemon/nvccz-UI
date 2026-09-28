# Arcus Dev selective deploy

**Target:** `https://dev.matanho.com` only (NTS VPS). Never staging/prod.

## Why

Full `python scripts/deploy-arcus-docker-vps.py` rebuilds **API + every portal + demo**.  
Legacy `rebuild-arcus-ui.py` still targets old service name `ui` and rebuilds **dev + demo**.

Portfolio / Performance / Investments / Home all ship inside the **staff** Next image (`ui-staff`). Other portals are separate Docker services built from the same UI tree with different `NEXT_PUBLIC_PORTAL`.

## Commands

From `nvccz-new` repo root:

```bash
# Detect which portals dirty working tree implies
python scripts/deploy-arcus-dev-selective.py --detect

# Deploy staff only (typical for portfolio/performance/investments/home)
python scripts/deploy-arcus-dev-selective.py --portals staff --yes

# Multiple portals
python scripts/deploy-arcus-dev-selective.py --portals staff,lp --yes

# Include API rebuild only when backend code changed.
# Also runs idempotent `npm run db:migrate:nts-remaining` against arcus_dev
# after the new API image is built (vendor §8 / users §7 / other NTS gap DDL).
# API entrypoint still skips schema sync on ordinary restarts.
python scripts/deploy-arcus-dev-selective.py --portals staff --api --yes

# Rollback last snapshotted staff image
python scripts/deploy-arcus-dev-selective.py --rollback staff
```

## API migrations on `--api`

The API image entrypoint (`nvccz/deploy/docker-entrypoint.sh`) **does not** run Prisma push or `db:migrate:*` on boot (by design — full `db:migrate:all` is minutes of downtime).

Selective `--api` therefore applies the NTS remaining gap DDL explicitly after `compose build` and before `up --force-recreate`:

```bash
docker compose … run --rm --no-deps api npm run db:migrate:nts-remaining
```

That script lives at `nvccz/scripts/run-nts-remaining-migration.ts`, is packaged into the API image (`COPY . .`), and is registered as `db:migrate:nts-remaining` so `db:migrate:all` also picks it up. It is column/table-exists idempotent (safe to re-run).

Manual one-off on a running DEV API:

```bash
docker compose --env-file secrets/dev.env -f compose/docker-compose.dev.yml \
  exec -T api npm run db:migrate:nts-remaining
```

## Portfolio seed (DB only — no API restart)

Remote `arcus_dev` may already have funds/capital calls from earlier seeds.  
To refresh schedules/report runs without restarting Docker:

```bash
python scripts/seed-arcus-dev-portfolio.py --check-only
python scripts/seed-arcus-dev-portfolio.py
```

## Rollback notes

Before each selective rebuild, image IDs are written under:

`/var/www/projects/arcus/rollback/<service>.latest.image`

`--rollback` retags/recreates from that ID. If rollback fails, re-run selective deploy from a known-good local tree.

## Related

- Full (slow) deploy: `scripts/deploy-arcus-docker-vps.py`
- API-only: `scripts/rebuild-arcus-api.py`
- Server layout: `deploy/arcus/README.md`, handbook §11–13
