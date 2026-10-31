import { ActionPayload, ActionExecutionResult, ChoreItem } from '../../shared/types.js';

export interface IChoreAdapter {
  name: string;
  fetchPendingChores(userId: string): Promise<ChoreItem[]>;
  executeAction(userId: string, action: ActionPayload): Promise<ActionExecutionResult>;
  executeBatch(userId: string, actions: ActionPayload[]): Promise<ActionExecutionResult[]>;
  respawnChores?(userId: string): Promise<ChoreItem[]>;
}
