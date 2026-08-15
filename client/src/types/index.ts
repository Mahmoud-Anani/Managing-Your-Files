export type Role = "USER" | "ADMIN";

export interface SafeUserDto {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: SafeUserDto;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface SafeFileDto {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  extension: string;
  url: string;
  userId: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface FileDetailDto extends SafeFileDto {
  extractedText: string | null;
}

export interface AuditLogDto {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  search?: string;
}

export interface TypeStat {
  extension: string;
  count: number;
  sizeBytes: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface UserStats {
  totalFiles: number;
  totalStorageBytes: number;
  typeBreakdown: TypeStat[];
  dailyUploads: DailyStat[];
}

export interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalStorageBytes: number;
  mostUploadedTypes: TypeStat[];
  recentUploads: SafeFileDto[];
}

export type SortOrder = "asc" | "desc";
export type UserSortBy = "createdAt" | "name" | "email";
export type FileSortBy = "createdAt" | "name" | "size";

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  sortBy?: UserSortBy;
  sortOrder?: SortOrder;
}

export interface ListFilesQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sortBy?: FileSortBy;
  sortOrder?: SortOrder;
}

export interface AdminListFilesQuery extends ListFilesQuery {
  userId?: string;
}

export interface SharedFileDto {
  id: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    extension: string;
    url: string;
    createdAt: string;
  };
  sharedBy: { id: string; name: string; email: string };
  sharedWith: { id: string; name: string; email: string };
  permission: "VIEW" | "EDIT";
  createdAt: string;
}
