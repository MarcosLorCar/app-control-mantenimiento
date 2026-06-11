import { PrismaClient } from '@prisma/client'
import type { CreateActionInput, UpdateActionInput } from './actions.schema'

const ACTION_INCLUDE = {
  materials: {
    include: {
      material: {
        include: {
          type: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true
            }
          }
        }
      }
    }
  },
  location: { select: { id: true, name: true, path: true, parentId: true, latitude: true, longitude: true } },
  performer: { select: { id: true, fullName: true, email: true } },
}

export function listActions(
  db: PrismaClient,
  filters?: {
    materialId?: number
    locationId?: number
  }
) {
  const where: any = {}
  if (filters?.locationId) {
    where.locationId = filters.locationId
  }
  if (filters?.materialId) {
    where.materials = { some: { materialId: filters.materialId } }
  }
  return db.action.findMany({
    where,
    include: ACTION_INCLUDE,
    orderBy: { performedAt: 'desc' },
  })
}

export function getAction(db: PrismaClient, id: number) {
  return db.action.findUnique({ where: { id }, include: ACTION_INCLUDE })
}

export async function createAction(db: PrismaClient, data: CreateActionInput, performedBy: number) {
  const { performedAt, newLocation, materials, ...rest } = data
  let locationId = rest.locationId

  if (newLocation) {
    const { parentId, ...locRest } = newLocation
    let infraTypeId = locRest.infraTypeId

    // Inherit infraTypeId from parent if not provided
    if (parentId && !infraTypeId) {
      const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
      if (parent) {
        infraTypeId = parent.infraTypeId
      }
    }

    if (!infraTypeId) {
      throw Object.assign(new Error('La categoría de infraestructura es obligatoria para ubicaciones raíz'), {
        code: 'VALIDATION_ERROR'
      })
    }

    const location = await db.location.create({
      data: {
        name: locRest.name,
        latitude: locRest.latitude,
        longitude: locRest.longitude,
        parentId,
        infraTypeId,
      },
    })

    // Calculate path
    let path = `/${location.id}/`
    if (parentId) {
      const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
      if (parent) {
        path = `${parent.path}${location.id}/`
      }
    }

    const updatedLoc = await db.location.update({
      where: { id: location.id },
      data: { path },
    })

    locationId = updatedLoc.id
  }

  // Create primary action record
  const action = await db.action.create({
    data: {
      title: rest.title,
      description: rest.description,
      locationId,
      performedBy,
      performedAt: performedAt ? new Date(performedAt) : undefined,
      latitude: rest.latitude,
      longitude: rest.longitude,
    },
  })

  // Handle material operations
  if (materials && materials.length > 0) {
    for (const item of materials) {
      if (item.operation === 'UNINSTALL') {
        if (!item.materialId) continue
        
        // Remove location pointer (retains data but no longer "physically" installed)
        await db.material.update({
          where: { id: item.materialId },
          data: { locationId: null }
        })

        await db.actionMaterial.create({
          data: {
            actionId: action.id,
            materialId: item.materialId,
            operation: 'UNINSTALL'
          }
        })
      } else if (item.operation === 'INSTALL') {
        let materialId = item.materialId

        if (materialId) {
          // If installing existing material
          await db.material.update({
            where: { id: materialId },
            data: { locationId }
          })
        } else {
          // If creating and installing new material
          if (!item.name || !item.typeId) {
            throw Object.assign(new Error('Nombre y tipo son requeridos para nuevos materiales'), {
              code: 'VALIDATION_ERROR'
            })
          }
          const newMat = await db.material.create({
            data: {
              name: item.name,
              typeId: item.typeId,
              description: item.description,
              attributes: (item.attributes || {}) as any,
              locationId,
              installedAt: performedAt ? new Date(performedAt) : undefined,
            }
          })
          materialId = newMat.id
        }

        await db.actionMaterial.create({
          data: {
            actionId: action.id,
            materialId: materialId,
            operation: 'INSTALL'
          }
        })
      }
    }
  }

  return db.action.findUnique({
    where: { id: action.id },
    include: ACTION_INCLUDE
  })
}

export function updateAction(db: PrismaClient, id: number, data: UpdateActionInput) {
  const { performedAt, ...rest } = data
  return db.action.update({
    where: { id },
    data: { ...rest, performedAt: performedAt ? new Date(performedAt) : undefined },
    include: ACTION_INCLUDE,
  })
}

export function deleteAction(db: PrismaClient, id: number) {
  return db.action.delete({ where: { id } })
}
