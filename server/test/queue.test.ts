import { describe, it, expect } from 'vitest';
import { ChoreQueue } from '../src/queue/choreQueue.js';
import { MockAdapter } from '../src/adapters/mockAdapter.js';

describe('ChoreQueue Unit Tests', () => {
  it('should process enqueued actions and return execution result', async () => {
    const adapter = new MockAdapter();
    const queue = new ChoreQueue(adapter, { batchWindowMs: 50, maxRetries: 1 });

    const result = await queue.enqueue('user-1', {
      choreId: 'mock-mail-01',
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
    });

    expect(result.success).toBe(true);
    expect(result.choreId).toBe('mock-mail-01');
  });

  it('should ensure idempotency for duplicate action calls', async () => {
    const adapter = new MockAdapter();
    const queue = new ChoreQueue(adapter, { batchWindowMs: 50, maxRetries: 1 });

    const call1 = await queue.enqueue('user-1', {
      choreId: 'mock-mail-02',
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
    });

    const call2 = await queue.enqueue('user-1', {
      choreId: 'mock-mail-02',
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
    });

    expect(call1.externalRefId).toBe(call2.externalRefId);
  });
});
