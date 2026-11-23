import { buildTrainingDecision } from '../training/trainingDecision';
import type {
  BodyMetricView,
  RecoveryView,
  RunView,
  StrengthExerciseView,
  StrengthSessionView,
  TrainingDecision,
  TrainingState,
} from '../training/types';
import { classifyIntent, detectMissedWorkout, extractAvailableMinutes } from './intentClassifier';
import { executeTool } from './toolRegistry';
import type { ToolResult } from './toolTypes';

const STATE_DAYS = 30;

function records(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
  );
}

function dataOf(result: ToolResult): Record<string, unknown> {
  return result.success && typeof result.data === 'object' && result.data !== null
    ? (result.data as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function mapStrength(value: unknown): StrengthSessionView[] {
  return records(value).map((session) => ({
    date: text(session.date) ?? '',
    perceivedEffort: number(session.perceivedEffort),
    exercises: records(session.exercises).map(
      (exercise): StrengthExerciseView => ({
        name: text(exercise.name) ?? 'Unknown',
        sets: records(exercise.sets).map((set) => ({
          reps: number(set.reps),
          rir: number(set.rir),
          loadKg: number(set.loadKg),
        })),
      }),
    ),
  }));
}

function mapRuns(value: unknown): RunView[] {
  return records(value).map((run) => ({
    date: text(run.date) ?? '',
    distanceKm: number(run.distanceKm),
    durationSeconds: number(run.durationSeconds),
    runType: text(run.runType),
    perceivedEffort: number(run.perceivedEffort),
    averageHr: number(run.averageHr),
  }));
}

function mapRecovery(value: unknown): RecoveryView[] {
  return records(value).map((log) => ({
    date: text(log.date) ?? '',
    sleepHours: number(log.sleepHours),
    energyScore: number(log.energyScore),
    sorenessScore: number(log.sorenessScore),
    motivationScore: number(log.motivationScore),
    restingHr: number(log.restingHr),
  }));
}

function mapBodyMetrics(value: unknown): BodyMetricView[] {
  return records(value).map((metric) => ({
    date: text(metric.date) ?? '',
    weightKg: number(metric.weightKg),
    waistCm: number(metric.waistCm),
    restingHr: number(metric.restingHr),
  }));
}

async function loadTrainingState(): Promise<TrainingState> {
  const [strength, runs, recovery, metrics] = await Promise.all([
    executeTool('get_recent_strength', { days: STATE_DAYS }),
    executeTool('get_recent_runs', { days: STATE_DAYS }),
    executeTool('get_recovery', { days: STATE_DAYS }),
    executeTool('get_body_metrics', { days: STATE_DAYS }),
  ]);

  for (const [name, result] of [
    ['get_recent_strength', strength],
    ['get_recent_runs', runs],
    ['get_recovery', recovery],
    ['get_body_metrics', metrics],
  ] as const) {
    if (!result.success) {
      console.warn(`[decision] state source ${name} unavailable: ${result.error.code}`);
    }
  }

  return {
    strengthSessions: mapStrength(dataOf(strength).sessions),
    runs: mapRuns(dataOf(runs).runs),
    recoveryLogs: mapRecovery(dataOf(recovery).logs),
    bodyMetrics: mapBodyMetrics(dataOf(metrics).metrics),
  };
}

export async function runDecisionEngine(message: string): Promise<TrainingDecision> {
  const started = Date.now();
  const intent = classifyIntent(message);
  const availableMinutes = extractAvailableMinutes(message);
  const missedWorkout = detectMissedWorkout(message);

  console.info(
    `[intent] ${intent.intent} confidence=${intent.confidence} ` +
      `time=${availableMinutes ?? 'unknown'}min missed=${missedWorkout}`,
  );

  const state = await loadTrainingState();
  const decision = await buildTrainingDecision({
    message,
    intent: intent.intent,
    state,
    availableMinutes,
    missedWorkout,
  });

  console.info(`[decision] total durationMs=${Date.now() - started}`);
  return decision;
}

/** Converts the structured decision into an authoritative prompt section. */
export function formatDecisionForPrompt(decision: TrainingDecision): string {
  return [
    '<training_decision>',
    'This structured decision was produced by deterministic backend rules. Treat it as authoritative for safety, readiness, and decision kind.',
    JSON.stringify(decision, null, 2),
    '',
    'Rules for the final response:',
    '- Follow agent/output_schema.md (Decision, Reason, Today\'s Session, What to Log, Next Check) and keep it concise.',
    '- Do not claim any training data that is not present in the retrieved context or tool results.',
    '- Use dataNotes to state clearly when information is missing; do not fill gaps with assumptions.',
    '- Do not change the phase, program, or persistent progression. Nothing is saved unless a logging tool actually succeeds.',
    '- If the user reports completed training, you may still call log_strength_session or log_run with only reported values.',
    '- When decision is REST or RECOVERY, do not prescribe a normal hard session.',
    '</training_decision>',
  ].join('\n');
}
