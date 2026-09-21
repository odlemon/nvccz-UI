"""Block or restore outgoing email on the Arcus dev API while procurement is tested there.

  python dev_mail_guard.py on    MAIL_REDIRECT_ENFORCE=true with no MAIL_REDIRECT_TO: nothing is sent,
                                 each message is logged as [mail:BLOCKED] (src/config/email.config.ts)
  python dev_mail_guard.py off   restore the env file from the backup taken by `on`
  python dev_mail_guard.py status

Recreates only the dev api container (no rebuild) so the change takes effect. Never touches prod.
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

MODE = (sys.argv[1] if len(sys.argv) > 1 else "status").lower()

COMMON = r"""
set -u
ROOT=/var/www/projects/arcus
ENVF=$ROOT/secrets/dev.env
BAK=$ROOT/secrets/dev.env.bak-mailguard
COMPOSE="docker compose --env-file $ENVF -f $ROOT/compose/docker-compose.dev.yml"
recreate() {
  cd $ROOT && $COMPOSE up -d --no-deps --force-recreate api >/dev/null 2>&1
  for i in $(seq 1 30); do
    code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 --resolve dev-api.matanho.com:443:127.0.0.1 https://dev-api.matanho.com/health)
    [ "$code" = "200" ] && break; sleep 5
  done
  echo "  api health $code"
}
show() { echo "  in container: MAIL_REDIRECT_ENFORCE=$(docker exec arcus-dev-api-1 printenv MAIL_REDIRECT_ENFORCE 2>/dev/null) MAIL_REDIRECT_TO=$(docker exec arcus-dev-api-1 printenv MAIL_REDIRECT_TO 2>/dev/null | sed 's/./*/g')"; }
"""

CMDS = {
    "on": COMMON + r"""
[ -f "$BAK" ] || cp -p "$ENVF" "$BAK"
sed -i '/^MAIL_REDIRECT_ENFORCE=/d;/^MAIL_REDIRECT_TO=/d' "$ENVF"
printf '\nMAIL_REDIRECT_ENFORCE=true\n' >> "$ENVF"
echo "  dev.env: mail guard ON (backup $BAK)"
recreate; show
""",
    "off": COMMON + r"""
if [ -f "$BAK" ]; then cp -p "$BAK" "$ENVF" && rm -f "$BAK" && echo "  dev.env restored from backup"; else echo "  no backup; leaving dev.env as is"; fi
recreate; show
""",
    "status": COMMON + r"""
grep -E '^MAIL_REDIRECT_(ENFORCE|TO)=' "$ENVF" | sed -E 's/(TO=).+/\1***/' || echo "  dev.env: no mail guard lines"
[ -f "$BAK" ] && echo "  backup present: $BAK"
show
""",
}

if MODE not in CMDS:
    raise SystemExit("usage: dev_mail_guard.py on|off|status")
cli = mod.connect()
_, out, err = cli.exec_command(CMDS[MODE], timeout=600)
print(out.read().decode(errors="replace") + err.read().decode(errors="replace"))
cli.close()
