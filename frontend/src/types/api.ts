export interface ChatResponse {
  response: string;
}

export interface ApiErrorBody {
  error?: { message?: string };
}

export interface WriteResult {
  success: boolean;
  data?: { status?: string; sessionId?: string; date?: string; [key: string]: unknown };
  error?: { code: string; message: string };
}

export interface ProgramExercise {
  name: string;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  targetRir: number | null;
  orderIndex: number;
}

export interface SessionPlan {
  type: string;
  programSection?: string;
  durationMinutes?: number;
  exercises?: ProgramExercise[];
  run?: { type: string; note: string };
}

export interface TrainingDecision {
  intent: string;
  decision: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  session?: SessionPlan;
  modifications: string[];
  progression: { apply: boolean; reason?: string; exercise?: string };
  safetyFlags: string[];
  readiness: string;
  dataNotes: string[];
}

export interface StrengthSet {
  setNumber: number;
  reps: number | null;
  rir: number | null;
  loadKg: number | null;
  assistanceKg: number | null;
  durationSeconds: number | null;
  notes: string | null;
}

export interface StrengthExercise {
  name: string;
  variation: string | null;
  orderIndex: number;
  notes: string | null;
  sets: StrengthSet[];
}

export interface StrengthSession {
  date: string;
  durationMinutes: number | null;
  perceivedEffort: number | null;
  notes: string | null;
  exercises: StrengthExercise[];
}

export interface Run {
  date: string;
  distanceKm: number | null;
  durationSeconds: number | null;
  averagePaceSecondsPerKm: number | null;
  averageHr: number | null;
  perceivedEffort: number | null;
  runType: string | null;
  elevationGainM: number | null;
  notes: string | null;
}

export interface RecoveryLog {
  date: string;
  sleepHours: number | null;
  energyScore: number | null;
  sorenessScore: number | null;
  motivationScore: number | null;
  restingHr: number | null;
  notes: string | null;
}

export interface BodyMetric {
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  restingHr: number | null;
  notes: string | null;
}

export interface RecentData {
  days: number;
  strengthSessions: StrengthSession[];
  runs: Run[];
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
}

export interface DashboardData {
  decision: TrainingDecision;
  recent: Omit<RecentData, 'days'>;
}

export interface PhaseData {
  source: string;
  phaseName: string | null;
  objective: string | null;
  priority: { primary: string | null; secondary: string | null; tertiary: string | null };
  startDate: string | null;
  endDate: string | null;
}

export interface ProgramData {
  phase: PhaseData;
  program: { source: string; content: string; note: string };
}

export interface StrengthPayload {
  sessionDate?: string;
  durationMinutes?: number | null;
  perceivedEffort?: number | null;
  notes?: string | null;
  exercises: Array<{
    name: string;
    variation?: string | null;
    orderIndex: number;
    notes?: string | null;
    sets: Array<{
      setNumber: number;
      reps?: number | null;
      rir?: number | null;
      loadKg?: number | null;
      assistanceKg?: number | null;
      durationSeconds?: number | null;
      notes?: string | null;
    }>;
  }>;
}

export interface RunPayload {
  sessionDate?: string;
  distanceKm?: number | null;
  durationSeconds?: number | null;
  averagePaceSecondsPerKm?: number | null;
  averageHr?: number | null;
  perceivedEffort?: number | null;
  runType?: 'EASY' | 'QUALITY' | 'LONG' | 'RECOVERY' | 'OTHER';
  elevationGainM?: number | null;
  notes?: string | null;
}
