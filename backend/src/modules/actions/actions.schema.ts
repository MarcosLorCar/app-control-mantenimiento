import { z } from 'zod'

export const CreateActionSchema = z.object({
  actionTypeId: z.number().int().positive(),
  description: z.string().optional(),
  performedAt: z.coerce.date().optional(),
})

export const UpdateActionSchema = CreateActionSchema.partial()

export const CreateMaterialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateMaterialSchema = CreateMaterialSchema.partial()

export type CreateActionBody = z.infer<typeof CreateActionSchema>
export type UpdateActionBody = z.infer<typeof UpdateActionSchema>
export type CreateMaterialBody = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterialBody = z.infer<typeof UpdateMaterialSchema>
