# Frontend SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el SPA React que consume la API del Plan 1 — autenticación, gestión de infraestructuras, acciones, materiales y administración.

**Architecture:** SPA puro (React 18 + Vite) servido como archivos estáticos por Nginx. Se comunica con el backend vía `fetch` + TanStack Query para cache y sincronización. El token JWT viaja en memoria (no localStorage). En desarrollo, Vite hace proxy de `/api` a `localhost:3000`.

**Tech Stack:** React 18 · Vite · TypeScript · React Router v6 · TanStack Query v5 · Tailwind CSS · Vitest + React Testing Library

---

## Mapa de archivos

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx                          # entry point
    ├── App.tsx                           # router + QueryClient + AuthProvider
    ├── api/
    │   ├── client.ts                     # fetch wrapper (auth header, error handling)
    │   ├── auth.ts                       # login(), logout(), refresh()
    │   ├── users.ts                      # CRUD usuarios
    │   ├── infrastructures.ts            # CRUD infraestructuras
    │   ├── actions.ts                    # CRUD acciones + materiales
    │   └── catalog.ts                    # catálogos (roles, estados, tipos)
    ├── contexts/
    │   └── AuthContext.tsx               # token en memoria, user payload, login/logout
    ├── hooks/
    │   ├── useAuth.ts                    # consume AuthContext
    │   ├── useInfrastructures.ts         # TanStack Query hooks
    │   ├── useActions.ts
    │   └── useCatalog.ts
    ├── components/
    │   ├── Layout.tsx                    # sidebar + topbar + <Outlet />
    │   ├── ProtectedRoute.tsx            # redirige a /login si no autenticado
    │   ├── RoleGuard.tsx                 # muestra/oculta según can_write/can_manage
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Modal.tsx
    │       ├── Table.tsx
    │       └── Badge.tsx
    └── pages/
        ├── Login.tsx
        ├── Dashboard.tsx                 # resumen con conteos
        ├── infrastructures/
        │   ├── InfrastructureList.tsx    # tabla con búsqueda y filtro de estado
        │   ├── InfrastructureDetail.tsx  # ficha + lista de acciones
        │   └── InfrastructureForm.tsx    # crear/editar (modal)
        ├── actions/
        │   ├── ActionForm.tsx            # crear/editar acción
        │   └── MaterialForm.tsx          # añadir material a una acción
        └── admin/
            ├── Users.tsx                 # gestión de usuarios (solo manage)
            └── Catalog.tsx               # gestión de catálogos (solo manage)
```

---

## Task 1: Scaffold frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Crear frontend/package.json**

```json
{
  "name": "@control-actions/frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1",
    "@tanstack/react-query": "^5.49.2"
  },
  "devDependencies": {
    "@control-actions/shared": "*",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.4.5",
    "vite": "^5.3.3",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.1.0"
  }
}
```

- [ ] **Step 2: Crear frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@control-actions/shared": ["../shared/src/types"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Crear frontend/vite.config.ts**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
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

- [ ] **Step 4: Crear frontend/tailwind.config.js**

```js
// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Crear frontend/postcss.config.js**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 6: Crear frontend/index.html**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Control Actions</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Crear frontend/src/main.tsx**

```tsx
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Crear frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Crear frontend/src/tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Instalar dependencias y verificar que arranca**

```bash
cd /path/to/control-actions
npm install
cd frontend
npm run dev
```

Expected: Vite arranca en `http://localhost:5173` (pantalla en blanco — App.tsx aún no existe).

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend React + Vite + TypeScript + Tailwind"
```

---

## Task 2: API client y AuthContext

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/hooks/useAuth.ts`

- [ ] **Step 1: Crear frontend/src/api/client.ts**

