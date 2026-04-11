import { z } from 'zod'

export const CreateActionTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  consumesMaterials: z.boolean().default(false),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const UpdateActionTypeSchema = CreateActionTypeSchema.partial()

export const CreateInfrastructureTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const UpdateInfrastructureTypeSchema = CreateInfrastructureTypeSchema.partial()

export type CreateActionTypeBody = z.infer<typeof CreateActionTypeSchema>
export type UpdateActionTypeBody = z.infer<typeof UpdateActionTypeSchema>
export type CreateInfrastructureTypeBody = z.infer<typeof CreateInfrastructureTypeSchema>
export type UpdateInfrastructureTypeBody = z.infer<typeof UpdateInfrastructureTypeSchema>
