import { disconnectPrisma } from '../db/prisma';
import { getDatabaseContext } from '../services/dbContext';
import { buildChatContext } from './contextBuilder';
import { selectKnowledgeFiles } from './knowledgeRouter';
import { loadMarkdown, MARKDOWN_ALLOWLIST } from './markdownLoader';

interface Sample {
  message: string;
  expectKnowledge: readonly string[];
}

const SAMPLES: readonly Sample[] = [
  {
    message: 'What should I train today?',
    expectKnowledge: ['knowledge/00_core_principles.md'],
  },
  {
    message:
      'I completed 3 sets of push-ups and got 8, 8, 7 reps at around 2 RIR. Should I progress?',
    expectKnowledge: [
      'knowledge/01_hypertrophy.md',
      'knowledge/02_progressive_overload.md',
      'knowledge/03_rir_and_failure.md',
      'knowledge/04_volume_frequency_intensity.md',
    ],
  },
  {
    message: 'My legs are very sore. Should I run today?',
    expectKnowledge: ['knowledge/06_recovery.md', 'knowledge/08_running.md'],
  },
  {
    message: 'How should I approach my long-term half-marathon goal?',
    expectKnowledge: ['knowledge/09_half_marathon.md'],
  },
];

let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures += 1;
  }
}

async function main(): Promise<void> {
  console.log('1. Markdown loading');
  for (const file of MARKDOWN_ALLOWLIST) {
    const content = await loadMarkdown(file);
    check(`load ${file}`, content !== null && content.trim().length > 0);
  }

  console.log('\n2. Path safety (must reject)');
  const forbidden = [
    '../.env',
    '/etc/passwd',
    'knowledge/99_unknown.md',
    'user/examples/profile.example.md',
    'agent/../../.env',
  ];
  for (const badPath of forbidden) {
    let rejected = false;
    try {
      await loadMarkdown(badPath);
    } catch {
      rejected = true;
    }
    check(`reject ${badPath}`, rejected);
  }

  console.log('\n3. Knowledge routing');
  for (const sample of SAMPLES) {
    const selection = selectKnowledgeFiles(sample.message);
    const missing = sample.expectKnowledge.filter((file) => !selection.files.includes(file));
    check(
      `route "${sample.message.slice(0, 48)}…"`,
      selection.files.length > 0 && missing.length === 0,
      `selected=[${selection.files.join(', ') || 'none'}]` +
        (missing.length > 0 ? ` missing=[${missing.join(', ')}]` : ''),
    );
  }

  const historyContext = await buildChatContext('What did we decide?', [
    { role: 'user', text: 'I only have 20 minutes today.' },
    { role: 'agent', text: 'Use the shortened strength session.' },
  ]);
  check(
    'recent conversation is included in model context',
    historyContext.input.includes('I only have 20 minutes today.') &&
      historyContext.input.includes('Use the shortened strength session.') &&
    (historyContext.sectionSizes.recent_conversation ?? 0) > 0,
  );
  check(
    'athlete profile and program context are included',
    historyContext.input.includes('### user/profile.md') &&
      historyContext.input.includes('### program/current_phase.md') &&
      historyContext.input.includes('### program/current_program.md') &&
      historyContext.input.includes('### program/progression_rules.md') &&
      historyContext.input.includes('### program/decision_rules.md'),
  );
  check(
    'missing database data is explicitly disclosed',
    historyContext.database.available &&
      historyContext.database.text.includes('None logged') ||
      historyContext.database.text.includes('No training history'),
  );

  console.log('\n4. Database state');
  const database = await getDatabaseContext();
  check('database context available', database.available, `counts=${JSON.stringify(database.counts)}`);

  console.log('\n5. Context construction');
  for (const sample of SAMPLES) {
    const built = await buildChatContext(sample.message);
    const requiredSections = [
      'instruction_hierarchy',
      'agent_instructions',
      'user_context',
      'program_context',
      'knowledge',
      'database_state',
      'user_message',
    ];
    const missingSections = requiredSections.filter(
      (section) => (built.sectionSizes[section] ?? 0) <= 0,
    );
    check(
      `build "${sample.message.slice(0, 48)}…"`,
      missingSections.length === 0,
      `${built.sizeChars} chars, ~${built.estimatedTokens} est. tokens, ` +
        `knowledge=[${built.knowledgeFiles.join(', ') || 'none'}]`,
    );
  }

  console.log('');
  if (failures > 0) {
    console.error(`${failures} context check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('All context checks passed.');
  }
}

void main()
  .catch((error: unknown) => {
    console.error(
      'Context check crashed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma().catch(() => undefined);
  });
