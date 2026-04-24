import { PrismaClient } from '@prisma/client'
import type { CreateMaterialInput, UpdateMaterialInput } from './materials.schema'
import { validateAttributes } from './catalog.service'

const MATERIAL_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  serialNumber: true,
  installedAt: true,
  attributes: true,
  typeId: true,
  type: { select: { id: true, code: true, name: true, icon: true } },
  infrastructureId: true,
  dependencyId: true,
  structureId: true,
  createdAt: true,
  updatedAt: true,
}

export function listMaterials(
  db: PrismaClient,
  filters?: { infrastructureId?: number; dependencyId?: number; structureId?: number },
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

  const existing = await db.material.findFirst({
    where: { code: data.code, deletedAt: null },
  })
  if (existing) {
    const err = Object.assign(new Error('Código de material ya existe'), {
      code: 'DUPLICATE_CODE',
    })
    throw err
  }

  const { infrastructureId, dependencyId, structureId, installedAt, ...rest } = data
  return db.material.create({
    data: {
      ...rest,
      infrastructureId: infrastructureId ?? null,
      dependencyId: dependencyId ?? null,
      structureId: structureId ?? null,
      installedAt: installedAt ? new Date(installedAt) : undefined,
    },
    select: MATERIAL_SELECT,
  })
}

export function updateMaterial(db: PrismaClient, id: number, data: UpdateMaterialInput) {
  return db.material.update({ where: { id }, data, select: MATERIAL_SELECT })
}

export function softDeleteMaterial(db: PrismaClient, id: number) {
  return db.material.update({ where: { id }, data: { deletedAt: new Date() } })
}
