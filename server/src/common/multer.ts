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

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  // Documents
  'pdf',
  'doc',
  'docx',
  'odt',
  'rtf',
  // Spreadsheets
  'xls',
  'xlsx',
  // Presentations
  'ppt',
  'pptx',
  // Text & data
  'txt',
  'md',
  'markdown',
  'csv',
  'html',
  'htm',
  'xml',
  'yaml',
  'yml',
  'json',
  'log',
]);

function extensionOf(originalName: string): string {
  return originalName.split('.').pop()?.toLowerCase() ?? '';
}

const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  // Spreadsheets
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Presentations
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text & data
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  xml: 'text/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  json: 'application/json',
  log: 'text/plain',
};

/**
 * Browsers sometimes send an empty or inaccurate MIME type (e.g.
 * `application/octet-stream` for `.md`/`.svg`). When that happens, fall back
 * to a canonical type derived from the file extension so preview, download and
 * Cloudinary resource-type selection keep working.
 */
export function normalizeMimeType(
  originalName: string,
  reportedMime: string,
): string {
  const trimmed = reportedMime.trim().toLowerCase();
  if (
    trimmed !== '' &&
    trimmed !== 'application/octet-stream' &&
    trimmed !== 'application/unknown'
  ) {
    return trimmed;
  }
  return EXTENSION_TO_MIME[extensionOf(originalName)] ?? reportedMime;
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter: (_req, file, cb) => {
    const ext = extensionOf(file.originalname);
    const allowed = ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTENSIONS.has(ext);
    if (!allowed) {
      cb(new ValidationError(`File type ${file.mimetype || ext || 'unknown'} is not allowed`));
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
