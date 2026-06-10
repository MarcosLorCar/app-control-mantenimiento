# Frontend Alignment with Current Backend Schema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinear el frontend con el schema actual del backend (Infrastructure→Dependency→Structure→Material→Action + MaterialType/MaterialCategory) para que la app compile y funcione end-to-end.

> Nota (2026-05-05): Este documento se ha ajustado para reflejar el backend implementado en `backend/prisma/schema.prisma` y las rutas registradas en `backend/src/app.ts`. Se han eliminado referencias a conceptos no implementados (por ejemplo, estados de acción) y se han corregido afirmaciones sobre la eliminación de `InfrastructureType`.

**Architecture:** La migración es por capas — primero tipos y cliente API (sin UI), luego hooks, luego páginas. Cada task produce un estado compilable. La lógica de auth, layout y usuarios no cambia.

**Tech Stack:** React 18 · TypeScript · TanStack Query · React Router v6 · Tailwind · Lucide Icons

---

## Contexto del cambio de schema

| Concepto antiguo | Concepto nuevo |
|-----------------|---------------|
| `Infrastructure` (con location, lat/lng, infraTypeId) | `Infrastructure` (sin ubicación; `code` opcional; `infraTypeId` opcional) |
| `InfrastructureType` | Se mantiene (catálogo + relación opcional desde Infrastructure) |
| `ActionMaterial` (inline por acción) | `Material` (catálogo pre-existente con `typeId` y `attributes`) |
| Action scoped a infra (`POST /infrastructures/:id/actions`) | Action global sobre un material (`POST /actions` con `materialId`) |
| Action sin status | Sin estados de acción (no existe en Prisma/API actuales) |
| `catalog/action-types` | `action-types` (sin prefijo `/catalog/`) |
| N/A | `Dependency` (nodo jerarquico bajo Infrastructure) |
| N/A | `Structure` (ubicación física bajo Dependency o Infrastructure) |
| N/A | `MaterialType` + `MaterialCategory` (catálogo de tipos con atributos) |

---

## Mapa de archivos

| Archivo | Cambio |
|---------|--------|
| `frontend/src/api/types.ts` | Mantener en sync con Prisma/serialización del backend |
| `frontend/src/api/infrastructures.ts` | CRUD Infrastructure (`code?`, `infraTypeId?`) |
| `frontend/src/api/actions.ts` | Acciones globales por material (`/actions`, `/materials/:id/actions`) |
| `frontend/src/api/catalog.ts` | Catálogos implementados: roles, action-types, infrastructure-types, material-types, material-categories |
| `frontend/src/api/materials.ts` | CRUD Material + listados por ubicación |
| `frontend/src/hooks/useActions.ts` | Actualizar |
| `frontend/src/hooks/useMaterials.ts` | Actualizar |
| `frontend/src/hooks/useCatalog.ts` | Actualizar |
| `frontend/src/hooks/useMaterialCatalog.ts` | Crear nuevo |
| `frontend/src/pages/infrastructures/InfrastructureList.tsx` | Añadir campo `code` |
| `frontend/src/pages/infrastructures/InfrastructureForm.tsx` | Reemplazar campos (add code, remove location/lat/lng) |
| `frontend/src/pages/infrastructures/InfrastructureDetail.tsx` | Añadir sección materiales y acciones por material |
| `frontend/src/pages/actions/ActionForm.tsx` | Reemplazar campos (title, typeId, materialId) |
| `frontend/src/pages/actions/ActionsPage.tsx` | Ajustar columnas segun schema actual (sin status) |
| `frontend/src/pages/materials/MaterialsPage.tsx` | Reemplazar (nuevo modelo Material) |
| `frontend/src/pages/admin/Catalog.tsx` | Mantener InfraType; sin estados de acción |
| `frontend/src/App.tsx` | Sin cambios de rutas (por ahora) |

---

## Task 1: Reemplazar `api/types.ts`

**Files:**
- Rewrite: `frontend/src/api/types.ts`

- [ ] **Step 1: Reemplazar el archivo completo**

