"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Users } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import { useUsers } from "@/hooks/use-queries";
import type { ListUsersQuery, Role, SafeUserDto, SortOrder, UserSortBy } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/contexts/auth-context";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [sortBy, setSortBy] = useState<UserSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteTarget, setDeleteTarget] = useState<SafeUserDto | null>(null);

  const query = useMemo<ListUsersQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      role: roleFilter || undefined,
      sortBy,
      sortOrder,
    }),
    [page, search, roleFilter, sortBy, sortOrder],
  );

  const { data, isLoading, isError, refetch } = useUsers(query);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      await api.patch(`/users/${id}`, { role });
    },
    onSuccess: () => {
      toast(t("admin.roleUpdated"), "success");
      invalidate();
    },
    onError: (error: unknown) => {
      toast(error instanceof Error ? error.message : t("admin.updateFailed"), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast(t("admin.userDeleted"), "success");
      invalidate();
    },
    onError: (error: unknown) => {
      toast(error instanceof Error ? error.message : t("admin.deleteFailed"), "error");
    },
  });

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const toggleSort = (column: UserSortBy) => {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.usersTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.usersSubtitle")}
        </p>
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
                placeholder={t("admin.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["", "USER", "ADMIN"] as const).map((value) => (
                <Button
                  key={value}
                  variant={roleFilter === value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setRoleFilter(value);
                    setPage(1);
                  }}
                >
                  {value === "" ? t("admin.all") : value}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={applySearch}>
              {t("common.search")}
            </Button>
          </div>

          {isError ? (
            <Alert variant="error" className="mt-4">
              {t("admin.usersLoadError")}{" "}
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
                icon={<Users className="size-6" />}
                title={t("admin.noUsersFound")}
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
                      <SortableHead
                        label={t("common.email")}
                        active={sortBy === "email"}
                        order={sortOrder}
                        onClick={() => toggleSort("email")}
                      />
                      <TableHead>{t("admin.status")}</TableHead>
                      <TableHead>{t("admin.role")}</TableHead>
                      <SortableHead
                        label={t("admin.joined")}
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
                    {data.data.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                            {isSelf ? (
                              <Badge variant="secondary" className="ms-2">
                                {t("admin.you")}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <Badge variant="success">{t("admin.verified")}</Badge>
                            ) : (
                              <Badge variant="outline">{t("admin.unverified")}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <select
                              value={user.role}
                              disabled={isSelf || roleMutation.isPending}
                              onChange={(event) =>
                                roleMutation.mutate({
                                  id: user.id,
                                  role: event.target.value as Role,
                                })
                              }
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("files.deleteLabel", { name: user.name })}
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
        title={t("admin.deleteUserTitle")}
        description={t("admin.deleteUserConfirm", {
          name: deleteTarget?.name,
          email: deleteTarget?.email,
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
