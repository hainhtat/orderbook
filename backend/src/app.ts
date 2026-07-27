import express, { type Express } from 'express';
import cors from 'cors';
import type { Env } from './config/env.js';
import { createCorsOptions } from './config/cors.js';
import { createPrismaClient } from './database/client.js';
import { requestIdMiddleware, localeMiddleware } from './middleware/request.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createV1Router } from './api/v1/index.js';
import { TokenService } from './utilities/tokens.js';

export type AppDependencies = {
  env: Env;
};

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const prisma = createPrismaClient(deps.env);
  const tokens = new TokenService(deps.env);

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(cors(createCorsOptions(deps.env)));
  app.use(express.json({ limit: '1mb' }));
  app.use(localeMiddleware);

  app.use('/api/v1', createV1Router({ env: deps.env, prisma, tokens }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
