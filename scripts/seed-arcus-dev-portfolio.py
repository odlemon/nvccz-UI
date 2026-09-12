#!/usr/bin/env python3
"""
Run Portfolio V11 full-demo seed against Arcus DEV MySQL (remote), without
restarting API/Docker services.

Uploads `scripts/seed-portfolio-v11-full-demo.ts` (+ assert helper) into the
running `arcus-dev-api-1` container and executes via ts-node if available,
else compiles with the container's node_modules.

Usage:
  python scripts/seed-arcus-dev-portfolio.py
  python scripts/seed-arcus-dev-portfolio.py --check-only
"""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
API = Path(r"C:\Users\lysp\Downloads\nvccz")
SEED = API / "scripts" / "seed-portfolio-v11-full-demo.ts"
ASSERT = API / "scripts" / "lib" / "assert-dev-database.ts"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    check_only = "--check-only" in sys.argv
    if not SEED.exists():
        print(f"Missing seed script: {SEED}", file=sys.stderr)
        return 2

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        port=22,
        username=USER,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )
    sftp = client.open_sftp()

    count_js = r"""
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const out={
    db:(await p.$queryRawUnsafe('SELECT DATABASE() d'))[0].d,
    funds:await p.fund.count(),
    capitalCalls:await p.capitalCall.count(),
    allocations:await p.capitalCallAllocation.count(),
    schedules:await p.fundReportSchedule.count(),
    runs:await p.fundReportRun.count(),
  };
  console.log(JSON.stringify(out));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
"""
    with sftp.file("/tmp/pv11-count.js", "w") as f:
        f.write(count_js)

    def remote(cmd: str, timeout: int = 120) -> tuple[int, str]:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        return code, out + (("\n" + err) if err.strip() else "")

    print("=== BEFORE (arcus-dev-api-1 / arcus_dev) ===", flush=True)
    remote("docker cp /tmp/pv11-count.js arcus-dev-api-1:/app/pv11-count.js")
    code, out = remote("docker exec arcus-dev-api-1 sh -lc 'cd /app && node pv11-count.js'")
    print(out, flush=True)
    if code != 0:
        client.close()
        return code
    if check_only:
        client.close()
        return 0

    # Upload seed sources into container workdir
    print("Uploading seed sources...", flush=True)
    remote("mkdir -p /tmp/pv11-seed/scripts/lib")
    sftp.put(str(SEED), "/tmp/pv11-seed/scripts/seed-portfolio-v11-full-demo.ts")
    if ASSERT.exists():
        sftp.put(str(ASSERT), "/tmp/pv11-seed/scripts/lib/assert-dev-database.ts")
    sftp.close()

    run_sh = r"""
set -euo pipefail
docker cp /tmp/pv11-seed/scripts arcus-dev-api-1:/app/scripts-seed-upload
docker exec arcus-dev-api-1 sh -lc '
  set -e
  cd /app
  mkdir -p scripts/lib
  cp -f scripts-seed-upload/seed-portfolio-v11-full-demo.ts scripts/seed-portfolio-v11-full-demo.ts
  if [ -f scripts-seed-upload/lib/assert-dev-database.ts ]; then
    cp -f scripts-seed-upload/lib/assert-dev-database.ts scripts/lib/assert-dev-database.ts
  fi
  # Prefer ts-node from node_modules; fall back to npx
  if [ -x node_modules/.bin/ts-node ]; then
    node_modules/.bin/ts-node --transpile-only -r dotenv/config scripts/seed-portfolio-v11-full-demo.ts
  else
    npx --yes ts-node --transpile-only -r dotenv/config scripts/seed-portfolio-v11-full-demo.ts
  fi
'
"""
    print("Running seed inside arcus-dev-api-1 (no container restart)...", flush=True)
    code, out = remote(run_sh, timeout=900)
    print(out, flush=True)
    if code != 0:
        client.close()
        return code

    print("=== AFTER ===", flush=True)
    code, out = remote("docker exec arcus-dev-api-1 sh -lc 'cd /app && node pv11-count.js'")
    print(out, flush=True)
    client.close()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
