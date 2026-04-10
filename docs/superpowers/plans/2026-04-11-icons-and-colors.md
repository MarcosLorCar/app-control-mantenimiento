# Icons & Colors for Action/Infrastructure Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assign Lucide icons + hex colors to action types, and allow uploading custom images for infrastructure types, both managed from the admin Catalog panel.

**Architecture:** Prisma migration adds `icon`/`color` to `action_types` and `iconUrl` to `infrastructure_types`. Backend gains PATCH endpoints for action types, a multipart upload endpoint for infra type icons, and Fastify serves the `backend/uploads/` directory statically. The frontend adds an icon/color picker in the admin Catalog, updates action type badges throughout the app, and updates InfrastructureList to render uploaded icons.

**Tech Stack:** Prisma, Fastify + `@fastify/multipart` + `@fastify/static`, Zod, React 18, TypeScript, TanStack Query, Lucide React, Tailwind/CSS variables.

---

## Files

| File | Action |
|------|--------|
| `backend/prisma/schema.prisma` | Modify — add `icon`, `color` to ActionType; `iconUrl` to InfrastructureType |
| `backend/src/app.ts` | Modify — register `@fastify/multipart` + `@fastify/static` |
| `backend/src/modules/catalog/catalog.schema.ts` | Modify — add icon/color to schemas, add UpdateActionTypeSchema |
| `backend/src/modules/catalog/catalog.service.ts` | Modify — add `updateActionType`, `updateInfrastructureType` |
| `backend/src/modules/catalog/catalog.routes.ts` | Modify — add PATCH action-types/:id, PATCH infra-types/:id, POST infra-types/:id/icon |
| `frontend/src/api/types.ts` | Modify — add `icon`, `color` to ActionType; `iconUrl` to InfrastructureType; update ActionWithRelations Pick |
| `frontend/src/api/catalog.ts` | Modify — add `updateActionType`, `uploadInfraTypeIcon` |
| `frontend/src/hooks/useCatalog.ts` | Modify — add `useUpdateActionType`, `useUploadInfraTypeIcon` |
| `frontend/src/utils/actionTypeIcons.ts` | Create — icon map for picker and badge rendering |
| `frontend/src/pages/admin/Catalog.tsx` | Modify — icon/color picker for action types; icon upload for infra types |
| `frontend/src/pages/infrastructures/InfrastructureDetail.tsx` | Modify — action type badge uses icon+color |
| `frontend/src/pages/actions/ActionsPage.tsx` | Modify — action type badge uses icon+color |
| `frontend/src/pages/infrastructures/InfrastructureList.tsx` | Modify — use iconUrl image if available |
| `frontend/vite.config.ts` | Modify — proxy `/uploads` to backend |

---

### Task 1: Prisma migration — add icon/color/iconUrl

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add fields to schema**

In `backend/prisma/schema.prisma`, update both models:

```prisma
model ActionType {
  id                Int      @id @default(autoincrement())
  name              String   @unique
  description       String?
  consumesMaterials Boolean  @default(false) @map("consumes_materials")
  icon              String?
  color             String?
  actions           Action[]

  @@map("action_types")
}

model InfrastructureType {
  id              Int              @id @default(autoincrement())
  name            String           @unique
  description     String?
  iconUrl         String?          @map("icon_url")
  infrastructures Infrastructure[]

  @@map("infrastructure_types")
}
```

- [ ] **Step 2: Run migration**

```bash
npm run db:migrate --workspace=@control-actions/backend -- --name add_type_icons_and_colors
```

Expected: migration created and applied, Prisma Client regenerated.

If the Prisma Client DLL is locked on Windows, run:
```bash
npx prisma generate --schema=backend/prisma/schema.prisma
```

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add icon/color to action_types and iconUrl to infrastructure_types"
```

---

### Task 2: Install multipart + static packages and configure app.ts

**Files:**
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Install packages**

```bash
npm install @fastify/multipart @fastify/static --workspace=@control-actions/backend
```

Expected: packages appear in `backend/package.json` dependencies.

- [ ] **Step 2: Create uploads directory**

```bash
mkdir -p backend/uploads
echo "" > backend/uploads/.gitkeep
```

- [ ] **Step 3: Update app.ts**

Replace `backend/src/app.ts` with:

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import prismaPlugin from './plugins/prisma.plugin'
import authPlugin from './plugins/auth.plugin'
import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'
import catalogRoutes from './modules/catalog/catalog.routes'
import infrastructuresRoutes from './modules/infrastructures/infrastructures.routes'
import actionsRoutes from './modules/actions/actions.routes'

export interface AppOptions {
  jwtSecret: string
  jwtRefreshSecret: string
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: opts.jwtSecret,
    cookie: { cookieName: 'refreshToken', signed: false },
  })
  await app.register(fastifyMultipart, { limits: { fileSize: 500 * 1024 } })
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  })
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
    })
  })

  app.get('/api/v1/health', async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(usersRoutes, { prefix: '/api/v1/users' })
  await app.register(catalogRoutes, { prefix: '/api/v1/catalog' })
  await app.register(infrastructuresRoutes, { prefix: '/api/v1/infrastructures' })
  await app.register(actionsRoutes, { prefix: '/api/v1' })

  return app
}
```

