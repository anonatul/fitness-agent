import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  client ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 5_000,
    }),
  });

  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (!client) {
    return;
  }

  await client.$disconnect();
  client = null;
}
