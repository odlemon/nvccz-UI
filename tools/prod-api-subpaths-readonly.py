"""Read-only: correct sub-path presence check against the deployed production API.

Uses the route strings exactly as they appear in the compiled dist (double quotes),
so a path served under a mount prefix is not reported as missing.
"""
import os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

SUBPATHS = [
    "/position",
    "/unallocated",
    "/reconciliation/sessions",
    "/workbench",
    "/auto-match",
    "/bills",
    "/depreciation/monthly",
    "/debtors-age-analysis",
]

if __name__ == "__main__":
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    for sub in SUBPATHS:
        cmd = (
            "docker exec nvccz-prod-api-1 sh -lc "
            f"'grep -rl \"\\\"{sub}\\\"\" /app/dist/routes 2>/dev/null | head -2'"
        )
        _, out, _ = client.exec_command(cmd, timeout=60)
        hits = out.read().decode("utf-8", "replace").strip().splitlines()
        print(f"{'PRESENT' if hits else 'MISSING '} {sub:32} {' '.join(h.split('/')[-1] for h in hits)}")

    _, out, _ = client.exec_command(
        "docker exec nvccz-prod-api-1 sh -lc "
        "'grep -rho \"\\\"/reconciliation[a-zA-Z/:_-]*\\\"\" /app/dist/routes/*.js | sort -u | head -14'",
        timeout=60)
    print("\nreconciliation routes in deployed dist:\n" + out.read().decode("utf-8", "replace"))
    client.close()
    sys.exit(0)
