import OpenAI from 'openai';
import { config } from '../config/env';
import { AppError } from '../errors';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const { apiKey, baseURL } = config.agentRouter;

  if (!apiKey) {
    throw new AppError(500, 'Agent service is not configured.');
  }

  client ??= new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: { 'User-Agent': config.agentRouter.userAgent },
  });

  return client;
}

export async function generateReply(input: string): Promise<string> {
  const openai = getClient();

  try {
    const response = await openai.responses.create({
      model: config.agentRouter.model,
      input,
    });

    const text = response.output_text?.trim();

    if (!text) {
      throw new AppError(502, 'The agent returned an empty response.');
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Log only the message, server-side. Never forward provider details,
    // headers, or the API key to the client.
    console.error(
      'AgentRouter request failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw new AppError(502, 'The agent service is currently unavailable.');
  }
}
