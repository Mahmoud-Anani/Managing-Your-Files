import { z } from 'zod';

export const registerSchema = z.object({
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
    .regex(/\d/, 'Password must contain at least one number'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const resendCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export type ResendCodeDto = z.infer<typeof resendCodeSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