```typescript
// ==================== AUTH ====================

export interface Role {
  id: number
  name: string
  description: string | null
  canWrite: boolean
  canManage: boolean
}

export interface User {
  id: number
  email: string
  fullName: string
  roleId: number
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  role?: Role
}

// ==================== LOCATION HIERARCHY ====================

export interface Infrastructure {
  id: number
  code: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Dependency {
  id: number
  code: string
  name: string
  description: string | null
  infrastructureId: number
  parentId: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface DependencyWithChildren extends Dependency {
  children: Dependency[]
  structures: Structure[]
}

export interface Structure {
  id: number
  code: string
  name: string
  description: string | null
  infrastructureId: number | null
  dependencyId: number | null
  createdAt: string
  updatedAt: string
}

// ==================== MATERIAL CATALOG ====================

export type MaterialCategoryDataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM'

export interface MaterialCategory {
  id: number
  code: string
  name: string
  description: string | null
  dataType: MaterialCategoryDataType
  unit: string | null
  required: boolean
  sortOrder: number
  enumValues: string[]
  materialTypeId: number
}

export interface MaterialType {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  deletedAt: string | null
}

export interface Material {
  id: number
  code: string
  name: string
  description: string | null
  serialNumber: string | null
  installedAt: string | null
  attributes: Record<string, unknown>
  typeId: number
  type: { id: number; code: string; name: string; icon: string | null }
  infrastructureId: number | null
  dependencyId: number | null
  structureId: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// ==================== ACTIONS ====================

export interface ActionType {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  deletedAt: string | null
}

export interface Action {
  id: number
  title: string
  description: string | null
  performedAt: string
  createdAt: string
  updatedAt: string
  typeId: number
  materialId: number
  performedBy: number
  type: { id: number; code: string; name: string; icon: string | null; color: string | null }
  material: { id: number; code: string; name: string; typeId: number }
  performer: { id: number; fullName: string; email: string }
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd frontend && npx tsc --noEmit
```

Expected: errores en los archivos que usan los tipos antiguos (actions.ts, catalog.ts, etc.) — esto es esperado y se resolverá en las tasks siguientes. No deben haber errores sintácticos en types.ts.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/types.ts
git commit -m "feat(frontend): replace api/types.ts with new schema types"
```

---

## Task 2: Actualizar `api/infrastructures.ts`

**Files:**
- Modify: `frontend/src/api/infrastructures.ts`

- [ ] **Step 1: Reemplazar el archivo completo**

```typescript
import { apiFetch } from './client'
import type { Infrastructure } from './types'

export async function listInfrastructures(): Promise<Infrastructure[]> {
  const res = await apiFetch<{ data: Infrastructure[] }>('/api/v1/infrastructures')
  return res.data
}

export async function getInfrastructure(id: number): Promise<Infrastructure> {
  const res = await apiFetch<{ data: Infrastructure }>(`/api/v1/infrastructures/${id}`)
  return res.data
}

