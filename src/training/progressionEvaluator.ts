import { canonicalExerciseName, findProgramExercise } from './programRules';
import type { Readiness, StrengthSessionView, TrainingState } from './types';

export type ProgressionAction = 'PROGRESS' | 'MAINTAIN' | 'MODIFY' | 'INSUFFICIENT';

export interface ProgressionAssessment {
  action: ProgressionAction;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  exercise: string;
  target?: { min: number | null; max: number | null };
  observed?: { reps: number[]; rir: Array<number | null> };
}

function sessionsForExercise(
  sessions: readonly StrengthSessionView[],
  exerciseName: string,
): StrengthSessionView[] {
  const key = canonicalExerciseName(exerciseName);
  return sessions
    .filter((session) =>
      session.exercises.some((exercise) => canonicalExerciseName(exercise.name) === key),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

function setValues(session: StrengthSessionView, exerciseName: string) {
  const key = canonicalExerciseName(exerciseName);
  const exercise = session.exercises.find((item) => canonicalExerciseName(item.name) === key);
  const reps = (exercise?.sets ?? [])
    .map((set) => set.reps)
    .filter((value): value is number => value !== null && value !== undefined);
  const rir = (exercise?.sets ?? []).map((set) => set.rir);
  return { reps, rir };
}

function reachedUpperRange(reps: readonly number[], max: number | null): boolean {
  if (max === null || reps.length === 0) {
    return false;
  }

  const atUpper = reps.filter((value) => value >= max).length;
  return atUpper >= Math.ceil(reps.length / 2);
}

function effortAppropriate(rir: readonly (number | null)[]): boolean {
  const values = rir.filter((value): value is number => value !== null && value !== undefined);
  return values.length > 0 && values.every((value) => value >= 1 && value <= 4);
}

/** Deterministic double-progression evaluation using the program's target range. */
export async function evaluateStrengthProgression(
  exerciseName: string,
  state: TrainingState,
  readiness: Readiness,
  safetyFlags: readonly string[],
  programMarkdown?: string,
): Promise<ProgressionAssessment> {
  const found = await findProgramExercise(exerciseName, programMarkdown);
  const target = found?.exercise
    ? { min: found.exercise.repsMin, max: found.exercise.repsMax }
    : undefined;
  const sessions = sessionsForExercise(state.strengthSessions, exerciseName);
  const latest = sessions[0];
  const observed = latest ? setValues(latest, exerciseName) : undefined;

  const base = {
    exercise: exerciseName,
    target,
    observed,
  };

  if (safetyFlags.some((flag) => flag !== 'NORMAL_SORENESS')) {
    return {
      ...base,
      action: 'MODIFY',
      confidence: 'medium',
      reason:
        'Safety or fatigue flags are present. Do not progress this exercise while recovery or pain is unresolved.',
    };
  }

  if (readiness === 'POOR') {
    return {
      ...base,
      action: 'MODIFY',
      confidence: 'medium',
      reason: 'Readiness is poor; maintain or reduce this exercise instead of progressing.',
    };
  }

  if (sessions.length === 0 || target?.max === null || target?.max === undefined) {
    return {
      ...base,
      action: 'INSUFFICIENT',
      confidence: 'low',
      reason: 'No logged sets or no target range is available for this exercise.',
    };
  }

  const recent = sessions.slice(0, 3).map((session) => {
    const values = setValues(session, exerciseName);
    return {
      upper: reachedUpperRange(values.reps, target.max ?? null),
      effortOk: effortAppropriate(values.rir),
      reps: values.reps,
      rir: values.rir,
    };
  });

  const qualifying = recent.filter((entry) => entry.upper && entry.effortOk).length;
  const nearFailure = recent.some((entry) => entry.rir.some((value) => value === 0));

  if (nearFailure && qualifying < 2) {
    return {
      ...base,
      action: 'MODIFY',
      confidence: 'medium',
      reason:
        'Sets reached near failure (0 RIR). Near-failure performance is not progression; reduce load or effort first.',
    };
  }

  if (qualifying >= 2) {
    const previous = recent[1];
    const drop = previous && latest
      ? previous.reps.length > 0 && observed && observed.reps.length > 0
        ? previous.reps[0] !== undefined && observed.reps[0] !== undefined
          ? previous.reps[0] - observed.reps[0]
          : 0
        : 0
      : 0;

    if (drop >= 2) {
      return {
        ...base,
        action: 'MODIFY',
        confidence: 'medium',
        reason: 'Performance dropped meaningfully from the previous session; do not force progression.',
      };
    }

    return {
      ...base,
      action: 'PROGRESS',
      confidence: recent.length >= 3 ? 'high' : 'medium',
      reason: `Upper end of the ${target.min}–${target.max} rep range was reached repeatedly at an appropriate RIR with acceptable recovery.`,
    };
  }

  const hasData = recent.some((entry) => entry.reps.length > 0);

  if (!hasData) {
    return {
      ...base,
      action: 'INSUFFICIENT',
      confidence: 'low',
      reason: 'Logged sets did not include usable rep data.',
    };
  }

  return {
    ...base,
    action: 'MAINTAIN',
    confidence: 'medium',
    reason: `Performance is within the ${target.min}–${target.max} range, but progression criteria were not clearly met.`,
  };
}
