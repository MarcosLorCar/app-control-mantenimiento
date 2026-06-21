import { z } from 'zod'

export const CreateInfrastructureTypeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().max(32).nullable().optional(),
})

export const UpdateInfrastructureTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().max(32).nullable().optional(),
})

export type CreateInfrastructureTypeInput = z.infer<typeof CreateInfrastructureTypeSchema>
export type UpdateInfrastructureTypeInput = z.infer<typeof UpdateInfrastructureTypeSchema>

export const UpdateSystemSettingsSchema = z.object({
  default_latitude: z.string().min(1),
  default_longitude: z.string().min(1),
  default_location_name: z.string().min(1),
})

export type UpdateSystemSettingsInput = z.infer<typeof UpdateSystemSettingsSchema>