export async function createInfrastructure(body: {
  code: string
  name: string
  description?: string
}): Promise<Infrastructure> {
  const res = await apiFetch<{ data: Infrastructure }>('/api/v1/infrastructures', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateInfrastructure(
  id: number,
  body: { name?: string; code?: string; description?: string }
): Promise<Infrastructure> {
  const res = await apiFetch<{ data: Infrastructure }>(`/api/v1/infrastructures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function deleteInfrastructure(id: number): Promise<void> {
  await apiFetch(`/api/v1/infrastructures/${id}`, { method: 'DELETE' })
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/infrastructures.ts
git commit -m "feat(frontend): update infrastructure API client (code field, remove location/lat/lng)"
```

---

## Task 3: Reemplazar `api/actions.ts`

**Files:**
- Rewrite: `frontend/src/api/actions.ts`

El cambio principal: las acciones ya NO están bajo `/infrastructures/:id/actions`. Son globales y apuntan a un `materialId`. Los materiales tampoco son inline.

- [ ] **Step 1: Reemplazar el archivo completo**

```typescript
import { apiFetch } from './client'
import type { Action } from './types'

export async function listActions(): Promise<Action[]> {
  const res = await apiFetch<{ data: Action[] }>('/api/v1/actions')
  return res.data
}

export async function getAction(id: number): Promise<Action> {
  const res = await apiFetch<{ data: Action }>(`/api/v1/actions/${id}`)
  return res.data
}

export async function createAction(body: {
  title: string
  typeId: number
  materialId: number
  description?: string
  performedAt?: string
}): Promise<Action> {
  const res = await apiFetch<{ data: Action }>('/api/v1/actions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateAction(
  id: number,
  body: { title?: string; description?: string; performedAt?: string }
): Promise<Action> {
  const res = await apiFetch<{ data: Action }>(`/api/v1/actions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function deleteAction(id: number): Promise<void> {
  await apiFetch(`/api/v1/actions/${id}`, { method: 'DELETE' })
}

export async function listMaterialActions(materialId: number): Promise<Action[]> {
  const res = await apiFetch<{ data: Action[] }>(`/api/v1/materials/${materialId}/actions`)
  return res.data
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/actions.ts
git commit -m "feat(frontend): rewrite actions API client for new schema"
```

---

## Task 4: Reemplazar `api/catalog.ts` y crear `api/materials.ts`

**Files:**
- Rewrite: `frontend/src/api/catalog.ts`
- Create: `frontend/src/api/materials.ts`

**Cambio clave del prefijo:** `/api/v1/catalog/action-types` → `/api/v1/action-types`

- [ ] **Step 1: Reemplazar `api/catalog.ts`**

```typescript
import { apiFetch } from './client'
import type { Role, ActionType, MaterialType, MaterialCategory } from './types'

// ==================== ROLES ====================

export async function listRoles(): Promise<Role[]> {
  const res = await apiFetch<{ data: Role[] }>('/api/v1/roles')
  return res.data
}

// ==================== ACTION TYPES ====================

export async function listActionTypes(): Promise<ActionType[]> {
  const res = await apiFetch<{ data: ActionType[] }>('/api/v1/action-types')
  return res.data
}

export async function createActionType(body: {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
}): Promise<ActionType> {
  const res = await apiFetch<{ data: ActionType }>('/api/v1/action-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateActionType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null; color?: string | null }
): Promise<ActionType> {
  const res = await apiFetch<{ data: ActionType }>(`/api/v1/action-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

// ==================== MATERIAL TYPES ====================

export async function listMaterialTypes(): Promise<MaterialType[]> {
  const res = await apiFetch<{ data: MaterialType[] }>('/api/v1/material-types')
  return res.data
}

export async function createMaterialType(body: {
  code: string
  name: string
  description?: string
  icon?: string
}): Promise<MaterialType> {
  const res = await apiFetch<{ data: MaterialType }>('/api/v1/material-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateMaterialType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null }
): Promise<MaterialType> {
  const res = await apiFetch<{ data: MaterialType }>(`/api/v1/material-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

// ==================== MATERIAL CATEGORIES ====================

export async function listMaterialCategories(materialTypeId: number): Promise<MaterialCategory[]> {
  const res = await apiFetch<{ data: MaterialCategory[] }>(`/api/v1/material-types/${materialTypeId}/categories`)
  return res.data
}

export async function createMaterialCategory(
  materialTypeId: number,
  body: {
    code: string
    name: string
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM'
    unit?: string
    required?: boolean
    sortOrder?: number
    enumValues?: string[]
  }
): Promise<MaterialCategory> {
  const res = await apiFetch<{ data: MaterialCategory }>(`/api/v1/material-types/${materialTypeId}/categories`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateMaterialCategory(
  id: number,
  body: { name?: string; unit?: string | null; required?: boolean; sortOrder?: number }
): Promise<MaterialCategory> {
  const res = await apiFetch<{ data: MaterialCategory }>(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function deleteMaterialCategory(id: number): Promise<void> {
  await apiFetch(`/api/v1/categories/${id}`, { method: 'DELETE' })
}
```

- [ ] **Step 2: Crear `api/materials.ts`**

```typescript
import { apiFetch } from './client'
import type { Material } from './types'

export async function listMaterials(): Promise<Material[]> {
  const res = await apiFetch<{ data: Material[] }>('/api/v1/materials')
  return res.data
}

export async function getMaterial(id: number): Promise<Material> {
  const res = await apiFetch<{ data: Material }>(`/api/v1/materials/${id}`)
  return res.data
}

export async function createMaterial(body: {
  code: string
  name: string
  typeId: number
  attributes?: Record<string, unknown>
  description?: string
  serialNumber?: string
  installedAt?: string
  structureId?: number
  dependencyId?: number
  infrastructureId?: number
}): Promise<Material> {
  const res = await apiFetch<{ data: Material }>('/api/v1/materials', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateMaterial(
  id: number,
  body: { name?: string; description?: string; serialNumber?: string; attributes?: Record<string, unknown> }
): Promise<Material> {
  const res = await apiFetch<{ data: Material }>(`/api/v1/materials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function deleteMaterial(id: number): Promise<void> {
  await apiFetch(`/api/v1/materials/${id}`, { method: 'DELETE' })
}

export async function listMaterialsByInfra(infraId: number): Promise<Material[]> {
  const res = await apiFetch<{ data: Material[] }>(`/api/v1/infrastructures/${infraId}/materials`)
  return res.data
}

export async function listMaterialsByDependency(depId: number): Promise<Material[]> {
  const res = await apiFetch<{ data: Material[] }>(`/api/v1/dependencies/${depId}/materials`)
  return res.data
}

export async function listMaterialsByStructure(structId: number): Promise<Material[]> {
  const res = await apiFetch<{ data: Material[] }>(`/api/v1/structures/${structId}/materials`)
  return res.data
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/catalog.ts frontend/src/api/materials.ts
git commit -m "feat(frontend): rewrite catalog API + add materials API client"
```

---

## Task 5: Actualizar hooks

**Files:**
- Modify: `frontend/src/hooks/useActions.ts`
- Modify: `frontend/src/hooks/useMaterials.ts`
- Modify: `frontend/src/hooks/useCatalog.ts`
- Create: `frontend/src/hooks/useMaterialCatalog.ts`

- [ ] **Step 1: Actualizar `hooks/useActions.ts`**

Reemplazar el contenido completo:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActions, getAction, createAction, updateAction, deleteAction, listMaterialActions
} from '../api/actions'
import type { Action } from '../api/types'

export function useActions() {
  return useQuery({ queryKey: ['actions'], queryFn: listActions })
}

export function useAction(id: number) {
  return useQuery({ queryKey: ['actions', id], queryFn: () => getAction(id) })
}

export function useMaterialActions(materialId: number) {
  return useQuery({
    queryKey: ['materials', materialId, 'actions'],
    queryFn: () => listMaterialActions(materialId),
  })
}

export function useCreateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions'] }),
  })
}

export function useUpdateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAction>[1] }) =>
      updateAction(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions'] }),
  })
}

export function useDeleteAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions'] }),
  })
}
```

- [ ] **Step 2: Actualizar `hooks/useMaterials.ts`**

Reemplazar el contenido completo:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  listMaterialsByInfra, listMaterialsByDependency, listMaterialsByStructure
} from '../api/materials'

export function useMaterials() {
  return useQuery({ queryKey: ['materials'], queryFn: listMaterials })
}

export function useMaterial(id: number) {
  return useQuery({ queryKey: ['materials', id], queryFn: () => getMaterial(id) })
}

export function useMaterialsByInfra(infraId: number) {
  return useQuery({
    queryKey: ['infrastructures', infraId, 'materials'],
    queryFn: () => listMaterialsByInfra(infraId),
  })
}

export function useMaterialsByDependency(depId: number) {
  return useQuery({
    queryKey: ['dependencies', depId, 'materials'],
    queryFn: () => listMaterialsByDependency(depId),
  })
}

export function useMaterialsByStructure(structId: number) {
  return useQuery({
    queryKey: ['structures', structId, 'materials'],
    queryFn: () => listMaterialsByStructure(structId),
  })
}

export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  })
}

export function useUpdateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterial>[1] }) =>
      updateMaterial(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  })
}
```

- [ ] **Step 3: Actualizar `hooks/useCatalog.ts`**

Reemplazar completamente con hooks para ActionType, Roles, InfrastructureType, MaterialType y MaterialCategory (sin estados de acción):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listRoles,
  listActionTypes, createActionType, updateActionType,
  listMaterialTypes, createMaterialType, updateMaterialType,
  listMaterialCategories, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory,
} from '../api/catalog'

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: listRoles })
}

export function useActionTypes() {
  return useQuery({ queryKey: ['action-types'], queryFn: listActionTypes })
}

export function useCreateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActionType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-types'] }),
  })
}

