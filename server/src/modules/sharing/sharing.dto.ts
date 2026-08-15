import { z } from 'zod';

export const shareFileSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  permission: z.enum(['VIEW', 'EDIT']).default('VIEW'),
});

export type ShareFileDto = z.infer<typeof shareFileSchema>;

export const updateShareSchema = z.object({
  permission: z.enum(['VIEW', 'EDIT']),
});

export type UpdateShareDto = z.infer<typeof updateShareSchema>;
