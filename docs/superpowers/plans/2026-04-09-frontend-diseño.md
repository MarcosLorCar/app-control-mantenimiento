# Frontend Alineación con Diseño (frontwabb.pen) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinear el frontend con los diseños de `frontwabb.pen` en tres áreas: Sidebar/Topbar, Infrastructure List, y dos páginas nuevas (Acciones + Materiales).

**Architecture:** Añadir CSS custom properties como tokens de diseño; instalar lucide-react para iconos; rediseñar Layout.tsx; sustituir la vista dual de infraestructuras por cards ricas; añadir dos endpoints GET globales al backend (acciones, materiales) sin schema changes; crear dos páginas SPA nuevas con tabla + panel lateral.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS · Fastify + Prisma (backend) · lucide-react (nuevos iconos) · @tanstack/react-query (hooks existentes)

**Descartado del diseño (no implementar):**
- Campo `status` en acciones (Pendiente/En Curso/Completada) — no está en el schema
- Campo `status` en infraestructuras — no está en el schema
- Dashboard stats / métricas reales — no seleccionado en el alcance
- Filtros de Estado en las páginas

---

## Archivos afectados

| Archivo | Acción |
|---|---|
| `frontend/package.json` | Añadir `lucide-react` |
| `frontend/src/index.css` | Añadir CSS custom properties |
| `frontend/tailwind.config.js` | Extender colores con variables CSS |
| `frontend/src/components/Layout.tsx` | Reescribir (sidebar + topbar) |
| `frontend/src/pages/infrastructures/InfrastructureList.tsx` | Reescribir (cards ricas) |
| `frontend/src/App.tsx` | Añadir rutas `/actions` y `/materials` |
| `frontend/src/api/actions.ts` | Añadir `listAllActions()` y `listAllMaterials()` |
| `frontend/src/api/types.ts` | Añadir `ActionWithInfra` y `MaterialWithAction` |
| `frontend/src/hooks/useActions.ts` | Añadir `useAllActions()` y `useAllMaterials()` |
| `frontend/src/pages/actions/ActionForm.tsx` | Añadir selector de infraestructura opcional |
| `frontend/src/pages/actions/ActionsPage.tsx` | Crear (tabla + panel lateral) |
| `frontend/src/pages/materials/MaterialsPage.tsx` | Crear (tabla global) |
| `backend/src/modules/actions/actions.service.ts` | Añadir `listAllActions()` y `listAllMaterials()` |
| `backend/src/modules/actions/actions.routes.ts` | Añadir `GET /actions` y `GET /materials` |

---

## Task 1: Instalar lucide-react y CSS design tokens

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Instalar lucide-react**

```bash
npm install lucide-react --workspace=@control-actions/frontend
```
Expected: `lucide-react` aparece en `frontend/package.json` dependencies.

- [ ] **Step 2: Añadir CSS custom properties a `frontend/src/index.css`**

Añadir dentro del bloque `:root { ... }` (o crearlo si no existe):

```css
:root {
  --bg: #F5F7FA;
  --border: #E5E7EB;
  --card: #FFFFFF;
  --fg: #111827;
  --fg-secondary: #374151;
  --muted: #6B7280;
  --primary: #2563EB;
  --primary-fg: #FFFFFF;
  --radius: 8px;
  --sidebar-bg: #1E293B;
  --sidebar-fg: #94A3B8;
  --sidebar-active: #334155;
  --sidebar-active-fg: #FFFFFF;
  --success: #059669;
  --success-bg: #ECFDF5;
  --warning: #D97706;
  --warning-bg: #FFFBEB;
  --error: #DC2626;
  --error-bg: #FEF2F2;
  --info-bg: #EFF6FF;
}
```

- [ ] **Step 3: Extender Tailwind con los tokens en `frontend/tailwind.config.js`**

