import { config } from '../config/env';
import { AppError } from '../errors';
import { getDatabaseContext, type DatabaseContext } from '../services/dbContext';
import { loadMarkdownBatch } from './markdownLoader';
import { selectKnowledgeFiles } from './knowledgeRouter';

const CORE_AGENT_FILES = [
  'agent/system.md',
  'agent/safety.md',
  'agent/output_schema.md',
] as const;

const CORE_USER_FILES = [
  'user/profile.md',
  'user/goals.md',
  'user/equipment.md',
  'user/preferences.md',
] as const;

const CORE_PROGRAM_FILES = [
  'program/current_phase.md',
  'program/current_program.md',
  'program/progression_rules.md',
  'program/decision_rules.md',
] as const;

/**
 * Explicit precedence rules for the model. These are new orchestration
 * instructions, not copies of the Markdown source of truth.
 */
const INSTRUCTION_HIERARCHY = [
  '1. Safety rules override normal training rules.',
  '2. Current goals and phase determine priorities.',
  '3. Actual database state overrides planned assumptions.',
  '4. Markdown rules provide the training framework.',
  '5. General knowledge does not override athlete-specific rules.',
  '6. Do not invent missing data. Use "Unknown", "Not logged", or "Not provided" when a value was not supplied.',
].join('\n');

interface Section {
  name: string;
  body: string;
}

export interface ContextBuildResult {
  /** The full string sent to the model as `input`. */
  input: string;
  sizeChars: number;
  estimatedTokens: number;
  /** Knowledge modules actually included. */
  knowledgeFiles: string[];
  /** Matched modules omitted by the router cap or the size guard. */
  droppedKnowledgeFiles: string[];
  sectionSizes: Record<string, number>;
  database: DatabaseContext;
}

function renderFiles(
  files: readonly string[],
  loaded: Map<string, string | null>,
): string {
  return files
    .map((file) => {
      const content = loaded.get(file);

      if (content === null || content === undefined) {
        return `### ${file}\n(Not available.)`;
      }

      if (content.trim().length === 0) {
        return `### ${file}\n(Empty file.)`;
      }

      return `### ${file}\n${content.trim()}`;
    })
    .join('\n\n');
}

function wrapSection(section: Section): string {
  return `<${section.name}>\n${section.body}\n</${section.name}>`;
}

function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

function sectionSizes(sections: readonly Section[]): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const section of sections) {
    sizes[section.name] = section.body.length;
  }
  return sizes;
}

/**
 * Build the complete, labeled model input for a chat message.
 *
 * Order:
 *   instruction hierarchy → agent instructions → user context →
 *   program context → selected knowledge → database state → user message
 */
export async function buildChatContext(message: string): Promise<ContextBuildResult> {
  const userMessage = message.trim();

  if (userMessage.length === 0) {
    throw new AppError(400, 'message is required and must be a non-empty string.');
  }

  const selection = selectKnowledgeFiles(userMessage);

  const [coreFiles, knowledgeFiles, database] = await Promise.all([
    loadMarkdownBatch([...CORE_AGENT_FILES, ...CORE_USER_FILES, ...CORE_PROGRAM_FILES]),
    loadMarkdownBatch(selection.files),
    getDatabaseContext(),
  ]);

  const knowledgeBody =
    selection.files.length === 0
      ? '(No specific knowledge module matched this message. Rely on the core rules above.)'
      : renderFiles(selection.files, knowledgeFiles);

  const sections: Section[] = [
    { name: 'instruction_hierarchy', body: INSTRUCTION_HIERARCHY },
    { name: 'agent_instructions', body: renderFiles(CORE_AGENT_FILES, coreFiles) },
    { name: 'user_context', body: renderFiles(CORE_USER_FILES, coreFiles) },
    { name: 'program_context', body: renderFiles(CORE_PROGRAM_FILES, coreFiles) },
    { name: 'knowledge', body: knowledgeBody },
    { name: 'database_state', body: database.text },
    { name: 'user_message', body: userMessage },
  ];

  let includedKnowledge = selection.files;
  let droppedKnowledge = selection.dropped;
  let input = sections.map(wrapSection).join('\n\n');
  let sizes = sectionSizes(sections);

  if (input.length > config.contextMaxChars) {
    console.warn(
      `[context] assembled context is ${input.length} chars (~${estimateTokens(input.length)} est. tokens); ` +
        `dropping knowledge modules to fit the ${config.contextMaxChars} char limit.`,
    );

    const reducedSections = sections.filter((section) => section.name !== 'knowledge');
    const reducedInput = reducedSections.map(wrapSection).join('\n\n');

    if (reducedInput.length > config.contextMaxChars) {
      console.error(
        `[context] context still too large after dropping knowledge: ${reducedInput.length} chars.`,
      );
      throw new AppError(413, 'The request context is too large to process.');
    }

    droppedKnowledge = [...droppedKnowledge, ...includedKnowledge];
    includedKnowledge = [];
    input = reducedInput;
    sizes = sectionSizes(reducedSections);
  }

  console.info(
    `[context] size=${input.length} chars (~${estimateTokens(input.length)} est. tokens) ` +
      `knowledge=[${includedKnowledge.join(', ') || 'none'}]` +
      (droppedKnowledge.length > 0 ? ` dropped=[${droppedKnowledge.join(', ')}]` : ''),
  );

  return {
    input,
    sizeChars: input.length,
    estimatedTokens: estimateTokens(input.length),
    knowledgeFiles: includedKnowledge,
    droppedKnowledgeFiles: droppedKnowledge,
    sectionSizes: sizes,
    database,
  };
}
