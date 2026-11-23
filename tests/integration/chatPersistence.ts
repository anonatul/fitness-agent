import assert from 'node:assert/strict';
import { getPrisma, disconnectPrisma } from '../../src/db/prisma';
import { getWriteAthleteId } from '../../src/db/athlete';

async function main(): Promise<void> {
  const athleteId = await getWriteAthleteId();
  assert.ok(athleteId, 'the persistence test athlete should be available');

  const prisma = getPrisma();
  await prisma.chatMessage.deleteMany({ where: { athleteId } });

  await prisma.chatMessage.create({
    data: { athleteId, role: 'USER', text: 'What should I do today?' },
  });
  await prisma.chatMessage.create({
    data: { athleteId, role: 'AGENT', text: 'Maintain today.' },
  });

  const saved = await prisma.chatMessage.findMany({
    where: { athleteId },
    orderBy: { createdAt: 'asc' },
  });
  assert.equal(saved.length, 2);
  assert.deepEqual(saved.map((message) => message.role), ['USER', 'AGENT']);
  assert.deepEqual(saved.map((message) => message.text), ['What should I do today?', 'Maintain today.']);

  await prisma.chatMessage.deleteMany({ where: { athleteId } });
  await prisma.athlete.delete({ where: { id: athleteId } });

  console.log('PASS chat messages persist in athlete-scoped database history');
  console.log('PASS user and agent roles remain separate and ordered');
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
