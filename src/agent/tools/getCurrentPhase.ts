import { z } from 'zod';
import { loadMarkdown } from '../../context/markdownLoader';
import { defineTool, toolError, toolSuccess } from '../toolTypes';

const SOURCE = 'program/current_phase.md';

function section(markdown: string, heading: string): string | null {
  const lines = markdown.split('\n');
  const index = lines.findIndex((line) => line.trim() === heading);

  if (index < 0) {
    return null;
  }

  const body: string[] = [];

  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i];

    if (line === undefined || line.startsWith('#') || line.trim() === '---') {
      break;
    }

    body.push(line);
  }

  const value = body.join('\n').trim();
  return value.length > 0 ? value : null;
}

function clean(value: string | null): string | null {
  return value === null ? null : value.replace(/\*\*/g, '').trim();
}

export const getCurrentPhaseTool = defineTool({
  name: 'get_current_phase',
  description:
    'Return the current training phase: its name, objective, priority order, and any start/end information. Use this before deciding what to train.',
  kind: 'read',
  schema: z.object({}),
  handler: async () => {
    const markdown = await loadMarkdown(SOURCE);

    if (markdown === null || markdown.trim().length === 0) {
      return toolError('SOURCE_UNAVAILABLE', 'The current phase file is not available.');
    }

    return toolSuccess({
      source: SOURCE,
      phaseName: clean(section(markdown, '## Phase Name')),
      objective: clean(section(markdown, '## Phase Objective')),
      priority: {
        primary: clean(section(markdown, '### Primary')),
        secondary: clean(section(markdown, '### Secondary')),
        tertiary: clean(section(markdown, '### Tertiary')),
      },
      startDate: null,
      endDate: null,
    });
  },
});
