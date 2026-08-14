import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { paginate, type PaginatedResult } from '../../common/pagination';
import type { ListAuditLogsQueryDto } from './audit.dto';

export interface AuditContext {
  ip?: string;
  userAgent?: string;
}

export interface AuditLogDto {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string } | null;
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export class AuditService {
  async log(input: {
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ctx?: AuditContext;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          ip: input.ctx?.ip ?? null,
          userAgent: input.ctx?.userAgent ?? null,
        },
      });
    } catch {
      // Audit logging must never break the operation it is observing.
    }
  }

  async list(
    query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResult<AuditLogDto>> {
    const { page, limit, action, userId, search } = query;

    const where: Prisma.AuditLogWhereInput = {};
    if (action) {
      where.action = action;
    }
    if (userId) {
      where.userId = userId;
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { metadata: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { ip: { contains: search, mode: 'insensitive' } },
        { user: { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ] } },
      ];
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginate(
      logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: parseMetadata(log.metadata),
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: log.user,
      })),
      total,
      page,
      limit,
    );
  }

  async distinctActions(): Promise<string[]> {
    const rows = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return rows.map((row) => row.action);
  }
}
