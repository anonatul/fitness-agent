import { app } from './app';
import { config } from './config/env';
import { checkDatabaseConnection } from './db/check';
import { disconnectPrisma } from './db/prisma';

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);

  if (!config.agentRouter.apiKey) {
    console.warn(
      'AGENTROUTER_API_KEY is not set. /api/chat will return 500 until it is configured.',
    );
  }

  if (!config.auth.password || !config.auth.sessionSecret || !config.athleteId) {
    console.warn('Authentication is incomplete. Set AUTH_PASSWORD, AUTH_SESSION_SECRET, and ATHLETE_ID.');
  }

  void checkDatabaseConnection().then((ok) => {
    console.log(
      ok
        ? 'Database connection OK.'
        : 'Database connection unavailable. /health remains available.',
    );
  });
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down.`);

  server.close(() => {
    void disconnectPrisma().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
