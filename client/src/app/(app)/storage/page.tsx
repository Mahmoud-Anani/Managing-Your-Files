"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, FileText, Database } from "lucide-react";
import { api, formatBytes, formatDate } from "@/lib/api";
import type { UserStats, SafeFileDto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-emerald-500",
];

function StorageBar({ typeBreakdown }: { typeBreakdown: UserStats["typeBreakdown"] }) {
  const total = typeBreakdown.reduce((sum, t) => sum + t.sizeBytes, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {typeBreakdown.map((t, i) => (
          <div
            key={t.extension}
            className={`${COLORS[i % COLORS.length]} transition-all`}
            style={{ width: `${(t.sizeBytes / total) * 100}%` }}
            title={`${t.extension}: ${formatBytes(t.sizeBytes)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {typeBreakdown.map((t, i) => (
          <div key={t.extension} className="flex items-center gap-2 text-sm">
            <span
              className={`size-3 rounded-sm ${COLORS[i % COLORS.length]}`}
            />
            <span className="text-muted-foreground">.{t.extension}</span>
            <span className="font-medium">{formatBytes(t.sizeBytes)}</span>
            <span className="text-muted-foreground">({t.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoragePage() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<UserStats>({
    queryKey: ["stats", "user"],
    queryFn: async () => {
      const { data } = await api.get<UserStats>("/stats/user");
      return data;
    },
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<SafeFileDto[]>({
    queryKey: ["files", "all-for-storage"],
    queryFn: async () => {
      const { data } = await api.get<{ data: SafeFileDto[]; pagination: { total: number } }>(
        "/files?limit=100&sortBy=size&sortOrder=desc"
      );
      return data.data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("storage.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("storage.subtitle")}
        </p>
      </div>

      {statsError ? (
        <Alert variant="error">{t("common.errorGeneric")}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{t("storage.totalFiles")}</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="font-display text-2xl font-semibold">{stats?.totalFiles ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{t("storage.totalStorage")}</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-7 w-20" />
              ) : (
                <p className="font-display text-2xl font-semibold">
                  {formatBytes(stats?.totalStorageBytes ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            {t("storage.storageByType")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("storage.storageByTypeDescription")}
          </p>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-full" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ) : !stats?.typeBreakdown.length ? (
            <EmptyState
              icon={<Database />}
              title={t("storage.noFiles")}
              description={t("storage.noFiles")}
            />
          ) : (
            <StorageBar typeBreakdown={stats.typeBreakdown} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("storage.largestFiles")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("storage.largestFilesDescription")}
          </p>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={t("storage.noFiles")}
              description={t("storage.noFiles")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("files.name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("files.type")}</TableHead>
                  <TableHead>{t("files.size")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("files.uploaded")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.slice(0, 10).map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                          <FileText className="size-4" />
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          {file.originalName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{file.extension}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(file.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
