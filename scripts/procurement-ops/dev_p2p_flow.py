"""Run the procure-to-pay API flow inside the Arcus dev API container (dev database only).

Uploads the local nvccz/scripts/_uat/procurement-p2p-flow.mjs into arcus-dev-api-1 and runs it
against the container's own port. Its vendors use @vendors.example.test addresses and its
personas @nts.local; run it with dev_mail_guard.py on so nothing is emailed regardless.
"""
import importlib.util
import sys
from pathlib import Path

SCRIPTS = Path(r"C:\Users\lysp\Downloads\nvccz-new\scripts")
sys.path.insert(0, str(SCRIPTS))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
spec = importlib.util.spec_from_file_location("m", SCRIPTS / "deploy-nvccz-nts-prod-api-only.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

FLOW = r"C:\Users\lysp\Downloads\nvccz\scripts\_uat\procurement-p2p-flow.mjs"
EXTRA = " ".join(sys.argv[1:])

CMD = rf"""
set -u
C=arcus-dev-api-1
[ "$(docker exec $C printenv MAIL_REDIRECT_ENFORCE 2>/dev/null)" = "true" ] || {{ echo "REFUSED: mail guard is off on dev (run dev_mail_guard.py on first)"; exit 2; }}
P=$(docker exec $C printenv PORT 2>/dev/null || true); P=${{P:-3009}}
docker cp /tmp/procurement-p2p-flow.mjs $C:/app/scripts/_uat/procurement-p2p-flow.mjs
docker exec -e API=http://127.0.0.1:$P/api $C node scripts/_uat/procurement-p2p-flow.mjs {EXTRA} 2>&1 | tail -30
echo "--- blocked mail during the run: $(docker logs --since 15m $C 2>&1 | grep -c 'mail:BLOCKED')"
"""

cli = mod.connect()
sftp = cli.open_sftp()
sftp.put(FLOW, "/tmp/procurement-p2p-flow.mjs")
sftp.close()
_, out, err = cli.exec_command(CMD, timeout=1200)
print(out.read().decode(errors="replace") + err.read().decode(errors="replace"))
cli.close()
