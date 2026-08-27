"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileStack, Search, Trash2 } from "lucide-react";
import { api, formatBytes, formatDate } from "@/lib/api";
import { useAdminFiles } from "@/hooks/use-queries";
import type {
  AdminListFilesQuery,
  FileSortBy,
  SafeFileDto,
  SafeUserDto,
  SortOrder,
} from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  "pdf",
  "docx",
  "doc",
  "txt",
  "md",
  "csv",
  "json",
  "xlsx",
  "xls",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
];

export default function AdminFilesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState<FileSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteTarget, setDeleteTarget] = useState<SafeFileDto | null>(null);

  const query = useMemo<AdminListFilesQuery>(
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

  const { data, isLoading, isError, refetch } = useAdminFiles(query);

  const { data: userPages } = useQuery({
    queryKey: ["admin-files-users-map"],
    queryFn: async () => {
      const { data } = await api.get<{ data: SafeUserDto[] }>("/users", {
        params: { limit: 100, page: 1 },
      });
      return data;
    },
  });

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of userPages?.data ?? []) {
      map.set(user.id, user.name);
    }
    return map;
  }, [userPages]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-files"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/files/${id}`);
    },
    onSuccess: () => {
      toast(t("files.deleted"), "success");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("common.errorGeneric"),
        "error",
      );
    },
  });

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("privacy.filesTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("privacy.filesSubtitle")}
        </p>
      </div>

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
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("files.typePlaceholder")}</option>
              {TYPE_OPTIONS.map((ext) => (
                <option key={ext} value={ext}>
                  .{ext}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={applySearch}>
              {t("common.search")}
            </Button>
          </div>

          {isError ? (
            <Alert variant="error" className="mt-4">
              {t("privacy.filesLoadError")}{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => refetch()}
              >
                {t("common.retry")}
              </button>
            </Alert>
          ) : null}

          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : !data || data.data.length === 0 ? (
              <EmptyState
                icon={<FileStack className="size-6" />}
                title={t("privacy.noFilesFound")}
                description={t("files.adjustFilters")}
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
                      <TableHead>{t("common.owner")}</TableHead>
                      <TableHead>{t("files.type")}</TableHead>
                      <SortableHead
                        label={t("files.size")}
                        active={sortBy === "size"}
                        order={sortOrder}
                        onClick={() => toggleSort("size")}
                      />
                      <SortableHead
                        label={t("files.uploadedOn")}
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
                        <TableCell className="max-w-60">
                          <Link
                            href={`/admin/files/${file.id}`}
                            className="block truncate font-medium text-primary hover:underline"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {ownerNameById.get(file.userId) ?? "—"}
                        </TableCell>
                        <TableCell>{file.extension.toUpperCase()}</TableCell>
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
