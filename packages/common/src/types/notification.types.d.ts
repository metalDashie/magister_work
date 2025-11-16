import { z } from 'zod';
export declare enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    TELEGRAM = "telegram"
}
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed"
}
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    channel: z.ZodNativeEnum<typeof NotificationChannel>;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    status: z.ZodNativeEnum<typeof NotificationStatus>;
    sentAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: NotificationStatus;
    id: string;
    createdAt: Date;
    userId: string;
    channel: NotificationChannel;
    payload: Record<string, any>;
    sentAt?: Date | undefined;
}, {
    status: NotificationStatus;
    id: string;
    createdAt: Date;
    userId: string;
    channel: NotificationChannel;
    payload: Record<string, any>;
    sentAt?: Date | undefined;
}>;
export type Notification = z.infer<typeof NotificationSchema>;
export declare const SendNotificationSchema: z.ZodObject<{
    userId: z.ZodString;
    channel: z.ZodNativeEnum<typeof NotificationChannel>;
    template: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    channel: NotificationChannel;
    template: string;
    data: Record<string, any>;
}, {
    userId: string;
    channel: NotificationChannel;
    template: string;
    data: Record<string, any>;
}>;
export type SendNotificationDto = z.infer<typeof SendNotificationSchema>;
