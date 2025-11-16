"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCartItemSchema = exports.AddToCartSchema = exports.CartSchema = exports.CartItemSchema = void 0;
const zod_1 = require("zod");
exports.CartItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    cartId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
});
exports.CartSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().optional(),
    items: zod_1.z.array(exports.CartItemSchema).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.AddToCartSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive().default(1),
});
exports.UpdateCartItemSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().positive(),
});
//# sourceMappingURL=cart.types.js.map