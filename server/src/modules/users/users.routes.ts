import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  asyncHandler,
  validateBody,
  validateQuery,
} from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { UsersController } from './users.controller';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserRoleSchema,
} from './users.dto';

const router = Router();
const controller = new UsersController();

router.post(
  '/',
  authGuard,
  roleGuard(Role.ADMIN),
  validateBody(createUserSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

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
  validateBody(updateUserSchema),
  asyncHandler((req, res) => controller.update(req, res)),
);

router.patch(
  '/:id/role',
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
