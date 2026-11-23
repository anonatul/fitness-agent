import { toolError, type RegisteredTool, type ToolResult, type ToolSummary } from './toolTypes';
import { getBodyMetricsTool } from './tools/getBodyMetrics';
import { getCurrentPhaseTool } from './tools/getCurrentPhase';
import { getRecentRunsTool } from './tools/getRecentRuns';
import { getRecentStrengthTool } from './tools/getRecentStrength';
import { getRecoveryTool } from './tools/getRecovery';
import { logRunTool } from './tools/logRun';
import { logStrengthSessionTool } from './tools/logStrengthSession';
import { getCurrentPlanTool, modifySessionTool, rescheduleSessionTool } from './tools/planTools';

const TOOLS: readonly RegisteredTool[] = [
  getCurrentPhaseTool,
  getCurrentPlanTool,
  rescheduleSessionTool,
  modifySessionTool,
  getRecentStrengthTool,
  getRecentRunsTool,
  getRecoveryTool,
  getBodyMetricsTool,
  logStrengthSessionTool,
  logRunTool,
];

const registry = new Map<string, RegisteredTool>();

for (const tool of TOOLS) {
  if (registry.has(tool.name)) {
    throw new Error(`Duplicate tool name: ${tool.name}`);
  }
  registry.set(tool.name, tool);
}

export function listToolDefinitions(): ToolSummary[] {
  return TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    kind: tool.kind,
    parameters: tool.parameters,
  }));
}

export function listToolNames(): string[] {
  return [...registry.keys()];
}

export function getTool(name: string): RegisteredTool | undefined {
  return registry.get(name);
}

/**
 * The only entry point for executing a tool. Unknown names are rejected and
 * arguments are validated by the tool's own Zod schema.
 */
export async function executeTool(name: string, rawArgs: unknown): Promise<ToolResult> {
  const tool = registry.get(name);

  if (!tool) {
    return toolError('UNKNOWN_TOOL', `Unknown tool "${name}".`);
  }

  let args = rawArgs;

  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      return toolError('VALIDATION_ERROR', 'Tool arguments must be valid JSON.');
    }
  }

  return tool.execute(args);
}
