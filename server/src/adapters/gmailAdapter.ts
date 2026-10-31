import { IChoreAdapter } from './types.js';
import { ActionExecutionResult, ActionPayload, ChoreItem } from '../../../shared/types.js';

/**
 * Real Gmail API Adapter with Scope Isolation
 * Operates strictly with 'https://www.googleapis.com/auth/gmail.modify'
 */
export class GmailAdapter implements IChoreAdapter {
  name = 'GmailAdapter';

  constructor(private userAccessToken?: string) {}

  async fetchPendingChores(_userId: string): Promise<ChoreItem[]> {
    if (!this.userAccessToken) {
      throw new Error('User not authenticated with Gmail OAuth');
    }

    // Call Gmail API: GET https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread category:promotions
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread category:promotions&maxResults=10',
      {
        headers: { Authorization: `Bearer ${this.userAccessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    if (!data.messages) return [];

    // Map messages to ChoreQuest entities
    const chores: ChoreItem[] = data.messages.map((m, idx) => ({
      id: m.id,
      type: 'EMAIL_TRASH',
      enemyType: 'SPAM_SLIME',
      title: `Unread Newsletter / Promo Email #${idx + 1}`,
      source: 'Google Gmail Inbox',
      snippet: 'Unopened promotional newsletter waiting to be vanquished.',
      estimatedEffortSeconds: 5,
      xpReward: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }));

    return chores;
  }

  async executeAction(_userId: string, action: ActionPayload): Promise<ActionExecutionResult> {
    if (!this.userAccessToken) {
      throw new Error('User not authenticated with Gmail OAuth');
    }

    // POST https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}/trash
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${action.choreId}/trash`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.userAccessToken}` },
      }
    );

    if (!response.ok) {
      return {
        choreId: action.choreId,
        success: false,
        message: `Failed to move email to trash: ${response.statusText}`,
        timestamp: Date.now(),
      };
    }

    return {
      choreId: action.choreId,
      success: true,
      message: `Email ${action.choreId} successfully moved to trash in Gmail`,
      externalRefId: action.choreId,
      timestamp: Date.now(),
    };
  }

  async executeBatch(userId: string, actions: ActionPayload[]): Promise<ActionExecutionResult[]> {
    if (!this.userAccessToken) {
      throw new Error('User not authenticated with Gmail OAuth');
    }

    // Gmail API supports batchModify to apply labels (e.g. TRASH or remove INBOX)
    const ids = actions.map((a) => a.choreId);
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX'],
        }),
      }
    );

    const success = response.ok;
    return actions.map((a) => ({
      choreId: a.choreId,
      success,
      message: success
        ? `Batch deleted in Gmail API`
        : `Batch deletion failed: ${response.statusText}`,
      timestamp: Date.now(),
    }));
  }
}
