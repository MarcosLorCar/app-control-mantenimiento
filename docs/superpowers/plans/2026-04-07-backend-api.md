# Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la API REST completa de control-actions (auth, usuarios, infraestructuras, acciones, materiales, catálogos) con Node.js + Fastify + Prisma + PostgreSQL, lista para conectar con el frontend.

**Architecture:** Monorepo npm workspaces con carpetas `backend/`, `frontend/` y `shared/`. El backend expone una API REST pura; el frontend (plan separado) la consume. Los módulos están organizados por dominio dentro de `backend/src/modules/`.

**Tech Stack:** Node.js 20 LTS · Fastify · TypeScript · Prisma ORM · PostgreSQL 16 · Vitest · @fastify/jwt · @fastify/cookie · Zod · bcryptjs

---

## Mapa de archivos

```
control-actions/
├── package.json                          # root — npm workspaces
├── shared/
│   ├── package.json
│   └── src/
│       └── types.ts                      # tipos compartidos FE↔BE
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── prisma/
│   │   ├── schema.prisma                 # modelo completo
│   │   └── seed.ts                       # datos iniciales (roles, estados, tipos)
│   └── src/
│       ├── server.ts                     # entry point
│       ├── app.ts                        # factory de Fastify (exportable para tests)
│       ├── plugins/
│       │   ├── prisma.plugin.ts          # decora fastify.db con PrismaClient
│       │   └── auth.plugin.ts            # guards: verifyToken, requireWrite, requireManage
│       └── modules/
│           ├── auth/
│           │   ├── auth.routes.ts        # POST /api/auth/login|refresh|logout
│           │   ├── auth.service.ts       # lógica de negocio
│           │   └── auth.schema.ts        # schemas Zod + tipos
│           ├── users/
│           │   ├── users.routes.ts       # CRUD /api/users
│           │   ├── users.service.ts
│           │   └── users.schema.ts
│           ├── infrastructures/
│           │   ├── infrastructures.routes.ts
│           │   ├── infrastructures.service.ts
│           │   └── infrastructures.schema.ts
│           ├── actions/
│           │   ├── actions.routes.ts     # acciones + materiales anidados
│           │   ├── actions.service.ts
│           │   └── actions.schema.ts
│           └── catalog/
│               ├── catalog.routes.ts     # roles, infra-statuses, action-types
│               ├── catalog.service.ts
│               └── catalog.schema.ts
└── tests/                                # dentro de backend/
    ├── helpers/
    │   ├── app.ts                        # buildTestApp() — crea instancia Fastify para tests
    │   └── db.ts                         # clearDb(), seedTestData()
    ├── auth.test.ts
    ├── users.test.ts
    ├── infrastructures.test.ts
    ├── actions.test.ts
    └── catalog.test.ts
```

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `package.json` (raíz)
- Create: `shared/package.json`
- Create: `shared/src/types.ts`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Crear package.json raíz con npm workspaces**

```json
// package.json (raíz)
{
  "name": "control-actions",
  "private": true,
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "dev:backend": "npm run dev --workspace=backend",
    "test:backend": "npm run test --workspace=backend",
    "build:backend": "npm run build --workspace=backend"
  }
}
```

- [ ] **Step 2: Crear shared/package.json**

```json
{
  "name": "@control-actions/shared",
  "version": "1.0.0",
  "main": "src/types.ts",
  "scripts": {}
}
```

- [ ] **Step 3: Crear shared/src/types.ts con tipos base**

```typescript
// shared/src/types.ts

export interface JwtPayload {
  sub: number
  email: string
  role: string
  can_write: boolean
  can_manage: boolean
  iat?: number
  exp?: number
}

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
```

- [ ] **Step 4: Crear backend/package.json**

```json
{
  "name": "@control-actions/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@fastify/cookie": "^9.3.1",
    "@fastify/jwt": "^8.0.1",
    "bcryptjs": "^2.4.3",
    "fastify": "^4.28.1",
    "fastify-plugin": "^4.5.1",
    "@prisma/client": "^5.14.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@control-actions/shared": "*",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.14.0",
    "prisma": "^5.14.0",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 5: Crear backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "@control-actions/shared": ["../shared/src/types"]
    }
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 6: Crear backend/vitest.config.ts**

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/db.ts'],
    testTimeout: 30000,
  },
})
```

- [ ] **Step 7: Crear .gitignore en la raíz**

```
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.superpowers/
```

- [ ] **Step 8: Instalar dependencias**

```bash
cd /path/to/control-actions
npm install
```

Expected: carpetas `node_modules/` en raíz y en cada workspace.

- [ ] **Step 9: Commit**

```bash
git init
git add package.json shared/ backend/package.json backend/tsconfig.json backend/vitest.config.ts .gitignore
git commit -m "feat: monorepo scaffold con npm workspaces"
```

---

