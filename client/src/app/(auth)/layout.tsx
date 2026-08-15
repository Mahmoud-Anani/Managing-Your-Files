"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PreferencesControls } from "@/components/preferences-controls";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute end-4 top-4">
        <PreferencesControls />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Link
          href="/"
          className="mb-8 block text-xl font-semibold tracking-tight text-foreground"
        >
          {t("brand")}
        </Link>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </main>
  );
}
