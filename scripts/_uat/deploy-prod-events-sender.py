"""Deploy only the compiled mail files needed to enforce the Events sender."""
from pathlib import Path
import re, subprocess, time, paramiko, shlex

started=time.monotonic()
ui=Path(__file__).resolve().parents[2]
api=ui.parent/'nvccz'
handoff=Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt')
row=next(x for x in handoff.read_text(encoding='utf-8-sig').splitlines() if x.startswith('| NVCCZ production SSH |'))
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('102.217.49.126',port=3131,username='user',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=20)
c.get_transport().set_keepalive(20)
def run(command):
    _,out,err=c.exec_command(command,timeout=300)
    result=out.read().decode(errors='replace'); error=err.read().decode(errors='replace')
    if out.channel.recv_exit_status(): raise RuntimeError(error[-1200:] + result[-800:])
    return result.strip()

base='/var/www/projects/nvccz'
s=c.open_sftp()
remote_source=base+'/src/api/src'
files=['config/email.config.ts','services/EmailNotificationService.ts']
release=ui/'.acc-dumps/events-sender-release';release.mkdir(exist_ok=True)
for name in files:
    local=api/'src'/name
    (release/name).parent.mkdir(parents=True,exist_ok=True)
    (release/name).write_bytes(local.read_bytes())
    compiled=release/(name[:-3]+'.js')
    compiled.parent.mkdir(parents=True,exist_ok=True)
    compiler="const fs=require('fs'),ts=require('typescript');fs.writeFileSync(process.argv[2],ts.transpileModule(fs.readFileSync(process.argv[1],'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText);"
    subprocess.run(['node','-e',compiler,str(release/name),str(compiled)],cwd=api,check=True)

stamp=time.strftime('%Y%m%d-%H%M%S')
backup=base+'/backups/events-sender-'+stamp
run('mkdir -p '+backup+' && chmod 700 '+backup)
for name in files:
    remote=remote_source+'/'+name
    with s.file(remote,'rb') as f: old=f.read()
    with s.file(backup+'/'+name.replace('/','-'),'wb') as f:f.write(old)
    s.chmod(backup+'/'+name.replace('/','-'),0o600)
    s.put(str(release/name),remote)

env_path=base+'/secrets/prod.env'
with s.file(env_path,'rb') as f: prod_env=f.read().decode()
line='EMAIL_FROM_ADDRESS_EVENTS=events@matanho.com'
prod_env=re.sub(r'^EMAIL_FROM_ADDRESS_EVENTS=.*$',line,prod_env,flags=re.M) if re.search(r'^EMAIL_FROM_ADDRESS_EVENTS=',prod_env,re.M) else prod_env+'\n'+line+'\n'
with s.file(backup+'/prod.env','wb') as f:f.write(prod_env.encode())
with s.file(env_path,'w') as f:f.write(prod_env)
s.chmod(env_path,0o600)

image='nvccz-prod-api:latest'
run('docker tag '+image+' nvccz-prod-api:before-events-sender-'+stamp)
remote_tmp='/tmp/events-sender-'+stamp
run('mkdir -m 700 '+remote_tmp)
for name in files:
    for ext in ['.ts','.js']:
        s.put(str(release/(name[:-3]+ext)),remote_tmp+'/'+name.replace('/','-')+ext)
dockerfile='FROM '+image+'\n'
for name in files:
    flat=name.replace('/','-')
    dockerfile+=f'COPY {flat}.ts /app/src/{name}\nCOPY {flat}.js /app/dist/{name[:-3]}.js\n'
with s.file(remote_tmp+'/Dockerfile','w') as f:f.write(dockerfile)
run('docker build -t '+image+' '+remote_tmp)
run('cd '+base+'/compose && docker compose --env-file ../secrets/prod.env -f docker-compose.prod.yml up -d --no-build --no-deps api')
for _ in range(30):
    try:
        health=run('curl -fsS http://127.0.0.1:3209/health')
        break
    except RuntimeError: time.sleep(3)
else: raise RuntimeError('Production API did not become healthy')
check="""const {getFromAddress}=require('/app/dist/config/email.config');const fs=require('fs');const src=fs.readFileSync('/app/dist/services/EmailNotificationService.js','utf8');const event=getFromAddress('events');if(event.address!=='events@matanho.com'||event.name!=='ZB Events Team')throw Error('Events sender invalid');const i=src.indexOf('sendBudgetApprovalEmail');const block=src.slice(i,i+1000);if(!/getFromAddress\\([\"']events[\"']\\)/.test(block))throw Error('Budget email still uses a non-events sender');console.log(JSON.stringify(event));"""
sender=run('docker exec nvccz-prod-api-1 node -e '+shlex.quote(check))
print(health);print('Verified event sender:',sender);print('Completed in',round(time.monotonic()-started),'seconds')
s.close();c.close()
