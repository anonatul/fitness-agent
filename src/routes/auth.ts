import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors';
import { authConfigured, clearSessionCookie, createSession, passwordMatches, readSession, setSessionCookie } from '../auth/session';

export const authRouter = Router();
const loginSchema = z.object({ password: z.string().min(1).max(1024) }).strict();

authRouter.post('/login', (req, res, next) => {
  try {
    if (!authConfigured()) throw new AppError(503, 'Authentication is not configured.');
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'A valid password is required.');
    if (!passwordMatches(parsed.data.password)) throw new AppError(401, 'Invalid credentials.');
    const session = createSession();
    setSessionCookie(res, session);
    res.status(200).json({ csrfToken: session.csrf });
  } catch (error) { next(error); }
});

authRouter.get('/session', (req, res) => {
  const session = authConfigured() ? readSession(req) : null;
  if (!session) return res.status(401).json({ error: { message: 'Authentication required.' } });
  res.status(200).json({ csrfToken: session.csrf });
});

authRouter.post('/logout', (_req, res) => { clearSessionCookie(res); res.status(204).end(); });
