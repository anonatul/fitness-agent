import { Router } from 'express';
import { executeTool } from '../agent/toolRegistry';
import type { ToolResult } from '../agent/toolTypes';
import { AppError } from '../errors';

export const trainingRouter = Router();

function arrayOf(result: ToolResult, key: string): unknown[] {
  if (!result.success) {
    return [];
  }

  const data = result.data;

  if (typeof data === 'object' && data !== null) {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readDays(raw: unknown): number {
  if (raw === undefined) {
    return 30;
  }

  const value = typeof raw === 'string' ? Number(raw) : Number.NaN;

  if (!Number.isInteger(value) || value < 1 || value > 90) {
    throw new AppError(400, 'days must be an integer between 1 and 90.');
  }

  return value;
}

trainingRouter.get('/recent', async (req, res, next) => {
  try {
    const days = readDays(req.query.days);

    const [strength, runs, recovery, metrics] = await Promise.all([
      executeTool('get_recent_strength', { days }),
      executeTool('get_recent_runs', { days }),
      executeTool('get_recovery', { days }),
      executeTool('get_body_metrics', { days }),
    ]);

    res.status(200).json({
      days,
      strengthSessions: arrayOf(strength, 'sessions'),
      runs: arrayOf(runs, 'runs'),
      recoveryLogs: arrayOf(recovery, 'logs'),
      bodyMetrics: arrayOf(metrics, 'metrics'),
    });
  } catch (error) {
    next(error);
  }
});

trainingRouter.post('/strength', async (req, res, next) => {
  try {
    const result = await executeTool('log_strength_session', req.body);

    if (!result.success) {
      const status = result.error.code === 'VALIDATION_ERROR' ? 400 : 502;
      res.status(status).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

trainingRouter.post('/run', async (req, res, next) => {
  try {
    const result = await executeTool('log_run', req.body);

    if (!result.success) {
      const status = result.error.code === 'VALIDATION_ERROR' ? 400 : 502;
      res.status(status).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