export function useUpdateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateActionType>[1] }) =>
      updateActionType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action-types'] }),
  })
}

export function useMaterialTypes() {
  return useQuery({ queryKey: ['material-types'], queryFn: listMaterialTypes })
}

export function useCreateMaterialType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterialType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-types'] }),
  })
}

export function useUpdateMaterialType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterialType>[1] }) =>
      updateMaterialType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-types'] }),
  })
}

export function useMaterialCategories(materialTypeId: number) {
  return useQuery({
    queryKey: ['material-types', materialTypeId, 'categories'],
    queryFn: () => listMaterialCategories(materialTypeId),
    enabled: materialTypeId > 0,
  })
}

export function useCreateMaterialCategory(materialTypeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createMaterialCategory>[1]) =>
      createMaterialCategory(materialTypeId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['material-types', materialTypeId, 'categories'] }),
  })
}

export function useUpdateMaterialCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterialCategory>[1] }) =>
      updateMaterialCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-types'] }),
  })
}

export function useDeleteMaterialCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterialCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-types'] }),
  })
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd frontend && npx tsc --noEmit
```

Expected: errores en los archivos de páginas que usan hooks/campos del schema antiguo. No deben haber errores en api/ ni hooks/.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat(frontend): update hooks for new schema (actions, materials, catalog)"
```

