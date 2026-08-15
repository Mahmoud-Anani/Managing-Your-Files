import { Router, type Request } from 'express';
import multer from 'multer';
import { asyncHandler, validateBody } from '../../common/async-handler';
import { authGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendCodeSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  type ChangePasswordDto,
  type DeleteAccountDto,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterDto,
  type ResendCodeDto,
  type ResetPasswordDto,
  type UpdateProfileDto,
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

router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  resendRateLimit,
  asyncHandler((req: Request<unknown, unknown, ForgotPasswordDto>, res) =>
    controller.forgotPassword(req, res),
  ),
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler((req: Request<unknown, unknown, ResetPasswordDto>, res) =>
    controller.resetPassword(req, res),
  ),
);

router.get(
  '/profile',
  authGuard,
  asyncHandler((req, res) => controller.profile(req, res)),
);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post(
  '/avatar',
  authGuard,
  avatarUpload.single('avatar'),
  asyncHandler((req, res) => controller.uploadAvatar(req, res)),
);

router.put(
  '/profile',
  authGuard,
  validateBody(updateProfileSchema),
  asyncHandler((req, res) =>
    controller.updateProfile(req, res),
  ),
);

router.put(
  '/password',
  authGuard,
  validateBody(changePasswordSchema),
  asyncHandler((req, res) =>
    controller.changePassword(req, res),
  ),
);

router.delete(
  '/account',
  authGuard,
  validateBody(deleteAccountSchema),
  asyncHandler((req, res) =>
    controller.deleteAccount(req, res),
  ),
);

export default router;
