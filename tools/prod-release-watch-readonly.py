"""Read-only progress watcher for the 2026-10-28 production release.

Reports what the release tool has done so far on the host: uploaded tarballs,
prepare marker, detached build log tail, build exit, container ages and health.
Nothing here writes to the stack.
"""
from __future__ import annotations

import os
import sys

import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")

PROBE = r"""
set -uo pipefail
cd /var/www/projects/nvccz
echo '=== release artifacts in /tmp ==='
ls -la /tmp/rel-*.tgz /tmp/rel-build.* /home/user/rel-*.sh 2>/dev/null || echo '(none)'
echo '=== installed sources ==='
ls -la src 2>/dev/null | tail -4
stat -c '%y  %n' src/ui/lib/accounting-v52/export.ts src/api/src/services/CBZStatementPdfParser.ts 2>/dev/null || echo 'new files NOT yet installed'
echo '=== backups / rollback tags ==='
ls -1t backups/src-pre-release-*.tgz 2>/dev/null | head -3
docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedSince}}' | grep pre-release | head -4
echo '=== builder cache ==='
df -h / | tail -1
docker buildx du 2>/dev/null | tail -1
echo '=== build log tail ==='
tail -12 /tmp/rel-build.log 2>/dev/null || echo '(no build log yet)'
echo '=== build exit marker ==='
cat /tmp/rel-build.exit 2>/dev/null || echo 'BUILD_RUNNING_OR_NOT_STARTED'
echo '=== running containers ==='
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'nvccz-prod-(api|ui-staff)' || true
echo '=== health ==='
curl -s -o /dev/null -w 'staff-login:%{http_code}\n' http://127.0.0.1:3200/login
curl -s -o /dev/null -w 'api-health:%{http_code}\n' http://127.0.0.1:3209/health
"""


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER,
                   password=os.environ["NVCCZ_PROD_PASSWORD"], timeout=45,
                   look_for_keys=False, allow_agent=False)
    _, out, err = client.exec_command(f"bash -s", timeout=420)
    out.channel.sendall(PROBE.replace("\r\n", "\n").encode())
    out.channel.shutdown_write()
    text = out.read().decode("utf-8", "replace")
    sys.stdout.write(text)
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        sys.stdout.write("STDERR: " + e.strip()[:800] + "\n")
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
