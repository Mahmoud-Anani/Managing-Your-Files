import 'dotenv/config';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const seedEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_NAME: z.string().min(1),
  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .regex(/\d/, 'password must contain at least one number'),
  DATABASE_URL: z.string().min(1),
});

const env = seedEnvSchema.parse(process.env);

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });

  if (existing) {
    console.warn(`Admin ${env.ADMIN_EMAIL} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: passwordHash,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  console.warn(`Seeded admin user ${env.ADMIN_EMAIL}.`);
}

async function main(): Promise<void> {
  await seedAdmin();
}

void main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
