import Phaser from 'phaser';

/**
 * BootScene: Procedurally generates retro pixel textures directly in memory
 * Zero network dependencies, zero asset 404s, works 100% offline
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.createDungeonTile();
    this.createDungeonWall();
    this.createHeroTexture();
    this.createSlimeTexture();
    this.createBansheeTexture();
    this.createMimicTexture();
    this.createSlashTexture();
    this.createWhirlwindTexture();
    this.createParticleTexture();
    this.createTorchTexture();

    this.scene.start('DungeonScene');
  }

  private createDungeonTile(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x131722);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, 0x1f2434);
    gfx.strokeRect(0, 0, 32, 32);
    // Subtle floor stones
    gfx.fillStyle(0x282f44);
    gfx.fillRect(6, 6, 4, 3);
    gfx.fillRect(18, 20, 5, 3);
    gfx.generateTexture('dungeon-tile', 32, 32);
    gfx.destroy();
  }

  private createDungeonWall(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x222738);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(2, 0x3d4663);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.fillStyle(0x4b5578);
    gfx.fillRect(4, 4, 10, 8);
    gfx.fillRect(18, 4, 10, 8);
    gfx.fillRect(10, 16, 12, 10);
    gfx.generateTexture('dungeon-wall', 32, 32);
    gfx.destroy();
  }

  private createHeroTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Hero Body (Blue Tunic)
    gfx.fillStyle(0x2563eb);
    gfx.fillCircle(16, 18, 10);
    // Golden Trim Belt
    gfx.fillStyle(0xf59e0b);
    gfx.fillRect(10, 18, 12, 3);
    // Blonde Hair & Face
    gfx.fillStyle(0xfde047);
    gfx.fillCircle(16, 10, 7);
    gfx.fillStyle(0xfce7f3);
    gfx.fillCircle(16, 12, 5);
    // Eyes
    gfx.fillStyle(0x0f172a);
    gfx.fillRect(14, 11, 2, 2);
    gfx.fillRect(18, 11, 2, 2);
    // Iron Shield
    gfx.fillStyle(0x94a3b8);
    gfx.fillRect(5, 14, 4, 9);
    gfx.lineStyle(1, 0xf59e0b);
    gfx.strokeRect(5, 14, 4, 9);

    gfx.generateTexture('hero', 32, 32);
    gfx.destroy();
  }

  private createSlimeTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Neon Green Acid Slime
    gfx.fillStyle(0x22c55e);
    gfx.fillCircle(16, 18, 12);
    gfx.fillStyle(0x16a34a);
    gfx.fillCircle(16, 21, 9);
    // Eyes
    gfx.fillStyle(0xffffff);
    gfx.fillRect(11, 14, 3, 3);
    gfx.fillRect(18, 14, 3, 3);
    gfx.fillStyle(0x052e16);
    gfx.fillRect(12, 15, 1, 1);
    gfx.fillRect(19, 15, 1, 1);

    gfx.generateTexture('enemy-slime', 32, 32);
    gfx.destroy();
  }

  private createBansheeTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Ethereal Violet Specter
    gfx.fillStyle(0xc084fc);
    gfx.fillCircle(16, 12, 9);
    gfx.fillStyle(0x9333ea);
    gfx.beginPath();
    gfx.moveTo(6, 16);
    gfx.lineTo(26, 16);
    gfx.lineTo(24, 28);
    gfx.lineTo(19, 23);
    gfx.lineTo(16, 28);
    gfx.lineTo(13, 23);
    gfx.lineTo(8, 28);
    gfx.closePath();
    gfx.fill();
    // Glowing Crimson Eyes
    gfx.fillStyle(0xf43f5e);
    gfx.fillRect(12, 11, 2, 4);
    gfx.fillRect(18, 11, 2, 4);

    gfx.generateTexture('enemy-banshee', 32, 32);
    gfx.destroy();
  }

  private createMimicTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Wood Chest
    gfx.fillStyle(0x92400e);
    gfx.fillRect(4, 9, 24, 17);
    // Gold Banding
    gfx.lineStyle(2, 0xfbbf24);
    gfx.strokeRect(4, 9, 24, 17);
    // Dollar Sign Tag
    gfx.fillStyle(0x22c55e);
    gfx.fillCircle(16, 14, 4);
    // Sharp Teeth
    gfx.fillStyle(0xffffff);
    gfx.fillRect(6, 16, 3, 4);
    gfx.fillRect(11, 16, 3, 4);
    gfx.fillRect(17, 16, 3, 4);
    gfx.fillRect(22, 16, 3, 4);

    gfx.generateTexture('enemy-mimic', 32, 32);
    gfx.destroy();
  }

  private createSlashTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.lineStyle(3, 0x38bdf8, 0.95);
    gfx.beginPath();
    gfx.arc(16, 16, 14, -Phaser.Math.DegToRad(60), Phaser.Math.DegToRad(60), false);
    gfx.strokePath();

    gfx.generateTexture('slash-arc', 32, 32);
    gfx.destroy();
  }

  private createWhirlwindTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.lineStyle(4, 0xfacc15, 0.85);
    gfx.strokeCircle(48, 48, 44);
    gfx.lineStyle(3, 0x38bdf8, 0.85);
    gfx.strokeCircle(48, 48, 30);
    gfx.generateTexture('whirlwind-circle', 96, 96);
    gfx.destroy();
  }

  private createParticleTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xfde047);
    gfx.fillRect(0, 0, 4, 4);
    gfx.generateTexture('particle-spark', 4, 4);
    gfx.destroy();
  }

  private createTorchTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x78350f);
    gfx.fillRect(6, 12, 4, 10);
    gfx.fillStyle(0xf97316);
    gfx.fillCircle(8, 8, 5);
    gfx.fillStyle(0xfef08a);
    gfx.fillCircle(8, 7, 3);
    gfx.generateTexture('torch', 16, 24);
    gfx.destroy();
  }
}
