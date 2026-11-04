"""Read-only: pull the module-not-found block out of the release build log."""
from __future__ import annotations

import os
import sys

import paramiko

PROBE = r"""
set -uo pipefail
echo '=== build exit ==='
cat /tmp/rel-build.exit 2>/dev/null || echo RUNNING
echo '=== all module-not-found sites ==='
grep -nE "Module not found|Can't resolve|Build failed|BUILD_FAILED|BUILD_OK" /tmp/rel-build.log | head -40
echo '=== context of first failure ==='
awk '/Module not-found|Module not found/{found=1} found{print} /Import trace for requested module/{c++; if(c>=1) exit}' /tmp/rel-build.log | head -30
echo '=== which compose step reached ==='
grep -nE '^=== build ' /tmp/rel-build.log
"""


def main() -> int:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126"),
              port=int(os.environ.get("NVCCZ_PROD_PORT", "3131")),
              username=os.environ.get("NVCCZ_PROD_USER", "user"),
              password=os.environ["NVCCZ_PROD_PASSWORD"], timeout=45,
              look_for_keys=False, allow_agent=False)
    _, out, err = c.exec_command("bash -s", timeout=300)
    out.channel.sendall(PROBE.replace("\r\n", "\n").encode())
    out.channel.shutdown_write()
    sys.stdout.write(out.read().decode("utf-8", "replace"))
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        sys.stdout.write("STDERR: " + e.strip()[:600] + "\n")
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
