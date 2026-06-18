import { PrismaClient, Prisma } from '@prisma/client'
import type { CreateLocationInput, UpdateLocationInput } from './locations.schema'

export async function listLocations(
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

  const locations = await db.location.findMany({
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
        },
      },
      actions: {
        select: { performedAt: true },
        take: 1,
        orderBy: { performedAt: 'desc' },
      },
    },
  })

  type CountRow = { locationid: number; count: bigint }
  const [rawCounts, allLocPaths] = await Promise.all([
    db.$queryRaw<CountRow[]>`
      SELECT m."locationId" AS locationid, COUNT(m.id) AS count
      FROM materials m
      JOIN locations l ON m."locationId" = l.id
      WHERE m."deletedAt" IS NULL AND l."deletedAt" IS NULL
      GROUP BY m."locationId"
    `,
    db.location.findMany({ where: { deletedAt: null }, select: { id: true, path: true } }),
  ])

  const pathById = new Map(allLocPaths.map(l => [l.id, l.path]))
  const countByLocationId = new Map(rawCounts.map(r => [Number(r.locationid), Number(r.count)]))

  const mapped = locations.map(loc => {
    const { actions, ...rest } = loc
    let materialsCount = 0
    for (const [locId, cnt] of countByLocationId) {
      const locPath = pathById.get(locId)
      if (locPath && locPath.startsWith(loc.path)) {
        materialsCount += cnt
      }
    }
    return {
      ...rest,
      _count: { ...loc._count, materials: materialsCount },
      lastActionAt: actions[0]?.performedAt ?? null,
    }
  })

  return mapped.sort((a, b) => recencyOf(b) - recencyOf(a))
}

function recencyOf(loc: { lastActionAt?: Date | null; updatedAt: Date }): number {
  return loc.lastActionAt ? new Date(loc.lastActionAt).getTime() : new Date(loc.updatedAt).getTime()
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
      },
      materials: {
        where: { deletedAt: null },
        include: {
          type: { select: { id: true, name: true, code: true, customAttributes: true } },
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
      type: { select: { id: true, name: true, code: true, customAttributes: true } },
      location: { select: { id: true, name: true, path: true } },
    },
    orderBy: { name: 'asc' },
  })

  type CountRow2 = { locationid: number; count: bigint }
  const [childRawCounts, childLocPaths] = await Promise.all([
    db.$queryRaw<CountRow2[]>`
      SELECT m."locationId" AS locationid, COUNT(m.id) AS count
      FROM materials m
      JOIN locations l ON m."locationId" = l.id
      WHERE m."deletedAt" IS NULL AND l."deletedAt" IS NULL
      GROUP BY m."locationId"
    `,
    db.location.findMany({ where: { deletedAt: null }, select: { id: true, path: true } }),
  ])
  const childPathById = new Map(childLocPaths.map(l => [l.id, l.path]))
  const childCountById = new Map(childRawCounts.map(r => [Number(r.locationid), Number(r.count)]))

  const childLastActions = await db.action.groupBy({
    by: ['locationId'],
    where: { locationId: { in: current.children.map(c => c.id) } },
    _max: { performedAt: true },
  })
  const lastActionByChildId = new Map(childLastActions.map(a => [a.locationId, a._max.performedAt]))

  const mappedChildren = current.children
    .map(child => {
      let cnt = 0
      for (const [locId, c] of childCountById) {
        const p = childPathById.get(locId)
        if (p && p.startsWith(child.path)) cnt += c
      }
      return {
        ...child,
        _count: { ...child._count, materials: cnt },
        lastActionAt: lastActionByChildId.get(child.id) ?? null,
      }
    })
    .sort((a, b) => recencyOf(b) - recencyOf(a))

  return {
    ...current,
    children: mappedChildren,
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

  // Fetch parent path before transaction to avoid nested async in $transaction
  let parentPath: string | null = null
  if (parentId) {
    const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
    if (!parent) throw { statusCode: 404, code: 'NOT_FOUND', message: 'La ubicación padre no existe' }
    parentPath = parent.path
  }

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const location = await tx.location.create({
      data: {
        name: rest.name,
        description: rest.description,
        latitude: rest.latitude,
        longitude: rest.longitude,
        placeId: rest.placeId,
        formattedAddress: rest.formattedAddress,
        parentId,
        infraTypeId,
      },
    })

    const path = parentPath ? `${parentPath}${location.id}/` : `/${location.id}/`

    return tx.location.update({
      where: { id: location.id },
      data: { path },
      include: { infraType: true },
    })
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

    // Update descendants paths and category atomically
    const descendants = await db.location.findMany({
      where: { path: { startsWith: current.path } },
    })

    await db.$transaction(
      descendants
        .filter(desc => desc.id !== id)
        .map(desc => {
          const relativePart = desc.path.slice(current.path.length)
          return db.location.update({
            where: { id: desc.id },
            data: { path: `${newPath}${relativePart}`, infraTypeId },
          })
        })
    )
  }

  return db.location.update({
    where: { id },
    data: {
      name: rest.name,
      description: rest.description,
      latitude: rest.latitude,
      longitude: rest.longitude,
      placeId: rest.placeId,
      formattedAddress: rest.formattedAddress,
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
