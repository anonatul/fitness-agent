import { config } from '../config/env';
import { getWriteAthleteId } from '../db/athlete';
import { disconnectPrisma, getPrisma } from '../db/prisma';
import { executeTool, listToolNames } from './toolRegistry';
import type { ToolResult } from './toolTypes';

type SuccessResult = Extract<ToolResult, { success: true }>;

let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures += 1;
  }
}

function isSuccess(result: ToolResult): result is SuccessResult {
  return result.success;
}

function data(result: ToolResult): Record<string, unknown> {
  if (isSuccess(result) && typeof result.data === 'object' && result.data !== null) {
    return result.data as Record<string, unknown>;
  }
  return {};
}

function errorCode(result: ToolResult): string | null {
  return isSuccess(result) ? null : result.error.code;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function sessionCount(date: string, sessionType: 'STRENGTH' | 'RUN'): Promise<number> {
  const athleteId = await getWriteAthleteId();

  if (!athleteId) {
    return 0;
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 86_400_000);
  return getPrisma().trainingSession.count({
    where: { athleteId, sessionType, sessionDate: { gte: start, lt: end } },
  });
}

const strengthArgs = {
  sessionDate: '2026-11-20T10:00:00Z',
  durationMinutes: 45,
  perceivedEffort: 7,
  notes: 'Actually completed',
  exercises: [
    {
      name: 'Push-up',
      variation: 'Standard',
      orderIndex: 0,
      sets: [
        { setNumber: 1, reps: 8, rir: 2 },
        { setNumber: 2, reps: 7, rir: 2 },
        { setNumber: 3, reps: 6, rir: 2, notes: 'Last set hard' },
      ],
    },
  ],
};

async function main(): Promise<void> {
  const prisma = getPrisma();
  await prisma.athlete.deleteMany({ where: { id: config.athleteId } });

  console.log('1. Read tools');
  for (const name of ['get_current_phase', 'get_current_program']) {
    const result = await executeTool(name, {});
    check(`read ${name}`, isSuccess(result), errorCode(result) ?? 'ok');
  }
  const phaseData = data(await executeTool('get_current_phase', {}));
  check(
    'phase parsed',
    typeof phaseData.phaseName === 'string' && phaseData.phaseName.length > 0,
    String(phaseData.phaseName ?? '').slice(0, 60),
  );

  for (const name of [
    'get_recent_strength',
    'get_recent_runs',
    'get_recovery',
    'get_body_metrics',
  ]) {
    const result = await executeTool(name, {});
    check(`read ${name}`, isSuccess(result), errorCode(result) ?? 'ok');
  }

  console.log('\n2. Valid writes');
  const logged = await executeTool('log_strength_session', strengthArgs);
  check(
    'valid strength session logged',
    isSuccess(logged) && data(logged).status === 'logged',
    JSON.stringify(data(logged)),
  );

  const sessions = await prisma.trainingSession.findMany({
    where: { sessionDate: new Date('2026-11-20T10:00:00Z') },
    include: { strengthExercises: { include: { sets: true } } },
  });
  const actualReps = sessions[0]?.strengthExercises[0]?.sets.map((set) => set.reps) ?? [];
  check('actual reps stored exactly', JSON.stringify(actualReps) === '[8,7,6]', JSON.stringify(actualReps));

  const run = await executeTool('log_run', {
    sessionDate: '2026-11-21T09:00:00Z',
    distanceKm: 5,
    durationSeconds: 1920,
    runType: 'EASY',
    perceivedEffort: 4,
  });
  check('valid run logged', isSuccess(run) && data(run).status === 'logged', JSON.stringify(data(run)));

  const runRows = await prisma.run.findMany({ where: { distanceKm: 5 } });
  check(
    'nullable run HR stays null',
    runRows.length === 1 && runRows[0]?.averageHr === null,
    `HR=${String(runRows[0]?.averageHr)}`,
  );

  console.log('\n3. Partial workout');
  const partial = await executeTool('log_strength_session', {
    sessionDate: '2026-11-19T10:00:00Z',
    exercises: [
      {
        name: 'Band Row',
        orderIndex: 0,
        sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, rir: 3 }],
      },
    ],
  });
  check('partial session logged', isSuccess(partial) && data(partial).status === 'logged');
  const partialRows = await prisma.trainingSession.findMany({
    where: { sessionDate: new Date('2026-11-19T10:00:00Z') },
    include: { strengthExercises: { include: { sets: true } } },
  });
  const partialSets = partialRows[0]?.strengthExercises[0]?.sets ?? [];
  check(
    'no planned values invented',
    partialSets.length === 2 &&
      partialSets[0]?.reps === 12 &&
      partialSets[0]?.rir === null &&
      partialSets[1]?.reps === null &&
      partialSets[1]?.rir === 3,
    JSON.stringify(partialSets.map((set) => ({ reps: set.reps, rir: set.rir }))),
  );

  console.log('\n4. Duplicate protection');
  const duplicate = await executeTool('log_strength_session', strengthArgs);
  check(
    'same date + type detected',
    isSuccess(duplicate) && data(duplicate).status === 'possible_duplicate',
    JSON.stringify(data(duplicate)),
  );
  check('duplicate caused no second session', (await sessionCount('2026-11-20', 'STRENGTH')) === 1);
  const duplicateRun = await executeTool('log_run', {
    sessionDate: '2026-11-21T09:00:00Z',
    distanceKm: 8,
  });
  check(
    'duplicate run detected',
    isSuccess(duplicateRun) && data(duplicateRun).status === 'possible_duplicate',
  );

  console.log('\n5. Invalid arguments (must not reach Prisma)');
  const negativeReps = clone(strengthArgs);
  negativeReps.sessionDate = '2026-11-18T10:00:00Z';
  const negativeRepsValue = negativeReps.exercises[0]?.sets[0];
  if (negativeRepsValue) {
    negativeRepsValue.reps = -1;
  }
  check('negative reps rejected', errorCode(await executeTool('log_strength_session', negativeReps)) === 'VALIDATION_ERROR');
  check('negative reps created no session', (await sessionCount('2026-11-18', 'STRENGTH')) === 0);

  const negativeDuration = clone(strengthArgs);
  negativeDuration.sessionDate = '2026-11-17T10:00:00Z';
  negativeDuration.durationMinutes = -5;
  check('negative duration rejected', errorCode(await executeTool('log_strength_session', negativeDuration)) === 'VALIDATION_ERROR');

  const impossibleDate = clone(strengthArgs);
  impossibleDate.sessionDate = '2026-02-30';
  check('impossible date rejected', errorCode(await executeTool('log_strength_session', impossibleDate)) === 'VALIDATION_ERROR');

  const emptySets = clone(strengthArgs);
  emptySets.sessionDate = '2026-11-16T10:00:00Z';
  const firstExercise = emptySets.exercises[0];
  if (firstExercise) {
    firstExercise.sets = [];
  }
  check('malformed nested sets rejected', errorCode(await executeTool('log_strength_session', emptySets)) === 'VALIDATION_ERROR');

  check(
    'negative run distance rejected',
    errorCode(await executeTool('log_run', { sessionDate: '2026-11-15T09:00:00Z', distanceKm: -5 })) === 'VALIDATION_ERROR',
  );
  const noDate = await executeTool('log_run', { distanceKm: 7, runType: 'EASY' });
  check(
    'missing sessionDate defaults to today',
    isSuccess(noDate) && data(noDate).date === new Date().toISOString().slice(0, 10),
    JSON.stringify(data(noDate)),
  );
  check(
    'days out of range rejected',
    errorCode(await executeTool('get_recent_runs', { days: 999 })) === 'VALIDATION_ERROR',
  );

  console.log('\n6. Tool security');
  const unknown = await executeTool('delete_training_history', {});
  check('unknown tool rejected', errorCode(unknown) === 'UNKNOWN_TOOL', JSON.stringify(unknown));

  const names = listToolNames();
  check('no delete tool exists', names.every((name) => !name.toLowerCase().includes('delete')));
  check('no generic database tool exists', names.every((name) => !name.includes('sql') && !name.includes('query')));

  const injected = await executeTool('log_run', {
    sessionDate: '2026-11-14T09:00:00Z',
    distanceKm: 3,
    athleteId: 'attacker-controlled-id',
    sql: 'DROP TABLE "Athlete"',
  });
  check('injected fields ignored, write succeeds', isSuccess(injected) && data(injected).status === 'logged');
  const injectedRow = await prisma.trainingSession.findFirst({
    where: { sessionDate: new Date('2026-11-14T09:00:00Z') },
    select: { athleteId: true },
  });
  check(
    'athlete id is backend-controlled',
    injectedRow?.athleteId !== 'attacker-controlled-id' && injectedRow?.athleteId === (await getWriteAthleteId()),
    `athleteId=${injectedRow?.athleteId ?? 'missing'}`,
  );

  const malformedJson = await executeTool('log_run', '{not json');
  check('malformed tool arguments rejected', errorCode(malformedJson) === 'VALIDATION_ERROR');

  console.log('\n7. Read after write');
  const afterWrite = await executeTool('get_recent_strength', { days: 30 });
  const sessionsAfter = (data(afterWrite).sessions ?? []) as unknown[];
  check('logged session visible through read tool', sessionsAfter.length > 0, `${sessionsAfter.length} sessions`);

  console.log('');
  await prisma.athlete.deleteMany({ where: { id: config.athleteId } });

  if (failures > 0) {
    console.error(`${failures} tool check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('All tool checks passed.');
  }
}

void main()
  .catch((error: unknown) => {
    console.error('Tool check crashed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma().catch(() => undefined);
  });
