import { z } from 'zod'

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  TELEGRAM = 'telegram',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  channel: z.nativeEnum(NotificationChannel),
  payload: z.record(z.any()),
  status: z.nativeEnum(NotificationStatus),
  sentAt: z.date().optional(),
  createdAt: z.date(),
})

export type Notification = z.infer<typeof NotificationSchema>

export const SendNotificationSchema = z.object({
  userId: z.string().uuid(),
  channel: z.nativeEnum(NotificationChannel),
  template: z.string(),
  data: z.record(z.any()),
})

export type SendNotificationDto = z.infer<typeof SendNotificationSchema>
