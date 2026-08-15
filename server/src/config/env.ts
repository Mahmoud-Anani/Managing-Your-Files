import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3002'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhdw]$/, 'JWT_EXPIRES_IN must look like 7d, 30m, 3600s')
    .default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhdw]$/, 'JWT_REFRESH_EXPIRES_IN must look like 7d, 30m, 3600s')
    .default('7d'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_NAME: z.string().min(1).default('Admin'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin123'),
  GMAIL_USER: z.string().email().optional().or(z.literal('')),
  GMAIL_PASS: z.string().optional().or(z.literal('')),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_FROM: z.string().default('Managing Your Files <no-reply@example.com>'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().max(100).default(25),
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, 'CLOUDINARY_API_SECRET is required'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
