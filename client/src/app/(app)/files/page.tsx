"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Trash2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { api, formatBytes, formatDate } from "@/lib/api";
import { queryKeys, useFiles } from "@/hooks/use-queries";
import type { FileSortBy, SafeFileDto, SortOrder } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 10;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FilesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState<FileSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteTarget, setDeleteTarget] = useState<SafeFileDto | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(type ? { type } : {}),
      sortBy,
      sortOrder,
    }),
    [page, search, type, sortBy, sortOrder],
  );

  const { data, isLoading, isError, refetch } = useFiles(query);

  const applySearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  /**
   * Upload files
   *
   * API:
   * POST /api/v1/files/upload
   *
   * multipart/form-data:
   * files: File[]
   */
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length === 0) {
        throw new Error(t("files.selectAtLeastOne"));
      }

      // Validate files before sending them
      for (const file of files) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          throw new Error(t("files.unsupportedType", { name: file.name }));
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            t("files.tooLarge", {
              name: file.name,
              max: MAX_FILE_SIZE / (1024 * 1024),
            }),
          );
        }
      }

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file, file.name);
      });

      /**
       * Do NOT manually set Content-Type.
       *
       * The browser will automatically generate:
       *
       * multipart/form-data; boundary=...
       */
      const response = await api.post("/files/upload", formData);

      return response.data;
    },

    onSuccess: () => {
      toast(t("files.uploadSuccess"), "success");

      setUploadError(null);

      queryClient.invalidateQueries({
        queryKey: ["user-stats"],
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.files(query),
      });
    },

    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("files.uploadFailed");

      setUploadError(message);
      toast(message, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/files/${id}`);
    },

    onSuccess: () => {
      toast(t("files.deleted"), "success");

      queryClient.invalidateQueries({
        queryKey: ["user-stats"],
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.files(query),
      });
    },

    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.deleteFailed"),
        "error",
      );
    },
  });

  const handleUpload = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    uploadMutation.mutate(files, {
      onSettled: () => {
        setUploading(false);
      },
    });
  };

  const toggleSort = (column: FileSortBy) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "name" || column === "size" ? "asc" : "desc");
    }

    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("files.title")}
        </h1>

        <p className="text-sm text-muted-foreground">{t("files.subtitle")}</p>
      </div>

      {/* Upload */}
      <UploadCard
        uploading={uploading || uploadMutation.isPending}
        error={uploadError}
        onUpload={handleUpload}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch();
                  }
                }}
                placeholder={t("files.searchPlaceholder")}
                className="ps-9"
              />
            </div>

            <Input
              value={type}
              onChange={(event) => {
                setType(event.target.value.trim());
                setPage(1);
              }}
              placeholder={t("files.typePlaceholder")}
              className="sm:w-36"
            />

            <Button variant="outline" onClick={applySearch}>
              {t("common.search")}
            </Button>
          </div>

          {/* Error */}
          {isError ? (
            <Alert variant="error" className="mt-4">
              {t("files.loadError")}{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => refetch()}
              >
                {t("common.retry")}
              </button>
            </Alert>
          ) : null}

          {/* Files */}
          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : !data || data.data.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-6" />}
                title={t("files.noFilesFound")}
                description={
                  search || type
                    ? t("files.adjustFilters")
                    : t("files.uploadFirstFile")
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHead
                        label={t("files.name")}
                        active={sortBy === "name"}
                        order={sortOrder}
                        onClick={() => toggleSort("name")}
                      />

                      <TableHead className="hidden md:table-cell">
                        {t("files.type")}
                      </TableHead>

                      <SortableHead
                        label={t("files.size")}
                        active={sortBy === "size"}
                        order={sortOrder}
                        onClick={() => toggleSort("size")}
                      />

                      <SortableHead
                        label={t("files.uploaded")}
                        active={sortBy === "createdAt"}
                        order={sortOrder}
                        onClick={() => toggleSort("createdAt")}
                      />

                      <TableHead className="text-right">
                        {t("files.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.data.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="max-w-[280px]">
                          <Link
                            href={`/files/${file.id}`}
                            className="block truncate font-medium text-primary hover:underline"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </Link>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{file.extension}</Badge>
                        </TableCell>

                        <TableCell>{formatBytes(file.size)}</TableCell>

                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(file.createdAt)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("files.deleteLabel", {
                              name: file.originalName,
                            })}
                            onClick={() => setDeleteTarget(file)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  className="mt-4"
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  total={data.pagination.total}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={t("files.deleteTitle")}
        description={t("files.deleteConfirm", {
          name: deleteTarget?.originalName,
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            return deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}

/**
 * Upload Card
 */
function UploadCard({
  uploading,
  error,
  onUpload,
}: {
  uploading: boolean;
  error: string | null;
  onUpload: (files: File[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImageIcon className="size-6" />
        </div>

        <div>
          <p className="text-sm font-medium">{t("files.uploadFiles")}</p>

          <p className="text-sm text-muted-foreground">
            {t("files.uploadHint")}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {t("files.maxSizeHint", { max: MAX_FILE_SIZE / (1024 * 1024) })}
          </p>
        </div>

        <label>
          <span className="sr-only">{t("files.chooseFilesToUpload")}</span>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              // Take a stable snapshot of the FileList *before* the input
              // is reset below — FileList is live and tied to the input,
              // so resetting it first would leave us with an empty array
              // by the time the async mutation actually runs.
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              onUpload(files);
            }}
          />

          <span
            className={[
              "inline-flex h-10 items-center justify-center rounded-md",
              "bg-primary px-6 text-sm font-medium",
              "text-primary-foreground",
              "transition-opacity hover:opacity-90",
              uploading
                ? "pointer-events-none cursor-not-allowed opacity-50"
                : "cursor-pointer",
            ].join(" ")}
          >
            <UploadCloud className="me-2 size-4" />

            {uploading ? t("common.uploading") : t("common.chooseFiles")}
          </span>
        </label>

        {error ? (
          <Alert variant="error" className="mt-1">
            {error}
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Sortable Table Header
 */
function SortableHead({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={
          active
            ? "flex items-center gap-1 font-medium text-foreground"
            : "flex items-center gap-1 hover:text-foreground"
        }
      >
        {label}

        <span className="text-[10px] text-muted-foreground">
          {active ? (order === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </TableHead>
  );
}
