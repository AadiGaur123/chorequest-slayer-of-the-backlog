import { describe, it, expect } from 'vitest';
import { ChoreQueue } from '../src/queue/choreQueue.js';
import { MockAdapter } from '../src/adapters/mockAdapter.js';

describe('Safety Guardrail Unit Tests', () => {
  it('should block execution of VIP chores when confirmation flag is missing', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.executeAction('test-user', {
      choreId: 'mock-mail-1-03', // VIP Board Meeting chore
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
      confirmed: false, // NOT confirmed!
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('SAFETY ABORT: Attempted to execute VIP item');
  });

  it('should permit execution of VIP chores when confirmation flag is present', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.executeAction('test-user', {
      choreId: 'mock-mail-1-03',
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
      confirmed: true, // User explicitly confirmed in safety modal!
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully executed');
  });

  it('should activate circuit breaker and reject when blast-radius limit is exceeded', async () => {
    const adapter = new MockAdapter();
    const queue = new ChoreQueue(adapter, { batchWindowMs: 20, maxRetries: 0 });

    // Send 25 actions to reach safety threshold
    const promises = [];
    for (let i = 0; i < 25; i++) {
      promises.push(
        queue.enqueue('test-user', {
          choreId: `spam-item-${i}`,
          action: 'EMAIL_TRASH',
          clientTimestamp: Date.now(),
        })
      );
    }
    await Promise.all(promises);

    // 26th action MUST trigger the circuit breaker!
    const overflowResult = await queue.enqueue('test-user', {
      choreId: 'overflow-item-99',
      action: 'EMAIL_TRASH',
      clientTimestamp: Date.now(),
    });

    expect(overflowResult.success).toBe(false);
    expect(overflowResult.message).toContain('CIRCUIT BREAKER: Safety cap reached');
  });
});
