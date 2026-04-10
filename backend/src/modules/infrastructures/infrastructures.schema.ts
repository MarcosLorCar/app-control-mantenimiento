import { z } from 'zod'

export const CreateInfrastructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  infraTypeId: z.number().int().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const UpdateInfrastructureSchema = CreateInfrastructureSchema.partial()

export type CreateInfrastructureBody = z.infer<typeof CreateInfrastructureSchema>
export type UpdateInfrastructureBody = z.infer<typeof UpdateInfrastructureSchema>
