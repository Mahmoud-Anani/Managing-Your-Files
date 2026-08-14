"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminListFilesQuery,
  AdminStats,
  FileDetailDto,
  ListFilesQuery,
  ListUsersQuery,
  PaginatedResult,
  SafeFileDto,
  SafeUserDto,
  UserStats,
} from "@/types";

export const queryKeys = {
  userStats: (days: number) => ["user-stats", days] as const,
  files: (query: ListFilesQuery) => ["files", query] as const,
  file: (id: string) => ["file", id] as const,
  adminStats: () => ["admin-stats"] as const,
  adminFiles: (query: AdminListFilesQuery) => ["admin-files", query] as const,
  users: (query: ListUsersQuery) => ["users", query] as const,
};

export function useUserStats(days = 7) {
  return useQuery({
    queryKey: queryKeys.userStats(days),
    queryFn: async () => {
      const { data } = await api.get<UserStats>("/stats/user", {
        params: { days },
      });
      return data;
    },
  });
}

export function useFiles(query: ListFilesQuery) {
  return useQuery({
    queryKey: queryKeys.files(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<SafeFileDto>>(
        "/files",
        { params: query },
      );
      return data;
    },
  });
}

export function useFile(id: string) {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: async () => {
      const { data } = await api.get<FileDetailDto>(`/files/${id}`);
      return data;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats(),
    queryFn: async () => {
      const { data } = await api.get<AdminStats>("/stats/admin");
      return data;
    },
  });
}

export function useAdminFiles(query: AdminListFilesQuery) {
  return useQuery({
    queryKey: queryKeys.adminFiles(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<SafeFileDto>>(
        "/admin/files",
        { params: query },
      );
      return data;
    },
  });
}

export function useUsers(query: ListUsersQuery) {
  return useQuery({
    queryKey: queryKeys.users(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<SafeUserDto>>(
        "/users",
        { params: query },
      );
      return data;
    },
  });
}
