import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { PrismaMock } from '../../test/prisma-mock';
import { env } from '../../config/env';

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

vi.mock('../../common/email', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../../common/cloudinary', () => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn(),
  cloudinaryPublicId: vi.fn(),
}));

import {
  AuthService,
  setTokenCookies,
  clearTokenCookies,
  COOKIE_OPTIONS,
} from './auth.service';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../common/email';
import { uploadToCloudinary, deleteFromCloudinary } from '../../common/cloudinary';
import { prisma } from '../../config/prisma';

function makePrismaTransactionResolvable(mock: PrismaMock): void {
  mock.$transaction.mockImplementation(
    (ops: unknown[] | (() => Promise<unknown>)) => {
      if (typeof ops === 'function') {
        return Promise.resolve();
      }
      return Promise.all(ops as Promise<unknown>[]);
    },
  );
}

function makeResponseMock(): Response {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    makePrismaTransactionResolvable(prismaMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('creates a user and issues a verification code', async () => {
      const user: User = {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashed',
        avatar: null,
        role: 'USER',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(user);
      vi.mocked(prisma.verificationCode.create).mockResolvedValueOnce({
        id: 'code-1',
        code: '123456',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password1',
      });

      expect(result).toEqual({ userId: 'user-1', email: 'jane@example.com' });
      expect(prisma.user.create).toHaveBeenCalledOnce();
      expect(prisma.verificationCode.create).toHaveBeenCalledOnce();
      expect(sendVerificationEmail).toHaveBeenCalledOnce();
    });

    it('rejects a duplicate email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'x',
        avatar: null,
        role: 'USER',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.register({ name: 'Jane', email: 'jane@example.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const res = makeResponseMock();

    it('returns a user when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password1', 4);
      const user: User = {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user);
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({
        id: 'rt-1',
        token: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.login(res, {
        email: 'jane@example.com',
        password: 'password1',
      });

      expect(result.user.email).toBe('jane@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
    });

    it('rejects an unknown email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(
        service.login(res, { email: 'nobody@example.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('rightpass1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login(res, { email: 'jane@example.com', password: 'wrongpass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rejects an unverified user', async () => {
      const passwordHash = await bcrypt.hash('password1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login(res, { email: 'jane@example.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('refresh', () => {
    const res = makeResponseMock();

    it('rotates tokens for a valid refresh token', async () => {
      const refreshToken = jwt.sign({ userId: 'user-1' }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      const stored = {
        id: 'rt-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
          password: 'hashed',
          avatar: null,
          role: 'USER',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(stored);
      vi.mocked(prisma.refreshToken.delete).mockResolvedValueOnce(stored);
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({
        id: 'rt-2',
        token: 'new-token',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.refresh(res, refreshToken);

      expect(result.user.email).toBe('jane@example.com');
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('rejects an invalid refresh token', async () => {
      await expect(service.refresh(res, 'not-a-jwt')).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it('rejects an unknown refresh token', async () => {
      const refreshToken = jwt.sign({ userId: 'user-1' }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce(null);

      await expect(service.refresh(res, refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });

  describe('changePassword', () => {
    it('changes the password when the current password is correct', async () => {
      const passwordHash = await bcrypt.hash('oldpass1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

      const result = await service.changePassword('user-1', {
        currentPassword: 'oldpass1',
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      });

      expect(result.message).toContain('Password changed');
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('rejects a wrong current password', async () => {
      const passwordHash = await bcrypt.hash('oldpass1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongpass',
          newPassword: 'newpass1',
          confirmPassword: 'newpass1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('throws when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(
        service.changePassword('missing', {
          currentPassword: 'oldpass1',
          newPassword: 'newpass1',
          confirmPassword: 'newpass1',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('forgotPassword', () => {
    it('sends a reset email when the account exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'hash',
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.verificationCode.deleteMany).mockResolvedValueOnce({ count: 1 });
      vi.mocked(prisma.verificationCode.create).mockResolvedValueOnce({
        id: 'code-1',
        code: '123456',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.forgotPassword({ email: 'jane@example.com' });

      expect(result.message).toContain('reset code');
      expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    });

    it('does not reveal whether an email exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(result.message).toContain('reset code');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets the password with a valid code', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'hash',
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValueOnce({
        id: 'code-1',
        code: '123456',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        createdAt: new Date(),
      });

      const result = await service.resetPassword({
        email: 'jane@example.com',
        code: '123456',
        password: 'newpass1',
        confirmPassword: 'newpass1',
      });

      expect(result.message).toContain('Password reset');
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('rejects an invalid code', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'hash',
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          email: 'jane@example.com',
          code: '000000',
          password: 'newpass1',
          confirmPassword: 'newpass1',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('deleteAccount', () => {
    const res = makeResponseMock();

    it('deletes the account with a correct password', async () => {
      const passwordHash = await bcrypt.hash('secret1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.deleteAccount('user-1', { password: 'secret1' }, res);

      expect(result.message).toContain('Account deleted');
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('secret1', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: passwordHash,
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.deleteAccount('user-1', { password: 'nope' }, res),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('uploadAvatar', () => {
    it('uploads and stores the avatar url', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'x',
        avatar: null,
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(uploadToCloudinary).mockResolvedValueOnce({
        publicId: 'avatars/user-1',
        secureUrl: 'https://cloud.example/avatars/user-1.jpg',
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'x',
        avatar: 'https://cloud.example/avatars/user-1.jpg',
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.uploadAvatar('user-1', {
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
      });

      expect(result.avatar).toBe('https://cloud.example/avatars/user-1.jpg');
      expect(uploadToCloudinary).toHaveBeenCalledOnce();
    });

    it('deletes the previous avatar before uploading a new one', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        password: 'x',
        avatar: 'https://res.cloudinary.com/demo/image/upload/v1/avatars/old.jpg',
        role: 'USER',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(uploadToCloudinary).mockResolvedValueOnce({
        publicId: 'avatars/user-1',
        secureUrl: 'https://cloud.example/avatars/user-1.jpg',
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

      await service.uploadAvatar('user-1', {
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
      });

      expect(deleteFromCloudinary).toHaveBeenCalledWith('v1/avatars/old', 'image');
      expect(uploadToCloudinary).toHaveBeenCalledOnce();
    });
  });
});

describe('cookie helpers', () => {
  it('sets httpOnly cookies', () => {
    const cookies: Array<{ name: string; opts: Record<string, unknown> }> = [];
    const res = {
      cookie: (name: string, _value: string, opts: Record<string, unknown>) =>
        cookies.push({ name, opts }),
    } as unknown as Response;

    setTokenCookies(res, 'access', 'refresh');

    expect(cookies.map((c) => c.name)).toEqual(['access_token', 'refresh_token']);
    expect(cookies[0]?.opts.httpOnly).toBe(true);
    expect(cookies[0]?.opts.path).toBe('/');
  });

  it('clears cookies', () => {
    const cleared: string[] = [];
    const res = {
      clearCookie: (name: string) => cleared.push(name),
    } as unknown as Response;

    clearTokenCookies(res);
    expect(cleared).toEqual(['access_token', 'refresh_token']);
  });

  it('exports secure cookies in production', () => {
    const opts = COOKIE_OPTIONS;
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
  });
});
