"""Production release 2026-10-28: Accounting work (whole working tree) to NVCCZ
prod staff UI + API on 102.217.49.126.

Why this exists instead of `tools/deploy-prod-ui-only.py`:
 - that script builds compose service `ui`; this stack has `ui-staff`, so its
   compose step fails AFTER it has already replaced /var/www/.../src/ui.
 - it runs `up -d --build` without `--no-deps`, so the API container is pulled
   into the transaction as a dependency of ui-staff.
 - it walks the tree with no dot-directory rule, which would push `.secrets/`,
   `scripts/tok-*.txt` (live JWTs) and `*.local.md` credential notes into the
   production source tree, and `.next-*` scratch builds into the upload.
 - it keeps no rollback: no image tag, no source backup.

This release:
 1. packs both working trees with secrets/scratch excluded, sha256 verified;
 2. tags the running api/ui-staff images for rollback and tars current sources;
 3. prunes the Docker build cache (authorised: 26.55 GB reclaimable, 15 GB free);
 4. builds api + ui-staff DETACHED (a dropped connection cannot kill a build);
 5. recreates only those two services with --no-deps, then runs health gates.

Credentials come from the environment; nothing is written to disk here.
"""
from __future__ import annotations

import base64, hashlib, os, re, subprocess, sys, tarfile, tempfile, time
from pathlib import Path, PurePosixPath

import paramiko

# Container logs carry box-drawing characters and ✅. On a Windows cp1252 console a
# bare print() of them raises UnicodeEncodeError - which killed release #2 AFTER a
# successful cutover, so the run reported EXITCODE=1 with no verdict on screen.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

UI_ROOT = Path(os.environ.get("ARCUS_UI_REPO", r"C:\Users\lysp\Downloads\nvccz-new"))
API_ROOT = Path(os.environ.get("ARCUS_API_REPO", r"C:\Users\lysp\Downloads\nvccz"))
HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")

ROOT = "/var/www/projects/nvccz"
SERVICES = ["api", "ui-staff"]
STAMP = time.strftime("%Y%m%d-%H%M%S")
MIGRATIONS = [
    "db:migrate:accounting-documents",
    "db:migrate:accounting-expense-attachments",
    "db:migrate:payroll-configuration",
    "db:migrate:payroll-reports",
    "db:migrate:payroll-access-policies",
]
MIGRATION_CHECKS = [
    "db:migrate:accounting-expense-attachments",
    "db:migrate:payroll-configuration",
    "db:migrate:payroll-reports",
    "db:migrate:payroll-access-policies",
]

# Build output / dependency trees: no application source ever lives in these, at
# any depth. This matches what every previous production deploy excluded.
ARTIFACT_DIRS = {"node_modules", "dist", "coverage", "out", "__pycache__", ".git"}
# Client data, scratch and documentation trees. These are excluded ONLY when they
# are a direct child of the repo root: `fixtures`, `samples`, `reports` and
# `training` also exist deep inside lib/ as real application source, and a global
# name match dropped lib/performance-mock/fixtures from the 2026-10-28 UI build
# (5 module-not-found errors, webpack failed). Root-scoped is the correct rule.
ROOT_ONLY_DIRS = {"design-refs", "docs", "backups", "tracking", "outputs",
                  "test-artifacts", "dashboard-clone", "stock-price-module", "training",
                  # The API working copy holds 1.6 GB of locally uploaded client
                  # documents under storage/ (KYC scans, invoices). Production serves
                  # them from a named volume, so they must never ride in a release.
                  "storage", "uploads", "logs", "tests", "samples", "reports",
                  "test-documents", "test-documents-failing", "fixtures",
                  "design-sessions", "design-refs-handoff", "performance apis", "tools"}
