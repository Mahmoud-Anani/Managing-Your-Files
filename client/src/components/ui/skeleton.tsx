"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={cn("rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}
