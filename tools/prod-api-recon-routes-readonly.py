"""Read-only: quote-style-agnostic check for the reconciliation session /
workbench / asset-bill routes in the deployed production API dist.
"""
import os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

TOKENS = ["sessions", "workbench", "auto-match", "statement", "bills", "depreciation/monthly"]

if __name__ == "__main__":
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    for tok in TOKENS:
        cmd = (
            "docker exec nvccz-prod-api-1 sh -lc "
            f"'grep -rho \"[^\\\"]*/{tok}[a-zA-Z0-9/:_=-]*\" /app/dist/routes 2>/dev/null | "
            "sort -u | head -6'"
        )
        _, out, _ = client.exec_command(cmd, timeout=60)
        found = out.read().decode("utf-8", "replace").strip()
        print(f"--- {tok}\n{found or '(none)'}")
    _, out, _ = client.exec_command(
        "docker exec nvccz-prod-api-1 sh -lc "
        "'grep -rn \"ReconciliationSession\\|WorkbenchController\" /app/dist/routes/cashbookRoutes-Enhanced.js | head -8'",
        timeout=60)
    print("\nsession/workbench wiring in deployed cashbook routes:\n" + out.read().decode("utf-8", "replace"))
    client.close()
    sys.exit(0)