SCRATCH_DIR_PREFIX = "tmp"          # tmp/, tmp-uat-io-all-reports/, tmp-smoke-io-reports/
SKIP_DIR_AT_DEPTH0 = True          # every root-level dot-dir (.secrets, .next-staff, dumps …)
SKIP_NAMES = {".env", ".env.local", ".env.example.local"}
SKIP_PATTERNS = [
    re.compile(r"^scripts[/\\]tok-.*\.txt$"),
    # Browser/UAT probes and captured UI evidence are workstation-only. Keep
    # runtime migration/maintenance scripts under scripts/ in production.
    re.compile(r"^scripts[/\\]_uat[/\\]"),
    re.compile(r"^scripts[/\\]uat-[^/\\]+\.(?:png|jpe?g|webp)$", re.IGNORECASE),
    re.compile(r".*\.local\.md$"),
    re.compile(r".*\.log$"),
    re.compile(r".*\.stackdump$"),
    re.compile(r".*\.tsbuildinfo$"),
    re.compile(r"^tmp-"),
]
# Only these files are taken from a repository root. Everything else at the top
# level of the working copies is scratch (tmp-probe*.mjs, *.log, cost xlsx files,
# handoff markdown, qa scripts) and has no place in a production source tree.
# next.config.mjs + package*.json + public/ are what the runtime stage copies,
# and postcss/tsconfig/middleware are what `npm run build` needs.
ROOT_WHITELIST = {
    "ui": {".dockerignore", "Dockerfile", "package.json", "package-lock.json",
           "next.config.js", "next.config.mjs", "next-env.d.ts", "tsconfig.json",
           "postcss.config.mjs", "components.json", "middleware.ts",
           ".eslintrc.json", "yarn.lock", ".yarnrc.yml"},
    "api": {".dockerignore", "Dockerfile", "package.json", "package-lock.json",
            "tsconfig.json", "env.example", ".eslintrc", ".prettierrc"},
}


def keep_dir(name: str, depth: int) -> bool:
    """depth is the directory's own depth: 1 == direct child of the repo root."""
    if name in ARTIFACT_DIRS or name == ".next" or name.startswith(".next-"):
        return False
    if depth == 1 and (name in ROOT_ONLY_DIRS or name.startswith(SCRATCH_DIR_PREFIX)):
        return False
    if SKIP_DIR_AT_DEPTH0 and depth == 1 and name.startswith("."):
        return False
    return True


def build_tar(root: Path, prefix: str, out: Path) -> str:
    """Pack the working tree (tracked or not) minus secrets, dumps and scratch."""
    added = 0
    allow_root = ROOT_WHITELIST[prefix]
    with tarfile.open(out, "w:gz") as tar:
        for dirpath, dirs, files in os.walk(root):
            rel_dir = Path(dirpath).relative_to(root)
            depth = 0 if str(rel_dir) == "." else len(rel_dir.parts)
            dirs[:] = sorted(d for d in dirs if keep_dir(d, depth + 1))
            for name in sorted(files):
                rel = str(rel_dir / name) if str(rel_dir) != "." else name
                norm = rel.replace("\\", "/")
                if name in SKIP_NAMES or name.endswith(".stackdump"):
                    continue
                if any(p.match(norm) for p in SKIP_PATTERNS):
                    continue
                if depth == 0 and name not in allow_root:
                    continue
                full = Path(dirpath) / name
                if not full.is_file():
                    continue
                tar.add(full, arcname=f"{prefix}/{norm}")
                added += 1
    h = hashlib.sha256()
    with open(out, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    print(f"  {prefix}: {added} files, {out.stat().st_size/1e6:.1f} MB, sha256={h.hexdigest()[:16]}…")
    return h.hexdigest()


def connect() -> paramiko.SSHClient:
    password = os.environ["NVCCZ_PROD_PASSWORD"]
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=password, timeout=45,
              look_for_keys=False, allow_agent=False)
    return c


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 300, echo: bool = True) -> tuple[int, str]:
    _, out, err = c.exec_command(cmd, timeout=timeout)
    text = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    if echo:
        print(text.strip() or "(no output)")
        if e.strip():
            print("STDERR:", e.strip()[:1500])
    return code, text + e


