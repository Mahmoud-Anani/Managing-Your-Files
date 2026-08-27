import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { env } from './config/env';
import { prisma, connectWithRetry } from './config/prisma';
import { errorHandler } from './common/error-handler';
import { notFoundHandler } from './common/not-found-handler';
import { requestLogger } from './common/request-logger';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import { adminFilesRouter, filesRouter } from './modules/files/files.routes';
import auditRoutes from './modules/audit/audit.routes';
import statsRoutes from './modules/stats/stats.routes';
import sharingRoutes from './modules/sharing/sharing.routes';
import { swaggerRouter } from './docs/swagger.routes';
import { createSocketServer } from './socket';

const app = express();

app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.CLIENT_ORIGIN : true,
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/files', filesRouter);
apiRouter.use('/admin/files', adminFilesRouter);
apiRouter.use('/admin/audit-logs', auditRoutes);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/sharing', sharingRoutes);
apiRouter.use('/', swaggerRouter);

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);
(globalThis as { __socketServer?: typeof io }).__socketServer = io;
app.set('io', io);

let server: ReturnType<typeof httpServer.listen> | undefined;

async function start(): Promise<void> {
  try {
    await connectWithRetry();
    server = httpServer.listen(env.PORT, () => {
      const base = `http://localhost:${env.PORT}`;
      console.warn(`[Server] Running on ${env.NODE_ENV} mode`);
      console.warn(`[Server] Running on ${base}`);
      console.warn(`[Server] Swagger UI  → ${base}/api/v1/docs`);
      console.warn(`[Server] Swagger JSON → ${base}/api/v1/docs.json`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  console.warn(`\n[Server] ${signal} received — shutting down…`);
  if (server) {
    server.close(() => {
      console.warn('[Server] HTTP server closed');
    });
  }
  try {
    await prisma.$disconnect();
    console.warn('[Server] Prisma disconnected');
  } catch {
    // ignore disconnect errors during shutdown
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start();
