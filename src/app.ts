import express from 'express';
import { config } from './config/env';
import { AppError } from './errors';
import { requireAuth } from './middleware/auth';
import { rateLimit } from './middleware/rateLimit';
import { authRouter } from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { chatRouter } from './routes/chat';
import { dashboardRouter } from './routes/dashboard';
import { healthRouter } from './routes/health';
import { programRouter } from './routes/program';
import { bodyMetricsRouter, recoveryRouter } from './routes/state';
import { trainingRouter } from './routes/training';

export const app = express();

app.disable('x-powered-by');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.frontendOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    next(new AppError(403, 'Origin is not allowed.'));
    return;
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '100kb' }));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
app.use('/api/chat', rateLimit(config.chatRateLimit, config.chatRateWindowMs));
app.use('/api/chat', chatRouter);
app.use('/api/training', trainingRouter);
app.use('/api/program', programRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/body-metrics', bodyMetricsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
