import { z } from 'zod'

export const CreateActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  materialId: z.number().int().positive().optional(),
  locationId: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).refine(data => {
  const count = [
    data.materialId,
    data.locationId
  ].filter(id => id !== undefined && id !== null).length
  return count === 1;
}, {
  message: "Debe especificarse exactamente un objetivo (material o ubicación) para la acción",
  path: ["materialId"]
})

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
})

export type CreateActionInput = z.infer<typeof CreateActionSchema>
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>
