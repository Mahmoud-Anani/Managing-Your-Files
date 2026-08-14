import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler, validateBody, validateQuery } from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { UsersController } from './users.controller';
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
} from './users.dto';

const router = Router();
const controller = new UsersController();

router.get(
  '/',
  authGuard,
  roleGuard(Role.ADMIN),
  validateQuery(listUsersQuerySchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

router.patch(
  '/:id',
  authGuard,
  roleGuard(Role.ADMIN),
  validateBody(updateUserRoleSchema),
  asyncHandler((req, res) => controller.updateRole(req, res)),
);

router.delete(
  '/:id',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.remove(req, res)),
);

export default router;
