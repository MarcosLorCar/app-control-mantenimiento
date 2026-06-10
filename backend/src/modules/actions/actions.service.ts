import { PrismaClient } from '@prisma/client'
import type { CreateActionInput, UpdateActionInput } from './actions.schema'

const ACTION_INCLUDE = {
  type: { select: { id: true, code: true, name: true, icon: true, color: true } },
  material: { select: { id: true, code: true, name: true, typeId: true } },
  infrastructure: { select: { id: true, code: true, name: true } },
  dependency: { select: { id: true, code: true, name: true } },
  structure: { select: { id: true, code: true, name: true } },
  performer: { select: { id: true, fullName: true, email: true } },
}

export function listActions(
  db: PrismaClient,
  filters?: {
    materialId?: number
    infrastructureId?: number
    dependencyId?: number
    structureId?: number
  }
) {
  return db.action.findMany({
    where: filters,
    include: ACTION_INCLUDE,
    orderBy: { performedAt: 'desc' },
  })
}

export function getAction(db: PrismaClient, id: number) {
  return db.action.findUnique({ where: { id }, include: ACTION_INCLUDE })
}

export function createAction(db: PrismaClient, data: CreateActionInput, performedBy: number) {
  const { performedAt, ...rest } = data
  return db.action.create({
    data: {
      ...rest,
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
