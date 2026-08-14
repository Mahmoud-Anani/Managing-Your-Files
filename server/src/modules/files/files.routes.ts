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
  '/trash',
  authGuard,
  validateQuery(listFilesQuerySchema),
  asyncHandler((req, res) => controller.trash(req, res)),
);

filesRouter.get(
  '/:id/download',
  authGuard,
  asyncHandler((req, res) => controller.download(req, res)),
);

filesRouter.get(
  '/:id/preview',
  authGuard,
  asyncHandler((req, res) => controller.preview(req, res)),
);

filesRouter.get(
  '/:id',
  authGuard,
  asyncHandler((req, res) => controller.detail(req, res)),
);

filesRouter.post(
  '/:id/restore',
  authGuard,
  asyncHandler((req, res) => controller.restore(req, res)),
);

filesRouter.delete(
  '/:id',
  authGuard,
  asyncHandler((req, res) => controller.remove(req, res)),
);

filesRouter.delete(
  '/:id/permanent',
  authGuard,
  asyncHandler((req, res) => controller.purge(req, res)),
);

const adminFilesRouter = Router();

adminFilesRouter.get(
  '/',
  authGuard,
  roleGuard(Role.ADMIN),
  validateQuery(adminListFilesQuerySchema),
  asyncHandler((req, res) => controller.adminList(req, res)),
);

adminFilesRouter.get(
  '/trash',
  authGuard,
  roleGuard(Role.ADMIN),
  validateQuery(adminListFilesQuerySchema),
  asyncHandler((req, res) => controller.adminTrash(req, res)),
);

adminFilesRouter.post(
  '/:id/restore',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.adminRestore(req, res)),
);

adminFilesRouter.delete(
  '/:id',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.adminRemove(req, res)),
);

adminFilesRouter.delete(
  '/:id/permanent',
  authGuard,
  roleGuard(Role.ADMIN),
  asyncHandler((req, res) => controller.adminPurge(req, res)),
);

export { filesRouter, adminFilesRouter };
