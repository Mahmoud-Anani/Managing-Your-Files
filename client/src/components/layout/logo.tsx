"use client";

import Link from "next/link";
import { FolderCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  iconOnly = false,
}: {
  className?: string;
  href?: string;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link
      href={href}
      aria-label={t("brand")}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <FolderCheck className="size-4.5" aria-hidden />
      </span>
      {!iconOnly ? (
        <span className="font-display truncate text-base font-semibold tracking-tight">
          {t("brand")}
        </span>
      ) : null}
    </Link>
  );
}
