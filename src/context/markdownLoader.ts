import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Repository root, derived from this file's location so the loader works
 * whether it runs from `src/` (tsx) or `dist/` (compiled).
 */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const KNOWLEDGE_FILES = [
  'knowledge/00_core_principles.md',
  'knowledge/01_hypertrophy.md',
  'knowledge/02_progressive_overload.md',
  'knowledge/03_rir_and_failure.md',
  'knowledge/04_volume_frequency_intensity.md',
  'knowledge/05_exercise_selection.md',
  'knowledge/06_recovery.md',
  'knowledge/07_concurrent_training.md',
  'knowledge/08_running.md',
  'knowledge/09_half_marathon.md',
  'knowledge/10_nutrition.md',
  'knowledge/11_periodization.md',
  'knowledge/12_fatigue_management.md',
] as const;

/**
 * Only these exact relative paths may ever be read. The knowledge router and
 * context builder select from this set; user input never becomes a path.
 */
export const MARKDOWN_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  'agent/system.md',
  'agent/safety.md',
  'agent/output_schema.md',
  'user/profile.md',
  'user/goals.md',
  'user/equipment.md',
  'user/preferences.md',
  'program/current_phase.md',
  'program/current_program.md',
  'program/progression_rules.md',
  'program/decision_rules.md',
  ...KNOWLEDGE_FILES,
]);

export class MarkdownPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarkdownPathError';
  }
}

interface CacheEntry {
  mtimeMs: number;
  content: string;
}

const cache = new Map<string, CacheEntry>();

function normalizeRelativePath(relativePath: string): string {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new MarkdownPathError('Markdown path must be a non-empty string.');
  }

  if (relativePath.includes('\0') || relativePath.includes('\\')) {
    throw new MarkdownPathError('Markdown path contains invalid characters.');
  }

  if (path.isAbsolute(relativePath)) {
    throw new MarkdownPathError('Markdown path must be relative.');
  }

  const normalized = path.posix.normalize(relativePath);

  if (normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new MarkdownPathError('Markdown path escapes the project directory.');
  }

  if (!MARKDOWN_ALLOWLIST.has(normalized)) {
    throw new MarkdownPathError('Markdown path is not allowlisted.');
  }

  return normalized;
}

/**
 * Resolve an allowlisted relative path to an absolute path inside the project.
 * Throws for anything outside the allowlist or outside the project directory.
 */
export function resolveMarkdownPath(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const absolute = path.resolve(PROJECT_ROOT, normalized);

  if (absolute !== path.join(PROJECT_ROOT, normalized)) {
    throw new MarkdownPathError('Markdown path resolves outside the project directory.');
  }

  return absolute;
}

/**
 * Read one allowlisted Markdown file.
 * Returns `null` when the file does not exist; an empty string when it exists
 * but is empty. Throws on invalid or non-allowlisted paths.
 */
export async function loadMarkdown(relativePath: string): Promise<string | null> {
  const absolute = resolveMarkdownPath(relativePath);

  const info = await stat(absolute).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  });

  if (!info || !info.isFile()) {
    return null;
  }

  const cached = cache.get(absolute);

  if (cached && cached.mtimeMs === info.mtimeMs) {
    return cached.content;
  }

  const content = await readFile(absolute, 'utf8');
  cache.set(absolute, { mtimeMs: info.mtimeMs, content });

  return content;
}

/**
 * Load several allowlisted files in parallel. Missing or unreadable files map
 * to `null` rather than failing the whole batch.
 */
export async function loadMarkdownBatch(
  relativePaths: readonly string[],
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    relativePaths.map(async (relativePath) => {
      try {
        return [relativePath, await loadMarkdown(relativePath)] as const;
      } catch (error) {
        console.error(
          `[markdown] failed to load ${relativePath}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        return [relativePath, null] as const;
      }
    }),
  );

  return new Map(entries);
}
