"use client";

import type { HTMLAttributes } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-16 sm:py-24", className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className={cn(
        "mb-10 flex max-w-2xl flex-col gap-3 sm:mb-14",
        align === "center" && "mx-auto text-center",
        align === "start" && "items-start",
      )}
    >
      {eyebrow ? (
        <motion.p
          variants={headerItemVariants}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-primary"
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h2
        variants={headerItemVariants}
        className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle ? (
        <motion.p
          variants={headerItemVariants}
          className="text-base leading-relaxed text-muted-foreground"
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}

const headerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