Reemplazar/extender la sección `theme.extend` para que quede:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fg: 'var(--fg)',
        'fg-secondary': 'var(--fg-secondary)',
        muted: 'var(--muted)',
        primary: { DEFAULT: 'var(--primary)', fg: 'var(--primary-fg)' },
        card: 'var(--card)',
        'app-bg': 'var(--bg)',
        'app-border': 'var(--border)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-fg': 'var(--sidebar-fg)',
        'sidebar-active': 'var(--sidebar-active)',
        'sidebar-active-fg': 'var(--sidebar-active-fg)',
        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)' },
        error: { DEFAULT: 'var(--error)', bg: 'var(--error-bg)' },
        'info-bg': 'var(--info-bg)',
      },
      borderRadius: { theme: 'var(--radius)' },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Verificar que Vite compila sin errores**

```bash
npm run dev:frontend
```
Expected: sin errores de compilación en consola.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/index.css frontend/tailwind.config.js
git commit -m "feat: design tokens CSS variables + lucide-react"
```

---

## Task 2: Rediseño del Sidebar y Topbar (Layout.tsx)

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

El sidebar pasa de 4 ítems sin iconos a 6 ítems con iconos lucide, logo nuevo con icono en caja de color, label de sección "MENÚ", y footer con avatar de iniciales. El topbar pasa a mostrar título + subtítulo por página en lugar de "● SISTEMA ONLINE".

- [ ] **Step 1: Reescribir `frontend/src/components/Layout.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Warehouse, Package,
  Users, Settings, LogOut, Bell, Menu,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, requireManage: false },
  { to: '/actions', icon: ClipboardList, label: 'Acciones', end: false, requireManage: false },
  { to: '/infrastructures', icon: Warehouse, label: 'Infraestructuras', end: false, requireManage: false },
  { to: '/materials', icon: Package, label: 'Materiales', end: false, requireManage: false },
  { to: '/admin', icon: Users, label: 'Usuarios', end: true, requireManage: true },
  { to: '/admin/catalog', icon: Settings, label: 'Configuración', end: false, requireManage: true },
]

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Panel de Control', subtitle: 'Resumen general del sistema' },
  '/actions': { title: 'Gestión de Acciones', subtitle: 'Registro y seguimiento de acciones' },
  '/infrastructures': { title: 'Infraestructuras', subtitle: 'Gestión y estado de infraestructuras' },
  '/materials': { title: 'Materiales Consumidos', subtitle: 'Registro de materiales usados por acción' },
  '/admin': { title: 'Usuarios', subtitle: 'Gestión de usuarios del sistema' },
  '/admin/catalog': { title: 'Configuración', subtitle: 'Tipos de acciones y roles' },
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  // Busca el título más específico que coincida con el pathname actual
  const pageInfo = Object.entries(PAGE_TITLES)
    .filter(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    ?? { title: '', subtitle: '' }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex h-screen bg-app-bg">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-sidebar-bg flex flex-col shrink-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-6 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Warehouse className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-[1px]">INFRAGEST</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[2px] text-sidebar-fg uppercase">Menú</p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, end, requireManage }) => {
            if (requireManage && !user?.can_manage) return null
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-medium'
                      : 'text-sidebar-fg hover:bg-sidebar-active/60 hover:text-white'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #334155' }}
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-[13px] font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate">{user?.email}</p>
            <p className="text-sidebar-fg text-[11px] truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-sidebar-fg hover:text-white transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card flex items-center justify-between px-7 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded text-muted hover:bg-app-bg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-fg leading-tight">{pageInfo.title}</h1>
              {pageInfo.subtitle && (
                <p className="text-[13px] text-muted leading-tight">{pageInfo.subtitle}</p>
              )}
            </div>
          </div>
          <button
            className="w-9 h-9 rounded-lg border border-app-border flex items-center justify-center text-muted hover:text-fg transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-[18px] h-[18px]" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar visualmente en el navegador**

Navegar a `http://localhost:5173`. Verificar:
- Sidebar oscuro con logo, 4-6 ítems según rol, footer con iniciales + email + logout icon
- Topbar con título + subtítulo en cada página
- Hamburger funciona en viewport estrecho

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: sidebar con iconos lucide y topbar con título/subtítulo por página"
```

---

## Task 3: Rediseño de la lista de infraestructuras

**Files:**
- Modify: `frontend/src/pages/infrastructures/InfrastructureList.tsx`

Sustituir la vista dual tabla/cards por una lista de cards ricas con icono de color, nombre + ubicación + descripción, y botón "Ver detalles".

- [ ] **Step 1: Reescribir `frontend/src/pages/infrastructures/InfrastructureList.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, Search, Plus, ChevronRight } from 'lucide-react'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