PREPARE = r"""
set -euo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"

echo '=== verify uploads ==='
echo "__API_SHA__  /tmp/rel-api.tgz" | sha256sum -c -
echo "__UI_SHA__  /tmp/rel-ui.tgz" | sha256sum -c -

echo '=== snapshot running images for rollback ==='
for s in api ui-staff; do
  if docker image inspect "nvccz-prod-$s" >/dev/null 2>&1; then
    docker tag "nvccz-prod-$s" "nvccz-prod-$s:pre-release-__STAMP__"
    echo "tagged nvccz-prod-$s:pre-release-__STAMP__"
  fi
done

echo '=== back up current sources ==='
mkdir -p backups
tar -czf "backups/src-pre-release-__STAMP__.tgz" src
ls -la backups | tail -3
# keep only the two newest source backups so the 85%-full disk does not creep
ls -1t backups/src-pre-release-*.tgz 2>/dev/null | tail -n +3 | while read -r f; do rm -f "backups/$f"; done

echo '=== free build headroom if needed ==='
# Pruning destroys every cached layer (a re-run would redo npm ci for both images),
# so do it on need, not on sight. 20 GB is ample for one Next.js portal build.
AVAIL_MB=$(df -BM --output=avail / | tail -1 | tr -dc '0-9')
echo "free: ${AVAIL_MB}MB"
if [ "$AVAIL_MB" -lt 20000 ]; then
  docker builder prune -f | tail -2
else
  echo 'headroom sufficient - keeping the layer cache'
fi
df -h / | tail -1

echo '=== install new sources ==='
rm -rf src/api src/ui
mkdir -p src
tar -xzf /tmp/rel-api.tgz -C src
tar -xzf /tmp/rel-ui.tgz -C src
test -f src/api/package.json
test -f src/ui/package.json
test -f src/ui/Dockerfile
test -f src/ui/public/nvccz-logo.png
test -f src/ui/lib/accounting-v52/export.ts
rm -f /tmp/rel-api.tgz /tmp/rel-ui.tgz
echo PREPARE_OK
"""

BUILD = r"""
set -uo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"
export COMPOSE_PARALLEL_LIMIT=1 NODE_HEAP_MB=4096
: > /tmp/rel-build.log
rm -f /tmp/rel-build.exit
# A subshell, not a brace group: `exit 1` inside { } would end this script before
# the exit marker is written, leaving the caller polling a build that already died.
(
  echo "=== build api ==="
  $COMPOSE build api || { echo BUILD_FAILED api; exit 1; }
  echo "=== build ui-staff ==="
  $COMPOSE build ui-staff || { echo BUILD_FAILED ui-staff; exit 1; }
  echo BUILD_OK
) >> /tmp/rel-build.log 2>&1
echo $? > /tmp/rel-build.exit
"""

CUTOVER = r"""
set -euo pipefail
ROOT=/var/www/projects/nvccz
cd "$ROOT"
COMPOSE="docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"
cp -p compose/docker-compose.prod.yml "backups/docker-compose-pre-release-__STAMP__.yml"
sed -i 's/RUN_SEED: "1"/RUN_SEED: "0"/' compose/docker-compose.prod.yml
echo '=== recreate api, then ui-staff (no deps, no build) ==='
$COMPOSE up -d --no-build --no-deps api
sleep 20
$COMPOSE up -d --no-build --no-deps ui-staff
echo '=== wait for staff UI ==='
LOGIN_CODE=000
for i in $(seq 1 30); do
  LOGIN_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3200/login || true)
  if [ "$LOGIN_CODE" = "200" ]; then echo "staff login healthy after ${i} checks"; break; fi
  sleep 2
done
if [ "$LOGIN_CODE" != "200" ]; then echo "STAFF UI LOGIN FAILED: HTTP $LOGIN_CODE"; exit 1; fi
echo '=== wait for api health ==='
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3209/health >/dev/null 2>&1; then echo "api healthy after ${i}0s"; break; fi
  sleep 10
done
curl -fsS http://127.0.0.1:3209/health && echo || echo 'API HEALTH FAILED'
printf '\n'
echo '=== staff UI ==='
curl -fsS -o /dev/null -w 'login:%{http_code}\n' http://127.0.0.1:3200/login
curl -fsS -o /dev/null -w 'nvccz-logo:%{http_code}\n' http://127.0.0.1:3200/nvccz-logo.png
echo '=== accounting endpoints must answer, not 500 ==='
for p in /api/accounting/me /api/accounting/me/counts /api/cashbook/banks /api/accounting/assets/bills; do
  printf '%s -> ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:3209$p"
done
echo '=== ps ==='
$COMPOSE ps api ui-staff
echo CUTOVER_DONE
"""

