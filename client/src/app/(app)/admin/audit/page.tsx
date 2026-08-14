"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ScrollText } from "lucide-react";
import { useAuditActions, useAuditLogs } from "@/hooks/use-queries";
import type { ListAuditLogsQuery } from "@/types";
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

const PAGE_SIZE = 15;

export default function AdminAuditPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const query = useMemo<ListAuditLogsQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
    }),
    [page, search, actionFilter],
  );

  const { data, isLoading, isError, refetch } = useAuditLogs(query);
  const { data: actions } = useAuditActions();

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.auditTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.auditSubtitle")}
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
                placeholder={t("admin.auditSearchPlaceholder")}
                className="ps-9"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("admin.all")}</option>
              {(actions ?? []).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={applySearch}>
              {t("common.search")}
            </Button>
          </div>

          {isError ? (
            <Alert variant="error" className="mt-4">
              {t("admin.auditLoadError")}{" "}
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
                icon={<ScrollText className="size-6" />}
                title={t("admin.auditEmpty")}
                description={t("admin.auditEmptyHint")}
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.auditTime")}</TableHead>
                      <TableHead>{t("admin.auditAction")}</TableHead>
                      <TableHead>{t("admin.auditUser")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.auditEntity")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.auditIp")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="max-w-48 truncate">
                              <p className="font-medium">{log.user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.user.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {log.entityType ? (
                            <div className="max-w-56 truncate">
                              <p className="text-xs font-medium uppercase text-muted-foreground">
                                {log.entityType}
                              </p>
                              <p className="truncate font-mono text-xs">
                                {log.entityId ?? "—"}
                              </p>
                              {log.metadata &&
                              typeof log.metadata.name === "string" ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {log.metadata.name}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                          {log.ip ?? "—"}
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
    </div>
  );
}
