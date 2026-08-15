"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageRange(current: number, total: number): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range: Array<number | "..."> = [1];
  if (current > 3) {
    range.push("...");
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) {
    range.push(i);
  }
  if (current < total - 2) {
    range.push("...");
  }
  range.push(total);
  return range;
}

const tapTransition = { duration: 0.12, ease: "easeOut" as const };

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) {
    return null;
  }
  const base =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40";
  const active =
    "bg-primary text-primary-foreground font-medium";
  const idle =
    "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground";
  return (
    <div className={cn("flex flex-col items-center gap-2 sm:flex-row sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        {t("common.showingPage", { page, totalPages, total })}
      </p>
      <nav aria-label={t("common.pagination")} className="flex items-center gap-1.5">
        <motion.button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          whileTap={{ scale: 0.94 }}
          transition={tapTransition}
          className={cn(base, idle)}
          aria-label={t("common.previousPage")}
        >
          <ChevronLeft className="size-4" />
        </motion.button>
        {pageRange(page, totalPages).map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <motion.button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              whileTap={{ scale: 0.94 }}
              transition={tapTransition}
              aria-current={item === page ? "page" : undefined}
              className={cn(base, item === page ? active : idle)}
            >
              {item}
            </motion.button>
          ),
        )}
        <motion.button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          whileTap={{ scale: 0.94 }}
          transition={tapTransition}
          className={cn(base, idle)}
          aria-label={t("common.nextPage")}
        >
          <ChevronRight className="size-4" />
        </motion.button>
      </nav>
    </div>
  );
}
