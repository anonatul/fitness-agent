import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);

  if (!config.agentRouter.apiKey) {
    console.warn(
      'AGENTROUTER_API_KEY is not set. /api/chat will return 500 until it is configured.',
    );
  }
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down.`);

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
