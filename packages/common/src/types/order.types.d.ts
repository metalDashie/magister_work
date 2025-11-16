import { z } from 'zod';
export declare enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PAID = "paid",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentProvider {
    MONOBANK = "monobank",
    FONDY = "fondy"
}
export declare const OrderItemSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    price: number;
    id: string;
    orderId: string;
}, {
    productId: string;
    quantity: number;
    price: number;
    id: string;
    orderId: string;
}>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    totalAmount: z.ZodNumber;
    status: z.ZodNativeEnum<typeof OrderStatus>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        orderId: z.ZodString;
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        orderId: string;
    }, {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        orderId: string;
    }>, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: OrderStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    totalAmount: number;
    items?: {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        orderId: string;
    }[] | undefined;
}, {
    status: OrderStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    totalAmount: number;
    items?: {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        orderId: string;
    }[] | undefined;
}>;
export type Order = z.infer<typeof OrderSchema>;
export declare const CreateOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    price: number;
}, {
    productId: string;
    quantity: number;
    price: number;
}>;
export declare const CreateOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        price: number;
    }, {
        productId: string;
        quantity: number;
        price: number;
    }>, "many">;
    deliveryType: z.ZodOptional<z.ZodString>;
    deliveryCity: z.ZodOptional<z.ZodString>;
    deliveryWarehouse: z.ZodOptional<z.ZodString>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    recipientName: z.ZodOptional<z.ZodString>;
    recipientPhone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    deliveryType?: string | undefined;
    deliveryCity?: string | undefined;
    deliveryWarehouse?: string | undefined;
    deliveryAddress?: string | undefined;
    recipientName?: string | undefined;
    recipientPhone?: string | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    deliveryType?: string | undefined;
    deliveryCity?: string | undefined;
    deliveryWarehouse?: string | undefined;
    deliveryAddress?: string | undefined;
    recipientName?: string | undefined;
    recipientPhone?: string | undefined;
}>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export declare const PaymentSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    provider: z.ZodNativeEnum<typeof PaymentProvider>;
    providerPaymentId: z.ZodString;
    status: z.ZodNativeEnum<typeof PaymentStatus>;
    amount: z.ZodNumber;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: PaymentStatus;
    currency: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: number;
    orderId: string;
    provider: PaymentProvider;
    providerPaymentId: string;
}, {
    status: PaymentStatus;
    currency: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: number;
    orderId: string;
    provider: PaymentProvider;
    providerPaymentId: string;
}>;
export type Payment = z.infer<typeof PaymentSchema>;
