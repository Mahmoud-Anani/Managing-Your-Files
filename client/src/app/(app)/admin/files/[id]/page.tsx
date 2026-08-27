"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { api, formatBytes, formatDate } from "@/lib/api";
import { useFile } from "@/hooks/use-queries";
import type { SafeUserDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export default function AdminFileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useFile(id);

  const { data: ownerName } = useQuery({
    queryKey: ["admin-file-owner", data?.userId],
    enabled: Boolean(data?.userId),
    queryFn: async () => {
      const { data: users } = await api.get<{ data: SafeUserDto[] }>("/users", {
        params: { limit: 100, page: 1 },
      });
      return users.data.find((u) => u.id === data!.userId)?.name ?? "—";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/files/${id}`);
    },
    onSuccess: () => {
      toast(t("files.deleted"), "success");
      queryClient.invalidateQueries({ queryKey: ["admin-files"] });
      router.replace("/admin/files");
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.deleteFailed"),
        "error",
      );
    },
  });

  const meta = useMemo<Array<[string, string]>>(
    () => [
      [t("common.owner"), ownerName ?? "—"],
      [t("files.size"), data ? formatBytes(data.size) : ""],
      [t("files.type"), data?.mimeType ?? ""],
      [t("files.extension"), data?.extension ?? ""],
      [
        t("files.uploaded"),
        data ? formatDate(data.createdAt) : "",
      ],
    ],
    [data, ownerName, t],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> {t("common.back")}
        </Button>
        <Alert variant="error">
          {t("files.detailLoadError")}{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => refetch()}
          >
            {t("common.retry")}
          </button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/files"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="max-w-xl truncate text-xl font-semibold tracking-tight">
            {data.originalName}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("files.deleteLabel", { name: data.originalName })}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {meta.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 truncate font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {data.extractedText ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> {t("files.extractedText")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-xs leading-relaxed">
              {data.extractedText}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("files.deleteTitle")}
        description={t("files.deleteConfirm", {
          name: data.originalName,
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </div>
  );
}
