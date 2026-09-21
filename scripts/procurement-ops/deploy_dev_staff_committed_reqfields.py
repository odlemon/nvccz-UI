"""Redeploy the Arcus dev staff portal (dev.matanho.com) from the clean committed worktree."""
import importlib.util
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(r"C:\Users\lysp\Downloads\nvccz-new\scripts")
WORKTREE = Path(r"C:\Users\lysp\AppData\Local\Temp\claude\C--Users-lysp-Downloads-nvccz-new\7c49cfe6-797f-48cf-8ebb-c51932c690a5\scratchpad\wt-ui-reqfields")

sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("dev_selective", SCRIPTS / "deploy-arcus-dev-selective.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.UI_ROOT = WORKTREE

head = subprocess.run(["git", "-C", str(WORKTREE), "log", "-1", "--format=%h %s"], capture_output=True, text=True).stdout.strip()
dirty = subprocess.run(["git", "-C", str(WORKTREE), "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
print(f"Deploying committed UI {head} to dev ui-staff", flush=True)
if dirty:
    print("Worktree is not clean, refusing:\n" + dirty)
    raise SystemExit(2)
sys.argv = ["deploy-arcus-dev-selective.py", "--portals", "staff", "--yes"]
raise SystemExit(mod.main())
