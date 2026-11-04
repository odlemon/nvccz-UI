"""Read-only: does the shipped API image contain the new bank-recon code, and does
the accounting chunk carry the NVCCZ brand? Written to a file because PowerShell
mangles nested docker-exec quoting on the command line.
"""
import os
import sys

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CHECKS = [
    ("api dist: new recon services compiled",
     "docker exec nvccz-prod-api-1 ls /app/dist/services",
     ["CBZ", "BankReconciliationWorkbench", "CashbookReconciliationSession"]),
    ("api dist: recon routes present",
     "docker exec nvccz-prod-api-1 sh -c 'grep -c reconciliation /app/dist/routes/cashbookRoutes-Enhanced.js'",
     None),
    ("ui: brand strings in the accounting layout chunk",
     "docker exec nvccz-prod-ui-staff-1 sh -c 'grep -o -e nvccz-logo.png -e NVCCZ "
     "/app/.next/static/chunks/app/accounting/layout-*.js | sort | uniq -c'",
     None),
    ("ui: export module ships branding hook",
     "docker exec nvccz-prod-ui-staff-1 sh -c 'grep -rlo __AC52_EXPORT__ /app/.next/static/chunks | head -3'",
     None),
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("102.217.49.126", port=3131, username="user",
          password=os.environ["NVCCZ_PROD_PASSWORD"], timeout=30)
try:
    for label, cmd, needles in CHECKS:
        out = c.exec_command(cmd, timeout=180)[1].read().decode("utf-8", "replace").strip()
        print(f"\n===== {label} =====")
        if needles:
            for n in needles:
                hit = [line for line in out.splitlines() if n in line]
                print(f"  {n}: {hit[0] if hit else 'MISSING'}")
        else:
            print(out or "(no output)")
finally:
    c.close()
