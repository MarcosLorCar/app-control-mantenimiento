import { z } from 'zod'

export const CreateLocationSchema = z.object({
  code: z.string().min(1).max(50).nullable().optional(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  infraTypeId: z.number().int().positive().nullable().optional(),
})

export const UpdateLocationSchema = z.object({
  code: z.string().min(1).max(50).nullable().optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  infraTypeId: z.number().int().positive().nullable().optional(),
})

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>
