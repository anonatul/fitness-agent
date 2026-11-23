import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { executeTool, listToolNames } from '../../src/agent/toolRegistry';
import { buildTrainingDecision } from '../../src/training/trainingDecision';
import type { TrainingDecision } from '../../src/training/types';
import { progressionState } from '../fixtures/athleteFixture';
import { SCENARIOS, toDecisionInput, type EvalScenario } from './scenarios';

let total = 0;
let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = ''): void {
  total += 1;

  if (ok) {
    passed += 1;
    console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function includesAll(haystack: readonly string[], needles: readonly string[]): boolean {
  return needles.every((needle) => haystack.some((item) => item.includes(needle)));
}

async function dbCounts(): Promise<Record<string, string>> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const result = await client.query(`
    select
      (select count(*) from "Athlete") as athletes,
      (select count(*) from "TrainingSession") as sessions,
      (select count(*) from "StrengthSet") as sets,
      (select count(*) from "Run") as runs
  `);
  await client.end();
  return result.rows[0] as Record<string, string>;
}

function verifyScenario(scenario: EvalScenario, decision: TrainingDecision): void {
  const expected = scenario.expected;

  if (expected.intents) {
    check(`${scenario.id} intent`, expected.intents.includes(decision.intent), decision.intent);
  }
  if (expected.decisions) {
    check(`${scenario.id} decision`, expected.decisions.includes(decision.decision), decision.decision);
  }
  if (expected.forbiddenDecisions) {
    check(
      `${scenario.id} forbidden decision avoided`,
      !expected.forbiddenDecisions.includes(decision.decision),
      decision.decision,
    );
  }
  if (expected.sessionTypes) {
    check(
      `${scenario.id} session type`,
      decision.session !== undefined && expected.sessionTypes.includes(decision.session.type),
      String(decision.session?.type),
    );
  }
  if (expected.readiness) {
    check(`${scenario.id} readiness`, expected.readiness.includes(decision.readiness), decision.readiness);
  }
  if (expected.safetyFlags) {
    check(
      `${scenario.id} safety flags`,
      includesAll(decision.safetyFlags, expected.safetyFlags),
      decision.safetyFlags.join(','),
    );
  }
  if (expected.dataNotesIncludes) {
    check(
      `${scenario.id} missing data disclosed`,
      includesAll(decision.dataNotes, expected.dataNotesIncludes),
      decision.dataNotes.join('; '),
    );
  }
  if (expected.modificationsInclude) {
    check(
      `${scenario.id} modification`,
      includesAll(decision.modifications, expected.modificationsInclude),
      decision.modifications.join('; '),
    );
  }
  if (expected.reasonIncludes) {
    check(
      `${scenario.id} reason evidence`,
      includesAll([decision.reason], expected.reasonIncludes),
      decision.reason.slice(0, 120),
    );
  }
  if (expected.progressionApply !== undefined) {
    check(`${scenario.id} progression apply`, decision.progression.apply === expected.progressionApply);
  }
  if (expected.maxExercises !== undefined) {
    check(
      `${scenario.id} exercise cap`,
      (decision.session?.exercises?.length ?? 0) <= expected.maxExercises,
      String(decision.session?.exercises?.length),
    );
  }
  if (expected.durationMinutes !== undefined) {
    check(
      `${scenario.id} duration`,
      decision.session?.durationMinutes === expected.durationMinutes,
      String(decision.session?.durationMinutes),
    );
  }
}

async function main(): Promise<void> {
  console.log('=== Scenario evaluation (deterministic, no GPT) ===');
  const before = await dbCounts();

  for (const scenario of SCENARIOS) {
    const decision = await buildTrainingDecision(toDecisionInput(scenario));
    verifyScenario(scenario, decision);
    console.log(
      `[eval] ${scenario.id} ${scenario.name}: intent=${decision.intent} decision=${decision.decision} ` +
        `readiness=${decision.readiness} session=${decision.session?.type ?? 'none'} flags=[${decision.safetyFlags.join(',')}]`,
    );
  }

  const after = await dbCounts();
  check(
    'INV: recommendation scenarios caused no database writes',
    JSON.stringify(before) === JSON.stringify(after),
    `${JSON.stringify(before)} -> ${JSON.stringify(after)}`,
  );

  console.log('\n=== Tool reliability ===');
  const ok = await executeTool('get_current_phase', {});
  check('successful tool returns success:true', ok.success === true);

  const badArgs = await executeTool('log_run', { distanceKm: -5 });
  check(
    'invalid arguments return VALIDATION_ERROR',
    !badArgs.success && badArgs.error.code === 'VALIDATION_ERROR',
    JSON.stringify(badArgs),
  );

  const unknown = await executeTool('drop_all_tables', {});
  check(
    'unknown tool rejected',
    !unknown.success && unknown.error.code === 'UNKNOWN_TOOL',
    JSON.stringify(unknown),
  );

  const names = listToolNames();
  check(
    'INV: no delete/sql/query/fs/shell tools',
    names.every((name) => !/(delete|drop|sql|query|file|shell|exec|athlete)/i.test(name)),
    names.join(','),
  );

  const injected = await executeTool('get_recent_runs', { days: 7, athleteId: 'attacker-id', sql: 'DROP TABLE' });
  check('injected tool fields ignored', injected.success === true);

  const probe = spawnSync(
    process.execPath,
    ['--import', 'tsx', 'tests/integration/dbFailureProbe.ts'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...process.env,
        ATHLETE_ID: 'db-failure-probe-athlete',
        DATABASE_URL: 'postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=no-verify',
      },
    },
  );
  const probeOutput = (probe.stdout ?? '').trim();
  const probeOk =
    probe.status === 0 &&
    probeOutput.startsWith('{') &&
    JSON.parse(probeOutput).success === false &&
    !/prisma|stack|econnrefused/i.test(probeOutput);
  check('database failure handled safely', probeOk, probeOutput || probe.stderr?.slice(0, 200));

  console.log('\n=== Hard invariants ===');
  const noHistory = await buildTrainingDecision(toDecisionInput(SCENARIOS[9] ?? SCENARIOS[0]!));
  check(
    'INV: missing data is never fabricated',
    noHistory.confidence === 'low' && noHistory.dataNotes.length > 0,
    noHistory.dataNotes.join('; '),
  );

  const painWithGoodLifts = await buildTrainingDecision(
    toDecisionInput({
      ...SCENARIOS[3]!,
      state: progressionState(),
    }),
  );
  check(
    'INV: safety considered before progression',
    painWithGoodLifts.decision !== 'PROGRESS' && painWithGoodLifts.progression.apply === false,
    `${painWithGoodLifts.decision} flags=[${painWithGoodLifts.safetyFlags.join(',')}]`,
  );

  const malformed = await executeTool('log_strength_session', {
    sessionDate: '2026-02-30',
    exercises: [{ name: 'Push-up', orderIndex: 0, sets: [{ setNumber: 1, reps: -2 }] }],
  });
  check(
    'INV: invalid tool arguments never reach Prisma',
    !malformed.success && malformed.error.code === 'VALIDATION_ERROR',
    JSON.stringify(malformed),
  );

  console.log('');
  console.log(`Total scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error('Evaluation runner crashed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
