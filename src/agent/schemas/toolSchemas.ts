import { z } from 'zod';

/**
 * Accepts ISO dates (YYYY-MM-DD) and ISO date-times with an explicit timezone.
 * Rejects impossible dates such as 2026-02-30.
 */
export const toolDateString = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine((value) => {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const isDateTime =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      );

    if (!isDateOnly && !isDateTime) {
      return false;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return false;
    }

    return !isDateOnly || parsed.toISOString().slice(0, 10) === value;
  }, 'Must be a real ISO date or ISO date-time with a timezone.');

export const toolDays = z.number().int().min(1).max(90);

export const recentArgs = z.object({
  days: toolDays.optional(),
});

export const strengthSetArg = z.object({
  setNumber: z.number().int().min(1).max(200),
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  rir: z.number().int().min(0).max(20).nullable().optional(),
  loadKg: z.number().min(0).max(10000).nullable().optional(),
  assistanceKg: z.number().min(0).max(10000).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const strengthExerciseArg = z.object({
  name: z.string().trim().min(1).max(200),
  variation: z.string().trim().max(200).nullable().optional(),
  orderIndex: z.number().int().min(0).max(200),
  notes: z.string().trim().max(2000).nullable().optional(),
  sets: z.array(strengthSetArg).min(1).max(50),
});

export const logStrengthSessionArgs = z.object({
  // Omitted date means the session was reported today.
  sessionDate: toolDateString.optional(),
  durationMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  perceivedEffort: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  exercises: z.array(strengthExerciseArg).min(1).max(50),
});

export const logRunArgs = z.object({
  // Omitted date means the run was reported today.
  sessionDate: toolDateString.optional(),
  distanceKm: z.number().min(0).max(1000).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional(),
  averagePaceSecondsPerKm: z.number().int().min(0).max(86400).nullable().optional(),
  averageHr: z.number().int().min(0).max(300).nullable().optional(),
  perceivedEffort: z.number().int().min(1).max(10).nullable().optional(),
  runType: z.enum(['EASY', 'QUALITY', 'LONG', 'RECOVERY', 'OTHER']).optional(),
  elevationGainM: z.number().min(0).max(10000).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export type RecentArgs = z.infer<typeof recentArgs>;
export type LogStrengthSessionArgs = z.infer<typeof logStrengthSessionArgs>;
export type LogRunArgs = z.infer<typeof logRunArgs>;
