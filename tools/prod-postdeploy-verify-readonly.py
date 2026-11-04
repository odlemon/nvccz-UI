"""Read-only verification of the 2026-10-28 production release on the NVCCZ host.

The release script died on a Windows console-encoding error while tailing the API
log, AFTER the cutover had completed. This re-checks the same facts without
writing anything: container state, HTTP answers, branding actually compiled into
the running image, and the rollback safety net.

Windows note: stdout is forced to UTF-8 with replacement so a ✅ in a container
log cannot kill the run again.
"""
from pathlib import Path
import os
import sys
import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

ROOT = "/var/www/projects/nvccz"
COMPOSE = f"cd {ROOT} && docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml"

COMMANDS = [
    ("containers", "docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'"),
    ("compose ps", f"{COMPOSE} ps api ui-staff"),
    ("staff UI http", "curl -s -o /dev/null -w 'login:%{http_code}\n' http://127.0.0.1:3200/login;"
                      " curl -s -o /dev/null -w 'logo:%{http_code}\n' http://127.0.0.1:3200/nvccz-logo.png;"
                      " curl -s -o /dev/null -w 'root:%{http_code}\n' http://127.0.0.1:3200/"),
    ("api health", "curl -s -o /dev/null -w 'health:%{http_code}\n' http://127.0.0.1:3209/health;"
                   " curl -fsS http://127.0.0.1:3209/health"),
    ("accounting api (must not 500)",
     "for p in /api/accounting/me /api/accounting/me/counts /api/cashbook/banks "
     "/api/accounting/assets/bills /api/cashbook/reconciliation/sessions; do printf '%s -> ' \"$p\";"
     " curl -s -o /dev/null -w '%{http_code}\n' \"http://127.0.0.1:3209$p\"; done"),
    ("brand baked in the image",
     "docker exec nvccz-prod-ui-staff-1 sh -c '"
     "grep -ro \"NVCCZ\" /app/.next/server/chunks 2>/dev/null | wc -l;"
     "grep -ro \"/nvccz-logo.png\" /app/.next/static/chunks 2>/dev/null | wc -l;"
     "ls -la /app/public/nvccz-logo.png'"),
    ("container build args", "docker exec nvccz-prod-ui-staff-1 sh -c 'env | grep -i ORGANIZATION'"),
    ("ui log tail", "docker logs --tail 15 nvccz-prod-ui-staff-1 2>&1"),
    ("api log tail", "docker logs --tail 15 nvccz-prod-api-1 2>&1"),
    ("rollback safety net", "docker images --format '{{.Repository}}:{{.Tag}}' | grep pre-release;"
                            f" ls -la {ROOT}/backups 2>/dev/null | tail -5"),
    ("new accounting code shipped", f"ls -la {ROOT}/src/ui/components/accounting/reconciliation/;"
                                    f" ls -la {ROOT}/src/api/dist/services/CBZStatementPdfParser.js"),
    ("disk", "df -h / | tail -1"),
]


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   banner_timeout=30, auth_timeout=30)
    try:
        for label, cmd in COMMANDS:
            print(f"\n===== {label} =====")
            _, out, err = client.exec_command(cmd, timeout=180)
            text = out.read().decode("utf-8", "replace").strip()
            print(text or "(no output)")
            e = err.read().decode("utf-8", "replace").strip()
            if e:
                print("STDERR:", e[:800])
    finally:
        client.close()


if __name__ == "__main__":
    main()
