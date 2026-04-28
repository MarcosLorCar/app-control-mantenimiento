import { PrismaClient } from '@prisma/client'

const DEP_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  infrastructureId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}

export function listTopLevelDependencies(db: PrismaClient, infrastructureId: number) {
  return db.dependency.findMany({
    where: { infrastructureId, parentId: null, deletedAt: null },
    select: DEP_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getDependency(db: PrismaClient, id: number) {
  return db.dependency.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...DEP_SELECT,
      children: {
        where: { deletedAt: null },
        select: DEP_SELECT,
      },
      structures: {
        where: { deletedAt: null },
        select: { id: true, code: true, name: true, dependencyId: true, infrastructureId: true },
      },
    },
  })
}

export function createTopLevelDependency(
  db: PrismaClient,
  infrastructureId: number,
  data: { code: string; name: string; description?: string },
) {
  return db.dependency.create({
    data: { ...data, infrastructureId, parentId: null },
    select: DEP_SELECT,
  })
}

export async function createChildDependency(
  db: PrismaClient,
  parentId: number,
  data: { code: string; name: string; description?: string },
) {
  const parent = await db.dependency.findFirst({
    where: { id: parentId, deletedAt: null },
    select: { infrastructureId: true },
  })
  if (!parent) return null
  return db.dependency.create({
    data: { ...data, infrastructureId: parent.infrastructureId, parentId },
    select: DEP_SELECT,
  })
}

export function updateDependency(
  db: PrismaClient,
  id: number,
  data: { name?: string; description?: string },
) {
  return db.dependency.update({ where: { id }, data, select: DEP_SELECT })
}

export function softDeleteDependency(db: PrismaClient, id: number) {
  return db.dependency.update({ where: { id }, data: { deletedAt: new Date() } })
}

export async function listStructuresByInfra(db: PrismaClient, infraId: number) {
  return db.structure.findMany({
    where: { infrastructureId: infraId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  })
}
