import { z } from 'zod';
import { getCurrentPlan, sessionForAthlete } from '../../db/plan';
import { getPrisma } from '../../db/prisma';
import { defineTool, toolError, toolSuccess } from '../toolTypes';

const id = z.string().cuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const mutable = z.enum(['PLANNED', 'MODIFIED']);

export const getCurrentPlanTool = defineTool({ name: 'get_current_plan', description: 'Read the live PostgreSQL training plan: phase, week, scheduled sessions, targets, and statuses.', kind: 'read', schema: z.object({}), handler: async () => toolSuccess(await getCurrentPlan()) });

export const rescheduleSessionTool = defineTool({ name: 'reschedule_session', description: 'Move one non-completed live-plan session to an unused date in the current plan. Returns the updated plan.', kind: 'write', schema: z.object({ sessionId: id, sessionDate: date }), handler: async ({ sessionId, sessionDate: rawSessionDate }) => {
  const sessionDate = new Date(`${rawSessionDate}T00:00:00.000Z`);
  const session = await sessionForAthlete(sessionId);
  if (!session) return toolError('NOT_FOUND', 'That planned session does not exist.');
  if (session.status === 'COMPLETED' || session.sessionDate < new Date(new Date().toDateString())) return toolError('IMMUTABLE', 'Completed or historical sessions cannot be rescheduled.');
  const conflict = await getPrisma().plannedSession.findFirst({ where: { trainingPlanId: session.trainingPlanId, sessionDate, id: { not: session.id } }, select: { id: true } });
  if (conflict) {
    const target = await getPrisma().plannedSession.findUnique({ where: { id: conflict.id } });
    if (!target || !['RECOVERY', 'REST'].includes(target.sessionType) || target.status === 'COMPLETED') return toolError('SCHEDULE_CONFLICT', 'Another planned session already exists on that date. Modify or reschedule it explicitly first.');
    const temporaryDate = new Date('2100-01-01T00:00:00.000Z');
    await getPrisma().$transaction([getPrisma().plannedSession.update({ where: { id: target.id }, data: { sessionDate: temporaryDate } }), getPrisma().plannedSession.update({ where: { id: session.id }, data: { sessionDate, status: 'MODIFIED' } }), getPrisma().plannedSession.update({ where: { id: target.id }, data: { sessionDate: session.sessionDate, status: 'MODIFIED' } })]);
  } else await getPrisma().plannedSession.update({ where: { id: session.id }, data: { sessionDate, status: 'MODIFIED' } });
  return toolSuccess(await getCurrentPlan());
} });

export const modifySessionTool = defineTool({ name: 'modify_session', description: 'Safely change the title, notes, or running targets of one future live-plan session. Does not rewrite workout history.', kind: 'write', schema: z.object({ sessionId: id, title: z.string().trim().min(1).max(120).optional(), notes: z.string().trim().max(2000).nullable().optional(), targetDistanceKm: z.number().min(0).max(1000).nullable().optional(), targetDurationMinutes: z.number().int().min(0).max(1440).nullable().optional(), status: mutable.optional() }).refine((value) => Object.keys(value).length > 1, 'At least one change is required.'), handler: async ({ sessionId, ...changes }) => {
  const session = await sessionForAthlete(sessionId);
  if (!session) return toolError('NOT_FOUND', 'That planned session does not exist.');
  if (session.status === 'COMPLETED' || session.sessionDate < new Date(new Date().toDateString())) return toolError('IMMUTABLE', 'Completed or historical sessions cannot be modified.');
  await getPrisma().plannedSession.update({ where: { id: sessionId }, data: { ...changes, status: changes.status ?? 'MODIFIED' } });
  return toolSuccess(await getCurrentPlan());
} });