---

## Task 6: Actualizar páginas de Infraestructura

**Files:**
- Modify: `frontend/src/pages/infrastructures/InfrastructureList.tsx`
- Modify: `frontend/src/pages/infrastructures/InfrastructureForm.tsx`

Los campos `location`, `latitude`, `longitude` ya no existen. Nuevo campo `code` (obligatorio). `infraTypeId` se mantiene (opcional).

- [ ] **Step 1: Actualizar InfrastructureForm**

Localizar el formulario de creación/edición. Reemplazar los campos del formulario:

**Eliminar completamente:**
- Campo `location` (input text)
- Campo `latitude` (input number)
- Campo `longitude` (input number)

**Mantener:**
- Campo `infraTypeId` (select) como opcional
- Hook `useInfrastructureTypes()` y su import

**Añadir antes del campo `name`:**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
  <input
    type="text"
    value={form.code}
    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Ej: HOSP-001"
    required
  />
</div>
```

**Actualizar el estado inicial del form:**
```typescript
const [form, setForm] = useState({
  code: infra?.code ?? '',
  name: infra?.name ?? '',
  description: infra?.description ?? '',
})
```

**Actualizar el submit para enviar `code`:**
```typescript
const body = {
  code: form.code,
  name: form.name,
  description: form.description || undefined,
}
```

- [ ] **Step 2: Actualizar InfrastructureList**

Añadir el campo `code` visible en las cards:
```tsx
// Dentro de cada card de infraestructura, añadir cerca del nombre:
<span className="text-xs text-gray-400 font-mono">{infra.code}</span>
```

Eliminar cualquier referencia a `infra.location`, `infra.latitude`, `infra.longitude`, `infra.infraType`, `infra.infraTypeId`.

- [ ] **Step 3: Actualizar InfrastructureDetail**

Eliminar las secciones de acciones inline (el panel de ActionForm que crea acciones bajo una infra). Añadir una sección de materiales enlazada a la infra:

```tsx
// Importar y usar:
import { useMaterialsByInfra } from '../../hooks/useMaterials'

// En el componente:
const { data: materials = [] } = useMaterialsByInfra(id)

