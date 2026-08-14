import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { errorHandler } from './common/error-handler';
import { notFoundHandler } from './common/not-found-handler';
import { STORAGE_DIR } from './common/multer';
import { requestLogger } from './common/request-logger';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import { adminFilesRouter, filesRouter } from './modules/files/files.routes';
import statsRoutes from './modules/stats/stats.routes';
import { swaggerRouter } from './docs/swagger.routes';

const app = express();

app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.CLIENT_ORIGIN : true,
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(STORAGE_DIR));

const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/files', filesRouter);
apiRouter.use('/admin/files', adminFilesRouter);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/', swaggerRouter);

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    app.listen(env.PORT, () => {
      console.warn(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

void start();
