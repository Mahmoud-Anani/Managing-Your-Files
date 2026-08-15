import { PrismaClient, Prisma } from '@prisma/client';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const P1001_RETRY_DELAY_MS = 2000;

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

  client.$use(async (params, next) => {
    const result = await next(params);
    return result;
  });

  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P1001'
      ) {
        console.warn(
          `[Prisma] P1001 — retrying query in ${P1001_RETRY_DELAY_MS}ms…`,
        );
        await sleep(P1001_RETRY_DELAY_MS);
        return next(params);
      }
      throw error;
    }
  });

  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      console.warn(`[Prisma] Connected to database (attempt ${attempt})`);
      return;
    } catch (error) {
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.error(
        `[Prisma] Connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms…`,
      );
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      await sleep(delay);
    }
  }
}
