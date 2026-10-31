import { create } from 'zustand';
import {
  ChoreItem,
  PlayerStats,
  SyncState,
  ActionExecutionResult,
  BatchExecutionResponse,
  AuditLogEntry,
  ChoreType,
} from '../../../shared/types.js';
import { sound } from '../game/audio/soundSynth.js';

interface UndoPendingItem {
  choreId: string;
  title: string;
  action: ChoreType;
  remainingSeconds: number;
  timerId: ReturnType<typeof setInterval>;
}

interface ChoreStore {
  chores: ChoreItem[];
  playerStats: PlayerStats;
  syncState: SyncState;
  syncMessage: string | null;
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  selectedChoreId: string | null;
  logs: string[];

  // Safety & Guardrail State
  undoPending: UndoPendingItem | null;
  vipConfirmationChore: ChoreItem | null;
  inspectedChore: ChoreItem | null;
  auditLog: AuditLogEntry[];

  // Actions
  setChores: (chores: ChoreItem[]) => void;
  selectChore: (id: string | null) => void;
  inspectChore: (id: string | null) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleSound: () => void;

  // Combat, Undo & Safety
  initiateSlay: (choreId: string, bypassVipCheck?: boolean) => void;
  confirmVipSlay: () => void;
  cancelVipSlay: () => void;
  undoLastAction: () => void;
  commitSlayToBackend: (choreId: string) => Promise<void>;
  slayAllBatchOptimistic: () => Promise<void>;
  rollbackChore: (choreId: string, errorReason: string) => void;
  fetchChores: () => Promise<void>;
  respawnChores: () => Promise<void>;
  exportAuditLog: () => void;
}