## Task 2: Prisma schema y migración inicial

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/.env.example`
- Create: `backend/.env` (local, no se commitea)

- [ ] **Step 1: Crear backend/.env.example**

```bash
# backend/.env.example
DATABASE_URL="postgresql://user:password@localhost:5432/control_actions_dev"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/control_actions_test"
JWT_SECRET="cambia-esto-por-un-secreto-largo-y-aleatorio"
JWT_REFRESH_SECRET="otro-secreto-diferente-para-refresh"
```

- [ ] **Step 2: Crear backend/.env con tus valores locales**

Copia `.env.example` a `.env` y rellena con tus credenciales de PostgreSQL local.

```bash
cp backend/.env.example backend/.env
```

- [ ] **Step 3: Crear las bases de datos en PostgreSQL**

```sql
-- Ejecuta en psql o tu cliente SQL:
CREATE DATABASE control_actions_dev;
CREATE DATABASE control_actions_test;
```

- [ ] **Step 4: Crear backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Role {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String?
  canWrite    Boolean @default(false) @map("can_write")
  canManage   Boolean @default(false) @map("can_manage")
  users       User[]

  @@map("roles")
}

model InfraStatus {
  id              Int              @id @default(autoincrement())
  name            String           @unique
  description     String?
  infrastructures Infrastructure[]

  @@map("infra_statuses")
}

model ActionType {
  id                Int      @id @default(autoincrement())
  name              String   @unique
  description       String?
  consumesMaterials Boolean  @default(false) @map("consumes_materials")
  actions           Action[]

  @@map("action_types")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String   @map("full_name")
  roleId       Int      @map("role_id")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  role         Role     @relation(fields: [roleId], references: [id])
  actions      Action[]

  @@map("users")
}

model Infrastructure {
  id          Int         @id @default(autoincrement())
  name        String
  description String?
  location    String?
  statusId    Int         @map("status_id")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  status      InfraStatus @relation(fields: [statusId], references: [id])
  actions     Action[]

  @@map("infrastructures")
}

model Action {
  id               Int              @id @default(autoincrement())
  infrastructureId Int              @map("infrastructure_id")
  performedBy      Int              @map("performed_by")
  actionTypeId     Int              @map("action_type_id")
  description      String?
  performedAt      DateTime         @default(now()) @map("performed_at")
  createdAt        DateTime         @default(now()) @map("created_at")
  infrastructure   Infrastructure   @relation(fields: [infrastructureId], references: [id])
  performer        User             @relation(fields: [performedBy], references: [id])
  actionType       ActionType       @relation(fields: [actionTypeId], references: [id])
  materials        ActionMaterial[]

  @@map("actions")
}

model ActionMaterial {
  id          Int      @id @default(autoincrement())
  actionId    Int      @map("action_id")
  name        String
  description String?
  unit        String
  quantity    Decimal  @db.Decimal(12, 4)
  unitCost    Decimal? @db.Decimal(12, 2) @map("unit_cost")
  totalCost   Decimal? @db.Decimal(12, 2) @map("total_cost")
  supplier    String?
  notes       String?
  action      Action   @relation(fields: [actionId], references: [id])

  @@map("action_materials")
}
```

- [ ] **Step 5: Ejecutar migración inicial**

```bash
cd backend
npx prisma migrate dev --name init
```

Expected: carpeta `prisma/migrations/` creada, tablas en la DB dev.

- [ ] **Step 6: Verificar que Prisma genera el cliente**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` sin errores.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/ backend/.env.example
git commit -m "feat: prisma schema con modelo completo y migración inicial"
```

---

## Task 3: Seed de datos iniciales

**Files:**
- Create: `backend/prisma/seed.ts`

- [ ] **Step 1: Crear backend/prisma/seed.ts**

```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrador completo', canWrite: true, canManage: true },
  })
  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Puede registrar acciones', canWrite: true, canManage: false },
  })
  await prisma.role.upsert({
    where: { name: 'reader' },
    update: {},
    create: { name: 'reader', description: 'Solo lectura', canWrite: false, canManage: false },
  })

  // Estados de infraestructura
  await prisma.infraStatus.upsert({
    where: { name: 'active' },
    update: {},
    create: { name: 'active', description: 'Operativa' },
  })
  await prisma.infraStatus.upsert({
    where: { name: 'inactive' },
    update: {},
    create: { name: 'inactive', description: 'Fuera de servicio' },
  })
  await prisma.infraStatus.upsert({
    where: { name: 'maintenance' },
    update: {},
    create: { name: 'maintenance', description: 'En mantenimiento' },
  })

  // Tipos de acción
  await prisma.actionType.upsert({
    where: { name: 'inspection' },
    update: {},
    create: { name: 'inspection', description: 'Inspección visual o técnica', consumesMaterials: false },
  })
  await prisma.actionType.upsert({
    where: { name: 'repair' },
    update: {},
    create: { name: 'repair', description: 'Reparación o sustitución', consumesMaterials: true },
  })
  await prisma.actionType.upsert({
    where: { name: 'installation' },
    update: {},
    create: { name: 'installation', description: 'Nueva instalación', consumesMaterials: true },
  })

  // Usuario admin inicial
  const hash = await bcrypt.hash('admin1234', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hash,
      fullName: 'Administrador',
      roleId: adminRole.id,
    },
  })

  // Usuario editor de ejemplo
  const editorHash = await bcrypt.hash('editor1234', 10)
  await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      passwordHash: editorHash,
      fullName: 'Editor Ejemplo',
      roleId: editorRole.id,
    },
  })

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Añadir script de seed en package.json del backend**

En `backend/package.json`, el script `db:seed` ya existe (`tsx prisma/seed.ts`). Añadir la referencia del seed en `prisma/schema.prisma`:

```prisma
// al final del bloque generator client en schema.prisma:
generator client {
  provider = "prisma-client-js"
}
```

Añadir después del generador:

```prisma
// no se requiere config adicional — prisma detecta seed.ts automáticamente
// si está en prisma/seed.ts y el script "db:seed" usa tsx
```

Actualizar `package.json` del backend para que Prisma encuentre el seed:

```json
// backend/package.json — añadir sección "prisma":
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Ejecutar el seed**

```bash
cd backend
npx prisma db seed
```

