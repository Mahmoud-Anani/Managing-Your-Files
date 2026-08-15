import { PrismaClient, Prisma } from '@prisma/client';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
// P1001 retry configuration for Accelerate idle-timeout handling
const P1001_MAX_RETRIES = 3;
const P1001_BASE_DELAY_MS = 500; // Start with 500ms, exponential backoff

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  /**
   * Middleware to handle P1001 errors from Accelerate idle-timeout disconnects.
   * Accelerate can silently close idle connections, so we retry with exponential backoff.
   */
  client.$use(
    async (
      params: Prisma.MiddlewareParams,
      next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
    ): Promise<unknown> => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= P1001_MAX_RETRIES; attempt++) {
        try {
          return await next(params);
        } catch (error) {
          lastError = error;

          // Only retry on P1001 errors (database unreachable)
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P1001'
          ) {
            // If this was the last retry attempt, rethrow
            if (attempt === P1001_MAX_RETRIES) {
              console.error(
                `[Prisma] P1001 error persisted after ${P1001_MAX_RETRIES} retries, giving up…`,
              );
              throw error;
            }

            // Calculate exponential backoff delay
            const delayMs = P1001_BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(
              `[Prisma] P1001 (attempt ${attempt}/${P1001_MAX_RETRIES}) — retrying in ${delayMs}ms…`,
            );
            await sleep(delayMs);
          } else {
            // Not a P1001 error, rethrow immediately
            throw error;
          }
        }
      }

      // Should not reach here, but throw last error if we do
      throw lastError;
    },
  );

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
