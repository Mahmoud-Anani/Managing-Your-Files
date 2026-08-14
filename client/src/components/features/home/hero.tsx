"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const linkButton =
  "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkButtonPrimary = cn(
  linkButton,
  "bg-primary text-primary-foreground hover:opacity-90",
);

const linkButtonOutline = cn(
  linkButton,
  "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
);

interface ChipData {
  name: string;
  meta: string;
  icon: typeof FileText;
  color: string;
  scattered: { x: number; y: number; rotate: number };
}

const chips: ChipData[] = [
  {
    name: "invoice.pdf",
    meta: "2.4 MB · PDF",
    icon: FileText,
    color: "text-destructive",
    scattered: { x: 64, y: -40, rotate: -10 },
  },
  {
    name: "portrait.jpg",
    meta: "1.8 MB · IMG",
    icon: FileImage,
    color: "text-stamp",
    scattered: { x: -52, y: 22, rotate: 9 },
  },
  {
    name: "report.docx",
    meta: "320 KB · DOC",
    icon: FileText,
    color: "text-ring",
    scattered: { x: 48, y: 38, rotate: 12 },
  },
  {
    name: "data.csv",
    meta: "96 KB · CSV",
    icon: FileSpreadsheet,
    color: "text-success",
    scattered: { x: -64, y: -28, rotate: -7 },
  },
];

const stackedRotations = [-1, 1.2, -1.4, 0.6];

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/50 to-transparent"
      />
      <Container className="relative">
        <div className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-2 lg:gap-10">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              {t("hero.eyebrow")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-display mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            >
              {t("hero.titlePart1")}{" "}
              <span className="text-primary">{t("hero.titleAccent")}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t("hero.subtitle")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href="/register" className={linkButtonPrimary}>
                {t("hero.createAccount")}
              </Link>
              <Link href="/login" className={linkButtonOutline}>
                {t("common.logIn")}
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
              {t("hero.secureNote")}
            </motion.p>
          </div>

          <FileTray />
        </div>
      </Container>
    </section>
  );
}

function FileTray() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative mx-auto w-full max-w-md"
      aria-hidden
    >
      <div
        className="absolute inset-8 rounded-full bg-accent/60 blur-3xl"
        aria-hidden
      />
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-xl shadow-foreground/5">
        <div className="flex items-center justify-between border-b border-border px-2 pb-3">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FolderOpen className="size-4 text-primary" aria-hidden />
            {t("hero.trayLabel")}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {t("hero.trayCount")}
          </span>
        </div>
        <div className="relative h-72">
          {chips.map((chip, index) => (
            <ChipCard key={chip.name} chip={chip} index={index} />
          ))}
          <motion.span
            initial={{ opacity: 0, scale: 0.6, rotate: -18 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              type: "spring",
              damping: 14,
              stiffness: 220,
              delay: 0.9,
            }}
            className="absolute -end-1 bottom-6 z-10 rounded-md border-2 border-stamp bg-stamp/10 px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.22em] text-stamp"
          >
            {t("hero.stamp")}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function ChipCard({ chip, index }: { chip: ChipData; index: number }) {
  const Icon = chip.icon;
  return (
    <motion.span
      initial={{
        opacity: 0,
        x: chip.scattered.x,
        y: chip.scattered.y,
        rotate: chip.scattered.rotate,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: index * 10,
        rotate: stackedRotations[index],
      }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        type: "spring",
        damping: 18,
        stiffness: 170,
        delay: 0.15 + index * 0.14,
      }}
      className="absolute start-0 end-0 top-4 mx-auto block w-[82%]"
    >
      <span className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary",
            chip.color,
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {chip.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {chip.meta}
          </span>
        </span>
      </span>
    </motion.span>
  );
}
