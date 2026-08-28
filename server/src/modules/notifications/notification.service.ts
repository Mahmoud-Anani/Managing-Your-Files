import type { Notification, Prisma, User } from '@prisma/client';
import type { Server } from 'socket.io';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import type { SendNotificationDto } from './notification.dto';

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  data: NotificationPayload[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toPayload(notification: Notification): NotificationPayload {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    metadata: notification.metadata as Record<string, unknown> | null,
  };
}

function getSocketServer(): Server | null {
  return (
    (globalThis as { __socketServer?: Server }).__socketServer ?? null
  );
}

export class NotificationService {
  /** Persist a notification for a single user and push it over their socket room. */
  async notifyUser(
    userId: string,
    input: NotificationInput,
  ): Promise<NotificationPayload> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    const payload = toPayload(notification);
    const io = getSocketServer();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', payload);
    }
    return payload;
  }

  /** Persist a notification for every admin and broadcast a signal to the admins room. */
  async notifyAdmins(input: NotificationInput): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length === 0) {
      return;
    }

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      })),
    });

    const io = getSocketServer();
    if (io) {
      io.to('admins').emit('notification:new', {
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata ?? null,
      } satisfies Omit<NotificationPayload, 'id' | 'createdAt' | 'isRead'>);
    }
  }

  /** Admin-sent message to a single user (userId) or to every user (no userId). */
  async sendFromAdmin(
    actor: User,
    dto: SendNotificationDto,
  ): Promise<{ count: number }> {
    const type = dto.type ?? 'ADMIN_MESSAGE';
    const title = dto.title;
    const message = dto.message;
    const senderMetadata = {
      fromAdminId: actor.id,
      fromAdminName: actor.name,
    } satisfies Record<string, unknown>;

    let recipients: Array<{ id: string }>;
    if (dto.userId) {
      const user = await prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }
      recipients = [user];
    } else {
      recipients = await prisma.user.findMany({
        select: { id: true },
      });
    }

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type,
          title,
          message,
          metadata: senderMetadata,
        })),
      });
    }

    const io = getSocketServer();
    if (io) {
      const signal = { type, title, message, metadata: null };
      for (const recipient of recipients) {
        io.to(`user:${recipient.id}`).emit('notification:new', signal);
      }
    }

    return { count: recipients.length };
  }

  async list(
    userId: string,
    query: NotificationQuery,
  ): Promise<PaginatedNotifications> {
    const page =
      Number.isFinite(query.page) && query.page! > 0 ? Math.floor(query.page!) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit! > 0 && query.limit! <= 100
        ? Math.floor(query.limit!)
        : 20;

    const [rows, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: rows.map(toPayload),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationPayload> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    if (notification.isRead) {
      return toPayload(notification);
    }
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return toPayload(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }
}
