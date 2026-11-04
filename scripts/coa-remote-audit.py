"""Run the owner-authorized backup or read-only COA audit over verified SSH.

Password is entered with getpass and is never persisted or logged.
SQL is supplied locally and restricted to read-only statements for this helper.
"""
import argparse
import getpass
import json
import shlex
from pathlib import Path
import paramiko

HOST = '102.217.49.126'
PORT = 3131
USER = 'user'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['inspect', 'backup', 'sql', 'realign', 'runtime', 'fetch-runtime'])
    parser.add_argument('--sql-file')
    parser.add_argument('--output')
    parser.add_argument('--operation', choices=['dry-run','rehearse','execute','verify'], default='dry-run')
    parser.add_argument('--expected-hash')
    args = parser.parse_args()
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    known = Path.home() / '.ssh' / 'known_hosts'
    if known.exists():
        client.load_host_keys(str(known))
    client.set_missing_host_key_policy(paramiko.RejectPolicy())
    client.connect(HOST, port=PORT, username=USER, password=getpass.getpass('SSH password: '), timeout=20, auth_timeout=20, look_for_keys=False, allow_agent=False)
    try:
        if args.mode == 'fetch-runtime':
            root=Path(__file__).resolve().parents[1]/'docs/coa-runtime-baseline'
            files=['src/services/IncomeStatementService.ts','src/services/BalanceSheetService.ts','src/services/CashFlowService.ts','src/utils/chartOfAccountsNumberRange.ts','src/utils/chartOfAccountsNaturalBalance.ts','src/config/cashAndCashEquivalents.ts','src/controllers/ChartOfAccountsController.ts']
            for name in files:
                _,out,err=client.exec_command('docker exec nvccz-prod-api-1 cat '+shlex.quote('/app/'+name))
                data=out.read()
                if out.channel.recv_exit_status()!=0: raise RuntimeError('Could not read '+name)
                dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
            print('Fetched deployed source snapshots: '+str(len(files)))
            return
        if args.mode == 'inspect':
            command = "docker ps --format '{{.Names}} {{.Status}}'; docker exec nvccz-prod-mysql-1 sh -c 'MYSQL_PWD=\"$MYSQL_ROOT_PASSWORD\" mysql -uroot -N -B -e \"SELECT @@hostname, @@version; SHOW DATABASES;\"'; df -h /var/www/projects/nvccz"
        elif args.mode == 'backup':
            # Both mysqldump and gzip must succeed before publishing a verified result.
            command = r'''bash -s'''
        elif args.mode == 'runtime':
            command = "docker exec nvccz-prod-api-1 sh -c 'pwd; command -v node; test -f node_modules/ts-node/dist/bin.js && echo TS_NODE_PRESENT; ls src/services/IncomeStatementService.ts dist/services/IncomeStatementService.js src/utils/chartOfAccountsNumberRange.ts; sha256sum src/services/IncomeStatementService.ts src/services/BalanceSheetService.ts'"
        elif args.mode == 'realign':
            root = Path(__file__).resolve().parents[1]
            backup = (root/'docs/coa-backup-verification.txt').read_text(encoding='utf8')
            import re
            remote = re.search(r'BACKUP_DIRECTORY=(\S+)',backup).group(1)
            if 'BACKUP_VERIFIED' not in backup or not re.fullmatch(r'/var/www/projects/nvccz/backups/coa-workbook-\d{8}T\d{6}Z',remote):
                raise RuntimeError('Verified backup required')
            sftp=client.open_sftp()
            for name in ['realign-accounts.ts','coa-workbook-plan.json']:
                sftp.put(str(root.parent/'nvccz/scripts'/name),remote+'/'+name)
            sftp.close()
            inner='/app/scripts/coa-realignment-20261020'
            commands=[f"cd {shlex.quote(remote)}",'sha256sum -c SHA256SUMS',f'docker exec nvccz-prod-api-1 mkdir -p {inner}/evidence']
            for name in ['realign-accounts.ts','coa-workbook-plan.json']:
                commands.append(f'docker cp {shlex.quote(remote+"/"+name)} nvccz-prod-api-1:{inner}/{name}')
            if args.operation in ('execute','rehearse'):
                if not args.expected_hash or not re.fullmatch('[0-9a-f]{64}',args.expected_hash):
                    raise RuntimeError('Exact dry-run hash required')
                commands.append(f'docker exec nvccz-prod-api-1 touch {inner}/evidence/BACKUP_VERIFIED')
            run=f'docker exec -w /app nvccz-prod-api-1 node node_modules/ts-node/dist/bin.js --transpile-only {inner}/realign-accounts.ts --{args.operation} --plan {inner}/coa-workbook-plan.json --evidence {inner}/evidence'
            if args.expected_hash:
                run+=' --expected-hash '+shlex.quote(args.expected_hash)
            commands.append(run)
            commands.append(f'mkdir -p {shlex.quote(remote+"/runner-evidence")}; docker cp nvccz-prod-api-1:{inner}/evidence/. {shlex.quote(remote+"/runner-evidence")}; chmod -R go-rwx {shlex.quote(remote+"/runner-evidence")}')
            command='set -e; '+'; '.join(commands)
        else:
            sql = Path(args.sql_file).read_text(encoding='utf-8')
            import re
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            if not statements or any(not re.match(r'^(SELECT|SHOW|DESCRIBE|EXPLAIN)\b', s, re.I) for s in statements):
                raise RuntimeError('Read-only helper accepts SELECT/SHOW/DESCRIBE/EXPLAIN only')
            command = "docker exec -i nvccz-prod-mysql-1 sh -c 'MYSQL_PWD=\"$MYSQL_ROOT_PASSWORD\" mysql -uroot --default-character-set=utf8mb4 --batch --raw nvccz_prod'"
        stdin, stdout, stderr = client.exec_command(command, timeout=600)
        if args.mode == 'backup':
            stdin.write(r'''set -euo pipefail
umask 077
backup_dir="/var/www/projects/nvccz/backups/coa-workbook-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
docker exec nvccz-prod-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --events --hex-blob --no-tablespaces --set-gtid-purged=OFF --databases nvccz_prod' | gzip > "$backup_dir/nvccz_prod.sql.gz"
test -s "$backup_dir/nvccz_prod.sql.gz"
gzip -t "$backup_dir/nvccz_prod.sql.gz"
gzip -cd "$backup_dir/nvccz_prod.sql.gz" | tail -n 5 | grep -q 'Dump completed'
cd "$backup_dir"
sha256sum nvccz_prod.sql.gz > SHA256SUMS
sha256sum -c SHA256SUMS
printf 'BACKUP_DIRECTORY=%s\n' "$backup_dir"
stat -c 'BACKUP_BYTES=%s' nvccz_prod.sql.gz
cat SHA256SUMS
printf 'TABLE_DEFINITIONS='
gzip -cd nvccz_prod.sql.gz | grep -c '^CREATE TABLE'
printf 'LIVE_TABLES='
docker exec nvccz-prod-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\"nvccz_prod\" AND table_type=\"BASE TABLE\""'
printf 'BACKUP_VERIFIED\n'
''')
        elif args.mode == 'sql':
            stdin.write(sql)
        stdin.channel.shutdown_write()
        result = stdout.read().decode('utf-8', errors='replace')
        errors = stderr.read().decode('utf-8', errors='replace')
        code = stdout.channel.recv_exit_status()
        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            Path(args.output).write_text(result, encoding='utf-8')
        print('Saved output: ' + args.output if args.output and args.mode in ('sql','realign') else result)
        if errors:
            print(errors)
        if code:
            raise SystemExit(code)
    finally:
        client.close()

if __name__ == '__main__':
    main()
