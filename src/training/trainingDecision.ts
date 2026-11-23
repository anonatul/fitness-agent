import { evaluateReadiness, type ReadinessAssessment } from './readinessEvaluator';
import { evaluateSafety, type SafetyAssessment } from './safetyEvaluator';
import { evaluateStrengthProgression, type ProgressionAssessment } from './progressionEvaluator';
import { loadProgramSections } from './programRules';
import { selectSession } from './sessionSelector';
import type { DecisionInput, DecisionKind, TrainingDecision } from './types';

function focusExerciseName(input: DecisionInput, firstProgramExercise: string | null): string {
  const latest = [...input.state.strengthSessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest?.exercises[0]?.name ?? firstProgramExercise ?? '';
}

function decideKind(
  input: DecisionInput,
  safety: SafetyAssessment,
  readiness: ReadinessAssessment,
  progression: ProgressionAssessment,
): DecisionKind {
  if (
    safety.level === 'EMERGENCY' ||
    safety.level === 'MEDICAL_REVIEW' ||
    safety.level === 'STOP'
  ) {
    return 'REST';
  }

  if (readiness.category === 'POOR') {
    return 'RECOVERY';
  }

  if (input.intent === 'LOG_WORKOUT' || input.intent === 'LOG_RUN') {
    return 'CLARIFY';
  }

  if (input.missedWorkout) {
    return 'MODIFY';
  }

  if (safety.level === 'MODIFY' || progression.action === 'MODIFY') {
    return 'MODIFY';
  }

  if (progression.action === 'PROGRESS') {
    return 'PROGRESS';
  }

  return 'MAINTAIN';
}

function confidenceFor(input: DecisionInput): 'high' | 'medium' | 'low' {
  const hasRecovery = input.state.recoveryLogs.length > 0;
  const hasStrength = input.state.strengthSessions.length > 0;

  if (hasRecovery && input.state.strengthSessions.length >= 2) {
    return 'high';
  }
  if (hasRecovery || hasStrength) {
    return 'medium';
  }
  return 'low';
}

/** Pure decision builder: deterministic, testable without GPT or network. */
export async function buildTrainingDecision(input: DecisionInput): Promise<TrainingDecision> {
  const started = Date.now();

  const safety = evaluateSafety(input.message, input.state.recoveryLogs);
  const readiness = evaluateReadiness(input.state, safety);

  const program = await loadProgramSections(input.programMarkdown);
  const firstProgramExercise = program[0]?.exercises[0]?.name ?? null;
  const focus = focusExerciseName(input, firstProgramExercise);

  const progression = await evaluateStrengthProgression(
    focus,
    input.state,
    readiness.category,
    safety.flags,
    input.programMarkdown,
  );

  const selection = await selectSession(input, safety, readiness, progression, input.programMarkdown);

  let kind = decideKind(input, safety, readiness, progression);

  if (selection.suggestModify && kind === 'MAINTAIN') {
    kind = 'MODIFY';
  }

  const session = selection.session;

  if (session && input.availableMinutes !== null) {
    session.durationMinutes = input.availableMinutes;
  }

  const modifications =
    kind === 'CLARIFY'
      ? [...selection.modifications, 'Log only the actual values reported, using the appropriate logging tool.']
      : [...selection.modifications];

  const dataNotes = [...readiness.missing];

  if (input.state.strengthSessions.length === 0) {
    dataNotes.push('no completed strength sessions logged');
  }
  if (input.state.runs.length === 0) {
    dataNotes.push('no completed runs logged');
  }
  if (input.state.recoveryLogs.length === 0) {
    dataNotes.push('no recovery logs');
  }

  const reasonParts = [safety.reason];

  if (readiness.reasons.length > 0) {
    reasonParts.push(`Readiness ${readiness.category}: ${readiness.reasons.join(', ')}.`);
  }
  reasonParts.push(progression.reason);
  reasonParts.push(selection.note);

  const decision: TrainingDecision = {
    intent: input.intent,
    decision: kind,
    confidence: confidenceFor(input),
    reason: reasonParts.filter((part) => part.length > 0).join(' '),
    session: kind === 'CLARIFY' ? undefined : session,
    modifications,
    progression: {
      apply: kind !== 'REST' && progression.action === 'PROGRESS',
      reason: progression.reason,
      exercise: progression.exercise || undefined,
    },
    safetyFlags: safety.flags,
    readiness: readiness.category,
    phaseChangeRecommended: false,
    dataNotes,
  };

  console.info(
    `[decision] intent=${decision.intent} readiness=${decision.readiness} ` +
      `safety=${safety.level} flags=[${safety.flags.join(',')}] decision=${decision.decision} ` +
      `confidence=${decision.confidence} durationMs=${Date.now() - started}`,
  );

  return decision;
}
