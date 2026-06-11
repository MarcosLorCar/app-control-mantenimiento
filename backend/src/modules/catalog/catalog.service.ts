import { PrismaClient } from '@prisma/client'
import type {
  CreateInfrastructureTypeInput, UpdateInfrastructureTypeInput,
} from './catalog.schema'

const INFRA_TYPE_SELECT = {
  id: true, name: true, description: true, icon: true, color: true, deletedAt: true,
}

export function listInfrastructureTypes(db: PrismaClient) {
  return db.infrastructureType.findMany({
    where: { deletedAt: null },
    select: INFRA_TYPE_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getInfrastructureType(db: PrismaClient, id: number) {
  return db.infrastructureType.findFirst({ where: { id, deletedAt: null }, select: INFRA_TYPE_SELECT })
}

export function createInfrastructureType(db: PrismaClient, data: CreateInfrastructureTypeInput) {
  return db.infrastructureType.create({ data, select: INFRA_TYPE_SELECT })
}

export function updateInfrastructureType(db: PrismaClient, id: number, data: UpdateInfrastructureTypeInput) {
  return db.infrastructureType.update({ where: { id }, data, select: INFRA_TYPE_SELECT })
}

export function softDeleteInfrastructureType(db: PrismaClient, id: number) {
  return db.infrastructureType.update({ where: { id }, data: { deletedAt: new Date() } })
}

export function listRoles(db: PrismaClient) {
  return db.role.findMany({ orderBy: { name: 'asc' } })
}
