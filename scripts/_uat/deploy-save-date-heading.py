from pathlib import Path
import paramiko, time, sys

sys.stdout.reconfigure(encoding='utf-8')
started = time.monotonic()
root = Path(__file__).resolve().parents[2]
row = next(x for x in Path(r'C:\Users\lysp\.codex-vscode\attachments\db8834e9-fff2-42b6-b8b3-a8d9bded2392\Pasted text.txt').read_text(encoding='utf-8-sig').splitlines() if x.startswith('| Singapore dev SSH |'))
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('207.180.234.151', username='root', password=row.split('|')[3].strip().strip('`'), look_for_keys=False, allow_agent=False, timeout=20)
c.get_transport().set_keepalive(20)
s = c.open_sftp()
service = '/opt/arcus-dev/src/api/src/services/EmailNotificationService.ts'
asset = '/opt/arcus-dev/src/api/src/assets/events/zb-gala-save-title-wide.jpg'
with s.file(service, 'rb') as f: original = f.read()
old = b'width="390" height="62" alt="Save the date" style="display:block;width:390px;height:62px;border:0;"'
new = old.replace(b'62', b'74')
if original.count(old) != 1:
    raise RuntimeError('Expected heading markup not found exactly once; deployment stopped')
stamp = time.strftime('%Y%m%d-%H%M%S')
for name, destination in [('service.ts', service), ('title.jpg', asset)]:
    with s.file(destination, 'rb') as f: previous = f.read()
    with s.file(f'/opt/arcus-dev/backups/save-heading-{stamp}-{name}', 'wb') as f: f.write(previous)
with s.file(service, 'wb') as f: f.write(original.replace(old, new))
s.put(str(root.parent/'nvccz/src/assets/events/zb-gala-save-title-wide.jpg'), asset)
script = '''#!/bin/bash
set -Eeuo pipefail
cd /opt/arcus-dev
exec 9>.events-deploy.lock
flock -n 9
start=$SECONDS
export API_NODE_HEAP_MB=6144 COMPOSE_PARALLEL_LIMIT=1
docker compose -p arcus-dev --env-file secrets/dev.env -f compose/docker-compose.yml build api
docker compose -p arcus-dev --env-file secrets/dev.env -f compose/docker-compose.yml up -d --no-deps api
for attempt in {1..36}; do
  if curl -fsS http://127.0.0.1:3319/health >/dev/null; then
    echo "Heading update healthy; elapsed $((SECONDS-start)) seconds"
    exit 0
  fi
  sleep 5
done
exit 1
'''
with s.file('/opt/arcus-dev/deploy-save-heading.sh', 'w') as f: f.write(script)
s.close()
_, out, err = c.exec_command("nohup bash -c 'bash /opt/arcus-dev/deploy-save-heading.sh > /opt/arcus-dev/logs/save-heading.log 2>&1; echo $? > /opt/arcus-dev/logs/save-heading.exit' </dev/null >/dev/null 2>&1 & echo 'Heading asset and markup transferred; cached API-only deployment started'", timeout=20)
print(out.read().decode(), flush=True)
print(err.read().decode(), flush=True)
c.close()
