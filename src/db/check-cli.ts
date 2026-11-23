import { checkDatabaseConnection } from './check';
import { disconnectPrisma } from './prisma';

async function main(): Promise<void> {
  const ok = await checkDatabaseConnection();

  if (!ok) {
    process.exitCode = 1;
    return;
  }

  console.log('Database connection OK.');
}

void main()
  .catch((error: unknown) => {
    console.error(
      'Database check failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