```typescript
// frontend/src/api/client.ts

// El token vive en memoria — se pierde al recargar (el refresh cookie lo restaura)
let accessToken: string | null = null

export function setToken(token: string | null) {
  accessToken = token
}

export function getToken() {
  return accessToken
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (!skipAuth && accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(path, { ...fetchOptions, headers })

  // Token expirado — intentar refresh automático
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
      const retryRes = await fetch(path, { ...fetchOptions, headers })
      if (!retryRes.ok) {
        const err = await retryRes.json()
        throw err
      }
      return retryRes.json()
    }
    // Refresh falló — limpiar token y dejar que el router redirija
    setToken(null)
    throw { error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } }
  }

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    if (!res.ok) return false
    const { data } = await res.json()
    setToken(data.accessToken)
    return true
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Crear frontend/src/api/auth.ts**

```typescript
// frontend/src/api/auth.ts
import { apiFetch, setToken } from './client'
import { JwtPayload } from '@control-actions/shared'

export interface LoginResponse {
  data: { accessToken: string }
}

export async function login(email: string, password: string): Promise<JwtPayload> {
  const res = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setToken(res.data.accessToken)
  // Decodificar el payload del JWT (sin verificar — el backend ya lo hizo)
  const payload = JSON.parse(atob(res.data.accessToken.split('.')[1])) as JwtPayload
  return payload
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  setToken(null)
}

export async function restoreSession(): Promise<JwtPayload | null> {
  try {
    // Intentar renovar con la cookie de refresh
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    if (!res.ok) return null
    const { data } = await res.json()
    setToken(data.accessToken)
    return JSON.parse(atob(data.accessToken.split('.')[1])) as JwtPayload
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Crear frontend/src/contexts/AuthContext.tsx**

```tsx
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { JwtPayload } from '@control-actions/shared'
import { login as apiLogin, logout as apiLogout, restoreSession } from '../api/auth'

interface AuthContextValue {
  user: JwtPayload | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

  // Al montar, intentar restaurar sesión con la cookie de refresh
  useEffect(() => {
    restoreSession()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const payload = await apiLogin(email, password)
    setUser(payload)
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Crear frontend/src/hooks/useAuth.ts**

```typescript
// frontend/src/hooks/useAuth.ts
// Re-exporta desde el contexto para mantener imports limpios en componentes
export { useAuth } from '../contexts/AuthContext'
```

- [ ] **Step 5: Escribir test del AuthContext**

```typescript
// frontend/src/tests/AuthContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import * as authApi from '../api/auth'

// Componente auxiliar para exponer el contexto en tests
function TestConsumer() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(null)
  })

  it('empieza sin usuario', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'))
  })

  it('actualiza el usuario tras login', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      sub: 1, email: 'admin@test.com', role: 'admin', can_write: true, can_manage: true,
    })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@test.com'))
  })

  it('limpia el usuario tras logout', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue({
      sub: 1, email: 'admin@test.com', role: 'admin', can_write: true, can_manage: true,
    })
    vi.spyOn(authApi, 'logout').mockResolvedValue()
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@test.com'))
    await userEvent.click(screen.getByText('Logout'))
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'))
  })
})
```

- [ ] **Step 6: Ejecutar test**

```bash
cd frontend
npm test -- src/tests/AuthContext.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/api/ frontend/src/contexts/ frontend/src/hooks/ frontend/src/tests/
git commit -m "feat: api client con refresh automático y AuthContext"
```

---

## Task 3: Routing, Layout y Login

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/components/RoleGuard.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Crear frontend/src/components/ProtectedRoute.tsx**

```tsx
// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 2: Crear frontend/src/components/RoleGuard.tsx**

```tsx
// frontend/src/components/RoleGuard.tsx
import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface RoleGuardProps {
  require: 'write' | 'manage'
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ require, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user) return <>{fallback}</>
  if (require === 'write' && !user.can_write) return <>{fallback}</>
  if (require === 'manage' && !user.can_manage) return <>{fallback}</>
  return <>{children}</>
}
```

- [ ] **Step 3: Crear frontend/src/components/Layout.tsx**

