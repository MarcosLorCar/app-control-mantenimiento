export interface InfrastructureType {
  id: number
  name: string
  description: string | null
  iconUrl: string | null
}

export interface Infrastructure {
  id: number
  name: string
  description: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  infraTypeId: number | null
  infraType: InfrastructureType | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ActionType {
  id: number
  name: string
  description: string | null
  consumesMaterials: boolean
  icon: string | null
  color: string | null
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

export interface ActionWithRelations extends Action {
  actionType: Pick<ActionType, 'id' | 'name' | 'consumesMaterials' | 'icon' | 'color'>
  performer: { id: number; fullName: string; email: string }
  materials: ActionMaterial[]
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
