import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { chatRouter } from './routes/chat';
import { healthRouter } from './routes/health';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use('/health', healthRouter);
app.use('/api/chat', chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);
