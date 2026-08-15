import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors';
import { generateOtpCode, OTP_TTL_MS } from '../../common/otp';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../common/email';
import { toSafeUserDto, type SafeUserDto } from '../../common/user-mapper';
import { uploadToCloudinary, deleteFromCloudinary, cloudinaryPublicId } from '../../common/cloudinary';
import { AuditService, type AuditContext } from '../audit/audit.service';
import type {
  ChangePasswordDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendCodeDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './auth.dto';

const auditService = new AuditService();

interface RegisterResult {
  userId: string;
  email: string;
}

export interface AuthResponse {
  user: SafeUserDto;
}

interface AccessTokenPayload {
  userId: string;
  role: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_DAYS = 7;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setTokenCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearTokenCookies(res: Response): void {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS });
}

export class AuthService {
  async register(
    dto: RegisterDto,
    ctx?: AuditContext,
  ): Promise<RegisterResult> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      },
    });

    await this.issueVerificationCode(user.id, user.email);

    await auditService.log({
      userId: user.id,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email },
      ctx,
    });

    return { userId: user.id, email: user.email };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundError('No account found for this email');
    }
    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    const latestCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestCode || latestCode.code !== dto.code) {
      throw new ValidationError('Invalid verification code');
    }
    if (latestCode.expiresAt < new Date()) {
      throw new ValidationError('Verification code has expired');
    }

    await prisma.$transaction([
      prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendCode(dto: ResendCodeDto): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundError('No account found for this email');
    }
    if (user.isVerified) {
      throw new ValidationError('Email is already verified');
    }

    await prisma.verificationCode.deleteMany({ where: { userId: user.id } });
    await this.issueVerificationCode(user.id, user.email);

    return { message: 'Verification code sent' };
  }

  async login(
    res: Response,
    dto: LoginDto,
    ctx?: AuditContext,
  ): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (!user.isVerified) {
      throw new ValidationError(
        'Please verify your email before logging in',
      );
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    setTokenCookies(res, accessToken, refreshToken);

    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email },
      ctx,
    });

    return { user: toSafeUserDto(user) };
  }

  async refresh(
    res: Response,
    refreshToken: string,
  ): Promise<AuthResponse> {
    try {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found');
    }
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    const newAccessToken = this.signAccessToken(storedToken.user);
    const newRefreshToken = await this.createRefreshToken(storedToken.user.id);

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return { user: toSafeUserDto(storedToken.user) };
  }

  async logout(res: Response, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    clearTokenCookies(res);
  }

  async getProfile(userId: string): Promise<SafeUserDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUserDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SafeUserDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
    });

    return toSafeUserDto(updated);
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<SafeUserDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.avatar) {
      const parts = user.avatar.split('/');
      const publicIdWithExt = parts.slice(parts.indexOf('upload') + 1).join('/');
      const publicId = publicIdWithExt.replace(/\.[^.]+$/, '');
      try {
        await deleteFromCloudinary(publicId, 'image');
      } catch {
        // Previous avatar may already be gone
      }
    }

    const publicId = `managing-your-files/avatars/${userId}`;
    const result = await uploadToCloudinary({
      buffer: file.buffer,
      publicId,
      mimeType: file.mimetype,
    });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: result.secureUrl },
    });

    return toSafeUserDto(updated);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash },
      }),
    ]);

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
    res: Response,
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Password is incorrect');
    }

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.verificationCode.deleteMany({ where: { userId } }),
      prisma.file.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    clearTokenCookies(res);

    return { message: 'Account deleted successfully' };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account exists, a reset code has been sent' };
    }

    await prisma.verificationCode.deleteMany({ where: { userId: user.id } });

    const code = generateOtpCode();
    await prisma.verificationCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendPasswordResetEmail(user.email, code);

    return { message: 'If an account exists, a reset code has been sent' };
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundError('No account found for this email');
    }

    const latestCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestCode || latestCode.code !== dto.code) {
      throw new ValidationError('Invalid reset code');
    }
    if (latestCode.expiresAt < new Date()) {
      throw new ValidationError('Reset code has expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await prisma.$transaction([
      prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  private signAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    const token = jwt.sign(
      { userId, tokenVersion: Date.now() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private async issueVerificationCode(
    userId: string,
    email: string,
  ): Promise<void> {
    const code = generateOtpCode();
    await prisma.verificationCode.create({
      data: {
        code,
        userId,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await sendVerificationEmail(email, code);
  }
}
