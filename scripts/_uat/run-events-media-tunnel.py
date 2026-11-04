"""Forward local Events media requests to the existing dev upload container.

No remote configuration or application deployment is changed.
"""
import argparse
from pathlib import Path
import select
import socketserver
import paramiko

parser = argparse.ArgumentParser()
parser.add_argument('--handoff', required=True)
parser.add_argument('--port', type=int, default=3052)
args = parser.parse_args()
row = next(line for line in Path(args.handoff).read_text(encoding='utf-8-sig').splitlines()
           if line.startswith('| Singapore dev SSH |'))
password = row.split('|')[3].strip().strip('`')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('207.180.234.151', username='root', password=password,
               look_for_keys=False, allow_agent=False, timeout=20)
transport = client.get_transport()
transport.set_keepalive(20)
_, stdout, stderr = client.exec_command("docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' arcus-dev-upload-1", timeout=20)
target = stdout.read().decode().strip()
if not target or not all(part.isdigit() for part in target.split('.')):
    raise RuntimeError('Cannot locate the existing development media container')

class Forward(socketserver.BaseRequestHandler):
    def handle(self):
        channel = transport.open_channel('direct-tcpip', (target, 3050), self.request.getpeername())
        try:
            while True:
                ready, _, _ = select.select([self.request, channel], [], [], 30)
                if self.request in ready:
                    data = self.request.recv(65536)
                    if not data: break
                    channel.sendall(data)
                if channel in ready:
                    data = channel.recv(65536)
                    if not data: break
                    self.request.sendall(data)
        finally:
            channel.close()

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

print(f'Events media tunnel listening on 127.0.0.1:{args.port}; storage is on the dev server', flush=True)
try:
    with Server(('127.0.0.1', args.port), Forward) as server:
        server.serve_forever()
finally:
    client.close()
