#!/usr/bin/env python3
"""Install Docker CE + compose plugin and create /var/www/projects/arcus."""
import sys
import paramiko

HOST = "31.220.82.129"
USER = "root"
PASSWORD = "Debgjnk4@!z"

CMD = r"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker --version
docker compose version
mkdir -p /var/www/projects/arcus/{dev,prod,src/api,src/ui,secrets}
chmod 700 /var/www/projects/arcus/secrets
ls -la /var/www/projects /var/www/projects/arcus
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 8080/tcp
ufw allow 3009/tcp comment 'arcus-dev-api'
ufw allow 3010/tcp comment 'arcus-prod-api'
yes | ufw enable || true
ufw status
echo DOCKER_INSTALL_OK
"""


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...", flush=True)
    c.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
    stdin, stdout, stderr = c.exec_command(CMD, timeout=600, get_pty=True)
    for line in stdout:
        print(line, end="", flush=True)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    c.close()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
