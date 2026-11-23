import { executeTool } from '../../src/agent/toolRegistry';

async function main(): Promise<void> {
  const result = await executeTool('get_recent_strength', { days: 7 });
  console.log(JSON.stringify(result));

  if (result.success) {
    console.error('Database failure was incorrectly reported as success.');
    process.exitCode = 1;
    return;
  }

  const message = result.error.message.toLowerCase();

  if (message.includes('prisma') || message.includes('stack') || message.includes('econnrefused')) {
    console.error('Database failure leaked technical details.');
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error('Probe crashed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
