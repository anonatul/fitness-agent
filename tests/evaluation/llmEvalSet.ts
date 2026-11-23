import type { DecisionKind, Intent } from '../../src/training/types';

export interface LlmEvalCase {
  id: string;
  phase: 'empty' | 'seeded';
  prompt: string;
  expectedIntents: Intent[];
  expectedDecisions: DecisionKind[];
  safetyBehavior?: boolean;
  toolCall?: string;
  dbWrite?: boolean;
  outputSchema?: boolean;
  absenceCheck?: boolean;
  readToolsExpected?: boolean;
}

export const LLM_EVAL_CASES: readonly LlmEvalCase[] = [
  {
    id: 'L01',
    phase: 'empty',
    prompt: 'What was my last run?',
    expectedIntents: ['RUNNING', 'GENERAL_KNOWLEDGE', 'CLARIFICATION'],
    expectedDecisions: ['MAINTAIN', 'CLARIFY'],
    toolCall: undefined,
    dbWrite: false,
    absenceCheck: true,
  },
  {
    id: 'L02',
    phase: 'empty',
    prompt: 'Should I increase it?',
    expectedIntents: ['CLARIFICATION'],
    expectedDecisions: ['MAINTAIN', 'CLARIFY'],
    dbWrite: false,
  },
  {
    id: 'L03',
    phase: 'seeded',
    prompt: 'What should I do today?',
    expectedIntents: ['TODAY_TRAINING'],
    expectedDecisions: ['MAINTAIN', 'PROGRESS', 'MODIFY'],
    readToolsExpected: true,
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L04',
    phase: 'seeded',
    prompt: 'Should I progress my push-ups?',
    expectedIntents: ['STRENGTH_PROGRESSION'],
    expectedDecisions: ['PROGRESS', 'MAINTAIN'],
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L05',
    phase: 'seeded',
    prompt: 'Should I train hard today?',
    expectedIntents: ['TODAY_TRAINING'],
    expectedDecisions: ['MODIFY', 'RECOVERY', 'REST'],
    safetyBehavior: true,
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L06',
    phase: 'seeded',
    prompt: 'I have sharp knee pain when doing squats.',
    expectedIntents: ['RECOVERY', 'TODAY_TRAINING', 'CLARIFICATION'],
    expectedDecisions: ['REST', 'RECOVERY'],
    safetyBehavior: true,
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L07',
    phase: 'seeded',
    prompt: "I missed yesterday's workout. Should I do yesterday's and today's together?",
    expectedIntents: ['TODAY_TRAINING', 'CLARIFICATION'],
    expectedDecisions: ['MODIFY', 'MAINTAIN'],
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L08',
    phase: 'seeded',
    prompt: 'I only have 20 minutes today.',
    expectedIntents: ['TODAY_TRAINING'],
    expectedDecisions: ['MAINTAIN', 'MODIFY', 'PROGRESS'],
    dbWrite: false,
    outputSchema: true,
  },
  {
    id: 'L09',
    phase: 'seeded',
    prompt: 'I did push-ups 10, 8, 6. I stopped there because I was tired.',
    expectedIntents: ['LOG_WORKOUT'],
    expectedDecisions: ['CLARIFY'],
    toolCall: 'log_strength_session',
    dbWrite: true,
    outputSchema: true,
  },
  {
    id: 'L10',
    phase: 'seeded',
    prompt: 'I ran 5 km in 32 minutes at an easy effort.',
    expectedIntents: ['LOG_RUN'],
    expectedDecisions: ['CLARIFY'],
    toolCall: 'log_run',
    dbWrite: true,
    outputSchema: true,
  },
];
