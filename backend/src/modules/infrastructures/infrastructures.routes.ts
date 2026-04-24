import type { FastifyInstance } from 'fastify'
import { CreateInfrastructureSchema, UpdateInfrastructureSchema } from './infrastructures.schema'
import {
  listInfrastructures,
  getInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  softDeleteInfrastructure,
} from './infrastructures.service'

export async function infrastructuresRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const data = await listInfrastructures(app.db)
    return reply.send({ data })
  })

  app.post('/', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateInfrastructureSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.infrastructure.findFirst({
      where: { code: parsed.data.code, deletedAt: null },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código ya existe' } })
    }
    const data = await createInfrastructure(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.get('/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const data = await getInfrastructure(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Infraestructura no encontrada' } })
    }
    return reply.send({ data })
  })

  app.patch('/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await getInfrastructure(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Infraestructura no encontrada' } })
    }
    const parsed = UpdateInfrastructureSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateInfrastructure(app.db, id, parsed.data)
    return reply.send({ data })
  })

  app.delete('/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await getInfrastructure(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Infraestructura no encontrada' } })
    }
    await softDeleteInfrastructure(app.db, id)
    return reply.status(204).send()
  })
}
