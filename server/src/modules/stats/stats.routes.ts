import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler, validateQuery } from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { StatsController } from './stats.controller';
import { userStatsQuerySchema } from './stats.dto';

const router = Router();
const controller = new StatsController();

router.get(
  '/user',
  authGuard,
  validateQuery(userStatsQuerySchema),
  asyncHandler((req, res) => controller.userStats(req, res)),
);

router.get(
  '/admin',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.adminStats(req, res)),
);

export default router;
