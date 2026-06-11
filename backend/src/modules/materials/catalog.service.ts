import { PrismaClient } from '@prisma/client'
import type { CreateFixedPropertyInput } from './materials.schema'

const TYPE_SELECT = {
  id: true, code: true, name: true, description: true, icon: true,
  createdAt: true, updatedAt: true, deletedAt: true,
}

export function listMaterialTypes(db: PrismaClient) {
  return db.materialType.findMany({ where: { deletedAt: null }, select: TYPE_SELECT, orderBy: { name: 'asc' } })
}

export function getMaterialType(db: PrismaClient, id: number) {
  return db.materialType.findFirst({ where: { id, deletedAt: null }, select: TYPE_SELECT })
}

export function createMaterialType(db: PrismaClient, data: { code: string; name: string; description?: string; icon?: string }) {
  return db.materialType.create({ data, select: TYPE_SELECT })
}

export function updateMaterialType(db: PrismaClient, id: number, data: { name?: string; description?: string; icon?: string }) {
  return db.materialType.update({ where: { id }, data, select: TYPE_SELECT })
}

// Global Fixed Properties
export function listFixedProperties(db: PrismaClient) {
  return db.fixedProperty.findMany({
    orderBy: { name: 'asc' }
  })
}

export function createFixedProperty(db: PrismaClient, data: CreateFixedPropertyInput) {
  return db.fixedProperty.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
    }
  })
}

export function deleteFixedProperty(db: PrismaClient, id: number) {
  return db.fixedProperty.delete({
    where: { id }
  })
}
