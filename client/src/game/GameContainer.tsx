import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { useChoreStore } from '../store/choreStore.js';

export const GameContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { playerStats } = useChoreStore();

  useEffect(() => {
    if (!containerRef.current) return;

    if (!gameRef.current) {
      const config = createGameConfig(containerRef.current);
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="canvas-viewport" role="region" aria-label="ChoreQuest 2D Dungeon Viewport">
      <div className="canvas-wrapper">
        <div ref={containerRef} />

        {/* Real-time Arcade HUD Overlay */}
        <div className="canvas-overlay-hud">
          <div>LVL {playerStats.level}</div>
          <div>XP {playerStats.xp}</div>
          <div>CLEARED: {playerStats.choresCleared}</div>
          {playerStats.comboCount > 1 && (
            <div style={{ color: '#ec4899', fontWeight: 'bold' }}>
              COMBO x{playerStats.comboCount}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