Expected: `Seed completado.` sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/seed.ts backend/package.json
git commit -m "feat: seed de roles, estados, tipos de acción y usuarios iniciales"
```

---

## Task 4: App Fastify y plugins base

**Files:**
- Create: `backend/src/plugins/prisma.plugin.ts`
- Create: `backend/src/plugins/auth.plugin.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/tests/helpers/app.ts`
- Create: `backend/tests/helpers/db.ts`

- [ ] **Step 1: Crear backend/src/plugins/prisma.plugin.ts**

```typescript
// backend/src/plugins/prisma.plugin.ts
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  fastify.decorate('db', prisma)
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

export default fp(prismaPlugin)
```

- [ ] **Step 2: Crear backend/src/plugins/auth.plugin.ts**

```typescript
// backend/src/plugins/auth.plugin.ts
import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload } from '@control-actions/shared'

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireWrite: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireManage: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('verifyToken', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
  })

  fastify.decorate('requireWrite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
    if (!request.user.can_write) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Se requiere permiso de escritura' } })
    }
  })

  fastify.decorate('requireManage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
    if (!request.user.can_manage) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Se requiere permiso de gestión' } })
    }
  })
}

export default fp(authPlugin)
```

- [ ] **Step 3: Crear backend/src/app.ts**

```typescript
// backend/src/app.ts
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import prismaPlugin from './plugins/prisma.plugin'
import authPlugin from './plugins/auth.plugin'

export interface AppOptions {
  jwtSecret: string
  jwtRefreshSecret: string
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  // Plugins core
  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: opts.jwtSecret,
    cookie: { cookieName: 'refreshToken', signed: false },
  })
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  // Health check
  app.get('/api/health', async () => ({ status: 'ok' }))

  // Módulos (se añaden en tasks posteriores)
  // await app.register(authRoutes, { prefix: '/api/auth' })
  // await app.register(usersRoutes, { prefix: '/api/users' })
  // ...

  return app
}
```

- [ ] **Step 4: Crear backend/src/server.ts**

```typescript
// backend/src/server.ts
import { buildApp } from './app'

async function start() {
  const app = await buildApp({
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  })

  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('API corriendo en http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

- [ ] **Step 5: Crear backend/tests/helpers/db.ts**

```typescript
// backend/tests/helpers/db.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Usa la DB de test
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!

export const testDb = new PrismaClient()

export async function clearDb() {
  // Borra en orden correcto (FK constraints)
  await testDb.actionMaterial.deleteMany()
  await testDb.action.deleteMany()
  await testDb.infrastructure.deleteMany()
  await testDb.user.deleteMany()
  await testDb.actionType.deleteMany()
  await testDb.infraStatus.deleteMany()
  await testDb.role.deleteMany()
}

export async function seedTestData() {
  const adminRole = await testDb.role.create({
    data: { name: 'admin', canWrite: true, canManage: true },
  })
  const editorRole = await testDb.role.create({
    data: { name: 'editor', canWrite: true, canManage: false },
  })
  const readerRole = await testDb.role.create({
    data: { name: 'reader', canWrite: false, canManage: false },
  })

  const activeStatus = await testDb.infraStatus.create({
    data: { name: 'active', description: 'Operativa' },
  })

  const inspectionType = await testDb.actionType.create({
    data: { name: 'inspection', consumesMaterials: false },
  })
  const repairType = await testDb.actionType.create({
    data: { name: 'repair', consumesMaterials: true },
  })

  const adminHash = await bcrypt.hash('admin1234', 10)
  const adminUser = await testDb.user.create({
    data: { email: 'admin@test.com', passwordHash: adminHash, fullName: 'Admin Test', roleId: adminRole.id },
  })

  const editorHash = await bcrypt.hash('editor1234', 10)
  const editorUser = await testDb.user.create({
    data: { email: 'editor@test.com', passwordHash: editorHash, fullName: 'Editor Test', roleId: editorRole.id },
  })

  const readerHash = await bcrypt.hash('reader1234', 10)
  const readerUser = await testDb.user.create({
    data: { email: 'reader@test.com', passwordHash: readerHash, fullName: 'Reader Test', roleId: readerRole.id },
  })

  return { adminRole, editorRole, readerRole, activeStatus, inspectionType, repairType, adminUser, editorUser, readerUser }
}
```

- [ ] **Step 6: Crear backend/tests/helpers/app.ts**

```typescript
// backend/tests/helpers/app.ts
import { buildApp } from '../../src/app'
import { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({
    jwtSecret: 'test-jwt-secret-at-least-32-characters',
    jwtRefreshSecret: 'test-refresh-secret-at-least-32-chars',
  })
}

// Helper: obtiene JWT de admin para autenticar requests en tests
export async function getAdminToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@test.com', password: 'admin1234' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getEditorToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'editor@test.com', password: 'editor1234' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getReaderToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'reader@test.com', password: 'reader1234' },
  })
  return JSON.parse(res.body).data.accessToken
}
```

- [ ] **Step 7: Verificar que el servidor arranca**

```bash
cd backend
npm run dev
```

Expected: `API corriendo en http://localhost:3000` y `GET http://localhost:3000/api/health` devuelve `{"status":"ok"}`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/ backend/tests/
git commit -m "feat: fastify app con plugins prisma y auth, helpers de test"
```

---

## Task 5: Módulo Auth

**Files:**
- Create: `backend/src/modules/auth/auth.schema.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/modules/auth/auth.routes.ts`
- Create: `backend/tests/auth.test.ts`
- Modify: `backend/src/app.ts` (registrar rutas)

- [ ] **Step 1: Escribir los tests de auth (fallarán)**

```typescript
// backend/tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await clearDb()
  await seedTestData()
})

