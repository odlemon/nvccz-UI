"""Read-only: does the production database already have every table/column the
new Accounting code needs? Any FAIL is a DDL gap that must be closed with
additive SQL before the API release, or the feature 500s in production.
"""
import base64, os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

PROBE = r"""
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
const TABLES=['banks','module_period_locks','company_accounting_policies','period_lock_drafts',
  'period_lock_audit_logs','posting_exceptions','period_lockouts','fiscal_periods',
  'accounting_close_tasks','cashbook_reconciliation_sessions','cashbook_reconciliation_session_lines',
  'cashbook_reconciliation_statements','bank_statements','bank_statement_items','depreciation_records'];
const COLUMNS=[['banks','accountNumber'],['depreciation_records','depreciation_date'],
  ['accounting_documents','expense_id'],['module_period_locks','module_code'],
  ['cashbook_reconciliation_sessions','opening_balance'],['cashbook_reconciliation_sessions','statement_end_balance']];
(async()=>{
  const t=await p.$queryRawUnsafe("select table_name n from information_schema.tables where table_schema=database()");
  const have=new Set(t.map(r=>r.n.toLowerCase()));
  for(const name of TABLES) console.log((have.has(name)?'OK   ':'MISSING ')+name);
  console.log('--- columns');
  for(const [tbl,col] of COLUMNS){
    if(!have.has(tbl)){console.log(`SKIP   ${tbl}.${col} (table missing)`);continue;}
    const c=await p.$queryRawUnsafe(
      `select column_name n from information_schema.columns where table_schema=database() and table_name='${tbl}'`);
    console.log((c.some(r=>r.n.toLowerCase()===col.toLowerCase())?'OK   ':'MISSING ')+tbl+'.'+col);
  }
  await p.$disconnect();
})().catch(async e=>{console.log('PROBE ERROR',String(e.message).slice(0,200));await p.$disconnect();});
"""

if __name__ == "__main__":
    blob = base64.b64encode(PROBE.encode()).decode()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    _, out, err = client.exec_command(
        f"docker exec nvccz-prod-api-1 node -e \"$(echo {blob} | base64 -d)\"", timeout=180)
    print(out.read().decode("utf-8", "replace"))
    e = err.read().decode("utf-8", "replace").strip()
    if e:
        print("STDERR:", e[:600])
    client.close()
    sys.exit(0)
