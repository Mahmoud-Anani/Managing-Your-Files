"use client";

import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import {
  FileSearch,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-provider";
import { Container, Section, SectionHeader } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type SlideKey = "dashboard" | "files" | "detail" | "admin";

const slides: Array<{ key: SlideKey; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "files", icon: FileText },
  { key: "detail", icon: FileSearch },
  { key: "admin", icon: ShieldCheck },
];

export function ProductSwiper() {
  const { t } = useTranslation();
  const { locale } = useI18n();

  return (
    <Section className="bg-secondary/40">
      <Container>
        <SectionHeader
          eyebrow={t("swiper.eyebrow")}
          title={t("swiper.title")}
          subtitle={t("swiper.subtitle")}
        />
        <Swiper
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="product-swiper !pb-14"
          modules={[Pagination, Navigation, A11y]}
          pagination={{ clickable: true }}
          navigation
          a11y={{ enabled: true }}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {slides.map(({ key, icon: Icon }) => (
            <SwiperSlide key={key} className="h-auto">
              <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  <Icon className="size-3.5" aria-hidden />
                  {t(`swiper.${key}.label`)}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                  {t(`swiper.${key}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`swiper.${key}.desc`)}
                </p>
                <div className="mt-6" aria-hidden>
                  <SlideVisual kind={key} />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Section>
  );
}

function SlideVisual({ kind }: { kind: SlideKey }) {
  switch (kind) {
    case "dashboard":
      return <DashboardVisual />;
    case "files":
      return <FilesVisual />;
    case "detail":
      return <DetailVisual />;
    case "admin":
      return <AdminVisual />;
  }
}

function Bar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("rounded bg-muted", className)} style={style} />;
}

function DashboardVisual() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-md border border-border p-2">
            <Bar className="h-1.5 w-8" />
            <Bar className="mt-2 h-2 w-full bg-foreground/20" />
          </div>
        ))}
      </div>
      <div className="flex h-20 items-end gap-1.5 rounded-md border border-border p-2.5">
        {[38, 62, 48, 78, 55, 90, 68, 82, 58].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-sm bg-accent"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function FileRow({ extension }: { extension: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-secondary">
        <FileText className="size-3 text-primary" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <Bar className="h-1.5 w-2/3" />
      </div>
      <span className="text-[10px] font-medium uppercase text-muted-foreground">
        {extension}
      </span>
    </div>
  );
}

function FilesVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
        <Search className="size-3 text-muted-foreground" aria-hidden />
        <Bar className="h-1.5 flex-1" />
      </div>
      <FileRow extension="PDF" />
      <FileRow extension="IMG" />
      <FileRow extension="DOC" />
    </div>
  );
}

function DetailVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent">
          <FileText className="size-4.5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <Bar className="h-2 w-3/4 bg-foreground/20" />
          <Bar className="mt-2 h-1.5 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-md border border-border p-2">
            <Bar className="h-1.5 w-10" />
            <Bar className="mt-1.5 h-1.5 w-2/3 bg-foreground/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminVisual() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent">
            <UserIcon className="size-3 text-accent-foreground" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <Bar className="h-1.5 w-1/2" />
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {item === 0 ? "ADMIN" : "USER"}
          </span>
        </div>
      ))}
      <div className="flex h-6 items-end gap-1.5 px-1">
        {[50, 70, 40, 85, 60].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-sm bg-secondary" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}
