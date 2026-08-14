"use client";

import { useTranslation } from "react-i18next";
import {
  ProseSection,
  StaticPageLayout,
} from "@/components/layout/static-page-layout";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <StaticPageLayout
      eyebrow={t("about.eyebrow")}
      title={t("about.title")}
      intro={t("about.intro")}
    >
      <ProseSection title={t("about.whatTitle")}>
        <p>{t("about.whatBody")}</p>
      </ProseSection>
      <ProseSection title={t("about.whoTitle")}>
        <p>{t("about.whoBody")}</p>
      </ProseSection>
      <ProseSection title={t("about.whyTitle")}>
        <p>{t("about.whyBody")}</p>
      </ProseSection>
      <ProseSection title={t("about.principlesTitle")}>
        <ul className="list-disc space-y-2 ps-5">
          <li>{t("about.principle1")}</li>
          <li>{t("about.principle2")}</li>
          <li>{t("about.principle3")}</li>
        </ul>
      </ProseSection>
    </StaticPageLayout>
  );
}
