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

export const config = {
  port: readPort(),
  agentRouter: {
    apiKey: process.env.AGENTROUTER_API_KEY?.trim() ?? '',
    baseURL: process.env.AGENTROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: process.env.AGENT_MODEL?.trim() || DEFAULT_MODEL,
    userAgent: process.env.AGENTROUTER_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
  },
} as const;
