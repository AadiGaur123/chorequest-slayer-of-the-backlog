import React from 'react';
import { useChoreStore } from '../store/choreStore.js';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SyncStatusToast: React.FC = () => {
  const { syncState, syncMessage } = useChoreStore();

  if (syncState === 'IDLE' || !syncMessage) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor:
          syncState === 'ERROR'
            ? 'rgba(239, 68, 68, 0.95)'
            : syncState === 'SYNCING'
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(16, 185, 129, 0.95)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '10px 16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: 600,
        zIndex: 1000,
      }}
    >
      {syncState === 'SYNCING' && <Loader2 size={16} className="animate-spin" />}
      {syncState === 'SUCCESS' && <CheckCircle2 size={16} />}
      {syncState === 'ERROR' && <AlertTriangle size={16} />}
      <span>{syncMessage}</span>
    </div>
  );
};
