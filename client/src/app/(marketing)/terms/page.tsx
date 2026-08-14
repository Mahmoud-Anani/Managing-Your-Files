"use client";

import { useTranslation } from "react-i18next";
import {
  ProseSection,
  StaticPageLayout,
} from "@/components/layout/static-page-layout";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <StaticPageLayout
      eyebrow={t("terms.eyebrow")}
      title={t("terms.title")}
      intro={t("terms.intro")}
    >
      <p className="mb-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
        {t("terms.lastUpdated")}
      </p>
      <ProseSection title={t("terms.acceptanceTitle")}>
        <p>{t("terms.acceptanceBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.accountTitle")}>
        <p>{t("terms.accountBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.acceptableUseTitle")}>
        <p>{t("terms.acceptableUseBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.contentTitle")}>
        <p>{t("terms.contentBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.terminationTitle")}>
        <p>{t("terms.terminationBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.liabilityTitle")}>
        <p>{t("terms.liabilityBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.changesTitle")}>
        <p>{t("terms.changesBody")}</p>
      </ProseSection>
      <ProseSection title={t("terms.contactTitle")}>
        <p>{t("terms.contactBody")}</p>
      </ProseSection>
    </StaticPageLayout>
  );
}
