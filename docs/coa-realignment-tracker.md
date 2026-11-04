# Workbook COA realignment

## Scope and authorization

The owner explicitly authorizes in-place correction of the test dataset in the stack named `nvccz-prod` on `102.217.49.126:3131`. The authoritative source is `C:/Users/lysp/Downloads/NVCCZ Chart-of-Accounts.xlsx`, superseding the PDF mapping. Preserve monetary values, dates, currencies and unrelated data; create no adjustment journals. Credentials must not enter evidence files.

## Phases

| Phase | Status | Evidence / remaining work |
|---|---|---|
| Target and full backup | Completed | SSH host verified from known_hosts; MySQL 8.0.46, `nvccz_prod`; fresh dump verified, 582/582 table definitions. See below. Restore rehearsal not yet performed. |
| Complete workbook and semantic mapping | Completed | 88 workbook rows mapped; 66 additions; supplementary accounts retained, including 1550 as contra-asset under 1010. |
| Dependency inspection | Completed | Journal lines and assets use stable COA IDs; 1,938 ledger lines and 33 assets verified; no unsupported dependencies. |
| Transactional correction script | Completed | `C:/Users/lysp/Downloads/nvccz/scripts/realign-accounts.ts`; temp-code collision handling, single transaction, dry-run, rehearsal, execute, verify. |
| Target dry run and baseline | Completed | Target `nvccz_prod` on MySQL host `76266d61f7d4`; 66 creates, 38 updates; expected hash `37124eab2964d213a820d33fb58cdad4307f8665e6cfb022a3a6c3bbc606cd86`. |
| Execute and independently reconcile | Completed | Commit succeeded; rollback rehearsal succeeded first. Posted USD DR/CR remained 1,632,795.820; VOID USD DR/CR remained 1,574,104.080. |
| Application verification | Completed | Read-only production comparison: 121 active accounts; all 88 workbook accounts present with zero name/type mismatches. Statutory liability hierarchy 2170–2174 confirmed; journal totals and zero orphan references confirmed. HTTPS/API deployment verification also passed. |

## Execution notes

- Previous refusals based solely on the environment name are not a technical restriction. This task has specific owner authorization.
- Historical audit output from earlier turns is not treated as current state.
- Workbook ambiguities must be resolved from account and transaction evidence, or identified precisely before any correction is committed.

## Fresh backup

- Server timestamp: 2026-10-20 21:46:47 UTC.
- Directory: `/var/www/projects/nvccz/backups/coa-workbook-20261020T214647Z`.
- File: `nvccz_prod.sql.gz`, 374477 bytes.
- SHA-256: `2177f443b64f00a33631b7ce4467993ca642a489e9d98ebd099d23c02eb04ad2`.
- mysqldump with single transaction, routines, triggers, events and hex blobs succeeded; gzip integrity, dump completion marker and SHA-256 verification succeeded.
- 582 CREATE TABLE definitions match 582 live base tables. Full dump retained on server with restrictive file permissions. No credentials in the evidence.
- Command: `python scripts/coa-remote-audit.py backup --output docs/coa-backup-verification.txt`.
- Restore on the target server during an exclusive maintenance window (includes all data as of backup and discards subsequent writes):

```bash
set -euo pipefail
cd /var/www/projects/nvccz/backups/coa-workbook-20261020T214647Z
sha256sum -c SHA256SUMS
gzip -t nvccz_prod.sql.gz
gzip -cd nvccz_prod.sql.gz | docker exec -i nvccz-prod-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot --default-character-set=utf8mb4'
```

- Restore has NOT been executed. Application writers and scheduled writers must be stopped before a restore and restarted only after reconciliation.
- First audit query batch stopped on a reserved SQL alias (`lines`); corrected to `line_count` and rerun. Earlier statements were SELECT only.

## Post-deployment verification — 2026-10-21

- Production comparison query: `scripts/coa-prod-verification.sql`; captured in `docs/coa-prod-verification.tsv`.
- Workbook comparison: 88/88 workbook accounts present, 0 missing, 0 name/type mismatches.
- Active account population: 121 active accounts; supplementary accounts remain alongside the workbook structure.
- Income-statement payroll group: 6000 Salaries and Wages; 6010 Gross Salaries; 6020 Other Employee Benefits; 6030 NSSA; 6040 PAYE; 6050 ZIMDEF; 6060 Standards Development Levy.
- Balance-sheet statutory group: 2170 Statutory Payments with 2171 ZIMDEF Payable, 2172 Standard Development Levy Payable, 2173 ZIMRA Payable, and 2174 PAYE Payable as current-liability children.
- Ledger checks: POSTED USD debit/credit 1,632,795.820 each; VOID USD debit/credit 1,574,104.080 each; orphan journal lines 0.
