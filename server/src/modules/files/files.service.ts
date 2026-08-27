import type { File, Prisma, Role, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError } from '../../common/errors';
import { paginate, type PaginatedResult } from '../../common/pagination';
import {
  cloudinaryPublicId,
  cloudinaryResourceType,
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../../common/cloudinary';
import { normalizeMimeType } from '../../common/multer';
import {
  toFileDetailDto,
  toSafeFileDto,
  type FileDetailDto,
  type SafeFileDto,
} from './file-mapper';
import { extractText } from './text-extractor';
import { AuditService, type AuditContext } from '../audit/audit.service';
import type { AdminListFilesQueryDto, ListFilesQueryDto } from './files.dto';
import { emitToUser, emitToAdmins } from '../../socket';

const auditService = new AuditService();

function fileOrderBy(
  sortBy: 'createdAt' | 'name' | 'size',
  sortOrder: 'asc' | 'desc',
): Prisma.FileOrderByWithRelationInput {
  if (sortBy === 'size') {
    return { size: sortOrder };
  }
  if (sortBy === 'name') {
    return { originalName: sortOrder };
  }
  return { createdAt: sortOrder };
}

async function removeStoredFile(
  storedName: string,
  mimeType: string,
): Promise<void> {
  try {
    await deleteFromCloudinary(storedName, cloudinaryResourceType(mimeType));
  } catch {
    // The Cloudinary asset may already be missing; the database record is
    // the source of truth for the delete operation.
  }
}

async function findFile(
  fileId: string,
  includeDeleted: boolean,
): Promise<File> {
  const file = await prisma.file.findFirst({
    where: includeDeleted ? { id: fileId } : { id: fileId, deletedAt: null },
  });
  if (!file) {
    throw new NotFoundError('File not found');
  }
  return file;
}

export class FilesService {
  async upload(
    user: User,
    files: Array<Express.Multer.File>,
    ctx?: AuditContext,
  ): Promise<SafeFileDto[]> {
    const records: File[] = [];

    for (const file of files) {
      const extension =
        file.originalname
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '') ?? '';
      const mimeType = normalizeMimeType(file.originalname, file.mimetype);
      const extractedText = await extractText({
        buffer: file.buffer,
        mimeType,
        extension,
      });

      const publicId = cloudinaryPublicId();
      const uploaded = await uploadToCloudinary({
        buffer: file.buffer,
        publicId,
        mimeType,
      });

      const record = await prisma.file.create({
        data: {
          originalName: file.originalname,
          storedName: uploaded.publicId,
          mimeType,
          size: file.size,
          extension,
          url: uploaded.secureUrl,
          extractedText,
          userId: user.id,
        },
      });
      records.push(record);
    }

    for (const record of records) {
      await auditService.log({
        userId: user.id,
        action: 'FILE_UPLOAD',
        entityType: 'FILE',
        entityId: record.id,
        metadata: { name: record.originalName, size: record.size },
        ctx,
      });
    }

    if (records.length > 0) {
      const io = (globalThis as any).__socketServer;
      if (io) {
        emitToUser(io, user.id, 'file:uploaded', {
          files: records.map(toSafeFileDto),
        });
        emitToAdmins(io, 'admin:file:uploaded', {
          files: records.map(toSafeFileDto),
        });
      }
    }

    return records.map(toSafeFileDto);
  }

  async listOwn(
    user: User,
    query: ListFilesQueryDto,
  ): Promise<PaginatedResult<SafeFileDto>> {
    const { page, limit, search, type, sortBy, sortOrder } = query;

    const where: Prisma.FileWhereInput = {
      userId: user.id,
      deletedAt: null,
    };
    if (search) {
      where.originalName = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.extension = type.toLowerCase();
    }

    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        orderBy: fileOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return paginate(files.map(toSafeFileDto), total, page, limit);
  }

  async listTrash(
    user: User,
    query: ListFilesQueryDto,
  ): Promise<PaginatedResult<SafeFileDto>> {
    const { page, limit, search, type, sortBy, sortOrder } = query;

    const where: Prisma.FileWhereInput = {
      userId: user.id,
      deletedAt: { not: null },
    };
    if (search) {
      where.originalName = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.extension = type.toLowerCase();
    }

    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        orderBy: fileOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return paginate(files.map(toSafeFileDto), total, page, limit);
  }

  async getById(user: User, fileId: string): Promise<FileDetailDto> {
    const file = await findFile(fileId, false);
    await this.assertCanAccess(file, user.id, user.role);
    return toFileDetailDto(file);
  }

  async getForDownload(
    user: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<File> {
    const file = await findFile(fileId, false);
    await this.assertCanAccess(file, user.id, user.role);

    await auditService.log({
      userId: user.id,
      action: 'FILE_DOWNLOAD',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName },
      ctx,
    });

    return file;
  }

  async getForPreview(
    user: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<File> {
    const file = await findFile(fileId, false);
    await this.assertCanAccess(file, user.id, user.role);

    await auditService.log({
      userId: user.id,
      action: 'FILE_PREVIEW',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName },
      ctx,
    });

    return file;
  }

  async delete(
    user: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<{ message: string }> {
    const file = await findFile(fileId, false);
    await this.assertCanEdit(file, user.id, user.role);

    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      userId: user.id,
      action: 'FILE_SOFT_DELETE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName },
      ctx,
    });

    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:deleted', { fileId: file.id });
      emitToAdmins(io, 'admin:file:deleted', {
        fileId: file.id,
        ownerId: file.userId,
      });
    }

    return { message: 'File moved to trash' };
  }

  async restore(
    user: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<SafeFileDto> {
    const file = await findFile(fileId, true);
    await this.assertCanAccess(file, user.id, user.role);
    if (!file.deletedAt) {
      throw new NotFoundError('File not found');
    }

    const restored = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    await auditService.log({
      userId: user.id,
      action: 'FILE_RESTORE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName },
      ctx,
    });

    const dto = toSafeFileDto(restored);
    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:restored', { file: dto });
      emitToAdmins(io, 'admin:file:restored', {
        file: dto,
        ownerId: file.userId,
      });
    }

    return dto;
  }

  async purge(
    user: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<{ message: string }> {
    const file = await findFile(fileId, true);
    await this.assertCanAccess(file, user.id, user.role);
    if (!file.deletedAt) {
      throw new NotFoundError('File not found');
    }

    await removeStoredFile(file.storedName, file.mimeType);
    await prisma.file.delete({ where: { id: fileId } });

    await auditService.log({
      userId: user.id,
      action: 'FILE_PERMANENT_DELETE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName },
      ctx,
    });

    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:purged', { fileId: file.id });
      emitToAdmins(io, 'admin:file:purged', {
        fileId: file.id,
        ownerId: file.userId,
      });
    }

    return { message: 'File permanently deleted' };
  }

  async adminList(
    query: AdminListFilesQueryDto,
  ): Promise<PaginatedResult<SafeFileDto>> {
    const { page, limit, search, type, sortBy, sortOrder, userId } = query;

    const where: Prisma.FileWhereInput = { deletedAt: null };
    if (search) {
      where.originalName = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.extension = type.toLowerCase();
    }
    if (userId) {
      where.userId = userId;
    }

    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        orderBy: fileOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return paginate(files.map(toSafeFileDto), total, page, limit);
  }

  async adminListTrash(
    query: AdminListFilesQueryDto,
  ): Promise<PaginatedResult<SafeFileDto>> {
    const { page, limit, search, type, sortBy, sortOrder, userId } = query;

    const where: Prisma.FileWhereInput = { deletedAt: { not: null } };
    if (search) {
      where.originalName = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.extension = type.toLowerCase();
    }
    if (userId) {
      where.userId = userId;
    }

    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        orderBy: fileOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return paginate(files.map(toSafeFileDto), total, page, limit);
  }

  async adminDelete(
    actor: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<{ message: string }> {
    const file = await findFile(fileId, false);

    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      userId: actor.id,
      action: 'FILE_SOFT_DELETE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName, ownerId: file.userId },
      ctx,
    });

    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:deleted', { fileId: file.id });
      emitToAdmins(io, 'admin:file:deleted', {
        fileId: file.id,
        ownerId: file.userId,
      });
    }

    return { message: 'File moved to trash' };
  }

  async adminRestore(
    actor: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<SafeFileDto> {
    const file = await findFile(fileId, true);
    if (!file.deletedAt) {
      throw new NotFoundError('File not found');
    }

    const restored = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    await auditService.log({
      userId: actor.id,
      action: 'FILE_RESTORE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName, ownerId: file.userId },
      ctx,
    });

    const dto = toSafeFileDto(restored);
    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:restored', { file: dto });
      emitToAdmins(io, 'admin:file:restored', {
        file: dto,
        ownerId: file.userId,
      });
    }

    return dto;
  }

  async adminPurge(
    actor: User,
    fileId: string,
    ctx?: AuditContext,
  ): Promise<{ message: string }> {
    const file = await findFile(fileId, true);
    if (!file.deletedAt) {
      throw new NotFoundError('File not found');
    }

    await removeStoredFile(file.storedName, file.mimeType);
    await prisma.file.delete({ where: { id: fileId } });

    await auditService.log({
      userId: actor.id,
      action: 'FILE_PERMANENT_DELETE',
      entityType: 'FILE',
      entityId: file.id,
      metadata: { name: file.originalName, ownerId: file.userId },
      ctx,
    });

    const io = (globalThis as any).__socketServer;
    if (io) {
      emitToUser(io, file.userId, 'file:purged', { fileId: file.id });
      emitToAdmins(io, 'admin:file:purged', {
        fileId: file.id,
        ownerId: file.userId,
      });
    }

    return { message: 'File permanently deleted' };
  }

  private async assertCanAccess(
    file: File,
    userId: string,
    role: Role,
  ): Promise<void> {
    if (file.userId === userId || role === 'ADMIN') {
      return;
    }
    const share = await prisma.fileShare.findUnique({
      where: { fileId_sharedWithId: { fileId: file.id, sharedWithId: userId } },
    });
    if (!share) {
      throw new ForbiddenError('You do not have access to this file');
    }
  }

  private async assertCanEdit(
    file: File,
    userId: string,
    role: Role,
  ): Promise<void> {
    if (file.userId === userId || role === 'ADMIN') {
      return;
    }
    const share = await prisma.fileShare.findUnique({
      where: { fileId_sharedWithId: { fileId: file.id, sharedWithId: userId } },
    });
    if (!share || share.permission !== 'EDIT') {
      throw new ForbiddenError(
        'You do not have permission to modify this file',
      );
    }
  }
}
