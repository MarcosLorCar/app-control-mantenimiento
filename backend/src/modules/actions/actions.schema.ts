import { z } from 'zod'

export const CreateActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  statusId: z.number().int().positive(),
  materialId: z.number().int().positive(),
})

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
  statusId: z.number().int().positive().optional(),
})

export type CreateActionInput = z.infer<typeof CreateActionSchema>
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>
