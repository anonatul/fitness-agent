import { Router } from 'express';
import { runAgent } from '../agent/agentRunner';
import { AppError } from '../errors';

export const chatRouter = Router();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

chatRouter.post('/', async (req, res, next) => {
  try {
    const body: unknown = req.body;
    const message = isRecord(body) ? body.message : undefined;

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError(400, 'message is required and must be a non-empty string.');
    }

    const response = await runAgent(message.trim());

    res.status(200).json({ response });
  } catch (error) {
    next(error);
  }
});
