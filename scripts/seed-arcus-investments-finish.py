#!/usr/bin/env python3
"""Finish investments seed on both Arcus DBs after CoA/currencies are in place."""
from __future__ import annotations

import sys

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
ENSURE_JS = r"""
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const ex = await p.chartOfAccounts.findUnique({ where: { accountNo: '1501' } });
  if (!ex) {
    const d = {
      accountNo: '1501',
      accountName: 'Portfolio Investments',
      accountType: 'Fixed Asset',
      financialStatement: 'Balance Sheet',
      isActive: true,
      notes: 'Listed equity book value',
    };
    try {
      await p.chartOfAccounts.create({ data: { ...d, naturalBalance: 'DEBIT' } });
    } catch {
      await p.chartOfAccounts.create({ data: d });
    }
    console.log('created 1501');
  } else {
    console.log('1501 exists');
  }
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
"""

REMOTE_SH = r"""#!/bin/bash
set -euo pipefail
docker cp /tmp/ensure-coa-1501.js arcus-prod-api-1:/app/ensure-coa-1501.js
docker cp /tmp/ensure-coa-1501.js arcus-dev-api-1:/app/ensure-coa-1501.js
for env in prod dev; do
  echo "######## SEED $env ########"
  C=arcus-$env-api-1
  docker exec -e UAT_ALLOW_NON_DEV_DB=1 "$C" sh -lc 'cd /app && node ensure-coa-1501.js'
  docker exec -e UAT_ALLOW_NON_DEV_DB=1 "$C" sh -lc 'cd /app && npm run db:seed:investments-v2-demo'
done
for name in arcus-dev-api-1 arcus-prod-api-1; do
  echo "=== AFTER $name ==="
  docker exec "$name" node <<'NODE'
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const db=(await p.$queryRawUnsafe('SELECT DATABASE() d'))[0].d;
  const o={db, users:await p.user.count(), coa:await p.chartOfAccounts.count(), currency:await p.currency.count()};
  for (const [k,m] of Object.entries({funds:'fund', instruments:'investmentInstrument', orders:'investmentOrder', holdings:'holding'})) {
    try { o[k]=await p[m].count(); } catch { o[k]='n/a'; }
  }
  try { o.journals=await p.journalEntry.count(); } catch { o.journals='n/a'; }
  console.log(JSON.stringify(o));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
NODE
done
echo SEED_BOTH_DONE
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
    sftp = c.open_sftp()
    with sftp.file("/tmp/ensure-coa-1501.js", "w") as f:
        f.write(ENSURE_JS.replace("\r\n", "\n"))
    with sftp.file("/tmp/seed-cont.sh", "w") as f:
        f.write(REMOTE_SH.replace("\r\n", "\n"))
    sftp.chmod("/tmp/seed-cont.sh", 0o755)
    sftp.close()
    stdin, stdout, stderr = c.exec_command("bash /tmp/seed-cont.sh", timeout=3600, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    print(out)
    code = stdout.channel.recv_exit_status()
    c.close()
    return 0 if "SEED_BOTH_DONE" in out else (code or 1)


if __name__ == "__main__":
    raise SystemExit(main())
