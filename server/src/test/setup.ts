import { beforeEach, vi } from 'vitest';

const envVars: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '8080',
  CLIENT_ORIGIN: 'http://localhost:3002',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
  JWT_SECRET: 'test-secret-0123456789abcdef',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef',
  JWT_REFRESH_EXPIRES_IN: '7d',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_NAME: 'Admin',
  ADMIN_PASSWORD: 'Admin123',
  BREVO_API_KEY: '',
  EMAIL_FROM: '',
  EMAIL_FROM_NAME: 'Managing Your Files',
  MAX_FILE_SIZE_MB: '25',
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_API_SECRET: 'test-secret',
};

for (const [key, value] of Object.entries(envVars)) {
  process.env[key] = value;
}

beforeEach(() => {
  vi.clearAllMocks();
});
