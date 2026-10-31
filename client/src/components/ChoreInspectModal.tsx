import React, { useEffect, useCallback } from 'react';
import { useChoreStore } from '../store/choreStore.js';

const TYPE_LABELS: Record<string, string> = {
  EMAIL_TRASH: '📧 Spam Email',
  EMAIL_ARCHIVE: '📨 Email',
  LINT_FIX: '🔧 Lint Error',
  EXPENSE_CATEGORIZE: '💰 Expense',
};

const TYPE_COLORS: Record<string, string> = {
  EMAIL_TRASH: '#f97316',
  EMAIL_ARCHIVE: '#3b82f6',
  LINT_FIX: '#a855f7',
  EXPENSE_CATEGORIZE: '#22c55e',
};

export const ChoreInspectModal: React.FC = () => {
  const { inspectedChore, inspectChore, initiateSlay } = useChoreStore();

  const handleClose = useCallback(() => {
    inspectChore(null);
  }, [inspectChore]);

  const handleSlay = useCallback(() => {
    if (!inspectedChore) return;
    inspectChore(null);
    initiateSlay(inspectedChore.id);
  }, [inspectedChore, inspectChore, initiateSlay]);

  // Escape key closes modal
  useEffect(() => {
    if (!inspectedChore) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectedChore, handleClose]);

  if (!inspectedChore) return null;

  const typeColor = TYPE_COLORS[inspectedChore.type] ?? '#facc15';
  const typeLabel = TYPE_LABELS[inspectedChore.type] ?? inspectedChore.type;
  const bodyText = inspectedChore.body ?? '(No additional details available.)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspect-title"
      className="inspect-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: `2px solid ${inspectedChore.isVip ? '#facc15' : typeColor}`,
          borderRadius: '8px',
          maxWidth: '540px',
          width: '100%',
          padding: '24px',
          fontFamily: "'Inter', sans-serif",
          boxShadow: `0 0 32px ${inspectedChore.isVip ? '#facc15' : typeColor}55`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            {inspectedChore.isVip && (
              <div style={{ color: '#facc15', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>
                👑 VIP ENTITY — SAFETY WARD ACTIVE
              </div>
            )}
            <div
              style={{
                display: 'inline-block',
                background: `${typeColor}22`,
                border: `1px solid ${typeColor}`,
                borderRadius: '4px',
                color: typeColor,
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                marginBottom: '8px',
              }}
            >
              {typeLabel}
            </div>
            <h2
              id="inspect-title"
              style={{ margin: 0, color: '#f1f5f9', fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }}
            >
              {inspectedChore.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close inspect panel"
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px 10px',
              marginLeft: '16px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
          <span>📁 Source: <strong style={{ color: '#94a3b8' }}>{inspectedChore.source}</strong></span>
          <span>⚡ XP Reward: <strong style={{ color: '#facc15' }}>+{inspectedChore.xpReward}</strong></span>
          <span>🏷️ Type: <strong style={{ color: typeColor }}>{typeLabel}</strong></span>
        </div>

        {/* Body Content */}
        <div
          style={{
            background: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #1e3a5f',
            padding: '14px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#cbd5e1',
            lineHeight: '1.65',
            whiteSpace: 'pre-wrap',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
          aria-label="Full message body"
        >
          {bodyText}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '8px 18px',
            }}
          >
            Close [Esc]
          </button>
          <button
            onClick={handleSlay}
            style={{
              background: inspectedChore.isVip ? '#92400e' : '#1e3a8a',
              border: `1px solid ${inspectedChore.isVip ? '#facc15' : '#3b82f6'}`,
              borderRadius: '6px',
              color: inspectedChore.isVip ? '#facc15' : '#93c5fd',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 18px',
            }}
          >
            {inspectedChore.isVip ? '⚠️ Verify & Slay [Space]' : '⚔️ Slay & Execute [Space]'}
          </button>
        </div>
      </div>
    </div>
  );
};
