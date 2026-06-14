import { PrismaClient } from '@prisma/client'
import type { CreateMaterialInput, UpdateMaterialInput } from './materials.schema'

const MATERIAL_SELECT = {
  id: true,
  name: true,
  description: true,
  installedAt: true,
  attributes: true,
  typeId: true,
  type: {
    select: {
      id: true,
      code: true,
      name: true,
      icon: true,
      customAttributes: true
    }
  },
  locationId: true,
  location: { select: { id: true, name: true, path: true } },
  createdAt: true,
  updatedAt: true,
}

export function listMaterials(
  db: PrismaClient,
  filters?: { locationId?: number },
) {
  return db.material.findMany({
    where: { deletedAt: null, ...filters },
    select: MATERIAL_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getMaterial(db: PrismaClient, id: number) {
  return db.material.findFirst({
    where: { id, deletedAt: null },
    select: MATERIAL_SELECT,
  })
}

export async function createMaterial(db: PrismaClient, data: CreateMaterialInput) {
  const { locationId, installedAt, actionId, ...rest } = data
  return db.material.create({
    data: {
      name: rest.name,
      description: rest.description,
      attributes: (rest.attributes || {}) as any,
      typeId: rest.typeId,
      locationId,
      installedAt: installedAt ? new Date(installedAt) : undefined,
      actions: actionId ? {
        create: {
          actionId: actionId,
          operation: 'INSTALL'
        }
      } : undefined,
    },
    select: MATERIAL_SELECT,
  })
}

export function updateMaterial(db: PrismaClient, id: number, data: UpdateMaterialInput) {
  return db.material.update({ where: { id, deletedAt: null }, data: data as any, select: MATERIAL_SELECT })
}

export function softDeleteMaterial(db: PrismaClient, id: number) {
  return db.material.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } })
}
