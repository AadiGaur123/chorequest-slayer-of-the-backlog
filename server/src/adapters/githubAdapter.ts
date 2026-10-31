import { IChoreAdapter } from './types.js';
import { ActionExecutionResult, ActionPayload, ChoreItem } from '../../../shared/types.js';

/**
 * GitHub API Adapter
 * Executes repo maintenance, stale branch deletion, or workflow dispatch
 */
export class GitHubAdapter implements IChoreAdapter {
  name = 'GitHubAdapter';

  constructor(private userToken?: string) {}

  async fetchPendingChores(_userId: string): Promise<ChoreItem[]> {
    if (!this.userToken) {
      throw new Error('User not authenticated with GitHub OAuth');
    }

    // Fetch repository issues/pull requests with 'chore' or 'fix' labels
    const response = await fetch('https://api.github.com/user/issues?filter=all&labels=lint,chore', {
      headers: {
        Authorization: `Bearer ${this.userToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return [];

    const issues = (await response.json()) as Array<{ id: number; title: string; html_url: string; body: string }>;
    return issues.map((iss) => ({
      id: `gh-${iss.id}`,
      type: 'LINT_FIX',
      enemyType: 'LINT_BANSHEE',
      title: iss.title,
      source: iss.html_url,
      snippet: iss.body ? iss.body.slice(0, 80) : 'Open maintenance issue on GitHub',
      estimatedEffortSeconds: 20,
      xpReward: 50,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }));
  }

  async executeAction(_userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    if (!this.userToken) {
      throw new Error('User not authenticated with GitHub OAuth');
    }

    // Simulate closing the issue or running autofix workflow
    return {
      choreId: action.choreId,
      success: true,
      message: `Triggered automated fix / closed item ${action.choreId} on GitHub`,
      timestamp: Date.now(),
    };
  }

  async executeBatch(userId: string, actions: ActionPayload[]): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];
    for (const a of actions) {
      results.push(await this.executeAction(userId, a));
    }
    return results;
  }
}
