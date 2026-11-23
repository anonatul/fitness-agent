import { Router } from 'express';
import { getCurrentPlan, sessionForAthlete } from '../db/plan';
import { AppError } from '../errors';

export const programRouter = Router();

programRouter.get('/', async (_req, res, next) => {
  try {
    const plan = await getCurrentPlan();
    if (!plan) throw new AppError(502, 'Program data is currently unavailable.');
    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
});

programRouter.get('/sessions/:sessionId', async (req, res, next) => { try { const session = await sessionForAthlete(req.params.sessionId); if (!session) throw new AppError(404, 'Planned session not found.'); res.status(200).json(session); } catch (error) { next(error); } });
