#!/usr/bin/env python3
"""Deploy only the Events invitation fix to the Singapore Arcus dev stack."""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("ARCUS_SG_HOST", "207.180.234.151")
API_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz")
UI_ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
API_FILES = [
    "src/services/EventService.ts",
    "src/controllers/EventController.ts",
    "src/routes/eventRoutes.ts",
    "src/services/EmailNotificationService.ts",
    "src/assets/events/zb-logo.png",
]
UI_FILES = [
    "lib/api/events-api.ts",
    "lib/store/slices/eventsSlice.ts",
    "components/events/add-guest-dialog.tsx",
    "components/events/bulk-upload-guests-dialog.tsx",
    "components/events/event-detail-tabs/event-guests-tab.tsx",
]

def connect() -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=os.environ.get("NVCCZ_SSH_PASSWORD"), timeout=30)
    client.get_transport().set_keepalive(20)
    return client

def bundle(root: Path, files: list[str], destination: Path) -> None:
    with tarfile.open(destination, "w:gz") as archive:
        for relative in files:
            archive.add(root / relative, arcname=relative)

def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not os.environ.get("NVCCZ_SSH_PASSWORD"):
        raise SystemExit("Set NVCCZ_SSH_PASSWORD in the local environment.")
    with tempfile.TemporaryDirectory() as tmp:
        api_bundle = Path(tmp) / "events-api.tgz"
        ui_bundle = Path(tmp) / "events-ui.tgz"
        bundle(API_ROOT, API_FILES, api_bundle)
        bundle(UI_ROOT, UI_FILES, ui_bundle)
        client = connect()
        try:
            sftp = client.open_sftp()
            try:
                sftp.put(str(api_bundle), "/tmp/arcus-events-api.tgz")
                sftp.put(str(ui_bundle), "/tmp/arcus-events-ui.tgz")
            finally:
                sftp.close()
            command = r'''set -euo pipefail
tar -xzf /tmp/arcus-events-api.tgz -C /opt/arcus-dev/src/api
tar -xzf /tmp/arcus-events-ui.tgz -C /opt/arcus-dev/src/ui
rm -f /tmp/arcus-events-api.tgz /tmp/arcus-events-ui.tgz
cd /opt/arcus-dev
COMPOSE="docker compose -p arcus-dev --env-file /opt/arcus-dev/secrets/dev.env -f /opt/arcus-dev/compose/docker-compose.yml"
$COMPOSE up -d --build --no-deps api ui-staff >/tmp/arcus-events-rebuild.log 2>&1
tail -100 /tmp/arcus-events-rebuild.log
sleep 4
curl -fsS http://127.0.0.1:3319/health
printf '\n'
$COMPOSE ps api ui-staff
'''
            stdin, stdout, stderr = client.exec_command(command, timeout=1200)
            print(stdout.read().decode("utf-8", "replace"), end="")
            error = stderr.read().decode("utf-8", "replace")
            if error.strip():
                print(error, end="")
            return stdout.channel.recv_exit_status()
        finally:
            client.close()

if __name__ == "__main__":
    raise SystemExit(main())
