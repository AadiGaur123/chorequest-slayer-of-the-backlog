import { IChoreAdapter } from './types.js';
import { ActionExecutionResult, ActionPayload, ChoreItem } from '../../../shared/types.js';

/**
 * High-fidelity Mock Adapter for testing, offline demos, and hackathon evaluation
 */
export class MockAdapter implements IChoreAdapter {
  name = 'MockSimulationAdapter';

  private mockChores: ChoreItem[] = [
    {
      id: 'mock-mail-01',
      type: 'EMAIL_TRASH',
      enemyType: 'SPAM_SLIME',
      title: '70% OFF Limited Time Flash Sale!',
      source: 'deals@spam-marketing-weekly.com',
      snippet: 'Don’t miss our mega clearance sale on stuff you don’t need...',
      estimatedEffortSeconds: 5,
      xpReward: 25,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-mail-02',
      type: 'EMAIL_TRASH',
      enemyType: 'SPAM_SLIME',
      title: 'Your subscription receipt #94829',
      source: 'updates@streaming-service.net',
      snippet: 'Your recurring monthly charge of $14.99 has been processed...',
      estimatedEffortSeconds: 5,
      xpReward: 25,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-mail-03',
      type: 'EMAIL_TRASH',
      enemyType: 'SPAM_SLIME',
      title: 'Reminder: Webinar starting in 15 minutes',
      source: 'webinar-host@growthhacks.biz',
      snippet: 'Learn how to 10x your productivity with this one weird trick...',
      estimatedEffortSeconds: 10,
      xpReward: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-lint-01',
      type: 'LINT_FIX',
      enemyType: 'LINT_BANSHEE',
      title: 'Missing return type on public method `authenticateUser`',
      source: 'src/auth/jwtService.ts:42',
      snippet: '@typescript-eslint/explicit-function-return-type warning',
      estimatedEffortSeconds: 30,
      xpReward: 60,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-lint-02',
      type: 'LINT_FIX',
      enemyType: 'LINT_BANSHEE',
      title: 'Unused import `formatDistanceToNow`',
      source: 'src/utils/dateFormatter.ts:3',
      snippet: 'no-unused-vars: variable declared but never read',
      estimatedEffortSeconds: 15,
      xpReward: 40,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-expense-01',
      type: 'EXPENSE_CATEGORIZE',
      enemyType: 'RECEIPT_MIMIC',
      title: 'Blue Bottle Coffee - $6.75',
      source: 'Receipt #BB-9021',
      snippet: 'Uncategorized transaction: Needs tax classification',
      estimatedEffortSeconds: 20,
      xpReward: 50,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-expense-02',
      type: 'EXPENSE_CATEGORIZE',
      enemyType: 'RECEIPT_MIMIC',
      title: 'AWS Cloud Hosting - $142.10',
      source: 'Invoice #INV-2026-10-88',
      snippet: 'Uncategorized transaction: Infrastructure Expense',
      estimatedEffortSeconds: 25,
      xpReward: 55,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }
  ];

  async fetchPendingChores(_userId: string): Promise<ChoreItem[]> {
    // Return active chores
    return [...this.mockChores.filter(c => c.status === 'ACTIVE')];
  }

  async executeAction(_userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    // Simulate real network I/O latency (150ms - 350ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    const chore = this.mockChores.find((c) => c.id === action.choreId);
    if (!chore) {
      return {
        choreId: action.choreId,
        success: false,
        message: 'Chore item not found or already deleted',
        timestamp: Date.now(),
      };
    }

    chore.status = 'COMPLETED';

    return {
      choreId: action.choreId,
      success: true,
      message: `Successfully executed ${action.action} for "${chore.title}" via simulated backend worker`,
      externalRefId: `mock-tx-${Date.now()}`,
      timestamp: Date.now(),
    };
  }

  async executeBatch(userId: string, actions: ActionPayload[]): Promise<ActionExecutionResult[]> {
    // Simulate batch execution efficiency
    await new Promise((resolve) => setTimeout(resolve, 350));
    const results: ActionExecutionResult[] = [];
    for (const action of actions) {
      const res = await this.executeAction(userId, action);
      results.push(res);
    }
    return results;
  }
}
