"use client";

import Link from "next/link";
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
      <Link
        href="/"
        className="mb-8 text-xl font-semibold tracking-tight text-foreground"
      >
        {t("brand")}
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
