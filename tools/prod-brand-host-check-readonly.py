"""Read-only: what brand string is really compiled into the client export chunk,
and which hostname does production serve (branding is host-dependent:
lib/accounting-v52/export.ts returns Matanho on loopback/dev names).
"""
import os
import sys

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CHECKS = [
    ("which client chunk carries the brand literals",
     "docker exec nvccz-prod-ui-staff-1 sh -c "
     "'grep -rl nvccz-logo.png /app/.next/static/chunks | head -5'"),
    ("compiled brand decision (client) - the code around the logo default",
     "docker exec nvccz-prod-ui-staff-1 sh -c \"f=\\$(grep -rl nvccz-logo.png /app/.next/static/chunks | head -1); "
     "grep -o -E '.{110}nvccz-logo.png.{0,30}' \\$f | head -2\""),
    ("nginx server names (production hostname)",
     "sudo -n grep -rhE 'server_name' /etc/nginx/sites-enabled/ 2>/dev/null || "
     "cat /var/www/projects/nvccz/nginx.conf 2>/dev/null | grep -E 'server_name|proxy_pass' | head -20"),
    ("compose ui-staff build args (branding really passed to the build)",
     "sed -n '/^  ui-staff:/,/^  ui-lp:/p' /var/www/projects/nvccz/compose/docker-compose.prod.yml"
     " | grep -nE 'ORGANIZATION|NEXT_PUBLIC_PORTAL|args|context|PORTAL'"),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("102.217.49.126", port=3131, username="user",
          password=os.environ["NVCCZ_PROD_PASSWORD"], timeout=30)
try:
    for label, cmd in CHECKS:
        out = c.exec_command(cmd, timeout=180)[1].read().decode("utf-8", "replace").strip()
        print(f"\n===== {label} =====\n{out or '(no output)'}")
finally:
    c.close()