describe('POST /api/auth/login', () => {
  it('devuelve accessToken con credenciales correctas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@test.com', password: 'admin1234' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.accessToken).toBeDefined()
    expect(typeof body.data.accessToken).toBe('string')
  })

  it('devuelve 401 con contraseña incorrecta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@test.com', password: 'wrongpassword' },
    })
    expect(res.statusCode).toBe(401)
    const body = JSON.parse(res.body)
    expect(body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('devuelve 401 con email inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'noexiste@test.com', password: 'admin1234' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('devuelve 400 con payload inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'no-es-email' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/auth/logout', () => {
  it('responde 200 con token válido', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@test.com', password: 'admin1234' },
    })
    const { accessToken } = JSON.parse(loginRes.body).data

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('responde 401 sin token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' })
    expect(res.statusCode).toBe(401)
  })
})
```

- [ ] **Step 2: Ejecutar tests — verificar que fallan**

```bash
cd backend
npm test -- tests/auth.test.ts
```

Expected: FAIL — `Cannot find module` o rutas no registradas.

- [ ] **Step 3: Crear backend/src/modules/auth/auth.schema.ts**

```typescript
// backend/src/modules/auth/auth.schema.ts
import { z } from 'zod'

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginBody = z.infer<typeof LoginBodySchema>
```

- [ ] **Step 4: Crear backend/src/modules/auth/auth.service.ts**

```typescript
// backend/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { LoginBody } from './auth.schema'
import { JwtPayload } from '@control-actions/shared'

export async function loginService(
  db: PrismaClient,
  app: FastifyInstance,
  body: LoginBody
): Promise<{ accessToken: string }> {
  const user = await db.user.findUnique({
    where: { email: body.email },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    can_write: user.role.canWrite,
    can_manage: user.role.canManage,
  }

  const accessToken = app.jwt.sign(payload, { expiresIn: '15m' })

  return { accessToken }
}
```

- [ ] **Step 5: Crear backend/src/modules/auth/auth.routes.ts**

```typescript
// backend/src/modules/auth/auth.routes.ts
import { FastifyPluginAsync } from 'fastify'
import { LoginBodySchema } from './auth.schema'
import { loginService } from './auth.service'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const result = LoginBodySchema.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    try {
      const data = await loginService(fastify.db, fastify, result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } })
    }
  })

  fastify.post('/logout', { preHandler: fastify.verifyToken }, async (_request, reply) => {
    // Con JWT stateless, el cliente descarta el token.
    // Aquí se limpia la cookie de refresh.
    return reply.clearCookie('refreshToken').send({ data: { ok: true } })
  })
}

export default authRoutes
```

- [ ] **Step 6: Registrar las rutas en app.ts**

```typescript
// backend/src/app.ts — añadir import y registro:
import authRoutes from './modules/auth/auth.routes'

// dentro de buildApp(), antes del return:
await app.register(authRoutes, { prefix: '/api/auth' })
```

- [ ] **Step 7: Ejecutar tests — verificar que pasan**

```bash
cd backend
npm test -- tests/auth.test.ts
```

Expected: todos los tests en PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/auth/ backend/tests/auth.test.ts backend/src/app.ts
git commit -m "feat: módulo auth con login/logout y tests"
```

---

## Task 6: Módulo Usuarios

**Files:**
- Create: `backend/src/modules/users/users.schema.ts`
- Create: `backend/src/modules/users/users.service.ts`
- Create: `backend/src/modules/users/users.routes.ts`
- Create: `backend/tests/users.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Escribir tests de usuarios (fallarán)**

```typescript
// backend/tests/users.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let readerToken: string

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  await seedTestData()
  adminToken = await getAdminToken(app)
  readerToken = await getReaderToken(app)
})

