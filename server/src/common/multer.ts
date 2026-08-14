import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { ValidationError } from './errors';

export const STORAGE_DIR = path.resolve(__dirname, '../../uploads/');
mkdirSync(STORAGE_DIR, { recursive: true });

export const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/xml',
  'application/xml',
]);

const storage = multer.diskStorage({
  destination: STORAGE_DIR,
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ValidationError(`File type ${file.mimetype} is not allowed`));
      return;
    }
    cb(null, true);
  },
});

export function handleMulterError(
  error: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File is too large (maximum ${env.MAX_FILE_SIZE_MB}MB)`
        : error.code === 'LIMIT_FILE_COUNT'
          ? `Too many files (maximum ${MAX_FILES_PER_UPLOAD})`
          : error.message;
    next(new ValidationError(message));
    return;
  }
  next(error);
}
