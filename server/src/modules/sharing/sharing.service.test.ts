import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Permission } from '@prisma/client';
import type { PrismaMock } from '../../test/prisma-mock';
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors';

const prismaMock = vi.hoisted((): PrismaMock => {
  const fn = () => vi.fn();
  return {
    user: {
      findUnique: fn(),
      findFirst: fn(),
      findMany: fn(),
      create: fn(),
      update: fn(),
      delete: fn(),
      deleteMany: fn(),
    },
    verificationCode: {
      findFirst: fn(),
      findMany: fn(),
      create: fn(),
      delete: fn(),
      deleteMany: fn(),
    },
    refreshToken: {
      findUnique: fn(),
      create: fn(),
      delete: fn(),
      deleteMany: fn(),
    },
    file: {
      findUnique: fn(),
      findMany: fn(),
      create: fn(),
      update: fn(),
      delete: fn(),
      deleteMany: fn(),
    },
    fileShare: {
      findUnique: fn(),
      findFirst: fn(),
      findMany: fn(),
      create: fn(),
      update: fn(),
      delete: fn(),
      deleteMany: fn(),
    },
    auditLog: { create: fn(), deleteMany: fn() },
    stats: {},
    $transaction: fn(),
    $use: fn(),
    $connect: fn(),
    $disconnect: fn(),
  };
});

vi.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import { SharingService } from './sharing.service';
import { prisma } from '../../config/prisma';

function makeFile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'file-1',
    userId: 'owner-1',
    originalName: 'report.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    extension: 'pdf',
    url: 'https://cloud.example/report.pdf',
    cloudinaryPublicId: 'report.pdf',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'other-1',
    name: 'Bob',
    email: 'bob@example.com',
    password: 'hash',
    avatar: null,
    role: 'USER',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SharingService', () => {
  let service: SharingService;

  beforeEach(() => {
    service = new SharingService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('shareFile', () => {
    it('creates a share for an owned file', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(makeFile() as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeUser() as never);
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.fileShare.create).mockResolvedValueOnce({
        id: 'share-1',
        fileId: 'file-1',
        sharedById: 'owner-1',
        sharedWithId: 'other-1',
        permission: Permission.VIEW,
        createdAt: new Date(),
        sharedWith: { id: 'other-1', name: 'Bob', email: 'bob@example.com' },
      } as never);

      const result = await service.shareFile('file-1', 'owner-1', {
        email: 'bob@example.com',
        permission: Permission.VIEW,
      });

      expect(result.id).toBe('share-1');
      expect(prisma.fileShare.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'file-1',
            sharedById: 'owner-1',
            sharedWithId: 'other-1',
            permission: Permission.VIEW,
          }),
        }),
      );
    });

    it('throws NotFound when file does not exist', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(null);
      await expect(
        service.shareFile('missing', 'owner-1', {
          email: 'bob@example.com',
          permission: Permission.VIEW,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFound for a deleted file', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(
        makeFile({ deletedAt: new Date() }) as never,
      );
      await expect(
        service.shareFile('file-1', 'owner-1', {
          email: 'bob@example.com',
          permission: Permission.VIEW,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws Forbidden when sharing someone elses file', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(makeFile() as never);
      await expect(
        service.shareFile('file-1', 'stranger-1', {
          email: 'bob@example.com',
          permission: Permission.VIEW,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws NotFound when the target user does not exist', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(makeFile() as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(
        service.shareFile('file-1', 'owner-1', {
          email: 'nobody@example.com',
          permission: Permission.VIEW,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws Forbidden when sharing with yourself', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(makeFile() as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
        makeUser({ id: 'owner-1', email: 'owner-1@example.com' }) as never,
      );
      await expect(
        service.shareFile('file-1', 'owner-1', {
          email: 'owner-1@example.com',
          permission: Permission.VIEW,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws Conflict when already shared', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(makeFile() as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeUser() as never);
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce({
        id: 'share-1',
      } as never);

      await expect(
        service.shareFile('file-1', 'owner-1', {
          email: 'bob@example.com',
          permission: Permission.EDIT,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('updateShare', () => {
    it('updates the permission of an owned share', async () => {
      const share = {
        id: 'share-1',
        fileId: 'file-1',
        sharedById: 'owner-1',
        sharedWithId: 'other-1',
        permission: Permission.VIEW,
        createdAt: new Date(),
      };
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce(share as never);
      vi.mocked(prisma.fileShare.update).mockResolvedValueOnce({
        ...share,
        permission: Permission.EDIT,
        sharedWith: { id: 'other-1', name: 'Bob', email: 'bob@example.com' },
      } as never);

      const result = await service.updateShare('share-1', 'owner-1', {
        permission: Permission.EDIT,
      });

      expect(result.permission).toBe(Permission.EDIT);
    });

    it('throws NotFound for an unknown share', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce(null);
      await expect(
        service.updateShare('missing', 'owner-1', { permission: Permission.EDIT }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws Forbidden when not the creator', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce({
        id: 'share-1',
        sharedById: 'owner-1',
      } as never);
      await expect(
        service.updateShare('share-1', 'other-1', { permission: Permission.EDIT }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('removeShare', () => {
    it('removes a share created by the user', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce({
        id: 'share-1',
        sharedById: 'owner-1',
        sharedWithId: 'other-1',
      } as never);
      vi.mocked(prisma.fileShare.delete).mockResolvedValueOnce({} as never);

      await expect(service.removeShare('share-1', 'owner-1')).resolves.toBeUndefined();
      expect(prisma.fileShare.delete).toHaveBeenCalledWith({ where: { id: 'share-1' } });
    });

    it('removes a share received by the user', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce({
        id: 'share-1',
        sharedById: 'owner-1',
        sharedWithId: 'other-1',
      } as never);
      vi.mocked(prisma.fileShare.delete).mockResolvedValueOnce({} as never);

      await expect(service.removeShare('share-1', 'other-1')).resolves.toBeUndefined();
    });

    it('throws Forbidden for an unrelated user', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce({
        id: 'share-1',
        sharedById: 'owner-1',
        sharedWithId: 'other-1',
      } as never);

      await expect(service.removeShare('share-1', 'stranger-1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('throws NotFound for an unknown share', async () => {
      vi.mocked(prisma.fileShare.findUnique).mockResolvedValueOnce(null);
      await expect(service.removeShare('missing', 'owner-1')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('getSharedByMe / getSharedWithMe', () => {
    it('queries shares by the given user', async () => {
      vi.mocked(prisma.fileShare.findMany).mockResolvedValueOnce([]);
      await service.getSharedByMe('owner-1');
      expect(prisma.fileShare.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sharedById: 'owner-1' } }),
      );
    });

    it('queries shares shared with the user', async () => {
      vi.mocked(prisma.fileShare.findMany).mockResolvedValueOnce([]);
      await service.getSharedWithMe('other-1');
      expect(prisma.fileShare.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sharedWithId: 'other-1' } }),
      );
    });
  });
});
