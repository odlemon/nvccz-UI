#!/bin/bash
set -euo pipefail
echo "=== host ==="
hostname; uname -a; date
echo "=== disk/mem ==="
df -h / | tail -1
free -h | head -2
echo "=== docker ==="
command -v docker && docker --version || echo NO_DOCKER
command -v docker-compose && docker-compose --version || true
docker compose version 2>/dev/null || true
echo "=== existing www/projects ==="
ls -la /var/www 2>/dev/null || true
ls -la /var/www/projects 2>/dev/null || true
ls -la /opt 2>/dev/null | head
echo "=== ports ==="
ss -tlnp | grep -E ':80 |:443 |:3006|:3009|:3306|:8080|:22 ' || true
echo "=== mysql native ==="
command -v mysql && mysql --version || echo NO_MYSQL_CLIENT
systemctl is-active mysql 2>/dev/null || systemctl is-active mariadb 2>/dev/null || echo NO_MYSQL_SERVICE
echo "=== git ==="
git --version
echo "=== node ==="
node -v 2>/dev/null || echo NO_NODE
echo "=== ufw ==="
ufw status 2>/dev/null | head -25 || true
echo "=== pm2 ==="
pm2 list 2>/dev/null | head -20 || echo NO_PM2