describe('GET /api/users', () => {
  it('admin puede listar usuarios', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    // No debe exponer passwordHash
    expect(body.data[0].passwordHash).toBeUndefined()
  })

  it('reader no puede listar usuarios (403)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/users' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/users', () => {
  it('admin puede crear usuario', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'nuevo@test.com', password: 'password123', fullName: 'Nuevo Usuario', roleId: 1 },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.data.email).toBe('nuevo@test.com')
    expect(body.data.passwordHash).toBeUndefined()
  })

  it('devuelve 409 con email duplicado', async () => {
    // admin@test.com ya existe del seed
    const res = await app.inject({
      method: 'POST', url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'admin@test.com', password: 'password123', fullName: 'Duplicado', roleId: 1 },
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('PATCH /api/users/:id', () => {
  it('admin puede actualizar fullName', async () => {
    // Obtener el ID del admin
    const listRes = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    const users = JSON.parse(listRes.body).data
    const adminUser = users.find((u: any) => u.email === 'admin@test.com')

    const res = await app.inject({
      method: 'PATCH', url: `/api/users/${adminUser.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { fullName: 'Admin Actualizado' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.fullName).toBe('Admin Actualizado')
  })
})
```

- [ ] **Step 2: Ejecutar tests — verificar que fallan**

```bash
npm test -- tests/users.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Crear backend/src/modules/users/users.schema.ts**

```typescript
// backend/src/modules/users/users.schema.ts
import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  roleId: z.number().int().positive(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserBody = z.infer<typeof CreateUserSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>
```

- [ ] **Step 4: Crear backend/src/modules/users/users.service.ts**

```typescript
// backend/src/modules/users/users.service.ts
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { CreateUserBody, UpdateUserBody } from './users.schema'

const SAFE_SELECT = {
  id: true, email: true, fullName: true, isActive: true,
  createdAt: true, updatedAt: true,
  role: { select: { id: true, name: true, canWrite: true, canManage: true } },
}

export async function listUsers(db: PrismaClient) {
  return db.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'desc' } })
}

export async function getUser(db: PrismaClient, id: number) {
  const user = await db.user.findUnique({ where: { id }, select: SAFE_SELECT })
  if (!user) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' }
  return user
}

export async function createUser(db: PrismaClient, body: CreateUserBody) {
  const existing = await db.user.findUnique({ where: { email: body.email } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  const passwordHash = await bcrypt.hash(body.password, 10)
  return db.user.create({
    data: { email: body.email, passwordHash, fullName: body.fullName, roleId: body.roleId },
    select: SAFE_SELECT,
  })
}

export async function updateUser(db: PrismaClient, id: number, body: UpdateUserBody) {
  await getUser(db, id) // lanza 404 si no existe
  const data: any = { ...body }
  if (body.email) {
    const dup = await db.user.findFirst({ where: { email: body.email, NOT: { id } } })
    if (dup) throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  }
  return db.user.update({ where: { id }, data, select: SAFE_SELECT })
}

export async function deleteUser(db: PrismaClient, id: number) {
  await getUser(db, id)
  await db.user.delete({ where: { id } })
}
```

- [ ] **Step 5: Crear backend/src/modules/users/users.routes.ts**

```typescript
// backend/src/modules/users/users.routes.ts
import { FastifyPluginAsync } from 'fastify'
import { CreateUserSchema, UpdateUserSchema } from './users.schema'
import { listUsers, getUser, createUser, updateUser, deleteUser } from './users.service'

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.requireManage }, async (_req, reply) => {
    const data = await listUsers(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = await getUser(fastify.db, Number(id))
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateUserSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createUser(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateUserSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateUser(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteUser(fastify.db, Number(id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default usersRoutes
```

- [ ] **Step 6: Registrar en app.ts**

```typescript
// backend/src/app.ts — añadir:
import usersRoutes from './modules/users/users.routes'
// en buildApp():
await app.register(usersRoutes, { prefix: '/api/users' })
```

- [ ] **Step 7: Ejecutar tests**

```bash
npm test -- tests/users.test.ts
```

Expected: todos en PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/users/ backend/tests/users.test.ts backend/src/app.ts
git commit -m "feat: módulo usuarios con CRUD y tests"
```

---

## Task 7: Módulo Catálogos

**Files:**
- Create: `backend/src/modules/catalog/catalog.service.ts`
- Create: `backend/src/modules/catalog/catalog.schema.ts`
- Create: `backend/src/modules/catalog/catalog.routes.ts`
- Create: `backend/tests/catalog.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Escribir tests de catálogos (fallarán)**

```typescript
// backend/tests/catalog.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getEditorToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let editorToken: string

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  await seedTestData()
  adminToken = await getAdminToken(app)
  editorToken = await getEditorToken(app)
})

describe('GET /api/catalog/infra-statuses', () => {
  it('usuario autenticado puede listar estados', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/catalog/infra-statuses',
      headers: { authorization: `Bearer ${editorToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toHaveProperty('name')
  })
})

describe('POST /api/catalog/action-types', () => {
  it('admin puede crear tipo de acción', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/catalog/action-types',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'cleaning', description: 'Limpieza', consumesMaterials: true },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.name).toBe('cleaning')
  })

  it('editor no puede crear tipo de acción (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/catalog/action-types',
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'cleaning', consumesMaterials: false },
    })
    expect(res.statusCode).toBe(403)
  })
})
```

- [ ] **Step 2: Ejecutar — verificar FAIL**

```bash
npm test -- tests/catalog.test.ts
```

- [ ] **Step 3: Crear backend/src/modules/catalog/catalog.schema.ts**

```typescript
// backend/src/modules/catalog/catalog.schema.ts
import { z } from 'zod'

export const CreateInfraStatusSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const CreateActionTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  consumesMaterials: z.boolean().default(false),
})

export type CreateInfraStatusBody = z.infer<typeof CreateInfraStatusSchema>
export type CreateActionTypeBody = z.infer<typeof CreateActionTypeSchema>
```

- [ ] **Step 4: Crear backend/src/modules/catalog/catalog.service.ts**

```typescript
// backend/src/modules/catalog/catalog.service.ts
import { PrismaClient } from '@prisma/client'
import { CreateInfraStatusBody, CreateActionTypeBody } from './catalog.schema'

export const listRoles = (db: PrismaClient) => db.role.findMany()
export const listInfraStatuses = (db: PrismaClient) => db.infraStatus.findMany()
export const listActionTypes = (db: PrismaClient) => db.actionType.findMany()

export async function createInfraStatus(db: PrismaClient, body: CreateInfraStatusBody) {
  const existing = await db.infraStatus.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Estado ya existe' }
  return db.infraStatus.create({ data: body })
}

export async function createActionType(db: PrismaClient, body: CreateActionTypeBody) {
  const existing = await db.actionType.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Tipo de acción ya existe' }
  return db.actionType.create({ data: body })
}
```

- [ ] **Step 5: Crear backend/src/modules/catalog/catalog.routes.ts**

```typescript
// backend/src/modules/catalog/catalog.routes.ts
import { FastifyPluginAsync } from 'fastify'
import { CreateInfraStatusSchema, CreateActionTypeSchema } from './catalog.schema'
import { listRoles, listInfraStatuses, listActionTypes, createInfraStatus, createActionType } from './catalog.service'

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/roles', { preHandler: fastify.requireManage }, async (_req, reply) => {
    return reply.send({ data: await listRoles(fastify.db) })
  })

  fastify.get('/infra-statuses', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    return reply.send({ data: await listInfraStatuses(fastify.db) })
  })

  fastify.get('/action-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    return reply.send({ data: await listActionTypes(fastify.db) })
  })

  fastify.post('/infra-statuses', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateInfraStatusSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      return reply.code(201).send({ data: await createInfraStatus(fastify.db, result.data) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/action-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      return reply.code(201).send({ data: await createActionType(fastify.db, result.data) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default catalogRoutes
```

- [ ] **Step 6: Registrar en app.ts**

```typescript
import catalogRoutes from './modules/catalog/catalog.routes'
// en buildApp():
await app.register(catalogRoutes, { prefix: '/api/catalog' })
```

- [ ] **Step 7: Ejecutar tests**

```bash
npm test -- tests/catalog.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/catalog/ backend/tests/catalog.test.ts backend/src/app.ts
git commit -m "feat: módulo catálogos (roles, estados, tipos de acción)"
```

---

## Task 8: Módulo Infraestructuras

**Files:**
- Create: `backend/src/modules/infrastructures/infrastructures.schema.ts`
- Create: `backend/src/modules/infrastructures/infrastructures.service.ts`
- Create: `backend/src/modules/infrastructures/infrastructures.routes.ts`
- Create: `backend/tests/infrastructures.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Escribir tests (fallarán)**

```typescript
// backend/tests/infrastructures.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getEditorToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let editorToken: string
let readerToken: string

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  const seed = await seedTestData()
  adminToken = await getAdminToken(app)
  editorToken = await getEditorToken(app)
  readerToken = await getReaderToken(app)
})

describe('GET /api/infrastructures', () => {
  it('cualquier usuario autenticado puede listar', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/infrastructures',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(res.body).data)).toBe(true)
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/infrastructures' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/infrastructures', () => {
  it('editor puede crear infraestructura', async () => {
    // Necesitamos statusId — lo obtenemos de los catálogos
    const catRes = await app.inject({
      method: 'GET', url: '/api/catalog/infra-statuses',
      headers: { authorization: `Bearer ${editorToken}` },
    })
    const statusId = JSON.parse(catRes.body).data[0].id

    const res = await app.inject({
      method: 'POST', url: '/api/infrastructures',
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'Depuradora Norte', location: 'Polígono A', statusId },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.name).toBe('Depuradora Norte')
  })

  it('reader no puede crear (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/infrastructures',
      headers: { authorization: `Bearer ${readerToken}` },
      payload: { name: 'Test', statusId: 1 },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/infrastructures/:id', () => {
  it('devuelve 404 con id inexistente', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/infrastructures/99999',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})
```

- [ ] **Step 2: Ejecutar — verificar FAIL**

```bash
npm test -- tests/infrastructures.test.ts
```

- [ ] **Step 3: Crear backend/src/modules/infrastructures/infrastructures.schema.ts**

```typescript
// backend/src/modules/infrastructures/infrastructures.schema.ts
import { z } from 'zod'

export const CreateInfrastructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  statusId: z.number().int().positive(),
})

export const UpdateInfrastructureSchema = CreateInfrastructureSchema.partial()

export type CreateInfrastructureBody = z.infer<typeof CreateInfrastructureSchema>
export type UpdateInfrastructureBody = z.infer<typeof UpdateInfrastructureSchema>
```

- [ ] **Step 4: Crear backend/src/modules/infrastructures/infrastructures.service.ts**

```typescript
// backend/src/modules/infrastructures/infrastructures.service.ts
import { PrismaClient } from '@prisma/client'
import { CreateInfrastructureBody, UpdateInfrastructureBody } from './infrastructures.schema'

const INFRA_INCLUDE = { status: true }

export const listInfrastructures = (db: PrismaClient) =>
  db.infrastructure.findMany({ include: INFRA_INCLUDE, orderBy: { createdAt: 'desc' } })

export async function getInfrastructure(db: PrismaClient, id: number) {
  const infra = await db.infrastructure.findUnique({ where: { id }, include: INFRA_INCLUDE })
  if (!infra) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Infraestructura no encontrada' }
  return infra
}

export const createInfrastructure = (db: PrismaClient, body: CreateInfrastructureBody) =>
  db.infrastructure.create({ data: body, include: INFRA_INCLUDE })

export async function updateInfrastructure(db: PrismaClient, id: number, body: UpdateInfrastructureBody) {
  await getInfrastructure(db, id)
  return db.infrastructure.update({ where: { id }, data: body, include: INFRA_INCLUDE })
}

export async function deleteInfrastructure(db: PrismaClient, id: number) {
  await getInfrastructure(db, id)
  await db.infrastructure.delete({ where: { id } })
}
```

- [ ] **Step 5: Crear backend/src/modules/infrastructures/infrastructures.routes.ts**

```typescript
// backend/src/modules/infrastructures/infrastructures.routes.ts
import { FastifyPluginAsync } from 'fastify'
import { CreateInfrastructureSchema, UpdateInfrastructureSchema } from './infrastructures.schema'
import { listInfrastructures, getInfrastructure, createInfrastructure, updateInfrastructure, deleteInfrastructure } from './infrastructures.service'

const infrastructuresRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    return reply.send({ data: await listInfrastructures(fastify.db) })
  })

  fastify.get('/:id', { preHandler: fastify.verifyToken }, async (request, reply) => {
    try {
      return reply.send({ data: await getInfrastructure(fastify.db, Number((request.params as any).id)) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = CreateInfrastructureSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    return reply.code(201).send({ data: await createInfrastructure(fastify.db, result.data) })
  })

  fastify.patch('/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = UpdateInfrastructureSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      return reply.send({ data: await updateInfrastructure(fastify.db, Number((request.params as any).id), result.data) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    try {
      await deleteInfrastructure(fastify.db, Number((request.params as any).id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default infrastructuresRoutes
```

- [ ] **Step 6: Registrar en app.ts**

```typescript
import infrastructuresRoutes from './modules/infrastructures/infrastructures.routes'
// en buildApp():
await app.register(infrastructuresRoutes, { prefix: '/api/infrastructures' })
```

- [ ] **Step 7: Ejecutar tests**

```bash
npm test -- tests/infrastructures.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/infrastructures/ backend/tests/infrastructures.test.ts backend/src/app.ts
git commit -m "feat: módulo infraestructuras con CRUD y tests"
```

---

## Task 9: Módulo Acciones y Materiales

**Files:**
- Create: `backend/src/modules/actions/actions.schema.ts`
- Create: `backend/src/modules/actions/actions.service.ts`
- Create: `backend/src/modules/actions/actions.routes.ts`
- Create: `backend/tests/actions.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Escribir tests de acciones y materiales (fallarán)**

```typescript
// backend/tests/actions.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getEditorToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'
import { testDb } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let editorToken: string
let readerToken: string
let infraId: number
let actionId: number

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  const seed = await seedTestData()
  adminToken = await getAdminToken(app)
  editorToken = await getEditorToken(app)
  readerToken = await getReaderToken(app)

  // Crear infraestructura de prueba
  const infra = await testDb.infrastructure.create({
    data: { name: 'Torre Control', statusId: seed.activeStatus.id },
  })
  infraId = infra.id

  // Crear acción de prueba
  const action = await testDb.action.create({
    data: {
      infrastructureId: infraId,
      performedBy: seed.adminUser.id,
      actionTypeId: seed.inspectionType.id,
      description: 'Inspección inicial',
    },
  })
  actionId = action.id
})

describe('GET /api/infrastructures/:id/actions', () => {
  it('usuario autenticado puede listar acciones de una infraestructura', async () => {
    const res = await app.inject({
      method: 'GET', url: `/api/infrastructures/${infraId}/actions`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBe(1)
    expect(body.data[0].description).toBe('Inspección inicial')
  })
})

describe('POST /api/infrastructures/:id/actions', () => {
  it('editor puede registrar una acción', async () => {
    const catRes = await app.inject({
      method: 'GET', url: '/api/catalog/action-types',
      headers: { authorization: `Bearer ${editorToken}` },
    })
    const actionTypeId = JSON.parse(catRes.body).data[0].id

    const res = await app.inject({
      method: 'POST', url: `/api/infrastructures/${infraId}/actions`,
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { actionTypeId, description: 'Revisión de cables', performedAt: new Date().toISOString() },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.description).toBe('Revisión de cables')
  })
})

describe('POST /api/actions/:id/materials', () => {
  it('editor puede añadir material a una acción', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'Cable UTP cat6', unit: 'metros', quantity: 50, unitCost: 1.5 },
    })
    expect(res.statusCode).toBe(201)
    const mat = JSON.parse(res.body).data
    expect(mat.name).toBe('Cable UTP cat6')
    expect(Number(mat.totalCost)).toBe(75)
  })

  it('reader no puede añadir material (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${readerToken}` },
      payload: { name: 'Cable', unit: 'metros', quantity: 10 },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/actions/:id/materials', () => {
  it('lista materiales de una acción', async () => {
    // Crear material de prueba directamente en DB (actionId viene del beforeEach)
    await testDb.actionMaterial.create({
      data: { actionId, name: 'Tornillo M8', unit: 'unidades', quantity: 20 },
    })

    const res = await app.inject({
      method: 'GET', url: `/api/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.length).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar — verificar FAIL**

```bash
npm test -- tests/actions.test.ts
```

- [ ] **Step 3: Crear backend/src/modules/actions/actions.schema.ts**

```typescript
// backend/src/modules/actions/actions.schema.ts
import { z } from 'zod'

export const CreateActionSchema = z.object({
  actionTypeId: z.number().int().positive(),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
})

export const UpdateActionSchema = CreateActionSchema.partial()

export const CreateMaterialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateMaterialSchema = CreateMaterialSchema.partial()

export type CreateActionBody = z.infer<typeof CreateActionSchema>
export type UpdateActionBody = z.infer<typeof UpdateActionSchema>
export type CreateMaterialBody = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterialBody = z.infer<typeof UpdateMaterialSchema>
```

- [ ] **Step 4: Crear backend/src/modules/actions/actions.service.ts**

```typescript
// backend/src/modules/actions/actions.service.ts
import { PrismaClient } from '@prisma/client'
import { CreateActionBody, UpdateActionBody, CreateMaterialBody, UpdateMaterialBody } from './actions.schema'

const ACTION_INCLUDE = { actionType: true, performer: { select: { id: true, fullName: true, email: true } }, materials: true }

export const listActions = (db: PrismaClient, infrastructureId: number) =>
  db.action.findMany({ where: { infrastructureId }, include: ACTION_INCLUDE, orderBy: { performedAt: 'desc' } })

export async function getAction(db: PrismaClient, id: number) {
  const action = await db.action.findUnique({ where: { id }, include: ACTION_INCLUDE })
  if (!action) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Acción no encontrada' }
  return action
}

export const createAction = (db: PrismaClient, infrastructureId: number, performedBy: number, body: CreateActionBody) =>
  db.action.create({
    data: {
      infrastructureId,
      performedBy,
      actionTypeId: body.actionTypeId,
      description: body.description,
      performedAt: body.performedAt ? new Date(body.performedAt) : undefined,
    },
    include: ACTION_INCLUDE,
  })

export async function updateAction(db: PrismaClient, id: number, body: UpdateActionBody) {
  await getAction(db, id)
  return db.action.update({ where: { id }, data: body, include: ACTION_INCLUDE })
}

export async function deleteAction(db: PrismaClient, id: number) {
  await getAction(db, id)
  await db.action.delete({ where: { id } })
}

// Materiales
export const listMaterials = (db: PrismaClient, actionId: number) =>
  db.actionMaterial.findMany({ where: { actionId } })

export async function getMaterial(db: PrismaClient, id: number) {
  const mat = await db.actionMaterial.findUnique({ where: { id } })
  if (!mat) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Material no encontrado' }
  return mat
}

export const createMaterial = (db: PrismaClient, actionId: number, body: CreateMaterialBody) => {
  const totalCost = body.unitCost != null ? body.quantity * body.unitCost : null
  return db.actionMaterial.create({
    data: { actionId, ...body, totalCost },
  })
}

export async function updateMaterial(db: PrismaClient, id: number, body: UpdateMaterialBody) {
  const existing = await getMaterial(db, id)
  const quantity = body.quantity ?? Number(existing.quantity)
  const unitCost = body.unitCost ?? (existing.unitCost != null ? Number(existing.unitCost) : null)
  const totalCost = unitCost != null ? quantity * unitCost : null
  return db.actionMaterial.update({ where: { id }, data: { ...body, totalCost } })
}

export async function deleteMaterial(db: PrismaClient, id: number) {
  await getMaterial(db, id)
  await db.actionMaterial.delete({ where: { id } })
}
```

- [ ] **Step 5: Crear backend/src/modules/actions/actions.routes.ts**

```typescript
// backend/src/modules/actions/actions.routes.ts
import { FastifyPluginAsync } from 'fastify'
import { CreateActionSchema, UpdateActionSchema, CreateMaterialSchema, UpdateMaterialSchema } from './actions.schema'
import { listActions, getAction, createAction, updateAction, deleteAction, listMaterials, createMaterial, updateMaterial, deleteMaterial } from './actions.service'

const actionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Rutas bajo /api/infrastructures/:infraId/actions
  fastify.get('/infrastructures/:infraId/actions', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const infraId = Number((request.params as any).infraId)
    return reply.send({ data: await listActions(fastify.db, infraId) })
  })

  fastify.post('/infrastructures/:infraId/actions', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const infraId = Number((request.params as any).infraId)
    const result = CreateActionSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    const data = await createAction(fastify.db, infraId, request.user.sub, result.data)
    return reply.code(201).send({ data })
  })

  // Rutas bajo /api/actions/:id
  fastify.get('/actions/:id', { preHandler: fastify.verifyToken }, async (request, reply) => {
    try {
      return reply.send({ data: await getAction(fastify.db, Number((request.params as any).id)) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/actions/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = UpdateActionSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      return reply.send({ data: await updateAction(fastify.db, Number((request.params as any).id), result.data) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/actions/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    try {
      await deleteAction(fastify.db, Number((request.params as any).id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  // Materiales
  fastify.get('/actions/:id/materials', { preHandler: fastify.verifyToken }, async (request, reply) => {
    return reply.send({ data: await listMaterials(fastify.db, Number((request.params as any).id)) })
  })

  fastify.post('/actions/:id/materials', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = CreateMaterialSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    const data = await createMaterial(fastify.db, Number((request.params as any).id), result.data)
    return reply.code(201).send({ data })
  })

  fastify.patch('/materials/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = UpdateMaterialSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      return reply.send({ data: await updateMaterial(fastify.db, Number((request.params as any).id), result.data) })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/materials/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    try {
      await deleteMaterial(fastify.db, Number((request.params as any).id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default actionsRoutes
```

- [ ] **Step 6: Registrar en app.ts**

```typescript
import actionsRoutes from './modules/actions/actions.routes'
// en buildApp() — registrar en /api (no en un prefix específico porque gestiona múltiples prefijos):
await app.register(actionsRoutes, { prefix: '/api' })
```

- [ ] **Step 7: Ejecutar tests**

```bash
npm test -- tests/actions.test.ts
```

Expected: PASS.

- [ ] **Step 8: Ejecutar todos los tests**

```bash
cd backend
npm test
```

Expected: todos los tests en PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/modules/actions/ backend/tests/actions.test.ts backend/src/app.ts
git commit -m "feat: módulo acciones y materiales con CRUD y tests"
```

---

## Task 10: Verificación final del backend

- [ ] **Step 1: Ejecutar la suite completa de tests**

```bash
cd backend
npm test
```

Expected: todos los tests PASS, sin errores de TypeScript.

- [ ] **Step 2: Verificar tipos TypeScript**

```bash
cd backend
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Arrancar el servidor y probar manualmente**

```bash
npm run db:seed  # datos en la DB dev
npm run dev
```

Probar con curl o un cliente REST:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin1234"}'

# Listar infraestructuras (usar el token devuelto)
curl http://localhost:3000/api/infrastructures \
  -H "Authorization: Bearer <token>"
```

Expected: respuestas JSON con estructura `{ data: [...] }`.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: backend API completo y verificado"
```

---

## Notas para el Plan 2 (Frontend)

El backend expone su API en `http://localhost:3000/api`. El frontend SPA (Plan 2) se conecta a esta URL en desarrollo y a `/api` en producción (a través de Nginx). Los tipos compartidos en `shared/src/types.ts` se importan desde ambos workspaces.
