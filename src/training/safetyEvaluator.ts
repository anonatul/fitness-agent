import type { RecoveryView, SafetyLevel } from '../training/types';

export interface SafetyAssessment {
  level: SafetyLevel;
  flags: string[];
  reason: string;
}

const EMERGENCY_PATTERNS: ReadonlyArray<{ pattern: RegExp; flag: string }> = [
  { pattern: /\b(chest\s+pain|chest\s+pressure|chest\s+tightness)\b/i, flag: 'CHEST_SYMPTOM' },
  { pattern: /\b(severe\s+(difficulty\s+breathing|shortness\s+of\s+breath))\b/i, flag: 'BREATHING_EMERGENCY' },
  { pattern: /\b(fainted|fainting|passed\s+out|loss\s+of\s+consciousness)\b/i, flag: 'CONSCIOUSNESS' },
  { pattern: /\b(sudden\s+severe\s+weakness|uncontrolled\s+bleeding|severe\s+allergic|major\s+trauma)\b/i, flag: 'EMERGENCY_SYMPTOM' },
];

const RED_FLAG_PATTERNS: ReadonlyArray<{ pattern: RegExp; flag: string }> = [
  { pattern: /\b(sharp|stabbing|sudden)\b.{0,20}\bpain\b/i, flag: 'SHARP_PAIN' },
  { pattern: /\b(worsening|getting\s+worse)\b.{0,30}\bpain\b/i, flag: 'WORSENING_PAIN' },
  { pattern: /\bpain\b.{0,30}\b(worsening|changes?\s+(my\s+)?(movement|gait|mechanics))\b/i, flag: 'MOVEMENT_CHANGING_PAIN' },
  { pattern: /\b(joint\s+pain|swelling|numbness|tingling|instability|localized\s+(bone\s+)?tenderness)\b/i, flag: 'JOINT_OR_NEURAL_SIGN' },
  { pattern: /\b(knee|shin|ankle|achilles|hip)\b.{0,25}\bpain\b/i, flag: 'LOCALIZED_PAIN' },
  { pattern: /\bpain\b.{0,25}\b(knee|shin|ankle|achilles|hip)\b/i, flag: 'LOCALIZED_PAIN' },
  { pattern: /\b(knee|shin|ankle|achilles|hip|shoulder|back)\b.{0,25}\b(hurts?|aching|sore)\b/i, flag: 'LOCALIZED_PAIN' },
];

const NORMAL_DISCOMFORT = /\b(normal\s+(muscle\s+)?(soreness|fatigue|discomfort)|muscle\s+soreness|mild\s+soreness|dom\s+soreness)\b/i;

function flagsFrom(
  patterns: ReadonlyArray<{ pattern: RegExp; flag: string }>,
  text: string,
): string[] {
  const flags = new Set<string>();

  for (const entry of patterns) {
    if (entry.pattern.test(text)) {
      flags.add(entry.flag);
    }
  }

  return [...flags];
}

/** Deterministic safety gate. Runs before any training decision is made. */
export function evaluateSafety(
  message: string,
  recoveryLogs: readonly RecoveryView[],
): SafetyAssessment {
  const emergency = flagsFrom(EMERGENCY_PATTERNS, message);

  if (emergency.length > 0) {
    return {
      level: 'EMERGENCY',
      flags: emergency,
      reason: 'Reported emergency symptoms require urgent medical care, not training advice.',
    };
  }

  const redFlags = flagsFrom(RED_FLAG_PATTERNS, message);

  if (redFlags.length > 0) {
    const needsReview = /\b(persistent|keeps?\s+coming\s+back|recurring|for\s+(days|weeks))\b/i.test(
      message,
    );
    return {
      level: needsReview ? 'MEDICAL_REVIEW' : 'STOP',
      flags: redFlags,
      reason: 'Reported pain or concerning symptoms override normal training progression.',
    };
  }

  const latest = recoveryLogs[0];
  const flags: string[] = [];

  if (latest?.sorenessScore !== null && latest?.sorenessScore !== undefined && latest.sorenessScore >= 4) {
    flags.push('HIGH_SORENESS');
  }
  if (latest?.energyScore !== null && latest?.energyScore !== undefined && latest.energyScore <= 2) {
    flags.push('LOW_ENERGY');
  }
  if (latest?.sleepHours !== null && latest?.sleepHours !== undefined && latest.sleepHours < 6) {
    flags.push('POOR_SLEEP');
  }
  if (/\b(very\s+(tired|sore)|exhausted|no\s+energy|completely\s+fried)\b/i.test(message)) {
    flags.push('REPORTED_FATIGUE');
  }

  if (flags.length >= 2) {
    return {
      level: 'MODIFY',
      flags: [...new Set(flags)],
      reason: 'Several fatigue or recovery warning signals are present; reduce training stress.',
    };
  }

  if (flags.length === 1) {
    return {
      level: 'MONITOR',
      flags,
      reason: 'One recovery warning signal is present; monitor and avoid unnecessary intensity.',
    };
  }

  if (NORMAL_DISCOMFORT.test(message)) {
    return {
      level: 'NONE',
      flags: ['NORMAL_SORENESS'],
      reason: 'Reported sensation is consistent with normal training discomfort.',
    };
  }

  return { level: 'NONE', flags: [], reason: 'No safety concern detected from available information.' };
}