```tsx
// frontend/src/components/Layout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col">
        <div className="px-4 py-5 text-white font-bold text-lg border-b border-gray-700">
          Control Actions
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
          }>Dashboard</NavLink>
          <NavLink to="/infrastructures" className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
          }>Infraestructuras</NavLink>
          {user?.can_manage && (
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
            }>Administración</NavLink>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-gray-700 text-xs">
          <p className="text-gray-400 truncate">{user?.email}</p>
          <p className="text-gray-500 capitalize">{user?.role}</p>
          <button onClick={handleLogout} className="mt-2 text-red-400 hover:text-red-300 text-xs">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Crear frontend/src/pages/Login.tsx**

```tsx
// frontend/src/pages/Login.tsx
import { useState, FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Control Actions</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Crear frontend/src/pages/Dashboard.tsx**

```tsx
// frontend/src/pages/Dashboard.tsx
import { useAuth } from '../hooks/useAuth'

export function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Bienvenido, {user?.email}</p>
      <p className="text-gray-400 text-sm">Usa el menú lateral para navegar.</p>
    </div>
  )
}
```

- [ ] **Step 6: Crear frontend/src/App.tsx**

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                {/* Rutas adicionales se añaden en tasks posteriores */}
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 7: Probar en el navegador**

```bash
cd frontend && npm run dev
```

Abrir `http://localhost:5173`. Expected: redirección a `/login`, formulario visible. Introducir `admin@example.com` / `admin1234` (requiere backend corriendo). Expected: redirige a `/` y muestra el Layout con sidebar.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: routing, layout, login y dashboard"
```

---

## Task 4: API hooks (TanStack Query)

**Files:**
- Create: `frontend/src/api/infrastructures.ts`
- Create: `frontend/src/api/actions.ts`
- Create: `frontend/src/api/catalog.ts`
- Create: `frontend/src/api/users.ts`
- Create: `frontend/src/hooks/useInfrastructures.ts`
- Create: `frontend/src/hooks/useActions.ts`
- Create: `frontend/src/hooks/useCatalog.ts`

- [ ] **Step 1: Crear frontend/src/api/infrastructures.ts**

```typescript
// frontend/src/api/infrastructures.ts
import { apiFetch } from './client'

export interface Infrastructure {
  id: number
  name: string
  description?: string
  location?: string
  statusId: number
  createdAt: string
  updatedAt: string
  status: { id: number; name: string; description?: string }
}

export interface CreateInfrastructureInput {
  name: string
  description?: string
  location?: string
  statusId: number
}

export const getInfrastructures = () =>
  apiFetch<{ data: Infrastructure[] }>('/api/infrastructures').then(r => r.data)

export const getInfrastructure = (id: number) =>
  apiFetch<{ data: Infrastructure }>(`/api/infrastructures/${id}`).then(r => r.data)

export const createInfrastructure = (body: CreateInfrastructureInput) =>
  apiFetch<{ data: Infrastructure }>('/api/infrastructures', {
    method: 'POST', body: JSON.stringify(body),
  }).then(r => r.data)

export const updateInfrastructure = (id: number, body: Partial<CreateInfrastructureInput>) =>
  apiFetch<{ data: Infrastructure }>(`/api/infrastructures/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }).then(r => r.data)

export const deleteInfrastructure = (id: number) =>
  apiFetch<{ data: { ok: boolean } }>(`/api/infrastructures/${id}`, { method: 'DELETE' })
```

- [ ] **Step 2: Crear frontend/src/api/actions.ts**

```typescript
// frontend/src/api/actions.ts
import { apiFetch } from './client'

export interface Action {
  id: number
  infrastructureId: number
  performedBy: number
  actionTypeId: number
  description?: string
  performedAt: string
  createdAt: string
  actionType: { id: number; name: string; consumesMaterials: boolean }
  performer: { id: number; fullName: string; email: string }
  materials: Material[]
}

export interface Material {
  id: number
  actionId: number
  name: string
  description?: string
  unit: string
  quantity: string
  unitCost?: string
  totalCost?: string
  supplier?: string
  notes?: string
}

export interface CreateActionInput {
  actionTypeId: number
  description?: string
  performedAt?: string
}

export interface CreateMaterialInput {
  name: string
  unit: string
  quantity: number
  description?: string
  unitCost?: number
  supplier?: string
  notes?: string
}

export const getActions = (infrastructureId: number) =>
  apiFetch<{ data: Action[] }>(`/api/infrastructures/${infrastructureId}/actions`).then(r => r.data)

export const getAction = (id: number) =>
  apiFetch<{ data: Action }>(`/api/actions/${id}`).then(r => r.data)

export const createAction = (infrastructureId: number, body: CreateActionInput) =>
  apiFetch<{ data: Action }>(`/api/infrastructures/${infrastructureId}/actions`, {
    method: 'POST', body: JSON.stringify(body),
  }).then(r => r.data)

export const updateAction = (id: number, body: Partial<CreateActionInput>) =>
  apiFetch<{ data: Action }>(`/api/actions/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }).then(r => r.data)

