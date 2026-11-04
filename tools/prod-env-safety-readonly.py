"""Read-only: pre-deploy safety checks for the production API release.

1. Does secrets/prod.env carry the SMTP credentials the refactored
   src/config/email.config.ts now requires (it no longer has a hardcoded key)?
   Only key NAMES and whether the value is non-empty are printed - never values.
2. Does the production database already have the columns the new Accounting code
   reads (banks.account_number, depreciation_records.depreciation_date,
   the cashbook reconciliation session tables)?
3. How much disk do the source trees and backups occupy (rollback sizing)?
"""
import os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

MAIL_KEYS = ["MAIL_PROVIDER", "ZEPTO_SMTP_HOST", "ZEPTO_SMTP_USER", "ZEPTO_SMTP_KEY",
             "BREVO_SMTP_HOST", "BREVO_SMTP_KEY", "EMAIL_FROM_ADDRESS",
             "EMAIL_FROM_NAME_EVENTS", "COMPANY_NAME_SHORT"]

NODE_PROBE = r"""
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
const q=async(s)=>{try{const r=await p.$queryRawUnsafe(s);return 'OK '+JSON.stringify(r).slice(0,120)}
  catch(e){return 'FAIL '+String(e.message).slice(0,90)}};
(async()=>{
  console.log('banks.account_number:',await q("select account_number from banks limit 1"));
  console.log('depreciation_date:',await q("select depreciation_date from depreciation_records limit 1"));
  console.log('recon sessions tbl:',await q("select count(*) c from cashbook_reconciliation_sessions"));
  console.log('recon lines tbl:',await q("select count(*) c from cashbook_reconciliation_session_lines"));
  console.log('module locks:',await q("select count(*) c from fiscal_period_module_locks"));
  console.log('statement links:',await q("select count(*) c from cashbook_reconciliation_statements"));
  await p.$disconnect();
})().catch(async e=>{console.log('PROBE ERROR',String(e.message).slice(0,120));await p.$disconnect();});
"""

CHECKS = [
    ("prod.env mail keys present/non-empty (values masked)",
     "cd /var/www/projects/nvccz && for k in " + " ".join(MAIL_KEYS) + "; do "
     "v=$(grep -E \"^$k=\" secrets/prod.env | head -1 | cut -d= -f2-); "
     "if [ -z \"$v\" ]; then echo \"$k = <ABSENT OR EMPTY>\"; else echo \"$k = <set, ${#v} chars>\"; fi; done"),
    ("deployed email.config.js in prod image (old hardcoded form?)",
     "docker exec nvccz-prod-api-1 sh -lc \"grep -c 'smtp.zeptomail.com' /app/dist/config/email.config.js; "
     "grep -o 'process.env.ZEPTO_SMTP_KEY' /app/dist/config/email.config.js | head -1; "
     "grep -o 'pass: *[\"''][^\"'']*' /app/dist/config/email.config.js | head -1 | cut -c1-40\""),
    ("prod db columns the new accounting code reads",
     "docker exec nvccz-prod-api-1 node -e \"$(echo "
     + __import__("base64").b64encode(NODE_PROBE.encode()).decode()
     + " | base64 -d)\""),
    ("source tree sizing for rollback",
     "du -sh /var/www/projects/nvccz/src /var/www/projects/nvccz/src.prev /var/www/projects/nvccz/backups 2>&1 | tail -5; "
     "df -h / | tail -1"),
]


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    for label, cmd in CHECKS:
        print(f"\n===== {label} =====")
        _, out, err = client.exec_command(cmd, timeout=180)
        print(out.read().decode("utf-8", "replace").strip() or "(no output)")
        e = err.read().decode("utf-8", "replace").strip()
        if e:
            print("STDERR:", e[:600])
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
