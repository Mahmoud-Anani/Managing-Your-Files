import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  toSafeFileDto,
  type SafeFileDto,
} from '../files/file-mapper';

export interface TypeStat {
  extension: string;
  count: number;
  sizeBytes: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface UserStats {
  totalFiles: number;
  totalStorageBytes: number;
  typeBreakdown: TypeStat[];
  dailyUploads: DailyStat[];
}

export interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalStorageBytes: number;
  mostUploadedTypes: TypeStat[];
  recentUploads: SafeFileDto[];
}

interface TypeBreakdownRow {
  extension: string;
  count: number;
  sizeBytes: number;
}

interface DailyUploadsRow {
  day: Date;
  count: number;
}

export class StatsService {
  async userStats(user: User, days: number): Promise<UserStats> {
    const where: Prisma.FileWhereInput = { userId: user.id, deletedAt: null };

    const [totalFiles, storageAggregate, typeBreakdown, dailyUploads] =
      await Promise.all([
        prisma.file.count({ where }),
        prisma.file.aggregate({ where, _sum: { size: true } }),
        this.typeBreakdown(where),
        this.dailyUploads(user.id, days),
      ]);

    return {
      totalFiles,
      totalStorageBytes: storageAggregate._sum.size ?? 0,
      typeBreakdown,
      dailyUploads,
    };
  }

  async adminStats(): Promise<AdminStats> {
    const where: Prisma.FileWhereInput = { deletedAt: null };

    const [
      totalUsers,
      totalFiles,
      storageAggregate,
      mostUploadedTypes,
      recentFiles,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.file.count({ where }),
      prisma.file.aggregate({ where, _sum: { size: true } }),
      this.typeBreakdown(where),
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalUsers,
      totalFiles,
      totalStorageBytes: storageAggregate._sum.size ?? 0,
      mostUploadedTypes,
      recentUploads: recentFiles.map(toSafeFileDto),
    };
  }

  private async typeBreakdown(
    where: Prisma.FileWhereInput,
  ): Promise<TypeStat[]> {
    const rows = await prisma.file.groupBy({
      by: ['extension'],
      where,
      _count: { _all: true },
      _sum: { size: true },
    });

    const breakdown: TypeBreakdownRow[] = rows.map((row) => ({
      extension: row.extension,
      count: row._count._all,
      sizeBytes: row._sum.size ?? 0,
    }));
    breakdown.sort((a, b) => b.count - a.count || a.extension.localeCompare(b.extension));
    return breakdown;
  }

  private async dailyUploads(
    userId: string,
    days: number,
  ): Promise<DailyStat[]> {
    const rows = await prisma.$queryRaw<DailyUploadsRow[]>(
      Prisma.sql`
        SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
        FROM "files"
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND "createdAt" >= now() - make_interval(days => ${days}::int)
        GROUP BY day
        ORDER BY day ASC
      `,
    );

    const countsByDay = new Map<string, number>();
    for (const row of rows) {
      countsByDay.set(row.day.toISOString().slice(0, 10), row.count);
    }

    const result: DailyStat[] = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      result.push({ date: key, count: countsByDay.get(key) ?? 0 });
    }
    return result;
  }
}