export const deleteAction = (id: number) =>
  apiFetch<{ data: { ok: boolean } }>(`/api/actions/${id}`, { method: 'DELETE' })

export const getMaterials = (actionId: number) =>
  apiFetch<{ data: Material[] }>(`/api/actions/${actionId}/materials`).then(r => r.data)

export const createMaterial = (actionId: number, body: CreateMaterialInput) =>
  apiFetch<{ data: Material }>(`/api/actions/${actionId}/materials`, {
    method: 'POST', body: JSON.stringify(body),
  }).then(r => r.data)

export const deleteMaterial = (id: number) =>
  apiFetch<{ data: { ok: boolean } }>(`/api/materials/${id}`, { method: 'DELETE' })
```

- [ ] **Step 3: Crear frontend/src/api/catalog.ts**

```typescript
// frontend/src/api/catalog.ts
import { apiFetch } from './client'

export interface InfraStatus { id: number; name: string; description?: string }
export interface ActionType { id: number; name: string; description?: string; consumesMaterials: boolean }
export interface Role { id: number; name: string; canWrite: boolean; canManage: boolean }

export const getInfraStatuses = () =>
  apiFetch<{ data: InfraStatus[] }>('/api/catalog/infra-statuses').then(r => r.data)

export const getActionTypes = () =>
  apiFetch<{ data: ActionType[] }>('/api/catalog/action-types').then(r => r.data)

export const getRoles = () =>
  apiFetch<{ data: Role[] }>('/api/catalog/roles').then(r => r.data)
```

- [ ] **Step 4: Crear frontend/src/api/users.ts**

```typescript
// frontend/src/api/users.ts
import { apiFetch } from './client'

export interface User {
  id: number
  email: string
  fullName: string
  isActive: boolean
  createdAt: string
  role: { id: number; name: string; canWrite: boolean; canManage: boolean }
}

export interface CreateUserInput { email: string; password: string; fullName: string; roleId: number }
export interface UpdateUserInput { email?: string; fullName?: string; roleId?: number; isActive?: boolean }

export const getUsers = () =>
  apiFetch<{ data: User[] }>('/api/users').then(r => r.data)

export const createUser = (body: CreateUserInput) =>
  apiFetch<{ data: User }>('/api/users', { method: 'POST', body: JSON.stringify(body) }).then(r => r.data)

export const updateUser = (id: number, body: UpdateUserInput) =>
  apiFetch<{ data: User }>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(r => r.data)

export const deleteUser = (id: number) =>
  apiFetch<{ data: { ok: boolean } }>(`/api/users/${id}`, { method: 'DELETE' })
```

- [ ] **Step 5: Crear frontend/src/hooks/useInfrastructures.ts**

```typescript
// frontend/src/hooks/useInfrastructures.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/infrastructures'

export function useInfrastructures() {
  return useQuery({ queryKey: ['infrastructures'], queryFn: api.getInfrastructures })
}

export function useInfrastructure(id: number) {
  return useQuery({ queryKey: ['infrastructures', id], queryFn: () => api.getInfrastructure(id) })
}

export function useCreateInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createInfrastructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infrastructures'] }),
  })
}

export function useUpdateInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof api.updateInfrastructure>[1] }) =>
      api.updateInfrastructure(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infrastructures'] }),
  })
}

export function useDeleteInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteInfrastructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infrastructures'] }),
  })
}
```

- [ ] **Step 6: Crear frontend/src/hooks/useActions.ts**

```typescript
// frontend/src/hooks/useActions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/actions'

export function useActions(infrastructureId: number) {
  return useQuery({ queryKey: ['actions', infrastructureId], queryFn: () => api.getActions(infrastructureId) })
}

export function useCreateAction(infrastructureId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof api.createAction>[1]) => api.createAction(infrastructureId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions', infrastructureId] }),
  })
}

