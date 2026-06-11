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

export interface Location {
  id: number
  name: string
  description: string | null
  type: string | null
  latitude: number | null
  longitude: number | null
  path: string
  parentId: number | null
  infraTypeId: number | null
  infraType: { id: number; name: string; icon: string | null; color: string | null } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  _count?: {
    children: number
    materials: number
    actions: number
  }
}

export interface LocationDetail extends Location {
  children: Location[]
  materials: Material[]
  actions: Action[]
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
  name: string
  description: string | null
  serialNumber: string | null
  installedAt: string | null
  attributes: Record<string, unknown>
  typeId: number
  type: { id: number; code: string; name: string; icon: string | null; categories?: { code: string; name: string; unit: string | null }[] }
  locationId: number | null
  location: { id: number; name: string; path: string } | null
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
  locationId: number | null
  latitude?: number | null
  longitude?: number | null
  performedBy: number
  type: { id: number; code: string; name: string; icon: string | null; color: string | null }
  materials: {
    id: number
    name: string
    typeId: number
    attributes: Record<string, unknown>
    type: {
      id: number
      code: string
      name: string
      icon: string | null
      categories?: { code: string; name: string; unit: string | null }[]
    }
  }[]
  location: { id: number; name: string; path: string; parentId: number | null; latitude: number | null; longitude: number | null } | null
  performer: { id: number; fullName: string; email: string }
}
