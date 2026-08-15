import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { AuthService } from './auth.service';
import type { AuditContext } from '../audit/audit.service';
import type {
  LoginDto,
  RegisterDto,
  ResendCodeDto,
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
}
