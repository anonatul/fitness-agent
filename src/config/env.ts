import 'dotenv/config';

const DEFAULT_BASE_URL = 'https://agentrouter.org/v1';
const DEFAULT_MODEL = 'gpt-6.1-sol';
const DEFAULT_USER_AGENT = 'codex_cli_rs/0.20.0';
const DEFAULT_PORT = 3000;
const LOCAL_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function readPort(): number {
  const raw = process.env.PORT;

  if (!raw) {
    return DEFAULT_PORT;
  }

  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

function readOrigins(): string[] {
  const configured = (process.env.FRONTEND_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return configured.length ? [...new Set(configured)] : process.env.NODE_ENV === 'production' ? [] : LOCAL_ORIGINS;
}

export const config = {
  port: readPort(),
  databaseUrl: process.env.DATABASE_URL?.trim() ?? '',
  athleteId: process.env.ATHLETE_ID?.trim() ?? '',
  frontendOrigins: readOrigins(),
  auth: {
    password: process.env.AUTH_PASSWORD ?? '',
    sessionSecret: process.env.AUTH_SESSION_SECRET ?? '',
    cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  },
  chatRateLimit: readPositiveInt('CHAT_RATE_LIMIT', 20),
  chatRateWindowMs: readPositiveInt('CHAT_RATE_WINDOW_MS', 60_000),
  historyDays: readPositiveInt('AGENT_HISTORY_DAYS', 30),
  contextMaxChars: readPositiveInt('CONTEXT_MAX_CHARS', 200_000),
  maxToolRounds: readPositiveInt('AGENT_MAX_TOOL_ROUNDS', 5),
  agentRouter: {
    apiKey: process.env.AGENTROUTER_API_KEY?.trim() ?? '',
    baseURL: process.env.AGENTROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: process.env.AGENT_MODEL?.trim() || DEFAULT_MODEL,
    userAgent: process.env.AGENTROUTER_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
  },
} as const;
