import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler, validateQuery, validateBody } from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { NotificationController } from './notification.controller';
import {
  listNotificationsQuerySchema,
  sendNotificationSchema,
} from './notification.dto';

const router = Router();
const controller = new NotificationController();

router.post(
  '/send',
  authGuard,
  roleGuard(Role.ADMIN),
  validateBody(sendNotificationSchema),
  asyncHandler((req, res) => controller.sendFromAdmin(req, res)),
);

router.get(
  '/',
  authGuard,
  validateQuery(listNotificationsQuerySchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

router.get(
  '/unread-count',
  authGuard,
  asyncHandler((req, res) => controller.unreadCount(req, res)),
);

router.patch(
  '/read-all',
  authGuard,
  asyncHandler((req, res) => controller.markAllRead(req, res)),
);

router.patch(
  '/:id/read',
  authGuard,
  asyncHandler((req, res) => controller.markRead(req, res)),
);

export default router;
