# Deployment TODOs

Pending work after the initial Azure deploy (as of 2026-06-17).

## 1. Uploads volume
`/app/backend/uploads` doesn't exist on Azure (no persistent storage configured). File uploads fail silently and reset on every container restart.

Fix: add an Azure Storage Account + file share mounted at `/app/backend/uploads` via App Service path mappings.

## 2. Data migration from Proxmox
User has existing data in a PostgreSQL container on Proxmox that needs moving to Azure DB.

Plan:
```bash
# On Proxmox
docker exec infragest-db-prod pg_dump -U postgres -d infragest_prod --data-only --exclude-table='_prisma_migrations' > data.sql
```
- Upload `data.sql` via the Azure Cloud Shell upload button
```bash
# In Azure Cloud Shell
psql "host=infragest-db.postgres.database.azure.com port=5432 dbname=infragest_prod user=<adminuser> sslmode=require" < data.sql
```
- No firewall rule needed since Cloud Shell is inside the Azure network.

## 3. Custom domain
Currently on `infragest-api-a3bmg5bndfa4byfm.spaincentral-01.azurewebsites.net`. GitHub Student Pack includes a free `.me` domain from Namecheap. Deferred by user — pick up once the domain is in hand.

Once obtained: App Service → Custom domains → Add, then CNAME record + free Azure-managed TLS cert (the built-in one — **not** Azure Front Door, which is unnecessary cost/complexity for a single small App Service; Front Door is for multi-region/CDN/WAF needs).

This also resolves the cosmetic "infragest-api" naming concern from item 6 below — once a custom domain is set, that's the URL users see, not the Azure resource name.

## 4. Google OAuth env vars
Skipped during initial deploy. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` to App Service environment variables when ready.

## 5. ~~Simplify Proxmox docker-compose to single co-hosted container~~ — done
Dropped the `frontend` service from `docker-compose.ghcr.yml`, deleted `nginx.conf` and `frontend/Dockerfile`, exposed the app's port 3000 directly (mapped to host `8080`), and stopped building/pushing `infragest-frontend` in `.github/workflows/docker-build-push.yml`. Updated `docs/DEPLOY-TLS.md` reverse-proxy examples to point at `infragest-app-prod:3000` instead of the old nginx container. This also removes the CSP-drift risk hit on 2026-06-17 (nginx CSP vs. backend helmet CSP) since there's now only one CSP config (helmet, in `backend/src/app.ts`).

Also renamed the published image from `infragest-backend` to `infragest-app` (and the compose service from `backend` to `app`) since it's no longer just the API — it serves the whole app.

## 6. Repoint Azure App Service at the renamed image
After this commit's workflow run publishes `ghcr.io/marcoslorcar/infragest-app:latest` for the first time:
- Azure Portal → App Service → Deployment Center → Registry settings → change image from `marcoslorcar/infragest-backend:latest` to `marcoslorcar/infragest-app:latest` → Save.
- **Do this only after the new tag exists in GHCR** (i.e. after this change is pushed and the workflow has run once), or the pull will fail and the site goes down.
- Verify the existing CD webhook (Deployment Center → Continuous deployment) still triggers: it should, since it's a generic "go re-pull the configured image" trigger fired by a repo-level GitHub webhook (Settings → Webhooks → Packages event), not tied to a specific image name — but worth a one-time check after the swap.
- Old `infragest-backend` package in GHCR becomes orphaned; safe to delete later (GitHub profile → Packages → infragest-backend → Package settings → Delete) whenever convenient.

Renaming the App Service resource itself (`infragest-api`) was considered but **rejected for now**: Azure doesn't support in-place rename (the name is baked into the default hostname), so it would mean creating a new App Service, migrating all settings, repointing the webhook, and accepting downtime — for a purely cosmetic fix. Item 3 (custom domain) solves the same visible-name problem for free once it lands, so this is deferred indefinitely rather than scheduled.