export function InfrastructureList() {
  const navigate = useNavigate()
  const { data: infrastructures = [], isLoading } = useInfrastructures()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = infrastructures.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-7 flex items-center justify-center text-muted text-sm">
        Cargando infraestructuras...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de filtros */}
      <div className="flex items-center justify-between px-7 py-3.5 bg-card"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-72">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        <RoleGuard require="write">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nueva Infraestructura
          </button>
        </RoleGuard>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-auto p-7 flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} infraestructura{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </p>

        {filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay infraestructuras registradas.'}
          </div>
        )}

        {filtered.map(infra => (
          <div
            key={infra.id}
            className="flex items-center gap-4 p-5 bg-card rounded-lg border border-app-border"
          >
            <div className="w-11 h-11 rounded-[10px] bg-info-bg flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fg truncate">{infra.name}</p>
              {infra.location && (
                <p className="text-[13px] text-muted truncate">{infra.location}</p>
              )}
              {infra.description && (
                <p className="text-[13px] text-fg-secondary truncate mt-0.5">{infra.description}</p>
              )}
            </div>

            <button
              onClick={() => navigate(`/infrastructures/${infra.id}`)}
              className="flex items-center gap-1 text-[13px] text-primary font-medium hover:opacity-80 transition-opacity shrink-0"
            >
              Ver detalles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Verificar en navegador**

Ir a `/infrastructures`. Comprobar:
- Cards con icono warehouse en caja azul claro
- Búsqueda filtra en tiempo real
- "Nueva Infraestructura" visible solo con permisos de escritura
- "Ver detalles" navega a `/infrastructures/:id`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/infrastructures/InfrastructureList.tsx
git commit -m "feat: infraestructuras con diseño de cards ricas"
```

---

## Task 4: Backend — endpoints globales de acciones y materiales

**Files:**
- Modify: `backend/src/modules/actions/actions.service.ts`
- Modify: `backend/src/modules/actions/actions.routes.ts`

Sin cambios de schema. Solo nuevas queries Prisma y dos rutas GET.

- [ ] **Step 1: Añadir `listAllActions` y `listAllMaterials` en `actions.service.ts`**

Añadir al final del fichero, antes del cierre:

```ts
export function listAllActions(db: PrismaClient) {
  return db.action.findMany({
    include: {
      actionType: true,
      performer: { select: { id: true, fullName: true, email: true } },
      materials: true,
      infrastructure: { select: { id: true, name: true } },
    },
    orderBy: { performedAt: 'desc' },
  })
}

export function listAllMaterials(db: PrismaClient) {
  return db.actionMaterial.findMany({
    include: {
      action: {
        select: {
          id: true,
          performedAt: true,
          actionType: { select: { name: true } },
          infrastructure: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  })
}
```

- [ ] **Step 2: Añadir rutas en `actions.routes.ts`**

Añadir justo antes de las rutas de acciones individuales (después de `const actionsRoutes: FastifyPluginAsync = async (fastify) => {`), como los primeros dos handlers:

```ts
  fastify.get('/actions', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const data = await listAllActions(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/materials', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const data = await listAllMaterials(fastify.db)
    return reply.send({ data })
  })
```

También actualizar la línea de imports en `actions.routes.ts`:

```ts
import {
  listActions, listAllActions, getAction, createAction, updateAction, deleteAction,
  listMaterials, listAllMaterials, createMaterial, updateMaterial, deleteMaterial,
} from './actions.service'
```

- [ ] **Step 3: Verificar manualmente**

Con el backend corriendo, ejecutar:
```bash
curl -s http://localhost:3000/api/v1/actions -H "Authorization: Bearer <token>" | jq '.data | length'
curl -s http://localhost:3000/api/v1/materials -H "Authorization: Bearer <token>" | jq '.data | length'
```
Expected: arrays JSON (pueden ser vacíos si no hay datos en dev).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/actions/actions.service.ts backend/src/modules/actions/actions.routes.ts
git commit -m "feat: endpoints GET /actions y GET /materials globales"
```

---

## Task 5: Tipos y hooks frontend para las nuevas queries

**Files:**
- Modify: `frontend/src/api/types.ts`
- Modify: `frontend/src/api/actions.ts`
- Modify: `frontend/src/hooks/useActions.ts`

- [ ] **Step 1: Añadir tipos en `frontend/src/api/types.ts`**

Añadir al final del fichero:

```ts
export interface ActionWithInfra extends ActionWithRelations {
  infrastructure: { id: number; name: string }
}

export interface MaterialWithAction extends ActionMaterial {
  action: {
    id: number
    performedAt: string
    actionType: { name: string }
    infrastructure: { id: number; name: string }
  }
}
```

- [ ] **Step 2: Añadir funciones en `frontend/src/api/actions.ts`**

Añadir al final del fichero:

```ts
export function listAllActions(): Promise<ActionWithInfra[]> {
  return apiFetch<{ data: ActionWithInfra[] }>(`${API_BASE}/actions`).then(r => r.data)
}

export function listAllMaterials(): Promise<MaterialWithAction[]> {
  return apiFetch<{ data: MaterialWithAction[] }>(`${API_BASE}/materials`).then(r => r.data)
}
```

También añadir los imports de tipos necesarios al inicio del fichero (si no están):

```ts
import type { ActionWithInfra, MaterialWithAction } from './types'
```

- [ ] **Step 3: Añadir hooks en `frontend/src/hooks/useActions.ts`**

Añadir al final del fichero:

```ts
export function useAllActions() {
  return useQuery({
    queryKey: ['actions', 'all'],
    queryFn: () => listAllActions(),
  })
}

export function useAllMaterials() {
  return useQuery({
    queryKey: ['materials', 'all'],
    queryFn: () => listAllMaterials(),
  })
}
```

También añadir los imports necesarios:

```ts
import { listAllActions, listAllMaterials } from '../api/actions'
import type { ActionWithInfra, MaterialWithAction } from '../api/types'
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/types.ts frontend/src/api/actions.ts frontend/src/hooks/useActions.ts
git commit -m "feat: tipos y hooks para listado global de acciones y materiales"
```

---

## Task 6: Actualizar ActionForm — selector de infraestructura opcional

**Files:**
- Modify: `frontend/src/pages/actions/ActionForm.tsx`

Cuando se abre desde la nueva página de Acciones (sin infraestructura preseleccionada), el form necesita mostrar un selector de infraestructura.

- [ ] **Step 1: Leer el fichero actual**

```bash
cat frontend/src/pages/actions/ActionForm.tsx
```

- [ ] **Step 2: Modificar la prop `infrastructureId` para que sea opcional y añadir selector**

El componente actualmente recibe `infrastructureId: number` como prop requerida. Cambiarlo a:
- `infrastructureId?: number` — opcional
- Si no se provee, mostrar un `<select>` con todas las infraestructuras al inicio del formulario

Cambios concretos:

En la firma del componente, cambiar:
```tsx
// ANTES
interface ActionFormProps {
  infrastructureId: number
  onClose: () => void
}
```
A:
```tsx
// DESPUÉS
interface ActionFormProps {
  infrastructureId?: number
  onClose: () => void
}
```

Añadir inside the component, después de los otros hooks:
```tsx
const { data: allInfras = [] } = useInfrastructures()
const [selectedInfraId, setSelectedInfraId] = useState<number | ''>(infrastructureId ?? '')
const resolvedInfraId = infrastructureId ?? (selectedInfraId === '' ? undefined : selectedInfraId)
```

Donde antes se usaba `infrastructureId` directamente en la mutación, usar `resolvedInfraId`.

Añadir este bloque antes del campo de tipo de acción, solo si `!infrastructureId`:
```tsx
{!infrastructureId && (
  <div>
    <label className="block text-xs font-medium text-muted mb-1">Infraestructura *</label>
    <select
      value={selectedInfraId}
      onChange={e => setSelectedInfraId(Number(e.target.value))}
      className="w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg"
      required
    >
      <option value="">Seleccionar infraestructura...</option>
      {allInfras.map(i => (
        <option key={i.id} value={i.id}>{i.name}</option>
      ))}
    </select>
  </div>
)}
```

El botón de submit debe estar deshabilitado si `!resolvedInfraId`.

Añadir el import:
```tsx
import { useInfrastructures } from '../../hooks/useInfrastructures'
```

- [ ] **Step 3: Verificar que el formulario sigue funcionando desde InfrastructureDetail**

Abrir una infraestructura → "Registrar acción" → el selector de infraestructura NO debe aparecer.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/actions/ActionForm.tsx
git commit -m "feat: ActionForm acepta infrastructureId opcional con selector"
```

---

## Task 7: Nueva página Acciones (`/actions`)

**Files:**
- Create: `frontend/src/pages/actions/ActionsPage.tsx`

Tabla global de acciones con panel lateral de detalle.

- [ ] **Step 1: Crear `frontend/src/pages/actions/ActionsPage.tsx`**

```tsx
import { useState } from 'react'
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { useAllActions } from '../../hooks/useActions'
import { useDeleteAction } from '../../hooks/useActions'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'
import { MaterialForm } from './MaterialForm'
import type { ActionWithInfra } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function ActionsPage() {
  const { data: actions = [], isLoading } = useAllActions()
  const deleteMut = useDeleteAction()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ActionWithInfra | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)

  const filtered = actions.filter(a =>
    a.infrastructure.name.toLowerCase().includes(search.toLowerCase()) ||
    a.actionType.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.performer?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta acción?')) return
    await deleteMut.mutateAsync(selected!.infrastructureId)
    // deleteMut signature needs action id - use the hook correctly
    setSelected(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior */}
      <div
        className="flex items-center justify-between px-7 py-3 bg-card"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-60">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        <RoleGuard require="write">
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 bg-primary text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nueva Acción
          </button>
        </RoleGuard>
      </div>

      {/* Tabla + Panel lateral */}
      <div className="flex flex-1 overflow-hidden p-7 gap-5">
        {/* Tabla */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-[13px] text-muted mb-3">
            {filtered.length} acción{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
          ) : (
            <div className="bg-card rounded-lg border border-app-border overflow-hidden flex-1 flex flex-col">
              {/* Cabecera */}
              <div className="flex items-center h-11 bg-app-bg text-[12px] font-semibold text-muted"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-16 px-3">ID</div>
                <div className="w-28 px-3">Tipo</div>
                <div className="flex-1 px-3">Infraestructura</div>
                <div className="w-32 px-3">Responsable</div>
                <div className="w-24 px-3">Fecha</div>
              </div>

              {/* Filas */}
              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-muted text-sm">
                    {search ? 'Sin resultados.' : 'No hay acciones registradas.'}
                  </div>
                )}
                {filtered.map(action => (
                  <div
                    key={action.id}
                    onClick={() => setSelected(action)}
                    className={`flex items-center h-[52px] text-[13px] cursor-pointer transition-colors ${
                      selected?.id === action.id ? 'bg-info-bg' : 'hover:bg-app-bg'
                    }`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="w-16 px-3 text-muted">#{action.id}</div>
                    <div className="w-28 px-3 text-fg truncate">{action.actionType.name}</div>
                    <div className="flex-1 px-3 text-fg-secondary truncate">{action.infrastructure.name}</div>
                    <div className="w-32 px-3 text-fg-secondary truncate">
                      {action.performer?.fullName ?? action.performer?.email ?? '—'}
                    </div>
                    <div className="w-24 px-3 text-muted">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral de detalle */}
        {selected && (
          <div
            className="w-[380px] shrink-0 bg-card rounded-lg border border-app-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between h-14 px-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-fg">#{selected.id}</span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-warning-bg text-warning">
                  {selected.actionType.name}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-app-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-[13px]">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Infraestructura</p>
                <p className="text-fg">{selected.infrastructure.name}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Descripción</p>
                <p className="text-fg leading-relaxed">{selected.description || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Responsable</p>
                  <p className="text-fg">{selected.performer?.fullName ?? selected.performer?.email ?? '—'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Fecha</p>
                  <p className="text-fg">{formatDate(selected.performedAt)}</p>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">
                  Materiales consumidos
                </p>
                {selected.materials.length === 0 ? (
                  <p className="text-muted">Sin materiales registrados.</p>
                ) : (
                  selected.materials.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-app-bg rounded-md px-3 py-2"
                    >
                      <span className="text-fg">{m.name}</span>
                      <span className="text-muted text-[12px]">
                        {String(m.quantity)} {m.unit}
                        {m.totalCost != null && ` · ${Number(m.totalCost).toFixed(2)}€`}
                      </span>
                    </div>
                  ))
                )}
                <RoleGuard require="write">
                  {selected.actionType.consumesMaterials && (
                    <button
                      onClick={() => setShowMaterialForm(true)}
                      className="text-[12px] text-primary font-medium mt-1 text-left hover:underline"
                    >
                      + Añadir material
                    </button>
                  )}
                </RoleGuard>
              </div>
            </div>

            {/* Footer de acciones */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <RoleGuard require="write">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-fg-secondary border border-app-border px-4 py-2 rounded-lg hover:bg-app-bg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              </RoleGuard>
              <RoleGuard require="manage">
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-error border border-error-bg bg-error-bg px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </RoleGuard>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showNewForm && (
        <ActionForm onClose={() => setShowNewForm(false)} />
      )}
      {showEditForm && selected && (
        <ActionForm
          infrastructureId={selected.infrastructureId}
          action={selected}
          onClose={() => { setShowEditForm(false); setSelected(null) }}
        />
      )}
      {showMaterialForm && selected && (
        <MaterialForm
          actionId={selected.id}
          onClose={() => setShowMaterialForm(false)}
        />
      )}
    </div>
  )
}
```

> **Nota:** `useDeleteAction` tiene la firma `useDeleteAction(infraId)` en el hook actual. Para usar desde esta página sin `infraId` disponible en el hook, hay que pasar `selected.infrastructureId` al instanciar el hook, o refactorizar el hook para que acepte `infraId` en el `mutateAsync`. Verificar la firma exacta leyendo `hooks/useActions.ts` y ajustar según corresponda.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/actions/ActionsPage.tsx
git commit -m "feat: página Acciones con tabla y panel lateral de detalle"
```

---

## Task 8: Nueva página Materiales (`/materials`)

**Files:**
- Create: `frontend/src/pages/materials/MaterialsPage.tsx`

- [ ] **Step 1: Crear `frontend/src/pages/materials/MaterialsPage.tsx`**

```tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAllMaterials } from '../../hooks/useActions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function MaterialsPage() {
  const { data: materials = [], isLoading } = useAllMaterials()
  const [search, setSearch] = useState('')
  const [infraFilter, setInfraFilter] = useState('')

  const allInfras = Array.from(
    new Map(materials.map(m => [m.action.infrastructure.id, m.action.infrastructure.name])).entries()
  )

  const filtered = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.supplier ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesInfra = !infraFilter || String(m.action.infrastructure.id) === infraFilter
    return matchesSearch && matchesInfra
  })

  return (
    <div className="flex flex-col h-full">
      {/* Barra de filtros */}
      <div
        className="flex items-center justify-between px-7 py-3 bg-card"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-72">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              placeholder="Buscar por material o proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
            />
          </div>
          <select
            value={infraFilter}
            onChange={e => setInfraFilter(e.target.value)}
            className="h-9 border border-app-border rounded-md px-3 text-[13px] text-fg bg-app-bg"
          >
            <option value="">Todas las infraestructuras</option>
            {allInfras.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto p-7 flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
        ) : (
          <div className="bg-card rounded-lg border border-app-border overflow-hidden">
            {/* Cabecera */}
            <div
              className="flex items-center h-[42px] bg-app-bg text-[12px] font-semibold text-muted"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1 px-4">Material</div>
              <div className="w-20 px-3">Cant.</div>
              <div className="w-20 px-3">Unidad</div>
              <div className="w-24 px-3">C. Unit.</div>
              <div className="w-24 px-3">Total</div>
              <div className="w-32 px-3">Proveedor</div>
              <div className="w-32 px-3">Acción</div>
              <div className="flex-1 px-3">Infraestructura</div>
              <div className="w-24 px-3">Fecha</div>
            </div>

            {/* Filas */}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-24 text-muted text-sm">
                {search || infraFilter ? 'Sin resultados.' : 'No hay materiales registrados.'}
              </div>
            )}
            {filtered.map(m => (
              <div
                key={m.id}
                className="flex items-center h-[50px] text-[13px] hover:bg-app-bg transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex-1 px-4 font-medium text-fg truncate">{m.name}</div>
                <div className="w-20 px-3 text-muted">{String(m.quantity)}</div>
                <div className="w-20 px-3 text-muted">{m.unit}</div>
                <div className="w-24 px-3 text-muted">
                  {m.unitCost != null ? `${Number(m.unitCost).toFixed(2)}€` : '—'}
                </div>
                <div className="w-24 px-3 text-fg">
                  {m.totalCost != null ? `${Number(m.totalCost).toFixed(2)}€` : '—'}
                </div>
                <div className="w-32 px-3 text-fg-secondary truncate">{m.supplier ?? '—'}</div>
                <div className="w-32 px-3 text-fg-secondary truncate">{m.action.actionType.name}</div>
                <div className="flex-1 px-3 text-fg-secondary truncate">{m.action.infrastructure.name}</div>
                <div className="w-24 px-3 text-muted">{formatDate(m.action.performedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/materials/MaterialsPage.tsx
git commit -m "feat: página Materiales con tabla global y filtros"
```

---

## Task 9: Registrar rutas en App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Añadir imports y rutas en `App.tsx`**

Añadir imports:
```tsx
import { ActionsPage } from './pages/actions/ActionsPage'
import { MaterialsPage } from './pages/materials/MaterialsPage'
```

Dentro del bloque `<Route element={<Layout />}>`, añadir las dos rutas nuevas junto a las existentes:
```tsx
<Route path="/actions" element={<ActionsPage />} />
<Route path="/materials" element={<MaterialsPage />} />
```

- [ ] **Step 2: Verificar navegación completa**

Con frontend + backend corriendo:
1. Clic en "Acciones" en el sidebar → `/actions` carga la tabla
2. Clic en una fila → panel lateral muestra detalle
3. Clic en "Materiales" → `/materials` carga la tabla
4. Filtrar por infraestructura → la tabla se filtra
5. Clic en "Infraestructuras" → cards con diseño nuevo
6. Sidebar muestra 4 ítems sin permisos de gestión, 6 con ellos
7. Topbar muestra título + subtítulo correcto en cada ruta

- [ ] **Step 3: Commit final**

```bash
git add frontend/src/App.tsx
git commit -m "feat: rutas /actions y /materials registradas en App"
```

---

## Verificación end-to-end

```bash
# 1. Levantar stack
./dev.sh

# 2. Login como admin
# http://localhost:5173/login → admin@example.com / admin1234

# 3. Recorrer cada pantalla y verificar:
# - Sidebar: logo INFRAGEST, 6 ítems con iconos, footer con avatar/email/role/logout
# - Topbar: título + subtítulo cambia por ruta, campana de notificaciones
# - /infrastructures: cards con icono warehouse en caja azul, búsqueda funciona
# - /actions: tabla de acciones, clic abre panel lateral, botón "Nueva Acción" abre modal
# - /materials: tabla global de materiales con filtros

# 4. Verificar con usuario editor (sin can_manage):
# - Sidebar solo muestra Dashboard, Acciones, Infraestructuras, Materiales
# - Botones de eliminar no aparecen en el panel lateral
```
