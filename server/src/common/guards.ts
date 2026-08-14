import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ForbiddenError, UnauthorizedError } from './errors';
import type { ExpressMiddleware } from './async-handler';

interface JwtPayload {
  userId: string;
}

export function getAuthUser(req: Request): User {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
    return;
  }

  prisma.user
    .findUnique({ where: { id: payload.userId } })
    .then((user) => {
      if (!user) {
        next(new UnauthorizedError('User account no longer exists'));
        return;
      }
      req.user = user;
      next();
    })
    .catch(() => {
      next(new UnauthorizedError('User account no longer exists'));
    });
}

export function roleGuard(...allowedRoles: Role[]): ExpressMiddleware {
  return (req, _res, next) => {
    const user = getAuthUser(req);
    if (!allowedRoles.includes(user.role)) {
      next(
        new ForbiddenError('You do not have permission to perform this action'),
      );
      return;
    }
    next();
  };
}
