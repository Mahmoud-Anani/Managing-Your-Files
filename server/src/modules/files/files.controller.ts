import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { ValidationError } from '../../common/errors';
import { FilesService } from './files.service';
import type {
  AdminListFilesQueryDto,
  ListFilesQueryDto,
} from './files.dto';

const filesService = new FilesService();

export class FilesController {
  //  @docs   Can Only User Logged upload files
  //  @Route  POST /api/v1/cart/:productId
  //  @access Private [User]
  async upload(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new ValidationError('At least one file is required');
    }
    const result = await filesService.upload(user, files);
    res.status(201).json(result);
  }

  async list(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const query = req.query as unknown as ListFilesQueryDto;
    const result = await filesService.listOwn(user, query);
    res.json(result);
  }

  async detail(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.getById(user, id);
    res.json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.delete(user, id);
    res.json(result);
  }

  async adminList(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AdminListFilesQueryDto;
    const result = await filesService.adminList(query);
    res.json(result);
  }

  async adminRemove(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.adminDelete(id);
    res.json(result);
  }
}
