import { Router } from 'express';
import { authConfigured } from '../auth/session';
import { config } from '../config/env';
import { checkDatabaseConnection } from '../db/check';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/ready', async (_req, res) => {
  const database = Boolean(config.databaseUrl) && await checkDatabaseConnection();
  const agentRouter = Boolean(config.agentRouter.apiKey);
  const authentication = authConfigured();
  const ready = database && agentRouter && authentication;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    checks: { database: database ? 'ok' : 'unavailable', agentRouter: agentRouter ? 'configured' : 'missing', authentication: authentication ? 'configured' : 'missing' },
  });
});
