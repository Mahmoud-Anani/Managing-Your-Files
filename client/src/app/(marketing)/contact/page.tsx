"use client";

import { useTranslation } from "react-i18next";
import { ContactForm } from "@/components/contact-form";
import { StaticPageLayout } from "@/components/layout/static-page-layout";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <StaticPageLayout
      eyebrow={t("contact.eyebrow")}
      title={t("contact.title")}
      intro={t("contact.intro")}
    >
      <ContactForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("contact.responseNote")}
      </p>
    </StaticPageLayout>
  );
}
