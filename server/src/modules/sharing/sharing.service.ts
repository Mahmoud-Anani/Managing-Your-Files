import type { Permission } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/errors';
import type { ShareFileDto, UpdateShareDto } from './sharing.dto';

export interface ShareResult {
  id: string;
  fileId: string;
  sharedWith: { id: string; name: string; email: string };
  permission: Permission;
  createdAt: Date;
}

export interface SharedFileResult {
  id: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    extension: string;
    url: string;
    createdAt: Date;
  };
  sharedBy: { id: string; name: string; email: string };
  permission: Permission;
  createdAt: Date;
}

export class SharingService {
  async shareFile(
    fileId: string,
    sharedById: string,
    dto: ShareFileDto,
  ): Promise<ShareResult> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundError('File not found');
    }
    if (file.userId !== sharedById) {
      throw new ForbiddenError('You can only share your own files');
    }

    const sharedWithUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!sharedWithUser) {
      throw new NotFoundError('User not found with this email');
    }
    if (sharedWithUser.id === sharedById) {
      throw new ForbiddenError('You cannot share a file with yourself');
    }

    const existingShare = await prisma.fileShare.findUnique({
      where: { fileId_sharedWithId: { fileId, sharedWithId: sharedWithUser.id } },
    });
    if (existingShare) {
      throw new ConflictError('File is already shared with this user');
    }

    const share = await prisma.fileShare.create({
      data: {
        fileId,
        sharedById,
        sharedWithId: sharedWithUser.id,
        permission: dto.permission,
      },
      include: { sharedWith: { select: { id: true, name: true, email: true } } },
    });

    return share;
  }

  async updateShare(
    shareId: string,
    userId: string,
    dto: UpdateShareDto,
  ): Promise<ShareResult> {
    const share = await prisma.fileShare.findUnique({ where: { id: shareId } });
    if (!share) {
      throw new NotFoundError('Share not found');
    }
    if (share.sharedById !== userId) {
      throw new ForbiddenError('You can only update shares you created');
    }

    const updated = await prisma.fileShare.update({
      where: { id: shareId },
      data: { permission: dto.permission },
      include: { sharedWith: { select: { id: true, name: true, email: true } } },
    });

    return updated;
  }

  async removeShare(shareId: string, userId: string): Promise<void> {
    const share = await prisma.fileShare.findUnique({ where: { id: shareId } });
    if (!share) {
      throw new NotFoundError('Share not found');
    }
    if (share.sharedById !== userId && share.sharedWithId !== userId) {
      throw new ForbiddenError('Not authorized to remove this share');
    }

    await prisma.fileShare.delete({ where: { id: shareId } });
  }

  async getSharedByMe(userId: string): Promise<SharedFileResult[]> {
    const shares = await prisma.fileShare.findMany({
      where: { sharedById: userId },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            extension: true,
            url: true,
            createdAt: true,
          },
        },
        sharedBy: { select: { id: true, name: true, email: true } },
        sharedWith: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async getSharedWithMe(userId: string): Promise<SharedFileResult[]> {
    const shares = await prisma.fileShare.findMany({
      where: { sharedWithId: userId },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            extension: true,
            url: true,
            createdAt: true,
          },
        },
        sharedBy: { select: { id: true, name: true, email: true } },
        sharedWith: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async getShareById(shareId: string): Promise<ShareResult | null> {
    return prisma.fileShare.findUnique({
      where: { id: shareId },
      include: { sharedWith: { select: { id: true, name: true, email: true } } },
    });
  }
}
