import { FastifyPluginAsync } from 'fastify'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import {
  CreateActionTypeSchema, UpdateActionTypeSchema,
  CreateInfrastructureTypeSchema, UpdateInfrastructureTypeSchema,
} from './catalog.schema'
import {
  listRoles, listActionTypes, createActionType, updateActionType,
  listInfrastructureTypes, createInfrastructureType, updateInfrastructureType,
  setInfrastructureTypeIcon,
} from './catalog.service'

const ALLOWED_MIMES = ['image/png', 'image/svg+xml', 'image/jpeg']

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/roles', { preHandler: fastify.requireManage }, async (_req, reply) => {
    const data = await listRoles(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/action-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listActionTypes(fastify.db)
    return reply.send({ data })
  })

  fastify.post('/action-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createActionType(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/action-types/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateActionType(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.get('/infrastructure-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listInfrastructureTypes(fastify.db)
    return reply.send({ data })
  })

  fastify.post('/infrastructure-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateInfrastructureTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createInfrastructureType(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/infrastructure-types/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateInfrastructureTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateInfrastructureType(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/infrastructure-types/:id/icon', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const infraId = Number(id)

    const existing = await fastify.db.infrastructureType.findUnique({ where: { id: infraId } })
    if (!existing) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' } })

    const fileData = await request.file()
    if (!fileData) return reply.code(400).send({ error: { code: 'NO_FILE', message: 'No se subió ningún archivo' } })

    if (!ALLOWED_MIMES.includes(fileData.mimetype)) {
      fileData.file.resume()
      return reply.code(400).send({ error: { code: 'INVALID_FILE', message: 'Solo se admiten PNG, SVG o JPEG' } })
    }

    // Clean up previous file if it exists
    if (existing.iconUrl) {
      const prevPath = path.join(__dirname, '..', '..', '..', existing.iconUrl)
      await fs.unlink(prevPath).catch(() => {})
    }

    const ext = fileData.mimetype === 'image/svg+xml' ? 'svg' : fileData.mimetype.split('/')[1]
    const filename = `infra-type-${infraId}.${ext}`
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, filename)

    await pipeline(fileData.file, createWriteStream(filePath))

    const data = await setInfrastructureTypeIcon(fastify.db, infraId, `/uploads/${filename}`)
    return reply.send({ data })
  })
}

export default catalogRoutes
