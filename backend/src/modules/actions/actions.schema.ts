import { z } from 'zod'

export const CreateActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  performedAt: z.string().datetime().optional(),
  locationId: z.number().int().positive().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  newLocation: z.object({
    name: z.string().min(1).max(255),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    parentId: z.number().int().positive().nullable().optional(),
    infraTypeId: z.number().int().positive().nullable().optional(),
  }).optional(),
  materials: z.array(
    z.object({
      materialId: z.number().int().positive().optional(),
      name: z.string().min(1).max(255).optional(),
      typeId: z.number().int().positive().optional(),
      description: z.string().optional().nullable(),
      attributes: z.record(z.any()).optional().default({}),
      locationId: z.number().int().positive().nullable().optional(),
      operation: z.enum(['INSTALL', 'UNINSTALL', 'UPDATE'])
    })
  ).optional(),
}).refine(data => {
  return data.locationId !== undefined || data.newLocation !== undefined;
}, {
  message: "Debe especificarse una ubicación (existente o nueva) para la acción",
  path: ["locationId"]
})

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  performedAt: z.string().datetime().optional(),
})

export type CreateActionInput = z.infer<typeof CreateActionSchema>
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>
