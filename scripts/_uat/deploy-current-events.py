"""Transfer only the Events changes, then run the existing cached dev release."""
from pathlib import Path
import io, tarfile, paramiko, time

ui=Path(__file__).resolve().parents[2]
api=ui.parent/'nvccz'
handoff=Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt')
row=next(x for x in handoff.read_text(encoding='utf-8-sig').splitlines() if x.startswith('| Singapore dev SSH |'))
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('207.180.234.151',username='root',password=row.split('|')[3].strip().strip('`'),look_for_keys=False,allow_agent=False,timeout=25)
c.get_transport().set_keepalive(20)
def run(cmd):
    _,out,err=c.exec_command(cmd,timeout=60)
    result=out.read().decode();error=err.read().decode();status=out.channel.recv_exit_status()
    if status: raise RuntimeError(f'Remote step failed ({status}): {error[-600:]}')
    print(result[-1800:],flush=True)
    return result
run("docker ps --format '{{.Names}} {{.Status}}' | grep '^arcus-dev-' ; free -m | head -2")
api_files=['prisma/schema.prisma','src/config/email.config.ts','src/controllers/EventController.ts','src/routes/eventRoutes.ts','src/routes/publicMediaRoutes.ts','src/services/EmailNotificationService.ts','src/services/EventService.ts','src/services/RemoteUploadService.ts','src/utils/emailBranding.ts','src/utils/newsletterEmailLayout.ts','src/utils/eventsPortal.ts']
api_files += [str(p.relative_to(api)).replace('\\','/') for p in (api/'src/assets/events').iterdir() if p.is_file()]
api_files += [str(p.relative_to(api)).replace('\\','/') for folder in ['20261022120000_event_invitation_tracking','20261022130000_event_announcement_tracking'] for p in (api/'prisma/migrations'/folder).iterdir() if p.is_file()]
ui_files=['components/events/add-guest-dialog.tsx','components/events/bulk-upload-guests-dialog.tsx','components/events/create-event-wizard.tsx','components/events/event-detail-tabs/event-guests-tab.tsx','components/events/rsvp-page.tsx','lib/api/events-api.ts','lib/store/slices/eventsSlice.ts']
ui_files += [str(p.relative_to(ui)).replace('\\','/') for p in (ui/'public/events').iterdir() if p.is_file()]
buffer=io.BytesIO()
with tarfile.open(fileobj=buffer,mode='w:gz') as archive:
    for root,files,prefix in [(api,api_files,'src/api'),(ui,ui_files,'src/ui')]:
        for name in files: archive.add(root/name,arcname=f'{prefix}/{name}')
buffer.seek(0)
s=c.open_sftp();stamp=time.strftime('%Y%m%d-%H%M%S');remote=f'/tmp/events-{stamp}.tar.gz'
s.putfo(buffer,remote)
print(f'Transferred {len(api_files)+len(ui_files)} Events files ({buffer.getbuffer().nbytes//1024} KB)',flush=True)
run(f"mkdir -p /opt/arcus-dev/backups; tar -czf /opt/arcus-dev/backups/events-{stamp}.tar.gz -C /opt/arcus-dev src/api/src/assets/events src/api/src/services/EventService.ts src/api/src/services/EmailNotificationService.ts src/api/prisma/schema.prisma src/ui/components/events src/ui/lib/api/events-api.ts src/ui/lib/store/slices/eventsSlice.ts; tar -xzf {remote} -C /opt/arcus-dev")
with s.file('/opt/arcus-dev/deploy-dev-events.sh','w') as f: f.write((ui/'deploy/arcus/deploy-dev-events.sh').read_text().replace('\r\n','\n'))
s.chmod('/opt/arcus-dev/deploy-dev-events.sh',0o755)
columns={'invitationSentAt':'DATETIME(3) NULL','deliveryStatus':"VARCHAR(191) NOT NULL DEFAULT 'PENDING'",'deliveryError':'TEXT NULL','openedAt':'DATETIME(3) NULL','lastOpenedAt':'DATETIME(3) NULL','openCount':'INTEGER NOT NULL DEFAULT 0','announcementSentAt':'DATETIME(3) NULL','announcementDeliveryStatus':"VARCHAR(191) NOT NULL DEFAULT 'PENDING'",'announcementDeliveryError':'TEXT NULL','anniversaryVideoUrl':'TEXT NULL','videoConsentAt':'DATETIME(3) NULL'}
import json
sqlscript="const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); (async()=>{const existing=await p.$queryRawUnsafe('SHOW COLUMNS FROM event_guests'); const names=new Set(existing.map(x=>x.Field));const columns="+json.dumps(columns)+"; for(const [name,type] of Object.entries(columns)){if(!names.has(name)){await p.$executeRawUnsafe('ALTER TABLE event_guests ADD COLUMN `'+name+'` '+type);console.log('Added',name)}}await p.$disconnect();})().catch(e=>{console.error(e.message);process.exit(1)});"
with s.file('/tmp/events-additive-schema.cjs','w') as f:f.write(sqlscript)
run('docker cp /tmp/events-additive-schema.cjs arcus-dev-api-1:/app/events-additive-schema.cjs && docker exec arcus-dev-api-1 node /app/events-additive-schema.cjs')
run("nohup bash -c 'cd /opt/arcus-dev; ./deploy-dev-events.sh > /opt/arcus-dev/logs/events-current.log 2>&1; echo $? > /opt/arcus-dev/logs/events-current.exit' </dev/null >/dev/null 2>&1 & echo 'Cached Events deployment started' ")
s.close();c.close()
