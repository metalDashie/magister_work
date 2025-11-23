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
  // Discount fields
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  discountStartDate: z.date().nullable().optional(),
  discountEndDate: z.date().nullable().optional(),
  discountActive: z.boolean().default(false),
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

// Discount DTOs
export const SetDiscountSchema = z.object({
  discountPercent: z.number().min(0).max(100),
  discountStartDate: z.union([z.string(), z.date()]).nullable().optional(),
  discountEndDate: z.union([z.string(), z.date()]).nullable().optional(),
  discountActive: z.boolean().optional().default(true),
})

export type SetDiscountDto = z.infer<typeof SetDiscountSchema>

export const BulkDiscountSchema = z.object({
  productIds: z.array(z.string().uuid()),
  discountPercent: z.number().min(0).max(100),
  discountStartDate: z.union([z.string(), z.date()]).nullable().optional(),
  discountEndDate: z.union([z.string(), z.date()]).nullable().optional(),
  discountActive: z.boolean().optional().default(true),
})

export type BulkDiscountDto = z.infer<typeof BulkDiscountSchema>
