import { z } from 'zod';
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    stock: z.ZodNumber;
    categoryId: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    price: number;
    name: string;
    currency: string;
    stock: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    sku?: string | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}, {
    price: number;
    name: string;
    stock: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    sku?: string | undefined;
    currency?: string | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}>;
export type Product = z.infer<typeof ProductSchema>;
export declare const CreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    stock: z.ZodNumber;
    categoryId: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    price: number;
    name: string;
    currency: string;
    stock: number;
    description?: string | undefined;
    sku?: string | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}, {
    price: number;
    name: string;
    stock: number;
    description?: string | undefined;
    sku?: string | undefined;
    currency?: string | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export declare const UpdateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    stock: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    price?: number | undefined;
    name?: string | undefined;
    sku?: string | undefined;
    currency?: string | undefined;
    stock?: number | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}, {
    description?: string | undefined;
    price?: number | undefined;
    name?: string | undefined;
    sku?: string | undefined;
    currency?: string | undefined;
    stock?: number | undefined;
    categoryId?: number | undefined;
    images?: string[] | undefined;
}>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
