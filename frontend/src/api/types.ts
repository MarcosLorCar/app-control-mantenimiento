export interface Infrastructure {
  id: number
  name: string
  description: string | null
  location: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ActionType {
  id: number
  name: string
  description: string | null
  consumesMaterials: boolean
}

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
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Action {
  id: number
  infrastructureId: number
  performedBy: number
  actionTypeId: number
  description: string | null
  performedAt: string
  createdAt: string
}

export interface ActionMaterial {
  id: number
  actionId: number
  name: string
  description: string | null
  unit: string
  quantity: string
  unitCost: string | null
  totalCost: string | null
  supplier: string | null
  notes: string | null
}
