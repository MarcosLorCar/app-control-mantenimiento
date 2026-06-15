# Plan: Rename project to InfraGest

## Context

The repo is currently named `app-control-mantenimiento` (a Spanish description, not a brand name), which the user finds unprofessional and annoying. The chosen brand name is **InfraGest** — already used as the UI display name (`INFRAGEST`), so the frontend needs no changes. This plan renames every internal identifier to align with the brand: repo, npm scope, Docker images, compose project, container names, and database names.

GitHub naming convention: **lowercase, kebab-case** (`infragest` — one word, no hyphen needed).

---

## Scope of changes

### 1. GitHub repo rename (manual step — done on GitHub.com)

Settings → General → Repository name → `infragest` → Rename.

Git's remote URL auto-redirects; existing clones continue to work. After renaming, update the local remote if desired:
```bash
git remote set-url origin git@github.com:JavierLoro/infragest.git
```

Local directory name (`app-control-mantenimiento/`) is optional to rename — it has no effect on the code.

---

### 2. npm workspace scope: `@control-actions/*` → `@infragest/*`

**Files to edit:**

| File | Change |
|---|---|
| `package.json` | `"name": "control-actions"` → `"name": "infragest"` |
| `backend/package.json` | `"name": "@control-actions/backend"` → `"@infragest/backend"`, dep ref `@control-actions/shared` → `@infragest/shared` |
| `frontend/package.json` | same pattern |
| `shared/package.json` | `"name": "@control-actions/shared"` → `"@infragest/shared"` |
| `frontend/tsconfig.json` | path alias `"@control-actions/shared"` → `"@infragest/shared"` |
| `backend/Dockerfile` | all `--workspace=@control-actions/*` flags |
| `frontend/Dockerfile` | same |
| `package-lock.json` | regenerated automatically after package.json edits (`npm install`) |

**Source imports** — find-and-replace across the repo:

Pattern: `from '@control-actions/shared'` → `from '@infragest/shared'`

Affected files (all occurrences):
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/plugins/auth.plugin.ts`
- `backend/tests/helpers/app.ts`
- `backend/tests/auth.test.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/api/auth.ts`

**Scripts in `package.json` and `dev.sh`:** replace `--workspace=@control-actions/frontend` etc.

**CLAUDE.md and README.md:** update workspace references in command examples.

---

### 3. Docker images: `app-control-mantenimiento-{backend,frontend}` → `infragest-{backend,frontend}`

**`docker-compose.ghcr.yml`:**
- `image: ghcr.io/javierloro/app-control-mantenimiento-backend:latest` → `ghcr.io/javierloro/infragest-backend:latest`
- `image: ghcr.io/javierloro/app-control-mantenimiento-frontend:latest` → `ghcr.io/javierloro/infragest-frontend:latest`

**`.github/workflows/docker-build-push.yml`** (lines 42–46):
- All four tag lines: replace `app-control-mantenimiento-backend` → `infragest-backend`, `app-control-mantenimiento-frontend` → `infragest-frontend`

---

### 4. Docker Compose project name and container names

**`.env.example`:**
- `COMPOSE_PROJECT_NAME=app-control-mantenimiento` → `COMPOSE_PROJECT_NAME=infragest`

**`docker-compose.ghcr.yml`:**
- `name: app-control-mantenimiento` → `name: infragest`
- `container_name: control-actions-db-prod` → `infragest-db-prod`
- `container_name: control-actions-backend-prod` → `infragest-backend-prod`
- `container_name: control-actions-frontend-prod` → `infragest-frontend-prod`

**`docker-compose.yml`:**
- `container_name: control-actions-db` → `infragest-db`

**`dev.sh`:**
- `docker exec control-actions-db` → `docker exec infragest-db`

---

### 5. Database names: `control_actions_*` → `infragest_*`

> ⚠️ If a production DB is already running, this requires a manual Postgres rename or a new DB + migration. For dev, just drop and recreate.

**`docker-compose.yml`:** `POSTGRES_DB: control_actions_dev` → `infragest_dev`

**`docker-compose.ghcr.yml`:**
- `POSTGRES_DB: control_actions_prod` → `infragest_prod`
- pg_isready healthcheck and `DATABASE_URL` connection string

**`backend/.env.example`:**
- `control_actions_dev` → `infragest_dev`
- `control_actions_test` → `infragest_test`

**`backend/.env`** (local, not committed): update manually after running the plan.

---

### 6. Docs cleanup

**`README.md`:** title `# INFRAGEST (control-actions)` → `# INFRAGEST`

**`docs/ROADMAP.md`:** `# Roadmap — control-actions` → `# Roadmap — InfraGest`

**`docs/schemabbdd.txt`:** first-line comment `// control-actions — Database Schema` → `// infragest — Database Schema`

**`docs/wiki/README.md` and `docs/wiki/overview.md`:** replace `control-actions` in headings/body.

---

## Suggested implementation order

1. Do the GitHub rename first (so the remote URL is stable before pushing).
2. Run a global find-and-replace on `@control-actions/` → `@infragest/` across all source files.
3. Edit Docker-related files (`docker-compose.*`, workflow YAML, Dockerfiles).
4. Edit config files (`.env.example`, `package.json` names).
5. `npm install` to regenerate `package-lock.json`.
6. Edit docs.
7. Recreate local dev DB with new name: `docker compose down -v && docker compose up -d`.
8. Run `npm run db:migrate --workspace=@infragest/backend` to verify the stack comes up clean.

---

## Verification

```bash
# No remaining old identifiers
grep -r "control-actions" . --include="*.ts" --include="*.json" --include="*.yml" --include="*.sh" --exclude-dir=node_modules --exclude-dir=.git

grep -r "control_actions" . --include="*.ts" --include="*.json" --include="*.yml" --include="*.sh" --include="*.env*" --exclude-dir=node_modules --exclude-dir=.git

grep -r "app-control-mantenimiento" . --exclude-dir=node_modules --exclude-dir=.git

# Dev stack starts cleanly
./dev.sh

# Tests pass
npm test --workspace=@infragest/backend
```
