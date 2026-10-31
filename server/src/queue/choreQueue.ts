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

  // Circuit Breaker: Track execution timestamps in rolling 5-minute window
  private recentExecutionTimestamps: number[] = [];
  private readonly MAX_ACTIONS_PER_WINDOW = 25;
  private readonly WINDOW_DURATION_MS = 5 * 60 * 1000;

  constructor(
    private adapter: IChoreAdapter,
    private options = { batchWindowMs: 1200, maxRetries: 3 }
  ) {}

  /**
   * Enqueues an action with idempotency and circuit-breaker protection.
   */
  public enqueue(userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    const key = `${userId}:${action.choreId}:${action.action}`;
    const cached = this.processedHistory.get(key);
    if (cached && cached.success) {
      return Promise.resolve(cached);
    }

    // Safety Circuit Breaker Check
    const now = Date.now();
    this.recentExecutionTimestamps = this.recentExecutionTimestamps.filter(
      (ts) => now - ts < this.WINDOW_DURATION_MS
    );

    if (this.recentExecutionTimestamps.length >= this.MAX_ACTIONS_PER_WINDOW) {
      const errResult: ActionExecutionResult = {
        choreId: action.choreId,
        success: false,
        message: `🛡️ CIRCUIT BREAKER: Safety cap reached (${this.MAX_ACTIONS_PER_WINDOW} actions / 5 min). Cool-down in progress.`,
        timestamp: now,
      };
      this.processedHistory.set(key, errResult);
      return Promise.resolve(errResult);
    }

    this.recentExecutionTimestamps.push(now);

    return new Promise((resolve) => {
      this.queue.push({
        id: key,
        userId,
        action,
        retries: 0,
        addedAt: Date.now(),
      });

      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      this.batchTimer = setTimeout(() => {
        this.processBatch().catch((err) => {
          console.error('[ChoreQueue] Unexpected error in processBatch:', err);
        });
      }, this.options.batchWindowMs);

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
          task.retries++;
          this.queue.push(task);
        } else {
          this.processedHistory.set(task.id, res);
        }
      }
    } catch (err) {
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

  public getCircuitBreakerStatus(): { current: number; max: number; isTripped: boolean } {
    const now = Date.now();
    const active = this.recentExecutionTimestamps.filter((ts) => now - ts < this.WINDOW_DURATION_MS).length;
    return {
      current: active,
      max: this.MAX_ACTIONS_PER_WINDOW,
      isTripped: active >= this.MAX_ACTIONS_PER_WINDOW,
    };
  }
}
