import type { Prisma, Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors';
import { paginate, type PaginatedResult } from '../../common/pagination';
import { toSafeUserDto, type SafeUserDto } from '../../common/user-mapper';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { emitToUser, emitToAdmins } from '../../socket';
import type {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
} from './users.dto';

const auditService = new AuditService();

export class UsersService {
  async list(query: ListUsersQueryDto): Promise<PaginatedResult<SafeUserDto>> {
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

  async createUser(
    actor: User,
    dto: CreateUserDto,
    ctx?: AuditContext,
  ): Promise<SafeUserDto> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role,
        isVerified: dto.isVerified,
      },
    });

    await auditService.log({
      userId: actor.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: created.id,
      metadata: {
        email: created.email,
        name: created.name,
        role: created.role,
      },
      ctx,
    });

    const safeDto = toSafeUserDto(created);
    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToAdmins(io, 'admin:user:created', { user: safeDto });
    }

    return safeDto;
  }

  async updateUser(
    actor: User,
    targetUserId: string,
    dto: UpdateUserDto,
    ctx?: AuditContext,
  ): Promise<SafeUserDto> {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (dto.email && dto.email !== target.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictError('An account with this email already exists');
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.isVerified !== undefined ? { isVerified: dto.isVerified } : {}),
      },
    });

    await auditService.log({
      userId: actor.id,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: targetUserId,
      metadata: {
        email: target.email,
        updatedEmail: updated.email,
        updatedRole: updated.role,
      },
      ctx,
    });

    const safeDto = toSafeUserDto(updated);
    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, targetUserId, 'user:updated', { user: safeDto });
      emitToAdmins(io, 'admin:user:updated', { user: safeDto });
    }

    return safeDto;
  }

  async updateRole(
    actor: User,
    targetUserId: string,
    role: Role,
    ctx?: AuditContext,
  ): Promise<SafeUserDto> {
    if (actor.id === targetUserId) {
      throw new ValidationError('You cannot change your own role');
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await auditService.log({
      userId: actor.id,
      action: 'USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: targetUserId,
      metadata: { email: target.email, from: target.role, to: role },
      ctx,
    });

    const dto = toSafeUserDto(updated);
    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, targetUserId, 'user:role-changed', {
        userId: targetUserId,
        role,
      });
      emitToAdmins(io, 'admin:user:role-changed', { user: dto });
    }

    return dto;
  }

  async deleteUser(
    actor: User,
    targetUserId: string,
    ctx?: AuditContext,
  ): Promise<{ message: string }> {
    if (actor.id === targetUserId) {
      throw new ValidationError('You cannot delete your own account');
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    await auditService.log({
      userId: actor.id,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: targetUserId,
      metadata: { email: target.email, name: target.name },
      ctx,
    });

    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToAdmins(io, 'admin:user:deleted', {
        userId: targetUserId,
        email: target.email,
      });
    }

    return { message: 'User deleted successfully' };
  }
}
