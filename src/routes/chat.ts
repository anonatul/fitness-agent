import { Router } from 'express';
import { runAgent } from '../agent/agentRunner';
import { AppError } from '../errors';
import { getReadAthleteId, getWriteAthleteId } from '../db/athlete';
import { getPrisma } from '../db/prisma';

export const chatRouter = Router();

const HISTORY_LIMIT = 100;
const CONTEXT_LIMIT = 20;

interface RecentChatMessage {
  role: 'USER' | 'AGENT';
  text: string;
}

export function chatMessageHistory(messages: readonly RecentChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'USER' ? 'user' as const : 'agent' as const,
    text: message.text,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

chatRouter.post('/', async (req, res, next) => {
  try {
    const body: unknown = req.body;
    const message = isRecord(body) ? body.message : undefined;

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError(400, 'message is required and must be a non-empty string.');
    }

    const athleteId = await getWriteAthleteId();
    if (!athleteId) {
      throw new AppError(502, 'The athlete profile is currently unavailable.');
    }

    const prisma = getPrisma();
    const recentRows = await prisma.chatMessage.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: CONTEXT_LIMIT,
      select: { role: true, text: true },
    });
    const recentHistory = chatMessageHistory(recentRows.reverse());

    const userMessage = await prisma.chatMessage.create({
      data: { athleteId, role: 'USER', text: message.trim() },
      select: { id: true, role: true, text: true, createdAt: true },
    });

    let response: string;
    try {
      response = await runAgent(message.trim(), recentHistory);
    } catch (error) {
      throw error;
    }

    const agentMessage = await prisma.chatMessage.create({
      data: { athleteId, role: 'AGENT', text: response },
      select: { id: true, role: true, text: true, createdAt: true },
    });

    res.status(200).json({
      response,
      userMessage: {
        ...userMessage,
        role: 'user',
        createdAt: userMessage.createdAt.toISOString(),
      },
      agentMessage: {
        ...agentMessage,
        role: 'agent',
        createdAt: agentMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/', async (_req, res, next) => {
  try {
    const athleteId = await getReadAthleteId();

    if (!athleteId) {
      res.status(200).json({ messages: [] });
      return;
    }

    const rows = await getPrisma().chatMessage.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { id: true, role: true, text: true, createdAt: true },
    });

    res.status(200).json({
      messages: rows.reverse().map((row) => ({
        id: row.id,
        role: row.role === 'USER' ? 'user' : 'agent',
        text: row.text,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});
