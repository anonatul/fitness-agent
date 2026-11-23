import { getReadAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import { recentArgs, type RecentArgs } from '../schemas/toolSchemas';
import { sinceDays } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const getRecentStrengthTool = defineTool({
  name: 'get_recent_strength',
  description:
    'Return recent ACTUAL completed strength sessions with exercises, sets, reps, RIR, load, assistance, and notes. Never returns planned sessions.',
  kind: 'read',
  schema: recentArgs,
  handler: async ({ days }: RecentArgs) => {
    const window = days ?? 14;
    const athleteId = await getReadAthleteId();

    if (!athleteId) {
      return toolSuccess({ days: window, sessions: [], note: 'No athlete record exists yet.' });
    }

    const sessions = await getPrisma().trainingSession.findMany({
      where: {
        athleteId,
        sessionType: 'STRENGTH',
        completed: true,
        sessionDate: { gte: sinceDays(window) },
      },
      orderBy: { sessionDate: 'desc' },
      take: 20,
      include: {
        strengthExercises: {
          orderBy: { orderIndex: 'asc' },
          include: { sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });

    return toolSuccess({
      days: window,
      sessions: sessions.map((session) => ({
        date: session.sessionDate.toISOString(),
        durationMinutes: session.durationMinutes,
        perceivedEffort: session.perceivedEffort,
        notes: session.notes,
        exercises: session.strengthExercises.map((exercise) => ({
          name: exercise.name,
          variation: exercise.variation,
          orderIndex: exercise.orderIndex,
          notes: exercise.notes,
          sets: exercise.sets.map((set) => ({
            setNumber: set.setNumber,
            reps: set.reps,
            rir: set.rir,
            loadKg: set.loadKg,
            assistanceKg: set.assistanceKg,
            durationSeconds: set.durationSeconds,
            notes: set.notes,
          })),
        })),
      })),
    });
  },
});
