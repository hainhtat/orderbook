#!/usr/bin/env bash
# Runs ON the VPS after code sync. Idempotent; safe alongside other nginx/pm2 apps.
set -euo pipefail

APP_DIR="${VPS_APP_DIR:-/opt/order-notebook}"
API_PORT="${VPS_API_PORT:-3010}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://127.0.0.1:3011}"

echo "==> Order Notebook remote setup in ${APP_DIR}"

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

mkdir -p "${APP_DIR}/backend" "${APP_DIR}/frontend/dist"

cd "${APP_DIR}/backend"
npm ci --omit=dev
npm run db:generate:pg
npm run build

if [[ -f "${APP_DIR}/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/backend/.env"
  set +a
  echo "==> Pushing schema to Supabase..."
  npm run db:push:pg
fi

pm2 startOrReload "${APP_DIR}/deploy/ecosystem.config.cjs" --update-env
pm2 save

NGINX_SITE="/etc/nginx/sites-available/pos.mmds.site"
cp "${APP_DIR}/deploy/nginx-pos.conf" "${NGINX_SITE}"
ln -sf "${NGINX_SITE}" /etc/nginx/sites-enabled/pos.mmds.site

nginx -t
systemctl reload nginx

echo "==> Done. API on 127.0.0.1:${API_PORT}, web via nginx."
echo "    Temp URL: ${PUBLIC_ORIGIN} (port 3011 until DNS)"
pm2 list | grep order-notebook || true
