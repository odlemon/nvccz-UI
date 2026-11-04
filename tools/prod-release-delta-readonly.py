"""Read-only: what exactly differs between the local repos and the source trees
currently deployed on the production host?

Hashes the files git reports as modified/untracked in each local repository and
compares them with the same path under /var/www/projects/nvccz/src/{api,ui}.
Anything that differs is what a release would actually change in production.
"""
import os, subprocess, sys
from pathlib import Path
import paramiko

UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

import hashlib


def local_sha(path: Path) -> str:
    data = path.read_bytes()
    # Remote copies were extracted from tarballs built on this machine; compare
    # normalised bytes so CRLF churn in the working copy is not mistaken for a
    # real code difference.
    return hashlib.sha256(data.replace(b"\r\n", b"\n")).hexdigest()


def dirty_files(root: Path):
    out = subprocess.check_output(["git", "-c", "core.quotepath=off", "status", "--short"],
                                  cwd=root, text=True, encoding="utf-8", errors="replace")
    files = []
    for line in out.splitlines():
        flag, rel = line[:2], line[3:].strip()
        if not flag or flag.startswith("D"):
            continue
        if flag.startswith("R"):
            rel = rel.split("->")[-1].strip()
        p = root / rel
        if p.is_file():
            files.append(rel.replace("\\", "/"))
    return files


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)

    for label, root, remote_base in (("API", API_ROOT, "/var/www/projects/nvccz/src/api"),
                                     ("UI", UI_ROOT, "/var/www/projects/nvccz/src/ui")):
        rels = [r for r in dirty_files(root)
                if not r.startswith((".acc", ".payroll", ".perf", ".lp", ".fr", ".next", ".uat",
                                     "scripts/_uat", "test-artifacts", "docs/", "design-refs",
                                     "tmp-", "outputs/", "training/", "node_modules"))]
        print(f"\n########## {label}: {len(rels)} locally dirty files under src ##########")
        if not rels:
            continue
        batch = "\n".join(f"{remote_base}/{r}" for r in rels)
        cmd = (
            "while read -r f; do "
            "if [ -f \"$f\" ]; then printf '%s  ' \"$(tr -d '\\r' < \"$f\" | sha256sum | cut -d' ' -f1)\"; "
            "printf '%s\\n' \"$f\"; else printf 'ABSENT  %s\\n' \"$f\"; fi; done <<'EOF'\n"
            f"{batch}\nEOF"
        )
        _, out, _ = client.exec_command(cmd, timeout=300)
        remote = {}
        for line in out.read().decode("utf-8", "replace").splitlines():
            if "  " in line:
                sha, path = line.split("  ", 1)
                remote[path.strip()] = sha.strip()
        changed, newish, same = [], [], []
        for r in rels:
            sha_local = local_sha(root / r)
            sha_remote = remote.get(f"{remote_base}/{r}")
            if sha_remote in (None, "ABSENT"):
                newish.append(r)
            elif sha_remote != sha_local:
                changed.append(r)
            else:
                same.append(r)
        print(f"  identical to deployed source: {len(same)}")
        print(f"  WOULD CHANGE deployed code : {len(changed)}")
        for r in changed[:40]:
            print(f"      M {r}")
        print(f"  WOULD ADD (not on server)  : {len(newish)}")
        for r in newish[:40]:
            print(f"      + {r}")
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
