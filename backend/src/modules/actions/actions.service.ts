import { PrismaClient } from '@prisma/client'
import type { CreateActionInput, UpdateActionInput } from './actions.schema'

const ACTION_INCLUDE = {
  type: { select: { id: true, code: true, name: true, icon: true, color: true } },
  materials: {
    select: {
      id: true,
      name: true,
      typeId: true,
      attributes: true,
      type: {
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
          categories: { select: { code: true, name: true, unit: true } }
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
    where.materials = { some: { id: filters.materialId } }
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
  const { performedAt, newLocation, ...rest } = data
  let locationId = rest.locationId

  if (newLocation) {
    const { parentId, ...locRest } = newLocation
    const location = await db.location.create({
      data: {
        ...locRest,
        parentId,
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

  return db.action.create({
    data: {
      ...rest,
      locationId,
      performedBy,
      performedAt: performedAt ? new Date(performedAt) : undefined,
    },
    include: ACTION_INCLUDE,
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
