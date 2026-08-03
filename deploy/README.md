# Order Notebook — VPS deploy (git pull)

App lives in `/opt/order-notebook`. Existing nginx sites and other PM2 apps are not modified except adding the isolated site `pos.mmds.site` and process `order-notebook-api`.

## First-time setup (once)

```bash
# On VPS
git clone https://github.com/hainhtat/orderbook.git /opt/order-notebook
cd /opt/order-notebook

cp deploy/env.deploy.example deploy/.env.deploy
# Edit deploy/.env.deploy — set PUBLIC_ORIGIN (e.g. http://YOUR_IP:3011)

# Create backend/.env (never commit)
nano backend/.env
```

`backend/.env` needs:

```env
NODE_ENV=production
PORT=3010
DATABASE_URL=postgresql://...?pgbouncer=true
JWT_SECRET=...
JWT_ISSUER=order-notebook
JWT_AUDIENCE=order-notebook-api
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGINS=http://YOUR_IP:3011
AI_ENCRYPTION_KEY=...
AI_DEFAULT_PROVIDER=DEEPSEEK
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

Then:

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Temp URL: `http://YOUR_IP:3011`  
Later: point `pos.mmds.site` → VPS, run certbot, set `PUBLIC_ORIGIN=https://pos.mmds.site`, update CORS, redeploy.

## Updates (after you push to GitHub)

```bash
cd /opt/order-notebook
./deploy/deploy.sh
```

That runs: `git pull` → backend migrate/build → frontend build → pm2 reload → nginx reload (this vhost only).

## Isolation

| Resource | Name / path |
| --- | --- |
| Files | `/opt/order-notebook` |
| API port | `127.0.0.1:3010` |
| Temp web | port `3011` |
| PM2 | `order-notebook-api` |
| Nginx | `pos.mmds.site` only |
| DB | Supabase (separate) |
