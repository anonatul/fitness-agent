import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { chatRouter } from './routes/chat';
import { dashboardRouter } from './routes/dashboard';
import { healthRouter } from './routes/health';
import { programRouter } from './routes/program';
import { bodyMetricsRouter, recoveryRouter } from './routes/state';
import { trainingRouter } from './routes/training';

export const app = express();

app.disable('x-powered-by');

// The app has no auth; the browser only ever talks to this backend.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '100kb' }));

app.use('/health', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/training', trainingRouter);
app.use('/api/program', programRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/body-metrics', bodyMetricsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
