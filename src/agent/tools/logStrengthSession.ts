import { getWriteAthleteId } from '../../db/athlete';
import { getPrisma } from '../../db/prisma';
import {
  logStrengthSessionArgs,
  type LogStrengthSessionArgs,
} from '../schemas/toolSchemas';
import { dayBounds, formatDate } from '../toolUtils';
import { defineTool, toolSuccess } from '../toolTypes';

export const logStrengthSessionTool = defineTool({
  name: 'log_strength_session',
  description:
    'Log an ACTUAL completed strength session. Call only when the user reports completed work. Store only the reps, RIR, load and notes the user actually provided; leave unknown values null. Never log planned or recommended sets as completed. If the user does not give a date, omit sessionDate and it defaults to today.',
  kind: 'write',
  schema: logStrengthSessionArgs,
  handler: async (args: LogStrengthSessionArgs) => {
    const athleteId = await getWriteAthleteId();

    if (!athleteId) {
      return toolSuccess({ status: 'no_athlete', message: 'No athlete is available for logging.' });
    }

    const date = args.sessionDate ? new Date(args.sessionDate) : new Date();
    const { start, end } = dayBounds(date);

    const duplicate = await getPrisma().trainingSession.findFirst({
      where: {
        athleteId,
        sessionType: 'STRENGTH',
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
          'A strength session already exists on this date. Ask the user to confirm before creating another; do not overwrite it.',
      });
    }

    const created = await getPrisma().trainingSession.create({
      data: {
        athleteId,
        sessionType: 'STRENGTH',
        sessionDate: date,
        durationMinutes: args.durationMinutes ?? null,
        perceivedEffort: args.perceivedEffort ?? null,
        notes: args.notes ?? null,
        completed: true,
        strengthExercises: {
          create: args.exercises.map((exercise) => ({
            name: exercise.name,
            variation: exercise.variation ?? null,
            orderIndex: exercise.orderIndex,
            notes: exercise.notes ?? null,
            sets: {
              create: exercise.sets.map((set) => ({
                setNumber: set.setNumber,
                reps: set.reps ?? null,
                rir: set.rir ?? null,
                loadKg: set.loadKg ?? null,
                assistanceKg: set.assistanceKg ?? null,
                durationSeconds: set.durationSeconds ?? null,
                notes: set.notes ?? null,
              })),
            },
          })),
        },
      },
      select: { id: true, sessionDate: true },
    });

    return toolSuccess({
      status: 'logged',
      sessionId: created.id,
      date: formatDate(created.sessionDate),
      exerciseCount: args.exercises.length,
      setCount: args.exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
    });
  },
});
