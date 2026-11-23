import { getReadAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import { recentArgs, type RecentArgs } from '../schemas/toolSchemas';
import { sinceDays } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const getRecentRunsTool = defineTool({
  name: 'get_recent_runs',
  description:
    'Return recent ACTUAL completed runs with distance, duration, pace, HR when available, RPE, run type, elevation, and notes.',
  kind: 'read',
  schema: recentArgs,
  handler: async ({ days }: RecentArgs) => {
    const window = days ?? 14;
    const athleteId = await getReadAthleteId();

    if (!athleteId) {
      return toolSuccess({ days: window, runs: [], note: 'No athlete record exists yet.' });
    }

    const sessions = await getPrisma().trainingSession.findMany({
      where: {
        athleteId,
        sessionType: 'RUN',
        completed: true,
        sessionDate: { gte: sinceDays(window) },
        run: { isNot: null },
      },
      orderBy: { sessionDate: 'desc' },
      take: 20,
      include: { run: true },
    });

    return toolSuccess({
      days: window,
      runs: sessions
        .filter((session) => session.run !== null)
        .map((session) => {
          const run = session.run;
          return {
            date: session.sessionDate.toISOString(),
            durationMinutes: session.durationMinutes,
            sessionNotes: session.notes,
            distanceKm: run?.distanceKm ?? null,
            durationSeconds: run?.durationSeconds ?? null,
            averagePaceSecondsPerKm: run?.averagePaceSecondsPerKm ?? null,
            averageHr: run?.averageHr ?? null,
            perceivedEffort: run?.perceivedEffort ?? null,
            runType: run?.runType ?? null,
            elevationGainM: run?.elevationGainM ?? null,
            notes: run?.notes ?? null,
          };
        }),
    });
  },
});
