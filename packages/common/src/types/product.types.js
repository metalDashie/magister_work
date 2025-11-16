"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductSchema = exports.CreateProductSchema = exports.ProductSchema = void 0;
const zod_1 = require("zod");
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    sku: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('UAH'),
    stock: zod_1.z.number().int().min(0),
    categoryId: zod_1.z.number().int().optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    sku: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('UAH'),
    stock: zod_1.z.number().int().min(0),
    categoryId: zod_1.z.number().int().optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateProductSchema = exports.CreateProductSchema.partial();
//# sourceMappingURL=product.types.js.map