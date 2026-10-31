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
        body: `Dear Valued Customer,

Act fast! For the next 3 hours only, enjoy up to 70% off our premier collection of ultrasonic vegetable washers, novelty socks, and subscription air-fresheners.

Use discount promo code "CLUTTER70" at checkout. Free shipping on orders over $150.

Unsubscribe anytime by slashing this goblin or visiting your account preferences.`,
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
        body: `Hello Hero,

Thanks for streaming with StreamStream Unlimited. Your auto-renewal billing statement for October 2026 is attached.

Amount Charged: $14.99 USD
Payment Method: Visa ending in 4022
Next Billing Date: November 30, 2026

If you would like to archive this receipt, defeat this monster to keep your digital space spotless!`,
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
        body: `CONFIDENTIAL - FOR BOARD OF DIRECTORS ONLY

Team,

Please review the attached Q4 Operating Plan and headcount allocations prior to Thursday's 9:00 AM executive session. We are prioritizing:
1. Product Architecture consolidation
2. Automated chore vanquishing workflows
3. Margin expansion across cloud accounts

Treat this message with utmost confidentiality. Discarding or archiving this message without authorization will trigger corporate compliance alerts.

Regards,
Arthur Vance
Chief Executive Officer`,
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
        body: `ESLint Diagnostic Report:
File: src/auth/jwtService.ts (Line 42, Col 9)
Rule: @typescript-eslint/explicit-function-return-type

41 |   // Missing explicit return signature on public method
42 |   public async authenticateUser(token: string) {
43 |     const payload = await jwt.verify(token, secret);
44 |     return payload;

Proposed Autofix:
Change signature to:
public async authenticateUser(token: string): Promise<AuthPayload>`,
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
        body: `ESLint Diagnostic Report:
File: src/utils/dateFormatter.ts (Line 3, Col 10)
Rule: no-unused-vars

1 | import { parseISO } from 'date-fns';
2 | import { format } from 'date-fns';
3 | import { formatDistanceToNow } from 'date-fns'; // [Warning: Unused identifier]

Proposed Autofix:
Prune line 3 import to save bundle footprint and clean up syntax tree.`,
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
        body: `Expense Reconciliation Record:
Transaction ID: BB-9021-X
Merchant: Blue Bottle Coffee (South Park location)
Date: October 29, 2026 (08:42 AM)
Total Amount: $6.75 USD

Itemization:
- 1x Single Origin Oat Milk Cortado ($6.25)
- Tax ($0.50)

Pending Action:
Assign tax ledger category: [Meals & Entertainment / Client Meeting]`,
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
        body: `Amazon Web Services (AWS) Invoice Summary:
Account ID: 9481-2091-8841
Period: October 1 - October 31, 2026
Total Billed: $142.10 USD

Cost Breakdown:
- EC2 Production Instances: $88.40
- RDS PostgreSQL Managed Database: $38.20
- CloudWatch & S3 Storage: $15.50

Pending Action:
Classify as [Engineering Infrastructure / Operating Expense] in Accounting Database.`,
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