VERIFY = r"""
set -uo pipefail
CID=$(docker ps --format '{{.Names}}' | grep nvccz-prod-ui-staff | head -1)
echo "container: $CID"
echo '=== branded export module shipped in the new image ==='
docker exec "$CID" sh -lc "grep -rlo '__AC52_EXPORT__' /app/.next 2>/dev/null | head -3"
echo '=== NVCCZ brand baked into the build ==='
docker exec "$CID" sh -lc "grep -rlo 'nvccz-logo.png' /app/.next/server 2>/dev/null | head -3"
docker exec "$CID" sh -lc "ls -la /app/public/nvccz-logo.png | tail -1"
echo '=== brand strings actually compiled (organisation name + logo path) ==='
docker exec "$CID" sh -lc "grep -rho '\"NVCCZ\"\|\"/nvccz-logo.png\"' /app/.next/static 2>/dev/null | sort | uniq -c | head -4"
echo '=== api image age ==='
docker exec nvccz-prod-api-1 sh -lc "stat -c '%y  %n' /app/dist/config/email.config.js /app/dist/routes/cashbookRoutes-Enhanced.js | head -3"
"""


def upload(c: paramiko.SSHClient, local: Path, remote: str) -> None:
    sftp = c.open_sftp()
    try:
        sftp.put(str(local), remote)
    finally:
        sftp.close()
    _, out, _ = c.exec_command(f"sha256sum {remote} | cut -d' ' -f1", timeout=120)
    remote_sha = out.read().decode().strip()
    local_sha = hashlib.sha256(local.read_bytes()).hexdigest()
    if remote_sha != local_sha:
        raise SystemExit(f"upload mismatch for {remote}: {remote_sha[:16]} != {local_sha[:16]}")
    print(f"  uploaded+verified {remote} ({local.stat().st_size/1e6:.1f} MB)")


ESSENTIAL = {
    "ui": ["ui/package.json", "ui/Dockerfile", "ui/next.config.mjs", "ui/postcss.config.mjs",
           "ui/tsconfig.json", "ui/middleware.ts", "ui/public/nvccz-logo.png",
           "ui/app/accounting/receivables/workflows/page.tsx",
           "ui/lib/accounting-v52/export.ts",
           "ui/components/accounting/reconciliation/reconciliation-live-workspace.tsx",
           "ui/components/accounting-v52-mock/matanho-accounting-runtime.js"],
    "api": ["api/package.json", "api/package-lock.json", "api/tsconfig.json",
            "api/Dockerfile", "api/prisma/schema.prisma", "api/deploy/docker-entrypoint.sh",
            "api/src/services/CBZStatementPdfParser.ts",
            "api/src/services/BankReconciliationWorkbenchService.ts",
            "api/src/controllers/CashbookReconciliationSessionController.ts"],
}
FORBIDDEN = ["ui/.secrets/", "ui/.env", "api/.env", "/tok-", ".local.md", "ui/.next-",
             "node_modules/", "ui/tools/", "test-artifacts/", "ui/.acc-dumps/"]


IMPORT_RE = re.compile(
    r'(?:from|import|require\(|import\()\s*[\x27"]([^\x27"]+)[\x27"]', re.MULTILINE)
RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json",
                    "/index.ts", "/index.tsx", "/index.js", "/index.jsx", "/index.mjs"]
# tsconfig `paths` differ per repo: the staff UI maps @/* to the repo root, the
# API maps @/* to src/*. A gate that assumes one root reports phantom holes.
ALIAS_ROOT = {"ui": "ui", "api": "api/src"}
# Areas the production build never compiles (Next bundles what routes reach; the
# API tsconfig includes only src/**). Holes here cannot break an image build.
NON_COMPILED_AREAS = {"scripts", "tools", "tests", "samples", "reports", "storage"}


def resolve(arc: str, spec: str, alias_root: str) -> str | None:
    """Normalise an import specifier to a tarball path, or None if not local."""
    if spec.startswith("@/"):
        raw = f"{alias_root}/{spec[2:]}"
    elif spec.startswith("."):
        raw = f"{PurePosixPath(arc).parent / spec}"
    else:
        return None
    parts: list[str] = []
    for p in PurePosixPath(raw).parts:
        if p in (".", ""):
            continue
        if p == "..":
            if len(parts) > 1:
                parts.pop()
            else:
                return None      # escapes the packed tree
        else:
            parts.append(p)
    return "/".join(parts)


