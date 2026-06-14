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
  latitude: number | null
  longitude: number | null
  image: string | null
  path: string
  parentId: number | null
  infraTypeId: number
  infraType: { id: number; name: string; icon: string | null; color: string | null }
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
  descendantMaterials: Material[]
}

// ==================== MATERIAL CATALOG ====================

export interface FixedProperty {
  id: number
  code: string
  name: string
  type: 'STRING' | 'DATE' | 'NUMBER' | 'BOOLEAN'
}

export interface MaterialType {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  categories: { id: number; name: string }[]
  customAttributes?: any
}

export interface Material {
  id: number
  name: string
  description: string | null
  installedAt: string | null
  attributes: Record<string, any>
  typeId: number
  type: {
    id: number
    code: string
    name: string
    icon: string | null
    customAttributes?: any
  }
  locationId: number | null
  location: { id: number; name: string; path: string } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// ==================== ACTIONS ====================

export interface Action {
  id: number
  title: string
  description: string | null
  performedAt: string
  createdAt: string
  updatedAt: string
  locationId: number | null
  latitude?: number | null
  longitude?: number | null
  performedBy: number
  materials: {
    actionId: number
    materialId: number
    operation: 'INSTALL' | 'UNINSTALL' | 'UPDATE'
    material: Material
    snapshot?: any
  }[]
  location: { id: number; name: string; path: string; parentId: number | null; latitude: number | null; longitude: number | null } | null
  performer: { id: number; fullName: string; email: string }
}
