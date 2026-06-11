import { PrismaClient } from '@prisma/client'
import type { CreateMaterialInput, UpdateMaterialInput } from './materials.schema'
import { validateAttributes } from './catalog.service'

const MATERIAL_SELECT = {
  id: true,
  name: true,
  description: true,
  serialNumber: true,
  installedAt: true,
  attributes: true,
  typeId: true,
  type: {
    select: {
      id: true,
      code: true,
      name: true,
      icon: true,
      categories: { select: { code: true, name: true, unit: true } }
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
  const errors = await validateAttributes(db, data.typeId, data.attributes as Record<string, unknown>)
  if (errors.length > 0) {
    const err = Object.assign(new Error('Atributos inválidos'), {
      code: 'INVALID_ATTRIBUTES',
      errors,
    })
    throw err
  }


  const { locationId, installedAt, actionId, ...rest } = data
  return db.material.create({
    data: {
      ...(rest as any),
      locationId,
      installedAt: installedAt ? new Date(installedAt) : undefined,
      actions: actionId ? { connect: { id: actionId } } : undefined,
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
