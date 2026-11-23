import { getReadAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import { recentArgs, type RecentArgs } from '../schemas/toolSchemas';
import { formatDate, sinceDays } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const getBodyMetricsTool = defineTool({
  name: 'get_body_metrics',
  description:
    'Return recent body metrics: weight, waist, resting HR, and notes. Missing values are null, never invented.',
  kind: 'read',
  schema: recentArgs,
  handler: async ({ days }: RecentArgs) => {
    const window = days ?? 30;
    const athleteId = await getReadAthleteId();

    if (!athleteId) {
      return toolSuccess({ days: window, metrics: [], note: 'No athlete record exists yet.' });
    }

    const metrics = await getPrisma().bodyMetric.findMany({
      where: { athleteId, date: { gte: sinceDays(window) } },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return toolSuccess({
      days: window,
      metrics: metrics.map((metric) => ({
        date: formatDate(metric.date),
        weightKg: metric.weightKg,
        waistCm: metric.waistCm,
        restingHr: metric.restingHr,
        notes: metric.notes,
      })),
    });
  },
});
