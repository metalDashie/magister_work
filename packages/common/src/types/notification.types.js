"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendNotificationSchema = exports.NotificationSchema = exports.NotificationStatus = exports.NotificationChannel = void 0;
const zod_1 = require("zod");
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["TELEGRAM"] = "telegram";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["FAILED"] = "failed";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
exports.NotificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    channel: zod_1.z.nativeEnum(NotificationChannel),
    payload: zod_1.z.record(zod_1.z.any()),
    status: zod_1.z.nativeEnum(NotificationStatus),
    sentAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
});
exports.SendNotificationSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    channel: zod_1.z.nativeEnum(NotificationChannel),
    template: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.any()),
});
//# sourceMappingURL=notification.types.js.map