import { z } from 'zod'

export const CreateInfrastructureTypeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const UpdateInfrastructureTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export type CreateInfrastructureTypeInput = z.infer<typeof CreateInfrastructureTypeSchema>
export type UpdateInfrastructureTypeInput = z.infer<typeof UpdateInfrastructureTypeSchema>
