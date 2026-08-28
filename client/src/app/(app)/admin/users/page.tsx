"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Pencil, Search, Trash2, Users } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import { useUsers } from "@/hooks/use-queries";
import type {
  ListUsersQuery,
  Role,
  SafeUserDto,
  SortOrder,
  UserSortBy,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
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
import { PasswordRequirements } from "@/components/password-requirements";

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
  const [editTarget, setEditTarget] = useState<SafeUserDto | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<SafeUserDto | null>(null);
  const [notifyForm, setNotifyForm] = useState({ title: "", message: "" });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "USER" as Role,
    isVerified: true,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as Role,
  });

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
      toast(
        error instanceof Error ? error.message : t("admin.updateFailed"),
        "error",
      );
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
      toast(
        error instanceof Error ? error.message : t("admin.deleteFailed"),
        "error",
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; email?: string; role?: Role; isVerified?: boolean };
    }) => {
      await api.patch(`/users/${id}`, payload);
    },
    onSuccess: () => {
      toast(t("admin.userUpdated"), "success");
      setEditTarget(null);
      invalidate();
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("admin.updateFailed"),
        "error",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      await api.post("/users", payload);
    },
    onSuccess: () => {
      toast("User created.", "success");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "USER" });
      invalidate();
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("admin.updateFailed"),
        "error",
      );
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      message,
    }: {
      id: string;
      title: string;
      message: string;
    }) => {
      await api.post("/notifications/send", { userId: id, title, message });
    },
    onSuccess: () => {
      toast(t("admin.notificationSent"), "success");
      setNotifyTarget(null);
      setNotifyForm({ title: "", message: "" });
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("admin.sendFailed"),
        "error",
      );
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.usersTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.usersSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setCreateOpen((current) => !current)}
        >
          Add user
        </Button>
      </div>

      {createOpen ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="At least 8 chars"
                />
                <PasswordRequirements password={createForm.password} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: event.target.value as Role,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(createForm)}
                disabled={createMutation.isPending}
              >
                Create user
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
                              <Badge variant="success">
                                {t("admin.verified")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {t("admin.unverified")}
                              </Badge>
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
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("admin.notifyLabel", {
                                  name: user.name,
                                })}
                                onClick={() => {
                                  setNotifyTarget(user);
                                  setNotifyForm({ title: "", message: "" });
                                }}
                              >
                                <BellRing className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("admin.editLabel", {
                                  name: user.name,
                                })}
                                onClick={() => {
                                  setEditTarget(user);
                                  setEditForm({
                                    name: user.name,
                                    email: user.email,
                                    role: user.role,
                                    isVerified: user.isVerified,
                                  });
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("files.deleteLabel", {
                                  name: user.name,
                                })}
                                disabled={isSelf}
                                onClick={() => setDeleteTarget(user)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
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

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={t("admin.editUserTitle")}
        description={
          editTarget
            ? t("admin.editUserDescription", { email: editTarget.email })
            : undefined
        }
      >
        {editTarget ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editTarget) {
                return;
              }
              editMutation.mutate({
                id: editTarget.id,
                payload: {
                  name: editForm.name.trim() || undefined,
                  email: editForm.email.trim() || undefined,
                  role: editForm.role,
                  isVerified: editForm.isVerified,
                },
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("common.fullName")}</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t("common.email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t("admin.role")}</Label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  disabled={editTarget.id === currentUser?.id}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      role: event.target.value as Role,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        isVerified: event.target.checked,
                      }))
                    }
                    className="size-4"
                  />
                  {t("admin.verified")}
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={editMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={editMutation.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(notifyTarget)}
        onClose={() => setNotifyTarget(null)}
        title={t("admin.notifyUserTitle")}
        description={
          notifyTarget
            ? t("admin.notifyUserDescription", { name: notifyTarget.name })
            : undefined
        }
      >
        {notifyTarget ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              notifyMutation.mutate({
                id: notifyTarget.id,
                title: notifyForm.title.trim(),
                message: notifyForm.message.trim(),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notify-title">{t("admin.notifyTitleLabel")}</Label>
              <Input
                id="notify-title"
                value={notifyForm.title}
                onChange={(event) =>
                  setNotifyForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={t("admin.notifyTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-message">
                {t("admin.notifyMessageLabel")}
              </Label>
              <textarea
                id="notify-message"
                value={notifyForm.message}
                onChange={(event) =>
                  setNotifyForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                placeholder={t("admin.notifyMessagePlaceholder")}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotifyTarget(null)}
                disabled={notifyMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={notifyMutation.isPending}>
                {t("admin.notifySend")}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

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
