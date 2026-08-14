"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, HardDrive, UploadCloud } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/api";
import { useUserStats } from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const { t } = useTranslation();
  const [days, setDays] = useState(7);
  const { data, isLoading, isError, refetch } = useUserStats(days);

  const chartData = useMemo(
    () =>
      (data?.dailyUploads ?? []).map((entry) => ({
        date: formatDate(entry.date),
        uploads: entry.count,
      })),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[7, 14, 30].map((value) => (
            <Button
              key={value}
              variant={days === value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDays(value)}
            >
              {value}d
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="text-sm text-destructive">
          {t("dashboard.loadError")}
          <Button variant="outline" size="sm" className="ms-2" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText className="size-4" />}
          label={t("dashboard.totalFiles")}
          loading={isLoading}
          value={data ? String(data.totalFiles) : "0"}
        />
        <StatCard
          icon={<HardDrive className="size-4" />}
          label={t("dashboard.storageUsed")}
          loading={isLoading}
          value={data ? formatBytes(data.totalStorageBytes) : "0 B"}
        />
        <StatCard
          icon={<UploadCloud className="size-4" />}
          label={t("dashboard.uploadsLast30d")}
          loading={isLoading}
          value={
            data ? String(data.dailyUploads.reduce((sum, d) => sum + d.count, 0)) : "0"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.uploadsByType")}</CardTitle>
          <CardDescription>{t("dashboard.uploadsByTypeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : !data || data.typeBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("dashboard.noUploadsYet")}{" "}
              <Link href="/files" className="font-medium text-primary hover:underline">
                {t("dashboard.uploadFirstFile")}
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {data.typeBreakdown.map((entry) => (
                <div key={entry.extension} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-20 justify-center">
                    {entry.extension}
                  </Badge>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(
                          4,
                          (entry.count / data.typeBreakdown[0].count) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {entry.count} · {formatBytes(entry.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.dailyUploads")}</CardTitle>
          <CardDescription>
            {t("dashboard.dailyUploadsDescription", { days })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="uploads" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-20" />
          ) : (
            <p className="truncate text-xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
