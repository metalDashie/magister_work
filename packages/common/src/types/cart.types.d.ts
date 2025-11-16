import { z } from 'zod';
export declare const CartItemSchema: z.ZodObject<{
    id: z.ZodString;
    cartId: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    price: number;
    id: string;
    cartId: string;
}, {
    productId: string;
    quantity: number;
    price: number;
    id: string;
    cartId: string;
}>;
export type CartItem = z.infer<typeof CartItemSchema>;
export declare const CartSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        cartId: z.ZodString;
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        cartId: string;
    }, {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        cartId: string;
    }>, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    items?: {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        cartId: string;
    }[] | undefined;
    userId?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    items?: {
        productId: string;
        quantity: number;
        price: number;
        id: string;
        cartId: string;
    }[] | undefined;
    userId?: string | undefined;
}>;
export type Cart = z.infer<typeof CartSchema>;
export declare const AddToCartSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
}, {
    productId: string;
    quantity?: number | undefined;
}>;
export type AddToCartDto = z.infer<typeof AddToCartSchema>;
export declare const UpdateCartItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;
