#!/usr/bin/env python3
"""Seed Arcus DEV + PROD DBs like Singapore: currencies, CoA, investments-v2 demo."""
from __future__ import annotations

import sys
import time

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
SEED_STEPS = [
    ("currencies", "npx ts-node --transpile-only scripts/04-seed-currencies.ts"),
    ("chart-of-accounts", "npm run db:ensure:chart-of-accounts"),
    ("investments-v2-demo", "UAT_ALLOW_NON_DEV_DB=1 npm run db:seed:investments-v2-demo"),
]

COUNT_JS = r"""
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const db=(await p.$queryRawUnsafe('SELECT DATABASE() d'))[0].d;
  const out={db, users:await p.user.count(), coa:await p.chartOfAccounts.count(), currency:await p.currency.count()};
  for (const [k,m] of Object.entries({
    funds:'fund', instruments:'investmentInstrument', orders:'investmentOrder',
    holdings:'holding', trades:'trade'
  })) {
    try { out[k]=await p[m].count(); } catch { out[k]='n/a'; }
  }
  console.log(JSON.stringify(out));
  await p.$disconnect();
})().catch(e=>{console.error(e); process.exit(1);});
"""


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> tuple[int, str]:
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    return code, out


def count_env(c: paramiko.SSHClient, label: str) -> None:
    # write count script to avoid shell quoting hell
    code, out = run(
        c,
        f"docker exec -i arcus-{label}-api-1 node <<'NODE'\n{COUNT_JS}\nNODE",
        timeout=60,
    )
    print(f"=== {label} counts (exit={code}) ===")
    print(out.strip() or "(empty)")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    for env in ("dev", "prod"):
        print(f"\n=== BEFORE {env} ===", flush=True)
        count_env(c, env)

    for env in ("dev", "prod"):
        container = f"arcus-{env}-api-1"
        print(f"\n######## SEEDING {container} ########\n", flush=True)
        for label, npm_cmd in SEED_STEPS:
            print(f"--- {env}: {label} ---", flush=True)
            remote = (
                f"docker exec -e UAT_ALLOW_NON_DEV_DB=1 {container} "
                f"sh -lc {repr('cd /app && ' + npm_cmd)}"
            )
            code, out = run(c, remote, timeout=3600)
            lines = out.splitlines()
            if len(lines) > 140:
                print("\n".join(lines[:50]))
                print(f"... ({len(lines) - 100} lines omitted) ...")
                print("\n".join(lines[-50:]))
            else:
                print(out)
            if code != 0:
                print(f"FAILED {env}/{label} exit={code}")
                c.close()
                return code
            time.sleep(1)

    for env in ("dev", "prod"):
        print(f"\n=== AFTER {env} ===", flush=True)
        count_env(c, env)

    print("SEED_BOTH_DONE", flush=True)
    c.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
