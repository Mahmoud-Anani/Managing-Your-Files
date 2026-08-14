import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z
    .string()
    .trim()
    .min(1, 'Search must not be empty')
    .max(100, 'Search must be at most 100 characters')
    .optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], {
    message: 'Role must be either USER or ADMIN',
  }),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
