import { z } from 'zod'

export const CreateLocationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  infraTypeId: z.number().int().positive().nullable().optional(),
})

export const UpdateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  infraTypeId: z.number().int().positive().nullable().optional(),
})

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>
