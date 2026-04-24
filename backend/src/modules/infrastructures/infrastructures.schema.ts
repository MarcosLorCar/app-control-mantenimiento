import { z } from 'zod'

export const CreateInfrastructureSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export const UpdateInfrastructureSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
})

export type CreateInfrastructureInput = z.infer<typeof CreateInfrastructureSchema>
export type UpdateInfrastructureInput = z.infer<typeof UpdateInfrastructureSchema>
