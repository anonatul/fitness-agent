import { Router } from 'express';
import { executeTool } from '../agent/toolRegistry';
import type { ToolResult } from '../agent/toolTypes';
import { AppError } from '../errors';

export const programRouter = Router();

function dataOf(result: ToolResult): unknown {
  if (!result.success) {
    throw new AppError(502, 'Program data is currently unavailable.');
  }
  return result.data;
}

programRouter.get('/', async (_req, res, next) => {
  try {
    const [phase, program] = await Promise.all([
      executeTool('get_current_phase', {}),
      executeTool('get_current_program', {}),
    ]);

    res.status(200).json({ phase: dataOf(phase), program: dataOf(program) });
  } catch (error) {
    next(error);
  }
});
