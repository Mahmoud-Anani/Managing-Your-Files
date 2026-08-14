import { z } from 'zod';

export const userStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});

export type UserStatsQueryDto = z.infer<typeof userStatsQuerySchema>;
