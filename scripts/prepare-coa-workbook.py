"""Extract complete workbook and build explicit, reviewable semantic mappings."""
import csv
import hashlib
import json
import re
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
source = root.parent / 'NVCCZ Chart-of-Accounts.xlsx'
formulas = openpyxl.load_workbook(source, data_only=False)
cached = openpyxl.load_workbook(source, data_only=True)
accounts = []
for sheet in formulas:
    resolved = {}
    parent = None
    for row in sheet.iter_rows():
        code, name, kind, statement = [c.value for c in row[:4]]
        if isinstance(code, str) and code.startswith('='):
            match = re.fullmatch(r'=\+?(A\d+)\+(\d+)', code)
            if not match:
                raise ValueError(f'Unsupported formula {sheet.title}!{row[0].coordinate}: {code}')
            code = resolved[match[1]] + int(match[2])
            if cached[sheet.title][row[0].coordinate].value != code:
                raise ValueError('Formula and cached code disagree')
        if not isinstance(code, (int, float)):
            continue
        resolved[row[0].coordinate] = int(code)
        if sheet.title == 'Income Statement' and not kind:
            parent = str(int(code))
        kind = kind or 'Expense'
        accounts.append(dict(accountNo=str(int(code)), accountName=name.strip(), accountType=kind,
                             financialStatement=statement or 'Income Statement',
                             naturalBalance='CREDIT' if kind in ('Revenue','Liability','Equity') else 'DEBIT',
                             parentNo=None if str(int(code)) == parent or sheet.title == 'Balance Sheet' else parent,
                             source=f'{sheet.title}!A{row[0].row}:D{row[0].row}'))

lines = (root / 'docs/coa-target-inspection.tsv').read_text(encoding='utf-8').splitlines()
start = next(i for i,s in enumerate(lines) if s.startswith('id\taccountNo\t'))
end = next(i for i in range(start+1,len(lines)) if lines[i].startswith('status\tcurrencyId'))
current = list(csv.DictReader(lines[start:end], delimiter='\t'))
target = {a['accountNo']: a for a in accounts}
# Explicit semantic mappings; untouched operational accounts are supplementary.
recodes = {'1000':'1350','1010':'1351','1030':'1352','1100':'1353',
           '1125':'1321','1200':'1320','1210':'1322','1220':'1323',
           '1300':'1300','1510':'1010','2000':'2000','2100':'2101',
           '3000':'3000','3100':'3100','4000':'4001','4010':'4200',
           '4050':'5191','4100':'4300','5010':'6010','5030':'6000',
           '5060':'9000','5070':'7000','5090':'5000','5130':'5270',
           '5200':'5230','5620':'6020','5630':'6030','5640':'6040',
           '5650':'6050','5660':'6060','6000':'5190','6050':'5192'}
merges = {'5600':'5030','5610':'5010'}
parents = {'1010':'1350','1030':'1350','1100':'1350','1101':'1320',
           '1125':'1320','1210':'1320','1220':'1320','1550':'1010',
           '4050':'5190','6050':'5190','5095':'5000','6095':'5000'}
by_old = {a['accountNo']:a for a in current}
mapping = []
for a in current:
    old = a['accountNo']
    new = recodes.get(old, old)
    spec = target.get(new) if old in recodes else None
    # Supplementary rows preserve their semantic names and type. Canonical workbook
    # rows use the exact supplied labels, including 'Expenses' in 7xxx/8xxx/9xxx.
    after = {k: (spec[k] if spec else a[k]) for k in ['accountName','accountType','financialStatement','naturalBalance']}
    after.update(accountNo=new, isActive=old not in merges, parentNo=spec['parentNo'] if spec else parents.get(old))
    if not spec and old not in parents:
        p = next((x for x in current if x['id']==a['parentId']), None)
        after['parentNo'] = recodes.get(p['accountNo'],p['accountNo']) if p else None
    if old == '1550':
        after.update(accountType='Contra-Asset', naturalBalance='CREDIT')
    mapping.append(dict(id=a['id'], before={k:a[k] for k in ['accountNo','accountName','accountType','financialStatement','naturalBalance','parentId']},
                        after=after, mergeIntoId=by_old[merges[old]]['id'] if old in merges else None,
                        journalLines=int(a['journal_lines']), debit=a['debit'], credit=a['credit'],
                        action='merge references and retire duplicate' if old in merges else 'workbook alignment' if spec else 'retain supplementary account'))
spec = dict(source=str(source), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
            expectedDatabase='nvccz_prod', supplementalAccountsAuthorized=True, workbook=accounts, mapping=mapping)
dest = root.parent / 'nvccz/scripts/coa-workbook-plan.json'
dest.write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
rows = ['# Workbook account mapping','',f'Source: `{source}`. SHA-256 `{spec["sourceSha256"]}`.',
        '', 'Owner confirmed retention of supplementary accounts, including 1550 as a contra-asset under 1010 PPE.',
        '', '| Existing ID | Current code and meaning | Target code and meaning | Type | Journal lines | Action |',
        '|---|---|---|---|---|---:|---|']
for m in mapping:
    rows.append(f'| {m["id"]} | {m["before"]["accountNo"]} {m["before"]["accountName"]} | {m["after"]["accountNo"]} {m["after"]["accountName"]} | {m["after"]["accountType"]} | {m["journalLines"]} | {m["action"]} |')
rows += ['', '## Workbook additions','', '| Code | Name | Type | Parent | Source cells |','|---|---|---|---|---|']
used = {m['after']['accountNo'] for m in mapping if m['after']['isActive']}
for a in accounts:
    if a['accountNo'] not in used:
        rows.append(f'| {a["accountNo"]} | {a["accountName"]} | {a["accountType"]} | {a["parentNo"] or "—"} | {a["source"]} |')
rows += ['', '## Interpretation and scope', '',
         '- Same-number collisions are resolved through temporary codes inside the correction transaction.',
         '- 1550 is not repurposed as an expense. It retains its contra-asset meaning and journal references.',
         '- 5130 Depreciation Expense becomes workbook 5270 Depreciation with the same ID.',
         '- 5600 duplicate payroll parent merges into existing Salaries and Wages (5030 → 6000); 5610 duplicate Gross Salaries merges into existing gross-pay account (5010 → 6010). Original duplicate account rows are retained inactive.',
         '- Sales revenue is retained at supplementary 4001; it is not relabeled Grant Income. Workbook 4000 Grant Income is created separately.',
         '- Existing FX accounts remain distinguishable under workbook 5190 Exchange Gains/Losses.',
         '- Both workbook Canteen rows (5100 and 5290) are retained, distinguished by code. No historical postings currently require allocation between them.',
         '- Existing statutory liability accounts and their hierarchy remain as approved supplementary accounts.',
         '- Application report classification and every live reference must be checked before executing this plan.']
(root/'docs/coa-mapping.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
print(json.dumps(dict(workbookAccounts=len(accounts),existingAccounts=len(mapping),newAccounts=len(set(target)-used),plan=str(dest))))
