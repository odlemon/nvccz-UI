#!/bin/bash
set -euo pipefail

APP_DIR=/var/www/nvccz-ui
APP_PORT=3006
NGINX_PORT=8080
REPO=https://github.com/odlemon/nvccz-UI.git

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin dev
  git checkout dev
  git reset --hard origin/dev
else
  git clone -b dev "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://31.220.82.129:3009/api
EOF

export NODE_OPTIONS="--max-old-space-size=4096"
npm install
npm run build

pm2 delete nvccz-ui 2>/dev/null || true
pm2 start npm --name nvccz-ui --cwd "$APP_DIR" -- start -- -p "$APP_PORT"
pm2 save

cat > /etc/nginx/sites-available/nvccz-ui <<NGINX
server {
    listen ${NGINX_PORT};
    listen [::]:${NGINX_PORT};
    server_name 207.180.234.151;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/nvccz-ui /etc/nginx/sites-enabled/nvccz-ui
nginx -t
systemctl reload nginx

echo "DEPLOY_OK"
ss -tlnp | grep -E ":${APP_PORT}|:${NGINX_PORT}" || true
pm2 list
curl -s -o /dev/null -w "HTTP %{http_code} on :${NGINX_PORT}\n" "http://127.0.0.1:${NGINX_PORT}/"
