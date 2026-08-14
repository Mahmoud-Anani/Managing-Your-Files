import type { File } from '@prisma/client';

export interface SafeFileDto {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  extension: string;
  url: string;
  userId: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface FileDetailDto extends SafeFileDto {
  extractedText: string | null;
}

export function toSafeFileDto(file: File): SafeFileDto {
  return {
    id: file.id,
    originalName: file.originalName,
    storedName: file.storedName,
    mimeType: file.mimeType,
    size: file.size,
    extension: file.extension,
    url: file.url,
    userId: file.userId,
    createdAt: file.createdAt,
    deletedAt: file.deletedAt,
  };
}

export function toFileDetailDto(file: File): FileDetailDto {
  return {
    ...toSafeFileDto(file),
    extractedText: file.extractedText,
  };
}
