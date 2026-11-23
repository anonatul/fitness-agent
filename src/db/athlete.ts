import { config } from '../config/env';
import { getPrisma } from './prisma';

/** Read-only resolution used by context and read tools. */
export async function getReadAthleteId(): Promise<string | null> {
  const prisma = getPrisma();
  if (!config.athleteId) return null;
  const found = await prisma.athlete.findUnique({
    where: { id: config.athleteId },
    select: { id: true },
  });
  return found?.id ?? null;
}

/**
 * Write-side resolution. The athlete is always chosen by the backend; tool
 * arguments can never supply one. A single default record is created on first
 * use so logging works in the single-athlete development stage.
 */
export async function getWriteAthleteId(): Promise<string | null> {
  const prisma = getPrisma();

  if (config.athleteId) {
    const found = await prisma.athlete.findUnique({
      where: { id: config.athleteId },
      select: { id: true },
    });

    if (found) {
      return found.id;
    }

    const created = await prisma.athlete.create({
      data: { id: config.athleteId, name: 'Athlete' },
      select: { id: true },
    });
    return created.id;
  }

  return null;
}
