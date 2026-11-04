from pathlib import Path
import paramiko, re
handoff=Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt')
row=next(x for x in handoff.read_text(encoding='utf-8-sig').splitlines() if x.startswith('| NVCCZ production SSH |'))
host=re.findall(r'(?:\d{1,3}\.){3}\d{1,3}',row)[0]
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(host,port=3131,username='user',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=20)
digest="const f=require('fs'),c=require('crypto'),p=require('path');const h=c.createHash('sha256');function walk(x){if(!f.existsSync(x))return;if(f.statSync(x).isDirectory()){for(const n of f.readdirSync(x).sort())walk(p.join(x,n));}else{h.update(x);h.update(f.readFileSync(x));}}for(const x of ['/app/dist','/app/src','/app/package.json','/app/package-lock.json','/app/deploy'])walk(x);console.log(h.digest('hex'));"
import shlex
cmd='docker exec nvccz-prod-api-1 node -e '+shlex.quote(digest)+'; docker run --rm --network none --entrypoint node nvccz-prod-api:latest -e '+shlex.quote(digest)
_,out,err=c.exec_command(cmd,timeout=30)
print(out.read().decode());print(err.read().decode());c.close()