> Note: `path.join(__dirname, '..', 'uploads')` resolves to `backend/uploads/` both during dev (tsx runs from `backend/src/`) and production (compiled to `backend/dist/`).

- [ ] **Step 4: Add .gitkeep to git**

```bash
git add backend/uploads/.gitkeep backend/src/app.ts backend/package.json package-lock.json
git commit -m "feat: install @fastify/multipart + @fastify/static, serve uploads directory"
```

---

### Task 3: Backend catalog schema — add update schemas

**Files:**
- Modify: `backend/src/modules/catalog/catalog.schema.ts`

- [ ] **Step 1: Replace full file**

```typescript
import { z } from 'zod'

export const CreateActionTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  consumesMaterials: z.boolean().default(false),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const UpdateActionTypeSchema = CreateActionTypeSchema.partial()

export const CreateInfrastructureTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const UpdateInfrastructureTypeSchema = CreateInfrastructureTypeSchema.partial()

export type CreateActionTypeBody = z.infer<typeof CreateActionTypeSchema>
export type UpdateActionTypeBody = z.infer<typeof UpdateActionTypeSchema>
export type CreateInfrastructureTypeBody = z.infer<typeof CreateInfrastructureTypeSchema>
export type UpdateInfrastructureTypeBody = z.infer<typeof UpdateInfrastructureTypeSchema>
```

- [ ] **Step 2: Build backend**

```bash
npm run build:backend 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/catalog/catalog.schema.ts
git commit -m "feat: add UpdateActionTypeSchema and UpdateInfrastructureTypeSchema"
```

---

### Task 4: Backend catalog service — add update functions

**Files:**
- Modify: `backend/src/modules/catalog/catalog.service.ts`

- [ ] **Step 1: Replace full file**

```typescript
import { PrismaClient } from '@prisma/client'
import {
  CreateActionTypeBody, UpdateActionTypeBody,
  CreateInfrastructureTypeBody, UpdateInfrastructureTypeBody,
} from './catalog.schema'

export async function listRoles(db: PrismaClient) {
  return db.role.findMany({ orderBy: { id: 'asc' } })
}

export async function listActionTypes(db: PrismaClient) {
  return db.actionType.findMany({ orderBy: { name: 'asc' } })
}

export async function createActionType(db: PrismaClient, body: CreateActionTypeBody) {
  const existing = await db.actionType.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Ya existe un tipo de acción con ese nombre' }
  return db.actionType.create({ data: body })
}

export async function updateActionType(db: PrismaClient, id: number, body: UpdateActionTypeBody) {
  const existing = await db.actionType.findUnique({ where: { id } })
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tipo de acción no encontrado' }
  return db.actionType.update({ where: { id }, data: body })
}

export function listInfrastructureTypes(db: PrismaClient) {
  return db.infrastructureType.findMany({ orderBy: { name: 'asc' } })
}

export async function createInfrastructureType(db: PrismaClient, body: CreateInfrastructureTypeBody) {
  const existing = await db.infrastructureType.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Ya existe un tipo con ese nombre' }
  return db.infrastructureType.create({ data: body })
}

export async function updateInfrastructureType(db: PrismaClient, id: number, body: UpdateInfrastructureTypeBody) {
  const existing = await db.infrastructureType.findUnique({ where: { id } })
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' }
  return db.infrastructureType.update({ where: { id }, data: body })
}

export async function setInfrastructureTypeIcon(db: PrismaClient, id: number, iconUrl: string) {
  return db.infrastructureType.update({ where: { id }, data: { iconUrl } })
}
```

- [ ] **Step 2: Build backend**

