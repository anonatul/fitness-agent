import type { Readiness, TrainingState } from './types';
import type { SafetyAssessment } from '../training/safetyEvaluator';

export interface ReadinessAssessment {
  category: Readiness;
  reasons: string[];
  missing: string[];
}

function withinDays(date: string, days: number): boolean {
  const value = new Date(date).getTime();
  return Number.isFinite(value) && value >= Date.now() - days * 86_400_000;
}

export function evaluateReadiness(
  state: TrainingState,
  safety: SafetyAssessment,
): ReadinessAssessment {
  const logs = [...state.recoveryLogs].sort((a, b) => b.date.localeCompare(a.date));
  const latest = logs[0];
  const reasons: string[] = [];
  const missing: string[] = [];
  const negatives: string[] = [];

  if (!latest) {
    missing.push('recovery log');
  } else {
    if (latest.sleepHours === null || latest.sleepHours === undefined) {
      missing.push('sleep');
    } else if (latest.sleepHours < 7) {
      negatives.push(`sleep ${latest.sleepHours}h (below 7h)`);
    }

    if (latest.energyScore === null || latest.energyScore === undefined) {
      missing.push('energy');
    } else if (latest.energyScore <= 2) {
      negatives.push(`energy ${latest.energyScore}/5`);
    }

    if (latest.sorenessScore === null || latest.sorenessScore === undefined) {
      missing.push('soreness');
    } else if (latest.sorenessScore >= 4) {
      negatives.push(`soreness ${latest.sorenessScore}/5`);
    }

    if (latest.motivationScore === null || latest.motivationScore === undefined) {
      missing.push('motivation');
    } else if (latest.motivationScore <= 2) {
      negatives.push(`motivation ${latest.motivationScore}/5`);
    }

    if (latest.restingHr === null || latest.restingHr === undefined) {
      missing.push('resting HR');
    }
  }

  const recentStrength = state.strengthSessions.filter((session) => withinDays(session.date, 7));
  const recentRuns = state.runs.filter((run) => withinDays(run.date, 7));
  const hardRuns = recentRuns.filter((run) =>
    ['QUALITY', 'LONG'].includes((run.runType ?? '').toUpperCase()),
  );
  const highEffort = recentStrength.filter((session) => (session.perceivedEffort ?? 0) >= 8);

  if (recentStrength.length >= 4) {
    negatives.push(`${recentStrength.length} strength sessions in 7 days`);
  }
  if (recentRuns.length >= 4) {
    negatives.push(`${recentRuns.length} runs in 7 days`);
  }
  if (hardRuns.length >= 2) {
    negatives.push(`${hardRuns.length} hard runs in 7 days`);
  }
  if (highEffort.length >= 2) {
    negatives.push(`${highEffort.length} high-effort strength sessions in 7 days`);
  }

  for (const flag of safety.flags) {
    if (flag !== 'NORMAL_SORENESS') {
      negatives.push(`safety flag ${flag}`);
    }
  }

  reasons.push(...negatives);

  if (
    safety.level === 'STOP' ||
    safety.level === 'EMERGENCY' ||
    safety.level === 'MEDICAL_REVIEW'
  ) {
    return { category: 'POOR', reasons, missing };
  }

  if (!latest && negatives.length === 0) {
    reasons.push('no recovery data available');
    return { category: 'UNKNOWN', reasons, missing };
  }

  if (negatives.length >= 3) {
    return { category: 'POOR', reasons, missing };
  }

  if (negatives.length > 0) {
    return { category: 'FAIR', reasons, missing };
  }

  reasons.push('recovery signals are within normal ranges');
  return { category: 'GOOD', reasons, missing };
}
