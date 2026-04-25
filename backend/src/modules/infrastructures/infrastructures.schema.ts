import { z } from 'zod'

export const CreateInfrastructureSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  infraTypeId: z.number().int().positive().optional(),
})

export const UpdateInfrastructureSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  infraTypeId: z.number().int().positive().nullable().optional(),
})

export type CreateInfrastructureInput = z.infer<typeof CreateInfrastructureSchema>
export type UpdateInfrastructureInput = z.infer<typeof UpdateInfrastructureSchema>
