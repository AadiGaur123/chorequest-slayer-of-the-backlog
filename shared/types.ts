/**
 * Shared Domain Types for ChoreQuest
 * Used across both Client and Server to maintain contract integrity
 */

export type ChoreType = 'EMAIL_TRASH' | 'EMAIL_ARCHIVE' | 'LINT_FIX' | 'EXPENSE_CATEGORIZE';

export type EnemyType = 'SPAM_SLIME' | 'LINT_BANSHEE' | 'RECEIPT_MIMIC';

export type SyncState = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR' | 'RETRYING';

export interface ChoreItem {
  id: string;
  type: ChoreType;
  enemyType: EnemyType;
  title: string;
  source: string; // e.g. "noreply@spam-newsletter.com" or "src/auth/token.ts"
  snippet: string;
  estimatedEffortSeconds: number;
  xpReward: number;
  status: 'ACTIVE' | 'SLATED_FOR_DEATH' | 'COMPLETED' | 'FAILED';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  choresCleared: number;
  comboCount: number;
}

export interface ActionPayload {
  choreId: string;
  action: ChoreType;
  clientTimestamp: number;
}

export interface BatchActionPayload {
  actions: ActionPayload[];
}

export interface ActionExecutionResult {
  choreId: string;
  success: boolean;
  message: string;
  externalRefId?: string;
  timestamp: number;
}

export interface BatchExecutionResponse {
  results: ActionExecutionResult[];
  processedCount: number;
  failedCount: number;
}
