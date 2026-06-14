import { PrismaClient } from '@prisma/client'
import type { CreateFixedPropertyInput } from './materials.schema'

const TYPE_SELECT = {
  id: true, code: true, name: true, description: true, icon: true,
  createdAt: true, updatedAt: true, deletedAt: true,
  customAttributes: true,
  categories: {
    select: { id: true, name: true }
  }
}

export function listMaterialTypes(db: PrismaClient, infraTypeId?: number | null) {
  const whereClause: any = { deletedAt: null }
  if (infraTypeId !== undefined && infraTypeId !== null) {
    whereClause.OR = [
      { categories: { none: {} } },
      { categories: { some: { id: infraTypeId } } }
    ]
  }
  return db.materialType.findMany({ where: whereClause, select: TYPE_SELECT, orderBy: { name: 'asc' } })
}

export function getMaterialType(db: PrismaClient, id: number) {
  return db.materialType.findFirst({ where: { id, deletedAt: null }, select: TYPE_SELECT })
}

export function createMaterialType(db: PrismaClient, data: { code: string; name: string; description?: string; icon?: string; infraTypeId?: number | null; customAttributes?: any }) {
  const { infraTypeId, ...rest } = data
  return db.materialType.create({
    data: {
      ...rest,
      categories: infraTypeId ? {
        connect: { id: infraTypeId }
      } : undefined
    },
    select: TYPE_SELECT
  })
}

export function updateMaterialType(db: PrismaClient, id: number, data: { name?: string; description?: string; icon?: string; customAttributes?: any; categoryIds?: number[] }) {
  const { categoryIds, ...rest } = data
  return db.materialType.update({
    where: { id },
    data: {
      ...rest,
      categories: categoryIds ? {
        set: categoryIds.map(cid => ({ id: cid }))
      } : undefined
    },
    select: TYPE_SELECT
  })
}

export function deleteMaterialType(db: PrismaClient, id: number) {
  return db.materialType.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: TYPE_SELECT
  })
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
