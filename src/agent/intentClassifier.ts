import type { Intent } from '../training/types';

interface IntentRule {
  intent: Intent;
  patterns: readonly RegExp[];
}

/** Ordered rules: the first matching intent wins. No ML or model call needed. */
const INTENT_RULES: readonly IntentRule[] = [
  {
    intent: 'LOG_RUN',
    patterns: [
      /\b(i\s+)?(ran|jogged|run\s+this\s+(morning|afternoon|evening))\b/i,
      /\b(completed|finished|logged|did)\b.{0,50}\brun\b/i,
      /\brun\b.{0,50}\b\d+(\.\d+)?\s*(km|kilometers?|k)\b/i,
    ],
  },
  {
    intent: 'LOG_WORKOUT',
    patterns: [
      /\b(completed|finished|logged|did)\b.{0,60}\b(sets?|reps?|push[\s-]?ups?|exercises?|workout|strength)\b/i,
      /\b\d+\s*(sets?|reps?)\b.{0,60}\b(rir|push[\s-]?ups?|rows?|squats?|lunge)\b/i,
    ],
  },
  {
    intent: 'WEEKLY_REVIEW',
    patterns: [/\bweekly\s+review\b/i, /\breview\s+(my\s+)?(week|training\s+week)\b/i, /\bthis\s+week'?s?\s+(training|summary)\b/i],
  },
  {
    intent: 'PROGRESS_REVIEW',
    patterns: [
      /\bprogress\s+review\b/i,
      /\bevaluate\s+progress\b/i,
      /\bhow\s+am\s+i\s+(doing|progressing)\b/i,
      /\bassess\s+progress\b/i,
    ],
  },
  {
    intent: 'STRENGTH_PROGRESSION',
    patterns: [
      /\bprogress(ion|ing|ed)?\b/i,
      /\b(increase|add|more)\b.{0,30}\b(reps?|weight|resistance|sets?|load)\b/i,
      /\bshould\s+i\s+(progress|move\s+up|go\s+harder)\b/i,
    ],
  },
  {
    intent: 'RECOVERY',
    patterns: [
      /\b(sore|soreness|fatigue|fatigued|tired|exhausted|sleep|rest|recovery|deload|energy|pain|hurt|sharp|aching)\b/i,
    ],
  },
  {
    intent: 'RUNNING',
    patterns: [
      /\b(run|running|jog|pace|easy\s+run|quality\s+run|long\s+run|half[\s-]?marathon|21\.1|marathon)\b/i,
    ],
  },
  {
    intent: 'TODAY_TRAINING',
    patterns: [
      /\b(what\s+should\s+i\s+(do|train)|train\s+today|workout\s+today|session\s+today|legs?\s+today|today'?s\s+(session|workout|training))\b/i,
      /\b(should\s+i\s+train|what\s+to\s+train|which\s+session)\b/i,
      /\b(only\s+)?\d+\s*(minutes?|mins?|hours?|hrs?)\b/i,
    ],
  },
  {
    intent: 'GENERAL_KNOWLEDGE',
    patterns: [/\b(why|how\s+does|what\s+is|explain|principle|theory)\b/i],
  },
];

export interface IntentResult {
  intent: Intent;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

export function classifyIntent(message: string): IntentResult {
  const text = message.trim();

  for (const rule of INTENT_RULES) {
    const signals = rule.patterns
      .filter((pattern) => pattern.test(text))
      .map((pattern) => pattern.source);

    if (signals.length > 0) {
      return { intent: rule.intent, confidence: signals.length > 1 ? 'high' : 'medium', signals };
    }
  }

  return { intent: 'CLARIFICATION', confidence: 'low', signals: [] };
}

export function extractAvailableMinutes(message: string): number | null {
  const hours = message.match(/\b(\d+)\s*(hours?|hrs?|hr)\b/i);

  if (hours?.[1]) {
    return Number(hours[1]) * 60;
  }

  const minutes = message.match(/\b(\d+)\s*(minutes?|mins?|min)\b/i);
  return minutes?.[1] ? Number(minutes[1]) : null;
}

export function detectMissedWorkout(message: string): boolean {
  return /\b(missed|skipped|didn'?t\s+do|couldn'?t\s+(do|train|make))\b/i.test(message);
}
