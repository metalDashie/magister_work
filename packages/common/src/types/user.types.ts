import { z } from 'zod'

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export type LoginDto = z.infer<typeof LoginSchema>