def unresolved_imports(root: Path, prefix: str, names: set[str]) -> list[str]:
    """Prove the tarball is import-complete.

    For every relative import and every `@/` alias import in the compiled source, if
    the target exists in the working copy it MUST be in the tarball. This is what
    would have caught the fixtures/ exclusion before it failed on the server.
    """
    problems: list[str] = []
    alias_root = ALIAS_ROOT[prefix]
    for arc in sorted(names):
        if not arc.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs")):
            continue
        segs = arc.split("/")
        if len(segs) < 2 or (len(segs) > 2 and segs[1] in NON_COMPILED_AREAS):
            continue
        local = root.joinpath(*segs[1:])
        if not local.is_file():
            continue
        try:
            text = local.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for spec in IMPORT_RE.findall(text):
            target = resolve(arc, spec, alias_root)
            if not target:
                continue
            candidates = [target + s for s in RESOLVE_SUFFIXES]
            if any(c in names for c in candidates):
                continue
            if any(root.joinpath(*PurePosixPath(c).parts[1:]).exists() for c in candidates):
                problems.append(f"{arc} -> {spec} (in working copy, missing from tarball)")
    return problems


def pack_check() -> int:
    """Build both tarballs locally and prove the release set is complete and clean."""
    rc = 0
    out_dir = Path("tmp-release-check")
    out_dir.mkdir(exist_ok=True)
    for prefix, root in (("api", API_ROOT), ("ui", UI_ROOT)):
        out = out_dir / f"rel-{prefix}.tgz"
        build_tar(root, prefix, out)
        with tarfile.open(out) as tar:
            names = {m.name for m in tar.getmembers()}
        print(f"  top-level areas: {sorted({n.split('/')[1] for n in names if len(n.split('/')) > 2})[:20]}")
        for need in ESSENTIAL[prefix]:
            if need not in names:
                print(f"  MISSING REQUIRED: {need}")
                rc = 1
        bad = [n for n in names if any(f in n for f in FORBIDDEN)]
        print(f"  forbidden entries present: {len(bad)} {bad[:5]}")
        if bad:
            rc = 1
        holes = unresolved_imports(root, prefix, names)
        print(f"  imports that resolve to an excluded file: {len(holes)}")
        for h in holes[:12]:
            print(f"    BROKEN IMPORT: {h}")
        if holes:
            rc = 1
    return rc


