import React, { useEffect } from 'react';
import { useChoreStore } from '../store/choreStore.js';
import { Terminal, CheckCircle2, Zap, Flame, RotateCcw } from 'lucide-react';

export const TacticalConsole: React.FC = () => {
  const {
    chores,
    selectedChoreId,
    selectChore,
    slayChoreOptimistic,
    slayAllBatchOptimistic,
    respawnChores,
    logs,
  } = useChoreStore();

  const activeChores = chores.filter((c) => c.status === 'ACTIVE');

  // Keyboard navigation for tactical turn-based fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = activeChores.findIndex((c) => c.id === selectedChoreId);
        const nextIndex = (currentIndex + 1) % Math.max(1, activeChores.length);
        selectChore(activeChores[nextIndex]?.id || null);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = activeChores.findIndex((c) => c.id === selectedChoreId);
        const prevIndex =
          currentIndex <= 0 ? activeChores.length - 1 : currentIndex - 1;
        selectChore(activeChores[prevIndex]?.id || null);
      } else if (e.key === 'Enter' && selectedChoreId) {
        e.preventDefault();
        slayChoreOptimistic(selectedChoreId);
      } else if (e.key === 'r' && activeChores.length === 0) {
        e.preventDefault();
        respawnChores();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChores, selectedChoreId, selectChore, slayChoreOptimistic, respawnChores]);

  return (
    <aside
      className="tactical-panel"
      role="region"
      aria-label="Tactical Chore Fallback Console"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '2px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} color="var(--accent-gold)" />
          <h2
            style={{
              fontFamily: 'var(--font-terminal)',
              fontSize: '20px',
              color: 'var(--accent-gold)',
            }}
          >
            TACTICAL FALLBACK CONSOLE
          </h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          [J/K: Nav, Enter: Execute]
        </span>
      </div>

      {/* Screen Reader ARIA Live Status */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          border: 0,
        }}
      >
        {activeChores.length} digital chores awaiting background execution.
      </div>

      {/* Batch Super Purge Action */}
      {activeChores.length > 1 && (
        <button
          onClick={() => slayAllBatchOptimistic()}
          aria-label="Execute all chores simultaneously using batching queue"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '12px',
            transition: 'background 0.2s ease',
          }}
        >
          <Flame size={16} />
          <span>PURGE ALL ({activeChores.length} CHORES) [Q]</span>
        </button>
      )}

      {/* Chore Item List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          Active Digital Chores ({activeChores.length})
        </h3>

        {activeChores.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--accent-green)',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              border: '1px dashed rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={40} color="var(--accent-green)" />
            <p style={{ marginTop: '14px', fontWeight: 700, fontSize: '15px' }}>
              Zero Inbox & Clean Repo Achieved!
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              All chores have been executed in the background.
            </p>

            <button
              onClick={() => respawnChores()}
              style={{
                marginTop: '18px',
                backgroundColor: 'var(--accent-gold)',
                color: '#0f111a',
                fontWeight: 700,
                fontSize: '12px',
                padding: '10px 18px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 15px rgba(244, 180, 26, 0.35)',
                transition: 'transform 0.1s ease',
              }}
            >
              <RotateCcw size={15} />
              <span>Respawn Horde (Seed New Chores)</span>
            </button>
          </div>
        ) : (
          activeChores.map((chore) => {
            const isSelected = chore.id === selectedChoreId;
            return (
              <div
                key={chore.id}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => selectChore(chore.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    slayChoreOptimistic(chore.id);
                  }
                }}
                style={{
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                  border: isSelected
                    ? '2px solid var(--accent-blue)'
                    : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color:
                        chore.enemyType === 'SPAM_SLIME'
                          ? 'var(--accent-green)'
                          : chore.enemyType === 'LINT_BANSHEE'
                          ? 'var(--accent-purple)'
                          : 'var(--accent-gold)',
                    }}
                  >
                    [{chore.enemyType}]
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-gold)' }}>
                    +{chore.xpReward} XP
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{chore.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{chore.source}</div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '6px',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    Action: <code>{chore.type}</code>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      slayChoreOptimistic(chore.id);
                    }}
                    aria-label={`Execute chore: ${chore.title}`}
                    style={{
                      backgroundColor: 'var(--accent-red)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Zap size={12} />
                    Execute
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Real-time Combat & Background Sync Logs */}
      <div
        style={{
          marginTop: '16px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
        }}
      >
        <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
          EXECUTION LOG & AUDIT TRAIL
        </h4>
        <div
          role="log"
          aria-live="polite"
          style={{
            backgroundColor: '#0a0c13',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px',
            height: '110px',
            overflowY: 'auto',
            fontFamily: 'var(--font-terminal)',
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {logs.map((log, index) => (
            <div key={index} style={{ color: log.includes('⚠️') ? 'var(--accent-red)' : '#93c5fd' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
