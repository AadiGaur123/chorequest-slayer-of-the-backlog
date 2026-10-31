import React, { useEffect } from 'react';
import { useChoreStore } from '../store/choreStore.js';
import { ShieldAlert, RotateCcw, AlertOctagon } from 'lucide-react';

export const SafetyOverlay: React.FC = () => {
  const {
    undoPending,
    undoLastAction,
    vipConfirmationChore,
    confirmVipSlay,
    cancelVipSlay,
  } = useChoreStore();

  // Keyboard shortcut listener for safety controls (Z to Undo, Esc/Enter for VIP modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (vipConfirmationChore) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelVipSlay();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          confirmVipSlay();
        }
      } else if (undoPending && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undoLastAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoPending, undoLastAction, vipConfirmationChore, confirmVipSlay, cancelVipSlay]);

  return (
    <>
      {/* 1. Floating 5-Second Undo Grace Period Banner */}
      {undoPending && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '420px',
            backgroundColor: '#1e293b',
            border: '2px solid var(--accent-gold)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '12px 18px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: '#000',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
              }}
            >
              {undoPending.remainingSeconds}s
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Slayed: "{undoPending.title.slice(0, 24)}..."
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Holding in safety buffer before API dispatch
              </span>
            </div>
          </div>

          <button
            onClick={() => undoLastAction()}
            aria-label="Undo chore slaying"
            style={{
              backgroundColor: 'var(--accent-gold)',
              color: '#0f111a',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            <span>UNDO [Z]</span>
          </button>
        </div>
      )}

      {/* 2. VIP / Critical Item Protection Modal */}
      {vipConfirmationChore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vip-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '2px solid var(--accent-red)',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={28} color="var(--accent-red)" />
              <h3
                id="vip-modal-title"
                style={{
                  fontFamily: 'var(--font-retro)',
                  fontSize: '13px',
                  color: 'var(--accent-red)',
                  margin: 0,
                }}
              >
                VIP SAFETY WARD TRIGGERED
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              You are about to execute an action on a <strong>CRITICAL</strong> digital artifact:
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-gold)' }}>
                {vipConfirmationChore.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                From: {vipConfirmationChore.source}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Action: <code>{vipConfirmationChore.type}</code>
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertOctagon size={16} />
              <span>Safety Guardrail: This item requires explicit confirmation.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={cancelVipSlay}
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Protect Item [Esc]
              </button>
              <button
                onClick={confirmVipSlay}
                style={{
                  backgroundColor: 'var(--accent-red)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Slay [Enter]
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
