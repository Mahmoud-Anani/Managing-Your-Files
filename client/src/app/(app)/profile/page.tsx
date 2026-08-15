"use client";

import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/api";
import Link, { LinkProps } from "next/link";

function getInitials(name?: string): string {
  if (!name) {
    return "?";
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name ?? ""} className="size-16 object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-lg font-semibold tracking-tight">
                {user?.name}
              </p>
              {user?.isVerified ? (
                <Badge variant="success">
                  <BadgeCheck className="me-1 size-3.5" aria-hidden />
                  {t("admin.verified")}
                </Badge>
              ) : (
                <Badge variant="outline">{t("admin.unverified")}</Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-border">
        <DetailRow
          icon={<Mail className="size-4" />}
          label={t("common.email")}
          value={user?.email}
        />
        <DetailRow
          icon={<ShieldCheck className="size-4" />}
          label={t("admin.role")}
          value={
            user?.role === "ADMIN"
              ? t("profile.adminRole")
              : t("profile.userRole")
          }
        />
        <DetailRow
          icon={<CalendarDays className="size-4" />}
          label={t("profile.memberSince")}
          value={user ? formatDate(user.createdAt) : undefined}
        />
        <DetailRow
          icon={<BadgeCheck className="size-4" />}
          label={t("admin.status")}
          value={user?.isVerified ? t("admin.verified") : t("admin.unverified")}
        />
        {/* <DetailRow
          icon={<BadgeCheck className="size-4" />}
          label={t("auth.resetPasswordTitle")}
          value={t("auth.resetPassword")}
          link={"/forgot-password"}
        /> */}
      </Card>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserIcon className="size-4 shrink-0" aria-hidden />
        {t("profile.manageHint")}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  link?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ms-auto truncate text-sm font-medium text-foreground">
        {!link && value}
        {link && (
          <Link href={link as LinkProps["href"]} className="ms-2 text-primary">
            {value}
          </Link>
        )}
      </span>
    </div>
  );
}
