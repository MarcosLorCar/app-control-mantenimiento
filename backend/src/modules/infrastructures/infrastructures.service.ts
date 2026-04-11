import { PrismaClient } from '@prisma/client'
import { CreateInfrastructureBody, UpdateInfrastructureBody } from './infrastructures.schema'

const INFRA_INCLUDE = { infraType: true } as const

export async function listInfrastructures(db: PrismaClient) {
  return db.infrastructure.findMany({ include: INFRA_INCLUDE, orderBy: { createdAt: 'desc' } })
}

export async function getInfrastructure(db: PrismaClient, id: number) {
  const infra = await db.infrastructure.findUnique({ where: { id }, include: INFRA_INCLUDE })
  if (!infra) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Infraestructura no encontrada' }
  return infra
}

export async function createInfrastructure(db: PrismaClient, body: CreateInfrastructureBody) {
  return db.infrastructure.create({ data: body, include: INFRA_INCLUDE })
}

export async function updateInfrastructure(db: PrismaClient, id: number, body: UpdateInfrastructureBody) {
  await getInfrastructure(db, id)
  return db.infrastructure.update({ where: { id }, data: body, include: INFRA_INCLUDE })
}

export async function deleteInfrastructure(db: PrismaClient, id: number) {
  await getInfrastructure(db, id)
  await db.infrastructure.delete({ where: { id } })
}
