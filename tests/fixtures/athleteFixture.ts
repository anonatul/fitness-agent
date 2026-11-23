import type { BodyMetricView, RecoveryView, RunView, StrengthSessionView, TrainingState } from '../../src/training/types';

/** Test-only identity. Never used by the application at runtime. */
export const EVAL_ATHLETE_ID = 'eval-athlete-fixture';

export const fixtureProfile = 'Synthetic evaluation athlete: 30 years old, training at home with bands, a backpack, and a pull-up bar.';
export const fixtureGoals = 'Primary: strength and hypertrophy. Secondary: body composition. Tertiary: running base.';
export const fixtureEquipment = 'Resistance bands, adjustable backpack, push-up support, stability chair, pull-up bar.';
export const fixturePhase = 'Foundation strength and hypertrophy with an aerobic base.';
export const fixtureProgramNote = 'Synthetic program used only by evaluation fixtures.';

/**
 * Synthetic program Markdown. Mirrors the structure of the real source of
 * truth but contains no personal data, so evaluation is deterministic.
 */
export const fixtureProgramMarkdown = `# Current Training Program

# Strength A
## 1. Push-Up
**Sets:** 3
**Reps:** 5–10
**Target:** ~2 RIR

## 2. Band Row
**Sets:** 3
**Reps:** 8–15
**Target:** ~2 RIR

## 3. Bulgarian Split Squat
**Sets:** 2
**Reps:** 8–12
**Target:** 2 RIR

## 4. Band Face Pull
**Sets:** 2
**Reps:** 12–20
**Target:** 2 RIR

## 5. Backpack RDL
**Sets:** 2
**Reps:** 8–15
**Target:** 2 RIR

## 6. Dead Bug
**Sets:** 2
**Reps:** 8–12

# Strength B
## 1. Band-Assisted Chin-Up
**Sets:** 3
**Reps:** 5–8
**Target:** ~2 RIR

## 2. Band Row
**Sets:** 3
**Reps:** 8–15
**Target:** ~2 RIR

## 3. Pike Push-Up
**Sets:** 3
**Reps:** 5–10
**Target:** ~2 RIR

## 4. Reverse Lunge
**Sets:** 2
**Reps:** 8–12
**Target:** 2 RIR

# Strength C
## 1. Push-Up Variation
**Sets:** 3
**Reps:** 6–12
**Target:** ~2 RIR

## 2. Band Lat Pulldown
**Sets:** 3
**Reps:** 8–15
**Target:** ~2 RIR

## 3. Backpack RDL
**Sets:** 3
**Reps:** 8–15
**Target:** 2 RIR

## 4. Bulgarian Split Squat
**Sets:** 2
**Reps:** 8–12
**Target:** 2 RIR
`;

export function dateDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function recoveryLog(overrides: Partial<RecoveryView> = {}): RecoveryView {
  return {
    date: dateDaysAgo(0),
    sleepHours: 7.5,
    energyScore: 4,
    sorenessScore: 2,
    motivationScore: 4,
    restingHr: 58,
    ...overrides,
  };
}

export function pushUpSession(
  date: string,
  sets: Array<[number, number]>,
  name = 'Push-up',
): StrengthSessionView {
  return {
    date,
    perceivedEffort: 7,
    exercises: [
      {
        name,
        sets: sets.map(([reps, rir], index) => ({ setNumber: index + 1, reps, rir })),
      },
    ],
  };
}

export function runningSession(date: string, runType: string, distanceKm: number): RunView {
  return { date, runType, distanceKm, durationSeconds: 1920, perceivedEffort: 4, averageHr: null };
}

export function bodyMetric(overrides: Partial<BodyMetricView> = {}): BodyMetricView {
  return { date: dateDaysAgo(1), weightKg: 72, waistCm: 84, restingHr: 58, ...overrides };
}

export function emptyState(): TrainingState {
  return { strengthSessions: [], runs: [], recoveryLogs: [], bodyMetrics: [] };
}

export function normalState(): TrainingState {
  return {
    strengthSessions: [
      pushUpSession(dateDaysAgo(2), [[8, 2], [8, 2], [7, 2]]),
      pushUpSession(
        dateDaysAgo(5),
        [[8, 2], [7, 2], [7, 3]],
        'Band Row',
      ),
    ],
    runs: [runningSession(dateDaysAgo(3), 'EASY', 5)],
    recoveryLogs: [recoveryLog()],
    bodyMetrics: [bodyMetric()],
  };
}

export function progressionState(): TrainingState {
  return {
    strengthSessions: [
      pushUpSession(dateDaysAgo(1), [[10, 2], [10, 2], [10, 2]]),
      pushUpSession(dateDaysAgo(4), [[10, 2], [10, 2], [9, 2]]),
    ],
    runs: [runningSession(dateDaysAgo(3), 'EASY', 5)],
    recoveryLogs: [recoveryLog()],
    bodyMetrics: [bodyMetric()],
  };
}

export function poorRecoveryState(): TrainingState {
  return {
    ...normalState(),
    recoveryLogs: [
      recoveryLog({ sleepHours: 5, energyScore: 2, sorenessScore: 4, motivationScore: 2 }),
    ],
  };
}

export function concurrentConflictState(): TrainingState {
  return {
    strengthSessions: [
      {
        date: dateDaysAgo(1),
        exercises: [{ name: 'Bulgarian Split Squat', sets: [{ reps: 8, rir: 2 }] }],
      },
    ],
    runs: [runningSession(dateDaysAgo(1), 'QUALITY', 6)],
    recoveryLogs: [recoveryLog({ sleepHours: 7, energyScore: 3, sorenessScore: 3 })],
    bodyMetrics: [bodyMetric()],
  };
}

export function longRunFatigueState(): TrainingState {
  return {
    strengthSessions: [],
    runs: [runningSession(dateDaysAgo(2), 'LONG', 9)],
    recoveryLogs: [
      recoveryLog({ sleepHours: 5.5, energyScore: 2, sorenessScore: 4, motivationScore: 3 }),
    ],
    bodyMetrics: [],
  };
}

export function noRecoveryState(): TrainingState {
  return { ...normalState(), recoveryLogs: [] };
}

export function noHistoryState(): TrainingState {
  return emptyState();
}
