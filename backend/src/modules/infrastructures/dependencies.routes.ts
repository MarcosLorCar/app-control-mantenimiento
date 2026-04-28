import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  listTopLevelDependencies,
  getDependency,
  createTopLevelDependency,
  createChildDependency,
  updateDependency,
  softDeleteDependency,
  listStructuresByInfra,
} from './dependencies.service'

const CreateDepSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

const CreateStructureSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

const UpdateDepSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
})

const STRUCTURE_SELECT = {
  id: true, code: true, name: true, description: true,
  infrastructureId: true, dependencyId: true,
  createdAt: true, updatedAt: true,
}

export async function dependenciesRoutes(app: FastifyInstance) {
  // List top-level dependencies of an infrastructure
  app.get('/infrastructures/:infraId/dependencies', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const infraId = Number((req.params as any).infraId)
    const data = await listTopLevelDependencies(app.db, infraId)
    return reply.send({ data })
  })

  // Create top-level dependency under infrastructure
  app.post('/infrastructures/:infraId/dependencies', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const infraId = Number((req.params as any).infraId)
    const parsed = CreateDepSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await createTopLevelDependency(app.db, infraId, parsed.data)
    return reply.status(201).send({ data })
  })

  // List structures under infrastructure
  app.get('/infrastructures/:infraId/structures', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const infraId = Number((req.params as any).infraId)
    const structures = await listStructuresByInfra(app.db, infraId)
    return reply.send({ data: structures })
  })

  // Create structure directly under infrastructure
  app.post('/infrastructures/:infraId/structures', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const infrastructureId = Number((req.params as any).infraId)
    const parsed = CreateStructureSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const infra = await app.db.infrastructure.findFirst({ where: { id: infrastructureId, deletedAt: null } })
    if (!infra) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Infraestructura no encontrada' } })
    }
    const data = await app.db.structure.create({
      data: { ...parsed.data, infrastructureId, dependencyId: null },
      select: STRUCTURE_SELECT,
    })
    return reply.status(201).send({ data })
  })

  // Get dependency detail (with children and structures)
  app.get('/dependencies/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const data = await getDependency(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependencia no encontrada' } })
    }
    return reply.send({ data })
  })

  // Create child dependency
  app.post('/dependencies/:id/children', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parentId = Number((req.params as any).id)
    const parsed = CreateDepSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await createChildDependency(app.db, parentId, parsed.data)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependencia padre no encontrada' } })
    }
    return reply.status(201).send({ data })
  })

  // Create structure under dependency
  app.post('/dependencies/:depId/structures', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const dependencyId = Number((req.params as any).depId)
    const parsed = CreateStructureSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const dep = await getDependency(app.db, dependencyId)
    if (!dep) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependencia no encontrada' } })
    }
    const data = await app.db.structure.create({
      data: { ...parsed.data, dependencyId, infrastructureId: null },
      select: STRUCTURE_SELECT,
    })
    return reply.status(201).send({ data })
  })

  // Update dependency
  app.patch('/dependencies/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getDependency(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependencia no encontrada' } })
    }
    const parsed = UpdateDepSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateDependency(app.db, id, parsed.data)
    return reply.send({ data })
  })

  // Soft-delete dependency
  app.delete('/dependencies/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getDependency(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dependencia no encontrada' } })
    }
    await softDeleteDependency(app.db, id)
    return reply.status(204).send()
  })

  // Get structure detail
  app.get('/structures/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const data = await app.db.structure.findFirst({
      where: { id, deletedAt: null },
      select: STRUCTURE_SELECT,
    })
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estructura no encontrada' } })
    }
    return reply.send({ data })
  })

  // Update structure
  app.patch('/structures/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const parsed = z.object({ name: z.string().min(1).optional(), description: z.string().optional() }).safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.structure.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estructura no encontrada' } })
    }
    const data = await app.db.structure.update({
      where: { id },
      data: parsed.data,
      select: STRUCTURE_SELECT,
    })
    return reply.send({ data })
  })

  // Soft-delete structure
  app.delete('/structures/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.structure.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estructura no encontrada' } })
    }
    await app.db.structure.update({ where: { id }, data: { deletedAt: new Date() } })
    return reply.status(204).send()
  })
}
