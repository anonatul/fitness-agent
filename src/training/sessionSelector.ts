import type { SafetyAssessment } from '../training/safetyEvaluator';
import type { ReadinessAssessment } from '../training/readinessEvaluator';
import type { ProgressionAssessment } from '../training/progressionEvaluator';
import { selectNextStrengthSection } from '../training/programRules';
import type { DecisionInput, SessionPlan } from '../training/types';

export interface SelectionResult {
  session?: SessionPlan;
  modifications: string[];
  note: string;
  /** Contextual load/interference signal that warrants a non-aggressive decision. */
  suggestModify: boolean;
}

function withinDays(date: string, days: number): boolean {
  const value = new Date(date).getTime();
  return Number.isFinite(value) && value >= Date.now() - days * 86_400_000;
}

function recentExerciseNames(input: DecisionInput): string[] {
  const latest = [...input.state.strengthSessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest?.exercises.map((exercise) => exercise.name) ?? [];
}

function lowerBodyFatigue(input: DecisionInput): boolean {
  const recentStrength = input.state.strengthSessions.filter((session) => withinDays(session.date, 2));
  const lowerBody = recentStrength.some((session) =>
    session.exercises.some((exercise) =>
      /squat|lunge|rdl|hinge|calf|leg/i.test(exercise.name),
    ),
  );
  const soreness = [...input.state.recoveryLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
    ?.sorenessScore;
  return lowerBody || (soreness !== undefined && soreness !== null && soreness >= 3);
}

async function selectStrengthSession(
  input: DecisionInput,
  progression: ProgressionAssessment,
  programMarkdown?: string,
): Promise<SelectionResult> {
  const modifications: string[] = [];
  const section = await selectNextStrengthSection(recentExerciseNames(input), programMarkdown);

  if (input.missedWorkout) {
    modifications.push('Missed training is not doubled. Keep today to one appropriate session.');
  }

  const hardRunRecently = input.state.runs.some(
    (run) =>
      withinDays(run.date, 2) &&
      ['QUALITY', 'LONG'].includes((run.runType ?? '').toUpperCase()),
  );

  if (hardRunRecently) {
    modifications.push('Recent hard running is present; protect recovery by limiting lower-body volume.');
  }

  if (progression.action === 'PROGRESS') {
    modifications.push(
      `Consider a small progression on ${progression.exercise} once technique and RIR stay on target.`,
    );
  }

  if (progression.action === 'MODIFY') {
    modifications.push(`Do not progress ${progression.exercise} while the limiting factor is unresolved.`);
  }

  if (!section) {
    return {
      session: { type: 'STRENGTH' },
      modifications,
      note: 'No structured program block was available; use the current program rules.',
      suggestModify: hardRunRecently && lowerBodyFatigue(input),
    };
  }

  let exercises = section.exercises;
  const minutes = input.availableMinutes;

  if (minutes !== null && minutes < 30) {
    const keep = minutes < 15 ? 2 : 3;
    exercises = exercises.slice(0, keep);
    modifications.push(
      `Shortened to the ${keep} highest-priority movements for a ${minutes}-minute session.`,
    );
  }

  return {
    session: {
      type: 'STRENGTH',
      programSection: section.name,
      exercises,
    },
    modifications,
    note: `State-based selection: ${section.name}.`,
    suggestModify: hardRunRecently && lowerBodyFatigue(input),
  };
}

function selectRunSession(input: DecisionInput): SelectionResult {
  const modifications: string[] = [];
  const recentRuns = input.state.runs.filter((run) => withinDays(run.date, 10));
  const qualityRecently = recentRuns.some(
    (run) => (run.runType ?? '').toUpperCase() === 'QUALITY' && withinDays(run.date, 7),
  );
  const longRecently = recentRuns.some(
    (run) => (run.runType ?? '').toUpperCase() === 'LONG' && withinDays(run.date, 10),
  );

  let type: SessionPlan['type'] = 'EASY_RUN';
  let note = 'Easy aerobic running builds the base without adding unnecessary stress.';

  if (lowerBodyFatigue(input)) {
    type = 'EASY_RUN';
    note = 'Recent lower-body stress or soreness is present; keep the run easy.';
    modifications.push('Lower-body fatigue detected; avoid quality intensity today.');
  } else if (!qualityRecently && input.state.runs.length > 0) {
    type = 'QUALITY_RUN';
    note = 'No recent quality run and recovery appears adequate.';
    modifications.push('Keep quality work controlled rather than maximal.');
  } else if (!longRecently && input.state.runs.length > 0) {
    type = 'LONG_RUN';
    note = 'The long run has not been performed recently.';
    modifications.push('Keep the long run conversational and progress only if recovery allows.');
  }

  if (input.missedWorkout) {
    modifications.push('A missed run is not made up by doubling today.');
  }

  const minutes = input.availableMinutes;
  if (minutes !== null && minutes < 30) {
    modifications.push(`Use a shorter ${minutes}-minute easy effort; do not force the planned distance.`);
  }

  return {
    session: { type, run: { type, note } },
    modifications,
    note,
    suggestModify: lowerBodyFatigue(input),
  };
}

export async function selectSession(
  input: DecisionInput,
  safety: SafetyAssessment,
  readiness: ReadinessAssessment,
  progression: ProgressionAssessment,
  programMarkdown?: string,
): Promise<SelectionResult> {
  if (input.intent === 'RECOVERY' || readiness.category === 'POOR' || safety.level === 'MODIFY') {
    return {
      session: {
        type: 'RECOVERY_RUN',
        run: { type: 'RECOVERY_RUN', note: 'Easy walking or very easy movement only.' },
      },
      modifications: ['Recovery takes priority over progression today.'],
      note: 'Recovery signals outweigh the planned session.',
      suggestModify: true,
    };
  }

  if (input.intent === 'RUNNING') {
    return selectRunSession(input);
  }

  return selectStrengthSession(input, progression, programMarkdown);
}
