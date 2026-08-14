"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, FileText, Trash2 } from "lucide-react";
import { api, fetchFileBlob, formatBytes } from "@/lib/api";
import { useFile } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { useToast } from "@/components/ui/toast";

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, refetch } = useFile(id);

  const previewFile = useMemo(() => (data ? { ...data } : null), [data]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/files/${id}`);
    },
    onSuccess: () => {
      toast(t("files.movedToTrash"), "success");
      queryClient.invalidateQueries({ queryKey: ["files"] });
      router.replace("/files");
    },
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.deleteFailed"),
        "error",
      );
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const blob = await fetchFileBlob(id, "download");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = data?.originalName ?? "file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    onSettled: () => setDownloading(false),
    onError: (error: unknown) => {
      toast(
        error instanceof Error ? error.message : t("files.downloadFailed"),
        "error",
      );
    },
  });

  const meta = useMemo<Array<[string, string]>>(
    () => [
      [t("files.size"), data ? formatBytes(data.size) : ""],
      [t("files.type"), data?.mimeType ?? ""],
      [t("files.extension"), data?.extension ?? ""],
      [
        t("files.uploaded"),
        data ? new Date(data.createdAt).toLocaleString() : "",
      ],
    ],
    [data, t],
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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="max-w-xl truncate text-xl font-semibold tracking-tight">
            {data.originalName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={downloading || downloadMutation.isPending}
            onClick={() => {
              setDownloading(true);
              downloadMutation.mutate();
            }}
          >
            <Download className="size-4" /> {t("files.download")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> {t("files.preview")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("files.deleteLabel", { name: data.originalName })}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
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
        description={t("files.deleteConfirmTrash", {
          name: data.originalName,
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => deleteMutation.mutateAsync()}
      />

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
