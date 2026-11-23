import { getPrisma } from './prisma';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error(
      'Database connection check failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    return false;
  }
}
