import type { Prisma, Role, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, ValidationError } from '../../common/errors';
import { paginate, type PaginatedResult } from '../../common/pagination';
import { toSafeUserDto, type SafeUserDto } from '../../common/user-mapper';
import type { ListUsersQueryDto } from './users.dto';

export class UsersService {  async list(query: ListUsersQueryDto): Promise<PaginatedResult<SafeUserDto>> {
    const { page, limit, search, role, sortBy, sortOrder } = query;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'name'
        ? { name: sortOrder }
        : sortBy === 'email'
          ? { email: sortOrder }
          : { createdAt: sortOrder };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(users.map(toSafeUserDto), total, page, limit);
  }

  async updateRole(
    actor: User,
    targetUserId: string,
    role: Role,
  ): Promise<SafeUserDto> {
    if (actor.id === targetUserId) {
      throw new ValidationError('You cannot change your own role');
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });
    return toSafeUserDto(updated);
  }

  async deleteUser(
    actor: User,
    targetUserId: string,
  ): Promise<{ message: string }> {
    if (actor.id === targetUserId) {
      throw new ValidationError('You cannot delete your own account');
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({ where: { id: targetUserId } });
    return { message: 'User deleted successfully' };
  }
}
