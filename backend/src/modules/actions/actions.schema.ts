import { z } from 'zod'

export const CreateActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
  typeId: z.number().int().positive(),
  materialId: z.number().int().positive().optional(),
  infrastructureId: z.number().int().positive().optional(),
  dependencyId: z.number().int().positive().optional(),
  structureId: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).refine(data => {
  const count = [
    data.materialId,
    data.infrastructureId,
    data.dependencyId,
    data.structureId
  ].filter(id => id !== undefined && id !== null).length
  return count === 1;
}, {
  message: "Debe especificarse exactamente un objetivo (material, infraestructura, dependencia o estructura) para la acción",
  path: ["materialId"]
})

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  performedAt: z.string().datetime().optional(),
})

export type CreateActionInput = z.infer<typeof CreateActionSchema>
export type UpdateActionInput = z.infer<typeof UpdateActionSchema>
