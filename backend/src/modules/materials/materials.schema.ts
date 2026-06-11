import { z } from 'zod'

export const CreateMaterialTypeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
})

export const UpdateMaterialTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
})

export const CreateMaterialCategorySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'ENUM']),
  unit: z.string().optional(),
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  enumValues: z.array(z.string()).default([]),
  validation: z.record(z.unknown()).optional(),
})

export const UpdateMaterialCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  enumValues: z.array(z.string()).optional(),
  validation: z.record(z.unknown()).optional(),
})

export const CreateMaterialSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  installedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  attributes: z.record(z.unknown()).default({}),
  locationId: z.number().int().positive(),
  actionId: z.number().int().positive().optional(),
})

export const UpdateMaterialSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
})

export type CreateMaterialTypeInput = z.infer<typeof CreateMaterialTypeSchema>
export type UpdateMaterialTypeInput = z.infer<typeof UpdateMaterialTypeSchema>
export type CreateMaterialCategoryInput = z.infer<typeof CreateMaterialCategorySchema>
export type UpdateMaterialCategoryInput = z.infer<typeof UpdateMaterialCategorySchema>
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>
