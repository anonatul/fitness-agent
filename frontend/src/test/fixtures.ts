import type { DashboardData, RecentData, TrainingDecision } from '../types/api';

export const decision: TrainingDecision = {
  intent: 'TODAY_TRAINING',
  decision: 'MAINTAIN',
  confidence: 'medium',
  reason: 'Recovery is acceptable and no pain was reported.',
  session: {
    type: 'STRENGTH',
    programSection: 'Strength A',
    exercises: [
      { name: 'Push-up', sets: 3, repsMin: 5, repsMax: 10, targetRir: 2, orderIndex: 0 },
      { name: 'Band Row', sets: 3, repsMin: 8, repsMax: 15, targetRir: 2, orderIndex: 1 },
    ],
  },
  modifications: [],
  progression: { apply: false },
  safetyFlags: [],
  readiness: 'GOOD',
  dataNotes: [],
};

export const emptyRecent: RecentData = {
  days: 90,
  strengthSessions: [],
  runs: [],
  recoveryLogs: [],
  bodyMetrics: [],
};

export const dashboardData: DashboardData = {
  decision,
  recent: emptyRecent,
};

export const recentData: RecentData = {
  days: 90,
  strengthSessions: [
    {
      date: '2026-11-22T10:00:00.000Z',
      durationMinutes: 45,
      perceivedEffort: 7,
      notes: null,
      exercises: [
        {
          name: 'Push-up',
          variation: 'Standard',
          orderIndex: 0,
          notes: null,
          sets: [
            { setNumber: 1, reps: 8, rir: 2, loadKg: null, assistanceKg: null, durationSeconds: null, notes: null },
            { setNumber: 2, reps: 7, rir: 2, loadKg: null, assistanceKg: null, durationSeconds: null, notes: null },
          ],
        },
      ],
    },
  ],
  runs: [
    {
      date: '2026-11-20T09:00:00.000Z',
      distanceKm: 5,
      durationSeconds: 1920,
      averagePaceSecondsPerKm: 384,
      averageHr: null,
      perceivedEffort: 4,
      runType: 'EASY',
      elevationGainM: null,
      notes: null,
    },
  ],
  recoveryLogs: [],
  bodyMetrics: [],
};

export const programData = {
  phase: {
    source: 'program/current_phase.md',
    phaseName: 'Foundation Strength & Hypertrophy + Aerobic Base',
    objective: 'Build a durable base.',
    priority: {
      primary: 'Strength and hypertrophy',
      secondary: 'Body composition',
      tertiary: 'Running development',
    },
    startDate: null,
    endDate: null,
  },
  program: {
    source: 'program/current_program.md',
    content: 'Current program',
    note: 'Plan, not completed work.',
  },
};
