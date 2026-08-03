#!/usr/bin/env bash
# Deploy Order Notebook from your machine to the VPS.
# Usage: cp deploy/env.deploy.example deploy/.env.deploy && edit, then ./deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env.deploy"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/env.deploy.example and fill in values."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "${ENV_FILE}" && set +a

: "${VPS_HOST:?}"
: "${VPS_USER:?}"
: "${VPS_PASSWORD:?}"
: "${DATABASE_URL:?}"
: "${JWT_SECRET:?}"
: "${AI_ENCRYPTION_KEY:?}"

VPS_APP_DIR="${VPS_APP_DIR:-/opt/order-notebook}"
VPS_API_PORT="${VPS_API_PORT:-3010}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://${VPS_HOST}:3011}"

CORS_ORIGINS="${PUBLIC_ORIGIN}"
if [[ "${PUBLIC_ORIGIN}" != http://* ]]; then
  CORS_ORIGINS="${PUBLIC_ORIGIN},http://${VPS_HOST}:3011"
fi

echo "==> Building frontend for ${PUBLIC_ORIGIN}"
cd "${ROOT}/frontend"
VITE_API_BASE_URL="${PUBLIC_ORIGIN}/api/v1" npm ci
VITE_API_BASE_URL="${PUBLIC_ORIGIN}/api/v1" npm run build

echo "==> Syncing to ${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}"
SSHPASS="${VPS_PASSWORD}" sshpass -e rsync -avz --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude backend/dev.db \
  --exclude backend/tests/tmp \
  --exclude frontend/node_modules \
  --exclude mobile \
  --exclude .git \
  "${ROOT}/backend/" "${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/backend/"

SSHPASS="${VPS_PASSWORD}" sshpass -e rsync -avz --delete \
  "${ROOT}/frontend/dist/" "${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/frontend/dist/"

SSHPASS="${VPS_PASSWORD}" sshpass -e rsync -avz \
  "${ROOT}/deploy/" "${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/deploy/"

BACKEND_ENV=$(mktemp)
trap 'rm -f "${BACKEND_ENV}"' EXIT
cat > "${BACKEND_ENV}" <<EOF
NODE_ENV=production
PORT=${VPS_API_PORT}
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_ISSUER=order-notebook
JWT_AUDIENCE=order-notebook-api
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGINS=${CORS_ORIGINS}
AI_ENCRYPTION_KEY=${AI_ENCRYPTION_KEY}
AI_DEFAULT_PROVIDER=DEEPSEEK
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
EOF

SSHPASS="${VPS_PASSWORD}" sshpass -e scp "${BACKEND_ENV}" "${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/backend/.env"

echo "==> Running remote setup"
SSHPASS="${VPS_PASSWORD}" sshpass -e ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" \
  "VPS_APP_DIR=${VPS_APP_DIR} VPS_API_PORT=${VPS_API_PORT} PUBLIC_ORIGIN=${PUBLIC_ORIGIN} bash ${VPS_APP_DIR}/deploy/remote-setup.sh"

echo "==> Deploy complete: ${PUBLIC_ORIGIN}"