// En el JSX, añadir sección:
<section>
  <h2 className="text-lg font-semibold mb-3">Materiales</h2>
  {materials.length === 0 ? (
    <p className="text-sm text-gray-500">Sin materiales registrados.</p>
  ) : (
    <div className="space-y-2">
      {materials.map(m => (
        <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div>
            <span className="font-mono text-xs text-gray-400 mr-2">{m.code}</span>
            <span className="font-medium text-sm">{m.name}</span>
            <span className="ml-2 text-xs text-gray-500">{m.type.name}</span>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/infrastructures/
git commit -m "feat(frontend): update infrastructure pages for new schema (code field, no location)"
```

---

## Task 7: Actualizar páginas de Acciones

**Files:**
- Modify: `frontend/src/pages/actions/ActionForm.tsx`
- Modify: `frontend/src/pages/actions/ActionsPage.tsx`

El cambio más grande: las acciones ya NO están bajo una infraestructura. Se crean de forma global con `title`, `typeId`, `materialId`.

- [ ] **Step 1: Reemplazar ActionForm**

```tsx
import { useState } from 'react'
import { useCreateAction, useUpdateAction } from '../../hooks/useActions'
import { useActionTypes, useActionStatuses } from '../../hooks/useCatalog'
import { useMaterials } from '../../hooks/useMaterials'
import type { Action } from '../../api/types'

interface Props {
  action?: Action
  onClose: () => void
}

export default function ActionForm({ action, onClose }: Props) {
const { data: actionTypes = [] } = useActionTypes()
const { data: materials = [] } = useMaterials()

  const [form, setForm] = useState({
    title: action?.title ?? '',
    description: action?.description ?? '',
    typeId: action?.typeId ?? 0,
    materialId: action?.materialId ?? 0,
    performedAt: action?.performedAt?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
  })

  const createAction = useCreateAction()
  const updateAction = useUpdateAction()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (action) {
      await updateAction.mutateAsync({
        id: action.id,
        body: {
          title: form.title,
          description: form.description || undefined,
          performedAt: form.performedAt,
        },
      })
    } else {
      await createAction.mutateAsync({
        title: form.title,
        typeId: form.typeId,
        materialId: form.materialId,
        description: form.description || undefined,
        performedAt: form.performedAt,
      })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          required
        />
      </div>

      {!action && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
          <select
            value={form.materialId}
            onChange={e => setForm(f => ({ ...f, materialId: Number(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value={0}>Seleccionar material...</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
          <select
            value={form.typeId}
            onChange={e => setForm(f => ({ ...f, typeId: Number(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required={!action}
            disabled={!!action}
          >
            <option value={0}>Seleccionar tipo...</option>
            {actionTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* No hay estados de acción en el backend actual */}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
        <input
          type="datetime-local"
          value={form.performedAt}
          onChange={e => setForm(f => ({ ...f, performedAt: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createAction.isPending || updateAction.isPending}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {action ? 'Guardar' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Actualizar ActionsPage**

Localizar la tabla de acciones. El backend actual NO incluye `status`. Eliminar/ignorar cualquier columna `status` y mostrar `title`, `type`, `material`, `performedAt`.

```tsx
// NO hay columna Status
```

También actualizar las referencias al campo `description` a `title` donde sea la columna principal.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/actions/
git commit -m "feat(frontend): rewrite ActionForm for new schema (title, typeId, materialId)"
```

---

## Task 8: Actualizar MaterialsPage

**Files:**
- Modify: `frontend/src/pages/materials/MaterialsPage.tsx`

El modelo ha cambiado completamente: antes eran `ActionMaterial` (inline por acción), ahora son `Material` (catálogo pre-existente con typeId y attributes).

- [ ] **Step 1: Reemplazar MaterialsPage**

```tsx
import { useState } from 'react'
import { useMaterials, useDeleteMaterial } from '../../hooks/useMaterials'
import { RoleGuard } from '../../components/RoleGuard'
import type { Material } from '../../api/types'

export default function MaterialsPage() {
  const { data: materials = [], isLoading } = useMaterials()
  const deleteMaterial = useDeleteMaterial()
  const [search, setSearch] = useState('')

  const filtered = materials.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.type.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
      </div>

      <input
        type="search"
        placeholder="Buscar por código, nombre o tipo..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Serie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instalado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No hay materiales registrados.
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.code}</td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-600">{m.type.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.serialNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {m.installedAt ? new Date(m.installedAt).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RoleGuard require="manage">
                        <button
                          onClick={() => deleteMaterial.mutate(m.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      </RoleGuard>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/materials/MaterialsPage.tsx
git commit -m "feat(frontend): rewrite MaterialsPage for new catalog-based material model"
```

---

## Task 9: Actualizar página Admin/Catalog

**Files:**
- Modify: `frontend/src/pages/admin/Catalog.tsx`

Cambios:
1. Eliminar sección "Tipos de Infraestructura" (InfrastructureType ya no existe)
2. Actualizar ActionType (campo `code` ahora obligatorio, eliminar `consumesMaterials`)
3. No hay sección "Estados de Acción" (no existe en Prisma/API actuales)
4. Añadir sección "Tipos de Material" (MaterialType)

- [ ] **Step 1: Actualizar imports del catálogo**

Eliminar todo uso de `useInfrastructureTypes`, `useCreateInfrastructureType`, `useUploadInfraTypeIcon`, `consumesMaterials`.

Añadir:
```typescript
import { useActionStatuses, useCreateActionStatus, useMaterialTypes, useCreateMaterialType } from '../../hooks/useCatalog'
```

- [ ] **Step 2: Actualizar formulario de ActionType**

Eliminar el campo `consumesMaterials` (checkbox) del formulario de creación/edición de ActionType.

Añadir campo `code` (obligatorio):
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
  <input
    type="text"
    value={form.code}
    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
    placeholder="Ej: inspection"
    required
  />
</div>
```

- [ ] **Step 3: Verificar que NO existe sección de estados de acción**

Añadir una nueva sección en el catálogo para gestionar estados de acción:

```tsx
{/* === ACTION STATUSES === */}
<section>
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Estados de Acción</h2>
  <div className="space-y-2 mb-4">
    {actionStatuses.map(s => (
      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          {s.color && (
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
          )}
          <span className="font-medium text-sm">{s.name}</span>
          <span className="text-xs text-gray-400 font-mono">{s.code}</span>
          {s.isTerminal && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Terminal</span>
          )}
        </div>
        <span className="text-xs text-gray-400">Orden: {s.sortOrder}</span>
      </div>
    ))}
  </div>
  <RoleGuard require="manage">
    {/* Formulario de nuevo estado — seguir el mismo patrón de formularios inline existente */}
    <ActionStatusForm />
  </RoleGuard>
</section>
```

El formulario `ActionStatusForm` inline debe capturar: `code`, `name`, `color?`, `isTerminal`, `sortOrder`.

- [ ] **Step 4: Añadir sección MaterialType**

Añadir una sección para gestionar tipos de material:

```tsx
{/* === MATERIAL TYPES === */}
<section>
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Tipos de Material</h2>
  <div className="space-y-2 mb-4">
    {materialTypes.map(mt => (
      <div key={mt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div>
          <span className="font-mono text-xs text-gray-400 mr-2">{mt.code}</span>
          <span className="font-medium text-sm">{mt.name}</span>
        </div>
      </div>
    ))}
  </div>
  <RoleGuard require="manage">
    {/* Formulario inline — captura: code, name, description? */}
    <MaterialTypeForm />
  </RoleGuard>
</section>
```

- [ ] **Step 5: Verificar typecheck y build**

```bash
cd frontend && npx tsc --noEmit
npm run build
```

Expected: sin errores de tipo ni de build.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/Catalog.tsx
git commit -m "feat(frontend): update Catalog page (keep InfraType, add MaterialType)"
```

---

## Task 10: Verificación end-to-end

- [ ] **Step 1: Levantar el stack completo**

```bash
# Desde el worktree feat-new-schema
./dev.sh
```

- [ ] **Step 2: Verificar flujos principales**

1. Login con `admin@example.com / admin1234` → redirige a dashboard
2. Ir a Infraestructuras → ver lista con campo `code`
3. Crear infraestructura → form pide `code` y `name`
4. Ir a Catálogo admin → ver sección ActionType (con `code`), InfrastructureType, MaterialType
5. Ir a Acciones → ver tabla con columna `Estado`
6. Crear acción → form pide `title`, material, tipo, estado
7. Ir a Materiales → ver tabla con `code`, `name`, `tipo`

- [ ] **Step 3: Verificar que los tests backend siguen pasando**

```bash
npm run test:backend
```

Expected: 120 tests pasan.
