import { z } from 'zod';

export const listFilesQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z
    .string()
    .trim()
    .min(1, 'Search must not be empty')
    .max(100, 'Search must be at most 100 characters')
    .optional(),
  type: z
    .string()
    .trim()
    .min(1, 'Type must not be empty')
    .max(20, 'Type must be at most 20 characters')
    .regex(/^[a-z0-9]+$/, 'Type must be an extension like pdf or png')
    .optional(),
  sortBy: z.enum(['createdAt', 'name', 'size']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListFilesQueryDto = z.infer<typeof listFilesQuerySchema>;

export const adminListFilesQuerySchema = listFilesQuerySchema.extend({
  userId: z.string().uuid('Invalid user id').optional(),
});

export type AdminListFilesQueryDto = z.infer<typeof adminListFilesQuerySchema>;
