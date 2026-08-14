"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FolderSearch, HardDrive, Upload, UserPlus } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/layout/container";
import { staggerContainer, itemVariants } from "@/lib/motion";

const steps = [
  { key: "account", icon: UserPlus },
  { key: "upload", icon: Upload },
  { key: "organize", icon: FolderSearch },
  { key: "track", icon: HardDrive },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow={t("howItWorks.eyebrow")}
          title={t("howItWorks.title")}
          subtitle={t("howItWorks.subtitle")}
        />
        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          <div
            aria-hidden
            className="absolute inset-x-8 top-6 hidden border-t border-dashed border-border lg:block"
          />
          {steps.map(({ key, icon: Icon }, index) => (
            <motion.li
              key={key}
              variants={itemVariants}
              className="relative flex flex-col items-center text-center"
            >
              <span className="relative flex size-12 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                <Icon className="size-5 text-primary" aria-hidden />
                <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary font-display text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
                {t(`howItWorks.${key}.title`)}
              </h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {t(`howItWorks.${key}.desc`)}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </Section>
  );
}
