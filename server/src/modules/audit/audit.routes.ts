import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler, validateQuery } from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { AuditController } from './audit.controller';
import { listAuditLogsQuerySchema } from './audit.dto';

const controller = new AuditController();

const auditRouter = Router();

auditRouter.get(
  '/',
  authGuard,
  roleGuard(Role.ADMIN),
  validateQuery(listAuditLogsQuerySchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

auditRouter.get(
  '/actions',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.actions(req, res)),
);

export default auditRouter;
