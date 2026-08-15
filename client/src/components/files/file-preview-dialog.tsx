"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Download,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  fetchFileBlob,
  isImageMime,
  isPdfMime,
  isTextPreviewable,
} from "@/lib/api";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const Document = dynamic(() => import("react-pdf").then((m) => m.Document), {
  ssr: false,
});
const Page = dynamic(() => import("react-pdf").then((m) => m.Page), {
  ssr: false,
});
import { useFile } from "@/hooks/use-queries";
import type { SafeFileDto } from "@/types";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fitWidth, setFitWidth] = useState<number>(800);
  const detail = useFile(file?.id ?? "", { enabled: Boolean(file && open) });

  const canStream = file
    ? isImageMime(file.mimeType) ||
      isPdfMime(file.mimeType) ||
      isTextPreviewable(file.mimeType, file.extension)
    : false;

  const previewUrl = file && isPdfMime(file.mimeType) ? file.url : objectUrl;

  const hasPreviewUrl =
    file && isPdfMime(file.mimeType)
      ? Boolean(file.url) && workerReady
      : Boolean(objectUrl);

  useEffect(() => {
    if (!file || !open || !canStream) {
      return undefined;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(false);

    if (isPdfMime(file.mimeType)) {
      setNumPages(null);
      setWorkerReady(false);
      setScale(1); // reset zoom on new file

      void import("react-pdf").then(({ pdfjs }) => {
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        setWorkerReady(true);
      });

      return () => {
        cancelled = true;
        setLoadError(false);
        setNumPages(null);
        setWorkerReady(false);
      };
    }

    fetchFileBlob(file.id, "preview")
      .then((blob) => {
        if (cancelled) return;
        setObjectUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      setLoadError(false);
      setObjectUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, open]);

  // fitWidth = base width (scale 1) taken from the container, capped so
  // it never forces horizontal scroll on its own. Zoom is applied on top.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const update = () => {
      const w = containerRef.current?.clientWidth ?? 800;
      setFitWidth(Math.max(w - 16, 200)); // small padding allowance
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [open, objectUrl]);

  const handlePdfLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePdfError = () => {
    setLoadError(true);
  };

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => setScale(1), []);

  const close = () => onOpenChange(false);
  const isPdf = Boolean(file && isPdfMime(file.mimeType));
  const pageWidth = fitWidth * scale;

  return (
    <Modal
      open={open}
      onClose={close}
      title={file?.originalName}
      description={
        file ? `${file.mimeType} · ${formatFileSize(file.size)}` : undefined
      }
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {file && canStream ? (
          <div className="space-y-2">
            {isPdf && hasPreviewUrl && !loadError ? (
              <div className="flex items-center justify-end gap-1 rounded-md border border-border bg-muted/50 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={scale <= MIN_SCALE}
                  onClick={zoomOut}
                  aria-label={t("files.zoomOut")}
                >
                  <ZoomOut className="size-4" />
                </Button>
                <span className="min-w-10 text-center text-xs text-muted-foreground">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={scale >= MAX_SCALE}
                  onClick={zoomIn}
                  aria-label={t("files.zoomIn")}
                >
                  <ZoomIn className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={scale === 1}
                  onClick={resetZoom}
                  aria-label={t("files.resetZoom")}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            ) : null}

            <div className="flex max-h-[60vh] min-h-40 items-center justify-center overflow-auto rounded-md border border-border bg-muted/50 p-2">
              {loadError ? (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <AlertTriangle className="size-8 text-destructive" />
                  {t("files.previewLoadError")}
                </div>
              ) : !hasPreviewUrl ? (
                <p className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              ) : isImageMime(file.mimeType) ? (
                <Image
                  src={objectUrl ?? "/"}
                  alt={file.originalName}
                  width={1200}
                  height={800}
                  unoptimized
                  className="max-h-[58vh] rounded object-contain"
                />
              ) : isPdf ? (
                <div
                  ref={containerRef}
                  className="h-[58vh] w-full overflow-auto rounded"
                >
                  <Document
                    file={previewUrl ?? undefined}
                    onLoadSuccess={handlePdfLoad}
                    onLoadError={handlePdfError}
                    loading={
                      <p className="text-sm text-muted-foreground">
                        {t("common.loading")}
                      </p>
                    }
                  >
                    {numPages !== null &&
                      Array.from({ length: numPages }).map((_, i) => (
                        <div
                          key={`page-${i + 1}`}
                          className="mb-2 flex justify-center last:mb-0"
                        >
                          <Page pageNumber={i + 1} width={pageWidth} />
                        </div>
                      ))}
                  </Document>
                </div>
              ) : (
                <pre className="max-h-[58vh] w-full overflow-y-auto whitespace-pre-wrap rounded p-4 font-mono text-xs leading-relaxed">
                  {detail.data?.extractedText ?? ""}
                </pre>
              )}
            </div>
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
  try {
    const blob = await fetchFileBlob(file.id, "download");
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.originalName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch {
    try {
      const anchor = document.createElement("a");
      anchor.href = file.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  }
}
