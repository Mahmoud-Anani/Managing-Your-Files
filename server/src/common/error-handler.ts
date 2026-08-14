import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './errors';
import { isZodError } from './async-handler';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error?: string;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorName: string | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorName = error.name;
  } else if (isZodError(error)) {
    statusCode = 400;
    message = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    errorName = 'ValidationError';
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    statusCode = 409;
    message = 'A record with this value already exists';
    errorName = 'ConflictError';
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    statusCode = 404;
    message = 'Record not found';
    errorName = 'NotFoundError';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  const body: ErrorResponseBody = { statusCode, message };
  if (errorName) {
    body.error = errorName;
  }

  res.status(statusCode).json(body);
}
