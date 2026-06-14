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
              icon: true,
              customAttributes: true
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

  // Validate that locationId points to a root location (parentId === null)
  if (locationId) {
    const loc = await db.location.findFirst({ where: { id: locationId, deletedAt: null } })
    if (loc && loc.parentId !== null) {
      throw Object.assign(new Error('Los trabajos solo pueden registrarse en ubicaciones raíz (infraestructuras principales)'), {
        code: 'VALIDATION_ERROR',
        statusCode: 400
      })
    }
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
      const targetLocationId = item.locationId !== undefined ? item.locationId : locationId

      if (item.operation === 'INSTALL' && targetLocationId) {
        const loc = await db.location.findFirst({ where: { id: targetLocationId, deletedAt: null } })
        if (loc && loc.parentId === null) {
          throw Object.assign(new Error('No se pueden instalar materiales directamente en una ubicación raíz.'), {
            code: 'VALIDATION_ERROR'
          })
        }
      }

      if (item.operation === 'UNINSTALL') {
        if (!item.materialId) continue
        
        const existing = await db.material.findUnique({ where: { id: item.materialId } })
        const snapshot = existing ? {
          name: existing.name,
          description: existing.description,
          attributes: existing.attributes,
        } : null

        // Remove location pointer (retains data but no longer "physically" installed)
        await db.material.update({
          where: { id: item.materialId },
          data: { locationId: null }
        })

        await db.actionMaterial.create({
          data: {
            actionId: action.id,
            materialId: item.materialId,
            operation: 'UNINSTALL',
            snapshot: snapshot ? (snapshot as any) : undefined
          }
        })
      } else if (item.operation === 'INSTALL') {
        let materialId = item.materialId

        if (materialId) {
          // If installing existing material
          const existing = await db.material.findUnique({ where: { id: materialId } })
          const snapshot = existing ? {
            name: existing.name,
            description: existing.description,
            attributes: existing.attributes,
          } : null

          await db.material.update({
            where: { id: materialId },
            data: { locationId: targetLocationId }
          })

          await db.actionMaterial.create({
            data: {
              actionId: action.id,
              materialId: materialId,
              operation: 'INSTALL',
              snapshot: snapshot ? (snapshot as any) : undefined
            }
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
              locationId: targetLocationId,
              installedAt: performedAt ? new Date(performedAt) : undefined,
            }
          })
          materialId = newMat.id

          await db.actionMaterial.create({
            data: {
              actionId: action.id,
              materialId: materialId,
              operation: 'INSTALL',
              snapshot: undefined
            }
          })
        }
      } else if (item.operation === 'UPDATE') {
        if (!item.materialId) continue

        const existing = await db.material.findUnique({ where: { id: item.materialId } })
        const snapshot = existing ? {
          name: existing.name,
          description: existing.description,
          attributes: existing.attributes,
        } : null

        const updateData: any = {}
        if (item.name !== undefined) updateData.name = item.name
        if (item.typeId !== undefined) updateData.typeId = item.typeId
        if (item.description !== undefined) updateData.description = item.description
        if (item.attributes !== undefined) updateData.attributes = item.attributes
        if (item.locationId !== undefined) updateData.locationId = item.locationId

        await db.material.update({
          where: { id: item.materialId },
          data: updateData
        })

        await db.actionMaterial.create({
          data: {
            actionId: action.id,
            materialId: item.materialId,
            operation: 'UPDATE',
            snapshot: snapshot ? (snapshot as any) : undefined
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
