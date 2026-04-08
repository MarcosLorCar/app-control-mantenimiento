import { PrismaClient } from '@prisma/client'
import { CreateActionTypeBody } from './catalog.schema'

export async function listRoles(db: PrismaClient) {
  return db.role.findMany({ orderBy: { id: 'asc' } })
}

export async function listActionTypes(db: PrismaClient) {
  return db.actionType.findMany({ orderBy: { name: 'asc' } })
}

export async function createActionType(db: PrismaClient, body: CreateActionTypeBody) {
  const existing = await db.actionType.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Ya existe un tipo de acción con ese nombre' }
  return db.actionType.create({ data: body })
}
