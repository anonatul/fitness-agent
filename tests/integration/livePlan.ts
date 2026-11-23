import assert from 'node:assert/strict';
import { executeTool } from '../../src/agent/toolRegistry';
import { getCurrentPlan } from '../../src/db/plan';
import { getPrisma, disconnectPrisma } from '../../src/db/prisma';

async function main(): Promise<void> {
  const plan = await getCurrentPlan();
  assert.ok(plan && plan.sessions.length === 7, 'seed creates Week 1 with seven sessions');
  const again = await getCurrentPlan();
  assert.equal(again?.id, plan.id, 'seed is idempotent');
  const friday = plan.sessions.find((session) => session.title === 'Strength C');
  const saturday = plan.sessions.find((session) => session.sessionType === 'RECOVERY');
  assert.ok(friday && saturday);
  const moved = await executeTool('reschedule_session', { sessionId: friday.id, sessionDate: saturday.sessionDate.toISOString().slice(0, 10) });
  assert.equal(moved.success, true, 'Friday Strength C swaps with Saturday recovery');
  const updated = await getCurrentPlan();
  assert.equal(updated?.sessions.find((session) => session.id === friday.id)?.sessionDate.toISOString().slice(0, 10), saturday.sessionDate.toISOString().slice(0, 10));
  const get = await executeTool('get_current_plan', {});
  assert.equal(get.success, true, 'live plan tool reads plan');
  await getPrisma().plannedSession.update({ where: { id: friday.id }, data: { status: 'COMPLETED' } });
  const completed = await executeTool('reschedule_session', { sessionId: friday.id, sessionDate: friday.sessionDate.toISOString().slice(0, 10) });
  assert.equal(completed.success, false, 'completed session cannot be moved');
  console.log('PASS live plan seed, idempotence, tool reads, conflicts, and immutable completed sessions');
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(disconnectPrisma);
