import { z } from 'zod'

export const CartItemProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string().optional(),
  price: z.number(),
  images: z.array(z.string()).optional(),
})

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  product: CartItemProductSchema.optional(),
})

export type CartItem = z.infer<typeof CartItemSchema>

export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  items: z.array(CartItemSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Cart = z.infer<typeof CartSchema>

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  price: z.number().positive().optional(),
})

export type AddToCartDto = z.infer<typeof AddToCartSchema>

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
})

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>
