import { getWriteAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import { logRunArgs, type LogRunArgs } from '../schemas/toolSchemas';
import { dayBounds, formatDate } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const logRunTool = defineTool({
  name: 'log_run',
  description:
    'Log an ACTUAL completed run. Call only when the user reports a completed run. Leave unavailable metrics such as HR as null; never invent them. Never log a planned run as completed. If the user does not give a date, omit sessionDate and it defaults to today.',
  kind: 'write',
  schema: logRunArgs,
  handler: async (args: LogRunArgs) => {
    const athleteId = await getWriteAthleteId();

    if (!athleteId) {
      return toolSuccess({ status: 'no_athlete', message: 'No athlete is available for logging.' });
    }

    const date = args.sessionDate ? new Date(args.sessionDate) : new Date();
    const { start, end } = dayBounds(date);

    const duplicate = await getPrisma().trainingSession.findFirst({
      where: {
        athleteId,
        sessionType: 'RUN',
        sessionDate: { gte: start, lt: end },
      },
      select: { id: true, sessionDate: true },
      orderBy: { createdAt: 'desc' },
    });

    if (duplicate) {
      return toolSuccess({
        status: 'possible_duplicate',
        existingSessionId: duplicate.id,
        existingDate: formatDate(duplicate.sessionDate),
        message:
          'A run already exists on this date. Ask the user to confirm before creating another; do not overwrite it.',
      });
    }

    const created = await getPrisma().trainingSession.create({
      data: {
        athleteId,
        sessionType: 'RUN',
        sessionDate: date,
        durationMinutes: null,
        perceivedEffort: args.perceivedEffort ?? null,
        notes: args.notes ?? null,
        completed: true,
        run: {
          create: {
            distanceKm: args.distanceKm ?? null,
            durationSeconds: args.durationSeconds ?? null,
            averagePaceSecondsPerKm: args.averagePaceSecondsPerKm ?? null,
            averageHr: args.averageHr ?? null,
            perceivedEffort: args.perceivedEffort ?? null,
            runType: args.runType ?? 'OTHER',
            elevationGainM: args.elevationGainM ?? null,
            notes: null,
          },
        },
      },
      select: { id: true, sessionDate: true },
    });

    return toolSuccess({
      status: 'logged',
      sessionId: created.id,
      date: formatDate(created.sessionDate),
      distanceKm: args.distanceKm ?? null,
      durationSeconds: args.durationSeconds ?? null,
    });
  },
});
