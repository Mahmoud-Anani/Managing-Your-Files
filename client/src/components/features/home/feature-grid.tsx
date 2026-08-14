"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FileSearch,
  HardDrive,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/layout/container";
import { staggerContainer, itemVariants } from "@/lib/motion";

const features = [
  { key: "upload", icon: Upload },
  { key: "search", icon: Search },
  { key: "details", icon: FileSearch },
  { key: "storage", icon: HardDrive },
  { key: "security", icon: ShieldCheck },
  { key: "admin", icon: Users },
] as const;

export function FeatureGrid() {
  const { t } = useTranslation();

  return (
    <Section id="features" className="scroll-mt-20">
      <Container>
        <SectionHeader
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          subtitle={t("features.subtitle")}
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map(({ key, icon: Icon }) => (
            <motion.div
              key={key}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", damping: 20, stiffness: 320 }}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
                {t(`features.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`features.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
