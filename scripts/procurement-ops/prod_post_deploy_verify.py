"""Read-only verification of production after the promotion. No data is written."""
import sys
sys.path.insert(0, r"C:\Users\lysp\Downloads\nvccz-new\scripts")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import paramiko
from _ssh_creds import SSH_PASSWORD, SSH_KEY

CMDS = [
    ("all prod containers", "docker ps --format '{{.Names}} | {{.Status}}' | grep -i 'nvccz-prod' | sort"),
    ("prod api image + restarts", "docker inspect nvccz-prod-api-1 --format '{{.Image}} | restarts {{.RestartCount}} | health={{.State.Health.Status}}'"),
    ("prod staff ui image + restarts", "docker inspect nvccz-prod-ui-staff-1 --format '{{.Image}} | restarts {{.RestartCount}} | health={{.State.Health.Status}}'"),
    ("staff portal Host rule", "docker inspect nvccz-prod-ui-staff-1 --format '{{range $k,$v := .Config.Labels}}{{if (eq $k \"traefik.http.routers.ui-staff.rule\")}}{{$v}}{{end}}{{end}}' 2>/dev/null || echo unknown"),
    ("all traefik host rules for staff", "docker inspect nvccz-prod-ui-staff-1 --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{println}}{{end}}' | grep -i 'rule' | head -5"),
    ("AI Invoice Capture in the built prod chunk", "docker exec nvccz-prod-ui-staff-1 sh -c 'grep -rl \"AI Invoice Capture\" .next/static/chunks 2>/dev/null | head -3' || echo 'NOT FOUND'"),
    ("register tables on prod now", "for t in procurement_documents procurement_contracts procurement_plans procurement_plan_items; do n=$(docker exec -i nvccz-prod-mysql-1 sh -c \"MYSQL_PWD=\\$MYSQL_ROOT_PASSWORD mysql -uroot -N nvccz_prod -e 'SELECT COUNT(*) FROM $t;'\" 2>/dev/null); if [ -n \"$n\" ]; then echo \"  present $t rows=$n\"; else echo \"  ABSENT $t\"; fi; done"),
    ("prod api health (local)", "curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3209/health; echo"),
    ("load / memory", "uptime; free -m | head -2"),
]

cli = paramiko.SSHClient()
cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    cli.connect("31.220.82.129", username="root", key_filename=SSH_KEY, timeout=60, banner_timeout=60)
except Exception:
    cli.connect("31.220.82.129", username="root", password=SSH_PASSWORD, timeout=60, banner_timeout=60, look_for_keys=False, allow_agent=False)
for title, cmd in CMDS:
    _, out, err = cli.exec_command(cmd, timeout=120)
    text = (out.read().decode(errors="replace") + err.read().decode(errors="replace")).rstrip()
    print(f"=== {title} ===")
    print(text)
cli.close()
