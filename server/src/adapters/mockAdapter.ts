import { IChoreAdapter } from './types.js';
import { ActionExecutionResult, ActionPayload, ChoreItem } from '../../../shared/types.js';

export class MockAdapter implements IChoreAdapter {
  name = 'MockSimulationAdapter';
  private batchCounter = 1;
  private mockChores: ChoreItem[] = [];

  constructor(private latencyMs = 20) {
    this.mockChores = this.generateSampleChores();
  }

  private generateSampleChores(): ChoreItem[] {
    const b = this.batchCounter++;
    return [
      // 1. THE OVERGROWN INBOX (Email Sector)
      {
        id: `mock-mail-${b}-01`,
        type: 'EMAIL_TRASH',
        enemyType: 'SPAM_GOBLIN',
        title: '70% OFF Limited Time Flash Sale!',
        source: 'deals@spam-marketing-weekly.com',
        snippet: 'Don’t miss our mega clearance sale on stuff you don’t need...',
        estimatedEffortSeconds: 5,
        xpReward: 25,
        status: 'ACTIVE',
        isVip: false,
        zone: 'INBOX_CITADEL',
        createdAt: new Date().toISOString(),
      },
      {
        id: `mock-mail-${b}-02`,
        type: 'EMAIL_TRASH',
        enemyType: 'SPAM_GOBLIN',
        title: 'Your subscription receipt #94829',
        source: 'updates@streaming-service.net',
        snippet: 'Your recurring monthly charge of $14.99 has been processed...',
        estimatedEffortSeconds: 5,
        xpReward: 25,
        status: 'ACTIVE',
        isVip: false,
        zone: 'INBOX_CITADEL',
        createdAt: new Date().toISOString(),
      },
      // THE BOSS (Man in a Suit - Critical VIP item)
      {
        id: `mock-mail-${b}-03`,
        type: 'EMAIL_TRASH',
        enemyType: 'BOSS_EXEC',
        title: 'CRITICAL: Board Meeting & Executive Directives',
        source: 'ceo@enterprise-holdings.corp',
        snippet: 'Confidential corporate strategy. Do not delete without sign-off.',
        estimatedEffortSeconds: 20,
        xpReward: 120,
        status: 'ACTIVE',
        isVip: true, // Triggers VIP Safety Confirmation Ward
        zone: 'INBOX_CITADEL',
        createdAt: new Date().toISOString(),
      },

      // 2. THE SYNTAX SANCTUM (Code & Lint Sector)
      {
        id: `mock-lint-${b}-01`,
        type: 'LINT_FIX',
        enemyType: 'SYNTAX_SKELETON',
        title: 'Missing return type on public method `authenticateUser`',
        source: 'src/auth/jwtService.ts:42',
        snippet: '@typescript-eslint/explicit-function-return-type warning',
        estimatedEffortSeconds: 30,
        xpReward: 60,
        status: 'ACTIVE',
        isVip: false,
        zone: 'CODE_CATACOMBS',
        createdAt: new Date().toISOString(),
      },
      {
        id: `mock-lint-${b}-02`,
        type: 'LINT_FIX',
        enemyType: 'SYNTAX_SKELETON',
        title: 'Unused import `formatDistanceToNow`',
        source: 'src/utils/dateFormatter.ts:3',
        snippet: 'no-unused-vars: variable declared but never read',
        estimatedEffortSeconds: 15,
        xpReward: 40,
        status: 'ACTIVE',
        isVip: false,
        zone: 'CODE_CATACOMBS',
        createdAt: new Date().toISOString(),
      },

      // 3. THE TREASURY PLAZA (Expense & Receipt Sector)
      {
        id: `mock-expense-${b}-01`,
        type: 'EXPENSE_CATEGORIZE',
        enemyType: 'TAX_TROLL',
        title: 'Blue Bottle Coffee - $6.75',
        source: 'Receipt #BB-9021',
        snippet: 'Uncategorized transaction: Needs tax classification',
        estimatedEffortSeconds: 20,
        xpReward: 50,
        status: 'ACTIVE',
        isVip: false,
        zone: 'TREASURY_VAULT',
        createdAt: new Date().toISOString(),
      },
      {
        id: `mock-expense-${b}-02`,
        type: 'EXPENSE_CATEGORIZE',
        enemyType: 'TAX_TROLL',
        title: 'AWS Cloud Hosting - $142.10',
        source: 'Invoice #INV-2026-10-88',
        snippet: 'Uncategorized transaction: Infrastructure Expense',
        estimatedEffortSeconds: 25,
        xpReward: 55,
        status: 'ACTIVE',
        isVip: false,
        zone: 'TREASURY_VAULT',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async fetchPendingChores(_userId: string): Promise<ChoreItem[]> {
    const active = this.mockChores.filter((c) => c.status === 'ACTIVE');
    return [...active];
  }

  async respawnChores(_userId?: string): Promise<ChoreItem[]> {
    this.mockChores = this.generateSampleChores();
    return [...this.mockChores];
  }

  async executeAction(_userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    let chore = this.mockChores.find((c) => c.id === action.choreId);
    if (!chore) {
      chore = {
        id: action.choreId,
        type: action.action,
        enemyType: 'SPAM_GOBLIN',
        title: `Dynamic Item: ${action.choreId}`,
        source: 'system',
        snippet: '',
        estimatedEffortSeconds: 5,
        xpReward: 20,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      this.mockChores.push(chore);
    }

    // Safety Check: If it is a VIP chore and wasn't explicitly confirmed, abort!
    if (chore.isVip && !action.confirmed) {
      return {
        choreId: action.choreId,
        success: false,
        message: 'SAFETY ABORT: Attempted to execute VIP item without user confirmation.',
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
    return Promise.all(actions.map((action) => this.executeAction(userId, action)));
  }
}
