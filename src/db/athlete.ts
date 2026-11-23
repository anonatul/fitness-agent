import { config } from '../config/env';
import { getPrisma } from './prisma';

/** Read-only resolution used by context and read tools. */
export async function getReadAthleteId(): Promise<string | null> {
  const prisma = getPrisma();

  if (config.athleteId) {
    const found = await prisma.athlete.findUnique({
      where: { id: config.athleteId },
      select: { id: true },
    });
    return found?.id ?? null;
  }

  const first = await prisma.athlete.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return first?.id ?? null;
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

  const first = await prisma.athlete.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (first) {
    return first.id;
  }

  const created = await prisma.athlete.create({
    data: { name: 'Athlete' },
    select: { id: true },
  });
  return created.id;
}
