import { z } from 'zod'

export const CreateActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  locationId: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  newLocation: z.object({
    name: z.string().min(1).max(255),
    type: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    parentId: z.number().int().positive().nullable().optional(),
    infraTypeId: z.number().int().positive().nullable().optional(),
  }).optional(),
}).refine(data => {
  return data.locationId !== undefined || data.newLocation !== undefined;
}, {
  message: "Debe especificarse una ubicación (existente o nueva) para la acción",
  path: ["locationId"]
})

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
})

export type CreateActionInput = z.infer<typeof CreateActionSchema>
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>
