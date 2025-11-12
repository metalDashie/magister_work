import { z } from 'zod'

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  MONOBANK = 'monobank',
  FONDY = 'fondy',
}

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

export type OrderItem = z.infer<typeof OrderItemSchema>

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  totalAmount: z.number().positive(),
  status: z.nativeEnum(OrderStatus),
  items: z.array(OrderItemSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Order = z.infer<typeof OrderSchema>

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1),
})

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.nativeEnum(PaymentProvider),
  providerPaymentId: z.string(),
  status: z.nativeEnum(PaymentStatus),
  amount: z.number().positive(),
  currency: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Payment = z.infer<typeof PaymentSchema>
