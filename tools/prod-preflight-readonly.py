"""Read-only pre-flight probe of the NVCCZ production host.

Collects the facts required before any production write:
 - compose project layout, service names, and the branding env vars
 - running container/image state and the source revisions currently deployed
 - disk headroom for a Next.js image build
No files are written and no containers are touched by this script.
"""
from pathlib import Path
import os, sys
import paramiko

# Credentials come from the environment; never commit them.
HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

COMMANDS = [
    ("whoami/host", "id -un; hostname; uptime"),
    ("stack root", "ls -la /var/www/projects/nvccz; ls -la /var/www/projects/nvccz/compose"),
    ("compose services", "cd /var/www/projects/nvccz && docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml config --services"),
    ("branding env", "grep -E 'ORGANIZATION|LOGO' /var/www/projects/nvccz/secrets/prod.env | sed 's/=.*LOGO.*/=<logo present>/'"),
    ("branding raw", "grep -E 'NEXT_PUBLIC_ORGANIZATION_NAME|NEXT_PUBLIC_ORGANIZATION_LOGO' /var/www/projects/nvccz/secrets/prod.env"),
    ("ps all", "docker ps --format '{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'"),
    ("prod ps", "cd /var/www/projects/nvccz && docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps"),
    ("ui source revision", "cd /var/www/projects/nvccz/src/ui 2>/dev/null && (git rev-parse --short HEAD 2>/dev/null; ls -la package.json; head -c 200 package.json)"),
    ("api source revision", "cd /var/www/projects/nvccz/src/api 2>/dev/null && (git rev-parse --short HEAD 2>/dev/null; ls package.json)"),
    ("disk", "df -h /; free -h"),
    ("logo asset in repo copy", "ls -la /var/www/projects/nvccz/src/ui/public/nvccz-logo.png /var/www/projects/nvccz/src/ui/public/new_logo.png 2>&1"),
    ("logo in running image", "for c in $(docker ps --format '{{.Names}}' | grep -E 'ui|staff'); do echo \"== $c\"; docker exec $c ls -la /app/public/nvccz-logo.png 2>&1 | tail -1; done"),
    ("baked env in staff container", "docker exec $(docker ps --format '{{.Names}}' | grep -E 'ui-staff|nvccz-prod-ui' | head -1) sh -c 'env | grep -i ORGANIZATION' 2>&1"),
    ("health", "curl -s -o /dev/null -w 'staff-ui:%{http_code}\\n' http://127.0.0.1:3200/login; curl -s -o /dev/null -w 'api:%{http_code}\\n' http://127.0.0.1:3209/health"),
]


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    for label, cmd in COMMANDS:
        print(f"\n===== {label} =====")
        try:
            _, out, err = client.exec_command(cmd, timeout=60)
            text = out.read().decode("utf-8", "replace").strip()
            etext = err.read().decode("utf-8", "replace").strip()
            print(text if text else "(no output)")
            if etext:
                print("STDERR:", etext[:800])
        except Exception as exc:  # noqa: BLE001 - probe must keep going
            print("ERROR:", exc)
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
