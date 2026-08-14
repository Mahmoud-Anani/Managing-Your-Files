"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Download, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  fetchFileBlob,
  isImageMime,
  isPdfMime,
  isTextPreviewable,
} from "@/lib/api";
import { useFile } from "@/hooks/use-queries";
import type { SafeFileDto } from "@/types";

interface FilePreviewDialogProps {
  file: SafeFileDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  const { t } = useTranslation();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const detail = useFile(file?.id ?? "", { enabled: Boolean(file && open) });

  const canStream = file
    ? isImageMime(file.mimeType) ||
      isPdfMime(file.mimeType) ||
      isTextPreviewable(file.mimeType, file.extension)
    : false;

  useEffect(() => {
    if (!file || !open || !canStream) {
      return undefined;
    }

    let cancelled = false;

    fetchFileBlob(file.id, "preview")
      .then((blob) => {
        if (cancelled) {
          return;
        }
        setObjectUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
      setLoadError(false);
      setObjectUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, open]);

  const close = () => onOpenChange(false);

  return (
    <Modal
      open={open}
      onClose={close}
      title={file?.originalName}
      description={file ? `${file.mimeType} · ${formatFileSize(file.size)}` : undefined}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {file && canStream ? (
          <div className="flex max-h-[60vh] min-h-40 items-center justify-center overflow-auto rounded-md border border-border bg-muted/50 p-2">
            {loadError ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <AlertTriangle className="size-8 text-destructive" />
                {t("files.previewLoadError")}
              </div>
            ) : !objectUrl ? (
              <p className="text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : isImageMime(file.mimeType) ? (
              <img
                src={objectUrl}
                alt={file.originalName}
                className="max-h-[58vh] rounded object-contain"
              />
            ) : isPdfMime(file.mimeType) ? (
              <iframe
                src={objectUrl}
                title={file.originalName}
                className="h-[58vh] w-full rounded"
              />
            ) : (
              <pre className="max-h-[58vh] w-full overflow-y-auto whitespace-pre-wrap rounded p-4 font-mono text-xs leading-relaxed">
                {detail.data?.extractedText ?? ""}
              </pre>
            )}
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-muted/50 p-8 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("files.previewUnsupported")}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          {file ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(file)}
            >
              <Download className="me-2 size-4" />
              {t("files.download")}
            </Button>
          ) : null}
          <Button size="sm" onClick={close}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatFileSize(bytes: number): string {
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

async function downloadFile(file: SafeFileDto): Promise<void> {
  const blob = await fetchFileBlob(file.id, "download");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.originalName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
