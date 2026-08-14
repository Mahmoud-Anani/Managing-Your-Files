import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  asyncHandler,
  validateQuery,
} from '../../common/async-handler';
import { authGuard, roleGuard } from '../../common/guards';
import { handleMulterError, MAX_FILES_PER_UPLOAD, upload } from '../../common/multer';
import { FilesController } from './files.controller';
import {
  adminListFilesQuerySchema,
  listFilesQuerySchema,
} from './files.dto';

const controller = new FilesController();

const filesRouter = Router();

filesRouter.post(
  '/upload',
  authGuard,
  upload.array('files', MAX_FILES_PER_UPLOAD),
  handleMulterError,
  asyncHandler((req, res) => controller.upload(req, res)),
);

filesRouter.get(
  '/',
  authGuard,
  validateQuery(listFilesQuerySchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

filesRouter.get(
  '/:id',
  authGuard,
  asyncHandler((req, res) => controller.detail(req, res)),
);

filesRouter.delete(
  '/:id',
  authGuard,
  asyncHandler((req, res) => controller.remove(req, res)),
);

const adminFilesRouter = Router();

adminFilesRouter.get(
  '/',
  authGuard,
  roleGuard(Role.ADMIN),
  validateQuery(adminListFilesQuerySchema),
  asyncHandler((req, res) => controller.adminList(req, res)),
);

adminFilesRouter.delete(
  '/:id',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.adminRemove(req, res)),
);

export { filesRouter, adminFilesRouter };
