import { Router } from 'express';
import { executeTool } from '../agent/toolRegistry';
import type { ToolResult } from '../agent/toolTypes';
import { AppError } from '../errors';

export const recoveryRouter = Router();
export const bodyMetricsRouter = Router();

function arrayOf(result: ToolResult, key: string): unknown[] {
  if (!result.success) {
    throw new AppError(502, 'Health data is currently unavailable.');
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

recoveryRouter.get('/', async (req, res, next) => {
  try {
    const raw = typeof req.query.days === 'string' ? Number(req.query.days) : 14;
    const days = Number.isInteger(raw) && raw >= 1 && raw <= 90 ? raw : 14;
    res.status(200).json(arrayOf(await executeTool('get_recovery', { days }), 'logs'));
  } catch (error) {
    next(error);
  }
});

bodyMetricsRouter.get('/', async (req, res, next) => {
  try {
    const raw = typeof req.query.days === 'string' ? Number(req.query.days) : 30;
    const days = Number.isInteger(raw) && raw >= 1 && raw <= 90 ? raw : 30;
    res.status(200).json(arrayOf(await executeTool('get_body_metrics', { days }), 'metrics'));
  } catch (error) {
    next(error);
  }
});