export function useDeleteAction(infrastructureId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions', infrastructureId] }),
  })
}

export function useCreateMaterial(actionId: number, infrastructureId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof api.createMaterial>[1]) => api.createMaterial(actionId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions', infrastructureId] }),
  })
}

export function useDeleteMaterial(infrastructureId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions', infrastructureId] }),
  })
}
```

- [ ] **Step 7: Crear frontend/src/hooks/useCatalog.ts**

```typescript
// frontend/src/hooks/useCatalog.ts
import { useQuery } from '@tanstack/react-query'
import * as api from '../api/catalog'

export const useInfraStatuses = () =>
  useQuery({ queryKey: ['catalog', 'infra-statuses'], queryFn: api.getInfraStatuses, staleTime: Infinity })

export const useActionTypes = () =>
  useQuery({ queryKey: ['catalog', 'action-types'], queryFn: api.getActionTypes, staleTime: Infinity })

export const useRoles = () =>
  useQuery({ queryKey: ['catalog', 'roles'], queryFn: api.getRoles, staleTime: Infinity })
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/api/ frontend/src/hooks/
git commit -m "feat: api functions y TanStack Query hooks"
```

---

## Task 5: Página Infraestructuras

**Files:**
- Create: `frontend/src/pages/infrastructures/InfrastructureList.tsx`
- Create: `frontend/src/pages/infrastructures/InfrastructureDetail.tsx`
- Create: `frontend/src/pages/infrastructures/InfrastructureForm.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`
- Create: `frontend/src/components/ui/Modal.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear frontend/src/components/ui/Badge.tsx**

```tsx
// frontend/src/components/ui/Badge.tsx
const colors: Record<string, string> = {
  active:      'bg-green-100 text-green-800',
  inactive:    'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

export function Badge({ label }: { label: string }) {
  const cls = colors[label] ?? 'bg-blue-100 text-blue-800'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
}
```

- [ ] **Step 2: Crear frontend/src/components/ui/Modal.tsx**

```tsx
// frontend/src/components/ui/Modal.tsx
import { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear frontend/src/pages/infrastructures/InfrastructureForm.tsx**

```tsx
// frontend/src/pages/infrastructures/InfrastructureForm.tsx
import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useInfraStatuses } from '../../hooks/useCatalog'
import { useCreateInfrastructure, useUpdateInfrastructure } from '../../hooks/useInfrastructures'
import type { Infrastructure } from '../../api/infrastructures'

interface Props {
  onClose: () => void
  existing?: Infrastructure
}

