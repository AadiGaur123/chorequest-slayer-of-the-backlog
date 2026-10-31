import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';

export const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: 760,
  height: 520,
  backgroundColor: '#0a0d14',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, DungeonScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