```bash
npm run build:backend 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/catalog/catalog.service.ts
git commit -m "feat: add updateActionType, updateInfrastructureType, setInfrastructureTypeIcon"
```

---

### Task 5: Backend catalog routes — PATCH + upload endpoints

**Files:**
- Modify: `backend/src/modules/catalog/catalog.routes.ts`

- [ ] **Step 1: Replace full file**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import {
  CreateActionTypeSchema, UpdateActionTypeSchema,
  CreateInfrastructureTypeSchema, UpdateInfrastructureTypeSchema,
} from './catalog.schema'
import {
  listRoles, listActionTypes, createActionType, updateActionType,
  listInfrastructureTypes, createInfrastructureType, updateInfrastructureType,
  setInfrastructureTypeIcon,
} from './catalog.service'

const ALLOWED_MIMES = ['image/png', 'image/svg+xml', 'image/jpeg']

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/roles', { preHandler: fastify.requireManage }, async (_req, reply) => {
    const data = await listRoles(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/action-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listActionTypes(fastify.db)
    return reply.send({ data })
  })

  fastify.post('/action-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createActionType(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/action-types/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateActionType(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.get('/infrastructure-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listInfrastructureTypes(fastify.db)
    return reply.send({ data })
  })

  fastify.post('/infrastructure-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateInfrastructureTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createInfrastructureType(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/infrastructure-types/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateInfrastructureTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateInfrastructureType(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/infrastructure-types/:id/icon', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const infraId = Number(id)

    const existing = await fastify.db.infrastructureType.findUnique({ where: { id: infraId } })
    if (!existing) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' } })

    const fileData = await request.file()
    if (!fileData) return reply.code(400).send({ error: { code: 'NO_FILE', message: 'No se subió ningún archivo' } })

    if (!ALLOWED_MIMES.includes(fileData.mimetype)) {
      fileData.file.resume()
      return reply.code(400).send({ error: { code: 'INVALID_FILE', message: 'Solo se admiten PNG, SVG o JPEG' } })
    }

    const ext = fileData.mimetype === 'image/svg+xml' ? 'svg' : fileData.mimetype.split('/')[1]
    const filename = `infra-type-${infraId}.${ext}`
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, filename)

    await pipeline(fileData.file, createWriteStream(filePath))

    const data = await setInfrastructureTypeIcon(fastify.db, infraId, `/uploads/${filename}`)
    return reply.send({ data })
  })
}

export default catalogRoutes
```

- [ ] **Step 2: Build backend**

```bash
npm run build:backend 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/catalog/catalog.routes.ts
git commit -m "feat: PATCH action-types/:id, PATCH/POST icon for infrastructure-types"
```

---

### Task 6: Frontend types — add icon/color/iconUrl

**Files:**
- Modify: `frontend/src/api/types.ts`

- [ ] **Step 1: Update ActionType and InfrastructureType interfaces**

In `frontend/src/api/types.ts`, update the two interfaces and the ActionWithRelations Pick:

```typescript
export interface ActionType {
  id: number
  name: string
  description: string | null
  consumesMaterials: boolean
  icon: string | null
  color: string | null
}

