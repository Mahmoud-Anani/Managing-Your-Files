"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InputProps extends HTMLMotionProps<"input"> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <motion.input
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-destructive focus-visible:ring-destructive"
          : "border-input",
        className,
      )}
      {...props}
    />
  );
}
