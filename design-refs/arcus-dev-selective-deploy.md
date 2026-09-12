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

# Include API rebuild only when backend code changed
python scripts/deploy-arcus-dev-selective.py --portals staff --api --yes

# Rollback last snapshotted staff image
python scripts/deploy-arcus-dev-selective.py --rollback staff
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
