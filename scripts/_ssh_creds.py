"""Shared SSH credentials for the deploy/ops scripts.

The server password used to be hard-coded in ~77 files, including two committed
`design-refs/*.md` docs. It was rotated on 7 September 2026 during the LMS
cryptominer incident response, so this module became the single place to hold it
— and it deliberately keeps the value OUT of the repository.

Resolution order:
  1. ``ARCUS_SSH_PASSWORD`` environment variable
  2. ``.secrets/ssh.env`` at the repo root (git-ignored)
  3. empty string — callers should then fall back to key auth

Key auth (``~/.ssh/id_ed25519``, already in the server's authorized_keys) works
and is preferred; ``SSH_KEY`` below points at it.
"""
from __future__ import annotations

import os
from pathlib import Path

HOST = "31.220.82.129"
USER = "root"
PORT = 22

_REPO_ROOT = Path(__file__).resolve().parent.parent
_SECRETS_FILE = _REPO_ROOT / ".secrets" / "ssh.env"

SSH_KEY = os.path.expanduser("~/.ssh/id_ed25519")


def _from_file(key: str) -> str:
    if not _SECRETS_FILE.is_file():
        return ""
    for line in _SECRETS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if k.strip() == key:
            return v.strip().strip('"').strip("'")
    return ""


def ssh_password() -> str:
    return os.environ.get("ARCUS_SSH_PASSWORD") or _from_file("ARCUS_SSH_PASSWORD")


SSH_PASSWORD = ssh_password()

# Back-compat aliases: the old scripts referred to these names directly.
PASSWORD = SSH_PASSWORD

if not SSH_PASSWORD and not os.path.isfile(SSH_KEY):
    raise SystemExit(
        "No SSH credential found.\n"
        f"  Set ARCUS_SSH_PASSWORD, or create {_SECRETS_FILE} containing:\n"
        "      ARCUS_SSH_PASSWORD=<password>\n"
        f"  ...or place a key at {SSH_KEY}."
    )