export function InfrastructureForm({ onClose, existing }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [statusId, setStatusId] = useState<number>(existing?.statusId ?? 0)
  const [error, setError] = useState('')

  const { data: statuses = [] } = useInfraStatuses()
  const createMutation = useCreateInfrastructure()
  const updateMutation = useUpdateInfrastructure()
  const isPending = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const body = { name, description: description || undefined, location: location || undefined, statusId }
    try {
      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, body })
      } else {
        await createMutation.mutateAsync(body)
      }
      onClose()
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al guardar')
    }
  }

  return (
    <Modal title={existing ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
          <select value={statusId} onChange={e => setStatusId(Number(e.target.value))} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value={0} disabled>Selecciona un estado</option>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50">
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 4: Crear frontend/src/pages/infrastructures/InfrastructureList.tsx**

```tsx
// frontend/src/pages/infrastructures/InfrastructureList.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { Badge } from '../../components/ui/Badge'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

export function InfrastructureList() {
  const { data: infrastructures = [], isLoading, error } = useInfrastructures()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = infrastructures.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <p className="text-gray-400">Cargando...</p>
  if (error) return <p className="text-red-500">Error al cargar infraestructuras</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Infraestructuras</h1>
        <RoleGuard require="write">
          <button onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
            + Nueva
          </button>
        </RoleGuard>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o ubicación..."
        className="w-full max-w-sm border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900" />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">Sin resultados</td></tr>
            )}
            {filtered.map(i => (
              <tr key={i.id} onClick={() => navigate(`/infrastructures/${i.id}`)}
                className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{i.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{i.location ?? '—'}</td>
                <td className="px-4 py-3"><Badge label={i.status.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
```

- [ ] **Step 5: Crear frontend/src/pages/infrastructures/InfrastructureDetail.tsx**

```tsx
// frontend/src/pages/infrastructures/InfrastructureDetail.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfrastructure } from '../../hooks/useInfrastructures'
import { useActions, useDeleteAction } from '../../hooks/useActions'
import { Badge } from '../../components/ui/Badge'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'
import { ActionForm } from '../actions/ActionForm'

export function InfrastructureDetail() {
  const { id } = useParams<{ id: string }>()
  const infraId = Number(id)
  const navigate = useNavigate()
  const { data: infra, isLoading } = useInfrastructure(infraId)
  const { data: actions = [] } = useActions(infraId)
  const deleteAction = useDeleteAction(infraId)
  const [showEditInfra, setShowEditInfra] = useState(false)
  const [showNewAction, setShowNewAction] = useState(false)

  if (isLoading) return <p className="text-gray-400">Cargando...</p>
  if (!infra) return <p className="text-red-500">Infraestructura no encontrada</p>

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/infrastructures')} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{infra.name}</h1>
          {infra.location && <p className="text-sm text-gray-500">{infra.location}</p>}
          <div className="mt-1"><Badge label={infra.status.name} /></div>
        </div>
        <RoleGuard require="write">
          <button onClick={() => setShowEditInfra(true)}
            className="border border-gray-300 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            Editar
          </button>
        </RoleGuard>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Acciones registradas</h2>
        <RoleGuard require="write">
          <button onClick={() => setShowNewAction(true)}
            className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-700">
            + Registrar acción
          </button>
        </RoleGuard>
      </div>

      <div className="space-y-3">
        {actions.length === 0 && <p className="text-gray-400 text-sm">Sin acciones registradas.</p>}
        {actions.map(action => (
          <div key={action.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                  {action.actionType.name}
                </span>
                <p className="text-sm text-gray-800 mt-1">{action.description ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(action.performedAt).toLocaleDateString('es-ES')} · {action.performer.fullName}
                </p>
              </div>
              <RoleGuard require="manage">
                <button onClick={() => deleteAction.mutate(action.id)}
                  className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </RoleGuard>
            </div>
            {action.materials.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Materiales</p>
                <div className="space-y-1">
                  {action.materials.map(m => (
                    <div key={m.id} className="flex justify-between text-xs text-gray-600">
                      <span>{m.name} — {m.quantity} {m.unit}</span>
                      {m.totalCost && <span>{Number(m.totalCost).toFixed(2)} €</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showEditInfra && <InfrastructureForm existing={infra} onClose={() => setShowEditInfra(false)} />}
      {showNewAction && <ActionForm infrastructureId={infraId} onClose={() => setShowNewAction(false)} />}
    </div>
  )
}
```

- [ ] **Step 6: Registrar rutas en App.tsx**

```tsx
// frontend/src/App.tsx — añadir imports:
import { InfrastructureList } from './pages/infrastructures/InfrastructureList'
import { InfrastructureDetail } from './pages/infrastructures/InfrastructureDetail'

// dentro de <Route element={<Layout />}>:
<Route path="/infrastructures" element={<InfrastructureList />} />
<Route path="/infrastructures/:id" element={<InfrastructureDetail />} />
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: página infraestructuras (listado + detalle + formulario)"
```

---

## Task 6: Formularios de Acciones y Materiales

**Files:**
- Create: `frontend/src/pages/actions/ActionForm.tsx`
- Create: `frontend/src/pages/actions/MaterialForm.tsx`

- [ ] **Step 1: Crear frontend/src/pages/actions/ActionForm.tsx**

```tsx
// frontend/src/pages/actions/ActionForm.tsx
import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useActionTypes } from '../../hooks/useCatalog'
import { useCreateAction } from '../../hooks/useActions'

interface Props {
  infrastructureId: number
  onClose: () => void
}

export function ActionForm({ infrastructureId, onClose }: Props) {
  const [actionTypeId, setActionTypeId] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')

  const { data: actionTypes = [] } = useActionTypes()
  const createMutation = useCreateAction(infrastructureId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createMutation.mutateAsync({
        actionTypeId,
        description: description || undefined,
        performedAt: new Date(performedAt).toISOString(),
      })
      onClose()
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al registrar')
    }
  }

  return (
    <Modal title="Registrar acción" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acción *</label>
          <select value={actionTypeId} onChange={e => setActionTypeId(Number(e.target.value))} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value={0} disabled>Selecciona un tipo</option>
            {actionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha realización *</label>
          <input type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={createMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50">
            {createMutation.isPending ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Crear frontend/src/pages/actions/MaterialForm.tsx**

```tsx
// frontend/src/pages/actions/MaterialForm.tsx
import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateMaterial } from '../../hooks/useActions'

interface Props {
  actionId: number
  infrastructureId: number
  onClose: () => void
}

export function MaterialForm({ actionId, infrastructureId, onClose }: Props) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [error, setError] = useState('')

  const createMutation = useCreateMaterial(actionId, infrastructureId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createMutation.mutateAsync({
        name,
        unit,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        supplier: supplier || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al añadir material')
    }
  }

  const totalCost = quantity && unitCost ? (Number(quantity) * Number(unitCost)).toFixed(2) : null

  return (
    <Modal title="Añadir material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="ej. Cable UTP cat6"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input type="number" step="0.01" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} required placeholder="metros, kg, uds..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coste unitario (€)</label>
          <input type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {totalCost && <p className="text-xs text-gray-500 mt-1">Total estimado: {totalCost} €</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input value={supplier} onChange={e => setSupplier(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={createMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50">
            {createMutation.isPending ? 'Añadiendo...' : 'Añadir'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 3: Conectar MaterialForm desde InfrastructureDetail**

En `frontend/src/pages/infrastructures/InfrastructureDetail.tsx`, añadir estado y botón para materiales en cada acción:

```tsx
// Añadir import:
import { MaterialForm } from '../actions/MaterialForm'

// Añadir estado junto a los otros:
const [materialActionId, setMaterialActionId] = useState<number | null>(null)

// En el card de cada acción, dentro de <RoleGuard require="write">:
{action.actionType.consumesMaterials && (
  <button onClick={() => setMaterialActionId(action.id)}
    className="text-xs text-blue-500 hover:text-blue-700 ml-2">+ Material</button>
)}

// Al final del return, junto a los otros modals:
{materialActionId && (
  <MaterialForm
    actionId={materialActionId}
    infrastructureId={infraId}
    onClose={() => setMaterialActionId(null)}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/actions/ frontend/src/pages/infrastructures/InfrastructureDetail.tsx
git commit -m "feat: formularios de acciones y materiales"
```

---

## Task 7: Páginas de administración

**Files:**
- Create: `frontend/src/pages/admin/Users.tsx`
- Create: `frontend/src/pages/admin/Catalog.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Crear frontend/src/pages/admin/Users.tsx**

```tsx
// frontend/src/pages/admin/Users.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser } from '../../api/users'
import { useRoles } from '../../hooks/useCatalog'
import { Modal } from '../../components/ui/Modal'

export function Users() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const { data: roles = [] } = useRoles()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', roleId: 0 })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createUser({ ...form, roleId: Number(form.roleId) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowForm(false) },
    onError: (err: any) => setError(err?.error?.message ?? 'Error'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateUser(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  if (isLoading) return <p className="text-gray-400">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">+ Nuevo</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.fullName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.role.name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                    className={`text-xs px-2 py-0.5 rounded font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Sí' : 'No'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title="Nuevo usuario" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            {(['fullName', 'email', 'password'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                <input type={field === 'password' ? 'password' : 'text'}
                  value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: Number(e.target.value) }))}
                className="w-full border rounded-md px-3 py-2 text-sm">
                <option value={0} disabled>Selecciona un rol</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border rounded-md">Cancelar</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                className="px-4 py-2 text-sm text-white bg-gray-900 rounded-md disabled:opacity-50">Crear</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Crear frontend/src/pages/admin/Catalog.tsx**

```tsx
// frontend/src/pages/admin/Catalog.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useInfraStatuses, useActionTypes } from '../../hooks/useCatalog'
import { apiFetch } from '../../api/client'

export function Catalog() {
  const qc = useQueryClient()
  const { data: statuses = [] } = useInfraStatuses()
  const { data: actionTypes = [] } = useActionTypes()
  const [newStatus, setNewStatus] = useState('')
  const [newType, setNewType] = useState('')
  const [consumesMaterials, setConsumesMaterials] = useState(false)

  const addStatus = useMutation({
    mutationFn: () => apiFetch('/api/catalog/infra-statuses', { method: 'POST', body: JSON.stringify({ name: newStatus }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog'] }); setNewStatus('') },
  })

  const addType = useMutation({
    mutationFn: () => apiFetch('/api/catalog/action-types', { method: 'POST', body: JSON.stringify({ name: newType, consumesMaterials }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog'] }); setNewType('') },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogos</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Estados de infraestructura</h2>
          <ul className="space-y-1 mb-4">
            {statuses.map(s => <li key={s.id} className="text-sm text-gray-600">{s.name}</li>)}
          </ul>
          <div className="flex gap-2">
            <input value={newStatus} onChange={e => setNewStatus(e.target.value)} placeholder="Nuevo estado"
              className="flex-1 border rounded px-2 py-1 text-sm" />
            <button onClick={() => addStatus.mutate()} disabled={!newStatus}
              className="px-3 py-1 bg-gray-900 text-white rounded text-sm disabled:opacity-50">+</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Tipos de acción</h2>
          <ul className="space-y-1 mb-4">
            {actionTypes.map(t => (
              <li key={t.id} className="text-sm text-gray-600 flex items-center gap-2">
                {t.name} {t.consumesMaterials && <span className="text-xs text-blue-500">(materiales)</span>}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 items-center">
            <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nuevo tipo"
              className="flex-1 border rounded px-2 py-1 text-sm" />
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" checked={consumesMaterials} onChange={e => setConsumesMaterials(e.target.checked)} />
              materiales
            </label>
            <button onClick={() => addType.mutate()} disabled={!newType}
              className="px-3 py-1 bg-gray-900 text-white rounded text-sm disabled:opacity-50">+</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Registrar rutas admin en App.tsx**

```tsx
// frontend/src/App.tsx — añadir imports:
import { Users } from './pages/admin/Users'
import { Catalog } from './pages/admin/Catalog'

// dentro de <Route element={<Layout />}>:
<Route path="/admin" element={<Users />} />
<Route path="/admin/catalog" element={<Catalog />} />
```

- [ ] **Step 4: Añadir enlace a catálogos en el sidebar**

En `Layout.tsx`, dentro del bloque `{user?.can_manage && ...}`, añadir:

```tsx
<NavLink to="/admin/catalog" className={({ isActive }) =>
  `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
}>Catálogos</NavLink>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/ frontend/src/App.tsx frontend/src/components/Layout.tsx
git commit -m "feat: páginas de administración (usuarios y catálogos)"
```

---

## Task 8: Build y verificación final

- [ ] **Step 1: Ejecutar tests del frontend**

```bash
cd frontend
npm test
```

Expected: AuthContext tests en PASS.

- [ ] **Step 2: Verificar tipos TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Build de producción**

```bash
npm run build
```

Expected: carpeta `frontend/dist/` generada, sin errores de build.

- [ ] **Step 4: Comprobar el build con preview**

```bash
npm run preview
```

Abrir `http://localhost:4173`. Expected: la app funciona con el mismo comportamiento que en dev (requiere el backend corriendo).

- [ ] **Step 5: Flujo completo manual**

Con backend y frontend corriendo:
1. Login con `admin@example.com` / `admin1234` → redirige al dashboard
2. Crear una infraestructura → aparece en el listado
3. Abrir detalle → registrar una acción de tipo `repair`
4. Añadir un material a la acción → aparece con coste total calculado
5. Ir a Administración → crear un nuevo usuario con rol `editor`
6. Cerrar sesión → redirige al login

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: frontend SPA completo y verificado"
```

---

## Notas para el Plan 3 (Deploy)

El build del frontend genera `frontend/dist/`. El Plan 3 configura Nginx para servir ese directorio como archivos estáticos y hacer proxy de `/api/*` al contenedor del backend.
