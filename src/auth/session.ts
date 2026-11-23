import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from '../config/env';

const COOKIE_NAME = 'fitness_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface Session { csrf: string; expiresAt: number }

function sign(value: string): string {
  return createHmac('sha256', config.auth.sessionSecret).update(value).digest('base64url');
}

function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookieValue(req: Request): string | undefined {
  return req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
}

export function authConfigured(): boolean {
  return Boolean(config.auth.password && config.auth.sessionSecret && config.athleteId);
}

export function passwordMatches(value: string): boolean {
  return Boolean(config.auth.password) && equal(value, config.auth.password);
}

export function createSession(): Session {
  return { csrf: randomBytes(24).toString('base64url'), expiresAt: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
}

export function setSessionCookie(res: Response, session: Session): void {
  const value = `${session.expiresAt}.${session.csrf}`;
  const sameSite = config.auth.cookieSecure ? 'None' : 'Lax';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${value}.${sign(value)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${MAX_AGE_SECONDS}${config.auth.cookieSecure ? '; Secure' : ''}`);
}

export function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${config.auth.cookieSecure ? '; Secure' : ''}`);
}

export function readSession(req: Request): Session | null {
  if (!config.auth.sessionSecret) return null;
  const parts = cookieValue(req)?.split('.') ?? [];
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const [expires, csrf, signature] = parts;
  const expiresAt = Number(expires);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000 || !equal(signature, sign(`${expires}.${csrf}`))) return null;
  return { csrf, expiresAt };
}
