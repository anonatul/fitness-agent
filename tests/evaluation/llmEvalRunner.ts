import { spawn, type ChildProcess } from 'node:child_process';
import pg from 'pg';
import { getPrisma } from '../../src/db/prisma';
import {
  EVAL_ATHLETE_ID,
  dateDaysAgo,
  progressionState,
  recoveryLog,
} from '../fixtures/athleteFixture';
import { LLM_EVAL_CASES, type LlmEvalCase } from './llmEvalSet';

const PORT_EMPTY = 3110;
const PORT_SEEDED = 3111;

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

interface RunningServer {
  child: ChildProcess;
  log: () => string;
}

function startServer(port: number, athleteId: string): RunningServer {
  const child = spawn(process.execPath, ['--env-file=.env', 'dist/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), ATHLETE_ID: athleteId },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });

  return { child, log: () => output };
}

async function waitForHealth(port: number): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server on port ${port} did not become healthy.`);
}

function lastMatch(pattern: RegExp, log: string): string | null {
  const global = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  const matches = [...log.matchAll(global)];
  return matches.length > 0 ? (matches[matches.length - 1]?.[1] ?? null) : null;
}

function toolCallsSince(log: string): string[] {
  const calls: string[] = [];
  for (const match of log.matchAll(/\[agent\] round \d+ requested: (.+)/g)) {
    for (const name of (match[1] ?? '').split(',')) {
      calls.push(name.trim());
    }
  }
  return calls;
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

async function seedFixture(): Promise<void> {
  const prisma = getPrisma();
  await prisma.athlete.deleteMany({ where: { id: EVAL_ATHLETE_ID } });
  await prisma.athlete.create({
    data: {
      id: EVAL_ATHLETE_ID,
      name: 'Eval Athlete',
      age: 30,
      sex: 'female',
      heightCm: 170,
      currentWeightKg: 68,
      waistCm: 80,
      restingHr: 58,
    },
  });

  const state = progressionState();

  for (const session of state.strengthSessions) {
    await prisma.trainingSession.create({
      data: {
        athleteId: EVAL_ATHLETE_ID,
        sessionType: 'STRENGTH',
        sessionDate: new Date(session.date),
        completed: true,
        perceivedEffort: session.perceivedEffort ?? null,
        strengthExercises: {
          create: session.exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name,
            variation: 'Standard',
            orderIndex: exerciseIndex,
            sets: {
              create: exercise.sets.map((set, setIndex) => ({
                setNumber: setIndex + 1,
                reps: set.reps,
                rir: set.rir,
              })),
            },
          })),
        },
      },
    });
  }

  for (const run of state.runs) {
    await prisma.trainingSession.create({
      data: {
        athleteId: EVAL_ATHLETE_ID,
        sessionType: 'RUN',
        sessionDate: new Date(run.date),
        completed: true,
        run: {
          create: {
            distanceKm: run.distanceKm ?? null,
            durationSeconds: run.durationSeconds ?? null,
            runType: (run.runType ?? 'OTHER') as 'EASY' | 'QUALITY' | 'LONG' | 'RECOVERY' | 'OTHER',
            perceivedEffort: run.perceivedEffort ?? null,
            averageHr: null,
          },
        },
      },
    });
  }

  await prisma.recoveryLog.create({
    data: {
      athleteId: EVAL_ATHLETE_ID,
      date: new Date(dateDaysAgo(0)),
      sleepHours: recoveryLog().sleepHours,
      energyScore: recoveryLog().energyScore,
      sorenessScore: recoveryLog().sorenessScore,
      motivationScore: recoveryLog().motivationScore,
      restingHr: 58,
    },
  });

  await prisma.bodyMetric.create({
    data: {
      athleteId: EVAL_ATHLETE_ID,
      date: new Date(dateDaysAgo(1)),
      weightKg: 68,
      waistCm: 80,
      restingHr: 58,
    },
  });
}

async function setPoorRecovery(poor: boolean): Promise<void> {
  const prisma = getPrisma();
  await prisma.recoveryLog.deleteMany({
    where: { athleteId: EVAL_ATHLETE_ID, date: new Date(dateDaysAgo(0)) },
  });
  const values = poor
    ? { sleepHours: 5, energyScore: 2, sorenessScore: 4, motivationScore: 2 }
    : { sleepHours: 7.5, energyScore: 4, sorenessScore: 2, motivationScore: 4 };
  await prisma.recoveryLog.create({
    data: { athleteId: EVAL_ATHLETE_ID, date: new Date(dateDaysAgo(0)), restingHr: 58, ...values },
  });
}

function evaluateCase(
  evalCase: LlmEvalCase,
  intent: string | null,
  decision: string | null,
  tools: string[],
  before: Record<string, string>,
  after: Record<string, string>,
  response: string,
): void {
  check(
    `${evalCase.id} intent`,
    intent !== null && (evalCase.expectedIntents as readonly string[]).includes(intent),
    String(intent),
  );
  check(
    `${evalCase.id} decision category`,
    decision !== null && (evalCase.expectedDecisions as readonly string[]).includes(decision),
    String(decision),
  );

  if (evalCase.toolCall) {
    check(`${evalCase.id} tool called`, tools.includes(evalCase.toolCall), tools.join(',') || 'none');
  }
  if (evalCase.readToolsExpected) {
    check(`${evalCase.id} read tools used`, tools.some((tool) => tool.startsWith('get_')), tools.join(',') || 'none');
  }

  const wrote =
    Number(after.sessions ?? 0) > Number(before.sessions ?? 0) ||
    Number(after.runs ?? 0) > Number(before.runs ?? 0);
  check(`${evalCase.id} write expectation`, wrote === Boolean(evalCase.dbWrite), `write=${wrote}`);

  if (evalCase.outputSchema) {
    const lower = response.toLowerCase();
    const hasSchema =
      lower.includes('decision') &&
      lower.includes('reason') &&
      lower.includes('session') &&
      lower.includes('what to log') &&
      lower.includes('next check');
    check(`${evalCase.id} output schema`, hasSchema, response.slice(0, 90).replace(/\n/g, ' '));
  }

  if (evalCase.safetyBehavior) {
    const lower = response.toLowerCase();
    check(
      `${evalCase.id} safety behavior present`,
      ['pain', 'risk', 'recover', 'rest', 'medical', 'stop'].some((word) => lower.includes(word)),
      response.slice(0, 90).replace(/\n/g, ' '),
    );
  }

  if (evalCase.absenceCheck) {
    const lower = response.toLowerCase();
    const admitsMissing =
      /no (run|runs)|not logged|don'?t have|no data|not available/.test(lower);
    const inventsDistance = /\d+(\.\d+)?\s*(km|kilometers?)/.test(lower);
    check(`${evalCase.id} no hallucinated run`, admitsMissing && !inventsDistance, response.slice(0, 120).replace(/\n/g, ' '));
  }
}

async function runCases(phase: 'empty' | 'seeded', port: number, athleteId: string): Promise<void> {
  const server = startServer(port, athleteId);

  try {
    await waitForHealth(port);
    const only = process.env.LLM_EVAL_ONLY;
    const cases = LLM_EVAL_CASES.filter(
      (item) => item.phase === phase && (!only || item.id === only),
    );

    for (const evalCase of cases) {
      if (evalCase.id === 'L05') {
        await setPoorRecovery(true);
      }

      const before = await dbCounts();
      const logBefore = server.log().length;

      const response = await fetch(`http://127.0.0.1:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: evalCase.prompt }),
      });
      const body = (await response.json()) as { response?: string; error?: { message?: string } };
      const text = body.response ?? body.error?.message ?? '';

      const after = await dbCounts();
      const newLog = server.log().slice(logBefore);
      const intent = lastMatch(/\[intent\] (\w+)/, newLog);
      const decision = lastMatch(/\[decision\] intent=[^\n]*decision=(\w+)/, newLog);
      const tools = toolCallsSince(newLog);

      console.log(
        `[llm] ${evalCase.id} ${evalCase.prompt} | HTTP ${response.status} | intent=${intent} decision=${decision} tools=[${tools.join(',')}]`,
      );

      check(`${evalCase.id} HTTP 200`, response.status === 200, String(response.status));
      evaluateCase(evalCase, intent, decision, tools, before, after, text);

      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86_400_000);

      if (evalCase.id === 'L09') {
        const session = await getPrisma().trainingSession.findFirst({
          where: {
            athleteId: EVAL_ATHLETE_ID,
            sessionType: 'STRENGTH',
            sessionDate: { gte: start, lt: end },
          },
          include: { strengthExercises: { include: { sets: { orderBy: { setNumber: 'asc' } } } } },
        });
        const reps = session?.strengthExercises[0]?.sets.map((set) => set.reps) ?? [];
        check('L09 exact reps stored', JSON.stringify(reps) === '[10,8,6]', JSON.stringify(reps));
      }

      if (evalCase.id === 'L10') {
        const session = await getPrisma().trainingSession.findFirst({
          where: {
            athleteId: EVAL_ATHLETE_ID,
            sessionType: 'RUN',
            sessionDate: { gte: start, lt: end },
          },
          include: { run: true },
        });
        check(
          'L10 exact run values stored',
          session?.run?.distanceKm === 5 &&
            session.run.durationSeconds === 1920 &&
            session.run.averageHr === null,
          JSON.stringify(session?.run ?? null),
        );
      }

      if (evalCase.id === 'L05') {
        await setPoorRecovery(false);
      }
    }
  } finally {
    server.child.kill('SIGTERM');
  }
}

async function main(): Promise<void> {
  const prisma = getPrisma();
  await prisma.athlete.deleteMany({ where: { id: EVAL_ATHLETE_ID } });

  console.log('=== Empty-athlete evaluation ===');
  await runCases('empty', PORT_EMPTY, 'eval-empty-athlete');

  console.log('\n=== Seeded-athlete evaluation ===');
  await seedFixture();
  await runCases('seeded', PORT_SEEDED, EVAL_ATHLETE_ID);

  await prisma.athlete.deleteMany({ where: { id: EVAL_ATHLETE_ID } });

  console.log('');
  console.log(`Total LLM checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main()
  .catch((error: unknown) => {
    console.error('LLM evaluation crashed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().athlete.deleteMany({ where: { id: EVAL_ATHLETE_ID } }).catch(() => undefined);
  });
