import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { ValidationError } from '../../common/errors';
import type { SafeUserDto } from '../../common/user-mapper';
import type { PaginatedResult } from '../../common/pagination';
import { UsersService } from './users.service';
import type {
  ListUsersQueryDto,
  UpdateUserRoleDto,
} from './users.dto';

const usersService = new UsersService();

export class UsersController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListUsersQueryDto;
    const result: PaginatedResult<SafeUserDto> = await usersService.list(query);
    res.json(result);
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('User id is required');
    }
    const body = req.body as UpdateUserRoleDto;
    const result = await usersService.updateRole(actor, id, body.role);
    res.json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('User id is required');
    }
    const result = await usersService.deleteUser(actor, id);
    res.json(result);
  }
}
