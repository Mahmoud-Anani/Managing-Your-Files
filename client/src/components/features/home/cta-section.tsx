"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FolderCheck } from "lucide-react";
import { Container, Section } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const linkButton =
  "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const linkButtonOnDark = cn(
  linkButton,
  "border border-border bg-card/90 text-foreground hover:bg-card",
);

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <Section className="">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-border bg-primary px-6 py-14 text-center sm:px-16 sm:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -inset-s-10 size-64 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white/15">
              <FolderCheck className="size-6 text-white" aria-hidden />
            </span>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-primary-foreground/80">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className={linkButtonOnDark}>
                {t("cta.createAccount")}
              </Link>
              <Link
                href="/login"
                className={cn(
                  linkButton,
                  "border border-white/30 text-primary-foreground hover:bg-white/10",
                )}
              >
                {t("common.logIn")}
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
