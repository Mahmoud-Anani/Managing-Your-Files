"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
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
import {
  CountUp,
} from "@/components/motion/count-up";
import {
  GrowBar,
  RevealGroup,
  RevealItem,
} from "@/components/motion/reveal";

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

  const storageChartData = useMemo(
    () =>
      (data?.dailyStorageBytes ?? []).map((entry) => ({
        date: formatDate(entry.date),
        bytes: entry.bytes,
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

      <RevealGroup className="grid gap-4 sm:grid-cols-3" stagger={0.12}>
        <RevealItem>
          <StatCard
            icon={<FileText className="size-4" />}
            label={t("dashboard.totalFiles")}
            loading={isLoading}
            value={data?.totalFiles ?? 0}
          />
        </RevealItem>
        <RevealItem>
          <StatCard
            icon={<HardDrive className="size-4" />}
            label={t("dashboard.storageUsed")}
            loading={isLoading}
            value={data?.totalStorageBytes ?? 0}
            format={formatBytes}
          />
        </RevealItem>
        <RevealItem>
          <StatCard
            icon={<UploadCloud className="size-4" />}
            label={t("dashboard.uploadsLast30d")}
            loading={isLoading}
            value={
              data
                ? data.dailyUploads.reduce((sum, d) => sum + d.count, 0)
                : 0
            }
          />
        </RevealItem>
      </RevealGroup>

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
              {data.typeBreakdown.map((entry, index) => (
                <div key={entry.extension} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-20 justify-center">
                    {entry.extension}
                  </Badge>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <GrowBar
                      width={`${Math.max(
                        4,
                        (entry.count / data.typeBreakdown[0].count) * 100,
                      )}%`}
                      className="bg-primary"
                      delay={index * 0.08}
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
          <CardTitle>{t("dashboard.storageGrowth")}</CardTitle>
          <CardDescription>
            {t("dashboard.storageGrowthDescription", { days })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={storageChartData}>
                <defs>
                  <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  width={56}
                  tickFormatter={(value: number) => formatBytes(value)}
                />
                <Tooltip
                  formatter={(value) => formatBytes(Number(value))}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bytes"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#storageFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
  format,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  format?: (n: number) => string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", damping: 20, stiffness: 320 }}
    >
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
              <CountUp
                value={value}
                format={format}
                className="block truncate text-xl font-semibold tracking-tight"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
