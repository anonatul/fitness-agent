import type { RequestHandler } from 'express';
import { AppError } from '../errors';
import { authConfigured, readSession } from '../auth/session';

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!authConfigured()) return next(new AppError(503, 'Authentication is not configured.'));
  const session = readSession(req);
  if (!session) return next(new AppError(401, 'Authentication required.'));
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['x-csrf-token'] !== session.csrf) {
    return next(new AppError(403, 'Invalid request token.'));
  }
  resLocals(req, session.csrf);
  next();
};

function resLocals(req: Parameters<RequestHandler>[0], csrf: string): void {
  req.res?.locals && (req.res.locals.csrf = csrf);
}
