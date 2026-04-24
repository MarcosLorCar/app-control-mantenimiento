import { PrismaClient } from '@prisma/client'
import type { CreateInfrastructureInput, UpdateInfrastructureInput } from './infrastructures.schema'

const INFRA_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}

export function listInfrastructures(db: PrismaClient) {
  return db.infrastructure.findMany({
    where: { deletedAt: null },
    select: INFRA_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getInfrastructure(db: PrismaClient, id: number) {
  return db.infrastructure.findFirst({
    where: { id, deletedAt: null },
    select: INFRA_SELECT,
  })
}

export function createInfrastructure(db: PrismaClient, data: CreateInfrastructureInput) {
  return db.infrastructure.create({ data, select: INFRA_SELECT })
}

export function updateInfrastructure(db: PrismaClient, id: number, data: UpdateInfrastructureInput) {
  return db.infrastructure.update({ where: { id }, data, select: INFRA_SELECT })
}

export function softDeleteInfrastructure(db: PrismaClient, id: number) {
  return db.infrastructure.update({ where: { id }, data: { deletedAt: new Date() } })
}
