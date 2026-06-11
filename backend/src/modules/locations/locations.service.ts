import { PrismaClient } from '@prisma/client'
import type { CreateLocationInput, UpdateLocationInput } from './locations.schema'

export function listLocations(
  db: PrismaClient,
  filters?: { parentId?: number | null; infraTypeId?: number }
) {
  const whereClause: any = { deletedAt: null }
  
  if (filters) {
    if (filters.parentId !== undefined) {
      whereClause.parentId = filters.parentId
    }
    if (filters.infraTypeId !== undefined) {
      whereClause.infraTypeId = filters.infraTypeId
    }
  }

  return db.location.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          children: true,
          materials: true,
          actions: true,
        },
      },
      infraType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getLocationDetail(db: PrismaClient, id: number) {
  const current = await db.location.findFirst({
    where: { id, deletedAt: null },
    include: {
      children: {
        where: { deletedAt: null },
        include: {
          infraType: { select: { id: true, name: true } },
          _count: {
            select: {
              children: true,
              materials: true,
              actions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      },
      materials: {
        where: { deletedAt: null },
        include: {
          type: { select: { id: true, name: true, code: true } },
        },
        orderBy: { name: 'asc' },
      },
      actions: {
        include: {
          performer: { select: { id: true, fullName: true, email: true } },
          materials: {
            include: {
              material: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { performedAt: 'desc' },
      },
      infraType: true,
    },
  })

  if (!current) return null

  // Fetch all materials in descendants (subfolders)
  const descendantMaterials = await db.material.findMany({
    where: {
      location: {
        path: { startsWith: current.path },
        id: { not: current.id },
        deletedAt: null,
      },
      deletedAt: null,
    },
    include: {
      type: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, path: true } },
    },
    orderBy: { name: 'asc' },
  })

  return {
    ...current,
    descendantMaterials,
  }
}

export async function createLocation(db: PrismaClient, data: CreateLocationInput) {
  const { parentId, ...rest } = data
  let infraTypeId = rest.infraTypeId

  if (parentId && !infraTypeId) {
    const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
    if (parent) {
      infraTypeId = parent.infraTypeId
    }
  }

  if (!infraTypeId) {
    throw new Error('La categoría de infraestructura (infraTypeId) es obligatoria')
  }

  // Create node first to get id
  const location = await db.location.create({
    data: {
      name: rest.name,
      description: rest.description,
      latitude: rest.latitude,
      longitude: rest.longitude,
      parentId,
      infraTypeId,
    },
  })

  // Calculate materialized path
  let path = `/${location.id}/`
  if (parentId) {
    const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
    if (parent) {
      path = `${parent.path}${location.id}/`
    }
  }

  // Update with correct path
  return db.location.update({
    where: { id: location.id },
    data: { path },
    include: { infraType: true },
  })
}

export async function updateLocation(db: PrismaClient, id: number, data: UpdateLocationInput) {
  const current = await db.location.findFirst({ where: { id, deletedAt: null } })
  if (!current) {
    throw new Error('Location not found')
  }

  const { parentId, ...rest } = data
  let newPath = current.path
  let infraTypeId = rest.infraTypeId ?? current.infraTypeId

  // Handle parent change and reparenting cycle prevention
  if (parentId !== undefined && parentId !== current.parentId) {
    if (parentId === id) {
      const err: any = new Error('A location cannot be its own parent')
      err.code = 'CYCLE_ERROR'
      throw err
    }

    let parentPath = '/'
    if (parentId !== null) {
      const newParent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
      if (!newParent) {
        throw new Error('Parent location not found')
      }

      // Check if new parent is a descendant of current node
      if (newParent.path.includes(`/${id}/`)) {
        const err: any = new Error('Circular dependency: parent cannot be a descendant')
        err.code = 'CYCLE_ERROR'
        throw err
      }

      parentPath = newParent.path
      // Inherit parent category when reparenting
      infraTypeId = newParent.infraTypeId
    }

    newPath = `${parentPath}${id}/`

    // Update descendants paths and category
    const descendants = await db.location.findMany({
      where: { path: { startsWith: current.path } },
    })

    for (const desc of descendants) {
      if (desc.id === id) continue
      const relativePart = desc.path.slice(current.path.length)
      const descNewPath = `${newPath}${relativePart}`
      await db.location.update({
        where: { id: desc.id },
        data: { path: descNewPath, infraTypeId },
      })
    }
  }

  return db.location.update({
    where: { id },
    data: {
      name: rest.name,
      description: rest.description,
      latitude: rest.latitude,
      longitude: rest.longitude,
      parentId,
      path: newPath,
      infraTypeId,
    },
    include: { infraType: true },
  })
}

export async function softDeleteLocation(db: PrismaClient, id: number) {
  const current = await db.location.findFirst({ where: { id, deletedAt: null } })
  if (!current) return null

  // Bubble up children
  const children = await db.location.findMany({
    where: { parentId: id, deletedAt: null },
  })

  for (const child of children) {
    // Update child to point to grandparent parentId
    await updateLocation(db, child.id, { parentId: current.parentId })
  }

  // Soft delete node
  return db.location.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
