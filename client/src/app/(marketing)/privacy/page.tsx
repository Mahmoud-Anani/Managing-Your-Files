"use client";

import { useTranslation } from "react-i18next";
import {
  ProseSection,
  StaticPageLayout,
} from "@/components/layout/static-page-layout";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <StaticPageLayout
      eyebrow={t("privacy.eyebrow")}
      title={t("privacy.title")}
      intro={t("privacy.intro")}
    >
      <p className="mb-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
        {t("privacy.lastUpdated")}
      </p>
      <ProseSection title={t("privacy.collectTitle")}>
        <p>{t("privacy.collectBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.filesTitle")}>
        <p>{t("privacy.filesBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.usageTitle")}>
        <p>{t("privacy.usageBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.cookiesTitle")}>
        <p>{t("privacy.cookiesBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.rightsTitle")}>
        <p>{t("privacy.rightsBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.retentionTitle")}>
        <p>{t("privacy.retentionBody")}</p>
      </ProseSection>
      <ProseSection title={t("privacy.contactTitle")}>
        <p>{t("privacy.contactBody")}</p>
      </ProseSection>
    </StaticPageLayout>
  );
}
