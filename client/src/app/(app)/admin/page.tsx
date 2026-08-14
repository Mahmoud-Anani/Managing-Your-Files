"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FileText, HardDrive, Users } from "lucide-react";
import { formatBytes } from "@/lib/api";
import { useAdminStats } from "@/hooks/use-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CountUp } from "@/components/motion/count-up";
import {
  GrowBar,
  RevealGroup,
  RevealItem,
} from "@/components/motion/reveal";

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminStats();

  if (isError) {
    return (
      <Alert variant="error">
        {t("admin.loadError")}{" "}
        <Button variant="outline" size="sm" className="ms-2" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.overviewTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.overviewSubtitle")}
        </p>
      </div>

      <RevealGroup className="grid gap-4 sm:grid-cols-3" stagger={0.12}>
        <RevealItem>
          <StatCard
            label={t("admin.totalUsers")}
            value={data?.totalUsers ?? 0}
            loading={isLoading}
            icon={<Users className="size-4" />}
          />
        </RevealItem>
        <RevealItem>
          <StatCard
            label={t("admin.totalFiles")}
            value={data?.totalFiles ?? 0}
            loading={isLoading}
            icon={<FileText className="size-4" />}
          />
        </RevealItem>
        <RevealItem>
          <StatCard
            label={t("admin.totalStorage")}
            value={data?.totalStorageBytes ?? 0}
            loading={isLoading}
            format={formatBytes}
            icon={<HardDrive className="size-4" />}
          />
        </RevealItem>
      </RevealGroup>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.mostUploadedTypes")}</CardTitle>
          <CardDescription>{t("admin.mostUploadedTypesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : !data || data.mostUploadedTypes.length === 0 ? (
            <EmptyState title={t("admin.noUploadsYet")} />
          ) : (
            <div className="space-y-3">
              {data.mostUploadedTypes.map((entry, index) => (
                <div key={entry.extension} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <Badge variant="outline" className="w-24 justify-center">
                    {entry.extension}
                  </Badge>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <GrowBar
                      width={`${Math.max(
                        4,
                        (entry.count / data.mostUploadedTypes[0].count) * 100,
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
          <CardTitle>{t("admin.recentUploads")}</CardTitle>
          <CardDescription>{t("admin.recentUploadsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data || data.recentUploads.length === 0 ? (
            <EmptyState title={t("admin.noUploadsYet")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("files.name")}</TableHead>
                  <TableHead>{t("files.type")}</TableHead>
                  <TableHead>{t("files.size")}</TableHead>
                  <TableHead className="text-right">{t("files.uploaded")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUploads.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="max-w-[260px]">
                      <Link
                        href={`/files/${file.id}`}
                        className="block truncate font-medium text-primary hover:underline"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.extension}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  icon,
  format,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
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
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-20" />
            ) : (
              <CountUp
                value={value}
                format={format}
                className="block text-xl font-semibold tracking-tight"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
