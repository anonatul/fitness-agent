import { z } from 'zod';

export type ToolKind = 'read' | 'write';

export type ToolResult =
  | { success: true; data: unknown }
  | { success: false; error: { code: string; message: string } };

export interface ToolSummary {
  name: string;
  description: string;
  kind: ToolKind;
  parameters: Record<string, unknown>;
}

export interface RegisteredTool extends ToolSummary {
  execute: (args: unknown) => Promise<ToolResult>;
}

interface DefineToolOptions<TArgs> {
  name: string;
  description: string;
  kind: ToolKind;
  schema: z.ZodType<TArgs>;
  handler: (args: TArgs) => Promise<ToolResult>;
}

export function toolSuccess(data: unknown): ToolResult {
  return { success: true, data };
}

export function toolError(code: string, message: string): ToolResult {
  return { success: false, error: { code, message } };
}

/**
 * Build a registry entry from a single Zod schema. The same schema is used for
 * (a) model-facing JSON Schema and (b) runtime validation, so invalid
 * arguments never reach the handler or Prisma.
 */
export function defineTool<TArgs>(options: DefineToolOptions<TArgs>): RegisteredTool {
  const generated = z.toJSONSchema(options.schema) as unknown as Record<string, unknown>;
  const { $schema: _schema, ...parameters } = generated;

  return {
    name: options.name,
    description: options.description,
    kind: options.kind,
    parameters,
    execute: async (args: unknown): Promise<ToolResult> => {
      const parsed = options.schema.safeParse(args);

      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return toolError('VALIDATION_ERROR', issue?.message ?? 'Invalid tool arguments.');
      }

      try {
        return await options.handler(parsed.data);
      } catch (error) {
        // Technical details stay on the server; the model gets a safe result.
        console.error(
          `[tool] ${options.name} failed:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        return toolError('TOOL_ERROR', 'The tool could not be completed.');
      }
    },
  };
}
