import { z } from 'zod'

export const CreateActionTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  consumesMaterials: z.boolean().default(false),
})

export type CreateActionTypeBody = z.infer<typeof CreateActionTypeSchema>
