"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Download,
  Eye,
  Trash2,
  Share2,
} from "lucide-react";
import { api, fetchFileBlob, formatBytes, formatDate } from "@/lib/api";
import type { SharedFileDto } from "@/types";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Tab = "shared-with-me" | "shared-by-me";

export default function SharedPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("shared-with-me");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { data: sharedWithMe = [], isLoading: loadingWithMe, error: errorWithMe } = useQuery<SharedFileDto[]>({
    queryKey: ["sharing", "shared-with-me"],
    queryFn: async () => {
      const { data } = await api.get<SharedFileDto[]>("/sharing/shared-with-me");
      return data;
    },
  });

  const { data: sharedByMe = [], isLoading: loadingByMe, error: errorByMe } = useQuery<SharedFileDto[]>({
    queryKey: ["sharing", "shared-by-me"],
    queryFn: async () => {
      const { data } = await api.get<SharedFileDto[]>("/sharing/shared-by-me");
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await api.delete(`/sharing/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sharing"] });
      toast(t("sharing.unshareSuccess"), "success");
      setRemoveId(null);
    },
    onError: () => {
      toast(t("sharing.unshareFailed"), "error");
    },
  });

  const items = tab === "shared-with-me" ? sharedWithMe : sharedByMe;
  const isLoading = tab === "shared-with-me" ? loadingWithMe : loadingByMe;
  const error = tab === "shared-with-me" ? errorWithMe : errorByMe;

  const handleDownload = async (file: SharedFileDto["file"]) => {
    try {
      const blob = await fetchFileBlob(file.id, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast(t("files.downloadFailed"), "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("sharing.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("sharing.subtitle")}
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("shared-with-me")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "shared-with-me"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-4" />
          {t("sharing.sharedWithMe")}
        </button>
        <button
          type="button"
          onClick={() => setTab("shared-by-me")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "shared-by-me"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="size-4" />
          {t("sharing.sharedByMe")}
        </button>
      </div>

      {error ? (
        <Alert variant="error">{t("common.errorGeneric")}</Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={tab === "shared-with-me" ? <Users /> : <UserPlus />}
              title={tab === "shared-with-me" ? t("sharing.noSharedWithMe") : t("sharing.noSharedByMe")}
              description={tab === "shared-with-me" ? t("sharing.noSharedWithMeHint") : t("sharing.noSharedByMeHint")}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("files.name")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("files.size")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {tab === "shared-with-me" ? t("sharing.sharedBy") : t("sharing.sharedWith")}
                </TableHead>
                <TableHead className="hidden sm:table-cell">{t("sharing.permission")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("sharing.sharedOn")}</TableHead>
                <TableHead className="text-end">{t("files.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <Share2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {share.file.originalName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                          {formatBytes(share.file.size)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(share.file.size)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {tab === "shared-with-me" ? share.sharedBy.name : share.sharedWith.name}
                      </p>
                      <p className="text-muted-foreground">
                        {tab === "shared-with-me" ? share.sharedBy.email : share.sharedWith.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={share.permission === "EDIT" ? "success" : "outline"}>
                      {share.permission === "EDIT" ? t("sharing.canEdit") : t("sharing.viewOnly")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(share.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/files/${share.file.id}`}
                        title={t("files.previewLabel", { name: share.file.originalName })}
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(share.file)}
                        title={t("files.downloadLabel", { name: share.file.originalName })}
                      >
                        <Download className="size-4" />
                      </Button>
                      {tab === "shared-by-me" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemoveId(share.id)}
                          title={t("sharing.unshareButton")}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveId(null);
        }}
        title={t("sharing.unshareButton")}
        description={t("sharing.unshareConfirm")}
        confirmLabel={t("sharing.unshareButton")}
        destructive
        onConfirm={async () => {
          if (removeId) {
            await removeMutation.mutateAsync(removeId);
          }
        }}
      />
    </div>
  );
}