def main() -> int:
    if "--pack-check" in sys.argv:
        return pack_check()
    print(f"release {STAMP} -> {HOST} services={','.join(SERVICES)}")
    with tempfile.TemporaryDirectory() as td:
        api_tgz, ui_tgz = Path(td) / "rel-api.tgz", Path(td) / "rel-ui.tgz"
        print("Packing API working tree ...")
        api_sha = build_tar(API_ROOT, "api", api_tgz)
        print("Packing UI working tree ...")
        ui_sha = build_tar(UI_ROOT, "ui", ui_tgz)

        c = connect()
        print("connected")
        upload(c, api_tgz, "/tmp/rel-api.tgz")
        upload(c, ui_tgz, "/tmp/rel-ui.tgz")

        print("\n===== prepare (rollback tags, source backup, cache prune, install) =====")
        script = PREPARE.replace("__API_SHA__", api_sha).replace("__UI_SHA__", ui_sha).replace("__STAMP__", STAMP)
        sftp = c.open_sftp()
        with sftp.open("/home/user/rel-prepare.sh", "w") as fh:
            fh.write(script.replace("\r\n", "\n"))
        with sftp.open("/home/user/rel-build.sh", "w") as fh:
            fh.write(BUILD.replace("\r\n", "\n"))
        with sftp.open("/home/user/rel-cutover.sh", "w") as fh:
            fh.write(CUTOVER.replace("\r\n", "\n"))
        with sftp.open("/home/user/rel-verify.sh", "w") as fh:
            fh.write(VERIFY.replace("\r\n", "\n"))
        sftp.close()

        code, out = run(c, "bash /home/user/rel-prepare.sh", timeout=1800)
        if "PREPARE_OK" not in out:
            print("PREPARE FAILED - nothing rebuilt, production untouched")
            return 1

        print("\n===== build (detached; polling) =====")
        run(c, "rm -f /tmp/rel-build.exit /tmp/rel-build.log; nohup bash /home/user/rel-build.sh "
               "> /tmp/rel-build.nohup 2>&1 < /dev/null & echo started", timeout=60)
        started = time.time()
        while True:
            time.sleep(30)
            _, ex = run(c, "test -f /tmp/rel-build.exit && cat /tmp/rel-build.exit || echo RUNNING",
                        timeout=60, echo=False)
            marker = ex.strip()
            # Do not depend on the marker alone: if the build script itself dies, the
            # log's terminal marker still tells us the truth.
            if marker == "RUNNING" or not marker:
                tail_all = run(c, "grep -cE 'BUILD_OK|BUILD_FAILED' /tmp/rel-build.log 2>/dev/null || true",
                               timeout=60, echo=False)[1].strip()
                if tail_all == "1":
                    failed = run(c, "grep -c 'BUILD_FAILED' /tmp/rel-build.log 2>/dev/null || true",
                                 timeout=60, echo=False)[1].strip()
                    marker = "1" if failed == "1" else "0"
            tail_txt = run(c, "tail -6 /tmp/rel-build.log 2>/dev/null", timeout=60, echo=False)[1].strip()
            print(f"[{int(time.time()-started):>4}s] {marker[:12] or 'RUNNING'} | {tail_txt.splitlines()[-1][:110] if tail_txt else ''}", flush=True)
            if marker != "RUNNING" and marker:
                break
            if time.time() - started > 3600:
                print("build still running after 60m - check /tmp/rel-build.log on the host")
                return 2
        code = int(marker.splitlines()[-1])
        if code != 0:
            print(f"\nBUILD FAILED (exit {code}). Running containers were NOT touched; old images still serve traffic.")
            print("Roll back the installed source with:")
            print(f"  cd {ROOT} && rm -rf src && tar -xzf backups/src-pre-release-{STAMP}.tgz -C . && ls -la src")
            run(c, "grep -nE 'error|Error|ERROR|FAILED' /tmp/rel-build.log | tail -40", timeout=120)
            return 1

        print("\n===== targeted idempotent database migrations =====")
        for migration in MIGRATIONS:
            command = (f"cd {ROOT} && docker compose --env-file secrets/prod.env "
                       f"-f compose/docker-compose.prod.yml run --rm --no-deps -e RUN_SEED=0 api npm run {migration}")
            code, _ = run(c, command, timeout=1200)
            if code != 0:
                print(f"MIGRATION FAILED ({migration}) - application containers were not cut over")
                print(f"The new API image and source backup are retained for diagnosis: {ROOT}/backups/src-pre-release-{STAMP}.tgz")
                return 1
        print("\n===== read-only migration verification =====")
        for migration in MIGRATION_CHECKS:
            command = (f"cd {ROOT} && docker compose --env-file secrets/prod.env "
                       f"-f compose/docker-compose.prod.yml run --rm --no-deps -e RUN_SEED=0 api npm run {migration} -- --check")
            code, _ = run(c, command, timeout=1200)
            if code != 0:
                print(f"MIGRATION CHECK FAILED ({migration}) - application containers were not cut over")
                return 1

        print("\n===== cutover =====")
        code, out = run(c, "bash /home/user/rel-cutover.sh", timeout=1500)
        print("\n===== post-deploy verification =====")
        run(c, "bash /home/user/rel-verify.sh", timeout=600)
        print("\n===== api log tail (startup errors?) =====")
        run(c, "docker logs --tail 25 nvccz-prod-api-1 2>&1", timeout=120)
        print(f"\nrollback image tags: nvccz-prod-api:pre-release-{STAMP}, "
              f"nvccz-prod-ui-staff:pre-release-{STAMP}")
        print(f"source backup: {ROOT}/backups/src-pre-release-{STAMP}.tgz")
        c.close()
        return 0 if code == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
