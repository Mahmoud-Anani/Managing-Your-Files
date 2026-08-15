import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { ValidationError } from '../../common/errors';
import { AuthService } from './auth.service';
import type { AuditContext } from '../audit/audit.service';
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

const authService = new AuthService();

function auditContextFrom(req: Request): AuditContext {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export class AuthController {
  async register(
    req: Request<unknown, unknown, RegisterDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.register(
      req.body,
      auditContextFrom(req as Request),
    );
    res.status(201).json(result);
  }

  async verifyEmail(
    req: Request<unknown, unknown, VerifyEmailDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.verifyEmail(req.body);
    res.json(result);
  }

  async resendCode(
    req: Request<unknown, unknown, ResendCodeDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.resendCode(req.body);
    res.json(result);
  }

  async login(
    req: Request<unknown, unknown, LoginDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.login(
      res,
      req.body,
      auditContextFrom(req as Request),
    );
    res.json(result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }
    const result = await authService.refresh(res, refreshToken);
    res.json(result);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token;
    await authService.logout(res, refreshToken);
    res.json({ message: 'Logged out successfully' });
  }

  async profile(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const result = await authService.getProfile(user.id);
    res.json(result);
  }

  async updateProfile(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);
    const result = await authService.updateProfile(user.id, req.body as UpdateProfileDto);
    res.json(result);
  }

  async uploadAvatar(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    const result = await authService.uploadAvatar(user.id, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });
    res.json(result);
  }

  async changePassword(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);
    const result = await authService.changePassword(user.id, req.body as ChangePasswordDto);
    res.json(result);
  }

  async deleteAccount(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);
    const result = await authService.deleteAccount(user.id, req.body as DeleteAccountDto, res);
    res.json(result);
  }

  async forgotPassword(
    req: Request<unknown, unknown, ForgotPasswordDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  }

  async resetPassword(
    req: Request<unknown, unknown, ResetPasswordDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  }
}
