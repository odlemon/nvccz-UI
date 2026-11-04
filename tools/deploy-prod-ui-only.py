from pathlib import Path
import hashlib, os, tarfile, tempfile
import paramiko

ROOT = Path(r"C:\Users\lysp\Downloads\nvccz-new")
HOST, PORT, USER, PASSWORD = "102.217.49.126", 3131, "user", "user@123"
EXCLUDE = {"node_modules", ".git", "dist", "coverage", ".next", ".cursor", ".claude", ".vscode", ".yarn", "docs", "design-refs", "backups", "tracking", "outputs", "tools"}

def main():
    with tempfile.TemporaryDirectory() as td:
        archive = Path(td) / "nvccz-ui.tgz"
        with tarfile.open(archive, "w:gz") as tar:
            for directory, dirs, files in os.walk(ROOT):
                dirs[:] = [d for d in dirs if d not in EXCLUDE]
                for name in files:
                    path = Path(directory) / name
                    rel = path.relative_to(ROOT)
                    if path.name in {".env", ".env.local"} or str(rel).replace("\\", "/").startswith("storage/local-upload-mock/"):
                        continue
                    tar.add(path, arcname=f"ui/{str(rel).replace(chr(92), '/')}")
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        client = paramiko.SSHClient(); client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
        sftp = client.open_sftp(); remote = "/home/user/nvccz-ui.tgz"; sftp.put(str(archive), remote); sftp.close()
        cmd = f"set -euo pipefail; cd /var/www/projects/nvccz; echo '{digest}  {remote}' | sha256sum -c -; rm -rf src/ui; mkdir -p src; tar -xzf {remote} -C src; test -f src/ui/package.json; docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml up -d --build ui; docker compose --env-file secrets/prod.env -f compose/docker-compose.prod.yml ps ui"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=3600, get_pty=True)
        print(stdout.read().decode("utf-8", errors="replace")); err = stderr.read().decode("utf-8", errors="replace")
        if err.strip(): print(err)
        code = stdout.channel.recv_exit_status(); client.close(); raise SystemExit(code)

if __name__ == "__main__": main()
