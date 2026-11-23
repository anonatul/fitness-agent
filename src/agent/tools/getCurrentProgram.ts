import { z } from 'zod';
import { loadMarkdown } from '../../context/markdownLoader';
import { defineTool, toolError, toolSuccess } from '../toolTypes';

const SOURCE = 'program/current_program.md';

export const getCurrentProgramTool = defineTool({
  name: 'get_current_program',
  description:
    'Return the current training program template, including weekly structure, strength sessions, and running sessions. This is planned work, not completed work.',
  kind: 'read',
  schema: z.object({}),
  handler: async () => {
    const markdown = await loadMarkdown(SOURCE);

    if (markdown === null || markdown.trim().length === 0) {
      return toolError('SOURCE_UNAVAILABLE', 'The current program file is not available.');
    }

    return toolSuccess({
      source: SOURCE,
      content: markdown.trim(),
      note: 'This is the current plan. It does not prove any session was completed.',
    });
  },
});