export interface InfrastructureType {
  id: number
  name: string
  description: string | null
  iconUrl: string | null
}
```

Also update `ActionWithRelations` to include `icon` and `color` in the Pick:

```typescript
export interface ActionWithRelations extends Action {
  actionType: Pick<ActionType, 'id' | 'name' | 'consumesMaterials' | 'icon' | 'color'>
  performer: { id: number; fullName: string; email: string }
  materials: ActionMaterial[]
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/types.ts
git commit -m "feat: add icon/color to ActionType, iconUrl to InfrastructureType frontend types"
```

---

### Task 7: Frontend API + hooks — add update/upload mutations

**Files:**
- Modify: `frontend/src/api/catalog.ts`
- Modify: `frontend/src/hooks/useCatalog.ts`

- [ ] **Step 1: Update api/catalog.ts**

Replace full file:

```typescript
import { apiFetch, API_BASE, getToken } from './client'
import type { ActionType, Role, InfrastructureType } from './types'

type ApiData<T> = { data: T }

export function listActionTypes(): Promise<ActionType[]> {
  return apiFetch<ApiData<ActionType[]>>(`${API_BASE}/catalog/action-types`).then(r => r.data)
}

export function listRoles(): Promise<Role[]> {
  return apiFetch<ApiData<Role[]>>(`${API_BASE}/catalog/roles`).then(r => r.data)
}

export function createActionType(body: {
  name: string
  description?: string
  consumesMaterials: boolean
  icon?: string
  color?: string
}): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/catalog/action-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateActionType(id: number, body: {
  name?: string
  description?: string
  consumesMaterials?: boolean
  icon?: string | null
  color?: string | null
}): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/catalog/action-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function listInfrastructureTypes(): Promise<InfrastructureType[]> {
  return apiFetch<ApiData<InfrastructureType[]>>(`${API_BASE}/catalog/infrastructure-types`).then(r => r.data)
}

export function createInfrastructureType(body: { name: string; description?: string }): Promise<InfrastructureType> {
  return apiFetch<ApiData<InfrastructureType>>(`${API_BASE}/catalog/infrastructure-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export async function uploadInfraTypeIcon(id: number, file: File): Promise<InfrastructureType> {
  const formData = new FormData()
  formData.append('file', file)
  const token = getToken()
  const res = await fetch(`${API_BASE}/catalog/infrastructure-types/${id}/icon`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) throw await res.json()
  const { data } = await res.json()
  return data
}
```

- [ ] **Step 2: Update hooks/useCatalog.ts**

Replace full file:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActionTypes, listRoles, createActionType, updateActionType,
  listInfrastructureTypes, createInfrastructureType, uploadInfraTypeIcon,
} from '../api/catalog'

export function useActionTypes() {
  return useQuery({
    queryKey: ['catalog', 'action-types'],
    queryFn: listActionTypes,
    staleTime: Infinity,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['catalog', 'roles'],
    queryFn: listRoles,
    staleTime: Infinity,
  })
}

export function useCreateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActionType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'action-types'] }),
  })
}

export function useUpdateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateActionType>[1] }) =>
      updateActionType(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'action-types'] })
      // Invalidate actions cache too since badges use icon/color
      qc.invalidateQueries({ queryKey: ['actions'] })
    },
  })
}

export function useInfrastructureTypes() {
  return useQuery({
    queryKey: ['catalog', 'infrastructure-types'],
    queryFn: listInfrastructureTypes,
    staleTime: Infinity,
  })
}

export function useCreateInfrastructureType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInfrastructureType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] }),
  })
}

export function useUploadInfraTypeIcon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadInfraTypeIcon(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] })
      qc.invalidateQueries({ queryKey: ['infrastructures'] })
    },
  })
}
```

- [ ] **Step 3: Build frontend to catch type errors**

```bash
npm run build --workspace=@control-actions/frontend 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/catalog.ts frontend/src/hooks/useCatalog.ts
git commit -m "feat: add updateActionType + uploadInfraTypeIcon API functions and hooks"
```

---

### Task 8: Shared icon map utility

**Files:**
- Create: `frontend/src/utils/actionTypeIcons.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  Wrench, Eye, Hammer, Zap, Shield, ClipboardCheck,
  Paintbrush, Trash2, Settings2, AlertTriangle, Droplets,
  Leaf, Flame, Gauge, Plug, Cable, HardHat, Shovel, Lightbulb, Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_OPTIONS = [
  'Wrench', 'Eye', 'Hammer', 'Zap', 'Shield', 'ClipboardCheck',
  'Paintbrush', 'Trash2', 'Settings2', 'AlertTriangle', 'Droplets',
  'Leaf', 'Flame', 'Gauge', 'Plug', 'Cable', 'HardHat', 'Shovel', 'Lightbulb', 'Star',
] as const

export const ICON_MAP: Record<string, LucideIcon> = {
  Wrench, Eye, Hammer, Zap, Shield, ClipboardCheck,
  Paintbrush, Trash2, Settings2, AlertTriangle, Droplets,
  Leaf, Flame, Gauge, Plug, Cable, HardHat, Shovel, Lightbulb, Star,
}

/** Renders the colored icon+name badge for an action type.
 *  Returns null — use inline JSX in components for full control.
 *  Use ICON_MAP[actionType.icon] to get the LucideIcon component.
 */
export function getActionTypeIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null
  return ICON_MAP[iconName] ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/actionTypeIcons.ts
