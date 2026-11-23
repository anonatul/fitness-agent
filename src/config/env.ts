import 'dotenv/config';

const DEFAULT_BASE_URL = 'https://agentrouter.org/v1';
const DEFAULT_MODEL = 'gpt-6.1-sol';
const DEFAULT_USER_AGENT = 'codex_cli_rs/0.20.0';
const DEFAULT_PORT = 3000;

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

export const config = {
  port: readPort(),
  databaseUrl: process.env.DATABASE_URL?.trim() ?? '',
  athleteId: process.env.ATHLETE_ID?.trim() ?? '',
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
