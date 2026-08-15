import { Router, type Request } from 'express';
import { asyncHandler, validateBody } from '../../common/async-handler';
import { authGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import {
  loginSchema,
  registerSchema,
  resendCodeSchema,
  verifyEmailSchema,
  type LoginDto,
  type RegisterDto,
  type ResendCodeDto,
  type VerifyEmailDto,
} from './auth.dto';
import { resendRateLimit } from './auth.middleware';

const router = Router();
const controller = new AuthController();

router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler((req: Request<unknown, unknown, RegisterDto>, res) =>
    controller.register(req, res),
  ),
);

router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  asyncHandler((req: Request<unknown, unknown, VerifyEmailDto>, res) =>
    controller.verifyEmail(req, res),
  ),
);

router.post(
  '/resend-code',
  validateBody(resendCodeSchema),
  resendRateLimit,
  asyncHandler((req: Request<unknown, unknown, ResendCodeDto>, res) =>
    controller.resendCode(req, res),
  ),
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler((req: Request<unknown, unknown, LoginDto>, res) =>
    controller.login(req, res),
  ),
);

router.post(
  '/refresh',
  asyncHandler((req, res) => controller.refresh(req, res)),
);

router.post(
  '/logout',
  asyncHandler((req, res) => controller.logout(req, res)),
);

router.get(
  '/profile',
  authGuard,
  asyncHandler((req, res) => controller.profile(req, res)),
);

export default router;
