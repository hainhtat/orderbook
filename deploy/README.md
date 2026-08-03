# Order Notebook — VPS + Supabase deployment

Deploys **only** into `/opt/order-notebook` with a dedicated nginx vhost and PM2 process named `order-notebook-api`. Existing sites and bots are not modified except adding one nginx site file.

## Prerequisites

1. **Supabase project** — create at [supabase.com](https://supabase.com)
   - Project Settings → Database → **Connection string** → **URI**
   - Use the **Transaction pooler** URL (port **6543**) and append `?pgbouncer=true`
   - Example: `postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **Secrets** — generate locally:
   ```bash
   openssl rand -base64 32   # JWT_SECRET
   openssl rand -base64 32   # AI_ENCRYPTION_KEY
   ```

3. **Local tools:** `sshpass`, `rsync`, Node 20+

   ```bash
   brew install sshpass   # macOS
   ```

## Deploy

```bash
cp deploy/env.deploy.example deploy/.env.deploy
# Edit deploy/.env.deploy — fill VPS password, DATABASE_URL, JWT_SECRET, AI_ENCRYPTION_KEY

chmod +x deploy/deploy.sh deploy/remote-setup.sh
./deploy/deploy.sh
```

## After deploy

| Check | Command / URL |
| --- | --- |
| Temp web UI | `http://207.148.121.162:3011` |
| API health | `curl http://207.148.121.162:3011/api/v1/...` (auth required) |
| PM2 | `ssh root@207.148.121.162 'pm2 list'` — look for `order-notebook-api` only |
| Logs | `pm2 logs order-notebook-api` |

## DNS (later)

1. Add `A` record: `pos.mmds.site` → `207.148.121.162`
2. Enable HTTPS:
   ```bash
   certbot --nginx -d pos.mmds.site
   ```
3. Update `deploy/.env.deploy` `PUBLIC_ORIGIN=https://pos.mmds.site` and redeploy (updates CORS + frontend API URL)
4. Remove the temporary `listen 3011` block from `deploy/nginx-pos.conf` if desired

## Isolation guarantees

- App files: `/opt/order-notebook/` only
- Backend port: **3010** (localhost)
- Public web: nginx vhost **pos.mmds.site** (+ temp port **3011**)
- PM2 name: **order-notebook-api** — `pm2 startOrReload` only touches this app
- Database: separate Supabase project (not shared with other apps)

## Rotate credentials

After first successful deploy, change the VPS root password and rotate Supabase DB password if it was shared.
