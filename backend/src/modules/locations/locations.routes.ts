import type { FastifyInstance } from 'fastify'
import { CreateLocationSchema, UpdateLocationSchema } from './locations.schema'
import {
  listLocations,
  getLocationDetail,
  createLocation,
  updateLocation,
  softDeleteLocation,
} from './locations.service'

export async function locationsRoutes(app: FastifyInstance) {
  // List locations
  app.get('/', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const query = req.query as { parentId?: string }
    let parentId: number | null | undefined = undefined

    if (query.parentId === 'null') {
      parentId = null
    } else if (query.parentId !== undefined) {
      parentId = Number(query.parentId)
    }

    const data = await listLocations(app.db, parentId)
    return reply.send({ data })
  })

  // Create location
  app.post('/', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }

    if (parsed.data.code) {
      const existing = await app.db.location.findFirst({
        where: { code: parsed.data.code, deletedAt: null },
      })
      if (existing) {
        return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código ya existe' } })
      }
    }

    const data = await createLocation(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  // Get location details
  app.get('/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const data = await getLocationDetail(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }
    return reply.send({ data })
  })

  // Update location
  app.patch('/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    const parsed = UpdateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }

    if (parsed.data.code && parsed.data.code !== existing.code) {
      const duplicate = await app.db.location.findFirst({
        where: { code: parsed.data.code, deletedAt: null, id: { not: id } },
      })
      if (duplicate) {
        return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código ya existe' } })
      }
    }

    try {
      const data = await updateLocation(app.db, id, parsed.data)
      return reply.send({ data })
    } catch (err: any) {
      if (err.code === 'CYCLE_ERROR') {
        return reply.status(400).send({ error: { code: 'CYCLE_ERROR', message: err.message } })
      }
      throw err
    }
  })

  // Delete location (soft delete with bubble-up)
  app.delete('/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    await softDeleteLocation(app.db, id)
    return reply.status(204).send()
  })
}
