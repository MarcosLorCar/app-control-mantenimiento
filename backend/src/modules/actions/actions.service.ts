import { PrismaClient } from '@prisma/client'
import { CreateActionBody, UpdateActionBody, CreateMaterialBody, UpdateMaterialBody } from './actions.schema'

const ACTION_INCLUDE = {
  actionType: true,
  performer: { select: { id: true, fullName: true, email: true } },
  materials: true,
}

// --- Actions ---

export function listActions(db: PrismaClient, infrastructureId: number) {
  return db.action.findMany({
    where: { infrastructureId },
    include: ACTION_INCLUDE,
    orderBy: { performedAt: 'desc' },
  })
}

export async function getAction(db: PrismaClient, id: number) {
  const action = await db.action.findUnique({ where: { id }, include: ACTION_INCLUDE })
  if (!action) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Acción no encontrada' }
  return action
}

export function createAction(db: PrismaClient, infrastructureId: number, performedBy: number, body: CreateActionBody) {
  return db.action.create({
    data: { infrastructureId, performedBy, ...body },
    include: ACTION_INCLUDE,
  })
}

export async function updateAction(db: PrismaClient, id: number, body: UpdateActionBody) {
  await getAction(db, id)
  return db.action.update({ where: { id }, data: body, include: ACTION_INCLUDE })
}

export async function deleteAction(db: PrismaClient, id: number) {
  await getAction(db, id)
  await db.action.delete({ where: { id } })
}

// --- Materials ---

export function listMaterials(db: PrismaClient, actionId: number) {
  return db.actionMaterial.findMany({ where: { actionId } })
}

export async function getMaterial(db: PrismaClient, id: number) {
  const material = await db.actionMaterial.findUnique({ where: { id } })
  if (!material) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Material no encontrado' }
  return material
}

export function createMaterial(db: PrismaClient, actionId: number, body: CreateMaterialBody) {
  const totalCost = body.unitCost != null ? body.quantity * body.unitCost : null
  return db.actionMaterial.create({ data: { actionId, ...body, totalCost } })
}

export async function updateMaterial(db: PrismaClient, id: number, body: UpdateMaterialBody) {
  const existing = await getMaterial(db, id)
  const quantity = body.quantity ?? Number(existing.quantity)
  const unitCost = body.unitCost !== undefined ? body.unitCost : (existing.unitCost != null ? Number(existing.unitCost) : null)
  const totalCost = unitCost != null ? quantity * unitCost : null
  return db.actionMaterial.update({ where: { id }, data: { ...body, totalCost } })
}

export async function deleteMaterial(db: PrismaClient, id: number) {
  await getMaterial(db, id)
  await db.actionMaterial.delete({ where: { id } })
}

// --- Global listing (cross-infrastructure) ---

export function listAllActions(db: PrismaClient) {
  return db.action.findMany({
    include: {
      actionType: true,
      performer: { select: { id: true, fullName: true, email: true } },
      materials: true,
      infrastructure: { select: { id: true, name: true } },
    },
    orderBy: { performedAt: 'desc' },
  })
}

export function listAllMaterials(db: PrismaClient) {
  return db.actionMaterial.findMany({
    include: {
      action: {
        select: {
          id: true,
          performedAt: true,
          actionType: { select: { name: true } },
          infrastructure: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  })
}
