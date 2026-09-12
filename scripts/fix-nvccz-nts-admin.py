#!/usr/bin/env python3
"""Reset NVCCZ admin password in DB on NTS."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

import paramiko
from _ssh_creds import SSH_PASSWORD  # rotated 2026-09-07; value lives in .secrets/ssh.env

HOST = "31.220.82.129"
USER = "root"
PASSWORD = SSH_PASSWORD
ADMIN_EMAIL = "admin@nvccz.co.zw"
CREDS = Path(r"c:\Users\lysp\Downloads\nvccz-new\deploy\nvccz\CREDENTIALS.nts-prod.local.md")


def admin_password() -> str:
    for line in CREDS.read_text(encoding="utf-8").splitlines():
        if line.startswith("- Password:"):
            return line.split("`")[1]
    raise SystemExit("missing password")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    admin_pw = admin_password()
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    sftp = c.open_sftp()
    js = f"""
const bcrypt = require('bcrypt');
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
(async () => {{
  const hash = await bcrypt.hash({json.dumps(admin_pw)}, 10);
  const u = await p.user.findUnique({{ where: {{ email: {json.dumps(ADMIN_EMAIL)} }} }});
  if (!u) {{ console.log('ADMIN_MISSING'); process.exit(2); }}
  await p.user.update({{ where: {{ id: u.id }}, data: {{ password: hash }} }});
  console.log('ADMIN_UPDATED');
  await p['$disconnect']();
}})().catch((e) => {{ console.error(e); process.exit(1); }});
"""
    with sftp.file("/tmp/nvccz-reset-admin.js", "w") as f:
        f.write(js)
    sftp.close()

    _, stdout, stderr = c.exec_command(
        "docker cp /tmp/nvccz-reset-admin.js nvccz-prod-api-1:/tmp/nvccz-reset-admin.js && "
        "docker exec nvccz-prod-api-1 node /tmp/nvccz-reset-admin.js",
        timeout=120,
    )
    out = stdout.read().decode() + stderr.read().decode()
    print(out)
    c.close()

    payload = json.dumps({"email": ADMIN_EMAIL, "password": admin_pw, "portal": "staff"}).encode()
    req = urllib.request.Request(
        f"http://{HOST}:3209/api/auth/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            ok = bool(data.get("token") or data.get("success"))
            print(f"login HTTP {resp.status} ok={ok}")
            return 0 if ok else 1
    except urllib.error.HTTPError as e:
        print(f"login HTTP {e.code} {e.read().decode()[:200]}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
