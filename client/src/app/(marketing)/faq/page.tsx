"use client";

import { useTranslation } from "react-i18next";
import { FaqAccordion } from "@/components/faq-accordion";
import { StaticPageLayout } from "@/components/layout/static-page-layout";

export default function FaqPage() {
  const { t } = useTranslation();

  const items = ["supported", "limits", "security", "deletion", "retention", "pricing", "sharing"].map(
    (key) => ({
      question: t(`faq.${key}.question`),
      answer: t(`faq.${key}.answer`),
    }),
  );

  return (
    <StaticPageLayout
      eyebrow={t("faq.eyebrow")}
      title={t("faq.title")}
      intro={t("faq.intro")}
    >
      <FaqAccordion items={items} />
    </StaticPageLayout>
  );
}
