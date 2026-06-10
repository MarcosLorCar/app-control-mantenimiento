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

export interface InfrastructureType {
  id: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
  deletedAt: string | null
}

export interface Infrastructure {
  id: number
  code: string | null
  name: string
  description: string | null
  infraTypeId: number | null
  infraType: { id: number; name: string; icon: string | null; color: string | null } | null
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
  materialId: number | null
  infrastructureId?: number | null
  dependencyId?: number | null
  structureId?: number | null
  latitude?: number | null
  longitude?: number | null
  performedBy: number
  type: { id: number; code: string; name: string; icon: string | null; color: string | null }
  material: { id: number; code: string | null; name: string; typeId: number } | null
  infrastructure?: { id: number; code: string | null; name: string } | null
  dependency?: { id: number; code: string | null; name: string } | null
  structure?: { id: number; code: string | null; name: string } | null
  performer: { id: number; fullName: string; email: string }
}
