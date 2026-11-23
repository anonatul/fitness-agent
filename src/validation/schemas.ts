import { z } from 'zod';
import { AppError } from '../errors';

export const goalStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);
export const sessionTypeSchema = z.enum(['STRENGTH', 'RUN', 'RECOVERY', 'OTHER']);
export const runTypeSchema = z.enum(['EASY', 'QUALITY', 'LONG', 'RECOVERY', 'OTHER']);

const optionalText = z.string().trim().max(2000).optional();
const nonNegativeInt = z.number().int().nonnegative();
const nonNegativeNumber = z.number().nonnegative();
const heartRate = z.number().int().min(0).max(300);
const score1to5 = z.number().int().min(1).max(5);

export const athleteInputSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  age: z.number().int().min(0).max(120).optional(),
  sex: z.string().trim().max(40).optional(),
  heightCm: nonNegativeNumber.optional(),
  currentWeightKg: nonNegativeNumber.optional(),
  waistCm: nonNegativeNumber.optional(),
  restingHr: heartRate.optional(),
});

export const goalInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  priority: z.number().int().min(1),
  status: goalStatusSchema.default('ACTIVE'),
  description: optionalText,
});

export const trainingSessionInputSchema = z.object({
  sessionType: sessionTypeSchema,
  sessionDate: z.coerce.date(),
  durationMinutes: nonNegativeInt.optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes: optionalText,
  completed: z.boolean().default(true),
});

export const strengthExerciseInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  variation: z.string().trim().max(200).optional(),
  orderIndex: nonNegativeInt,
  notes: optionalText,
});

export const strengthSetInputSchema = z.object({
  setNumber: z.number().int().min(1),
  reps: nonNegativeInt.optional(),
  rir: nonNegativeInt.optional(),
  loadKg: nonNegativeNumber.optional(),
  assistanceKg: nonNegativeNumber.optional(),
  durationSeconds: nonNegativeInt.optional(),
  notes: optionalText,
});

export const runInputSchema = z.object({
  distanceKm: nonNegativeNumber.optional(),
  durationSeconds: nonNegativeInt.optional(),
  averagePaceSecondsPerKm: nonNegativeInt.optional(),
  averageHr: heartRate.optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  runType: runTypeSchema.default('OTHER'),
  elevationGainM: nonNegativeNumber.optional(),
  notes: optionalText,
});

export const recoveryLogInputSchema = z.object({
  date: z.coerce.date(),
  sleepHours: z.number().min(0).max(24).optional(),
  energyScore: score1to5.optional(),
  sorenessScore: score1to5.optional(),
  motivationScore: score1to5.optional(),
  restingHr: heartRate.optional(),
  notes: optionalText,
});

export const bodyMetricInputSchema = z.object({
  date: z.coerce.date(),
  weightKg: nonNegativeNumber.optional(),
  waistCm: nonNegativeNumber.optional(),
  restingHr: heartRate.optional(),
  notes: optionalText,
});

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new AppError(400, issue?.message ?? 'Invalid input.');
  }

  return result.data;
}
