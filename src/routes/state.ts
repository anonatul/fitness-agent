import { Router } from 'express';
import { executeTool } from '../agent/toolRegistry';
import type { ToolResult } from '../agent/toolTypes';
import { AppError } from '../errors';

export const recoveryRouter = Router();
export const bodyMetricsRouter = Router();

function readDays(raw: unknown, fallback: number): number {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string') throw new AppError(400, 'days must be an integer between 1 and 90.');
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 90) throw new AppError(400, 'days must be an integer between 1 and 90.');
  return days;
}

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
    const days = readDays(req.query.days, 14);
    res.status(200).json(arrayOf(await executeTool('get_recovery', { days }), 'logs'));
  } catch (error) {
    next(error);
  }
});

bodyMetricsRouter.get('/', async (req, res, next) => {
  try {
    const days = readDays(req.query.days, 30);
    res.status(200).json(arrayOf(await executeTool('get_body_metrics', { days }), 'metrics'));
  } catch (error) {
    next(error);
  }
});
