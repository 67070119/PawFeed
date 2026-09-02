import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middlewares/request-id.js';
import { requestLogMiddleware } from './middlewares/request-log.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { pointsRouter } from './modules/points/points.routes.js';
import { feedingsRouter } from './modules/feedings/feedings.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { navigationRouter } from './modules/navigation/navigation.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(requestLogMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use('/uploads', express.static(path.resolve(env.uploadDir), {
    fallthrough: false,
    index: false,
    dotfiles: 'deny',
    immutable: false,
  }));

  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/points/:id/feedings', feedingsRouter);
  app.use('/api/points/:id/reports', reportsRouter);
  app.use('/api/points', pointsRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/navigation', navigationRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
