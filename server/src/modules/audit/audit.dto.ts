import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z
    .string()
    .trim()
    .min(1, 'Action must not be empty')
    .max(50, 'Action must be at most 50 characters')
    .optional(),
  userId: z.string().uuid('Invalid user id').optional(),
  search: z
    .string()
    .trim()
    .min(1, 'Search must not be empty')
    .max(100, 'Search must be at most 100 characters')
    .optional(),
});

export type ListAuditLogsQueryDto = z.infer<typeof listAuditLogsQuerySchema>;
