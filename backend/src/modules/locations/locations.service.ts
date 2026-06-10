import { PrismaClient } from '@prisma/client'
import type { CreateLocationInput, UpdateLocationInput } from './locations.schema'

export function listLocations(db: PrismaClient, parentId: number | null | undefined) {
  // If parentId is explicitly null, list root locations
  const whereClause: any = { deletedAt: null }
  if (parentId === null) {
    whereClause.parentId = null
  } else if (parentId !== undefined) {
    whereClause.parentId = parentId
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

export function getLocationDetail(db: PrismaClient, id: number) {
  return db.location.findFirst({
    where: { id, deletedAt: null },
    include: {
      children: {
        where: { deletedAt: null },
        include: {
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
          type: { select: { id: true, code: true, name: true, icon: true, color: true } },
          performer: { select: { id: true, fullName: true, email: true } },
          material: { select: { id: true, code: true, name: true } },
        },
        orderBy: { performedAt: 'desc' },
      },
      infraType: true,
    },
  })
}

export async function createLocation(db: PrismaClient, data: CreateLocationInput) {
  const { parentId, ...rest } = data

  // Create node first to get id
  const location = await db.location.create({
    data: {
      ...rest,
      parentId,
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
    }

    newPath = `${parentPath}${id}/`

    // Update descendants paths
    const descendants = await db.location.findMany({
      where: { path: { startsWith: current.path } },
    })

    for (const desc of descendants) {
      if (desc.id === id) continue
      const relativePart = desc.path.slice(current.path.length)
      const descNewPath = `${newPath}${relativePart}`
      await db.location.update({
        where: { id: desc.id },
        data: { path: descNewPath },
      })
    }
  }

  return db.location.update({
    where: { id },
    data: {
      ...rest,
      parentId,
      path: newPath,
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
