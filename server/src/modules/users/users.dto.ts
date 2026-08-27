import { z } from 'zod';

const passwordRegex =
  /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,72}$/;

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

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      'Password must contain at least one special character',
    )
    .regex(
      passwordRegex,
      'Password must contain at least one number and one special character',
    ),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  isVerified: z.boolean().default(true),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isVerified: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], {
    message: 'Role must be either USER or ADMIN',
  }),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
