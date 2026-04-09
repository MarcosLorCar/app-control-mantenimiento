import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  fullName: z.string().min(1),
  roleId: z.number().int().positive(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserBody = z.infer<typeof CreateUserSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>
