import React from 'react';
import { useChoreStore } from '../store/choreStore.js';
import { Sword, Eye, Sparkles, ShieldCheck, Volume2, VolumeX, RotateCcw, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    highContrast,
    reducedMotion,
    soundEnabled,
    toggleHighContrast,
    toggleReducedMotion,
    toggleSound,
    slayAllBatchOptimistic,
    respawnChores,
    chores,
  } = useChoreStore();

  const activeCount = chores.filter((c) => c.status === 'ACTIVE').length;

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '2px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
      role="banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Sword size={24} color="var(--accent-gold)" />
        <h1
          style={{
            fontFamily: 'var(--font-retro)',
            fontSize: '13px',
            color: 'var(--accent-gold)',
            letterSpacing: '1px',
          }}
        >
          CHOREQUEST
        </h1>
        <span
          style={{
            backgroundColor: 'rgba(244, 180, 26, 0.15)',
            color: 'var(--accent-gold)',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          {activeCount} Fiends Remaining
        </span>

        {/* Whirlwind Super Button */}
        {activeCount > 0 && (
          <button
            onClick={() => slayAllBatchOptimistic()}
            title="Purge all active chores with batch API execution (or press Q)"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Zap size={13} />
            <span>Whirlwind Purge [Q]</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => respawnChores()}
          title="Respawn fresh workspace chores"
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={14} />
          <span>Respawn</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          aria-label={`Toggle Sound Effects (Currently ${soundEnabled ? 'Enabled' : 'Muted'})`}
          style={{
            background: 'var(--bg-panel)',
            color: soundEnabled ? 'var(--accent-gold)' : 'var(--text-dim)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span>{soundEnabled ? '8-Bit Audio' : 'Muted'}</span>
        </button>

        {/* Accessibility: High Contrast */}
        <button
          onClick={toggleHighContrast}
          aria-label={`Toggle High Contrast Mode (Currently ${highContrast ? 'Enabled' : 'Disabled'})`}
          style={{
            background: highContrast ? 'var(--text-main)' : 'var(--bg-panel)',
            color: highContrast ? 'var(--bg-primary)' : 'var(--text-main)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Eye size={14} />
          <span>{highContrast ? 'Normal' : 'High Contrast'}</span>
        </button>

        {/* Accessibility: Reduced Motion */}
        <button
          onClick={toggleReducedMotion}
          aria-label={`Toggle Screen Shake (Currently ${reducedMotion ? 'Disabled' : 'Enabled'})`}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={14} />
          <span>{reducedMotion ? 'Motion: Off' : 'Motion: On'}</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--accent-green)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <ShieldCheck size={14} />
          <span>BFF OAuth Vault</span>
        </div>
      </div>
    </header>
  );
};
