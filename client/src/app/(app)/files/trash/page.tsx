"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { api, formatDate } from "@/lib/api";
import { queryKeys, useTrash } from "@/hooks/use-queries";
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

export default function FilesTrashPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<FileSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [purgeTarget, setPurgeTarget] = useState<SafeFileDto | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      sortBy,
      sortOrder,
    }),
    [page, search, sortBy, sortOrder],
  );

  const { data, isLoading, isError, refetch } = useTrash(query);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.trash(query) });
    queryClient.invalidateQueries({ queryKey: queryKeys.files({}) });
  };

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/files/${id}/restore`);
    },
    onSuccess: () => {
      toast(t("files.restored"), "success");
      invalidate();
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.restoreFailed"),
        "error",
      );
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/files/${id}/permanent`);
    },
    onSuccess: () => {
      toast(t("files.purged"), "success");
      invalidate();
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.purgeFailed"),
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
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("files.trashTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("files.trashSubtitle")}
          </p>
        </div>
        <Link href="/files">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="me-2 size-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
            <Button variant="outline" onClick={applySearch}>
              {t("common.search")}
            </Button>
          </div>

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

          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : !data || data.data.length === 0 ? (
              <EmptyState
                icon={<Trash2 className="size-6" />}
                title={t("files.trashEmpty")}
                description={t("files.trashEmptyHint")}
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
                      <TableHead>{t("files.deletedAt")}</TableHead>
                      <TableHead className="text-right">
                        {t("files.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="max-w-[280px] truncate font-medium text-muted-foreground">
                          {file.originalName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{file.extension}</Badge>
                        </TableCell>
                        <TableCell>{formatBytes(file.size)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {file.deletedAt ? formatDate(file.deletedAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("files.restoreLabel", {
                              name: file.originalName,
                            })}
                            onClick={() => restoreMutation.mutate(file.id)}
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("files.purgeLabel", {
                              name: file.originalName,
                            })}
                            onClick={() => setPurgeTarget(file)}
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
        open={Boolean(purgeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPurgeTarget(null);
          }
        }}
        title={t("files.purgeTitle")}
        description={t("files.purgeConfirm", {
          name: purgeTarget?.originalName,
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (purgeTarget) {
            return purgeMutation.mutateAsync(purgeTarget.id);
          }
        }}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
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