export const useChoreStore = create<ChoreStore>((set, get) => ({
  chores: [],
  playerStats: {
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    choresCleared: 0,
    comboCount: 0,
  },
  syncState: 'IDLE',
  syncMessage: null,
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
  selectedChoreId: null,
  logs: ['[System] Logged into The Overgrown Inbox. Safety Guardrails: ACTIVE.'],

  // Safety Defaults
  undoPending: null,
  vipConfirmationChore: null,
  inspectedChore: null,
  auditLog: [],

  setChores: (chores) => set({ chores }),
  selectChore: (id) => set({ selectedChoreId: id }),
  inspectChore: (id) => {
    if (!id) {
      set({ inspectedChore: null });
      return;
    }
    const found = get().chores.find((c) => c.id === id);
    if (found) {
      sound.playXp();
      set({
        inspectedChore: found,
        selectedChoreId: id,
        logs: [`📜 [Inspect] Opened details for "${found.title}"`, ...get().logs.slice(0, 19)],
      });
    }
  },
  toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  toggleSound: () => {
    const next = !get().soundEnabled;
    sound.enabled = next;
    set({ soundEnabled: next });
  },

  fetchChores: async () => {
    set({ syncState: 'SYNCING', syncMessage: 'Scouting digital workspace...' });
    try {
      const res = await fetch('/api/chores');
      const data = await res.json();
      if (data.success && Array.isArray(data.chores)) {
        set({
          chores: data.chores,
          syncState: 'SUCCESS',
          syncMessage: `Spawned ${data.chores.length} chore fiends in the dungeon`,
        });
      }
    } catch {
      set({
        syncState: 'ERROR',
        syncMessage: 'Failed to connect to ChoreQuest server',
      });
    }
  },

  respawnChores: async () => {
    set({ syncState: 'SYNCING', syncMessage: 'Respawning fresh chore horde...' });
    sound.playXp();
    try {
      const res = await fetch('/api/chores/respawn', { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.chores)) {
        set((state) => ({
          chores: data.chores,
          syncState: 'SUCCESS',
          syncMessage: `⚔️ Spawned ${data.chores.length} fresh chore fiends!`,
          logs: [
            `⚔️ [Respawn] A fresh horde of ${data.chores.length} digital chores has emerged!`,
            ...state.logs.slice(0, 19),
          ],
        }));
      }
    } catch {
      set({
        syncState: 'ERROR',
        syncMessage: 'Failed to respawn chores',
      });
    }
  },

  /**
   * SAFETY GUARDRAIL 1: Intercepts slays for VIP checks or 5s Undo Window
   */
  initiateSlay: (choreId: string, bypassVipCheck = false) => {
    const { chores } = get();
    const target = chores.find((c) => c.id === choreId);
    if (!target || target.status === 'SLATED_FOR_DEATH' || target.status === 'PENDING_UNDO') return;

    // Safety Ward: Check for VIP / Critical Protected Item
    if (target.isVip && !bypassVipCheck) {
      sound.playError();
      set({ vipConfirmationChore: target });
      return;
    }

    // Play hit feedback
    sound.playHit();

    // 1. Immediately visually disable and award stats
    const updatedChores = chores.map((c) =>
      c.id === choreId ? { ...c, status: 'PENDING_UNDO' as const } : c
    );

    const { playerStats, logs, auditLog } = get();
    const xpGained = target.xpReward;
    const newXp = playerStats.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;
    const newCombo = playerStats.comboCount + 1;

    if (newLevel > playerStats.level) {
      sound.playXp();
    }

    // Existing pending undo is auto-committed if another action happens
    if (get().undoPending) {
      clearTimeout(get().undoPending!.timerId);
      get().commitSlayToBackend(get().undoPending!.choreId);
    }

    // 5-Second Grace Countdown Timer
    let remaining = 5;
    const intervalTimer = setInterval(() => {
      remaining -= 1;
      const current = get().undoPending;
      if (current && current.choreId === choreId) {
        if (remaining <= 0) {
          clearInterval(intervalTimer);
          set({ undoPending: null });
          get().commitSlayToBackend(choreId);
        } else {
          set({ undoPending: { ...current, remainingSeconds: remaining } });
        }
      } else {
        clearInterval(intervalTimer);
      }
    }, 1000);

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      choreId: target.id,
      action: target.type,
      title: target.title,
      timestamp: new Date().toLocaleTimeString(),
      status: 'PENDING_UNDO',
      details: `Dispatched to 5s safety grace window. Press [Z] to abort.`,
    };

    set({
      chores: updatedChores,
      playerStats: {
        ...playerStats,
        xp: newXp,
        level: newLevel,
        choresCleared: playerStats.choresCleared + 1,
        comboCount: newCombo,
      },
      undoPending: {
        choreId: target.id,
        title: target.title,
        action: target.type,
        remainingSeconds: 5,
        timerId: intervalTimer,
      },
      auditLog: [newAuditEntry, ...auditLog.slice(0, 49)],
      logs: [
        `🛡️ [Safety Net] Slayed "${target.title}". Press [Z] to Undo within 5s!`,
        ...logs.slice(0, 19),
      ],
    });
  },

  confirmVipSlay: () => {
    const { vipConfirmationChore } = get();
    if (!vipConfirmationChore) return;
    const choreId = vipConfirmationChore.id;
    set({ vipConfirmationChore: null });
    get().initiateSlay(choreId, true);
  },

  cancelVipSlay: () => {
    const { logs } = get();
    set({
      vipConfirmationChore: null,
      logs: [`🛡️ [Safety Ward] VIP item protected. Action aborted by user.`, ...logs.slice(0, 19)],
    });
  },

  /**
   * SAFETY GUARDRAIL 2: Undo action during grace period (Z key)
   */
  undoLastAction: () => {
    const { undoPending, chores, playerStats, logs, auditLog } = get();
    if (!undoPending) return;

    clearTimeout(undoPending.timerId);
    sound.playXp();

    const rolledBackChores = chores.map((c) =>
      c.id === undoPending.choreId ? { ...c, status: 'ACTIVE' as const } : c
    );

    const updatedAudit = auditLog.map((entry) =>
      entry.choreId === undoPending.choreId
        ? { ...entry, status: 'UNDONE' as const, details: 'User triggered safety undo. Zero API impact.' }
        : entry
    );

    set({
      undoPending: null,
      chores: rolledBackChores,
      playerStats: {
        ...playerStats,
        choresCleared: Math.max(0, playerStats.choresCleared - 1),
        comboCount: 0,
      },
      auditLog: updatedAudit,
      syncState: 'SUCCESS',
      syncMessage: `🛡️ Slay undone! "${undoPending.title}" restored safely.`,
      logs: [
        `↩️ [UNDO] Action aborted before API execution. "${undoPending.title}" restored!`,
        ...logs.slice(0, 19),
      ],
    });
  },

  /**
   * Finalizes action after 5s grace window expires
   */
  commitSlayToBackend: async (choreId: string) => {
    const { chores } = get();
    const target = chores.find((c) => c.id === choreId);
    if (!target) return;

    set({
      syncState: 'SYNCING',
      syncMessage: `Committing ${target.type} to background queue...`,
    });

    try {
      const response = await fetch('/api/chores/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choreId,
          action: target.type,
          clientTimestamp: Date.now(),
          confirmed: true,
        }),
      });

      const data = (await response.json()) as { success: boolean; result?: ActionExecutionResult; error?: string };

      if (!response.ok || !data.success || !data.result?.success) {
        throw new Error(data.error || data.result?.message || 'Remote API execution failed');
      }

      set((state) => ({
        chores: state.chores.filter((c) => c.id !== choreId),
        syncState: 'SUCCESS',
        syncMessage: `[Committed] ${data.result?.message}`,
        auditLog: state.auditLog.map((entry) =>
          entry.choreId === choreId
            ? { ...entry, status: 'COMMITTED', details: data.result?.message || 'Executed via BFF worker.' }
            : entry
        ),
      }));
    } catch (err) {
      get().rollbackChore(choreId, (err as Error).message);
    }
  },

  slayAllBatchOptimistic: async () => {
    const { chores, playerStats, logs } = get();
    const active = chores.filter((c) => c.status === 'ACTIVE' && !c.isVip); // Protects VIPs from blind whirlwind!
    if (active.length === 0) return;

    sound.playSuper();

    const updatedChores = chores.map((c) =>
      c.status === 'ACTIVE' && !c.isVip ? { ...c, status: 'SLATED_FOR_DEATH' as const } : c
    );

    const totalXp = active.reduce((sum, item) => sum + item.xpReward, 0);
    const newXp = playerStats.xp + totalXp;
    const newLevel = Math.floor(newXp / 100) + 1;

    set({
      chores: updatedChores,
      playerStats: {
        ...playerStats,
        xp: newXp,
        level: newLevel,
        choresCleared: playerStats.choresCleared + active.length,
        comboCount: playerStats.comboCount + active.length,
      },
      syncState: 'SYNCING',
      syncMessage: `[BATCH PURGE] Dispatching ${active.length} actions in single payload...`,
      logs: [
        `⚡ [SUPER MOVE] Whirlwind Purge unleashed on ${active.length} chores! (+${totalXp} XP)`,
        ...logs.slice(0, 19),
      ],
    });

    try {
      const response = await fetch('/api/chores/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: active.map((c) => ({
            choreId: c.id,
            action: c.type,
            clientTimestamp: Date.now(),
          })),
        }),
      });

      const data = (await response.json()) as { success: boolean } & BatchExecutionResponse;
      if (!response.ok || !data.success) {
        throw new Error('Batch dispatch failed on server');
      }

      set((state) => ({
        chores: state.chores.filter((c) => !active.some((a) => a.id === c.id)),
        syncState: 'SUCCESS',
        syncMessage: `[Batch Resolved] ${data.processedCount} chores purged simultaneously!`,
      }));
    } catch (err) {
      sound.playError();
      active.forEach((a) => get().rollbackChore(a.id, (err as Error).message));
    }
  },

  rollbackChore: (choreId: string, errorReason: string) => {
    const { chores, playerStats, logs, auditLog } = get();
    sound.playError();

    const rolledBackChores = chores.map((c) =>
      c.id === choreId ? { ...c, status: 'ACTIVE' as const } : c
    );

    set({
      chores: rolledBackChores,
      playerStats: {
        ...playerStats,
        choresCleared: Math.max(0, playerStats.choresCleared - 1),
        comboCount: 0,
      },
      syncState: 'ERROR',
      syncMessage: `Sync failed: ${errorReason}. Fiend resurrected!`,
      auditLog: auditLog.map((entry) =>
        entry.choreId === choreId
          ? { ...entry, status: 'FAILED', details: `Rollback triggered: ${errorReason}` }
          : entry
      ),
      logs: [
        `⚠️ [Necromancy] "${choreId}" resurrected: ${errorReason}`,
        ...logs.slice(0, 19),
      ],
    });
  },

  /**
   * SAFETY GUARDRAIL 3: Export full safety audit ledger as JSON
   */
  exportAuditLog: () => {
    const { auditLog } = get();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chorequest-safety-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
}));
