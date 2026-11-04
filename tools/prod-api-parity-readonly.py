"""Read-only check: which Accounting API endpoints does the deployed production
API actually serve, compared with the endpoints the new Accounting UI calls?

Runs grep inside the running prod api container and prints presence per path.
No writes, no restarts.
"""
import os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

PATHS = [
    "/accounting/me/counts",
    "/accounting/me/queue",
    "/accounting/assets/bills",
    "/accounting/assets/depreciation/monthly",
    "/accounting/receivables/unallocated",
    "/accounting/invoices/debtors-age-analysis",
    "/accounting/credit-notes",
    "/accounting/customers",
    "/accounting/chart-of-accounts",
    "/accounting/fiscal-calendar/locks/commit",
    "/accounting/documents/expenses",
    "/cashbook/receipts",
    "/cashbook/transfers",
    "/cashbook/banks",
    "/cashbook/position",
]


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    _, out, _ = client.exec_command(
        "docker ps --format '{{.Names}}' | grep -E 'nvccz-prod-api' | head -1", timeout=30)
    container = out.read().decode().strip()
    print(f"container: {container}")
    for path in PATHS:
        needle = path.lstrip("/")
        cmd = (f"docker exec {container} sh -lc \"grep -rlo '{needle}' /app/dist 2>/dev/null | head -3\"")
        _, out, err = client.exec_command(cmd, timeout=60)
        hits = out.read().decode("utf-8", "replace").strip()
        print(f"{'PRESENT' if hits else 'MISSING'}  {path}  {hits.splitlines()[:2]}")
    _, out, _ = client.exec_command(
        f"docker exec {container} sh -lc \"ls -la /app/dist/routes 2>/dev/null | head -5; "
        f"node -e \\\"console.log(require('/app/package.json').version)\\\" 2>/dev/null; "
        f"stat -c '%y' /app/dist 2>/dev/null\"", timeout=60)
    print("\nbuild info:\n" + out.read().decode("utf-8", "replace"))
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
