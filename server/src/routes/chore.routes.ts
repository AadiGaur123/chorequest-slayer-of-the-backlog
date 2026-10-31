import { Router, Request, Response } from 'express';
import { IChoreAdapter } from '../adapters/types.js';
import { ChoreQueue } from '../queue/choreQueue.js';
import { ActionPayload, BatchActionPayload } from '../../../shared/types.js';

export function createChoreRouter(adapter: IChoreAdapter, queue: ChoreQueue): Router {
  const router = Router();

  // GET /api/chores - Fetches active chore monsters for the world
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const chores = await adapter.fetchPendingChores('default-user');
      res.json({
        success: true,
        count: chores.length,
        chores,
      });
    } catch (err) {
      console.error('[ChoreRouter] Error fetching chores:', err);
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /api/chores/action - Dispatches a single monster slay action
  router.post('/action', async (req: Request, res: Response) => {
    const action = req.body as ActionPayload;
    if (!action || !action.choreId || !action.action) {
      return res.status(400).json({ success: false, error: 'Invalid ActionPayload' });
    }

    try {
      // Background worker handles execution with debounce/retry
      const result = await queue.enqueue('default-user', action);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /api/chores/batch - Slay combo (multiple enemies cleared simultaneously)
  router.post('/batch', async (req: Request, res: Response) => {
    const payload = req.body as BatchActionPayload;
    if (!payload || !Array.isArray(payload.actions)) {
      return res.status(400).json({ success: false, error: 'Expected actions array' });
    }

    try {
      const promises = payload.actions.map((act) => queue.enqueue('default-user', act));
      const results = await Promise.all(promises);
      return res.json({
        success: true,
        processedCount: results.length,
        failedCount: results.filter((r) => !r.success).length,
        results,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
