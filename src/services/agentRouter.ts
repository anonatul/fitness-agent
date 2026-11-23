import OpenAI from 'openai';
import type {
  FunctionTool,
  Response,
  ResponseInputItem,
} from 'openai/resources/responses/responses.js';
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

export interface ModelToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ModelRequest {
  input: readonly ResponseInputItem[];
  tools: readonly ModelToolDefinition[];
}

/**
 * Low-level Responses API call. The model receives only tool names,
 * descriptions and JSON schemas — never Prisma or application internals.
 */
export async function callModel(request: ModelRequest): Promise<Response> {
  const openai = getClient();

  try {
    return await openai.responses.create({
      model: config.agentRouter.model,
      input: [...request.input],
      tools: request.tools.map(
        (tool): FunctionTool => ({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          strict: false,
        }),
      ),
    });
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
