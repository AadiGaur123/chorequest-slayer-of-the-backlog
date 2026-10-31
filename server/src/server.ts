import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { MockAdapter } from './adapters/mockAdapter.js';
import { ChoreQueue } from './queue/choreQueue.js';
import { authRouter } from './routes/auth.routes.js';
import { createChoreRouter } from './routes/chore.routes.js';

const app = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

// Basic Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please slow down your attacks!' },
});
app.use(limiter);

// Initialize Adapters & Idempotent Worker Queue
const primaryAdapter = new MockAdapter();
const choreQueue = new ChoreQueue(primaryAdapter, {
  batchWindowMs: config.queue.batchWindowMs,
  maxRetries: config.queue.maxRetries,
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/chores', createChoreRouter(primaryAdapter, choreQueue));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    mode: config.demoMode ? 'DEMO_SANDBOX' : 'PRODUCTION',
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.port, () => {
  console.log(`🗡️  ChoreQuest BFF Server running on http://localhost:${config.port}`);
  console.log(`⚔️  Mode: ${config.demoMode ? 'DEMO SANDBOX (Zero-Auth Evaluator Friendly)' : 'PRODUCTION'}`);
});

export { app };
