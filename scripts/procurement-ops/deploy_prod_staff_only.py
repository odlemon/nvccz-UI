"""Redeploy ONLY the NVCCZ prod staff portal from the clean committed worktree.

deploy_prod_ui_committed.py rebuilds all six portals. This promotion is staff-scoped
(procurement V23), so rebuilding lp / investee / apply / vendor / events would be five
needless builds on a box shared with LMS, each one a chance to break a portal nobody asked
me to touch.
"""
import importlib.util
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(r"C:\Users\lysp\Downloads\nvccz-new\scripts")
WORKTREE = Path(r"C:\Users\lysp\AppData\Local\Temp\claude\C--Users-lysp-Downloads-nvccz-new\7c49cfe6-797f-48cf-8ebb-c51932c690a5\scratchpad\wt-ui")
SERVICES = ["ui-staff"]

sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("prod_ui_only", SCRIPTS / "deploy-nvccz-nts-prod-ui-only.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

old_build = "docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml \\\n  up -d --build __SERVICES__"
assert old_build in mod.REMOTE_SH, "build step not found in REMOTE_SH"
assert "pre-uionly-20260907" in mod.REMOTE_SH, "rollback tag not found in REMOTE_SH"
new_build = (
    "for s in __SERVICES__; do\n"
    "  echo \"=== build $s ===\"\n"
    "  docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml build \"$s\"\n"
    "  docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --no-deps --force-recreate \"$s\"\n"
    "  echo \"=== $s now running $(docker inspect nvccz-prod-$s-1 --format '{{.Image}}') ===\"\n"
    "done"
)
# Keep the earlier rollback tags intact; tag today's images separately.
mod.REMOTE_SH = mod.REMOTE_SH.replace(old_build, new_build).replace("pre-uionly-20260907", "pre-registers-20260912")
mod.UI_ROOT = WORKTREE
mod.UI_SERVICES = SERVICES

head = subprocess.run(["git", "-C", str(WORKTREE), "log", "-1", "--format=%h %s"], capture_output=True, text=True).stdout.strip()
dirty = subprocess.run(["git", "-C", str(WORKTREE), "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
print(f"Promoting committed UI {head} to PRODUCTION")
print(f"Services: {' '.join(SERVICES)} (staff only)")
if dirty:
    print("Worktree is not clean, refusing:\n" + dirty)
    raise SystemExit(2)
raise SystemExit(mod.main())
