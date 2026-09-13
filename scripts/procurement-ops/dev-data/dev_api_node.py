"""Run a local .mjs inside the Arcus dev API container, against the dev database. Dev only.

    python dev_api_node.py <local.mjs> [args...]

The script is copied to /app/scripts/_ops/ so @prisma/client and the app's node_modules resolve, then run
with the container's own environment (DATABASE_URL, PORT). Refuses to run anywhere but arcus-dev-api-1.
Secrets stay in the container: nothing here prints its environment.
"""
import importlib.util
import posixpath
import sys
from pathlib import Path

SCRIPTS = Path(r"C:\Users\lysp\Downloads\nvccz-new\scripts")
sys.path.insert(0, str(SCRIPTS))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
spec = importlib.util.spec_from_file_location("m", SCRIPTS / "deploy-nvccz-nts-prod-api-only.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

local = Path(sys.argv[1])
args = " ".join(f"'{a}'" for a in sys.argv[2:])
name = local.name
remote_tmp = f"/tmp/{name}"

CMD = f"""
set -u
C=arcus-dev-api-1
docker inspect $C >/dev/null 2>&1 || {{ echo "REFUSED: $C not found"; exit 2; }}
case "$(docker exec $C printenv DATABASE_URL 2>/dev/null)" in *nvccz_prod*|"") echo "REFUSED: not the dev database"; exit 2;; esac
P=$(docker exec $C printenv PORT 2>/dev/null || true); P=${{P:-3009}}
docker exec $C mkdir -p /app/scripts/_ops
docker cp {remote_tmp} $C:/app/scripts/_ops/{name}
docker exec -w /app -e API=http://127.0.0.1:$P/api $C node /app/scripts/_ops/{name} {args} 2>&1
"""

cli = mod.connect()
sftp = cli.open_sftp()
sftp.put(str(local), remote_tmp)
sftp.close()
_, out, err = cli.exec_command(CMD, timeout=3000)
print(out.read().decode(errors="replace") + err.read().decode(errors="replace"))
cli.close()
