from pathlib import Path
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')
row=next(x for x in Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt').read_text(encoding='utf-8-sig').splitlines() if x.startswith('| Singapore dev SSH |'))
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('207.180.234.151',username='root',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=20)
if '--save-heading' in sys.argv:
    if '--verify' in sys.argv:
        _,out,err=c.exec_command("docker exec arcus-dev-api-1 sha256sum /app/src/assets/events/zb-gala-save-title-wide.jpg; docker exec arcus-dev-api-1 sh -c 'grep -l \"height:74px\" /app/dist/services/EmailNotificationService.js'; curl -fsS https://dev-api.matanho.com/health",timeout=30)
        print(out.read().decode());print(err.read().decode())
    _,out,err=c.exec_command("tail -n 14 /opt/arcus-dev/logs/save-heading.log; if test -f /opt/arcus-dev/logs/save-heading.exit; then printf 'DEPLOY_EXIT='; cat /opt/arcus-dev/logs/save-heading.exit; fi; docker ps --format '{{.Names}} {{.Status}}' | grep -E '^arcus-dev-(api|ui-events|ui-staff|upload)-'",timeout=30)
    print(out.read().decode());print(err.read().decode())
    _,out,err=c.exec_command("ps -eo pid,etime,%cpu,%mem,comm --sort=-%cpu | head -6; free -m | head -2",timeout=20)
    print(out.read().decode());c.close();sys.exit(0)
if '--guest-details' in sys.argv:
    _,out,err=c.exec_command("tail -n 12 /opt/arcus-dev/logs/guest-details.log; if test -f /opt/arcus-dev/logs/guest-details.exit; then printf 'DEPLOY_EXIT='; cat /opt/arcus-dev/logs/guest-details.exit; fi; docker ps --format '{{.Names}} {{.Status}}' | grep -E '^arcus-dev-(api|ui-events|ui-staff|upload)-'",timeout=30)
    print(out.read().decode());print(err.read().decode());c.close();sys.exit(0)
if '--sample' in sys.argv:
    script="const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const g=await p.eventGuest.findFirst({where:{event:{isActive:true}},orderBy:{createdAt:'desc'},select:{eventId:true,invitationToken:true}});console.log(JSON.stringify(g));await p.$disconnect()})().catch(()=>process.exit(1));"
    s=c.open_sftp()
    with s.file('/tmp/events-read-sample.cjs','w') as f:f.write(script)
    s.close()
    _,sample,err=c.exec_command('docker cp /tmp/events-read-sample.cjs arcus-dev-api-1:/app/events-read-sample.cjs && docker exec arcus-dev-api-1 node /app/events-read-sample.cjs',timeout=30)
    content=sample.read().decode().strip()
    if sample.channel.recv_exit_status(): raise RuntimeError('Sample read failed')
    (Path(__file__).resolve().parents[2]/'.acc-dumps/dev-event-sample.json').write_text(content)
    print('Read an existing guest token for a view-only deployed UI check')
if '--activate-api' in sys.argv or '--activate-events' in sys.argv:
    service='ui-events' if '--activate-events' in sys.argv else 'api'
    _,activation,errors=c.exec_command(f'cd /opt/arcus-dev && docker compose -p arcus-dev --env-file secrets/dev.env -f compose/docker-compose.yml up -d --no-deps {service}',timeout=60)
    print(activation.read().decode());print(errors.read().decode())
    if activation.channel.recv_exit_status(): raise RuntimeError('Service activation failed')
_,out,err=c.exec_command("tail -n 14 /opt/arcus-dev/logs/events-current.log; if test -f /opt/arcus-dev/logs/events-current.exit; then printf 'DEPLOY_EXIT='; cat /opt/arcus-dev/logs/events-current.exit; fi; docker ps --format '{{.Names}} {{.Status}}' | grep -E '^arcus-dev-(api|ui-events|ui-staff|upload)-'; free -m | head -2; ps -eo pid,etime,%cpu,%mem,comm --sort=-%cpu | head -5",timeout=30)
print(out.read().decode()); print(err.read().decode()); c.close()
