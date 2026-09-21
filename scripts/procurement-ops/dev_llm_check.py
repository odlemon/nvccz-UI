"""Check how the dev API is configured for invoice extraction. Prints env NAMES only, never values."""
import sys
sys.path.insert(0, r"C:\Users\lysp\Downloads\nvccz-new\scripts")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import paramiko
from _ssh_creds import SSH_PASSWORD, SSH_KEY

CMD = r"""
set -u
C=arcus-dev-api-1
echo "=== running image $(docker inspect $C --format '{{.Image}}' | cut -c1-19)"
echo "=== LLM / Suite06 / upload env names set in the container"
docker exec $C printenv | grep -oE '^(LLM_[A-Z_]+|SUITE06_[A-Z_]+|REMOTE_UPLOAD_SERVICE_URL|REMOTE_MEDIA_INTERNAL_BASE)=' | sed 's/=$//' | sort || echo "  (none set)"
echo "=== can the container reach the default LLM host"
docker exec $C sh -c 'wget -q -T 12 -O /dev/null https://api.deepseek.com/ 2>/dev/null && echo "  api.deepseek.com reachable" || echo "  api.deepseek.com NOT reachable"'
echo "=== pdf-parse present in the image"
docker exec $C sh -c 'ls node_modules/pdf-parse/package.json >/dev/null 2>&1 && echo "  pdf-parse installed" || echo "  pdf-parse MISSING"'
echo DEV_LLM_CHECK_DONE
"""

cli = paramiko.SSHClient()
cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    cli.connect("31.220.82.129", username="root", key_filename=SSH_KEY, timeout=60, banner_timeout=60)
except Exception:
    cli.connect("31.220.82.129", username="root", password=SSH_PASSWORD, timeout=60, banner_timeout=60, look_for_keys=False, allow_agent=False)
_, out, err = cli.exec_command(CMD, timeout=240)
print(out.read().decode("utf-8", "replace"))
tail = err.read().decode("utf-8", "replace").strip()
if tail:
    print("stderr:", tail[-500:])
cli.close()
