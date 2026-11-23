import type {
  ResponseFunctionToolCall,
  ResponseInputItem,
} from 'openai/resources/responses/responses.js';
import { buildChatContext } from '../context/contextBuilder';
import { config } from '../config/env';
import { AppError } from '../errors';
import { callModel } from '../services/agentRouter';
import { formatDecisionForPrompt, runDecisionEngine } from './decisionEngine';
import { executeTool, listToolDefinitions } from './toolRegistry';

function isFunctionCall(item: unknown): item is ResponseFunctionToolCall {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const candidate = item as {
    type?: unknown;
    call_id?: unknown;
    name?: unknown;
    arguments?: unknown;
  };

  return (
    candidate.type === 'function_call' &&
    typeof candidate.call_id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.arguments === 'string'
  );
}

/**
 * Run a bounded model ↔ tool loop. All tool execution is dispatched through
 * the backend registry; the model only ever sees names, schemas and results.
 */
export async function runAgent(userMessage: string): Promise<string> {
  const { input } = await buildChatContext(userMessage);
  const decision = await runDecisionEngine(userMessage);
  const tools = listToolDefinitions();

  console.info(`[agent] decision=${decision.decision} intent=${decision.intent}`);

  const conversation: ResponseInputItem[] = [
    { role: 'user', content: `${input}\n\n${formatDecisionForPrompt(decision)}` },
  ];

  for (let round = 0; round < config.maxToolRounds; round += 1) {
    const response = await callModel({ input: conversation, tools });
    const calls = response.output.filter(isFunctionCall);

    if (calls.length === 0) {
      const text = response.output_text?.trim();

      if (!text) {
        throw new AppError(502, 'The agent returned an empty response.');
      }

      return text;
    }

    console.info(
      `[agent] round ${round + 1} requested: ${calls.map((call) => call.name).join(', ')}`,
    );

    conversation.push(...calls);

    for (const call of calls) {
      const result = await executeTool(call.name, call.arguments);
      console.info(
        `[agent] ${call.name}: ${result.success ? 'ok' : (result.error?.code ?? 'failed')}`,
      );

      conversation.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(result),
      });
    }
  }

  console.warn(`[agent] reached the tool limit of ${config.maxToolRounds} rounds.`);
  throw new AppError(
    502,
    'The agent stopped after reaching the tool limit. Please narrow the request.',
  );
}
