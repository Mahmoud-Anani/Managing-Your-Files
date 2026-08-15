import { Router, type Request } from 'express';
import { asyncHandler, validateBody } from '../../common/async-handler';
import { authGuard } from '../../common/guards';
import { SharingController } from './sharing.controller';
import {
  shareFileSchema,
  updateShareSchema,
  type ShareFileDto,
  type UpdateShareDto,
} from './sharing.dto';

const router = Router();
const controller = new SharingController();

router.use(authGuard);

router.post(
  '/:fileId',
  validateBody(shareFileSchema),
  asyncHandler((req: Request<{ fileId: string }, unknown, ShareFileDto>, res) =>
    controller.shareFile(req, res),
  ),
);

router.get(
  '/shared-by-me',
  asyncHandler((req, res) => controller.getSharedByMe(req, res)),
);

router.get(
  '/shared-with-me',
  asyncHandler((req, res) => controller.getSharedWithMe(req, res)),
);

router.put(
  '/:id',
  validateBody(updateShareSchema),
  asyncHandler((req: Request<{ id: string }, unknown, UpdateShareDto>, res) =>
    controller.updateShare(req, res),
  ),
);

router.delete(
  '/:id',
  asyncHandler((req: Request<{ id: string }>, res) =>
    controller.removeShare(req, res),
  ),
);

export default router;
