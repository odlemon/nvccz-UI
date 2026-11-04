from pathlib import Path
import paramiko, re, shlex
row=next(x for x in Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt').read_text(encoding='utf-8-sig').splitlines() if x.startswith('| NVCCZ production SSH |'))
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('102.217.49.126',port=3131,username='user',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=20)
check="""const {getFromAddress}=require('/app/dist/config/email.config');const fs=require('fs');const src=fs.readFileSync('/app/dist/services/EmailNotificationService.js','utf8');const event=getFromAddress('events');const i=src.indexOf('sendBudgetApprovalEmail');const block=src.slice(i,i+5000);console.log(JSON.stringify({event,budgetUsesEvents:/getFromAddress\\)\\([\"']events[\"']\\)/.test(block),hasKhayalami: /khayalami/i.test(block)}));"""
_,out,err=c.exec_command('docker exec nvccz-prod-api-1 node -e '+shlex.quote(check),timeout=30)
print(out.read().decode());print(err.read().decode())
_,out,err=c.exec_command("curl -fsS http://127.0.0.1:3209/health; docker ps --format '{{.Names}} {{.Status}}' --filter name=nvccz-prod-",timeout=30)
print(out.read().decode());print(err.read().decode());c.close()
