import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { ValidationError } from '../../common/errors';
import { NotificationService } from './notification.service';
import type {
  ListNotificationsQueryDto,
  SendNotificationDto,
} from './notification.dto';

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const query = req.query as unknown as ListNotificationsQueryDto;
    const result = await notificationService.list(user.id, query);
    res.json(result);
  }

  async unreadCount(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const count = await notificationService.unreadCount(user.id);
    res.json({ count });
  }

  async markRead(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('Notification id is required');
    }
    const result = await notificationService.markRead(user.id, id);
    res.json(result);
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const result = await notificationService.markAllRead(user.id);
    res.json(result);
  }

  async sendFromAdmin(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const dto = req.body as SendNotificationDto;
    const result = await notificationService.sendFromAdmin(actor, dto);
    res.json(result);
  }
}
