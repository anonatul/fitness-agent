import { getReadAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import { recentArgs, type RecentArgs } from '../schemas/toolSchemas';
import { formatDate, sinceDays } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const getRecoveryTool = defineTool({
  name: 'get_recovery',
  description:
    'Return recent recovery logs: sleep, energy, soreness, motivation, resting HR, and notes. Missing values are null, never invented.',
  kind: 'read',
  schema: recentArgs,
  handler: async ({ days }: RecentArgs) => {
    const window = days ?? 14;
    const athleteId = await getReadAthleteId();

    if (!athleteId) {
      return toolSuccess({ days: window, logs: [], note: 'No athlete record exists yet.' });
    }

    const logs = await getPrisma().recoveryLog.findMany({
      where: { athleteId, date: { gte: sinceDays(window) } },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return toolSuccess({
      days: window,
      logs: logs.map((log) => ({
        date: formatDate(log.date),
        sleepHours: log.sleepHours,
        energyScore: log.energyScore,
        sorenessScore: log.sorenessScore,
        motivationScore: log.motivationScore,
        restingHr: log.restingHr,
        notes: log.notes,
      })),
    });
  },
});
