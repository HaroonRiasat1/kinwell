import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import { detectLanguage } from './middleware/language.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, allowedHeaders: ['Content-Type', 'Authorization', 'X-Language'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(detectLanguage);
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
