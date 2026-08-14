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
import { sendVerificationEmail } from '../../common/email';
import { toSafeUserDto, type SafeUserDto } from '../../common/user-mapper';
import { AuditService, type AuditContext } from '../audit/audit.service';
import type {
  LoginDto,
  RegisterDto,
  ResendCodeDto,
  VerifyEmailDto,
} from './auth.dto';

const auditService = new AuditService();

interface RegisterResult {
  userId: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: SafeUserDto;
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

  async login(dto: LoginDto, ctx?: AuditContext): Promise<AuthResponse> {
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

    const token = this.signToken(user);

    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email },
      ctx,
    });

    return { token, user: toSafeUserDto(user) };
  }

  async getProfile(userId: string): Promise<SafeUserDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUserDto(user);
  }

  private signToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
    );
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
