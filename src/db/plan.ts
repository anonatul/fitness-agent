import { getWriteAthleteId } from './athlete';
import { getPrisma } from './prisma';

const phaseName = 'Foundation Strength & Hypertrophy + Aerobic Base';
type Exercise = { name: string; sets: number; repsMin?: number; repsMax?: number; targetRir?: number; notes?: string };
const strength = (title: string, exercises: Exercise[]) => ({ sessionType: 'STRENGTH' as const, title, exercises });
const week = [
  strength('Strength A', [{ name: 'Push-Up', sets: 3, repsMin: 5, repsMax: 10, targetRir: 2 }, { name: 'Band Row', sets: 3, repsMin: 8, repsMax: 15, targetRir: 2 }, { name: 'Bulgarian Split Squat', sets: 2, repsMin: 8, repsMax: 12, targetRir: 2 }, { name: 'Band Face Pull', sets: 2, repsMin: 12, repsMax: 20, targetRir: 2 }, { name: 'Backpack RDL / Band Good Morning', sets: 2, repsMin: 8, repsMax: 15, targetRir: 2 }, { name: 'Dead Bug', sets: 2, repsMin: 8, repsMax: 12 }]),
  { sessionType: 'EASY_RUN' as const, title: 'Easy Aerobic Run', targetDistanceKm: 4.5, notes: 'Conversational effort.' },
  strength('Strength B', [{ name: 'Band-Assisted Chin-Up', sets: 3, repsMin: 5, repsMax: 8, targetRir: 2 }, { name: 'Band Row', sets: 3, repsMin: 8, repsMax: 15, targetRir: 2 }, { name: 'Pike Push-Up', sets: 3, repsMin: 5, repsMax: 10, targetRir: 2 }, { name: 'Reverse Lunge', sets: 2, repsMin: 8, repsMax: 12, targetRir: 2 }, { name: 'Single-Leg Calf Raise', sets: 3, repsMin: 10, repsMax: 20, targetRir: 2 }, { name: 'Pallof Press', sets: 2, repsMin: 10, repsMax: 15 }]),
  { sessionType: 'QUALITY_RUN' as const, title: 'Quality Run', targetDurationMinutes: 37, notes: '10 min easy; 4 × 3 min comfortably hard with 2 min easy; 5–10 min cooldown.' },
  strength('Strength C', [{ name: 'Push-Up Variation', sets: 3, repsMin: 6, repsMax: 12, targetRir: 2 }, { name: 'Band Lat Pulldown', sets: 3, repsMin: 8, repsMax: 15, targetRir: 2 }, { name: 'Backpack RDL', sets: 3, repsMin: 8, repsMax: 15, targetRir: 2 }, { name: 'Bulgarian Split Squat', sets: 2, repsMin: 8, repsMax: 12, targetRir: 2 }, { name: 'Band Lateral Raise', sets: 2, repsMin: 12, repsMax: 20, targetRir: 2 }, { name: 'Plank', sets: 3, notes: '20–45 seconds.' }]),
  { sessionType: 'RECOVERY' as const, title: 'Recovery / Walking', notes: 'Easy recovery-oriented movement.' },
  { sessionType: 'LONG_RUN' as const, title: 'Long Easy Run', targetDistanceKm: 6, notes: 'Easy conversational effort.' },
];

function monday(date = new Date()): Date { const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; }
function plusDays(date: Date, days: number): Date { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
const include = { sessions: { orderBy: { sessionDate: 'asc' as const }, include: { exercises: { orderBy: { orderIndex: 'asc' as const } } } } };

export async function getCurrentPlan() {
  const athleteId = await getWriteAthleteId();
  if (!athleteId) return null;
  const prisma = getPrisma();
  const existing = await prisma.trainingPlan.findUnique({ where: { athleteId_weekNumber: { athleteId, weekNumber: 1 } }, include });
  if (existing) return existing;
  const start = monday();
  return prisma.trainingPlan.create({ data: { athleteId, phaseName, weekNumber: 1, weekStart: start, sessions: { create: week.map((session, index) => ({ ...session, sessionDate: plusDays(start, index), exercises: 'exercises' in session ? { create: session.exercises.map((exercise, orderIndex) => ({ ...exercise, orderIndex })) } : undefined })) } }, include });
}

export async function sessionForAthlete(sessionId: string) {
  const plan = await getCurrentPlan();
  return plan?.sessions.find((session) => session.id === sessionId) ?? null;
}
