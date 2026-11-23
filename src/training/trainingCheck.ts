import { classifyIntent, detectMissedWorkout, extractAvailableMinutes } from '../agent/intentClassifier';
import { buildTrainingDecision } from './trainingDecision';
import type { DecisionInput, RecoveryView, TrainingState } from './types';

let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures += 1;
  }
}

function emptyState(): TrainingState {
  return { strengthSessions: [], runs: [], recoveryLogs: [], bodyMetrics: [] };
}

function recovery(overrides: Partial<RecoveryView> = {}): RecoveryView {
  return {
    date: '2026-11-23',
    sleepHours: 8,
    energyScore: 4,
    sorenessScore: 2,
    motivationScore: 4,
    restingHr: 58,
    ...overrides,
  };
}

function pushUpSession(date: string, sets: Array<[number, number]>) {
  return {
    date,
    perceivedEffort: 7,
    exercises: [
      {
        name: 'Push-up',
        sets: sets.map(([reps, rir], index) => ({ setNumber: index + 1, reps, rir })),
      },
    ],
  };
}

function input(overrides: Partial<DecisionInput> & { message: string }): DecisionInput {
  return {
    intent: 'TODAY_TRAINING',
    state: emptyState(),
    availableMinutes: null,
    missedWorkout: false,
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('1. Intent classification');
  const cases: Array<[string, string]> = [
    ['What should I do today?', 'TODAY_TRAINING'],
    ['Should I progress my push-ups?', 'STRENGTH_PROGRESSION'],
    ['Should I run today?', 'RUNNING'],
    ['My legs are very sore.', 'RECOVERY'],
    ['I completed 3 sets of push-ups: 8, 7, 6 reps at 2 RIR.', 'LOG_WORKOUT'],
    ['I ran 5 km in 32 minutes, easy effort.', 'LOG_RUN'],
    ['Give me my weekly review.', 'WEEKLY_REVIEW'],
    ['How am I progressing?', 'PROGRESS_REVIEW'],
    ['Why does RIR matter?', 'GENERAL_KNOWLEDGE'],
    ['qwerty', 'CLARIFICATION'],
  ];
  for (const [message, expected] of cases) {
    const result = classifyIntent(message);
    check(`intent "${message.slice(0, 34)}"`, result.intent === expected, result.intent);
  }
  check('time-only message is training intent', classifyIntent('I only have 20 minutes today.').intent === 'TODAY_TRAINING');
  check('available minutes parsed', extractAvailableMinutes('I only have 20 minutes today.') === 20);
  check('hours parsed', extractAvailableMinutes('I have 1 hour.') === 60);
  check('missed workout detected', detectMissedWorkout("I missed yesterday's workout."));

  console.log('\n2. Scenario 1 — new user asks what to do');
  const s1 = await buildTrainingDecision(input({ message: 'What should I do today?' }));
  check('session produced', s1.session?.type === 'STRENGTH', String(s1.session?.type));
  check('no forced progression', s1.progression.apply === false);
  check('low confidence with no data', s1.confidence === 'low', s1.confidence);
  check('missing data disclosed', s1.dataNotes.length >= 2, s1.dataNotes.join('; '));

  console.log('\n3. Scenario 2 — good strength progression');
  const goodState: TrainingState = {
    ...emptyState(),
    recoveryLogs: [recovery()],
    strengthSessions: [
      pushUpSession('2026-11-22', [[10, 3], [10, 2], [10, 2]]),
      pushUpSession('2026-11-20', [[10, 2], [10, 2], [9, 2]]),
    ],
  };
  const s2 = await buildTrainingDecision(
    input({
      message: 'Should I progress my push-ups?',
      intent: 'STRENGTH_PROGRESSION',
      state: goodState,
    }),
  );
  check('progression decision', s2.decision === 'PROGRESS', s2.decision);
  check('progression apply is true', s2.progression.apply === true);
  check('confidence high with enough data', s2.confidence === 'high', s2.confidence);

  console.log('\n4. Scenario 3 — poor recovery');
  const poorRecovery: TrainingState = {
    ...emptyState(),
    recoveryLogs: [recovery({ sleepHours: 5, energyScore: 2, sorenessScore: 4 })],
    strengthSessions: [pushUpSession('2026-11-21', [[8, 2], [8, 2], [7, 2]])],
  };
  const s3 = await buildTrainingDecision(
    input({ message: 'What should I train today?', state: poorRecovery }),
  );
  check('recovery decision', s3.decision === 'RECOVERY', s3.decision);
  check('no progression under poor recovery', s3.progression.apply === false);
  check('readiness poor', s3.readiness === 'POOR', s3.readiness);
  check('safety flags recorded', s3.safetyFlags.length > 0, s3.safetyFlags.join(','));

  console.log('\n5. Scenario 4 — hard run + tired legs');
  const concurrentState: TrainingState = {
    ...emptyState(),
    recoveryLogs: [recovery({ sleepHours: 7, energyScore: 3, sorenessScore: 3 })],
    runs: [{ date: '2026-11-22', runType: 'QUALITY', distanceKm: 6, perceivedEffort: 8 }],
    strengthSessions: [
      {
        date: '2026-11-22',
        exercises: [{ name: 'Bulgarian Split Squat', sets: [{ reps: 8, rir: 2 }] }],
      },
    ],
  };
  const s4 = await buildTrainingDecision(
    input({
      message: 'Should I do legs today?',
      state: concurrentState,
    }),
  );
  check('modified decision', s4.decision === 'MODIFY', s4.decision);
  check('concurrent-load note present', s4.modifications.some((m) => /running/i.test(m)), s4.modifications.join(' | '));

  console.log('\n6. Scenario 5 — missed workout');
  const s5 = await buildTrainingDecision(
    input({
      message: "I missed yesterday's workout. Should I do two today?",
      missedWorkout: true,
    }),
  );
  check('not doubled', s5.decision === 'MODIFY', s5.decision);
  check('explicit no-doubling note', s5.modifications.some((m) => /not doubled/i.test(m)));

  console.log('\n7. Scenario 6 — pain safety override');
  const s6 = await buildTrainingDecision(
    input({ message: 'I have sharp knee pain during squats.', intent: 'RECOVERY' }),
  );
  check('safety overrides to REST', s6.decision === 'REST', s6.decision);
  check('pain flags present', s6.safetyFlags.includes('SHARP_PAIN'), s6.safetyFlags.join(','));

  console.log('\n8. Scenario 7 — limited time');
  const s7 = await buildTrainingDecision(
    input({ message: 'I only have 20 minutes today.', availableMinutes: 20 }),
  );
  check('shortened session', s7.session?.exercises?.length === 3, String(s7.session?.exercises?.length));
  check('duration respected', s7.session?.durationMinutes === 20);
  check('time note present', s7.modifications.some((m) => /20-minute/i.test(m)));

  console.log('\n9. Extra — failure is not progression');
  const failureState: TrainingState = {
    ...emptyState(),
    recoveryLogs: [recovery()],
    strengthSessions: [
      pushUpSession('2026-11-22', [[10, 0], [9, 0], [8, 0]]),
      pushUpSession('2026-11-20', [[10, 0], [10, 0], [10, 0]]),
    ],
  };
  const s8 = await buildTrainingDecision(
    input({ message: 'Should I progress?', intent: 'STRENGTH_PROGRESSION', state: failureState }),
  );
  check('near failure not progression', s8.decision !== 'PROGRESS', s8.decision);

  console.log('\n10. Extra — running selection');
  const runningState: TrainingState = {
    ...emptyState(),
    recoveryLogs: [recovery()],
    runs: [{ date: '2026-11-18', runType: 'EASY', distanceKm: 5 }],
  };
  const s9 = await buildTrainingDecision(
    input({ message: 'Should I do a quality run this week?', intent: 'RUNNING', state: runningState }),
  );
  check('quality run selected', s9.session?.type === 'QUALITY_RUN', String(s9.session?.type));

  console.log('');
  if (failures > 0) {
    console.error(`${failures} training check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('All training checks passed.');
  }
}

void main().catch((error: unknown) => {
  console.error('Training check crashed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
