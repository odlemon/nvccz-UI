#!/usr/bin/env python3
"""Recreate empty arcus_prod MySQL, seed currencies+CoA+investments on both envs."""
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


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> tuple[int, str]:
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    return code, out


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    sftp = c.open_sftp()
    with sftp.file("/tmp/ensure-coa-1501.js", "w") as f:
        f.write(ENSURE_JS.replace("\r\n", "\n"))
    sftp.close()

    print("=== recreate prod mysql volume ===", flush=True)
    code, out = run(
        c,
        r"""
set -euo pipefail
cd /var/www/projects/arcus
sed -i 's/\r$//' src/api/deploy/docker-entrypoint.sh
chmod +x src/api/deploy/docker-entrypoint.sh
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml stop api mysql || true
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml rm -f api mysql || true
for v in $(docker volume ls -q | grep -E 'arcus[-_]prod.*mysql' || true); do
  echo "removing volume $v"
  docker volume rm "$v" || true
done
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d mysql
echo waiting for mysql user...
for i in $(seq 1 60); do
  USERPW=$(grep '^MYSQL_PASSWORD=' secrets/prod.env | cut -d= -f2-)
  if docker exec arcus-prod-mysql-1 mysql -uarcus_prod -p"$USERPW" -e 'SELECT 1' arcus_prod >/dev/null 2>&1; then
    echo MYSQL_USER_OK
    break
  fi
  sleep 3
done
docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d api
for i in $(seq 1 90); do
  if curl -fsS http://127.0.0.1:3010/health >/dev/null 2>&1; then
    echo PROD_API_HEALTHY
    curl -fsS http://127.0.0.1:3010/health; echo
    exit 0
  fi
  sleep 3
done
echo PROD_API_NOT_HEALTHY
docker ps -a --format 'table {{.Names}}\t{{.Status}}' | grep arcus-prod || true
docker logs arcus-prod-api-1 --tail 80 || true
exit 1
""",
        timeout=1200,
    )
    print(out)
    if "PROD_API_HEALTHY" not in out:
        c.close()
        return code or 1

    # copy ensure script into both containers
    run(c, "docker cp /tmp/ensure-coa-1501.js arcus-dev-api-1:/tmp/ensure-coa-1501.js")
    run(c, "docker cp /tmp/ensure-coa-1501.js arcus-prod-api-1:/tmp/ensure-coa-1501.js")

    for env in ("prod", "dev"):
        container = f"arcus-{env}-api-1"
        print(f"\n######## SEED {env} ########\n", flush=True)
        steps = [
            ("currencies", "npx ts-node --transpile-only scripts/04-seed-currencies.ts"),
            ("coa", "npm run db:ensure:chart-of-accounts"),
            ("coa-1501", "node /tmp/ensure-coa-1501.js"),
            ("investments", "npm run db:seed:investments-v2-demo"),
        ]
        for label, cmd in steps:
            print(f"--- {env}: {label} ---", flush=True)
            remote = f"docker exec -e UAT_ALLOW_NON_DEV_DB=1 {container} sh -lc {repr('cd /app && ' + cmd)}"
            code, out2 = run(c, remote, timeout=3600)
            lines = out2.splitlines()
            if len(lines) > 90:
                print("\n".join(lines[:25]))
                print(f"... ({len(lines) - 50} lines omitted) ...")
                print("\n".join(lines[-25:]))
            else:
                print(out2)
            if code != 0:
                print(f"FAILED {env}/{label} exit={code}")
                c.close()
                return code

    code, out = run(
        c,
        r"""
for name in arcus-dev-api-1 arcus-prod-api-1; do
  echo "=== AFTER $name ==="
  docker exec "$name" node -e '
const {PrismaClient}=require("@prisma/client");
const p=new PrismaClient();
(async()=>{
  const db=(await p.$queryRawUnsafe("SELECT DATABASE() d"))[0].d;
  const o={db, users:await p.user.count(), coa:await p.chartOfAccounts.count(), currency:await p.currency.count()};
  for (const [k,m] of Object.entries({funds:"fund", instruments:"investmentInstrument", orders:"investmentOrder", holdings:"holding"})) {
    try { o[k]=await p[m].count(); } catch { o[k]="n/a"; }
  }
  try { o.journals=await p.journalEntry.count(); } catch { o.journals="n/a"; }
  console.log(JSON.stringify(o));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
'
done
echo SEED_BOTH_DONE
""",
        timeout=120,
    )
    print(out)
    c.close()
    return 0 if "SEED_BOTH_DONE" in out else 1


if __name__ == "__main__":
    raise SystemExit(main())
