import { loadMarkdown } from '../context/markdownLoader';
import type { ProgramExerciseView } from './types';

export interface ProgramSection {
  name: string;
  exercises: ProgramExerciseView[];
}

const PROGRAM_SOURCE = 'program/current_program.md';

function parseReps(value: string): { min: number | null; max: number | null } {
  const match = value.match(/(\d+)\s*[–—-]\s*(\d+)/);

  if (!match || match[1] === undefined || match[2] === undefined) {
    return { min: null, max: null };
  }

  return { min: Number(match[1]), max: Number(match[2]) };
}

function parseSingleNumber(value: string): number | null {
  const match = value.match(/\d+/);
  return match?.[0] ? Number(match[0]) : null;
}

/** Reads the current program Markdown; never duplicates it into constants. */
export async function loadProgramSections(): Promise<ProgramSection[]> {
  const markdown = await loadMarkdown(PROGRAM_SOURCE);

  if (markdown === null) {
    return [];
  }

  const sections: ProgramSection[] = [];
  let section: ProgramSection | null = null;
  let current: ProgramExerciseView | null = null;

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();

    if (/^#\s+Strength\s+[ABC]\b/i.test(line)) {
      section = { name: line.replace(/^#\s+/, ''), exercises: [] };
      sections.push(section);
      current = null;
      continue;
    }

    if (/^#\s+/.test(line)) {
      section = null;
      current = null;
      continue;
    }

    if (section === null) {
      continue;
    }

    const exerciseMatch = line.match(/^##\s+\d+\.\s+(.+)$/);

    if (exerciseMatch?.[1]) {
      current = {
        name: exerciseMatch[1].trim(),
        sets: null,
        repsMin: null,
        repsMax: null,
        targetRir: null,
        orderIndex: section.exercises.length,
      };
      section.exercises.push(current);
      continue;
    }

    if (current === null) {
      continue;
    }

    if (line.startsWith('**Sets:**')) {
      current.sets = parseSingleNumber(line);
    } else if (line.startsWith('**Reps:**')) {
      const range = parseReps(line);
      current.repsMin = range.min;
      current.repsMax = range.max;
    } else if (line.startsWith('**Target:**')) {
      current.targetRir = parseSingleNumber(line);
    }
  }

  return sections;
}

export function canonicalExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function findProgramExercise(
  name: string,
): Promise<{ section: ProgramSection; exercise: ProgramExerciseView } | null> {
  const sections = await loadProgramSections();
  const key = canonicalExerciseName(name);

  for (const section of sections) {
    for (const exercise of section.exercises) {
      if (canonicalExerciseName(exercise.name) === key) {
        return { section, exercise };
      }
    }
  }

  return null;
}

/** Pick the next strength block based on the last logged block, not a calendar. */
export async function selectNextStrengthSection(
  lastExerciseNames: readonly string[],
): Promise<ProgramSection | null> {
  const sections = await loadProgramSections();

  if (sections.length === 0) {
    return null;
  }

  if (lastExerciseNames.length === 0) {
    return sections[0] ?? null;
  }

  const lastKeys = lastExerciseNames.map(canonicalExerciseName);

  for (const section of sections) {
    const overlap = section.exercises.filter((exercise) =>
      lastKeys.includes(canonicalExerciseName(exercise.name)),
    ).length;

    if (overlap === 0) {
      return section;
    }
  }

  const index = sections.findIndex((section) =>
    section.exercises.some((exercise) =>
      lastKeys.includes(canonicalExerciseName(exercise.name)),
    ),
  );
  const nextIndex = index + 1;

  return sections[nextIndex] ?? sections[0] ?? null;
}
