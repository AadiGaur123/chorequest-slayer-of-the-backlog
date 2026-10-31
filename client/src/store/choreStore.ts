import { create } from 'zustand';
import { ChoreItem, PlayerStats, SyncState, ActionExecutionResult, BatchExecutionResponse } from '../../../shared/types.js';
import { sound } from '../game/audio/soundSynth.js';

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

  // Actions
  setChores: (chores: ChoreItem[]) => void;
  selectChore: (id: string | null) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleSound: () => void;
  
  // Game Combat & Optimistic Execution
  slayChoreOptimistic: (choreId: string) => Promise<void>;
  slayAllBatchOptimistic: () => Promise<void>;
  rollbackChore: (choreId: string, errorReason: string) => void;
  fetchChores: () => Promise<void>;
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
  logs: ['[System] Logged into The Overgrown Inbox. Prepare for combat.'],

  setChores: (chores) => set({ chores }),
  selectChore: (id) => set({ selectedChoreId: id }),
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

  slayChoreOptimistic: async (choreId: string) => {
    const { chores, playerStats, logs } = get();
    const target = chores.find((c) => c.id === choreId);
    if (!target || target.status === 'SLATED_FOR_DEATH') return;

    // Play procedural hit sound
    sound.playHit();

    // 1. OPTIMISTIC UPDATE: Immediate 60fps game response (<16ms)
    const updatedChores = chores.map((c) =>
      c.id === choreId ? { ...c, status: 'SLATED_FOR_DEATH' as const } : c
    );

    const xpGained = target.xpReward;
    const newXp = playerStats.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;
    const newCombo = playerStats.comboCount + 1;

    if (newLevel > playerStats.level) {
      sound.playXp();
    }

    set({
      chores: updatedChores,
      playerStats: {
        ...playerStats,
        xp: newXp,
        level: newLevel,
        choresCleared: playerStats.choresCleared + 1,
        comboCount: newCombo,
      },
      syncState: 'SYNCING',
      syncMessage: `[Combo x${newCombo}] Executing ${target.type}...`,
      logs: [
        `[Slay] Hero vanquished ${target.enemyType}: "${target.title}" (+${xpGained} XP)`,
        ...logs.slice(0, 19),
      ],
    });

    // 2. ASYNC BACKGROUND SYNC: Send to BFF Queue
    try {
      const response = await fetch('/api/chores/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choreId,
          action: target.type,
          clientTimestamp: Date.now(),
        }),
      });

      const data = (await response.json()) as { success: boolean; result?: ActionExecutionResult; error?: string };

      if (!response.ok || !data.success || !data.result?.success) {
        throw new Error(data.error || data.result?.message || 'Remote API execution failed');
      }

      set((state) => ({
        chores: state.chores.filter((c) => c.id !== choreId),
        syncState: 'SUCCESS',
        syncMessage: `[Resolved] ${data.result?.message}`,
      }));
    } catch (err) {
      // 3. ROLLBACK (Necromancy mechanism on failure)
      get().rollbackChore(choreId, (err as Error).message);
    }
  },

  slayAllBatchOptimistic: async () => {
    const { chores, playerStats, logs } = get();
    const active = chores.filter((c) => c.status === 'ACTIVE');
    if (active.length === 0) return;

    sound.playSuper();

    // 1. Optimistically mark all active as dying
    const updatedChores = chores.map((c) =>
      c.status === 'ACTIVE' ? { ...c, status: 'SLATED_FOR_DEATH' as const } : c
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
    const { chores, playerStats, logs } = get();
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
      logs: [
        `⚠️ [Necromancy] "${choreId}" resurrected: ${errorReason}`,
        ...logs.slice(0, 19),
      ],
    });
  },
}));
