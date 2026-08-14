import type { NextFunction, Request, Response } from 'express';
import { RESEND_COOLDOWN_MS } from '../../common/otp';
import { ValidationError } from '../../common/errors';

const lastResendAt = new Map<string, number>();

export function resendRateLimit(
  req: Request<unknown, unknown, { email: string }>,
  _res: Response,
  next: NextFunction,
): void {
  const email = req.body.email;
  if (!email) {
    next(new ValidationError('Email is required'));
    return;
  }

  const now = Date.now();
  const lastSent = lastResendAt.get(email);
  if (lastSent !== undefined) {
    const remainingMs = RESEND_COOLDOWN_MS - (now - lastSent);
    if (remainingMs > 0) {
      next(
        new ValidationError(
          `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another code`,
        ),
      );
      return;
    }
  }

  lastResendAt.set(email, now);
  next();
}
