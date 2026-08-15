import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { ValidationError } from './errors';

export const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Presentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text & data
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/xml',
  'text/yaml',
  'application/json',
  'application/xml',
  'application/x-yaml',
]);

const storage = multer.memoryStorage();

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
