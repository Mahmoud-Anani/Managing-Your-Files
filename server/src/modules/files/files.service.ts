import { promises as fs } from 'fs';
import path from 'path';
import type { File, Prisma, Role, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError } from '../../common/errors';
import { paginate, type PaginatedResult } from '../../common/pagination';
import { STORAGE_DIR } from '../../common/multer';
import {
  toFileDetailDto,
  toSafeFileDto,
  type FileDetailDto,
  type SafeFileDto,
} from './file-mapper';
import { extractText } from './text-extractor';
import type {
  AdminListFilesQueryDto,
  ListFilesQueryDto,
} from './files.dto';

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

async function removeStoredFile(storedName: string): Promise<void> {
  try {
    await fs.unlink(path.join(STORAGE_DIR, storedName));
  } catch {
    // The stored file may already be missing; the database record is the
    // source of truth for the delete operation.
  }
}

export class FilesService {
  async upload(
    user: User,
    files: Array<Express.Multer.File>,
  ): Promise<SafeFileDto[]> {
    const records = await Promise.all(
      files.map(async (file) => {
        const buffer = await fs.readFile(file.path);
        const extension = path
          .extname(file.originalname)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const extractedText = await extractText({
          buffer,
          mimeType: file.mimetype,
          extension,
        });

        const record = await prisma.file.create({
          data: {
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            extension,
            url: `/uploads/${file.filename}`,
            extractedText,
            userId: user.id,
          },
        });
        return record;
      }),
    );

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

  async getById(user: User, fileId: string): Promise<FileDetailDto> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, deletedAt: null },
    });
    if (!file) {
      throw new NotFoundError('File not found');
    }
    this.assertCanAccess(file, user.id, user.role);
    return toFileDetailDto(file);
  }

  async delete(user: User, fileId: string): Promise<{ message: string }> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, deletedAt: null },
    });
    if (!file) {
      throw new NotFoundError('File not found');
    }
    this.assertCanAccess(file, user.id, user.role);

    await removeStoredFile(file.storedName);
    await prisma.file.delete({ where: { id: fileId } });
    return { message: 'File deleted successfully' };
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

  async adminDelete(fileId: string): Promise<{ message: string }> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, deletedAt: null },
    });
    if (!file) {
      throw new NotFoundError('File not found');
    }

    await removeStoredFile(file.storedName);
    await prisma.file.delete({ where: { id: fileId } });
    return { message: 'File deleted successfully' };
  }

  private assertCanAccess(file: File, userId: string, role: Role): void {
    if (file.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenError('You do not have access to this file');
    }
  }
}
