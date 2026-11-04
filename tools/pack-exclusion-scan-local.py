"""Local (no network) scan: where do the hygiene-excluded directory names actually live?

The release packer must only drop client data / scratch directories. A name that
also appears nested inside app source (lib/.../fixtures) is code, not scratch, so
this lists every matching directory with its depth and file count for both repos.
"""
from __future__ import annotations

import os
import sys
from collections import defaultdict
from pathlib import Path

ROOTS = {"ui": Path(r"C:\Users\lysp\Downloads\nvccz-new"),
         "api": Path(r"C:\Users\lysp\Downloads\nvccz")}
NAMES = {"storage", "uploads", "logs", "tests", "samples", "reports", "fixtures",
         "test-documents", "test-documents-failing", "design-sessions",
         "design-refs-handoff", "performance apis", "tools", "outputs", "tracking",
         "docs", "backups", "test-artifacts", "training", "design-refs"}
SKIP_WALK = {"node_modules", ".git", ".next", "dist", "__pycache__", ".yarn"}


def main() -> int:
    for label, root in ROOTS.items():
        hits: dict[str, list[tuple[int, int, float]]] = defaultdict(list)
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_WALK and not d.startswith(".next-"))
            rel = Path(dirpath).relative_to(root)
            depth = 0 if str(rel) == "." else len(rel.parts)
            for d in list(dirs):
                if d in NAMES:
                    full = Path(dirpath) / d
                    n = sum(1 for _p, _d, f in os.walk(full) for _x in f)
                    size = sum((p.stat().st_size for p in full.rglob("*") if p.is_file()), 0)
                    hits[d].append((depth + 1, n, size / 1e6))
        print(f"===== {label} =====")
        for name in sorted(hits):
            locs = ", ".join(f"depth{dep}({fc} files,{sz:.1f}MB)" for dep, fc, sz in hits[name][:6])
            print(f"  {name:28s} {locs}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
