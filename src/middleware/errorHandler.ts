import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Not found.' } });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const err: unknown = error;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({ error: { message: 'Invalid JSON body.' } });
    return;
  }

  console.error(
    'Unexpected server error:',
    err instanceof Error ? err.message : 'Unknown error',
  );

  res.status(500).json({ error: { message: 'Internal server error.' } });
};
