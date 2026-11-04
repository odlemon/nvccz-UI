"""Update only production's mail config; credentials stay in protected env files."""
from pathlib import Path
import json, re, subprocess, time, paramiko

started=time.monotonic()
root=Path(__file__).resolve().parents[2]
local_env=(root.parent/'nvccz/.env').read_text(encoding='utf-8-sig')
def env_value(key):
    return re.search(r'^'+re.escape(key)+r'=(.*)$',local_env,re.M).group(1).strip().strip('"')
values={k:env_value(k) for k in ['ZEPTO_SMTP_KEY','ZEPTO_SMTP_HOST','ZEPTO_SMTP_USER','EMAIL_FROM_ADDRESS','EMAIL_FROM_NAME_EVENTS','MAIL_PROVIDER']}
row=next(x for x in Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt').read_text(encoding='utf-8-sig').splitlines() if x.startswith('| NVCCZ production SSH |'))
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('102.217.49.126',port=3131,username='user',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=20)
c.get_transport().set_keepalive(20)
def run(cmd, payload=None):
    stdin,out,err=c.exec_command(cmd,timeout=300)
    if payload is not None:
        stdin.write(payload);stdin.flush();stdin.channel.shutdown_write()
    output=out.read().decode(errors='replace');error=err.read().decode(errors='replace')
    if out.channel.recv_exit_status():
        raise RuntimeError('Production mail step failed: '+error[-1200:]+output[-800:])
    return output.strip()

preflight="""const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));const t=require('nodemailer').createTransport({host:d.ZEPTO_SMTP_HOST,port:587,secure:false,requireTLS:true,auth:{user:d.ZEPTO_SMTP_USER,pass:d.ZEPTO_SMTP_KEY},tls:{rejectUnauthorized:true},connectionTimeout:20000,socketTimeout:30000});t.verify().then(()=>console.log('Production SMTP authentication verified')).catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>t.close());"""
import shlex
print(run('docker exec -i nvccz-prod-api-1 node -e '+shlex.quote(preflight),json.dumps(values)),flush=True)
s=c.open_sftp()
base='/var/www/projects/nvccz'
source=base+'/src/api/src/config/email.config.ts'
env_path=base+'/secrets/prod.env'
with s.file(source,'rb') as f: original=f.read()
updated=original.decode('utf-8')
updated=re.sub(r'pass: "[^"\r\n]+",','pass: process.env.ZEPTO_SMTP_KEY?.trim() || "",',updated,count=1)
updated=updated.replace('host: "smtp.zeptomail.com",','host: process.env.ZEPTO_SMTP_HOST?.trim() || "smtp.zeptomail.com",',1)
updated=updated.replace('user: "emailapikey",','user: process.env.ZEPTO_SMTP_USER?.trim() || "emailapikey",',1)
updated=updated.replace('rejectUnauthorized: false','rejectUnauthorized: true',1)
updated=updated.replace('SMTP credentials are hardcoded (ZeptoMail) for now','SMTP credentials come from the protected environment (ZeptoMail)')
if 'process.env.ZEPTO_SMTP_KEY' not in updated: raise RuntimeError('Config patch did not apply')
local=root/'.acc-dumps/prod-mail-release';local.mkdir(exist_ok=True)
(local/'email.config.ts').write_text(updated,encoding='utf-8')
compile_js="const fs=require('fs'),ts=require('typescript');fs.writeFileSync(process.argv[2],ts.transpileModule(fs.readFileSync(process.argv[1],'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText);"
subprocess.run(['node','-e',compile_js,str(local/'email.config.ts'),str(local/'email.config.js')],cwd=root.parent/'nvccz',check=True)
with s.file(env_path,'rb') as f: old_env=f.read()
new_env=old_env.decode('utf-8')
for k,v in values.items():
    pattern=r'^'+re.escape(k)+r'=.*$'
    new_env=re.sub(pattern,lambda m:k+'='+v,new_env,flags=re.M) if re.search(pattern,new_env,re.M) else new_env+'\n'+k+'='+v+'\n'
stamp=time.strftime('%Y%m%d-%H%M%S')
backup=base+'/backups/mail-'+stamp
print(run('mkdir -p '+backup+'; chmod 700 '+backup),flush=True)
for name,content in [('email.config.ts',original),('prod.env',old_env)]:
    with s.file(backup+'/'+name,'wb') as f:f.write(content)
    s.chmod(backup+'/'+name,0o600)
digest="const f=require('fs'),c=require('crypto'),p=require('path');const h=c.createHash('sha256');function walk(x){if(!f.existsSync(x))return;if(f.statSync(x).isDirectory()){for(const n of f.readdirSync(x).sort())walk(p.join(x,n));}else{h.update(x);h.update(f.readFileSync(x));}}for(const x of ['/app/dist','/app/src','/app/package.json','/app/package-lock.json','/app/deploy'])walk(x);console.log(h.digest('hex'));"
running_digest=run('docker exec nvccz-prod-api-1 node -e '+shlex.quote(digest))
candidate_digest=run('docker run --rm --network none --entrypoint node nvccz-prod-api:latest -e '+shlex.quote(digest))
if running_digest!=candidate_digest:raise RuntimeError('Available image differs from running production; stopped')
image_id='nvccz-prod-api:latest'
run('docker tag '+image_id+' nvccz-prod-api:before-mail-'+stamp)
release='/tmp/nvccz-mail-'+stamp
run('mkdir -m 700 '+release)
for name in ['email.config.ts','email.config.js']:
    s.put(str(local/name),release+'/'+name)
dockerfile=f'FROM {image_id}\nCOPY email.config.ts /app/src/config/email.config.ts\nCOPY email.config.js /app/dist/config/email.config.js\n'
with s.file(release+'/Dockerfile','w') as f:f.write(dockerfile)
print(run('docker build -t nvccz-prod-api:latest '+release)[-1000:],flush=True)
# Persist the same source change for future normal builds.
with s.file(source,'w') as f:f.write(updated)
with s.file(env_path,'w') as f:f.write(new_env)
s.chmod(env_path,0o600)
print(run('cd '+base+'/compose && docker compose --env-file ../secrets/prod.env -f docker-compose.prod.yml up -d --no-build --no-deps api'),flush=True)
for attempt in range(36):
    try:
        print(run('curl -fsS http://127.0.0.1:3209/health'),flush=True)
        break
    except RuntimeError:
        if attempt==35:raise
        time.sleep(3)
message=json.loads((root/'.acc-dumps/zepto-test-message.json').read_text(encoding='utf-8'))
test="""const fs=require('fs');const m=JSON.parse(fs.readFileSync(0,'utf8'));const {emailTransport,getFromAddress}=require('/app/dist/config/email.config');(async()=>{const from=getFromAddress('events');if(from.address!=='events@matanho.com'||from.name!=='ZB Events Team')throw Error('Unexpected production sender');await emailTransport.verify();const r=await emailTransport.sendMail({from,to:'nyashakarata1@gmail.com',subject:'Save the date: ZB - ZB Events (production sender test)',html:m.html,attachments:m.attachments});if(!r.accepted?.includes('nyashakarata1@gmail.com'))throw Error('Recipient not accepted');console.log(JSON.stringify({from,accepted:r.accepted,messageId:r.messageId,response:r.response}));})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>emailTransport.close());"""
print(run('docker exec -i nvccz-prod-api-1 node -e '+shlex.quote(test),json.dumps(message)),flush=True)
print(run('curl -fsS https://api.nvccz.online/health; docker ps --format "{{.Names}} {{.Status}}" --filter name=nvccz-prod-'),flush=True)
print('Production ZeptoMail deployment and test complete in '+str(round(time.monotonic()-started))+' seconds',flush=True)
s.close();c.close()
