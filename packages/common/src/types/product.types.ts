import { z } from 'zod'

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('UAH'),
  stock: z.number().int().min(0),
  categoryId: z.number().int().optional(),
  images: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Product = z.infer<typeof ProductSchema>

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('UAH'),
  stock: z.number().int().min(0),
  categoryId: z.number().int().optional(),
  images: z.array(z.string()).optional(),
})

export type CreateProductDto = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = CreateProductSchema.partial()

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>
