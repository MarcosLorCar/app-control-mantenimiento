import { PrismaClient } from '@prisma/client'
import type { CreateMaterialCategoryInput, UpdateMaterialCategoryInput } from './materials.schema'

const TYPE_SELECT = {
  id: true, code: true, name: true, description: true, icon: true,
  createdAt: true, updatedAt: true, deletedAt: true,
}

const CAT_SELECT = {
  id: true, code: true, name: true, description: true, dataType: true,
  unit: true, required: true, sortOrder: true, enumValues: true, validation: true,
  materialTypeId: true,
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

export function listCategories(db: PrismaClient, materialTypeId: number) {
  return db.materialCategory.findMany({
    where: { materialTypeId },
    select: CAT_SELECT,
    orderBy: { sortOrder: 'asc' },
  })
}

export function createCategory(db: PrismaClient, materialTypeId: number, data: CreateMaterialCategoryInput) {
  return db.materialCategory.create({ data: { ...(data as any), materialTypeId }, select: CAT_SELECT })
}

export function updateCategory(db: PrismaClient, id: number, data: UpdateMaterialCategoryInput) {
  return db.materialCategory.update({ where: { id }, data: data as any, select: CAT_SELECT })
}

export function deleteCategory(db: PrismaClient, id: number) {
  return db.materialCategory.delete({ where: { id } })
}

export async function validateAttributes(
  db: PrismaClient,
  typeId: number,
  attributes: Record<string, unknown>,
): Promise<string[]> {
  const categories = await listCategories(db, typeId)
  const errors: string[] = []

  for (const cat of categories) {
    const value = attributes[cat.code]

    if (cat.required && (value === undefined || value === null)) {
      errors.push(`Atributo requerido: ${cat.code} (${cat.name})`)
      continue
    }
    if (value === undefined || value === null) continue

    if (cat.dataType === 'NUMBER' && typeof value !== 'number') {
      errors.push(`${cat.code}: se esperaba un número`)
    }
    if (cat.dataType === 'BOOLEAN' && typeof value !== 'boolean') {
      errors.push(`${cat.code}: se esperaba un booleano`)
    }
    if ((cat.dataType === 'STRING' || cat.dataType === 'DATE') && typeof value !== 'string') {
      errors.push(`${cat.code}: se esperaba un string`)
    } else if (cat.dataType === 'DATE' && typeof value === 'string' && isNaN(Date.parse(value as string))) {
      errors.push(`${cat.code}: formato de fecha inválido (se esperaba ISO 8601)`)
    }
    if (cat.dataType === 'ENUM' && !cat.enumValues.includes(value as string)) {
      errors.push(`${cat.code}: valor inválido. Opciones: ${cat.enumValues.join(', ')}`)
    }
    const v = cat.validation as Record<string, unknown> | null
    if (v && cat.dataType === 'NUMBER') {
      if (v.min !== undefined && (value as number) < (v.min as number)) {
        errors.push(`${cat.code}: mínimo ${v.min}`)
      }
      if (v.max !== undefined && (value as number) > (v.max as number)) {
        errors.push(`${cat.code}: máximo ${v.max}`)
      }
    }
  }

  return errors
}
