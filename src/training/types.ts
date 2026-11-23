export type Intent =
  | 'TODAY_TRAINING'
  | 'STRENGTH_PROGRESSION'
  | 'RUNNING'
  | 'RECOVERY'
  | 'LOG_WORKOUT'
  | 'LOG_RUN'
  | 'WEEKLY_REVIEW'
  | 'PROGRESS_REVIEW'
  | 'GENERAL_KNOWLEDGE'
  | 'CLARIFICATION';

export type Readiness = 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN';

export type SafetyLevel = 'NONE' | 'MONITOR' | 'MODIFY' | 'STOP' | 'MEDICAL_REVIEW' | 'EMERGENCY';

export type DecisionKind = 'PROGRESS' | 'MAINTAIN' | 'MODIFY' | 'RECOVERY' | 'REST' | 'CLARIFY';

export type SessionKind = 'STRENGTH' | 'EASY_RUN' | 'QUALITY_RUN' | 'LONG_RUN' | 'RECOVERY_RUN';

export interface StrengthSetView {
  reps: number | null;
  rir: number | null;
  loadKg?: number | null;
}

export interface StrengthExerciseView {
  name: string;
  sets: StrengthSetView[];
}

export interface StrengthSessionView {
  date: string;
  exercises: StrengthExerciseView[];
  perceivedEffort?: number | null;
}

export interface RunView {
  date: string;
  distanceKm?: number | null;
  durationSeconds?: number | null;
  runType?: string | null;
  perceivedEffort?: number | null;
  averageHr?: number | null;
}

export interface RecoveryView {
  date: string;
  sleepHours?: number | null;
  energyScore?: number | null;
  sorenessScore?: number | null;
  motivationScore?: number | null;
  restingHr?: number | null;
}

export interface BodyMetricView {
  date: string;
  weightKg?: number | null;
  waistCm?: number | null;
  restingHr?: number | null;
}

export interface TrainingState {
  strengthSessions: StrengthSessionView[];
  runs: RunView[];
  recoveryLogs: RecoveryView[];
  bodyMetrics: BodyMetricView[];
}

export interface ProgramExerciseView {
  name: string;
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  targetRir: number | null;
  orderIndex: number;
}

export interface SessionPlan {
  type: SessionKind;
  programSection?: string;
  durationMinutes?: number;
  exercises?: ProgramExerciseView[];
  run?: { type: SessionKind; note: string };
}

export interface TrainingDecision {
  intent: Intent;
  decision: DecisionKind;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  session?: SessionPlan;
  modifications: string[];
  progression: { apply: boolean; reason?: string; exercise?: string };
  safetyFlags: string[];
  readiness: Readiness;
  /** Internal recommendation only. Never persisted in this checkpoint. */
  phaseChangeRecommended: boolean;
  /** Explicitly records what the database does not know. */
  dataNotes: string[];
}

export interface DecisionInput {
  message: string;
  intent: Intent;
  state: TrainingState;
  availableMinutes: number | null;
  missedWorkout: boolean;
}
