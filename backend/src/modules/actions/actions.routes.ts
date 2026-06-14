import type { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { CreateActionSchema, UpdateActionSchema } from './actions.schema'
import { listActions, getAction, createAction, updateAction, deleteAction } from './actions.service'

export async function actionsRoutes(app: FastifyInstance) {
  // List all actions
  app.get('/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listActions(app.db) })
  })

  // Create action (performedBy comes from JWT)
  app.post('/actions', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateActionSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    try {
      const data = await createAction(app.db, parsed.data, req.user.sub)
      return reply.status(201).send({ data })
    } catch (err: any) {
      if (err.code === 'VALIDATION_ERROR') {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: err.message } })
      }
      throw err
    }
  })

  // Get action detail
  app.get('/actions/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const data = await getAction(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    return reply.send({ data })
  })

  // Update action
  app.patch('/actions/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getAction(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    const parsed = UpdateActionSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateAction(app.db, id, parsed.data)
    return reply.send({ data })
  })

  // Hard-delete action
  app.delete('/actions/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getAction(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    await deleteAction(app.db, id)
    return reply.status(204).send()
  })

  // Actions by material
  app.get('/materials/:materialId/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const materialId = Number((req.params as any).materialId)
    return reply.send({ data: await listActions(app.db, { materialId }) })
  })

  // Actions by location
  app.get('/locations/:locId/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const locationId = Number((req.params as any).locId)
    return reply.send({ data: await listActions(app.db, { locationId }) })
  })

  // Upload photo for action
  app.post('/actions/:id/image', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const action = await app.db.action.findFirst({ where: { id } })
    if (!action) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    if (!action.locationId) {
      return reply.status(400).send({ error: { code: 'NO_LOCATION', message: 'Esta acción no está asociada a ninguna ubicación' } })
    }

    const fileData = await req.file()
    if (!fileData) {
      return reply.status(400).send({ error: { code: 'MISSING_FILE', message: 'No se recibió ningún archivo' } })
    }

    const buffer = await fileData.toBuffer()
    const filename = `action_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`
    const uploadDir = path.join(process.cwd(), 'uploads')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const targetPath = path.join(uploadDir, filename)

    try {
      await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(targetPath)
    } catch (err: any) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_IMAGE',
          message: 'El archivo subido no es una imagen válida o está dañado.'
        }
      })
    }

    const imageUrl = `/uploads/${filename}`

    const photo = await app.db.locationPhoto.create({
      data: {
        url: imageUrl,
        description: `Foto del trabajo: ${action.title}`,
        takenAt: action.performedAt,
        locationId: action.locationId,
        actionId: action.id,
      }
    })

    return reply.status(201).send({ data: photo })
  })
}
