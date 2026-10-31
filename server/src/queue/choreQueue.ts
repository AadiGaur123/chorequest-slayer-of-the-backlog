import { ActionPayload, ActionExecutionResult } from '../../../shared/types.js';
import { IChoreAdapter } from '../adapters/types.js';

interface QueuedTask {
  id: string;
  userId: string;
  action: ActionPayload;
  retries: number;
  addedAt: number;
}

export class ChoreQueue {
  private queue: QueuedTask[] = [];
  private processing = false;
  private processedHistory: Map<string, ActionExecutionResult> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    private adapter: IChoreAdapter,
    private options = { batchWindowMs: 1200, maxRetries: 3 }
  ) {}

  /**
   * Enqueues an action with idempotency protection.
   * If the action has already been successfully executed, returns the cached result.
   */
  public enqueue(userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    const key = `${userId}:${action.choreId}:${action.action}`;
    const cached = this.processedHistory.get(key);
    if (cached && cached.success) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve) => {
      this.queue.push({
        id: key,
        userId,
        action,
        retries: 0,
        addedAt: Date.now(),
      });

      // Debounce trigger to allow combo kills to accumulate into a single batch
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      this.batchTimer = setTimeout(() => {
        this.processBatch().catch((err) => {
          console.error('[ChoreQueue] Unexpected error in processBatch:', err);
        });
      }, this.options.batchWindowMs);

      // Simple listener for task resolution
      const checkInterval = setInterval(() => {
        const result = this.processedHistory.get(key);
        if (result) {
          clearInterval(checkInterval);
          resolve(result);
        }
      }, 50);
    });
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0 || this.processing) return;

    this.processing = true;
    const currentBatch = [...this.queue];
    this.queue = [];

    console.log(`[ChoreQueue] Processing batch of ${currentBatch.length} chore actions...`);

    const actions = currentBatch.map((task) => task.action);
    const userId = currentBatch[0]?.userId || 'anonymous-hero';

    try {
      const results = await this.adapter.executeBatch(userId, actions);

      for (let i = 0; i < currentBatch.length; i++) {
        const task = currentBatch[i];
        const res = results[i] || {
          choreId: task.action.choreId,
          success: false,
          message: 'Adapter did not return matching result',
          timestamp: Date.now(),
        };

        if (res.success) {
          this.processedHistory.set(task.id, res);
        } else if (task.retries < this.options.maxRetries) {
          console.warn(`[ChoreQueue] Retrying task ${task.id} (Attempt ${task.retries + 1})...`);
          task.retries++;
          this.queue.push(task);
        } else {
          console.error(`[ChoreQueue] Task ${task.id} exceeded max retries. Marking failed.`);
          this.processedHistory.set(task.id, res);
        }
      }
    } catch (err) {
      console.error('[ChoreQueue] Batch execution encountered fatal error:', err);
      // Requeue with backoff
      for (const task of currentBatch) {
        if (task.retries < this.options.maxRetries) {
          task.retries++;
          this.queue.push(task);
        } else {
          this.processedHistory.set(task.id, {
            choreId: task.action.choreId,
            success: false,
            message: (err as Error).message,
            timestamp: Date.now(),
          });
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processBatch(), 200);
      }
    }
  }

  public getHistory(key: string): ActionExecutionResult | undefined {
    return this.processedHistory.get(key);
  }
}
