import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { AuthService } from './auth.service';
import type {
  LoginDto,
  RegisterDto,
  ResendCodeDto,
  VerifyEmailDto,
} from './auth.dto';

const authService = new AuthService();

export class AuthController {
  async register(
    req: Request<unknown, unknown, RegisterDto>,
    res: Response,
  ): Promise<void> {
    const result = await authService.register(req.body);
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
    const result = await authService.login(req.body);
    res.json(result);
  }

  async profile(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const result = await authService.getProfile(user.id);
    res.json(result);
  }
}
