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

export const CreateFixedPropertySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  type: z.enum(['STRING', 'DATE', 'NUMBER', 'BOOLEAN']).default('STRING'),
})

export const CreateMaterialSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  installedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  attributes: z.record(z.unknown()).default({}),
  locationId: z.number().int().positive().nullable().optional(),
  actionId: z.number().int().positive().optional(),
})

export const UpdateMaterialSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  attributes: z.record(z.unknown()).optional(),
})

export type CreateMaterialTypeInput = z.infer<typeof CreateMaterialTypeSchema>
export type UpdateMaterialTypeInput = z.infer<typeof UpdateMaterialTypeSchema>
export type CreateFixedPropertyInput = z.infer<typeof CreateFixedPropertySchema>
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>
