import type { FastifyInstance } from 'fastify'
import {
  CreateMaterialTypeSchema, UpdateMaterialTypeSchema,
  CreateMaterialCategorySchema, UpdateMaterialCategorySchema,
} from './materials.schema'
import {
  listMaterialTypes, createMaterialType, updateMaterialType,
  listCategories, createCategory, updateCategory, deleteCategory,
} from './catalog.service'

export async function materialCatalogRoutes(app: FastifyInstance) {
  app.get('/material-types', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listMaterialTypes(app.db) })
  })

  app.post('/material-types', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = CreateMaterialTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.materialType.findFirst({
      where: { code: parsed.data.code, deletedAt: null },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de tipo ya existe' } })
    }
    const data = await createMaterialType(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/material-types/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.materialType.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de material no encontrado' } })
    }
    const parsed = UpdateMaterialTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateMaterialType(app.db, id, parsed.data)
    return reply.send({ data })
  })

  app.get('/material-types/:id/categories', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const type = await app.db.materialType.findFirst({ where: { id, deletedAt: null } })
    if (!type) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de material no encontrado' } })
    }
    return reply.send({ data: await listCategories(app.db, id) })
  })

  app.post('/material-types/:id/categories', { preHandler: [app.requireManage] }, async (req, reply) => {
    const materialTypeId = Number((req.params as any).id)
    const parsed = CreateMaterialCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.materialCategory.findUnique({
      where: { materialTypeId_code: { materialTypeId, code: parsed.data.code } },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de categoría ya existe en este tipo' } })
    }
    const data = await createCategory(app.db, materialTypeId, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/categories/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.materialCategory.findUnique({ where: { id } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Categoría no encontrada' } })
    }
    const parsed = UpdateMaterialCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateCategory(app.db, id, parsed.data)
    return reply.send({ data })
  })

  app.delete('/categories/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.materialCategory.findUnique({ where: { id } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Categoría no encontrada' } })
    }
    await deleteCategory(app.db, id)
    return reply.status(204).send()
  })
}
