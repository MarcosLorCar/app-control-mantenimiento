import { PrismaClient } from '@prisma/client'
import {
  CreateActionTypeBody, UpdateActionTypeBody,
  CreateInfrastructureTypeBody, UpdateInfrastructureTypeBody,
} from './catalog.schema'

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

export async function updateActionType(db: PrismaClient, id: number, body: UpdateActionTypeBody) {
  const existing = await db.actionType.findUnique({ where: { id } })
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tipo de acción no encontrado' }
  return db.actionType.update({ where: { id }, data: body })
}

export function listInfrastructureTypes(db: PrismaClient) {
  return db.infrastructureType.findMany({ orderBy: { name: 'asc' } })
}

export async function createInfrastructureType(db: PrismaClient, body: CreateInfrastructureTypeBody) {
  const existing = await db.infrastructureType.findUnique({ where: { name: body.name } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'Ya existe un tipo con ese nombre' }
  return db.infrastructureType.create({ data: body })
}

export async function updateInfrastructureType(db: PrismaClient, id: number, body: UpdateInfrastructureTypeBody) {
  const existing = await db.infrastructureType.findUnique({ where: { id } })
  if (!existing) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' }
  return db.infrastructureType.update({ where: { id }, data: body })
}

export async function setInfrastructureTypeIcon(db: PrismaClient, id: number, iconUrl: string) {
  return db.infrastructureType.update({ where: { id }, data: { iconUrl } })
}
