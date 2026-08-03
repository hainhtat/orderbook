#!/usr/bin/env bash
# Run ON the VPS from the app root:
#   cd /opt/order-notebook && ./deploy/deploy.sh
#
# Safe alongside other nginx sites / pm2 apps — only touches:
#   - this git checkout
#   - pm2 process "order-notebook-api"
#   - nginx site "pos.mmds.site"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

ENV_FILE="${ROOT}/deploy/.env.deploy"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  echo "Copy deploy/env.deploy.example → deploy/.env.deploy and fill values."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "${ENV_FILE}" && set +a

: "${PUBLIC_ORIGIN:?PUBLIC_ORIGIN required in deploy/.env.deploy}"
: "${VPS_API_PORT:=3010}"

BACKEND_ENV="${ROOT}/backend/.env"
if [[ ! -f "${BACKEND_ENV}" ]]; then
  echo "Missing ${BACKEND_ENV} — create it once with DATABASE_URL, JWT_SECRET, etc."
  exit 1
fi

echo "==> git pull"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "==> backend install / migrate / build"
cd "${ROOT}/backend"
npm ci
npm run db:generate:pg
npm run db:push:pg
npm run build

echo "==> frontend build (${PUBLIC_ORIGIN}/api/v1)"
cd "${ROOT}/frontend"
npm ci
VITE_API_BASE_URL="${PUBLIC_ORIGIN}/api/v1" npm run build

echo "==> pm2 (order-notebook-api only)"
pm2 startOrReload "${ROOT}/deploy/ecosystem.config.cjs" --update-env
pm2 save

echo "==> nginx site pos.mmds.site (isolated vhost)"
if [[ -d /etc/nginx/sites-available ]]; then
  SITE="/etc/nginx/sites-available/pos.mmds.site"
  # Do not overwrite an existing vhost — certbot manages SSL there.
  if [[ ! -f "${SITE}" ]]; then
    cp "${ROOT}/deploy/nginx-pos.conf" "${SITE}"
    ln -sf "${SITE}" /etc/nginx/sites-enabled/pos.mmds.site
  else
    echo "    keeping existing ${SITE} (preserves SSL)"
  fi
  nginx -t
  systemctl reload nginx
fi

echo "==> Done"
echo "    Web: ${PUBLIC_ORIGIN}"
echo "    API: 127.0.0.1:${VPS_API_PORT} (proxied via nginx /api/v1)"
pm2 describe order-notebook-api 2>/dev/null | head -25 || pm2 list | grep order-notebook || true
