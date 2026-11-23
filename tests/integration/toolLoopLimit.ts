import { spawn } from 'node:child_process';

const PORT = 3112;

async function main(): Promise<void> {
  const child = spawn(process.execPath, ['--env-file=.env', 'dist/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), ATHLETE_ID: 'tool-loop-limit-athlete', AGENT_MAX_TOOL_ROUNDS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let log = '';
  child.stdout.on('data', (chunk: Buffer) => {
    log += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    log += chunk.toString();
  });

  try {
    let healthy = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${PORT}/health`);
        if (response.ok) {
          healthy = true;
          break;
        }
      } catch {
        // not ready
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!healthy) {
      throw new Error('Server did not become healthy.');
    }

    const response = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What should I do today?' }),
    });
    const body = (await response.json()) as { error?: { message?: string }; response?: string };

    const statusOk = response.status === 502;
    const messageOk = /tool limit/i.test(body.error?.message ?? '');
    const logOk = /reached the tool limit/i.test(log);

    console.log(`tool loop limit: HTTP ${response.status} | message=${body.error?.message ?? body.response ?? ''}`);
    console.log(statusOk && messageOk && logOk ? 'PASS tool loop limit respected' : 'FAIL tool loop limit respected');

    if (!statusOk || !messageOk || !logOk) {
      process.exitCode = 1;
    }
  } finally {
    child.kill('SIGTERM');
  }
}

void main().catch((error: unknown) => {
  console.error('Tool loop limit test crashed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
