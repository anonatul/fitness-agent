import { Router } from 'express';
import { runDecisionEngine } from '../agent/decisionEngine';
import { executeTool } from '../agent/toolRegistry';
import type { ToolResult } from '../agent/toolTypes';

export const dashboardRouter = Router();

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

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    const [decision, strength, runs, recovery, metrics] = await Promise.all([
      runDecisionEngine('What should I do today?'),
      executeTool('get_recent_strength', { days: 14 }),
      executeTool('get_recent_runs', { days: 14 }),
      executeTool('get_recovery', { days: 14 }),
      executeTool('get_body_metrics', { days: 14 }),
    ]);

    res.status(200).json({
      decision,
      recent: {
        strengthSessions: arrayOf(strength, 'sessions'),
        runs: arrayOf(runs, 'runs'),
        recoveryLogs: arrayOf(recovery, 'logs'),
        bodyMetrics: arrayOf(metrics, 'metrics'),
      },
    });
  } catch (error) {
    next(error);
  }
});
