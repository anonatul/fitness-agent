import { config } from '../config/env';
import { getPrisma } from '../db/prisma';

export interface DatabaseCounts {
  trainingSessions: number;
  runs: number;
  recoveryLogs: number;
  bodyMetrics: number;
}

export interface DatabaseContext {
  available: boolean;
  text: string;
  counts: DatabaseCounts;
}

const EMPTY_COUNTS: DatabaseCounts = {
  trainingSessions: 0,
  runs: 0,
  recoveryLogs: 0,
  bodyMetrics: 0,
};

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function metric(value: number | null | undefined, suffix: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value}${suffix}`;
}

function joinParts(parts: ReadonlyArray<string | null>): string {
  return parts.filter((part): part is string => part !== null && part.length > 0).join(' ');
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function resolveAthleteId(): Promise<string | null> {
  if (config.athleteId) {
    return config.athleteId;
  }

  // Single-athlete development stage: fall back to the first stored athlete.
  const athlete = await getPrisma().athlete.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return athlete?.id ?? null;
}

/**
 * Retrieve a small, recent slice of the athlete's dynamic state.
 * Degrades to a readable note when the database is unconfigured or unavailable.
 */
export async function getDatabaseContext(): Promise<DatabaseContext> {
  if (!config.databaseUrl) {
    return {
      available: false,
      text: 'Database is not configured. No stored training state is available.',
      counts: { ...EMPTY_COUNTS },
    };
  }

  try {
    const prisma = getPrisma();
    const since = new Date(Date.now() - config.historyDays * 86_400_000);
    const athleteId = await resolveAthleteId();

    if (!athleteId) {
      return {
        available: true,
        text:
          'Database is connected, but no athlete record exists yet. ' +
          'No training history is available.',
        counts: { ...EMPTY_COUNTS },
      };
    }

    const [athlete, sessions, recoveryLogs, bodyMetrics] = await Promise.all([
      prisma.athlete.findUnique({ where: { id: athleteId }, select: { name: true } }),
      prisma.trainingSession.findMany({
        where: { athleteId, sessionDate: { gte: since } },
        orderBy: { sessionDate: 'desc' },
        take: 20,
        include: {
          strengthExercises: {
            orderBy: { orderIndex: 'asc' },
            include: { sets: { orderBy: { setNumber: 'asc' } } },
          },
          run: true,
        },
      }),
      prisma.recoveryLog.findMany({
        where: { athleteId, date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 14,
      }),
      prisma.bodyMetric.findMany({
        where: { athleteId, date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 14,
      }),
    ]);

    const lines: string[] = [];
    lines.push(`Athlete: ${athlete?.name?.trim() || 'unnamed'}`);
    lines.push(`Window: last ${config.historyDays} days (since ${formatDate(since)})`);
    lines.push('');

    lines.push(`Training sessions (${sessions.length}):`);
    if (sessions.length === 0) {
      lines.push('- None logged in this window.');
    }
    for (const session of sessions) {
      const header = joinParts([
        formatDate(session.sessionDate),
        session.sessionType,
        metric(session.durationMinutes, 'min'),
        metric(session.perceivedEffort, ' RPE'),
      ]);
      lines.push(`- ${header}`);

      for (const exercise of session.strengthExercises) {
        const setDetails = exercise.sets
          .map((set) => {
            const details = joinParts([
              metric(set.reps, ' reps'),
              metric(set.rir, ' RIR'),
              metric(set.loadKg, 'kg load'),
              metric(set.assistanceKg, 'kg assist'),
              metric(set.durationSeconds, 's'),
            ]);
            return details || 'details not logged';
          })
          .join('; ');
        const label = `${exercise.name}${exercise.variation ? ` (${exercise.variation})` : ''}`;
        lines.push(`  - ${label}: ${setDetails || 'no sets logged'}`);
      }

      if (session.run) {
        const runDetails = joinParts([
          session.run.runType,
          metric(session.run.distanceKm, 'km'),
          metric(session.run.durationSeconds, 's'),
          metric(session.run.averagePaceSecondsPerKm, 's/km pace'),
          metric(session.run.averageHr, 'bpm avg HR'),
          metric(session.run.perceivedEffort, ' RPE'),
          metric(session.run.elevationGainM, 'm elevation'),
        ]);
        lines.push(`  - RUN: ${runDetails || 'details not logged'}`);
      }

      if (session.notes?.trim()) {
        lines.push(`  - Notes: ${truncate(session.notes.trim(), 200)}`);
      }
    }

    lines.push('');
    lines.push(`Recovery logs (${recoveryLogs.length}):`);
    if (recoveryLogs.length === 0) {
      lines.push('- None logged in this window.');
    }
    for (const log of recoveryLogs) {
      const details = joinParts([
        metric(log.sleepHours, 'h sleep'),
        metric(log.energyScore, '/5 energy'),
        metric(log.sorenessScore, '/5 soreness'),
        metric(log.motivationScore, '/5 motivation'),
        metric(log.restingHr, 'bpm resting HR'),
      ]);
      const notes = log.notes?.trim() ? ` | Notes: ${truncate(log.notes.trim(), 200)}` : '';
      lines.push(`- ${formatDate(log.date)}: ${details || 'no metrics logged'}${notes}`);
    }

    lines.push('');
    lines.push(`Body metrics (${bodyMetrics.length}):`);
    if (bodyMetrics.length === 0) {
      lines.push('- None logged in this window.');
    }
    for (const body of bodyMetrics) {
      const details = joinParts([
        metric(body.weightKg, 'kg'),
        metric(body.waistCm, 'cm waist'),
        metric(body.restingHr, 'bpm resting HR'),
      ]);
      const notes = body.notes?.trim() ? ` | Notes: ${truncate(body.notes.trim(), 200)}` : '';
      lines.push(`- ${formatDate(body.date)}: ${details || 'no metrics logged'}${notes}`);
    }

    return {
      available: true,
      text: lines.join('\n'),
      counts: {
        trainingSessions: sessions.length,
        runs: sessions.filter((session) => session.run !== null).length,
        recoveryLogs: recoveryLogs.length,
        bodyMetrics: bodyMetrics.length,
      },
    };
  } catch (error) {
    console.error(
      '[db-context] failed to load recent state:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    return {
      available: false,
      text: 'Recent database state is currently unavailable.',
      counts: { ...EMPTY_COUNTS },
    };
  }
}
