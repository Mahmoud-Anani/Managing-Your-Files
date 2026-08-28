import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const sendNotificationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
  // Omit userId to send to every user.
  userId: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).max(50).optional(),
});

export type ListNotificationsQueryDto = z.infer<
  typeof listNotificationsQuerySchema
>;

export type SendNotificationDto = z.infer<typeof sendNotificationSchema>;