git commit -m "feat: shared ICON_MAP and ICON_OPTIONS utility for action type icons"
```

---

### Task 9: Admin Catalog — icon/color picker + infra icon upload

**Files:**
- Modify: `frontend/src/pages/admin/Catalog.tsx`

This is the main UI task. The Catalog page gets:
- Action types: each row shows icon preview; inline edit form with icon picker grid + color input
- Infrastructure types: each row shows icon thumbnail + "Subir icono" button

- [ ] **Step 1: Replace full Catalog.tsx**

```tsx
import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import {
  useActionTypes, useRoles, useCreateActionType, useUpdateActionType,
  useInfrastructureTypes, useCreateInfrastructureType, useUploadInfraTypeIcon,
} from '../../hooks/useCatalog'
import { useAuth } from '../../hooks/useAuth'
import { ICON_MAP, ICON_OPTIONS } from '../../utils/actionTypeIcons'

const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

function ActionTypeRow({ at, canManage }: {
  at: { id: number; name: string; consumesMaterials: boolean; icon: string | null; color: string | null }
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [icon, setIcon] = useState(at.icon ?? '')
  const [color, setColor] = useState(at.color ?? '#6B7280')
  const updateMut = useUpdateActionType()

  const Icon = icon ? ICON_MAP[icon] : null
  const displayColor = at.color ?? '#6B7280'

  function handleSave() {
    updateMut.mutate(
      { id: at.id, body: { icon: icon || null, color } },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: displayColor + '20' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: displayColor }} />
            </span>
          ) : (
            <span className="w-6 h-6 rounded-md bg-gray-100 shrink-0" />
          )}
          <span className="text-sm text-fg truncate">{at.name}</span>
          {at.consumesMaterials && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-info-bg text-primary">
              materiales
            </span>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-[11px] text-muted hover:text-fg-secondary shrink-0 transition-colors"
          >
            {editing ? 'Cerrar' : 'Icono'}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-2 p-3 bg-app-bg rounded-lg border border-app-border space-y-3">
          {/* Icon picker */}
          <div>
            <p className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wide mb-1.5">Icono</p>
            <div className="grid grid-cols-10 gap-1">
              {ICON_OPTIONS.map(name => {
                const Ic = ICON_MAP[name]
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => setIcon(icon === name ? '' : name)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      icon === name
                        ? 'bg-primary text-primary-fg'
                        : 'bg-card text-muted hover:bg-app-bg hover:text-fg'
                    }`}
                  >
                    <Ic className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wide">Color</p>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 rounded-md border border-app-border cursor-pointer bg-transparent"
            />
            <span className="text-[11px] text-muted font-mono">{color}</span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMut.isPending}
              className="px-3 py-1 text-xs text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {updateMut.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

function InfraTypeRow({ it, canManage }: {
  it: { id: number; name: string; iconUrl: string | null }
  canManage: boolean
}) {
  const uploadMut = useUploadInfraTypeIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    uploadMut.mutate(
      { id: it.id, file },
      { onError: (err: any) => setUploadError(err?.error?.message ?? 'Error al subir icono') }
    )
    e.target.value = ''
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {it.iconUrl ? (
            <img
              src={it.iconUrl}
              alt={it.name}
              className="w-6 h-6 object-contain rounded-sm shrink-0"
            />
          ) : (
            <span className="w-6 h-6 rounded-sm bg-gray-100 shrink-0" />
          )}
          <span className="text-sm text-fg truncate">{it.name}</span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMut.isPending}
            className="flex items-center gap-1 text-[11px] text-muted hover:text-fg-secondary shrink-0 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            {uploadMut.isPending ? 'Subiendo...' : 'Subir'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {uploadError && <p className="text-[11px] text-error mt-1">{uploadError}</p>}
    </li>
  )
}

export function Catalog() {
  const [typeName, setTypeName] = useState('')
  const [consumesMaterials, setConsumesMaterials] = useState(false)
  const [typeError, setTypeError] = useState('')

  const [infraTypeName, setInfraTypeName] = useState('')
  const [infraTypeError, setInfraTypeError] = useState('')

  const { user } = useAuth()
  const { data: actionTypes = [] } = useActionTypes()
  const { data: roles = [] } = useRoles()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const addType = useCreateActionType()
  const addInfraType = useCreateInfrastructureType()

  const canManage = !!user?.can_manage

  function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeName.trim()) return
    setTypeError('')
    addType.mutate(
      { name: typeName.trim(), consumesMaterials },
      {
        onSuccess: () => { setTypeName(''); setConsumesMaterials(false) },
        onError: (err: any) => setTypeError(err?.error?.message ?? 'Error al añadir tipo'),
      }
    )
  }

  function handleAddInfraType(e: React.FormEvent) {
    e.preventDefault()
    if (!infraTypeName.trim()) return
    setInfraTypeError('')
    addInfraType.mutate(
      { name: infraTypeName.trim() },
      {
        onSuccess: () => setInfraTypeName(''),
        onError: (err: any) => setInfraTypeError(err?.error?.message ?? 'Error al añadir tipo'),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Tipos de acción */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de acción</h2>
          <ul className="divide-y divide-app-border mb-4">
            {actionTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {actionTypes.map(at => (
              <ActionTypeRow key={at.id} at={at} canManage={canManage} />
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-fg-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consumesMaterials}
                    onChange={e => setConsumesMaterials(e.target.checked)}
                    className="rounded"
                  />
                  Consume materiales
                </label>
                <button
                  type="submit"
                  disabled={!typeName.trim() || addType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shrink-0"
                >
                  {addType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {typeError && <p className="text-error text-xs">{typeError}</p>}
            </form>
          )}
        </div>

        {/* Tipos de infraestructura */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de infraestructura</h2>
          <ul className="divide-y divide-app-border mb-4">
            {infraTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {infraTypes.map(it => (
              <InfraTypeRow key={it.id} it={it} canManage={canManage} />
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddInfraType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={infraTypeName}
                onChange={e => setInfraTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!infraTypeName.trim() || addInfraType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {addInfraType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {infraTypeError && <p className="text-error text-xs">{infraTypeError}</p>}
            </form>
          )}
        </div>

        {/* Roles */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Roles</h2>
          <ul className="divide-y divide-app-border">
            {roles.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin roles definidos</li>
            )}
            {roles.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-fg">{r.name}</span>
                <div className="flex gap-1 shrink-0">
                  {r.canWrite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-bg text-success">
                      escritura
                    </span>
                  )}
                  {r.canManage && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning-bg text-warning">
                      gestión
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify no type errors**

```bash
npm run build --workspace=@control-actions/frontend 2>&1 | tail -15
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/Catalog.tsx
git commit -m "feat: icon/color picker for action types and icon upload for infra types in Catalog"
```

---

### Task 10: Update action type badge in InfrastructureDetail and ActionsPage

**Files:**
- Modify: `frontend/src/pages/infrastructures/InfrastructureDetail.tsx`
- Modify: `frontend/src/pages/actions/ActionsPage.tsx`

The side panel header badge in both files currently shows:
```tsx
<span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
  {selected.actionType.name}
</span>
```

Replace with a dynamic icon+color badge in both files.

- [ ] **Step 1: Update InfrastructureDetail.tsx badge**

In `frontend/src/pages/infrastructures/InfrastructureDetail.tsx`, add import at top:

```tsx
import { getActionTypeIcon } from '../../utils/actionTypeIcons'
```

Replace the badge span in the side panel header (inside the panel `{selected && ...}` block):

```tsx
{/* Before: */}
<span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
  {selected.actionType.name}
</span>

{/* After: */}
{(() => {
  const Icon = getActionTypeIcon(selected.actionType.icon)
  const color = selected.actionType.color ?? '#6B7280'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
      style={{ background: color + '20', color }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {selected.actionType.name}
    </span>
  )
})()}
```

- [ ] **Step 2: Update ActionsPage.tsx badge**

In `frontend/src/pages/actions/ActionsPage.tsx`, add import:

```tsx
import { getActionTypeIcon } from '../../utils/actionTypeIcons'
```

Find the side panel header badge (line ~128-130):
```tsx
<span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-warning-bg text-warning">
  {selected.actionType.name}
</span>
```

Replace with:
```tsx
{(() => {
  const Icon = getActionTypeIcon(selected.actionType.icon)
  const color = selected.actionType.color ?? '#6B7280'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
      style={{ background: color + '20', color }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {selected.actionType.name}
    </span>
  )
})()}
```

- [ ] **Step 3: Build**

```bash
npm run build --workspace=@control-actions/frontend 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/infrastructures/InfrastructureDetail.tsx frontend/src/pages/actions/ActionsPage.tsx
git commit -m "feat: action type badge shows icon+color in InfrastructureDetail and ActionsPage"
```

---

### Task 11: InfrastructureList — use iconUrl for infra type icon

**Files:**
- Modify: `frontend/src/pages/infrastructures/InfrastructureList.tsx`

Currently the list uses a hardcoded `TYPE_ICONS` map keyed by type name. If `infraType.iconUrl` is set, use an `<img>` instead.

- [ ] **Step 1: Update the icon rendering inside the card**

Find the icon rendering section inside the `.map(infra => ...)` block:

```tsx
{/* Before: */}
<div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 ${
  isNearby ? 'bg-white/60' : 'bg-info-bg'
}`}>
  <Icon className={`w-5 h-5 ${isNearby ? 'text-[var(--success)]' : 'text-primary'}`} />
</div>
```

Replace with:

```tsx
<div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden ${
  isNearby ? 'bg-white/60' : 'bg-info-bg'
}`}>
  {infra.infraType?.iconUrl ? (
    <img
      src={infra.infraType.iconUrl}
      alt={infra.infraType.name}
      className="w-7 h-7 object-contain"
    />
  ) : (
    <Icon className={`w-5 h-5 ${isNearby ? 'text-[var(--success)]' : 'text-primary'}`} />
  )}
</div>
```

- [ ] **Step 2: Build**

```bash
npm run build --workspace=@control-actions/frontend 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/infrastructures/InfrastructureList.tsx
git commit -m "feat: InfrastructureList shows uploaded iconUrl image if available"
```

---

### Task 12: Vite proxy — add /uploads route

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Add uploads proxy**

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "feat: proxy /uploads to backend in Vite dev server"
```

---

### Task 13: Manual verification

- [ ] **Step 1: Start full stack**

```bash
./dev.sh
```

or:
```bash
docker compose up -d db && npm run dev:backend && npm run dev:frontend
```

- [ ] **Step 2: Assign icon+color to action types**

Log in as `admin@example.com / admin1234`. Go to `/admin/catalog`. In "Tipos de acción", click "Icono" on "Inspección". Pick the Eye icon, choose blue color (#2563EB), click Guardar. Verify the row now shows a blue Eye icon.

- [ ] **Step 3: Verify badge in InfrastructureDetail**

Navigate to an infrastructure with actions. Open the detail panel of an action of type "Inspección". Confirm the badge in the panel header shows the Eye icon in blue.

- [ ] **Step 4: Upload infra type icon**

In the Catalog, go to "Tipos de infraestructura". Click "Subir" next to "Colegios". Select a PNG/SVG file. Verify the row updates to show the uploaded image thumbnail.

- [ ] **Step 5: Verify icon in InfrastructureList**

Go to Infrastructures list. Find an infrastructure of type "Colegios". Confirm the card now shows the uploaded image in the icon slot.

- [ ] **Step 6: Verify /uploads/ is accessible**

Open `http://localhost:5173/uploads/infra-type-1.png` (or whatever was uploaded). Verify the image loads via the Vite proxy.

---

## Summary

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | +icon, +color on ActionType; +iconUrl on InfrastructureType |
| `backend/src/app.ts` | Register @fastify/multipart + @fastify/static |
| `backend/src/modules/catalog/catalog.schema.ts` | Add UpdateActionTypeSchema, UpdateInfrastructureTypeSchema |
| `backend/src/modules/catalog/catalog.service.ts` | Add updateActionType, updateInfrastructureType, setInfrastructureTypeIcon |
| `backend/src/modules/catalog/catalog.routes.ts` | Add PATCH action-types/:id, PATCH infra-types/:id, POST infra-types/:id/icon |
| `frontend/src/api/types.ts` | Add icon/color to ActionType, iconUrl to InfrastructureType, update ActionWithRelations Pick |
| `frontend/src/api/catalog.ts` | Add updateActionType, uploadInfraTypeIcon |
| `frontend/src/hooks/useCatalog.ts` | Add useUpdateActionType, useUploadInfraTypeIcon |
| `frontend/src/utils/actionTypeIcons.ts` | New — ICON_MAP, ICON_OPTIONS, getActionTypeIcon |
| `frontend/src/pages/admin/Catalog.tsx` | Full rewrite with ActionTypeRow (icon picker) + InfraTypeRow (upload) |
| `frontend/src/pages/infrastructures/InfrastructureDetail.tsx` | Badge uses icon+color |
| `frontend/src/pages/actions/ActionsPage.tsx` | Badge uses icon+color |
| `frontend/src/pages/infrastructures/InfrastructureList.tsx` | Uses iconUrl image if available |
| `frontend/vite.config.ts` | Add /uploads proxy |
