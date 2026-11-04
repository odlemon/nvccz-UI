"""Read-only: confirm what branding the deployed production staff UI actually
serves, and what the live compose file passes as build args.

Checks
 - the remote compose ui-staff build args (logo/name)
 - whether the baked Next.js build inside the running staff container contains
   the NVCCZ logo path and the Matanho one
 - whether the branded accounting export module is present in the deployed build
 - sub-path presence in the deployed API dist (no full-path false negatives)
"""
import os, sys
import paramiko

HOST = os.environ.get("NVCCZ_PROD_HOST", "102.217.49.126")
PORT = int(os.environ.get("NVCCZ_PROD_PORT", "3131"))
USER = os.environ.get("NVCCZ_PROD_USER", "user")
PASSWORD = os.environ["NVCCZ_PROD_PASSWORD"]

CHECKS = [
    ("remote compose ui-staff build args",
     "sed -n '/^  ui-staff:/,/^  [a-z]/p' /var/www/projects/nvccz/compose/docker-compose.prod.yml | head -40"),
    ("staff bundle logo strings",
     "docker exec nvccz-prod-ui-staff-1 sh -lc \""
     "grep -rlo 'nvccz-logo.png' /app/.next/server/app 2>/dev/null | head -3; "
     "echo ---; grep -rc 'nvccz-logo.png' /app/.next/BUILD_ID 2>/dev/null || true; "
     "echo ---count-static; ls /app/public | head -5; "
     "echo ---orgname; grep -rlo 'NVCCZ' /app/.next/server 2>/dev/null | head -3\""),
    ("branded export module in deployed build",
     "docker exec nvccz-prod-ui-staff-1 sh -lc \""
     "grep -rlo 'ac52ExportBrand\\|__AC52_EXPORT__\\|accounting-export' /app/.next 2>/dev/null | head -5\""),
    ("api dist sub-path presence",
     "for t in bills unallocated position sessions workbench depreciation monthly; do "
     "printf '%s: ' $t; "
     "docker exec nvccz-prod-api-1 sh -lc \"grep -rlo \\\"'/$t'\\\" /app/dist/routes 2>/dev/null | head -2 | tr '\\n' ' '; echo\"; done"),
    ("api recon session routes",
     "docker exec nvccz-prod-api-1 sh -lc \"ls /app/dist/routes | grep -i -E 'reconcil|cashbook|asset|invoice' \" 2>&1"),
    ("reconciled backend file dates in dist",
     "docker exec nvccz-prod-api-1 sh -lc \"ls -la /app/dist/controllers | grep -E 'BankReconciliation|CashbookReconciliation|Invoice|Asset' \" 2>&1"),
    ("build tmp headroom",
     "df -h /var/lib/docker | tail -1; docker system df | tail -4"),
]


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30,
                   look_for_keys=False, allow_agent=False)
    for label, cmd in CHECKS:
        print(f"\n===== {label} =====")
        _, out, err = client.exec_command(cmd, timeout=120)
        print(out.read().decode("utf-8", "replace").strip() or "(no output)")
        e = err.read().decode("utf-8", "replace").strip()
        if e:
            print("STDERR:", e[:500])
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
