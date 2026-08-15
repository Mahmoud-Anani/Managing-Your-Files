import type { Request, Response } from 'express';
import { SharingService } from './sharing.service';
import type { ShareFileDto, UpdateShareDto } from './sharing.dto';
import { getAuthUser } from '../../common/guards';

const sharingService = new SharingService();

function getAuthUserId(req: Request): string {
  const user = getAuthUser(req);
  return user.id;
}

export class SharingController {
  async shareFile(
    req: Request<{ fileId: string }, unknown, ShareFileDto>,
    res: Response,
  ): Promise<void> {
    const userId = getAuthUserId(req);
    const result = await sharingService.shareFile(
      req.params.fileId,
      userId,
      req.body,
    );
    res.status(201).json(result);
  }

  async updateShare(
    req: Request<{ id: string }, unknown, UpdateShareDto>,
    res: Response,
  ): Promise<void> {
    const userId = getAuthUserId(req);
    const result = await sharingService.updateShare(
      req.params.id,
      userId,
      req.body,
    );
    res.json(result);
  }

  async removeShare(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const userId = getAuthUserId(req);
    await sharingService.removeShare(req.params.id, userId);
    res.status(204).send();
  }

  async getSharedByMe(req: Request, res: Response): Promise<void> {
    const userId = getAuthUserId(req);
    const result = await sharingService.getSharedByMe(userId);
    res.json(result);
  }

  async getSharedWithMe(req: Request, res: Response): Promise<void> {
    const userId = getAuthUserId(req);
    const result = await sharingService.getSharedWithMe(userId);
    res.json(result);
  }
}
