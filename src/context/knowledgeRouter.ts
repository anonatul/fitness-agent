import { MARKDOWN_ALLOWLIST } from './markdownLoader';

interface KnowledgeRule {
  file: string;
  keywords: readonly string[];
}

/**
 * Deterministic topic routing. Each rule maps keywords that may appear in a
 * user message to one allowlisted knowledge file. Add synonyms here rather
 * than writing conditional logic in the router.
 */
const KNOWLEDGE_RULES: readonly KnowledgeRule[] = [
  {
    file: 'knowledge/00_core_principles.md',
    keywords: [
      'principle',
      'principles',
      'core principle',
      'training philosophy',
      'general training',
      'foundation',
      'what should i train',
      'train today',
    ],
  },
  {
    file: 'knowledge/01_hypertrophy.md',
    keywords: [
      'push-up',
      'push-ups',
      'pushup',
      'pushups',
      'push up',
      'push ups',
      'muscle',
      'muscles',
      'hypertrophy',
      'build size',
      'gain size',
      'chest',
      'bench',
      'squat',
      'bodybuilding',
    ],
  },
  {
    file: 'knowledge/02_progressive_overload.md',
    keywords: [
      'progress',
      'progressing',
      'progression',
      'progressive overload',
      'overload',
      'rep',
      'reps',
      'add weight',
      'more weight',
      'increase weight',
      'increase reps',
      'plateau',
      'stalled',
      'stall',
    ],
  },
  {
    file: 'knowledge/03_rir_and_failure.md',
    keywords: ['rir', 'failure', 'reps in reserve', 'near failure', 'to failure'],
  },
  {
    file: 'knowledge/04_volume_frequency_intensity.md',
    keywords: [
      'set',
      'sets',
      'volume',
      'frequency',
      'intensity',
      'how many sets',
      'how often',
    ],
  },
  {
    file: 'knowledge/05_exercise_selection.md',
    keywords: [
      'exercise',
      'exercises',
      'substitute',
      'substitution',
      'swap',
      'replace exercise',
      'movement',
      'movement pattern',
      'variation',
    ],
  },
  {
    file: 'knowledge/06_recovery.md',
    keywords: [
      'sleep',
      'sleeping',
      'sore',
      'soreness',
      'recovery',
      'recover',
      'fatigue',
      'fatigued',
      'tired',
      'rest day',
    ],
  },
  {
    file: 'knowledge/07_concurrent_training.md',
    keywords: [
      'concurrent',
      'interference',
      'strength and running',
      'running and strength',
      'run and lift',
      'lifting and running',
      'cardio and strength',
    ],
  },
  {
    file: 'knowledge/08_running.md',
    keywords: [
      'running',
      'run',
      'runs',
      'ran',
      'jog',
      'jogging',
      'pace',
      'intervals',
      'tempo',
      'aerobic',
    ],
  },
  {
    file: 'knowledge/09_half_marathon.md',
    keywords: [
      'half marathon',
      'half-marathon',
      '21.1',
      '13.1',
      'marathon',
      'race',
      'long-term running goal',
    ],
  },
  {
    file: 'knowledge/10_nutrition.md',
    keywords: [
      'protein',
      'calorie',
      'calories',
      'nutrition',
      'diet',
      'food',
      'eating',
      'deficit',
      'surplus',
    ],
  },
  {
    file: 'knowledge/11_periodization.md',
    keywords: [
      'phase',
      'periodization',
      'periodisation',
      'block',
      'cycle',
      'mesocycle',
      'macrocycle',
    ],
  },
  {
    file: 'knowledge/12_fatigue_management.md',
    keywords: [
      'fatigue',
      'readiness',
      'deload',
      'overtraining',
      'burnout',
      'accumulated fatigue',
      'recovery debt',
    ],
  },
];

/** Keep prompts bounded even when many topics match at once. */
const MAX_SELECTED_FILES = 5;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatcher(keyword: string): RegExp {
  const escaped = escapeRegExp(keyword.toLowerCase());
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i');
}

const MATCHERS = KNOWLEDGE_RULES.map((rule) => ({
  file: rule.file,
  matchers: rule.keywords.map(keywordMatcher),
}));

export interface KnowledgeSelection {
  /** Selected allowlisted knowledge files, highest relevance first. */
  files: string[];
  /** Match counts keyed by file. */
  scores: Record<string, number>;
  /** Files that matched but were dropped by the cap. */
  dropped: string[];
}

/**
 * Pick relevant knowledge files from the predefined allowlist. Never builds
 * filesystem paths from user input; it only returns known allowlisted names.
 */
export function selectKnowledgeFiles(message: string): KnowledgeSelection {
  const text = message.toLowerCase();

  const scored = MATCHERS.map(({ file, matchers }) => {
    const score = matchers.reduce((total, matcher) => total + (matcher.test(text) ? 1 : 0), 0);
    return { file, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  const files = scored.slice(0, MAX_SELECTED_FILES).map((entry) => entry.file);
  const dropped = scored.slice(MAX_SELECTED_FILES).map((entry) => entry.file);

  for (const file of files) {
    if (!MARKDOWN_ALLOWLIST.has(file)) {
      throw new Error(`Knowledge router selected a non-allowlisted file: ${file}`);
    }
  }

  const scores: Record<string, number> = {};
  for (const entry of scored) {
    scores[entry.file] = entry.score;
  }

  return { files, scores, dropped };
}
