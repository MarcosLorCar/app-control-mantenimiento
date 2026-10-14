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
  photos: true,
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

  // Validate materials before any writes
  if (materials && materials.length > 0) {
    const existingIds = materials.map(m => m.materialId).filter((id): id is number => id !== undefined)
    const uniqueIds = new Set(existingIds)
    if (uniqueIds.size !== existingIds.length) {
      throw Object.assign(new Error('El mismo material no puede aparecer más de una vez en la misma acción'), {
        statusCode: 400,
        code: 'DUPLICATE_MATERIAL',
      })
    }
  }

  return db.$transaction(async (tx) => {
    const action = await tx.action.create({
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

    if (materials && materials.length > 0) {
      for (const item of materials) {
        const targetLocationId = item.locationId !== undefined ? item.locationId : locationId

        if (item.operation === 'UNINSTALL') {
          if (!item.materialId) continue

          const existing = await tx.material.findUnique({ where: { id: item.materialId } })
          const snapshot = existing ? {
            name: existing.name,
            description: existing.description,
            attributes: existing.attributes,
          } : null

          await tx.material.update({ where: { id: item.materialId }, data: { locationId: null } })
          await tx.actionMaterial.create({
            data: {
              actionId: action.id,
              materialId: item.materialId,
              operation: 'UNINSTALL',
              snapshot: snapshot ? (snapshot as any) : undefined,
            },
          })
        } else if (item.operation === 'INSTALL') {
          let materialId = item.materialId

          if (materialId) {
            const existing = await tx.material.findUnique({ where: { id: materialId } })
            const snapshot = existing ? {
              name: existing.name,
              description: existing.description,
              attributes: existing.attributes,
            } : null

            await tx.material.update({ where: { id: materialId }, data: { locationId: targetLocationId } })
            await tx.actionMaterial.create({
              data: {
                actionId: action.id,
                materialId,
                operation: 'INSTALL',
                snapshot: snapshot ? (snapshot as any) : undefined,
              },
            })
          } else {
            if (!item.name || !item.typeId) {
              throw Object.assign(new Error('Nombre y tipo son requeridos para nuevos materiales'), {
                code: 'VALIDATION_ERROR',
              })
            }
            const newMat = await tx.material.create({
              data: {
                name: item.name,
                typeId: item.typeId,
                description: item.description,
                attributes: (item.attributes || {}) as any,
                locationId: targetLocationId,
                installedAt: performedAt ? new Date(performedAt) : undefined,
              },
            })
            materialId = newMat.id
            await tx.actionMaterial.create({
              data: { actionId: action.id, materialId, operation: 'INSTALL', snapshot: undefined },
            })
          }
        } else if (item.operation === 'UPDATE') {
          if (!item.materialId) continue

          const existing = await tx.material.findUnique({ where: { id: item.materialId } })
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

          await tx.material.update({ where: { id: item.materialId }, data: updateData })
          await tx.actionMaterial.create({
            data: {
              actionId: action.id,
              materialId: item.materialId,
              operation: 'UPDATE',
              snapshot: snapshot ? (snapshot as any) : undefined,
            },
          })
        }
      }
    }

    return tx.action.findUnique({ where: { id: action.id }, include: ACTION_INCLUDE })
  })
}

export async function updateAction(db: PrismaClient, id: number, data: UpdateActionInput) {
  const { performedAt, materials, ...rest } = data

  return db.$transaction(async (tx) => {
    const existingAction = await tx.action.findUnique({
      where: { id },
      include: {
        materials: {
          include: {
            material: true,
          },
        },
      },
    })

    if (!existingAction) {
      throw Object.assign(new Error('Acción no encontrada'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      })
    }

    const actionLocationId = existingAction.locationId

    // 1. Update text/date fields
    await tx.action.update({
      where: { id },
      data: {
        ...rest,
        performedAt: performedAt ? new Date(performedAt) : undefined,
      },
    })

    // 2. Reconcile materials if provided
    if (materials !== undefined) {
      const existingIds = materials.map(m => m.materialId).filter((matId): matId is number => matId !== undefined)
      const uniqueIds = new Set(existingIds)
      if (uniqueIds.size !== existingIds.length) {
        throw Object.assign(new Error('El mismo material no puede aparecer más de una vez en la misma acción'), {
          statusCode: 400,
          code: 'DUPLICATE_MATERIAL',
        })
      }

      const currentAmMap = new Map(existingAction.materials.map(am => [am.materialId, am]))
      const incomingMatIds = new Set(existingIds)

      // 2a. Reconcile removed materials
      for (const [matId, currentAm] of currentAmMap.entries()) {
        if (!incomingMatIds.has(matId)) {
          if (currentAm.operation === 'UNINSTALL') {
            await tx.material.update({
              where: { id: matId },
              data: { locationId: actionLocationId },
            })
          } else if (currentAm.operation === 'INSTALL') {
            await tx.material.update({
              where: { id: matId },
              data: { locationId: null },
            })
          } else if (currentAm.operation === 'UPDATE' && currentAm.snapshot) {
            const snap = currentAm.snapshot as any
            await tx.material.update({
              where: { id: matId },
              data: {
                name: snap.name,
                description: snap.description,
                attributes: snap.attributes,
              },
            })
          }

          await tx.actionMaterial.delete({
            where: {
              actionId_materialId: {
                actionId: id,
                materialId: matId,
              },
            },
          })
        }
      }

      // 2b. Process incoming materials
      for (const item of materials) {
        const targetLocationId = item.locationId !== undefined ? item.locationId : actionLocationId
        const existingAm = item.materialId ? currentAmMap.get(item.materialId) : undefined

        if (existingAm && item.materialId) {
          const matId = item.materialId

          const updateMatData: any = {}
          if (item.name !== undefined) updateMatData.name = item.name
          if (item.typeId !== undefined) updateMatData.typeId = item.typeId
          if (item.description !== undefined) updateMatData.description = item.description
          if (item.attributes !== undefined) updateMatData.attributes = item.attributes

          if (item.operation === 'UNINSTALL') {
            updateMatData.locationId = null
          } else if (item.operation === 'INSTALL') {
            updateMatData.locationId = targetLocationId
          } else if (item.operation === 'UPDATE') {
            if (item.locationId !== undefined) updateMatData.locationId = item.locationId
          }

          if (Object.keys(updateMatData).length > 0) {
            await tx.material.update({
              where: { id: matId },
              data: updateMatData,
            })
          }

          if (existingAm.operation !== item.operation) {
            await tx.actionMaterial.update({
              where: {
                actionId_materialId: { actionId: id, materialId: matId },
              },
              data: { operation: item.operation },
            })
          }
        } else {
          // New to this action
          if (item.operation === 'UNINSTALL') {
            if (!item.materialId) continue

            const existing = await tx.material.findUnique({ where: { id: item.materialId } })
            const snapshot = existing ? {
              name: existing.name,
              description: existing.description,
              attributes: existing.attributes,
            } : null

            await tx.material.update({ where: { id: item.materialId }, data: { locationId: null } })
            await tx.actionMaterial.create({
              data: {
                actionId: id,
                materialId: item.materialId,
                operation: 'UNINSTALL',
                snapshot: snapshot ? (snapshot as any) : undefined,
              },
            })
          } else if (item.operation === 'INSTALL') {
            let materialId = item.materialId

            if (materialId) {
              const existing = await tx.material.findUnique({ where: { id: materialId } })
              const snapshot = existing ? {
                name: existing.name,
                description: existing.description,
                attributes: existing.attributes,
              } : null

              await tx.material.update({ where: { id: materialId }, data: { locationId: targetLocationId } })
              await tx.actionMaterial.create({
                data: {
                  actionId: id,
                  materialId,
                  operation: 'INSTALL',
                  snapshot: snapshot ? (snapshot as any) : undefined,
                },
              })
            } else {
              if (!item.name || !item.typeId) {
                throw Object.assign(new Error('Nombre y tipo son requeridos para nuevos materiales'), {
                  code: 'VALIDATION_ERROR',
                })
              }
              const newMat = await tx.material.create({
                data: {
                  name: item.name,
                  typeId: item.typeId,
                  description: item.description,
                  attributes: (item.attributes || {}) as any,
                  locationId: targetLocationId,
                  installedAt: performedAt ? new Date(performedAt) : existingAction.performedAt,
                },
              })
              materialId = newMat.id
              await tx.actionMaterial.create({
                data: { actionId: id, materialId, operation: 'INSTALL', snapshot: undefined },
              })
            }
          } else if (item.operation === 'UPDATE') {
            if (!item.materialId) continue

            const existing = await tx.material.findUnique({ where: { id: item.materialId } })
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

            await tx.material.update({ where: { id: item.materialId }, data: updateData })
            await tx.actionMaterial.create({
              data: {
                actionId: id,
                materialId: item.materialId,
                operation: 'UPDATE',
                snapshot: snapshot ? (snapshot as any) : undefined,
              },
            })
          }
        }
      }
    }

    return tx.action.findUnique({ where: { id }, include: ACTION_INCLUDE })
  })
}

export function deleteAction(db: PrismaClient, id: number) {
  return db.action.delete({ where: { id } })
}
