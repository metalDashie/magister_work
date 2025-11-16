"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSchema = exports.CreateOrderSchema = exports.CreateOrderItemSchema = exports.OrderSchema = exports.OrderItemSchema = exports.PaymentProvider = exports.PaymentStatus = exports.OrderStatus = void 0;
const zod_1 = require("zod");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["PAID"] = "paid";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["MONOBANK"] = "monobank";
    PaymentProvider["FONDY"] = "fondy";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
exports.OrderItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
});
exports.OrderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    totalAmount: zod_1.z.number().positive(),
    status: zod_1.z.nativeEnum(OrderStatus),
    items: zod_1.z.array(exports.OrderItemSchema).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateOrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
});
exports.CreateOrderSchema = zod_1.z.object({
    items: zod_1.z.array(exports.CreateOrderItemSchema).min(1),
    deliveryType: zod_1.z.string().optional(),
    deliveryCity: zod_1.z.string().optional(),
    deliveryWarehouse: zod_1.z.string().optional(),
    deliveryAddress: zod_1.z.string().optional(),
    recipientName: zod_1.z.string().optional(),
    recipientPhone: zod_1.z.string().optional(),
});
exports.PaymentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    provider: zod_1.z.nativeEnum(PaymentProvider),
    providerPaymentId: zod_1.z.string(),
    status: zod_1.z.nativeEnum(PaymentStatus),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=order.types.js.map